/**
 * AI 配置仓库
 * 管理 AI 配置、对话会话、System Prompt 等数据
 */

import { db } from '@/db'
import type {
  AIConfig,
  ChatSessionDB as ChatSession,
  ChatMessage,
  PromptTemplate,
  APIUsageStats
} from '@/db'

/**
 * AI 配置仓库
 */
export const aiConfigRepository = {
  /**
   * 保存 AI 配置
   */
  async saveConfig(config: Omit<AIConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = new Date()
    const id = await db.aiConfigs.add({
      ...config,
      createdAt: now,
      updatedAt: now
    } as AIConfig)
    return id as string
  },

  /**
   * 更新 AI 配置
   */
  async updateConfig(id: string, updates: Partial<AIConfig>): Promise<void> {
    await db.aiConfigs.update(id, {
      ...updates,
      updatedAt: new Date()
    })
  },

  /**
   * 获取配置by ID
   */
  async getConfigById(id: string): Promise<AIConfig | undefined> {
    return db.aiConfigs.get(id)
  },

  /**
   * 获取用户的所有配置
   */
  async getUserConfigs(userId: string): Promise<AIConfig[]> {
    return db.aiConfigs.where('userId').equals(userId).toArray()
  },

  /**
   * 获取默认配置
   */
  async getDefaultConfig(userId: string): Promise<AIConfig | undefined> {
    const configs = await db.aiConfigs
      .where('userId')
      .equals(userId)
      .and(config => config.isDefault === true)
      .toArray()
    return configs[0]
  },

  /**
   * 设置默认配置
   */
  async setDefaultConfig(userId: string, configId: string): Promise<void> {
    // 先取消所有默认
    const configs = await this.getUserConfigs(userId)
    for (const config of configs) {
      if (config.id) {
        await db.aiConfigs.update(config.id, { isDefault: false })
      }
    }
    
    // 设置新默认
    await db.aiConfigs.update(configId, { isDefault: true })
  },

  /**
   * 删除配置
   */
  async deleteConfig(id: string): Promise<void> {
    await db.aiConfigs.delete(id)
  }
}

/**
 * 对话会话仓库
 */
export const chatSessionRepository = {
  /**
   * 创建新会话
   */
  async createSession(
    userId: string,
    title: string,
    modelId: string,
    provider: any
  ): Promise<string> {
    const now = new Date()
    const sessionId = crypto.randomUUID()
    await db.chatSessions.add({
      id: sessionId,
      userId,
      title,
      messages: [],
      modelId,
      provider,
      createdAt: now,
      updatedAt: now,
      tokens: 0,
      lastMessageAt: now
    })
    return sessionId
  },

  /**
   * 获取会话
   */
  async getSession(id: string): Promise<ChatSession | undefined> {
    return db.chatSessions.get(id)
  },

  /**
   * 获取用户所有会话
   */
  async getUserSessions(userId: string): Promise<ChatSession[]> {
    return db.chatSessions
      .where('userId')
      .equals(userId)
      .reverse()
      .sortBy('lastMessageAt')
  },

  /**
   * 更新会话
   */
  async updateSession(id: string, updates: Partial<ChatSession>): Promise<void> {
    await db.chatSessions.update(id, {
      ...updates,
      updatedAt: new Date()
    })
  },

  /**
   * 添加消息到会话
   */
  async addMessage(sessionId: string, message: ChatMessage): Promise<void> {
    const session = await this.getSession(sessionId)
    if (!session) return

    const messages = [...session.messages, message]
    const tokens = session.tokens + (message.metadata?.tokensUsed || 0)

    await db.chatSessions.update(sessionId, {
      messages,
      tokens,
      lastMessageAt: message.timestamp,
      updatedAt: new Date()
    })
  },

  /**
   * 更新会话标题
   */
  async updateTitle(sessionId: string, title: string): Promise<void> {
    await db.chatSessions.update(sessionId, { title })
  },

  /**
   * 删除会话
   */
  async deleteSession(id: string): Promise<void> {
    await db.chatSessions.delete(id)
  },

  /**
   * 清空会话消息
   */
  async clearMessages(sessionId: string): Promise<void> {
    await db.chatSessions.update(sessionId, {
      messages: [],
      tokens: 0,
      updatedAt: new Date()
    })
  }
}

