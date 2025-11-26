import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { bodyMetricsRepository } from '@/db/repositories/bodyMetricsRepository'
import type { BodyMetric, MetricType } from '@/types/bodyMetrics'
import { useUserStore } from './user'

export const useBodyMetricsStore = defineStore('bodyMetrics', () => {
  const userStore = useUserStore()
  
  const metrics = ref<BodyMetric[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 按类型分组的指标
  const metricsByType = computed(() => {
    const grouped: Record<MetricType, BodyMetric[]> = {} as any
    metrics.value.forEach(metric => {
      if (!grouped[metric.type]) {
        grouped[metric.type] = []
      }
      grouped[metric.type].push(metric)
    })
    return grouped
  })

  // 最新的体重
  const latestWeight = computed(() => {
    const weightMetrics = metricsByType.value['weight'] || []
    return weightMetrics.length > 0 ? weightMetrics[0].value : null
  })

  // 最新的体脂率
  const latestBodyFat = computed(() => {
    const bodyfatMetrics = metricsByType.value['bodyfat'] || []
    return bodyfatMetrics.length > 0 ? bodyfatMetrics[0].value : null
  })

  /**
   * 加载所有体测数据
   */
  async function loadMetrics() {
    if (!userStore.profile?.id) {
      error.value = '用户未登录'
      return
    }

    loading.value = true
    error.value = null

    try {
      metrics.value = await bodyMetricsRepository.getAllMetrics(userStore.profile.id)
    } catch (err) {
      error.value = '加载体测数据失败'
      console.error('加载体测数据失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 加载特定类型的体测数据
   */
  async function loadMetricsByType(type: MetricType) {
    if (!userStore.profile?.id) {
      error.value = '用户未登录'
      return []
    }

    loading.value = true
    error.value = null

    try {
      const data = await bodyMetricsRepository.getMetricsByType(userStore.profile.id, type)
      // 更新 metrics 中对应类型的数据
      metrics.value = [
        ...metrics.value.filter(m => m.type !== type),
        ...data
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      return data
    } catch (err) {
      error.value = '加载体测数据失败'
      console.error('加载体测数据失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 保存新的体测数据
   */
  async function saveMetric(metric: Omit<BodyMetric, 'id' | 'userId' | 'createdAt'>) {
    if (!userStore.profile?.id) {
      error.value = '用户未登录'
      throw new Error('用户未登录')
    }

    loading.value = true
    error.value = null

    try {
      const id = await bodyMetricsRepository.saveMetric({
        ...metric,
        userId: userStore.profile.id
      })
      
      // 添加到本地状态
      const newMetric: BodyMetric = {
        id,
        userId: userStore.profile.id,
        ...metric,
        createdAt: new Date()
      }
      metrics.value = [newMetric, ...metrics.value]
      
      return id
    } catch (err) {
      error.value = '保存体测数据失败'
      console.error('保存体测数据失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 批量保存体测数据
   */
  async function saveMetrics(metricsData: Omit<BodyMetric, 'id' | 'userId' | 'createdAt'>[]) {
    if (!userStore.profile?.id) {
      error.value = '用户未登录'
      throw new Error('用户未登录')
    }

    loading.value = true
    error.value = null

    try {
      const ids = await bodyMetricsRepository.saveMetrics(
        metricsData.map(metric => ({
          ...metric,
          userId: userStore.profile!.id
        }))
      )
      
      // 重新加载所有数据
      await loadMetrics()
      
      return ids
    } catch (err) {
      error.value = '批量保存体测数据失败'
      console.error('批量保存体测数据失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新体测数据
   */
  async function updateMetric(id: string, updates: Partial<BodyMetric>) {
    loading.value = true
    error.value = null

    try {
      await bodyMetricsRepository.updateMetric(id, updates)
      
      // 更新本地状态
      const index = metrics.value.findIndex(m => m.id === id)
      if (index !== -1) {
        metrics.value[index] = {
          ...metrics.value[index],
          ...updates
        }
      }
    } catch (err) {
      error.value = '更新体测数据失败'
      console.error('更新体测数据失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除体测数据
   */
  async function deleteMetric(id: string) {
    loading.value = true
    error.value = null

    try {
      await bodyMetricsRepository.deleteMetric(id)
      
      // 从本地状态移除
      metrics.value = metrics.value.filter(m => m.id !== id)
    } catch (err) {
      error.value = '删除体测数据失败'
      console.error('删除体测数据失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取特定类型的统计信息
   */
  async function getMetricStats(type: MetricType, count: number = 10) {
    if (!userStore.profile?.id) {
      return null
    }

    try {
      return await bodyMetricsRepository.getMetricStats(userStore.profile.id, type, count)
    } catch (err) {
      console.error('获取统计信息失败:', err)
      return null
    }
  }

  /**
   * 清空所有体测数据
   */
  function clearMetrics() {
    metrics.value = []
    error.value = null
  }

  return {
    metrics,
    loading,
    error,
    metricsByType,
    latestWeight,
    latestBodyFat,
    loadMetrics,
    loadMetricsByType,
    saveMetric,
    saveMetrics,
    updateMetric,
    deleteMetric,
    getMetricStats,
    clearMetrics
  }
})

