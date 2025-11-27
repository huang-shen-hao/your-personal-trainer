<template>
  <div class="chat-view">
    <!-- 侧边栏：会话列表 -->
    <div
      class="chat-sidebar"
      :class="{ collapsed: sidebarCollapsed, 'is-mobile': isMobile }"
    >
      <!-- 顶部区域：Logo + 折叠按钮 -->
      <div class="sidebar-top">
        <div class="sidebar-logo-wrapper" v-if="!sidebarCollapsed">

          <el-button
            class="collapse-btn-top"
            text
            size="small"
            @click="sidebarCollapsed = !sidebarCollapsed"
          >
            <span class="icon-wrapper" v-html="menuFoldIcon"></span>
          </el-button>
        </div>
        <el-button
          v-else
          class="collapse-btn-top collapsed-only"
          text
          circle
          @click="sidebarCollapsed = !sidebarCollapsed"
        >
          <span class="icon-wrapper" v-html="menuUnfoldIcon"></span>
        </el-button>
      </div>

      <!-- 新对话按钮 -->
      <div class="new-chat-section">
        <button
          @click="createNewSession"
          class="new-chat-btn"
          :class="{ collapsed: sidebarCollapsed }"
        >
          <span class="icon-wrapper" v-html="newChatIcon"></span>
          <span v-if="!sidebarCollapsed" class="btn-text">新聊天</span>
        </button>
      </div>

      <!-- 会话列表区域 -->
      <div class="session-section" v-if="!sidebarCollapsed">
        <div
          class="session-section-header"
          @click="sessionListExpanded = !sessionListExpanded"
        >
          <div class="section-title-wrapper">
            <span class="icon-wrapper small" v-html="chatHistoryIcon"></span>
            <span class="section-title">你的聊天</span>
          </div>
          <ChevronDownIcon
            class="chevron-icon"
            :class="{ expanded: sessionListExpanded }"
          />
        </div>

        <div class="session-list" v-show="sessionListExpanded">
          <div
            v-for="session in aiStore.sessions"
            :key="session.id"
            class="session-item"
            :class="{ active: currentSessionId === session.id }"
            @click="switchSession(session.id)"
          >
            <div class="session-title">{{ session.title }}</div>
            <div class="session-meta">
              {{ formatSessionTime(session.lastMessageAt) }}
            </div>
            <el-button
              class="delete-btn"
              type="danger"
              text
              :icon="TrashIcon"
              size="small"
              @click.stop="deleteSession(session.id)"
            />
          </div>

          <el-empty
            v-if="aiStore.sessions.length === 0"
            description="暂无对话"
            :image-size="80"
          />
        </div>
      </div>

      <!-- 折叠时的历史聊天入口，仅展示图标，保持与其他折叠项一致 -->
      <div
        v-else
        class="session-section collapsed-only"
        @click="openHistoryDialog"
      >
        <div class="history-icon-button" title="历史聊天">
          <span class="icon-wrapper" v-html="chatHistoryIcon"></span>
        </div>
      </div>
    </div>

    <!-- 主聊天区域 -->
    <div class="chat-main">
      <!-- 无配置提示 -->
      <div v-if="!aiStore.hasConfig" class="no-config-warning">
        <el-alert
          title="请先配置 AI 服务"
          type="warning"
          description="您还没有配置 AI API，请前往 AI 配置页面添加您的 API Key"
          show-icon
        >
          <template #default>
            <el-button type="primary" @click="goToConfig"> 前往配置 </el-button>
          </template>
        </el-alert>
      </div>

      <!-- 有配置但无会话 -->
      <div v-else-if="!currentSessionId" class="welcome-screen">
        <div class="welcome-content">
          <h1>👋 你好！我是你的私人健身教练</h1>
          <p>我可以帮你：</p>
          <div class="feature-cards">
            <div class="feature-card">
              <ChatBubbleLeftRightIcon style="width: 32px; height: 32px" />
              <h3>训练指导</h3>
              <p>制定个性化训练计划，解答训练疑问</p>
            </div>
            <div class="feature-card">
              <PhotoIcon style="width: 32px; height: 32px" />
              <h3>图片分析</h3>
              <p>分析饮食、体态和器械照片</p>
            </div>
            <div class="feature-card">
              <ChartBarIcon style="width: 32px; height: 32px" />
              <h3>进度追踪</h3>
              <p>记录和分析你的训练进展</p>
            </div>
          </div>
          <el-button type="primary" size="large" @click="createNewSession">
            开始对话
          </el-button>
        </div>
      </div>

      <!-- 对话区域 -->
      <div v-else class="chat-container">
        <!-- 消息列表 -->
        <div class="message-list" ref="messageListRef">
          <div
            v-for="message in currentMessages"
            :key="message.id"
            class="message-wrapper"
            :class="message.role"
          >
            <div class="message-avatar">
              <el-avatar v-if="message.role === 'user'" :size="36">
                {{ userStore.profile?.nickname?.charAt(0) || "U" }}
              </el-avatar>
              <el-avatar
                v-else
                :size="36"
                :src="aiAvatarUrl"
                :style="aiAvatarUrl ? {} : { backgroundColor: '#409eff' }"
              >
                <ChatBubbleLeftRightIcon
                  v-if="!aiAvatarUrl"
                  style="width: 20px; height: 20px"
                />
              </el-avatar>
            </div>

            <div class="message-content">
              <div class="message-header">
                <span class="message-role">
                  {{
                    message.role === "user"
                      ? userStore.profile?.nickname || "你"
                      : aiDisplayName
                  }}
                </span>
                <span class="message-time">
                  {{ formatMessageTime(message.timestamp) }}
                </span>
              </div>

              <div class="message-body">
                <div v-if="message.role === 'user'" class="user-message">
                  <!-- 处理纯文本消息 -->
                  <template v-if="typeof message.content === 'string'">
                    {{ message.content }}
                  </template>

                  <!-- 处理多模态消息（文本+图片） -->
                  <template v-else-if="Array.isArray(message.content)">
                    <div class="multimodal-content">
                      <template
                        v-for="(item, idx) in message.content"
                        :key="idx"
                      >
                        <!-- 文本内容 -->
                        <div
                          v-if="
                            typeof item === 'object' && item.type === 'text'
                          "
                          class="text-content"
                        >
                          {{ item.text }}
                        </div>

                        <!-- 图片内容 -->
                        <div
                          v-else-if="
                            typeof item === 'object' &&
                            item.type === 'image_url'
                          "
                          class="image-content"
                        >
                          <el-image
                            :src="item.image_url.url"
                            :preview-src-list="[item.image_url.url]"
                            :initial-index="0"
                            fit="contain"
                            class="uploaded-image"
                            preview-teleported
                          >
                            <template #error>
                              <div class="image-error">
                                <PhotoIcon style="width: 20px; height: 20px" />
                                <span>图片加载失败</span>
                              </div>
                            </template>
                          </el-image>
                        </div>

                        <!-- 纯字符串内容 -->
                        <div
                          v-else-if="typeof item === 'string'"
                          class="text-content"
                        >
                          {{ item }}
                        </div>
                      </template>
                    </div>
                  </template>

                  <!-- 兜底：显示 JSON -->
                  <template v-else>
                    {{ JSON.stringify(message.content) }}
                  </template>
                </div>
                <MarkdownRenderer
                  v-else
                  :content="
                    typeof message.content === 'string'
                      ? message.content
                      : JSON.stringify(message.content)
                  "
                />
              </div>
            </div>
          </div>

          <!-- 流式输出中的消息 -->
          <div
            v-if="isStreaming && streamingMessage"
            class="message-wrapper assistant"
          >
            <div class="message-avatar">
              <el-avatar
                :size="36"
                :src="aiAvatarUrl"
                :style="aiAvatarUrl ? {} : { backgroundColor: '#409eff' }"
              >
                <ChatBubbleLeftRightIcon
                  v-if="!aiAvatarUrl"
                  style="width: 20px; height: 20px"
                />
              </el-avatar>
            </div>
            <div class="message-content">
              <div class="message-header">
                <span class="message-role">{{ aiDisplayName }}</span>
                <span class="message-time">正在输入...</span>
              </div>
              <div class="message-body">
                <MarkdownRenderer :content="streamingMessage" />
                <span class="typing-indicator">▋</span>
              </div>
            </div>
          </div>

          <!-- 加载指示器 -->
          <div
            v-if="aiStore.isLoading && !isStreaming"
            class="loading-indicator"
          >
            <ArrowPathIcon
              style="width: 20px; height: 20px"
              class="is-loading"
            />
            <span>AI 正在思考...</span>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="input-area">
          <!-- 图片预览 -->
          <div v-if="imagePreviewUrls.length > 0" class="image-preview-list">
            <div
              v-for="(url, index) in imagePreviewUrls"
              :key="index"
              class="image-preview-item"
            >
              <img :src="url" alt="预览图" />
              <el-button
                class="remove-btn"
                type="danger"
                :icon="TrashIcon"
                size="small"
                circle
                @click="removeImage(index)"
              />
            </div>
          </div>

          <el-input
            v-model="inputMessage"
            type="textarea"
            :rows="3"
            placeholder="输入你的问题..."
            @keydown.enter.exact.prevent="sendMessage"
            :disabled="aiStore.isLoading"
          />

          <!-- 隐藏的文件输入 -->
          <input
            ref="fileInputRef"
            type="file"
            accept="image/*"
            multiple
            style="display: none"
            @change="handleFileSelect"
          />

          <div class="input-actions">
            <div class="left-actions">
              <el-button :icon="PhotoIcon" @click="uploadImage">
                上传图片
              </el-button>
              <el-switch
                v-model="enableContext"
                active-text="注入上下文"
                inactive-text=""
              />
            </div>
            <el-button
              type="primary"
              :icon="PaperAirplaneIcon"
              @click="sendMessage"
              :loading="aiStore.isLoading"
              :disabled="!inputMessage.trim()"
            >
              发送
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 历史聊天记录弹窗 -->
    <el-dialog
      v-model="historyDialogVisible"
      title="历史聊天记录"
      width="480px"
      class="history-dialog"
    >
      <div class="history-list">
        <div
          v-for="session in aiStore.sessions"
          :key="session.id"
          class="history-item"
          :class="{ active: currentSessionId === session.id }"
          @click="handleHistorySelect(session.id)"
        >
          <div class="history-title">{{ session.title }}</div>
          <div class="history-meta">
            {{ formatSessionTime(session.lastMessageAt) }}
          </div>
        </div>

        <el-empty
          v-if="aiStore.sessions.length === 0"
          description="暂无对话"
          :image-size="80"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  TrashIcon,
  ChatBubbleLeftRightIcon,
  PhotoIcon,
  ChartBarIcon,
  ArrowPathIcon,
  PaperAirplaneIcon,
  ChevronDownIcon,
} from "@heroicons/vue/24/outline";
import logo from "@/assets/images/logo.svg";
import menuFoldIcon from "@/assets/images/menu-fold.svg?raw";
import menuUnfoldIcon from "@/assets/images/menu-unfold.svg?raw";
import newChatIcon from "@/assets/images/new_chat.svg?raw";
import chatHistoryIcon from "@/assets/images/chat-history.svg?raw";
import { useAIStore } from "@/stores/ai";
import { useUserStore } from "@/stores/user";
import MarkdownRenderer from "@/components/MarkdownRenderer.vue";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/zh-cn";

