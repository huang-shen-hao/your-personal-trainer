/**
 * AI 服务基类
 * 定义统一的接口，各提供商实现具体逻辑
 */

import type {
  AIProvider,
  AIRequestParams,
  AIResponse,
  AIStreamChunk,
  Message,
  AIConfig
} from '@/types/ai'

export abstract class BaseAIService {
  protected provider: AIProvider
  protected config: AIConfig

  constructor(provider: AIProvider, config: AIConfig) {
    this.provider = provider
    this.config = config
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
    onChunk: (chunk: AIStreamChunk) => void,
    onComplete: (response: AIResponse) => void,
    onError: (error: Error) => void
  ): Promise<void>

  /**
   * 构建请求头
   */
  protected abstract buildHeaders(): Record<string, string>

  /**
   * 构建请求体
   */
  protected abstract buildRequestBody(params: AIRequestParams): any

  /**
   * 解析响应
   */
  protected abstract parseResponse(response: any): AIResponse

  /**
   * 解析流式响应块
   */
  protected abstract parseStreamChunk(chunk: string): AIStreamChunk | null

  /**
   * 验证配置
   */
  validateConfig(): boolean {
    if (!this.config.apiKey) {
      throw new Error('API Key 未配置')
    }
    if (!this.config.modelId) {
      throw new Error('模型未选择')
    }
    return true
  }

  /**
   * 获取 API 端点
   */
  protected getApiEndpoint(): string {
    return this.config.apiEndpoint || this.getDefaultBaseURL()
  }

  /**
   * 获取默认 Base URL
   */
  protected abstract getDefaultBaseURL(): string

  /**
   * 估算 tokens 数量（简单估算）
   */
  protected estimateTokens(text: string): number {
    // 中文约 1.5 字符 = 1 token，英文约 4 字符 = 1 token
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
    const otherChars = text.length - chineseChars
    return Math.ceil(chineseChars / 1.5 + otherChars / 4)
  }

  /**
   * 合并系统提示词
   */
  protected mergeSystemPrompt(messages: Message[], systemPrompt?: string): Message[] {
    if (!systemPrompt) return messages

    // 检查是否已有 system 消息
    const hasSystem = messages.some(m => m.role === 'system')

    if (hasSystem) {
      // 更新第一个 system 消息
      return messages.map((m, index) => {
        if (index === 0 && m.role === 'system') {
          return {
            ...m,
            content: systemPrompt
          }
        }
        return m
      })
    } else {
      // 添加新的 system 消息
      return [
        {
          role: 'system',
          content: systemPrompt
        },
        ...messages
      ]
    }
  }

  /**
   * 处理流式响应（SSE）
   */
  protected async handleSSE(
    response: Response,
    onChunk: (chunk: AIStreamChunk) => void,
    onComplete: (response: AIResponse) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    if (!response.body) {
      throw new Error('Response body is null')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let fullContent = ''
    let lastChunkId = ''
    let totalUsage = {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0
    }

    try {
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.trim() === '' || line.trim() === 'data: [DONE]') continue
          
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            
            try {
              const chunk = this.parseStreamChunk(data)
              
              if (chunk) {
                lastChunkId = chunk.id
                fullContent += chunk.delta
                
                if (chunk.usage) {
                  totalUsage = {
                    promptTokens: chunk.usage.promptTokens || totalUsage.promptTokens,
                    completionTokens: chunk.usage.completionTokens || totalUsage.completionTokens,
                    totalTokens: chunk.usage.totalTokens || totalUsage.totalTokens
                  }
                }
                
                onChunk(chunk)

                if (chunk.finishReason === 'stop' || chunk.finishReason === 'length') {
                  onComplete({
                    id: lastChunkId,
                    model: this.config.id,
                    content: fullContent,
                    role: 'assistant',
                    finishReason: chunk.finishReason,
                    usage: totalUsage,
                    timestamp: new Date()
                  })
                  return
                }
              }
            } catch (error) {
              console.error('Parse chunk error:', error, data)
            }
          }
        }
      }

      // 如果没有正常结束，创建一个完成响应
      if (fullContent) {
        onComplete({
          id: lastChunkId || crypto.randomUUID(),
          model: this.config.id,
          content: fullContent,
          role: 'assistant',
          finishReason: 'stop',
          usage: totalUsage,
          timestamp: new Date()
        })
      }
    } catch (error) {
      onError(error as Error)
    }
  }

  /**
   * 通用 fetch 请求
   */
  protected async fetchAPI(
    endpoint: string,
    body: any,
    _stream: boolean = false
  ): Promise<Response> {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(`API Error: ${response.status} - ${JSON.stringify(error)}`)
    }

    return response
  }
}

