/**
 * AI 相关类型定义
 */

// AI 提供商类型
export type AIProvider =
  // | 'openai'          // OpenAI (GPT-4, GPT-3.5)
  // | 'anthropic'       // Anthropic (Claude)
  "deepseek"; // DeepSeek
// | 'qwen'            // 阿里通义千问
// | 'wenxin'          // 百度文心一言
// | 'kimi'            // Moonshot Kimi
// | 'zhipu'           // 智谱 GLM
// | 'doubao'          // 字节豆包

// AI 模型
export type AIModel = {
  id: string;
  name: string;
  provider: AIProvider;
  contextWindow: number; // 上下文窗口大小
  maxTokens: number; // 最大输出 tokens
  supportsVision: boolean; // 是否支持图片
  supportsStreaming: boolean; // 是否支持流式输出
  costPer1kTokens: {
    // 价格（每1k tokens）
    input: number;
    output: number;
  };
};

// 消息角色
export type MessageRole = "system" | "user" | "assistant";

// 消息内容类型
export type MessageContent =
  | string
  | {
      type: "text";
      text: string;
    }
  | {
      type: "image_url";
      image_url: {
        url: string; // base64 或 URL
        detail?: "low" | "high" | "auto";
      };
    };

// 消息
export interface Message {
  id?: string;
  role: MessageRole;
  content: MessageContent | MessageContent[];
  timestamp?: Date;
  tokens?: number;
}

// AI 配置
export interface AIConfig {
  id: string;
  userId: string;
  provider: AIProvider;
  modelId: string; // 模型 ID
  model: string;
  apiKey: string;
  apiEndpoint?: string; // 自定义 API 端点
  useProxy?: boolean; // 是否使用代理模式（API Key 嵌入 URL）
  temperature?: number; // 温度 (0-2)
  maxTokens?: number; // 最大输出
  topP?: number; // Top P
  isDefault: boolean; // 是否为默认配置
  createdAt: Date;
  updatedAt: Date;
}

// AI 请求参数
export interface AIRequestParams {
  messages: Message[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stream?: boolean;
  systemPrompt?: string;
}

// AI 响应
export interface AIResponse {
  id: string;
  model: string;
  content: string;
  role: MessageRole;
  finishReason: "stop" | "length" | "error";
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  timestamp: Date;
}

// 流式响应块
export interface AIStreamChunk {
  id: string;
  content: string;
  delta: string;
  finishReason?: "stop" | "length" | null;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

// API 使用统计
export interface APIUsageStats {
  id: string;
  userId: string;
  provider: AIProvider;
  model: string;
  date: Date;
  requestCount: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number; // 估算成本（元）
}

// 上下文配置
export interface ContextConfig {
  includeUserProfile: boolean;
  includeBodyMetrics: boolean;
  includeTrainingPlan: boolean;
  includeWorkoutHistory: boolean;
}

// 对话会话
export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  provider: AIProvider;
  modelId: string;
  systemPrompt?: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date;
  tokens: number;
}

// 对话消息（应用内部使用，包含完整的元数据）
export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string | MessageContent[]; // 支持纯文本或多模态内容
  timestamp: Date;
  tokens?: number;
  metadata?: {
    model?: string;
    tokensUsed?: number;
    inferenceTime?: number;
  };
}

// API 消息格式（发送到 AI 服务的标准格式）
export interface APIMessage {
  role: MessageRole;
  content: string; // API 只接受字符串格式的内容
}

// 聊天完成请求
export interface ChatCompletionRequest {
  model: string;
  messages: Array<{ role: MessageRole; content: string | MessageContent[] }>;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stream?: boolean;
}

// 聊天完成响应
export interface ChatCompletionResponse {
  id: string;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: MessageRole;
      content: string;
    };
    finishReason: string;
  }>;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// 流式响应块
export interface StreamChunk {
  id: string;
  choices: Array<{
    index: number;
    delta: {
      role?: MessageRole;
      content?: string;
    };
    finishReason?: string | null;
  }>;
}