dayjs.extend(relativeTime);
dayjs.locale("zh-cn");

const router = useRouter();
const aiStore = useAIStore();
const userStore = useUserStore();

// ===== State =====
const sidebarCollapsed = ref(false);
const sessionListExpanded = ref(true);
const historyDialogVisible = ref(false);
const currentSessionId = ref<string | null>(null);
const inputMessage = ref("");
const enableContext = ref(true);
const messageListRef = ref<HTMLElement>();
const isStreaming = ref(false);
const streamingMessage = ref("");
const uploadedImages = ref<string[]>([]);
const imagePreviewUrls = ref<string[]>([]);
const fileInputRef = ref<HTMLInputElement>();

// 窗口宽度状态
const windowWidth = ref(
  typeof window !== "undefined" ? window.innerWidth : 1024
);

// 判断是否为移动端
const isMobile = computed(() => {
  return windowWidth.value < 768;
});

// 监听窗口大小变化
function handleResize() {
  windowWidth.value = window.innerWidth;
  // 从移动端切换到PC端时，重置侧边栏状态
  if (windowWidth.value >= 768 && sidebarCollapsed.value) {
    // PC端默认展开侧边栏
    sidebarCollapsed.value = false;
  }
}

// ===== Computed =====
const currentMessages = computed(() => {
  if (!currentSessionId.value || !aiStore.currentSession) {
    return [];
  }
  return aiStore.currentSession.messages || [];
});

