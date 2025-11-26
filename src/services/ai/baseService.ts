/**
 * AI 服务基类
 * 定义统一的接口和通用逻辑
 */

import type {
  AIProvider,
  AIRequestParams,
  AIResponse,
  AIStreamChunk,
  ChatMessage,
} from '@/types/ai'

export abstract class BaseAIService {
  protected provider: AIProvider
  protected apiKey: string
  protected endpoint: string
  protected defaultModel: string
  protected useProxy: boolean // 是否使用代理模式

  constructor(provider: AIProvider, apiKey: string, endpoint: string, defaultModel: string, useProxy: boolean = false) {
    this.provider = provider
    this.apiKey = apiKey
    this.endpoint = endpoint
    this.defaultModel = defaultModel
    this.useProxy = useProxy
  }

  /**
   * 获取认证头
   * 代理模式下不需要 Authorization 头
   */
  protected getAuthHeaders(): Record<string, string> {
    if (this.useProxy) {
      return {}
    }
    return {
      'Authorization': `Bearer ${this.apiKey}`
    }
  }

  /**
   * 发送聊天请求（非流式）
   */
  abstract chat(params: AIRequestParams): Promise<AIResponse>

  /**
   * 发送聊天请求（流式）
   */
  abstract chatStream(
    params: AIRequestParams,
    onChunk: (chunk: AIStreamChunk) => void
  ): Promise<void>

  /**
   * 转换消息格式为提供商特定格式
   */
  protected abstract formatMessages(messages: ChatMessage[]): any[]

  /**
   * 处理错误
   */
  protected handleError(error: any, provider: AIProvider): never {
    console.error(`[${provider}] AI Service Error:`, error)
    
    let message = '服务请求失败'
    let code = 'UNKNOWN_ERROR'
    let statusCode = error.response?.status

    if (error.response) {
      // HTTP 错误
      statusCode = error.response.status
      
      switch (statusCode) {
        case 401:
          message = 'API Key 无效或已过期'
          code = 'INVALID_API_KEY'
          break
        case 429:
          message = '请求过于频繁，请稍后再试'
          code = 'RATE_LIMIT'
          break
        case 500:
          message = '服务器错误，请稍后再试'
          code = 'SERVER_ERROR'
          break
        default:
          message = error.response.data?.error?.message || error.message || message
          code = error.response.data?.error?.code || code
      }
    } else if (error.request) {
      // 网络错误
      message = '网络连接失败，请检查网络设置'
      code = 'NETWORK_ERROR'
    } else {
      message = error.message || message
    }

    throw {
      name: 'AIServiceError',
      message,
      code,
      provider,
      statusCode
    } as any
  }

  /**
   * 验证 API Key
   */
  async validateApiKey(): Promise<boolean> {
    try {
      const testParams: AIRequestParams = {
        model: this.defaultModel,
        messages: [
          {
            id: 'test',
            role: 'user',
            content: 'Hello',
            timestamp: new Date()
          }
        ],
        maxTokens: 10
      }
      
      await this.chat(testParams)
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * 计算 token 数量（简单估算）
   */
  protected estimateTokens(text: string): number {
    // 简单估算：中文 1 字约 1.5 token，英文 1 词约 1.3 token
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length
    
    return Math.ceil(chineseChars * 1.5 + englishWords * 1.3)
  }

  /**
   * 格式化流式响应
   */
  protected parseStreamLine(line: string): any {
    if (!line.trim() || line.startsWith(':')) {
      return null
    }

    if (line.startsWith('data: ')) {
      const data = line.slice(6).trim()
      
      if (data === '[DONE]') {
        return { done: true }
      }

      try {
        return JSON.parse(data)
      } catch (e) {
        console.warn('Failed to parse stream line:', line)
        return null
      }
    }

    return null
  }
}

