/**
 * AI 服务工厂
 * 根据提供商创建对应的服务实例
 */

import type { AIConfig } from "@/types/ai";
import { BaseAIService } from "./baseService";
import { DeepSeekService } from "./deepseekService";
import { AIError, getProviderInfo } from "@/types/ai";

/**
 * 创建 AI 服务实例
 */
export function createAIService(config: AIConfig): BaseAIService {
  const provider = config.provider;
  console.log("====createAIService===", config);

  // 获取提供商信息以获取默认端点
  const providerInfo = getProviderInfo(provider);
  const endpoint = config.apiEndpoint || providerInfo.baseUrl;

  // 根据提供商创建相应的服务实例
  switch (provider) {
    case "deepseek":
      return new DeepSeekService(
        provider,
        config.apiKey,
        endpoint,
        config.model,
        config.useProxy || false
      );
    default:
      throw new AIError(
        `不支持的 AI 提供商: ${provider}`,
        "UNSUPPORTED_PROVIDER",
        provider
      );
  }
}

/**
 * 测试 AI 配置是否有效
 */
export async function testAIConfig(config: AIConfig): Promise<boolean> {
  console.log("====testAIConfig===", config);
  try {
    const service = createAIService(config);
    console.log("createAIService", config, service);
    // 发送测试消息
    const response = await service.chat({
      messages: [
        {
          role: "user",
          content: '你好，请回复"连接成功"',
        },
      ],
      maxTokens: 10,
    });

    return response.content.length > 0;
  } catch (error) {
    console.error("AI 配置测试失败:", error);
    return false;
  }
}

// 导出服务类
export { BaseAIService } from "./baseService";