// AI 头像和名字
const aiAvatarUrl = computed(() => {
  return aiStore.currentConfig?.avatarUrl || "";
});

const aiDisplayName = computed(() => {
  return aiStore.currentConfig?.displayName || "AI 教练";
});

// ===== Methods =====
function formatSessionTime(date: Date): string {
  return dayjs(date).fromNow();
}

function formatMessageTime(date: Date): string {
  return dayjs(date).format("HH:mm");
}

async function createNewSession() {
  try {
    const id = await aiStore.createSession();
    currentSessionId.value = id;
  } catch (error: any) {
    ElMessage.error(error.message || "创建会话失败");
  }
}

async function switchSession(sessionId: string) {
  try {
    await aiStore.switchSession(sessionId);
    currentSessionId.value = sessionId;
    scrollToBottom();
  } catch (error: any) {
    ElMessage.error(error.message || "切换会话失败");
  }
}

function openHistoryDialog() {
  historyDialogVisible.value = true;
}

async function handleHistorySelect(sessionId: string) {
  await switchSession(sessionId);
  historyDialogVisible.value = false;
}

async function deleteSession(sessionId: string) {
  try {
    await ElMessageBox.confirm("确定要删除这个对话吗？", "确认删除", {
      confirmButtonText: "删除",
      cancelButtonText: "取消",
      type: "warning",
    });

    await aiStore.deleteSession(sessionId);

    if (currentSessionId.value === sessionId) {
      currentSessionId.value = null;
    }

    ElMessage.success("对话已删除");
  } catch (error) {
    // 用户取消
  }
}

