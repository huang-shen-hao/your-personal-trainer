/**
 * AI 服务工厂
 * 根据配置创建对应的 AI 服务实例
 */

import { DeepSeekService } from "./deepseekService";
import type { AIProvider, AIConfig } from "@/types/ai";
import { AI_PROVIDERS } from "@/types/ai";
import { BaseAIService } from "./baseService";

export class AIServiceFactory {
  private static instances: Map<string, BaseAIService> = new Map();

  /**
   * 创建 AI 服务实例
   */
  static createService(config: AIConfig): BaseAIService {
    const cacheKey = `${config.provider}-${config.id}`;

    // 检查缓存
    if (this.instances.has(cacheKey)) {
      return this.instances.get(cacheKey)!;
    }

    const providerConfig = AI_PROVIDERS[config.provider];
    const endpoint = config.apiEndpoint || providerConfig.baseUrl;
    const defaultModel = config.modelId || providerConfig.models[0].id;
    const useProxy = config.useProxy ?? false;

    let service: BaseAIService;

    switch (config.provider) {
      case "deepseek":
        service = new DeepSeekService(
          config.provider,
          config.apiKey,
          endpoint,
          defaultModel,
          useProxy
        );
        break;

        // 其他提供商后续实现
        // case 'qwen':
        // case 'wenxin':
        // case 'doubao':
        // case 'kimi':
        // case 'zhipu':

        break;

      default:
        throw new Error(`Unsupported AI provider: ${config.provider}`);
    }

    // 缓存实例
    this.instances.set(cacheKey, service);
    return service;
  }

  /**
   * 清除缓存的服务实例
   */
  static clearCache(provider?: AIProvider) {
    if (provider) {
      // 清除特定提供商的缓存
      for (const key of this.instances.keys()) {
        if (key.startsWith(provider)) {
          this.instances.delete(key);
        }
      }
    } else {
      // 清除所有缓存
      this.instances.clear();
    }
  }

  /**
   * 获取提供商信息
   */
  static getProviderInfo(provider: AIProvider) {
    return AI_PROVIDERS[provider];
  }

  /**
   * 获取所有可用的提供商
   */
  static getAllProviders() {
    return Object.entries(AI_PROVIDERS).map(([key, value]) => ({
      id: key as AIProvider,
      ...value,
    }));
  }

  /**
   * 获取提供商的所有模型
   */
  static getProviderModels(provider: AIProvider) {
    return AI_PROVIDERS[provider]?.models || [];
  }

  /**
   * 检查模型是否支持视觉功能
   */
  static supportsVision(provider: AIProvider, modelId: string): boolean {
    const models = this.getProviderModels(provider);
    const model = models.find((m) => m.id === modelId);
    return model?.supportsVision ?? false;
  }

  /**
   * 检查模型是否支持流式输出
   */
  static supportsStreaming(provider: AIProvider, modelId: string): boolean {
    const models = this.getProviderModels(provider);
    const model = models.find((m) => m.id === modelId);
    return model?.supportsStreaming ?? false;
  }
}
