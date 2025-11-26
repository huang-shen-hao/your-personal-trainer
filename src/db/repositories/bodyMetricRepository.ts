import { db } from '@/db'
import type { BodyMetric } from '@/types/user'

export const bodyMetricRepository = {
  /**
   * 获取用户的所有体测数据，按日期降序排列
   */
  async getAllMetrics(): Promise<BodyMetric[]> {
    const metrics = await db.bodyMetrics
      .orderBy('date')
      .reverse()
      .toArray()
    // 确保日期字段是 Date 对象
    return metrics.map(metric => ({
      ...metric,
      date: metric.date instanceof Date ? metric.date : new Date(metric.date),
      createdAt: metric.createdAt ? (metric.createdAt instanceof Date ? metric.createdAt : new Date(metric.createdAt)) : undefined
    })) as BodyMetric[]
  },

  /**
   * 根据日期范围获取体测数据
   */
  async getMetricsByDateRange(startDate: Date, endDate: Date): Promise<BodyMetric[]> {
    const metrics = await db.bodyMetrics
      .where('date')
      .between(startDate, endDate, true, true)
      .reverse()
      .toArray()
    // 确保日期字段是 Date 对象
    return metrics.map(metric => ({
      ...metric,
      date: metric.date instanceof Date ? metric.date : new Date(metric.date),
      createdAt: metric.createdAt ? (metric.createdAt instanceof Date ? metric.createdAt : new Date(metric.createdAt)) : undefined
    })) as BodyMetric[]
  },

  /**
   * 获取最近的N条体测数据
   */
  async getRecentMetrics(limit: number): Promise<BodyMetric[]> {
    const metrics = await db.bodyMetrics
      .orderBy('date')
      .reverse()
      .limit(limit)
      .toArray()
    // 确保日期字段是 Date 对象
    return metrics.map(metric => ({
      ...metric,
      date: metric.date instanceof Date ? metric.date : new Date(metric.date),
      createdAt: metric.createdAt ? (metric.createdAt instanceof Date ? metric.createdAt : new Date(metric.createdAt)) : undefined
    })) as BodyMetric[]
  },

  /**
   * 根据ID获取体测数据
   */
  async getMetricById(id: string): Promise<BodyMetric | undefined> {
    const metric = await db.bodyMetrics.where('id').equals(id).first()
    if (!metric) return undefined
    // 确保日期字段是 Date 对象
    return {
      ...metric,
      date: metric.date instanceof Date ? metric.date : new Date(metric.date),
      createdAt: metric.createdAt ? (metric.createdAt instanceof Date ? metric.createdAt : new Date(metric.createdAt)) : undefined
    } as BodyMetric
  },

  /**
   * 添加新的体测数据
   */
  async addMetric(metric: Omit<BodyMetric, 'id'>): Promise<string> {
    const id = crypto.randomUUID()
    const now = new Date()
    const newMetric: BodyMetric = {
      ...metric,
      id,
      createdAt: metric.createdAt || now,
      date: metric.date instanceof Date ? metric.date : new Date(metric.date)
    }
    await db.bodyMetrics.add(newMetric as any)
    return id
  },

  /**
   * 更新体测数据
   */
  async updateMetric(id: string, updates: Partial<BodyMetric>): Promise<number> {
    const updateData: any = { ...updates }
    // 确保日期字段是 Date 对象
    if (updateData.date) {
      updateData.date = updateData.date instanceof Date ? updateData.date : new Date(updateData.date)
    }
    if (updateData.createdAt) {
      updateData.createdAt = updateData.createdAt instanceof Date ? updateData.createdAt : new Date(updateData.createdAt)
    }
    return await db.bodyMetrics.where('id').equals(id).modify(updateData)
  },

  /**
   * 删除体测数据
   */
  async deleteMetric(id: string): Promise<void> {
    await db.bodyMetrics.where('id').equals(id).delete()
  },

  /**
   * 获取最新的体重记录
   */
  async getLatestWeight(): Promise<number | undefined> {
    const latest = await db.bodyMetrics
      .orderBy('date')
      .reverse()
      .first()
    return latest?.weight
  },

  /**
   * 获取体重变化趋势（最近N天）
   */
  async getWeightTrend(days: number): Promise<{ date: Date; weight: number }[]> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const metrics = await this.getMetricsByDateRange(startDate, new Date())
    return metrics
      .map(m => ({ date: m.date, weight: m.weight }))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
  }
}