async function sendMessage() {
  if (!inputMessage.value.trim() || !currentSessionId.value) {
    return;
  }

  const message = inputMessage.value.trim();
  const images = uploadedImages.value.slice();

  // 清空输入
  inputMessage.value = "";
  uploadedImages.value = [];
  clearImagePreviews();

  try {
    // 构建 system prompt
    let systemPrompt = "";

    // 1. 获取基础身份 prompt
    const basePrompt = aiStore.getPromptByType("base");
    if (basePrompt) {
      let basePromptContent = basePrompt.content;
      // 替换 AI 教练名称
      const coachName = aiStore.currentConfig?.displayName || "AI 教练";
      basePromptContent = basePromptContent.replace(
        /\{displayName\}/g,
        coachName
      );
      systemPrompt = basePromptContent;
    }

    // 2. 获取性格 prompt（从用户档案中读取 coachPersonality）
    const personality = userStore.profile?.coachPersonality;
    if (personality) {
      // 使用预设的性格 prompt
      const personalityPrompt = aiStore.promptTemplates.find(
        (p) => p.type === personality
      );
      console.log("personalityPrompt", personality, aiStore.promptTemplates);
      if (personalityPrompt) {
        systemPrompt += "\n\n" + personalityPrompt.content;
      }
    }

    // 3. 根据 enableContext 决定是否注入用户上下文
    if (enableContext.value && userStore.profile) {
      const { buildFullContext } = await import("@/utils/contextBuilder");
      const bodyMetricsRepo = await import(
        "@/db/repositories/bodyMetricsRepository"
      );
      const planRepo = await import("@/db/repositories/planRepository");

      try {
        // 获取相关数据 - 使用当前用户的ID
        const userId = userStore.profile.id;
        const allMetrics =
          await bodyMetricsRepo.bodyMetricsRepository.getAllMetrics(userId);
        const activePlan = await planRepo.planRepository.getActivePlan(userId);

        // 转换 UserProfile 到 User 类型
        const dbUser = {
          id: userStore.profile.id,
          nickname: userStore.profile.nickname,
          realName: userStore.profile.realName,
          gender: userStore.profile.gender,
          birthYear: userStore.profile.birthYear,
          height: userStore.profile.height,
          currentWeight: userStore.profile.currentWeight,
          experienceLevel: userStore.profile.experienceLevel,
          goals: userStore.profile.goals,
          injuries:
            userStore.profile.injuries?.map((injury) => injury.description) ||
            [],
          equipment: userStore.profile.equipment,
          location: userStore.profile.location,
          weeklyTrainingDays: userStore.profile.weeklyTrainingDays,
          preferredSessionDuration: userStore.profile.preferredSessionDuration,
          coachPersonality: userStore.profile.coachPersonality,
          customPrompt: userStore.profile.customPrompt,
          createdAt: userStore.profile.createdAt,
          updatedAt: userStore.profile.updatedAt,
        };

        const contextData = {
          user: dbUser,
          bodyMetrics: allMetrics,
          trainingPlan: activePlan || undefined,
        };

        const userContext = await buildFullContext(
          {
            includeUserProfile: true,
            includeBodyMetrics: allMetrics.length > 0,
            includeTrainingPlan: !!activePlan,
            includeWorkoutHistory: false,
          },
          contextData
        );

        if (userContext) {
          systemPrompt += "\n\n" + userContext;
        }
      } catch (err) {
        console.warn("Failed to build context:", err);
      }
    }

    // 使用流式响应
    isStreaming.value = true;
    streamingMessage.value = "";

    await aiStore.sendMessageStream(
      message,
      systemPrompt,
      (chunk: string) => {
        streamingMessage.value += chunk;
        scrollToBottom();
      },
      images
    );

    isStreaming.value = false;
    streamingMessage.value = "";
    scrollToBottom();
  } catch (error: any) {
    isStreaming.value = false;
    streamingMessage.value = "";
    ElMessage.error(error.message || "发送失败");
  }
}

