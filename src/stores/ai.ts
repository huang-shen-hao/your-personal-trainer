/**
 * AI Store
 * 管理 AI 配置、对话会话和 System Prompts
 */

import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type {
  AIConfig,
  ChatSession,
  ChatMessage,
  PromptTemplate,
  PromptType,
  AIResponse,
} from "@/types/ai";
import { createAIService, testAIConfig } from "@/services/ai";
import type { BaseAIService } from "@/services/ai";
import { promptTemplateRepository } from "@/db/repositories/aiRepository";
import {
  buildSystemPrompt,
  BASE_COACH_PROMPT,
  PERSONALITY_PROMPTS,
} from "@/data/prompts";
import { trackAPIUsage } from "@/utils/apiUsageTracker";
import { useUserStore } from "./user";
import { db } from "@/db";

// ===== 辅助函数：序列化/反序列化消息 =====
/**
 * 将 ChatMessage 转换为可存储到 IndexedDB 的格式
 * 主要是将 content 序列化为 JSON 字符串（如果是数组的话）
 */
function serializeMessage(message: ChatMessage): any {
  return {
    ...message,
    // 如果 content 是数组，序列化为 JSON 字符串
    content: Array.isArray(message.content) 
      ? JSON.stringify(message.content) 
      : message.content,
    // 确保 timestamp 是 Date 对象
    timestamp: message.timestamp instanceof Date 
      ? message.timestamp 
      : new Date(message.timestamp),
  };
}

/**
 * 从 IndexedDB 读取的数据转换回 ChatMessage
 */
function deserializeMessage(dbMessage: any): ChatMessage {
  let content = dbMessage.content;
  
  // 如果 content 是字符串且看起来像 JSON 数组，尝试解析
  if (typeof content === 'string' && content.trim().startsWith('[')) {
    try {
      content = JSON.parse(content);
    } catch {
      // 如果解析失败，保持原样
    }
  }
  
  return {
    ...dbMessage,
    content,
    timestamp: dbMessage.timestamp instanceof Date 
      ? dbMessage.timestamp 
      : new Date(dbMessage.timestamp),
  };
}

/**
 * 序列化整个会话用于存储
 */
function serializeSession(session: ChatSession): any {
  return {
    ...session,
    messages: session.messages.map(serializeMessage),
  };
}

/**
 * 反序列化从数据库读取的会话
 */
function deserializeSession(dbSession: any): ChatSession {
  return {
    ...dbSession,
    messages: (dbSession.messages || []).map(deserializeMessage),
    createdAt: dbSession.createdAt instanceof Date 
      ? dbSession.createdAt 
      : new Date(dbSession.createdAt),
    updatedAt: dbSession.updatedAt instanceof Date 
      ? dbSession.updatedAt 
      : new Date(dbSession.updatedAt),
    lastMessageAt: dbSession.lastMessageAt instanceof Date 
      ? dbSession.lastMessageAt 
      : new Date(dbSession.lastMessageAt),
  };
}

