import { db } from '@/db'
import type { TrainingPlan } from '@/types/plan'

export const planRepository = {
  /**
   * 获取用户的所有训练计划
   */
  async getAllPlans(userId: string): Promise<TrainingPlan[]> {
    return await db.plans
      .where('userId')
      .equals(userId)
      .reverse()
      .sortBy('createdAt') as TrainingPlan[]
  },

  /**
   * 获取用户的活跃计划
   */
  async getActivePlan(userId: string): Promise<TrainingPlan | undefined> {
    const plans = await db.plans
      .where('userId')
      .equals(userId)
      .and(plan => plan.isActive === true)
      .toArray()
    return plans[0] as TrainingPlan | undefined
  },

  /**
   * 根据ID获取计划
   */
  async getPlanById(id: string): Promise<TrainingPlan | undefined> {
    return await db.plans.get(id) as TrainingPlan | undefined
  },

  /**
   * 添加新计划
   */
  async addPlan(plan: TrainingPlan): Promise<string> {
    await db.plans.add(plan as any)
    return plan.id
  },

  /**
   * 更新计划
   */
  async updatePlan(id: string, updates: Partial<TrainingPlan>): Promise<number> {
    return await db.plans.update(id, {
      ...updates,
      updatedAt: new Date()
    } as any)
  },

  /**
   * 删除计划
   */
  async deletePlan(id: string): Promise<void> {
    await db.plans.delete(id)
  },

  /**
   * 设置活跃计划
   */
  async setActivePlan(userId: string, planId: string): Promise<void> {
    // 先取消所有活跃计划
    const allPlans = await this.getAllPlans(userId)
    for (const plan of allPlans) {
      if (plan.isActive) {
        await this.updatePlan(plan.id, { isActive: false })
      }
    }
    
    // 设置新的活跃计划
    await this.updatePlan(planId, { isActive: true, startDate: new Date() })
  },

  /**
   * 完成计划
   */
  async completePlan(id: string): Promise<void> {
    await this.updatePlan(id, { 
      isCompleted: true, 
      isActive: false,
      endDate: new Date()
    })
  },

  /**
   * 获取计划统计
   */
  async getPlanStats(planId: string): Promise<{
    totalWorkouts: number
    completedWorkouts: number
    completionRate: number
  }> {
    const plan = await this.getPlanById(planId)
    if (!plan) {
      return {
        totalWorkouts: 0,
        completedWorkouts: 0,
        completionRate: 0
      }
    }

    // 获取该计划的训练记录
    const workouts = await db.workouts
      .where('planId')
      .equals(planId)
      .toArray()

    const totalWorkouts = plan.trainingDays.length * (plan.weeks || 1)
    const completedWorkouts = workouts.length
    const completionRate = totalWorkouts > 0 ? (completedWorkouts / totalWorkouts) * 100 : 0

    return {
      totalWorkouts,
      completedWorkouts,
      completionRate: Math.round(completionRate)
    }
  },

  /**
   * 复制计划
   */
  async duplicatePlan(planId: string, userId: string): Promise<string> {
    const original = await this.getPlanById(planId)
    if (!original) {
      throw new Error('Plan not found')
    }

    const newPlan: TrainingPlan = {
      ...original,
      id: crypto.randomUUID(),
      userId,
      name: `${original.name} (副本)`,
      isActive: false,
      isCompleted: false,
      startDate: undefined,
      endDate: undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    await this.addPlan(newPlan)
    return newPlan.id
  }
}