function uploadImage() {
  fileInputRef.value?.click();
}

async function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  const files = target.files;

  if (!files || files.length === 0) return;

  const { validateImageFile, fileToBase64 } = await import(
    "@/utils/imageUtils"
  );

  for (const file of Array.from(files)) {
    // 验证文件
    const validation = validateImageFile(file);
    if (!validation.valid) {
      ElMessage.error(validation.error || "无效的图片文件");
      continue;
    }

    try {
      // 转换为 base64
      const base64 = await fileToBase64(file);
      uploadedImages.value.push(base64);

      // 创建预览 URL
      const previewUrl = URL.createObjectURL(file);
      imagePreviewUrls.value.push(previewUrl);
    } catch (error) {
      console.error("Failed to process image:", error);
      ElMessage.error("图片处理失败");
    }
  }

  // 清空 input
  target.value = "";
}

function removeImage(index: number) {
  // 释放预览 URL
  if (imagePreviewUrls.value[index]) {
    URL.revokeObjectURL(imagePreviewUrls.value[index]);
  }

  uploadedImages.value.splice(index, 1);
  imagePreviewUrls.value.splice(index, 1);
}

function clearImagePreviews() {
  // 释放所有预览 URL
  imagePreviewUrls.value.forEach((url) => URL.revokeObjectURL(url));
  imagePreviewUrls.value = [];
}