/**
 * System Prompt 模板仓库
 */
export const promptTemplateRepository = {
  /**
   * 保存模板
   */
  async saveTemplate(template: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = new Date()
    const templateId = crypto.randomUUID()
    await db.promptTemplates.add({
      id: templateId,
      ...template,
      createdAt: now,
      updatedAt: now
    })
    return templateId
  },

  /**
   * 获取模板
   */
  async getTemplate(id: string): Promise<PromptTemplate | undefined> {
    return db.promptTemplates.get(id)
  },

  /**
   * 根据类型获取模板
   */
  async getTemplatesByType(type: string): Promise<PromptTemplate[]> {
    return db.promptTemplates.where('type').equals(type).toArray()
  },

  /**
   * 获取所有模板
   */
  async getAllTemplates(): Promise<PromptTemplate[]> {
    return db.promptTemplates.toArray()
  },

  /**
   * 更新模板
   */
  async updateTemplate(id: string, updates: Partial<PromptTemplate>): Promise<void> {
    await db.promptTemplates.update(id, {
      ...updates,
      updatedAt: new Date()
    })
  },

  /**
   * 删除模板
   */
  async deleteTemplate(id: string): Promise<void> {
    await db.promptTemplates.delete(id)
  }
}

/**
 * API 使用统计仓库
 */
export const apiUsageRepository = {
  /**
   * 记录使用统计
   */
  async recordUsage(stats: Omit<APIUsageStats, 'id'>): Promise<string> {
    const statsId = crypto.randomUUID()
    await db.apiUsageStats.add({
      id: statsId,
      ...stats
    })
    return statsId
  },

  /**
   * 获取用户的使用统计
   */
  async getUserStats(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<APIUsageStats[]> {
    let query = db.apiUsageStats.where('userId').equals(userId)
    
    if (startDate && endDate) {
      return query.filter(stat => {
        return stat.date >= startDate && stat.date <= endDate
      }).toArray()
    }
    
    return query.toArray()
  },

  /**
   * 获取今日使用统计
   */
  async getTodayStats(userId: string): Promise<APIUsageStats[]> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return db.apiUsageStats
      .where('userId')
      .equals(userId)
      .filter(stat => stat.date >= today && stat.date < tomorrow)
      .toArray()
  },

  /**
   * 计算总费用
   */
  async calculateTotalCost(userId: string, days: number = 30): Promise<number> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const stats = await this.getUserStats(userId, startDate)
    return stats.reduce((total, stat) => total + stat.estimatedCost, 0)
  },

  /**
   * 获取使用量汇总
   */
  async getUsageSummary(userId: string, days: number = 30): Promise<{
    totalRequests: number
    totalTokens: number
    totalCost: number
    byProvider: Record<string, { requests: number; tokens: number; cost: number }>
  }> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const stats = await this.getUserStats(userId, startDate)
    
    const summary = {
      totalRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      byProvider: {} as Record<string, { requests: number; tokens: number; cost: number }>
    }

    for (const stat of stats) {
      summary.totalRequests += stat.requestCount
      summary.totalTokens += stat.totalTokens
      summary.totalCost += stat.estimatedCost

      if (!summary.byProvider[stat.provider]) {
        summary.byProvider[stat.provider] = {
          requests: 0,
          tokens: 0,
          cost: 0
        }
      }

      summary.byProvider[stat.provider].requests += stat.requestCount
      summary.byProvider[stat.provider].tokens += stat.totalTokens
      summary.byProvider[stat.provider].cost += stat.estimatedCost
    }

    return summary
  }
}

