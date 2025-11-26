/**
 * 统一 AI 服务层
 * 支持多个 AI 提供商的统一接口
 */

import axios, { type AxiosInstance } from "axios";
import type {
  AIConfig,
  ChatCompletionRequest,
  ChatCompletionResponse,
  StreamChunk,
  MessageRole,
} from "@/types/ai";
import { AI_PROVIDERS } from "@/types/ai";

/**
 * AI 服务基类
 */
abstract class BaseAIService {
  protected client: AxiosInstance;
  protected config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
    this.client = this.createClient();
  }

  protected abstract createClient(): AxiosInstance;

  abstract chat(
    request: ChatCompletionRequest
  ): Promise<ChatCompletionResponse>;

  abstract chatStream(
    request: ChatCompletionRequest,
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): Promise<void>;
}

/**
 * OpenAI 服务
 */
class OpenAIService extends BaseAIService {
  protected createClient(): AxiosInstance {
    const baseURL = this.config.apiEndpoint || AI_PROVIDERS.deepseek.baseUrl;

    return axios.create({
      baseURL,
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 60000,
    });
  }

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    try {
      const response = await this.client.post(`${this.config.apiEndpoint}`, {
        model: request.model,
        messages: request.messages,
        temperature: request.temperature ?? this.config.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? this.config.maxTokens,
        top_p: request.topP,
        frequency_penalty: request.frequencyPenalty,
        presence_penalty: request.presencePenalty,
        stream: false,
      });

      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async chatStream(
    request: ChatCompletionRequest,
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      const baseURL = this.config.apiEndpoint;

      const response = await fetch(`${baseURL}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: request.model,
          messages: request.messages,
          temperature: request.temperature ?? this.config.temperature ?? 0.7,
          max_tokens: request.maxTokens ?? this.config.maxTokens,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");

      if (!reader) {
        throw new Error("No reader available");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((line) => line.trim() !== "");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              onComplete();
              return;
            }

            try {
              const parsed: StreamChunk = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content;
              if (content) {
                onChunk(content);
              }
            } catch (e) {
              console.error("Parse error:", e);
            }
          }
        }
      }

      onComplete();
    } catch (error: any) {
      onError(this.handleError(error));
    }
  }

  private handleError(error: any): Error {
    if (error.response) {
      const message = error.response.data?.error?.message || error.message;
      return new Error(`OpenAI API Error: ${message}`);
    }
    return new Error(error.message || "Unknown error");
  }
}

/**
 * 通用 OpenAI 兼容服务
 * 适用于 DeepSeek、通义千问、Kimi 等兼容 OpenAI API 的服务
 */
class OpenAICompatibleService extends OpenAIService {
  protected createClient(): AxiosInstance {
    const provider = this.config.provider;
    const baseURL = this.config.apiEndpoint || AI_PROVIDERS[provider].baseUrl;

    return axios.create({
      baseURL,
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 60000,
    });
  }
}

/**
 * AI 服务工厂
 */
export class AIServiceFactory {
  static create(config: AIConfig): BaseAIService {
    switch (config.provider) {
      case "deepseek":
        return new OpenAICompatibleService(config);

      default:
        throw new Error(`Unsupported AI provider: ${config.provider}`);
    }
  }
}

/**
 * 统一 AI 服务接口
 */
export class AIService {
  private service: BaseAIService;

  constructor(config: AIConfig) {
    this.service = AIServiceFactory.create(config);
  }

  /**
   * 发送对话请求
   */
  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    return this.service.chat(request);
  }

  /**
   * 发送流式对话请求
   */
  async chatStream(
    request: ChatCompletionRequest,
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    return this.service.chatStream(request, onChunk, onComplete, onError);
  }

  /**
   * 简单对话（便捷方法）
   */
  async simpleChat(
    message: string,
    systemPrompt?: string,
    history?: Array<{ role: MessageRole; content: string }>
  ): Promise<string> {
    const messages: Array<{ role: MessageRole; content: string }> = [];

    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }

    if (history) {
      messages.push(...history);
    }

    messages.push({ role: "user", content: message });

    const response = await this.chat({
      model: "", // 将由配置提供
      messages,
    });

    return response.choices[0]?.message.content || "";
  }
}

export default AIService;
