import { db } from '@/db'
import type { WorkoutLog, LoggedExercise, LoggedSet } from '@/stores/workout'

export interface WorkoutStats {
  totalWorkouts: number
  totalVolume: number // 总训练量 (Tonnage)
  totalDuration: number // 总时长（分钟）
  averageDuration: number // 平均时长
  averageRPE: number // 平均RPE
  completedExercises: number // 完成动作数
  prCount: number // PR记录数
}

export interface ExercisePR {
  exerciseId: string
  weight: number
  reps: number
  date: Date
  workoutId: string
}

export const workoutRepository = {
  /**
   * 添加训练记录
   */
  async addWorkout(workout: WorkoutLog): Promise<string> {
    const workoutData = {
      ...workout,
      id: workout.id || crypto.randomUUID(),
      date: workout.date instanceof Date ? workout.date : new Date(workout.date),
      startTime: workout.startTime instanceof Date ? workout.startTime : new Date(workout.startTime),
      endTime: workout.endTime ? (workout.endTime instanceof Date ? workout.endTime : new Date(workout.endTime)) : undefined,
      exercises: workout.exercises || []
    }
    
    await db.workouts.add(workoutData as any)
    return workoutData.id
  },

  /**
   * 根据ID获取训练记录
   */
  async getWorkoutById(id: string): Promise<WorkoutLog | undefined> {
    const workout = await db.workouts.get(id)
    if (!workout) return undefined
    
    return {
      ...workout,
      date: workout.date instanceof Date ? workout.date : new Date(workout.date),
      startTime: workout.startTime instanceof Date ? workout.startTime : new Date(workout.startTime),
      endTime: workout.endTime ? (workout.endTime instanceof Date ? workout.endTime : new Date(workout.endTime)) : undefined,
      exercises: workout.exercises || []
    } as WorkoutLog
  },

  /**
   * 更新训练记录
   */
  async updateWorkout(id: string, updates: Partial<WorkoutLog>): Promise<void> {
    const updateData: any = { ...updates }
    
    // 处理日期类型
    if (updates.date) {
      updateData.date = updates.date instanceof Date ? updates.date : new Date(updates.date)
    }
    if (updates.startTime) {
      updateData.startTime = updates.startTime instanceof Date ? updates.startTime : new Date(updates.startTime)
    }
    if (updates.endTime) {
      updateData.endTime = updates.endTime instanceof Date ? updates.endTime : new Date(updates.endTime)
    }
    
    await db.workouts.update(id, updateData)
  },

  /**
   * 删除训练记录
   */
  async deleteWorkout(id: string): Promise<void> {
    await db.workouts.delete(id)
  },

  /**
   * 获取用户的所有训练记录
   */
  async getWorkoutsByUserId(userId: string): Promise<WorkoutLog[]> {
    const workouts = await db.workouts
      .where('userId')
      .equals(userId)
      .reverse()
      .sortBy('date')
    
    return workouts.map(workout => ({
      ...workout,
      date: workout.date instanceof Date ? workout.date : new Date(workout.date),
      startTime: workout.startTime instanceof Date ? workout.startTime : new Date(workout.startTime),
      endTime: workout.endTime ? (workout.endTime instanceof Date ? workout.endTime : new Date(workout.endTime)) : undefined,
      exercises: workout.exercises || []
    })) as WorkoutLog[]
  },

  /**
   * 按日期范围查询训练记录
   */
  async getWorkoutsByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<WorkoutLog[]> {
    const workouts = await db.workouts
      .where('userId')
      .equals(userId)
      .filter(workout => {
        const workoutDate = workout.date instanceof Date ? workout.date : new Date(workout.date)
        return workoutDate >= startDate && workoutDate <= endDate
      })
      .reverse()
      .sortBy('date')
    
    return workouts.map(workout => ({
      ...workout,
      date: workout.date instanceof Date ? workout.date : new Date(workout.date),
      startTime: workout.startTime instanceof Date ? workout.startTime : new Date(workout.startTime),
      endTime: workout.endTime ? (workout.endTime instanceof Date ? workout.endTime : new Date(workout.endTime)) : undefined,
      exercises: workout.exercises || []
    })) as WorkoutLog[]
  },

  /**
   * 按计划ID查询训练记录
   */
  async getWorkoutsByPlanId(planId: string): Promise<WorkoutLog[]> {
    const workouts = await db.workouts
      .where('planId')
      .equals(planId)
      .reverse()
      .sortBy('date')
    
    return workouts.map(workout => ({
      ...workout,
      date: workout.date instanceof Date ? workout.date : new Date(workout.date),
      startTime: workout.startTime instanceof Date ? workout.startTime : new Date(workout.startTime),
      endTime: workout.endTime ? (workout.endTime instanceof Date ? workout.endTime : new Date(workout.endTime)) : undefined,
      exercises: workout.exercises || []
    })) as WorkoutLog[]
  },

  /**
   * 按训练日ID查询训练记录
   */
  async getWorkoutsBySessionId(sessionId: string): Promise<WorkoutLog[]> {
    const workouts = await db.workouts
      .where('sessionId')
      .equals(sessionId)
      .reverse()
      .sortBy('date')
    
    return workouts.map(workout => ({
      ...workout,
      date: workout.date instanceof Date ? workout.date : new Date(workout.date),
      startTime: workout.startTime instanceof Date ? workout.startTime : new Date(workout.startTime),
      endTime: workout.endTime ? (workout.endTime instanceof Date ? workout.endTime : new Date(workout.endTime)) : undefined,
      exercises: workout.exercises || []
    })) as WorkoutLog[]
  },

  /**
   * 获取动作历史记录
   */
  async getExerciseHistory(
    userId: string,
    exerciseId: string,
    limit: number = 10
  ): Promise<LoggedExercise[]> {
    const workouts = await this.getWorkoutsByUserId(userId)
    const history: LoggedExercise[] = []
    
    for (const workout of workouts) {
      const exercise = workout.exercises.find(e => e.exerciseId === exerciseId)
      if (exercise) {
        history.push(exercise)
        if (history.length >= limit) break
      }
    }
    
    return history
  },

  /**
   * 获取动作PR记录
   */
  async getExercisePR(
    userId: string,
    exerciseId: string
  ): Promise<ExercisePR | null> {
    const workouts = await this.getWorkoutsByUserId(userId)
    let pr: ExercisePR | null = null
    
    for (const workout of workouts) {
      const exercise = workout.exercises.find(e => e.exerciseId === exerciseId)
      if (exercise && exercise.sets) {
        for (const set of exercise.sets) {
          if (set.completed && set.weight && set.reps) {
            const volume = set.weight * set.reps
            const currentPRVolume = pr ? pr.weight * pr.reps : 0
            
            // 如果重量更大，或者重量相同但次数更多，则更新PR
            if (set.weight > (pr?.weight || 0) || 
                (set.weight === (pr?.weight || 0) && set.reps > (pr?.reps || 0))) {
              pr = {
                exerciseId,
                weight: set.weight,
                reps: set.reps,
                date: workout.date instanceof Date ? workout.date : new Date(workout.date),
                workoutId: workout.id
              }
            }
          }
        }
      }
    }
    
    return pr
  },

  /**
   * 获取训练统计
   */
  async getWorkoutStats(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<WorkoutStats> {
    const workouts = startDate && endDate
      ? await this.getWorkoutsByDateRange(userId, startDate, endDate)
      : await this.getWorkoutsByUserId(userId)
    
    let totalVolume = 0
    let totalDuration = 0
    let totalRPE = 0
    let rpeCount = 0
    let completedExercises = 0
    
    for (const workout of workouts) {
      // 计算总训练量 (Tonnage)
      for (const exercise of workout.exercises) {
        if (exercise.sets) {
          for (const set of exercise.sets) {
            if (set.completed && set.weight && set.reps) {
              totalVolume += set.weight * set.reps
            }
          }
        }
        if (exercise.overallRPE) {
          totalRPE += exercise.overallRPE
          rpeCount++
        }
        completedExercises++
      }
      
      // 计算时长
      if (workout.endTime && workout.startTime) {
        const start = workout.startTime instanceof Date ? workout.startTime : new Date(workout.startTime)
        const end = workout.endTime instanceof Date ? workout.endTime : new Date(workout.endTime)
        const duration = (end.getTime() - start.getTime()) / (1000 * 60) // 转换为分钟
        totalDuration += duration
      }
    }
    
    // 计算PR数量（简化版，实际应该更复杂）
    const prCount = 0 // TODO: 实现PR检测逻辑
    
    return {
      totalWorkouts: workouts.length,
      totalVolume: Math.round(totalVolume),
      totalDuration: Math.round(totalDuration),
      averageDuration: workouts.length > 0 ? Math.round(totalDuration / workouts.length) : 0,
      averageRPE: rpeCount > 0 ? Math.round((totalRPE / rpeCount) * 10) / 10 : 0,
      completedExercises,
      prCount
    }
  },

  /**
   * 获取最近一次训练记录
   */
  async getLastWorkout(userId: string): Promise<WorkoutLog | undefined> {
    const workouts = await this.getWorkoutsByUserId(userId)
    return workouts.length > 0 ? workouts[0] : undefined
  },

  /**
   * 获取本周训练记录
   */
  async getThisWeekWorkouts(userId: string): Promise<WorkoutLog[]> {
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    weekStart.setHours(0, 0, 0, 0)
    
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)
    
    return await this.getWorkoutsByDateRange(userId, weekStart, weekEnd)
  },

  /**
   * 获取未完成的训练记录
   */
  async getIncompleteWorkout(userId: string): Promise<WorkoutLog | undefined> {
    const workouts = await db.workouts
      .where('userId')
      .equals(userId)
      .filter(workout => {
        // 没有结束时间的训练
        return !workout.endTime
      })
      .reverse()
      .sortBy('startTime')
    
    if (workouts.length === 0) return undefined
    
    // 获取最近一条未完成的训练
    const workout = workouts[0]
    
    // 只恢复今天开始的训练（避免恢复很久以前的未完成训练）
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const workoutDate = workout.startTime instanceof Date 
      ? workout.startTime 
      : new Date(workout.startTime)
    const workoutStartDate = new Date(workoutDate)
    workoutStartDate.setHours(0, 0, 0, 0)
    
    // 如果是今天开始的，返回该记录
    if (workoutStartDate.getTime() === today.getTime()) {
      return {
        ...workout,
        date: workout.date instanceof Date ? workout.date : new Date(workout.date),
        startTime: workout.startTime instanceof Date ? workout.startTime : new Date(workout.startTime),
        endTime: workout.endTime ? (workout.endTime instanceof Date ? workout.endTime : new Date(workout.endTime)) : undefined,
        exercises: workout.exercises || []
      } as WorkoutLog
    }
    
    return undefined
  }
}