function goToConfig() {
  router.push("/ai-config");
}

function scrollToBottom() {
  nextTick(() => {
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight;
    }
  });
}

// ===== Lifecycle =====
onMounted(async () => {
  await aiStore.initialize();

  // 如果有会话，选择最新的一个
  if (aiStore.sessions.length > 0) {
    currentSessionId.value = aiStore.sessions[0].id;
    await aiStore.switchSession(currentSessionId.value);
  }

  // 监听窗口大小变化
  window.addEventListener("resize", handleResize);
  // 初始化时检查一次
  handleResize();
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
});

// 监听消息变化，自动滚动到底部
watch(
  currentMessages,
  () => {
    scrollToBottom();
  },
  { deep: true }
);
</script>

<style scoped lang="scss">
@import "@/styles/variables.scss";

.chat-view {
  display: flex;
  height: calc(100vh - 92px);
  background-color: $--bg-color-base;
}

.chat-sidebar {
  width: 280px;
  background-color: $--bg-color-card;

  display: flex;
  flex-direction: column;
  transition:
    width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;

  &.collapsed {
    width: 64px;
  }

  // PC端：不使用绝对定位
  &:not(.is-mobile) {
    position: relative;
    transform: none !important;
  }

  // 顶部区域：Logo + 折叠按钮
  .sidebar-top {
    padding: 16px;
    display: flex;
    align-items: center;
    min-height: 60px;

    .sidebar-logo-wrapper {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;

      .logo-img {
        width: 28px;
        height: 28px;
        flex-shrink: 0;
      }

      .collapse-btn-top {
        padding: 6px;
        color: $--text-color-secondary;
        transition: $--transition-base;
        border-radius: 6px;
        margin-left: auto;

        .icon-wrapper {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;

          :deep(svg) {
            width: 16px;
            height: 16px;
            fill: currentColor;
          }
        }

        &:hover {
          color: $--text-color-primary;
        }
      }
    }

    .collapse-btn-top.collapsed-only {
      width: 100%;
      display: flex;
      justify-content: center;
      color: $--text-color-secondary;

      .icon-wrapper {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        height: 18px;

        :deep(svg) {
          width: 18px;
          height: 18px;
          fill: currentColor;
        }
      }

      &:hover {
        color: $--text-color-primary;
        background-color: $--bg-color-hover;
      }
    }
  }

  // 新聊天按钮区域
  .new-chat-section {
    padding: 12px 16px;

    .new-chat-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 10px;

      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      color: $--text-color-primary;
      background-color: transparent;
      cursor: pointer;
      transition: $--transition-base;

      .icon-wrapper {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        width: 16px;
        height: 16px;
        color: $--text-color-secondary;

        :deep(svg) {
          width: 16px;
          height: 16px;
          fill: currentColor;
        }
      }

      .btn-text {
        flex: 1;
        text-align: left;
      }

      &:hover {
        .icon-wrapper {
          color: $--text-color-primary;
        }
      }

      &.collapsed {
        justify-content: center;
        padding: 10px;
        width: 100%;

        .icon-wrapper {
          width: 18px;
          height: 18px;

          :deep(svg) {
            width: 18px;
            height: 18px;
          }
        }
      }
    }
  }

  // 会话列表区域
  .session-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .session-section-header {
      padding: 12px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      user-select: none;
      transition: $--transition-base;

      .section-title-wrapper {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .icon-wrapper.small {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
        color: $--text-color-secondary;

        :deep(svg) {
          width: 16px;
          height: 16px;
        }
      }

      .section-title {
        font-size: 13px;
        font-weight: 600;
        color: $--text-color-primary;
        letter-spacing: 0.01em;
      }

      .chevron-icon {
        width: 16px;
        height: 16px;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        color: $--text-color-secondary;
        flex-shrink: 0;

        &.expanded {
          transform: rotate(180deg);
        }
      }
    }

    .session-list {
      flex: 1;
      overflow-y: auto;
      padding: 0;
      margin-top: 0;
    }

    &.collapsed-only {
      // 折叠态下不占满整个高度，避免图标被垂直居中“掉下去”
      flex: 0 0 auto;
      padding: 8px 0 0;
      display: flex;
      justify-content: flex-start;
      align-items: center;

      .history-icon-button {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: $--transition-base;
        color: $--text-color-secondary;

        .icon-wrapper {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          color: $--text-color-secondary;

          :deep(svg) {
            width: 18px;
            height: 18px;
            fill: currentColor;
          }
        }

        // hover 效果与 .new-chat-btn 一致：仅图标颜色从次要色变为主要色
        &:hover {
          .icon-wrapper {
            color: $--text-color-primary;
          }
        }
      }
    }
  }

  .session-item {
    padding: 10px 16px;
    border-radius: 0;
    cursor: pointer;
    margin: 0;
    position: relative;
    transition: $--transition-base;

    &:hover {
      .delete-btn {
        opacity: 1;
      }
    }

    .session-title {
      font-weight: 400;
      margin-bottom: 2px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: $--text-color-primary;
      font-size: 14px;
      line-height: 1.5;
    }

    .session-meta {
      font-size: 12px;
      color: $--text-color-secondary;
      line-height: 1.4;
    }

    .delete-btn {
      position: absolute;
      top: 50%;
      right: 12px;
      transform: translateY(-50%);
      opacity: 0;
      transition: $--transition-fast;
      padding: 4px;
    }
  }
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: $--bg-color-base;
}

