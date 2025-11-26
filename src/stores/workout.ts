import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { workoutRepository } from '@/db/repositories/workoutRepository'
import type { WorkoutStats, ExercisePR } from '@/db/repositories/workoutRepository'

export interface LoggedSet {
  setNumber: number
  weight?: number // kg
  reps: number
  rpe?: number // 1-10
  completed: boolean
}

export interface LoggedExercise {
  id: string
  exerciseId: string
  sets: LoggedSet[]
  overallRPE?: number // 1-10
  quality?: 'perfect' | 'good' | 'struggled'
  issues?: ('pain' | 'discomfort' | 'early_failure')[]
  notes?: string
}

export interface WorkoutLog {
  id: string
  userId: string
  planId?: string
  sessionId?: string // 关联计划中的 session
  date: Date
  startTime: Date
  endTime?: Date
  exercises: LoggedExercise[]
  overallFatigue?: number // 1-5
  sleepQuality?: number // 1-5
  nutritionStatus?: 'good' | 'average' | 'poor'
  notes?: string
}

export const useWorkoutStore = defineStore('workout', () => {
  const currentWorkout = ref<WorkoutLog | null>(null)
  const workoutHistory = ref<WorkoutLog[]>([])
  const isWorkoutInProgress = ref(false)
  const loading = ref(false)

  const totalWorkoutsThisWeek = computed(() => {
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    weekStart.setHours(0, 0, 0, 0)

    return workoutHistory.value.filter(w => {
      const workoutDate = w.date instanceof Date ? w.date : new Date(w.date)
      return workoutDate >= weekStart
    }).length
  })

  const lastWorkout = computed(() => {
    if (workoutHistory.value.length === 0) return null
    return workoutHistory.value[0] // 已按日期倒序排列
  })

  const currentWorkoutProgress = computed(() => {
    if (!currentWorkout.value) return { completed: 0, total: 0, percentage: 0 }
    
    const total = currentWorkout.value.exercises.length
    const completed = currentWorkout.value.exercises.filter(ex => {
      // 如果所有组都完成了，则认为动作完成
      return ex.sets.length > 0 && ex.sets.every(set => set.completed)
    }).length
    
    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    }
  })

  /**
   * 加载用户的所有训练记录
   */
  async function loadWorkoutHistory(userId: string) {
    loading.value = true
    try {
      workoutHistory.value = await workoutRepository.getWorkoutsByUserId(userId)
    } catch (error) {
      console.error('加载训练记录失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 开始训练
   */
  function startWorkout(userId: string, sessionId?: string, planId?: string) {
    currentWorkout.value = {
      id: crypto.randomUUID(),
      userId,
      planId,
      sessionId,
      date: new Date(),
      startTime: new Date(),
      exercises: []
    }
    isWorkoutInProgress.value = true
  }

  /**
   * 保存已完成的训练
   */
  async function saveCompletedWorkout(workout: WorkoutLog) {
    loading.value = true
    try {
      // 保存到数据库
      await workoutRepository.addWorkout(workout)
      
      // 更新本地历史记录
      workoutHistory.value.unshift(workout)
      
      return workout
    } catch (error) {
      console.error('保存训练记录失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取训练记录
   */
  async function getWorkoutById(id: string): Promise<WorkoutLog | undefined> {
    return await workoutRepository.getWorkoutById(id)
  }

  /**
   * 按日期范围查询训练记录
   */
  async function getWorkoutsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<WorkoutLog[]> {
    return await workoutRepository.getWorkoutsByDateRange(userId, startDate, endDate)
  }

  /**
   * 获取动作历史记录
   */
  async function getExerciseHistory(userId: string, exerciseId: string, limit: number = 10): Promise<LoggedExercise[]> {
    return await workoutRepository.getExerciseHistory(userId, exerciseId, limit)
  }

  /**
   * 获取动作PR记录
   */
  async function getExercisePR(userId: string, exerciseId: string): Promise<ExercisePR | null> {
    return await workoutRepository.getExercisePR(userId, exerciseId)
  }

  /**
   * 获取训练统计
   */
  async function getWorkoutStats(userId: string, startDate?: Date, endDate?: Date): Promise<WorkoutStats> {
    return await workoutRepository.getWorkoutStats(userId, startDate, endDate)
  }

  /**
   * 计算当前训练的统计信息
   */
  function calculateCurrentWorkoutStats() {
    if (!currentWorkout.value) {
      return {
        totalVolume: 0,
        totalSets: 0,
        totalReps: 0,
        averageRPE: 0
      }
    }

    let totalVolume = 0
    let totalSets = 0
    let totalReps = 0
    let totalRPE = 0
    let rpeCount = 0

    for (const exercise of currentWorkout.value.exercises) {
      for (const set of exercise.sets) {
        if (set.completed) {
          totalSets++
          totalReps += set.reps
          if (set.weight) {
            totalVolume += set.weight * set.reps
          }
          if (set.rpe) {
            totalRPE += set.rpe
            rpeCount++
          }
        }
      }
      if (exercise.overallRPE) {
        totalRPE += exercise.overallRPE
        rpeCount++
      }
    }

    return {
      totalVolume: Math.round(totalVolume),
      totalSets,
      totalReps,
      averageRPE: rpeCount > 0 ? Math.round((totalRPE / rpeCount) * 10) / 10 : 0
    }
  }

  /**
   * 检测PR记录
   */
  function detectPRs(workout: WorkoutLog): Array<{ exerciseId: string; weight: number; reps: number }> {
    const prs: Array<{ exerciseId: string; weight: number; reps: number }> = []
    
    // 简化版PR检测，实际应该与历史数据对比
    for (const exercise of workout.exercises) {
      for (const set of exercise.sets) {
        if (set.completed && set.weight && set.reps) {
          // 这里应该与历史PR对比，暂时只记录当前训练中的最大值
          const existingPR = prs.find(pr => pr.exerciseId === exercise.exerciseId)
          if (!existingPR || set.weight > existingPR.weight || 
              (set.weight === existingPR.weight && set.reps > existingPR.reps)) {
            const index = prs.findIndex(pr => pr.exerciseId === exercise.exerciseId)
            if (index >= 0) {
              prs[index] = { exerciseId: exercise.exerciseId, weight: set.weight, reps: set.reps }
            } else {
              prs.push({ exerciseId: exercise.exerciseId, weight: set.weight, reps: set.reps })
            }
          }
        }
      }
    }
    
    return prs
  }

  /**
   * 获取本周训练记录
   */
  async function getThisWeekWorkouts(userId: string): Promise<WorkoutLog[]> {
    return await workoutRepository.getThisWeekWorkouts(userId)
  }

  /**
   * 恢复未完成的训练
   */
  async function restoreIncompleteWorkout(userId: string): Promise<boolean> {
    try {
      const incompleteWorkout = await workoutRepository.getIncompleteWorkout(userId)
      
      if (incompleteWorkout) {
        currentWorkout.value = incompleteWorkout
        isWorkoutInProgress.value = true
        return true
      }
      
      return false
    } catch (error) {
      console.error('恢复未完成训练失败:', error)
      return false
    }
  }

  /**
   * 清空状态
   */
  function clearState() {
    currentWorkout.value = null
    workoutHistory.value = []
    isWorkoutInProgress.value = false
  }

  return {
    // State
    currentWorkout,
    workoutHistory,
    isWorkoutInProgress,
    loading,
    
    // Getters
    totalWorkoutsThisWeek,
    lastWorkout,
    currentWorkoutProgress,
    
    // Actions
    loadWorkoutHistory,
    startWorkout,
    saveCompletedWorkout,
    getWorkoutById,
    getWorkoutsByDateRange,
    getExerciseHistory,
    getExercisePR,
    getWorkoutStats,
    calculateCurrentWorkoutStats,
    detectPRs,
    getThisWeekWorkouts,
    restoreIncompleteWorkout,
    clearState
  }
})