export const useAIStore = defineStore("ai", () => {
  // ===== State =====
  const configs = ref<AIConfig[]>([]);
  const currentConfig = ref<AIConfig | null>(null);
  const sessions = ref<ChatSession[]>([]);
  const currentSession = ref<ChatSession | null>(null);
  const promptTemplates = ref<PromptTemplate[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // 当前使用的 System Prompt
  const currentBasePrompt = ref<string>(BASE_COACH_PROMPT);
  const currentPersonalityPrompt = ref<string>(PERSONALITY_PROMPTS.encouraging);
  const currentScenarioPrompt = ref<string>("");

  // AI Service 实例
  let aiService: BaseAIService | null = null;

  // ===== Computed =====
  const hasConfig = computed(() => configs.value.length > 0);
  const defaultConfig = computed(() => configs.value.find((c) => c.isDefault));
  const hasActiveSession = computed(() => currentSession.value !== null);

  /**
   * 构建完整 System Prompt
   */
  const fullSystemPrompt = computed(() => {
    const userStore = useUserStore();
    const context: Record<string, any> = {};

    if (userStore.profile) {
      const profile = userStore.profile;
      context.name = profile.nickname;
      context.gender =
        profile.gender === "male"
          ? "男"
          : profile.gender === "female"
            ? "女"
            : "其他";
      context.age = new Date().getFullYear() - profile.birthYear;
      context.height = profile.height;
      context.weight = profile.currentWeight;
      context.experience = {
        none: "无经验",
        beginner: "初学者",
        intermediate: "中级",
        advanced: "高级",
      }[profile.experienceLevel];
      context.frequency = profile.weeklyTrainingDays || 3;
      context.goal = profile.goals?.join("、") || "保持健康";
      context.equipment = {
        none: "无器械",
        home: "家庭器械",
        gym: "健身房",
      }[profile.equipment];
      context.injuries = profile.injuries?.length
        ? profile.injuries.join("、")
        : "无";
    }

    return buildSystemPrompt(
      currentBasePrompt.value,
      currentPersonalityPrompt.value,
      currentScenarioPrompt.value,
      context
    );
  });

  // ===== Actions - 配置管理 =====

  /**
   * 加载 AI 配置
   */
  async function loadConfigs() {
    try {
      const dbConfigs = await db.aiConfigs.toArray();
      // 过滤并转换类型，确保 id 存在
      configs.value = dbConfigs
        .filter((c): c is AIConfig => c.id !== undefined)
        .map((c) => ({
          ...c,
          id: c.id!,
          provider: c.provider as AIConfig["provider"],
        }));

      // 设置当前配置为默认配置
      if (!currentConfig.value && configs.value.length > 0) {
        currentConfig.value = defaultConfig.value || configs.value[0];
        if (currentConfig.value) {
          aiService = createAIService(currentConfig.value);
        }
      }
    } catch (err: any) {
      error.value = err.message;
      console.error("Failed to load AI configs:", err);
    }
  }

  /**
   * 保存 AI 配置
   */
  async function saveConfig(
    config: Omit<AIConfig, "id" | "userId" | "createdAt" | "updatedAt">
  ): Promise<string> {
    try {
      const userStore = useUserStore();
      const userId = userStore.profile?.id || "default";
      const now = new Date();
      const id = crypto.randomUUID();

      // 如果是第一个配置或设置为默认，更新其他配置的默认状态
      if (config.isDefault || configs.value.length === 0) {
        const existingConfigs = await db.aiConfigs
          .where("userId")
          .equals(userId)
          .and((c) => c.isDefault === true)
          .toArray();

        for (const c of existingConfigs) {
          if (c.id) {
            await db.aiConfigs.update(c.id, { isDefault: false });
          }
        }
      }

      await db.aiConfigs.add({
        ...config,
        id,
        userId,
        isDefault: config.isDefault || configs.value.length === 0,
        createdAt: now,
        updatedAt: now,
      } as any);

      await loadConfigs();
      return id;
    } catch (err: any) {
      error.value = err.message;
      throw err;
    }
  }

  /**
   * 更新 AI 配置
   */
  async function updateConfig(id: string, updates: Partial<AIConfig>) {
    try {
      if (updates.isDefault) {
        // 如果设置为默认，取消其他配置的默认状态
        const config = await db.aiConfigs.get(id);
        if (config) {
          const existingConfigs = await db.aiConfigs
            .where("userId")
            .equals(config.userId)
            .and((c) => c.isDefault === true && c.id !== id)
            .toArray();

          for (const c of existingConfigs) {
            if (c.id) {
              await db.aiConfigs.update(c.id, { isDefault: false });
            }
          }
        }
      }

      await db.aiConfigs.update(id, {
        ...updates,
        updatedAt: new Date(),
      });

      await loadConfigs();
    } catch (err: any) {
      error.value = err.message;
      throw err;
    }
  }

  /**
   * 删除 AI 配置
   */
  async function deleteConfig(id: string) {
    try {
      await db.aiConfigs.delete(id);
      await loadConfigs();

      // 如果删除的是当前配置，切换到其他配置
      if (currentConfig.value?.id === id) {
        currentConfig.value = configs.value[0] || null;
        aiService = currentConfig.value
          ? createAIService(currentConfig.value)
          : null;
      }
    } catch (err: any) {
      error.value = err.message;
      throw err;
    }
  }

  /**
   * 切换当前配置
   */
  function switchConfig(config: AIConfig) {
    currentConfig.value = config;
    aiService = createAIService(config);
  }

  /**
   * 测试 API 连接
   */
  async function testConnection(config: AIConfig): Promise<boolean> {
    try {
      return await testAIConfig(config);
    } catch (err) {
      console.error("Connection test failed:", err);
      return false;
    }
  }

  // ===== Actions - 对话管理 =====

  /**
   * 加载对话会话
   */
  async function loadSessions() {
    try {
      const dbSessions = await db.chatSessions
        .orderBy("lastMessageAt")
        .reverse()
        .toArray();
      sessions.value = dbSessions.map(deserializeSession);
    } catch (err: any) {
      error.value = err.message;
      console.error("Failed to load sessions:", err);
    }
  }

  /**
   * 创建新对话
   */
  async function createSession(title: string = "新对话"): Promise<string> {
    if (!currentConfig.value) {
      throw new Error("请先配置 AI 服务");
    }

    try {
      const userStore = useUserStore();
      const userId = userStore.profile?.id || "default";
      const now = new Date();
      const id = crypto.randomUUID();

      const session: ChatSession = {
        id,
        userId,
        title,
        messages: [],
        provider: currentConfig.value.provider,
        modelId: currentConfig.value.modelId,
        createdAt: now,
        updatedAt: now,
        lastMessageAt: now,
        tokens: 0,
      };

      // 序列化会话再保存
      await db.chatSessions.add(serializeSession(session));
      await loadSessions();

      // 设置为当前会话
      currentSession.value = session;

      return id;
    } catch (err: any) {
      error.value = err.message;
      throw err;
    }
  }

  /**
   * 切换对话会话
   */
  async function switchSession(sessionId: string) {
    try {
      const dbSession = await db.chatSessions.get(sessionId);
      if (dbSession) {
        currentSession.value = deserializeSession(dbSession);
      }
    } catch (err: any) {
      error.value = err.message;
      throw err;
    }
  }

  /**
   * 发送消息（非流式）
   */
  async function sendMessage(
    content: string,
    systemPrompt?: string,
    images?: string[]
  ): Promise<AIResponse> {
    if (!currentSession.value || !aiService) {
      throw new Error("No active session or AI service");
    }

    isLoading.value = true;
    error.value = null;

    try {
      // 构建用户消息
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content:
          images && images.length > 0
            ? [
                { type: "text", text: content } as any,
                ...images.map((img) => ({
                  type: "image_url" as const,
                  image_url: { url: img },
                })),
              ]
            : content,
        timestamp: new Date(),
      };

      // 添加到会话
      currentSession.value.messages.push(userMessage);

      // 立即保存用户消息到数据库
      try {
        const updateData: any = {
          messages: currentSession.value.messages.map(serializeMessage),
          updatedAt: new Date(),
          lastMessageAt: new Date(),
        };

        // 如果是第一条消息，自动生成标题
        if (currentSession.value.messages.length === 1) {
          updateData.title = content.length > 30 
            ? content.substring(0, 30) + "..." 
            : content;
          currentSession.value.title = updateData.title;
        }

        await db.chatSessions.update(currentSession.value.id!, updateData);
      } catch (saveError) {
        console.error("Failed to save user message:", saveError);
        // 即使保存失败也继续处理，避免中断用户体验
      }

      // 构建请求消息（包含 system prompt）
      const requestMessages = systemPrompt
        ? [
            { role: "system" as const, content: systemPrompt },
            ...currentSession.value.messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          ]
        : currentSession.value.messages.map((m) => ({
            role: m.role,
            content: m.content,
          }));

      // 调用 AI
      const response = await aiService.chat({
        messages: requestMessages as any,
        model: currentConfig.value?.modelId,
      });

      // 添加 AI 回复
      const assistantMessage: ChatMessage = {
        id: response.id,
        role: "assistant",
        content: response.content,
        timestamp: response.timestamp,
        tokens: response.usage?.totalTokens,
      };

      currentSession.value.messages.push(assistantMessage);
      currentSession.value.tokens += response.usage?.totalTokens || 0;
      currentSession.value.updatedAt = new Date();
      currentSession.value.lastMessageAt = new Date();

      // 保存到数据库
      await db.chatSessions.update(currentSession.value.id!, {
        messages: currentSession.value.messages.map(serializeMessage),
        tokens: currentSession.value.tokens,
        updatedAt: currentSession.value.updatedAt,
        lastMessageAt: currentSession.value.lastMessageAt,
      });

      // 记录 API 使用统计
      if (response.usage && currentConfig.value) {
        const userStore = useUserStore();
        const userId = userStore.profile?.id || "default";

        await trackAPIUsage(
          userId,
          currentConfig.value.provider,
          currentConfig.value.modelId,
          response.usage
        );
      }

      return response;
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 发送流式消息
   */
  async function sendMessageStream(
    content: string,
    systemPrompt?: string,
    onChunk?: (chunk: string) => void,
    images?: string[]
  ): Promise<void> {
    if (!currentSession.value || !aiService) {
      throw new Error("No active session or AI service");
    }

    isLoading.value = true;
    error.value = null;

    try {
      // 构建用户消息
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content:
          images && images.length > 0
            ? [
                { type: "text", text: content } as any,
                ...images.map((img) => ({
                  type: "image_url" as const,
                  image_url: { url: img },
                })),
              ]
            : content,
        timestamp: new Date(),
      };

      currentSession.value.messages.push(userMessage);

      // 立即保存用户消息到数据库
      try {
        const updateData: any = {
          messages: currentSession.value.messages.map(serializeMessage),
          updatedAt: new Date(),
          lastMessageAt: new Date(),
        };

        // 如果是第一条消息，自动生成标题
        if (currentSession.value.messages.length === 1) {
          updateData.title = content.length > 30 
            ? content.substring(0, 30) + "..." 
            : content;
          currentSession.value.title = updateData.title;
        }

        await db.chatSessions.update(currentSession.value.id!, updateData);
      } catch (saveError) {
        console.error("Failed to save user message:", saveError);
        // 即使保存失败也继续处理，避免中断用户体验
      }

      // 构建请求消息
      const requestMessages = systemPrompt
        ? [
            { role: "system" as const, content: systemPrompt },
            ...currentSession.value.messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          ]
        : currentSession.value.messages.map((m) => ({
            role: m.role,
            content: m.content,
          }));

      let fullResponse = "";
      let responseId = "";
      let lastUsage: any = undefined;
      console.log("=====7777======", requestMessages);
      // 流式调用
      await aiService.chatStream(
        {
          messages: requestMessages,
          model: currentConfig.value?.modelId,
        },
        (chunk) => {
          // 如果有 finishReason，说明流式响应已完成
          if (
            chunk.finishReason === "stop" ||
            chunk.finishReason === "length"
          ) {
            responseId = chunk.id;
            fullResponse = chunk.content;
            lastUsage = chunk.usage;
            return;
          }

          // 正常的流式数据块
          fullResponse += chunk.delta;
          responseId = chunk.id;
          if (chunk.usage) {
            lastUsage = chunk.usage;
          }
          if (onChunk) {
            onChunk(chunk.delta);
          }
        }
      );

      // 流式响应完成后保存
      const assistantMessage: ChatMessage = {
        id: responseId || crypto.randomUUID(),
        role: "assistant",
        content: fullResponse,
        timestamp: new Date(),
        tokens: lastUsage?.totalTokens,
      };

      currentSession.value!.messages.push(assistantMessage);
      currentSession.value!.tokens += lastUsage?.totalTokens || 0;
      currentSession.value!.updatedAt = new Date();
      currentSession.value!.lastMessageAt = new Date();

      await db.chatSessions.update(currentSession.value!.id!, {
        messages: currentSession.value!.messages.map(serializeMessage),
        tokens: currentSession.value!.tokens,
        updatedAt: currentSession.value!.updatedAt,
        lastMessageAt: currentSession.value!.lastMessageAt,
      });

      // 记录 API 使用统计
      if (lastUsage && currentConfig.value) {
        const userStore = useUserStore();
        const userId = userStore.profile?.id || "default";

        await trackAPIUsage(
          userId,
          currentConfig.value.provider,
          currentConfig.value.modelId,
          lastUsage
        );
      }

      isLoading.value = false;
    } catch (err: any) {
      error.value = err.message;
      isLoading.value = false;
      throw err;
    }
  }

  /**
   * 删除会话
   */
  async function deleteSession(sessionId: string) {
    try {
      await db.chatSessions.delete(sessionId);
      await loadSessions();

      if (currentSession.value?.id === sessionId) {
        currentSession.value = null;
      }
    } catch (err: any) {
      error.value = err.message;
      throw err;
    }
  }

  /**
   * 更新会话标题
   */
  async function updateSessionTitle(sessionId: string, title: string) {
    try {
      await db.chatSessions.update(sessionId, {
        title,
        updatedAt: new Date(),
      });
      await loadSessions();

      if (currentSession.value?.id === sessionId) {
        currentSession.value.title = title;
      }
    } catch (err: any) {
      error.value = err.message;
      throw err;
    }
  }

  // ===== Actions - Prompt 管理 =====

  /**
   * 加载 Prompt 模板
   */
  async function loadPrompts() {
    try {
      const dbTemplates = await promptTemplateRepository.getAllTemplates();
      // 过滤并转换类型，确保 id 存在
      promptTemplates.value = dbTemplates
        .filter((t): t is PromptTemplate => t.id !== undefined)
        .map((t) => ({
          ...t,
          id: t.id!,
          type: t.type as PromptTemplate["type"],
        }));
    } catch (err: any) {
      error.value = err.message;
      console.error("Failed to load prompts:", err);
    }
  }

  /**
   * 保存 Prompt 模板
   */
  async function savePrompt(
    template: Omit<PromptTemplate, "id" | "createdAt" | "updatedAt">
  ): Promise<string> {
    try {
      const id = await promptTemplateRepository.saveTemplate(template);
      await loadPrompts();
      return id;
    } catch (err: any) {
      error.value = err.message;
      throw err;
    }
  }

  /**
   * 获取指定类型的 Prompt
   */
  function getPromptByType(type: PromptType): PromptTemplate | undefined {
    return promptTemplates.value.find((p) => p.type === type && p.isDefault);
  }

  /**
   * 设置性格 Prompt
   */
  function setPersonality(
    personality: "strict" | "encouraging" | "humorous" | "academic"
  ) {
    currentPersonalityPrompt.value = PERSONALITY_PROMPTS[personality];
  }

  /**
   * 设置场景 Prompt
   */
  function setScenarioPrompt(prompt: string) {
    currentScenarioPrompt.value = prompt;
  }

  /**
   * 清除场景 Prompt
   */
  function clearScenarioPrompt() {
    currentScenarioPrompt.value = "";
  }

  /**
   * 初始化
   */
  async function initialize() {
    await Promise.all([loadConfigs(), loadSessions(), loadPrompts()]);
  }

  return {
    // State
    configs,
    currentConfig,
    sessions,
    currentSession,
    promptTemplates,
    isLoading,
    error,
    currentBasePrompt,
    currentPersonalityPrompt,
    currentScenarioPrompt,

    // Computed
    hasConfig,
    defaultConfig,
    hasActiveSession,
    fullSystemPrompt,

    // Actions - 配置管理
    loadConfigs,
    saveConfig,
    updateConfig,
    deleteConfig,
    switchConfig,
    testConnection,

    // Actions - 对话管理
    loadSessions,
    createSession,
    switchSession,
    sendMessage,
    sendMessageStream,
    deleteSession,
    updateSessionTitle,

    // Actions - Prompt 管理
    loadPrompts,
    savePrompt,
    getPromptByType,
    setPersonality,
    setScenarioPrompt,
    clearScenarioPrompt,

    // Actions - 初始化
    initialize,
  };
});