.no-config-warning,
.welcome-screen {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $--el-spacing-lg;
}

.welcome-content {
  text-align: center;
  max-width: 800px;

  h1 {
    font-size: $--el-font-size-xxl;
    margin-bottom: $--el-spacing-md;
    color: $--text-color-primary;
    font-weight: 600;
  }

  p {
    font-size: $--el-font-size-xl;
    color: $--text-color-secondary;
    margin-bottom: $--el-spacing-xl;
  }

  .feature-cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: $--el-spacing-lg;
    margin-bottom: $--el-spacing-xl;
  }

  .feature-card {
    padding: $--el-spacing-lg;
    background-color: $--bg-color-card;
    border-radius: $--el-border-radius-base;
    border: 1px solid $--border-color-light;
    box-shadow: $--el-box-shadow-card;
    transition: $--transition-base;

    &:hover {
      transform: translateY(-4px);
      box-shadow: $--el-box-shadow-light;
      border-color: $--el-color-primary-light;
    }

    h3 {
      margin: $--el-spacing-sm 0 $--el-spacing-sm 0;
      color: $--text-color-primary;
      font-weight: 600;
    }

    p {
      font-size: $--el-font-size-base;
      margin: 0;
      color: $--text-color-regular;
    }
  }
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: $--el-spacing-lg;
  background-color: $--bg-color-base;
}