// System Prompt 类型
export type PromptType =
  | "base" // 基础身份
  | "strict" // 严格派教练
  | "encouraging" // 鼓励派教练
  | "humorous" // 幽默派教练
  | "academic" // 学术派教练
  | "diet_analysis" // 饮食分析
  | "posture_analysis" // 体态分析
  | "equipment_recognition" // 器械识别
  | "plan_generation" // 计划生成
  | "workout_guidance" // 训练指导
  | "progress_review" // 进度回顾
  | "custom"; // 自定义

// System Prompt 模板
export interface PromptTemplate {
  id: string;
  type: PromptType;
  name: string;
  content: string;
  variables?: string[]; // 支持的变量，如 {name}, {goal}
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  version: string;
}

// 错误类型
export class AIError extends Error {
  constructor(
    message: string,
    public code: string,
    public provider?: AIProvider,
    public details?: any
  ) {
    super(message);
    this.name = "AIError";
  }
}

// AI 提供商配置
export const AI_PROVIDERS: Record<
  AIProvider,
  {
    name: string;
    nameZh?: string;
    website: string;
    baseUrl: string;
    defaultBaseURL?: string;
    models: AIModel[];
  }
> = {
  // openai: {
  //   name: "OpenAI",
  //   nameZh: "OpenAI",
  //   website: "https://openai.com",
  //   baseUrl: "https://api.openai.com/v1",
  //   models: [
  //     {
  //       id: "gpt-4o",
  //       name: "GPT-4o",
  //       provider: "openai",
  //       contextWindow: 128000,
  //       maxTokens: 4096,
  //       supportsVision: true,
  //       supportsStreaming: true,
  //       costPer1kTokens: { input: 0.005, output: 0.015 },
  //     },
  //     {
  //       id: "gpt-4-turbo",
  //       name: "GPT-4 Turbo",
  //       provider: "openai",
  //       contextWindow: 128000,
  //       maxTokens: 4096,
  //       supportsVision: true,
  //       supportsStreaming: true,
  //       costPer1kTokens: { input: 0.01, output: 0.03 },
  //     },
  //     {
  //       id: "gpt-3.5-turbo",
  //       name: "GPT-3.5 Turbo",
  //       provider: "openai",
  //       contextWindow: 16385,
  //       maxTokens: 4096,
  //       supportsVision: false,
  //       supportsStreaming: true,
  //       costPer1kTokens: { input: 0.0005, output: 0.0015 },
  //     },
  //   ],
  // },
  // anthropic: {
  //   name: "Anthropic",
  //   nameZh: "Anthropic",
  //   website: "https://anthropic.com",
  //   baseUrl: "https://api.anthropic.com/v1",
  //   models: [
  //     {
  //       id: "claude-3-5-sonnet-20241022",
  //       name: "Claude 3.5 Sonnet",
  //       provider: "anthropic",
  //       contextWindow: 200000,
  //       maxTokens: 8192,
  //       supportsVision: true,
  //       supportsStreaming: true,
  //       costPer1kTokens: { input: 0.003, output: 0.015 },
  //     },
  //     {
  //       id: "claude-3-opus-20240229",
  //       name: "Claude 3 Opus",
  //       provider: "anthropic",
  //       contextWindow: 200000,
  //       maxTokens: 4096,
  //       supportsVision: true,
  //       supportsStreaming: true,
  //       costPer1kTokens: { input: 0.015, output: 0.075 },
  //     },
  //   ],
  // },
  deepseek: {
    name: "DeepSeek",
    nameZh: "DeepSeek",
    website:
      "https://docs.siliconflow.cn/cn/api-reference/chat-completions/chat-completions?playground=open",
    baseUrl: "https://api.siliconflow.cn/v1/",
    models: [
      {
        id: "deepseek-ai/deepseek-vl2",
        name: "DeepSeek VL2 (Vision)",
        provider: "deepseek",
        contextWindow: 32768,
        maxTokens: 4096,
        supportsVision: true,
        supportsStreaming: true,
        costPer1kTokens: { input: 0.001, output: 0.002 },
      },
    ],
  },
  // qwen: {
  //   name: "Qwen",
  //   nameZh: "通义千问",
  //   website: "https://tongyi.aliyun.com",
  //   baseUrl: "https://dashscope.aliyuncs.com/api/v1",
  //   models: [
  //     {
  //       id: "qwen-vl-max",
  //       name: "Qwen-VL-Max",
  //       provider: "qwen",
  //       contextWindow: 32000,
  //       maxTokens: 8192,
  //       supportsVision: true,
  //       supportsStreaming: true,
  //       costPer1kTokens: { input: 0.002, output: 0.006 },
  //     },
  //     {
  //       id: "qwen-turbo",
  //       name: "Qwen-Turbo",
  //       provider: "qwen",
  //       contextWindow: 8192,
  //       maxTokens: 1500,
  //       supportsVision: false,
  //       supportsStreaming: true,
  //       costPer1kTokens: { input: 0.0008, output: 0.002 },
  //     },
  //   ],
  // },
  // wenxin: {
  //   name: "ERNIE",
  //   nameZh: "文心一言",
  //   website: "https://cloud.baidu.com/product/wenxinworkshop",
  //   baseUrl: "https://aip.baidubce.com/rpc/2.0/ai_custom/v1",
  //   models: [
  //     {
  //       id: "ernie-4.0",
  //       name: "ERNIE 4.0",
  //       provider: "wenxin",
  //       contextWindow: 20000,
  //       maxTokens: 2048,
  //       supportsVision: false,
  //       supportsStreaming: true,
  //       costPer1kTokens: { input: 0.012, output: 0.012 },
  //     },
  //   ],
  // },
  // kimi: {
  //   name: "Kimi",
  //   nameZh: "Kimi",
  //   website: "https://kimi.moonshot.cn",
  //   baseUrl: "https://api.moonshot.cn/v1",
  //   models: [
  //     {
  //       id: "moonshot-v1-128k",
  //       name: "Moonshot v1 128k",
  //       provider: "kimi",
  //       contextWindow: 128000,
  //       maxTokens: 4096,
  //       supportsVision: false,
  //       supportsStreaming: true,
  //       costPer1kTokens: { input: 0.012, output: 0.012 },
  //     },
  //   ],
  // },
  // zhipu: {
  //   name: "GLM",
  //   nameZh: "智谱清言",
  //   website: "https://open.bigmodel.cn",
  //   baseUrl: "https://open.bigmodel.cn/api/paas/v4",
  //   models: [
  //     {
  //       id: "glm-4v",
  //       name: "GLM-4V",
  //       provider: "zhipu",
  //       contextWindow: 8192,
  //       maxTokens: 4095,
  //       supportsVision: true,
  //       supportsStreaming: true,
  //       costPer1kTokens: { input: 0.05, output: 0.05 },
  //     },
  //     {
  //       id: "glm-4",
  //       name: "GLM-4",
  //       provider: "zhipu",
  //       contextWindow: 128000,
  //       maxTokens: 4095,
  //       supportsVision: false,
  //       supportsStreaming: true,
  //       costPer1kTokens: { input: 0.01, output: 0.01 },
  //     },
  //   ],
  // },
  // doubao: {
  //   name: "Doubao",
  //   nameZh: "豆包",
  //   website: "https://www.volcengine.com/product/doubao",
  //   baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
  //   models: [
  //     {
  //       id: "doubao-pro-128k",
  //       name: "Doubao Pro 128k",
  //       provider: "doubao",
  //       contextWindow: 128000,
  //       maxTokens: 4096,
  //       supportsVision: false,
  //       supportsStreaming: true,
  //       costPer1kTokens: { input: 0.0008, output: 0.002 },
  //     },
  //   ],
  // },
};

// 获取提供商信息
export function getProviderInfo(provider: AIProvider) {
  return AI_PROVIDERS[provider];
}

// 获取模型信息
export function getModelInfo(
  provider: AIProvider,
  modelId: string
): AIModel | undefined {
  return AI_PROVIDERS[provider].models.find((m) => m.id === modelId);
}

// 获取所有支持视觉的模型
export function getVisionModels(): AIModel[] {
  return Object.values(AI_PROVIDERS)
    .flatMap((p) => p.models)
    .filter((m) => m.supportsVision);
}
