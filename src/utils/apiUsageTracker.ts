/**
 * API 使用统计追踪器
 */

import { db } from '@/db'
import type { AIProvider } from '@/types/ai'
import { AI_PROVIDERS } from '@/types/ai'

/**
 * 记录 API 使用
 */
export async function trackAPIUsage(
  userId: string,
  provider: AIProvider,
  modelId: string,
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
): Promise<void> {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // 查找今天的统计记录
    const existingStat = await db.apiUsageStats
      .where('userId')
      .equals(userId)
      .and(stat => 
        stat.date.getTime() === today.getTime() && 
        stat.provider === provider && 
        stat.modelId === modelId
      )
      .first()

    // 计算费用
    const cost = calculateCost(provider, modelId, usage)

    if (existingStat) {
      // 更新现有记录
      await db.apiUsageStats.update(existingStat.id!, {
        requestCount: existingStat.requestCount + 1,
        totalTokens: existingStat.totalTokens + usage.totalTokens,
        promptTokens: existingStat.promptTokens + usage.promptTokens,
        completionTokens: existingStat.completionTokens + usage.completionTokens,
        estimatedCost: existingStat.estimatedCost + cost
      })
    } else {
      // 创建新记录
      await db.apiUsageStats.add({
        id: crypto.randomUUID(),
        userId,
        date: today,
        provider,
        modelId,
        requestCount: 1,
        totalTokens: usage.totalTokens,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        estimatedCost: cost
      } as any)
    }
  } catch (error) {
    console.error('Failed to track API usage:', error)
  }
}

/**
 * 计算费用（美元）
 */
export function calculateCost(
  provider: AIProvider,
  modelId: string,
  usage: {
    promptTokens: number
    completionTokens: number
  }
): number {
  const providerInfo = AI_PROVIDERS[provider]
  if (!providerInfo) return 0

  const model = providerInfo.models.find(m => m.id === modelId)
  if (!model) return 0

  const inputCost = (usage.promptTokens / 1000) * model.costPer1kTokens.input
  const outputCost = (usage.completionTokens / 1000) * model.costPer1kTokens.output

  return inputCost + outputCost
}

/**
 * 获取使用统计
 */
export async function getUsageStats(
  userId: string,
  days: number = 30
): Promise<{
  totalRequests: number
  totalTokens: number
  totalCost: number
  byProvider: Record<string, {
    requests: number
    tokens: number
    cost: number
  }>
  dailyStats: Array<{
    date: Date
    requests: number
    tokens: number
    cost: number
  }>
}> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  startDate.setHours(0, 0, 0, 0)

  const stats = await db.apiUsageStats
    .where('userId')
    .equals(userId)
    .filter(stat => stat.date >= startDate)
    .toArray()

  const result = {
    totalRequests: 0,
    totalTokens: 0,
    totalCost: 0,
    byProvider: {} as Record<string, { requests: number; tokens: number; cost: number }>,
    dailyStats: [] as Array<{ date: Date; requests: number; tokens: number; cost: number }>
  }

  // 按日期分组
  const dailyMap = new Map<string, { date: Date; requests: number; tokens: number; cost: number }>()

  for (const stat of stats) {
    // 累加总计
    result.totalRequests += stat.requestCount
    result.totalTokens += stat.totalTokens
    result.totalCost += stat.estimatedCost

    // 按提供商分组
    if (!result.byProvider[stat.provider]) {
      result.byProvider[stat.provider] = {
        requests: 0,
        tokens: 0,
        cost: 0
      }
    }
    result.byProvider[stat.provider].requests += stat.requestCount
    result.byProvider[stat.provider].tokens += stat.totalTokens
    result.byProvider[stat.provider].cost += stat.estimatedCost

    // 按日期分组
    const dateKey = stat.date.toISOString().split('T')[0]
    if (!dailyMap.has(dateKey)) {
      dailyMap.set(dateKey, {
        date: stat.date,
        requests: 0,
        tokens: 0,
        cost: 0
      })
    }
    const daily = dailyMap.get(dateKey)!
    daily.requests += stat.requestCount
    daily.tokens += stat.totalTokens
    daily.cost += stat.estimatedCost
  }

  result.dailyStats = Array.from(dailyMap.values()).sort((a, b) => 
    a.date.getTime() - b.date.getTime()
  )

  return result
}

/**
 * 获取今日使用量
 */
export async function getTodayUsage(userId: string): Promise<{
  requests: number
  tokens: number
  cost: number
}> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const stats = await db.apiUsageStats
    .where('userId')
    .equals(userId)
    .and(stat => stat.date.getTime() === today.getTime())
    .toArray()

  return stats.reduce((acc, stat) => ({
    requests: acc.requests + stat.requestCount,
    tokens: acc.tokens + stat.totalTokens,
    cost: acc.cost + stat.estimatedCost
  }), { requests: 0, tokens: 0, cost: 0 })
}

/**
 * 格式化费用（美元转人民币）
 */
export function formatCost(usd: number, rate: number = 7.2): string {
  const cny = usd * rate
  if (cny < 0.01) {
    return '< ¥0.01'
  }
  return `¥${cny.toFixed(2)}`
}

