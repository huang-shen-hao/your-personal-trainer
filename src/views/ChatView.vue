<template>
  <div class="chat-view">
    <!-- 侧边栏：会话列表 -->
    <div class="chat-sidebar" :class="{ collapsed: sidebarCollapsed, 'is-mobile': isMobile }">
      <div class="sidebar-header">
        <h3 v-if="!sidebarCollapsed">对话历史</h3>
        <el-button
          @click="createNewSession"
          type="primary"
          :icon="PlusIcon"
          :circle="sidebarCollapsed"
        >
          {{ sidebarCollapsed ? "" : "新对话" }}
        </el-button>
      </div>

      <div class="session-list" v-if="!sidebarCollapsed">
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

      <div class="sidebar-toggle" @click="sidebarCollapsed = !sidebarCollapsed">
        <ArrowRightIcon v-if="sidebarCollapsed" style="width: 20px; height: 20px;" />
        <ArrowLeftIcon v-else style="width: 20px; height: 20px;" />
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
              <ChatBubbleLeftRightIcon style="width: 32px; height: 32px;" />
              <h3>训练指导</h3>
              <p>制定个性化训练计划，解答训练疑问</p>
            </div>
            <div class="feature-card">
              <PhotoIcon style="width: 32px; height: 32px;" />
              <h3>图片分析</h3>
              <p>分析饮食、体态和器械照片</p>
            </div>
            <div class="feature-card">
              <ChartBarIcon style="width: 32px; height: 32px;" />
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
                :style="{ backgroundColor: '#409eff' }"
              >
                <ChatBubbleLeftRightIcon style="width: 20px; height: 20px;" />
              </el-avatar>
            </div>

            <div class="message-content">
              <div class="message-header">
                <span class="message-role">
                  {{
                    message.role === "user"
                      ? userStore.profile?.nickname || "你"
                      : "AI 教练"
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
                                <PhotoIcon style="width: 20px; height: 20px;" />
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
              <el-avatar :size="36" :style="{ backgroundColor: '#409eff' }">
                <ChatBubbleLeftRightIcon style="width: 20px; height: 20px;" />
              </el-avatar>
            </div>
            <div class="message-content">
              <div class="message-header">
                <span class="message-role">AI 教练</span>
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
            <ArrowPathIcon style="width: 20px; height: 20px;" class="is-loading" />
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  PlusIcon,
  TrashIcon,
  ChatBubbleLeftRightIcon,
  PhotoIcon,
  ChartBarIcon,
  ArrowPathIcon,
  PaperAirplaneIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from "@heroicons/vue/24/outline";
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
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024);

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
      systemPrompt = basePrompt.content;
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
  window.addEventListener('resize', handleResize);
  // 初始化时检查一次
  handleResize();
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
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
@import '@/styles/variables.scss';

.chat-view {
  display: flex;
  height: calc(100vh - 56px);
  background-color: $--bg-color-base;
}

.chat-sidebar {
  width: 260px;
  border-right: 1px solid $--border-color-light;
  background-color: $--bg-color-card;
  display: flex;
  flex-direction: column;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  box-shadow: 1px 0 2px 0 rgba(0, 0, 0, 0.02);

  &.collapsed {
    width: 60px;
  }

  // PC端：不使用绝对定位
  &:not(.is-mobile) {
    position: relative;
    transform: none !important;
  }

  .sidebar-header {
    padding: $--el-spacing-md;
    border-bottom: 1px solid $--border-color-light;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: $--bg-color-card;

    h3 {
      margin: 0;
      font-size: $--el-font-size-large;
      font-weight: 600;
      color: $--text-color-primary;
    }
  }

  .session-list {
    flex: 1;
    overflow-y: auto;
    padding: $--el-spacing-sm;
  }

  .session-item {
    padding: $--el-spacing-sm;
    border-radius: $--el-border-radius-base;
    cursor: pointer;
    margin-bottom: $--el-spacing-sm;
    position: relative;
    transition: $--transition-base;

    &:hover {
      background-color: $--bg-color-hover;

      .delete-btn {
        opacity: 1;
      }
    }

    &.active {
      background-color: $--el-color-primary-lighter;
      border-left: 3px solid $--el-color-primary;
    }

    .session-title {
      font-weight: 500;
      margin-bottom: $--el-spacing-xs;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: $--text-color-primary;
      font-size: $--el-font-size-base;
    }

    .session-meta {
      font-size: $--el-font-size-small;
      color: $--text-color-secondary;
    }

    .delete-btn {
      position: absolute;
      top: $--el-spacing-sm;
      right: $--el-spacing-sm;
      opacity: 0;
      transition: $--transition-fast;
    }
  }

  .sidebar-toggle {
    padding: $--el-spacing-sm;
    text-align: center;
    cursor: pointer;
    border-top: 1px solid $--border-color-light;
    transition: $--transition-base;

    &:hover {
      background-color: $--bg-color-hover;
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
      border-radius: $--el-border-radius-base $--el-border-radius-base 0 $--el-border-radius-base;
    }
  }

  &.assistant {
    .message-body {
      background-color: $--bg-color-card;
      border: 1px solid $--border-color-light;
      border-radius: $--el-border-radius-base $--el-border-radius-base $--el-border-radius-base 0;
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
