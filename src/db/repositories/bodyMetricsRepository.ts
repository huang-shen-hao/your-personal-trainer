import { db } from '@/db'
import type { BodyMetric, MetricType } from '@/types/bodyMetrics'

export const bodyMetricsRepository = {
  /**
   * 获取用户所有体测数据
   */
  async getAllMetrics(userId: string): Promise<BodyMetric[]> {
    return (await db.bodyMetrics
      .where('userId')
      .equals(userId)
      .reverse()
      .sortBy('date')) as BodyMetric[]
  },

  /**
   * 获取特定类型的体测数据
   */
  async getMetricsByType(userId: string, type: MetricType): Promise<BodyMetric[]> {
    return (await db.bodyMetrics
      .where('userId')
      .equals(userId)
      .and(metric => metric.type === type)
      .reverse()
      .sortBy('date')) as BodyMetric[]
  },

  /**
   * 获取最近的体测数据
   */
  async getLatestMetric(userId: string, type: MetricType): Promise<BodyMetric | undefined> {
    const metrics = await db.bodyMetrics
      .where('userId')
      .equals(userId)
      .and(metric => metric.type === type)
      .reverse()
      .sortBy('date')
    return metrics[0] as BodyMetric | undefined
  },

  /**
   * 获取时间范围内的体测数据
   */
  async getMetricsInRange(
    userId: string,
    type: MetricType,
    startDate: Date,
    endDate: Date
  ): Promise<BodyMetric[]> {
    return (await db.bodyMetrics
      .where('userId')
      .equals(userId)
      .and(metric => metric.type === type)
      .filter(metric => {
        const date = new Date(metric.date)
        return date >= startDate && date <= endDate
      })
      .reverse()
      .sortBy('date')) as BodyMetric[]
  },

  /**
   * 保存新的体测数据
   */
  async saveMetric(metric: Omit<BodyMetric, 'id' | 'createdAt'>): Promise<string> {
    const newMetric: BodyMetric = {
      ...metric,
      id: crypto.randomUUID(),
      createdAt: new Date()
    }
    await db.bodyMetrics.add(newMetric as any)
    return newMetric.id
  },

  /**
   * 批量保存体测数据
   */
  async saveMetrics(metrics: Omit<BodyMetric, 'id' | 'createdAt'>[]): Promise<string[]> {
    const newMetrics: BodyMetric[] = metrics.map(metric => ({
      ...metric,
      id: crypto.randomUUID(),
      createdAt: new Date()
    }))
    await db.bodyMetrics.bulkAdd(newMetrics as any[])
    return newMetrics.map(m => m.id)
  },

  /**
   * 更新体测数据
   */
  async updateMetric(id: string, updates: Partial<BodyMetric>): Promise<number> {
    return db.bodyMetrics.update(id, updates as any)
  },

  /**
   * 删除体测数据
   */
  async deleteMetric(id: string): Promise<void> {
    await db.bodyMetrics.delete(id)
  },

  /**
   * 获取最近N条数据的统计信息
   */
  async getMetricStats(userId: string, type: MetricType, count: number = 10) {
    const metrics = await this.getMetricsByType(userId, type)
    const recentMetrics = metrics.slice(0, count)

    if (recentMetrics.length === 0) {
      return null
    }

    const values = recentMetrics.map(m => m.value)
    const average = values.reduce((sum, val) => sum + val, 0) / values.length
    const max = Math.max(...values)
    const min = Math.min(...values)
    const latest = recentMetrics[0]
    const oldest = recentMetrics[recentMetrics.length - 1]
    const change = latest.value - oldest.value

    return {
      average,
      max,
      min,
      latest: latest.value,
      change,
      changePercent: (change / oldest.value) * 100,
      count: recentMetrics.length
    }
  }
}

