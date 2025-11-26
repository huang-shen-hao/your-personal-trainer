import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { planRepository } from '@/db/repositories/planRepository'
import { generateTrainingPlan } from '@/utils/planGenerator'
import type { 
  TrainingPlan, 
  PlanGenerationConfig,
  TrainingDay 
} from '@/types/plan'

export const usePlanStore = defineStore('plan', () => {
  // State
  const plans = ref<TrainingPlan[]>([])
  const activePlan = ref<TrainingPlan | null>(null)
  const loading = ref(false)
  const currentUserId = ref<string>('')

  // Getters
  const hasActivePlan = computed(() => activePlan.value !== null)
  
  const completedPlans = computed(() => 
    plans.value.filter(p => p.isCompleted)
  )
  
  const activePlans = computed(() => 
    plans.value.filter(p => p.isActive && !p.isCompleted)
  )
  
  const archivedPlans = computed(() => 
    plans.value.filter(p => !p.isActive && !p.isCompleted)
  )

  // Actions
  
  /**
   * 加载用户的所有计划
   */
  async function loadPlans(userId: string) {
    loading.value = true
    currentUserId.value = userId
    try {
      plans.value = await planRepository.getAllPlans(userId)
      
      // 加载活跃计划
      const active = await planRepository.getActivePlan(userId)
      activePlan.value = active || null
    } catch (error) {
      console.error('加载训练计划失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 生成新计划
   */
  async function createPlan(config: PlanGenerationConfig): Promise<TrainingPlan> {
    try {
      const plan = generateTrainingPlan(config)
      await planRepository.addPlan(plan)
      
      // 重新加载计划列表
      await loadPlans(config.userId)
      
      return plan
    } catch (error) {
      console.error('创建训练计划失败:', error)
      throw error
    }
  }

  /**
   * 更新计划
   */
  async function updatePlan(id: string, updates: Partial<TrainingPlan>) {
    try {
      await planRepository.updatePlan(id, updates)
      
      // 更新本地状态
      const index = plans.value.findIndex(p => p.id === id)
      if (index !== -1) {
        plans.value[index] = { ...plans.value[index], ...updates }
      }
      
      if (activePlan.value?.id === id) {
        activePlan.value = { ...activePlan.value, ...updates }
      }
    } catch (error) {
      console.error('更新训练计划失败:', error)
      throw error
    }
  }

  /**
   * 删除计划
   */
  async function deletePlan(id: string) {
    try {
      await planRepository.deletePlan(id)
      plans.value = plans.value.filter(p => p.id !== id)
      
      if (activePlan.value?.id === id) {
        activePlan.value = null
      }
    } catch (error) {
      console.error('删除训练计划失败:', error)
      throw error
    }
  }

  /**
   * 设置活跃计划
   */
  async function setActivePlan(planId: string) {
    try {
      if (!currentUserId.value) {
        throw new Error('User ID not set')
      }
      
      await planRepository.setActivePlan(currentUserId.value, planId)
      await loadPlans(currentUserId.value)
    } catch (error) {
      console.error('设置活跃计划失败:', error)
      throw error
    }
  }

  /**
   * 完成计划
   */
  async function completePlan(planId: string) {
    try {
      await planRepository.completePlan(planId)
      
      // 更新本地状态
      const index = plans.value.findIndex(p => p.id === planId)
      if (index !== -1) {
        plans.value[index].isCompleted = true
        plans.value[index].isActive = false
        plans.value[index].endDate = new Date()
      }
      
      if (activePlan.value?.id === planId) {
        activePlan.value = null
      }
    } catch (error) {
      console.error('完成训练计划失败:', error)
      throw error
    }
  }

  /**
   * 复制计划
   */
  async function duplicatePlan(planId: string): Promise<string> {
    try {
      if (!currentUserId.value) {
        throw new Error('User ID not set')
      }
      
      const newPlanId = await planRepository.duplicatePlan(planId, currentUserId.value)
      await loadPlans(currentUserId.value)
      return newPlanId
    } catch (error) {
      console.error('复制训练计划失败:', error)
      throw error
    }
  }

  /**
   * 获取计划统计
   */
  async function getPlanStats(planId: string) {
    try {
      return await planRepository.getPlanStats(planId)
    } catch (error) {
      console.error('获取计划统计失败:', error)
      throw error
    }
  }

  /**
   * 获取今天的训练日
   */
  function getTodayTrainingDay(): TrainingDay | null {
    if (!activePlan.value) return null
    
    const today = new Date().getDay() // 0=周日，1=周一...
    const trainingDay = activePlan.value.trainingDays.find(
      day => day.dayOfWeek === today
    )
    
    return trainingDay || null
  }

  /**
   * 获取本周的训练日
   */
  function getWeekTrainingDays(): TrainingDay[] {
    if (!activePlan.value) return []
    
    return activePlan.value.trainingDays.sort((a, b) => a.dayOfWeek - b.dayOfWeek)
  }

  /**
   * 清空状态
   */
  function clearState() {
    plans.value = []
    activePlan.value = null
    currentUserId.value = ''
  }

  return {
    // State
    plans,
    activePlan,
    loading,
    
    // Getters
    hasActivePlan,
    completedPlans,
    activePlans,
    archivedPlans,
    
    // Actions
    loadPlans,
    createPlan,
    updatePlan,
    deletePlan,
    setActivePlan,
    completePlan,
    duplicatePlan,
    getPlanStats,
    getTodayTrainingDay,
    getWeekTrainingDays,
    clearState
  }
})
