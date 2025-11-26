/**
 * DeepSeek API 服务
 * 支持标准模式和代理模式
 *
 * 代理模式：API Key 嵌入在 URL 中，不通过 Authorization Header 传递
 * 例如：http://localhost:5173/sk-xxx/chat/completions
 */

import { BaseAIService } from "./baseService";
import type {
  AIRequestParams,
  AIResponse,
  AIStreamChunk,
  ChatMessage,
} from "@/types/ai";

export class DeepSeekService extends BaseAIService {
  /**
   * 获取实际请求的端点
   * 代理模式下，将 API Key 嵌入到 URL 路径中
   */
  private getRequestEndpoint(): string {
    if (this.useProxy) {
      // 代理模式：将 API Key 作为路径的一部分
      // 例如：http://localhost:5173/sk-xxx/chat/completions
      return this.endpoint.replace(/\/$/, ""); // 移除末尾的斜杠
    }
    return this.endpoint;
  }

  /**
   * 发送聊天请求（非流式）
   */
  async chat(params: AIRequestParams): Promise<AIResponse> {
    try {
      const endpoint = this.getRequestEndpoint();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...this.getAuthHeaders(),
      };
      const response = await fetch(`${endpoint}/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: params.model || this.defaultModel,
          messages: this.formatMessages(params.messages as ChatMessage[]),
          temperature: params.temperature ?? 0.7,
          max_tokens: params.maxTokens,
          top_p: params.topP,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          response: {
            status: response.status,
            data: errorData,
          },
          message:
            errorData.error?.message ||
            `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();
      const choice = data.choices[0];

      return {
        id: data.id,
        model: data.model,
        content: choice.message.content,
        role: choice.message.role,
        finishReason:
          choice.finish_reason === "stop"
            ? "stop"
            : choice.finish_reason === "length"
              ? "length"
              : "error",
        usage: data.usage
          ? {
              promptTokens: data.usage.prompt_tokens,
              completionTokens: data.usage.completion_tokens,
              totalTokens: data.usage.total_tokens,
            }
          : undefined,
        timestamp: new Date(),
      };
    } catch (error) {
      this.handleError(error, this.provider);
    }
  }

  /**
   * 发送聊天请求（流式）
   */
  async chatStream(
    params: AIRequestParams,
    onChunk: (chunk: AIStreamChunk) => void
  ): Promise<void> {
    try {
      const endpoint = this.getRequestEndpoint();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...this.getAuthHeaders(),
      };

      const formattedMessages = this.formatMessages(params.messages as any[]);
      const requestBody = {
        model: params.model || this.defaultModel,
        messages: formattedMessages,
        temperature: params.temperature ?? 0.7,
        max_tokens: params.maxTokens,
        top_p: params.topP,
        stream: true,
      };

      console.log("=====DeepSeek Request Body======", JSON.stringify(requestBody, null, 2));

      const response = await fetch(`${endpoint}/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          response: {
            status: response.status,
            data: errorData,
          },
          message:
            errorData.error?.message ||
            `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to get response reader");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let contentAccumulator = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const parsed = this.parseStreamLine(line);
          if (!parsed) continue;

          if (parsed.done) {
            onChunk({
              id: "final",
              content: contentAccumulator,
              delta: "",
              finishReason: "stop",
            });
            return;
          }

          const delta = parsed.choices?.[0]?.delta?.content || "";
          if (delta) {
            contentAccumulator += delta;
            onChunk({
              id: parsed.id || "streaming",
              content: contentAccumulator,
              delta,
              finishReason: null,
              usage: parsed.usage
                ? {
                    promptTokens: parsed.usage.prompt_tokens,
                    completionTokens: parsed.usage.completion_tokens,
                    totalTokens: parsed.usage.total_tokens,
                  }
                : undefined,
            });
          }

          // 检查是否完成
          const finishReason = parsed.choices?.[0]?.finish_reason;
          if (finishReason) {
            onChunk({
              id: parsed.id || "final",
              content: contentAccumulator,
              delta: "",
              finishReason:
                finishReason === "stop"
                  ? "stop"
                  : finishReason === "length"
                    ? "length"
                    : "stop",
              usage: parsed.usage
                ? {
                    promptTokens: parsed.usage.prompt_tokens,
                    completionTokens: parsed.usage.completion_tokens,
                    totalTokens: parsed.usage.total_tokens,
                  }
                : undefined,
            });
            return;
          }
        }
      }
    } catch (error) {
      this.handleError(error, this.provider);
    }
  }

  /**
   * 转换消息格式为 API 标准格式
   * 将 ChatMessage 转换为 SiliconFlow API 所需的格式：{ role, content }
   * 支持多模态内容（文本和图片）
   */
  protected formatMessages(messages: ChatMessage[]): Array<{ role: string; content: string | any[] }> {
    return messages.map((msg) => {
      // 处理纯文本消息
      if (typeof msg.content === "string") {
        return {
          role: msg.role,
          content: msg.content,
        };
      }

      // 处理多模态消息（支持图片）
      const contentArray = Array.isArray(msg.content)
        ? msg.content
        : [msg.content];

      // 如果消息只包含文本，返回字符串格式
      const hasImage = contentArray.some(
        (item: any) => typeof item === "object" && item.type === "image_url"
      );

      if (!hasImage) {
        // 只有文本内容，返回字符串
        const textContents = contentArray
          .filter((item: any) => typeof item === "string" || item.type === "text")
          .map((item: any) => (typeof item === "string" ? item : item.text))
          .join("\n");

        return {
          role: msg.role,
          content: textContents,
        };
      }

      // 包含图片，返回数组格式
      return {
        role: msg.role,
        content: contentArray,
      };
    });
  }
}