.message-wrapper {
  display: flex;
  margin-bottom: $--el-spacing-lg;
  animation: fadeIn 0.3s;

  &.user {
    flex-direction: row-reverse;

    .message-content {
      align-items: flex-end;
    }

    .user-message {
      background-color: $--el-color-primary;
      color: white;
      border-radius: $--el-border-radius-base $--el-border-radius-base 0
        $--el-border-radius-base;
    }
  }

  &.assistant {
    .message-body {
      background-color: $--bg-color-card;
      border: 1px solid $--border-color-light;
      border-radius: $--el-border-radius-base $--el-border-radius-base
        $--el-border-radius-base 0;
      box-shadow: $--el-box-shadow-card;
    }
  }

  .message-avatar {
    margin: 0 $--el-spacing-sm;
  }

  .message-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    max-width: 70%;
  }

  .message-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $--el-spacing-sm;

    .message-role {
      font-weight: 600;
      font-size: $--el-font-size-base;
      color: $--text-color-primary;
    }

    .message-time {
      font-size: $--el-font-size-small;
      color: $--text-color-secondary;
    }
  }

  .message-body {
    padding: $--el-spacing-sm $--el-spacing-md;
  }

  .user-message {
    padding: $--el-spacing-sm $--el-spacing-md;

    .multimodal-content {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .text-content {
        word-break: break-word;
      }

      .image-content {
        .uploaded-image {
          max-width: 100%;
          max-height: 300px;
          border-radius: 8px;
          overflow: hidden;
          background-color: rgba(255, 255, 255, 0.1);
          cursor: pointer;

          :deep(img) {
            width: 100%;
            height: 100%;
            object-fit: contain;
            transition: transform 0.2s;

            &:hover {
              transform: scale(1.02);
            }
          }
        }

        .image-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
          color: rgba(255, 255, 255, 0.6);
          background-color: rgba(255, 255, 255, 0.05);
          border-radius: 8px;

          svg {
            width: 32px;
            height: 32px;
            margin-bottom: 8px;
          }

          span {
            font-size: 14px;
          }
        }
      }
    }
  }

  .typing-indicator {
    animation: blink 1s infinite;
  }
}

.loading-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  color: var(--el-text-color-secondary);

  svg {
    margin-right: 8px;
    width: 20px;
    height: 20px;
  }
}

.input-area {
  border-top: 1px solid $--border-color-light;
  padding: $--el-spacing-md $--el-spacing-lg;
  background-color: $--bg-color-card;

  .image-preview-list {
    display: flex;
    gap: $--el-spacing-sm;
    margin-bottom: $--el-spacing-sm;
    flex-wrap: wrap;

    .image-preview-item {
      position: relative;
      width: 100px;
      height: 100px;
      border-radius: $--el-border-radius-base;
      overflow: hidden;
      border: 2px solid $--border-color-light;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .remove-btn {
        position: absolute;
        top: 4px;
        right: 4px;
        opacity: 0;
        transition: opacity 0.2s;
      }

      &:hover .remove-btn {
        opacity: 1;
      }
    }
  }

  .input-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: $--el-spacing-sm;

    .left-actions {
      display: flex;
      gap: $--el-spacing-sm;
      align-items: center;
    }
  }
}

.history-dialog {
  .history-list {
    max-height: 420px;
    overflow-y: auto;
  }

  .history-item {
    padding: 10px 12px;
    border-radius: $--el-border-radius-base;
    cursor: pointer;
    transition: $--transition-base;
    margin-bottom: 6px;
    border: 1px solid transparent;

    .history-title {
      font-size: 14px;
      font-weight: 500;
      color: $--text-color-primary;
      margin-bottom: 2px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .history-meta {
      font-size: 12px;
      color: $--text-color-secondary;
    }

    &:hover {
      background-color: $--bg-color-hover;
      border-color: $--border-color-light;
    }

    &.active {
      background-color: $--el-color-primary-lighter;
      border-color: $--el-color-primary;

      .history-title {
        color: $--el-color-primary;
      }
    }
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

@media (max-width: 768px) {
  .chat-view {
    height: calc(100vh - 52px);
  }

  .chat-sidebar {
    &.is-mobile {
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      z-index: 100;
      background-color: $--bg-color-card;

      &.collapsed {
        transform: translateX(-100%);
      }
    }
  }

  .welcome-content {
    padding: $--el-spacing-md;

    h1 {
      font-size: $--el-font-size-xl;
    }

    p {
      font-size: $--el-font-size-large;
    }

    .feature-cards {
      grid-template-columns: 1fr;
      gap: $--el-spacing-md;
    }
  }

  .message-wrapper .message-content {
    max-width: 85%;
  }

  .message-list {
    padding: $--el-spacing-md;
  }

  .input-area {
    padding: $--el-spacing-sm $--el-spacing-md;
  }
}
</style>
