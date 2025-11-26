import type { WorkoutLog, LoggedExercise } from '@/stores/workout'
import type { ExercisePR, WorkoutStats } from '@/db/repositories/workoutRepository'
import { workoutRepository } from '@/db/repositories/workoutRepository'

export interface ReportData {
  period: {
    start: Date
    end: Date
    type: 'weekly' | 'monthly'
  }
  stats: WorkoutStats
  prs: ExercisePR[]
  workouts: WorkoutLog[]
  comparison?: {
    previousStats: WorkoutStats
    volumeChange: number // 百分比变化
    frequencyChange: number // 训练次数变化
    durationChange: number // 平均时长变化
  }
}

/**
 * 获取指定日期所在周的起始和结束日期
 */
function getWeekRange(date: Date): { start: Date; end: Date } {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // 周一作为周的开始
  
  const start = new Date(d.setDate(diff))
  start.setHours(0, 0, 0, 0)
  
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  
  return { start, end }
}

/**
 * 获取指定日期所在月的起始和结束日期
 */
function getMonthRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1)
  start.setHours(0, 0, 0, 0)
  
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  end.setHours(23, 59, 59, 999)
  
  return { start, end }
}

/**
 * 检测训练记录中的 PR
 */
function detectPRs(workouts: WorkoutLog[]): ExercisePR[] {
  const prMap = new Map<string, ExercisePR>()
  
  for (const workout of workouts) {
    for (const exercise of workout.exercises) {
      for (const set of exercise.sets) {
        if (set.completed && set.weight && set.reps) {
          const existingPR = prMap.get(exercise.exerciseId)
          
          // 判断是否为新的 PR
          if (!existingPR || 
              set.weight > existingPR.weight || 
              (set.weight === existingPR.weight && set.reps > existingPR.reps)) {
            prMap.set(exercise.exerciseId, {
              exerciseId: exercise.exerciseId,
              weight: set.weight,
              reps: set.reps,
              date: workout.date instanceof Date ? workout.date : new Date(workout.date),
              workoutId: workout.id
            })
          }
        }
      }
    }
  }
  
  return Array.from(prMap.values())
}

/**
 * 计算与上一周期的对比数据
 */
async function calculateComparison(
  userId: string,
  currentStats: WorkoutStats,
  currentStart: Date,
  currentEnd: Date,
  type: 'weekly' | 'monthly'
): Promise<ReportData['comparison']> {
  let previousStart: Date
  let previousEnd: Date
  
  if (type === 'weekly') {
    // 上一周
    const prevWeekStart = new Date(currentStart)
    prevWeekStart.setDate(prevWeekStart.getDate() - 7)
    const prevWeekEnd = new Date(prevWeekStart)
    prevWeekEnd.setDate(prevWeekStart.getDate() + 6)
    prevWeekEnd.setHours(23, 59, 59, 999)
    previousStart = prevWeekStart
    previousEnd = prevWeekEnd
  } else {
    // 上一月
    const prevMonthStart = new Date(currentStart.getFullYear(), currentStart.getMonth() - 1, 1)
    prevMonthStart.setHours(0, 0, 0, 0)
    const prevMonthEnd = new Date(currentStart.getFullYear(), currentStart.getMonth(), 0)
    prevMonthEnd.setHours(23, 59, 59, 999)
    previousStart = prevMonthStart
    previousEnd = prevMonthEnd
  }
  
  const previousStats = await workoutRepository.getWorkoutStats(userId, previousStart, previousEnd)
  
  const volumeChange = previousStats.totalVolume > 0
    ? ((currentStats.totalVolume - previousStats.totalVolume) / previousStats.totalVolume) * 100
    : currentStats.totalVolume > 0 ? 100 : 0
  
  const frequencyChange = currentStats.totalWorkouts - previousStats.totalWorkouts
  
  const durationChange = previousStats.averageDuration > 0
    ? ((currentStats.averageDuration - previousStats.averageDuration) / previousStats.averageDuration) * 100
    : currentStats.averageDuration > 0 ? 100 : 0
  
  return {
    previousStats,
    volumeChange: Math.round(volumeChange * 10) / 10,
    frequencyChange,
    durationChange: Math.round(durationChange * 10) / 10
  }
}

/**
 * 生成周报
 */
export async function generateWeeklyReport(
  userId: string,
  weekDate?: Date
): Promise<ReportData> {
  const targetDate = weekDate || new Date()
  const { start, end } = getWeekRange(targetDate)
  
  // 获取本周训练记录
  const workouts = await workoutRepository.getWorkoutsByDateRange(userId, start, end)
  
  // 获取统计信息
  const stats = await workoutRepository.getWorkoutStats(userId, start, end)
  
  // 检测 PR
  const prs = detectPRs(workouts)
  
  // 计算对比数据
  const comparison = await calculateComparison(userId, stats, start, end, 'weekly')
  
  return {
    period: {
      start,
      end,
      type: 'weekly'
    },
    stats,
    prs,
    workouts,
    comparison
  }
}

/**
 * 生成月报
 */
export async function generateMonthlyReport(
  userId: string,
  monthDate?: Date
): Promise<ReportData> {
  const targetDate = monthDate || new Date()
  const { start, end } = getMonthRange(targetDate)
  
  // 获取本月训练记录
  const workouts = await workoutRepository.getWorkoutsByDateRange(userId, start, end)
  
  // 获取统计信息
  const stats = await workoutRepository.getWorkoutStats(userId, start, end)
  
  // 检测 PR
  const prs = detectPRs(workouts)
  
  // 计算对比数据
  const comparison = await calculateComparison(userId, stats, start, end, 'monthly')
  
  return {
    period: {
      start,
      end,
      type: 'monthly'
    },
    stats,
    prs,
    workouts,
    comparison
  }
}

/**
 * 格式化日期范围显示
 */
export function formatPeriodRange(period: ReportData['period']): string {
  const startStr = period.start.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric'
  })
  const endStr = period.end.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric'
  })
  
  if (period.type === 'weekly') {
    return `${startStr} - ${endStr}`
  } else {
    return period.start.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long'
    })
  }
}

