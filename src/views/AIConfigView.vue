<template>
  <div class="ai-config-view">
    <el-card class="config-header">
      <h2>AI 配置管理</h2>
      <p class="subtitle">配置您的 AI 服务提供商和 API 密钥</p>
    </el-card>

    <!-- 现有配置列表 -->
    <el-card class="config-list" v-if="aiStore.configs.length > 0">
      <div class="list-header">
        <h3>已配置的服务</h3>
        <el-button type="primary" @click="showAddDialog = true">
          <PlusIcon style="width: 20px; height: 20px;" />
          添加配置
        </el-button>
      </div>

      <el-table :data="aiStore.configs" style="width: 100%">
        <el-table-column label="提供商" width="150">
          <template #default="{ row }">
            <el-tag :type="getProviderTagType(row.provider)">
              {{ getProviderName(row.provider) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="模型" prop="model" />

        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.isDefault" type="success">默认</el-tag>
            <el-tag v-else type="info">备用</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="220">
          <template #default="{ row }">
            <el-button-group>
              <el-button size="small" @click="testConfig(row)">
                <LinkIcon style="width: 20px; height: 20px;" />
                测试
              </el-button>
              <el-button
                size="small"
                v-if="!row.isDefault"
                @click="setAsDefault(row.id)"
              >
                设为默认
              </el-button>
              <el-button
                size="small"
                type="danger"
                @click="deleteConfig(row.id)"
              >
                <TrashIcon style="width: 20px; height: 20px;" />
              </el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 空状态 -->
    <el-empty v-else description="还没有配置 AI 服务">
      <el-button type="primary" @click="showAddDialog = true">
        <PlusIcon style="width: 20px; height: 20px;" />
        添加第一个配置
      </el-button>
    </el-empty>

    <!-- 添加/编辑配置对话框 -->
    <el-dialog v-model="showAddDialog" title="添加 AI 配置" width="600px">
      <el-form
        ref="configFormRef"
        :model="configForm"
        :rules="configRules"
        label-width="120px"
      >
        <el-form-item label="AI 提供商" prop="provider">
          <el-select
            v-model="configForm.provider"
            placeholder="选择 AI 提供商"
            @change="onProviderChange"
            style="width: 100%"
          >
            <el-option
              v-for="(info, key) in AI_PROVIDERS"
              :key="key"
              :label="info.name"
              :value="key"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="模型" prop="model">
          <el-select
            v-model="configForm.model"
            placeholder="选择模型"
            style="width: 100%"
          >
            <el-option
              v-for="model in availableModels"
              :key="model.id"
              :label="model.name"
              :value="model.id"
            >
              <span>{{ model.name }}</span>
              <span style="float: right; color: #8492a6; font-size: 13px">
                <el-tag v-if="model.supportsVision" size="small" type="success"
                  >支持图片</el-tag
                >
                <el-tag v-if="model.supportsStreaming" size="small" type="info"
                  >流式</el-tag
                >
              </span>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="API Key" prop="apiKey">
          <el-input
            v-model="configForm.apiKey"
            type="password"
            show-password
            placeholder="输入您的 API Key"
          />
          <div class="form-hint">
            您的 API Key 将被加密存储在本地，不会上传到任何服务器
          </div>
        </el-form-item>

        <el-form-item label="API 端点" prop="baseURL">
          <el-input
            v-model="configForm.baseURL"
            placeholder="可选，默认使用官方端点"
          />
          <div class="form-hint">如使用代理或第三方服务，可自定义 API 端点</div>
        </el-form-item>

        <el-form-item label="代理模式" prop="useProxy">
          <el-switch v-model="configForm.useProxy" />
          <div class="form-hint">
            启用后，API Key 将嵌入到 URL 路径中（如
            http://localhost:5173/sk-xxx/chat/completions），不通过
            Authorization Header 传递
          </div>
        </el-form-item>

        <el-form-item label="温度参数" prop="temperature">
          <el-slider
            v-model="configForm.temperature"
            :min="0"
            :max="2"
            :step="0.1"
            show-input
          />
          <div class="form-hint">
            较低的值让输出更确定，较高的值让输出更随机多样
          </div>
        </el-form-item>

        <el-form-item label="最大Token数" prop="maxTokens">
          <el-input-number
            v-model="configForm.maxTokens"
            :min="100"
            :max="8000"
            :step="100"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="设为默认">
          <el-switch v-model="configForm.isDefault" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="saveConfig" :loading="saving">
          保存配置
        </el-button>
      </template>
    </el-dialog>

    <!-- 使用统计 -->
    <el-card class="usage-stats" v-if="aiStore.configs.length > 0">
      <h3>使用统计（最近30天）</h3>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="请求次数">
          {{ usageStats.totalRequests }}
        </el-descriptions-item>
        <el-descriptions-item label="Token 消耗">
          {{ usageStats.totalTokens.toLocaleString() }}
        </el-descriptions-item>
        <el-descriptions-item label="预估费用">
          {{ formatCost(usageStats.totalCost) }}
        </el-descriptions-item>
        <el-descriptions-item label="当前模型">
          {{ aiStore.currentConfig?.modelId || "-" }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import {
  ElMessage,
  ElMessageBox,
  type FormInstance,
  type FormRules,
} from "element-plus";
import { PlusIcon, TrashIcon, LinkIcon } from "@heroicons/vue/24/outline";
import { useAIStore } from "@/stores/ai";
import { useUserStore } from "@/stores/user";
import { AI_PROVIDERS, type AIProvider } from "@/types/ai";
import { getUsageStats, formatCost } from "@/utils/apiUsageTracker";
import dayjs from "dayjs";

const aiStore = useAIStore();
const userStore = useUserStore();

// ===== State =====
const showAddDialog = ref(false);
const configFormRef = ref<FormInstance>();
const saving = ref(false);
const usageStats = ref({
  totalRequests: 0,
  totalTokens: 0,
  totalCost: 0,
});

const configForm = reactive({
  provider: "deepseek" as AIProvider,
  model: "",
  apiKey: "",
  baseURL: "",
  useProxy: false,
  temperature: 0.7,
  maxTokens: 4096,
  isDefault: false,
});

const configRules: FormRules = {
  provider: [
    { required: true, message: "请选择 AI 提供商", trigger: "change" },
  ],
  model: [{ required: true, message: "请选择模型", trigger: "change" }],
  apiKey: [{ required: true, message: "请输入 API Key", trigger: "blur" }],
};

// ===== Computed =====
const availableModels = computed(() => {
  return AI_PROVIDERS[configForm.provider]?.models || [];
});

// ===== Methods =====
function getProviderName(provider: AIProvider): string {
  return AI_PROVIDERS[provider]?.name || provider;
}

function getProviderTagType(provider: AIProvider): string {
  const typeMap: Record<string, string> = {
    openai: "success",
    anthropic: "warning",
    deepseek: "info",
    qwen: "primary",
    default: "info",
  };
  return typeMap[provider] || typeMap.default;
}

function formatDate(date: Date): string {
  return dayjs(date).format("YYYY-MM-DD HH:mm");
}

function onProviderChange() {
  // 重置模型选择
  const models = availableModels.value;
  if (models.length > 0) {
    configForm.model = models[0].id;
  }
}

async function saveConfig() {
  if (!configFormRef.value) return;

  try {
    await configFormRef.value.validate();
    saving.value = true;

    await aiStore.saveConfig({
      provider: configForm.provider,
      model: configForm.model,
      apiKey: configForm.apiKey,
      apiEndpoint: configForm.baseURL || undefined,
      useProxy: configForm.useProxy,
      temperature: configForm.temperature,
      maxTokens: configForm.maxTokens,
      isDefault: configForm.isDefault,
    } as any);

    ElMessage.success("配置保存成功");
    showAddDialog.value = false;
    resetForm();
  } catch (error: any) {
    ElMessage.error(error.message || "保存失败");
  } finally {
    saving.value = false;
  }
}

async function testConfig(config: any) {
  try {
    ElMessage.info("正在测试连接...");
    const result = await aiStore.testConnection(config);

    if (result) {
      ElMessage.success("连接测试成功！");
    } else {
      ElMessage.error("连接测试失败，请检查配置");
    }
  } catch (error: any) {
    ElMessage.error(error.message || "测试失败");
  }
}

async function setAsDefault(configId: string) {
  try {
    await aiStore.updateConfig(configId, { isDefault: true });
    ElMessage.success("已设为默认配置");
  } catch (error: any) {
    ElMessage.error(error.message || "设置失败");
  }
}

async function deleteConfig(configId: string) {
  try {
    await ElMessageBox.confirm(
      "确定要删除这个配置吗？此操作不可恢复。",
      "确认删除",
      {
        confirmButtonText: "删除",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    await aiStore.deleteConfig(configId);
    ElMessage.success("配置已删除");
  } catch (error) {
    // 用户取消
  }
}

function resetForm() {
  configForm.provider = "deepseek";
  configForm.model = "deepseek-chat";
  configForm.apiKey = "";
  configForm.baseURL = "";
  configForm.temperature = 0.7;
  configForm.maxTokens = 4096;
  configForm.isDefault = false;

  configFormRef.value?.resetFields();
}

async function loadUsageStats() {
  if (!userStore.profile) return;

  try {
    const stats = await getUsageStats(userStore.profile.id || "default", 30);
    usageStats.value = {
      totalRequests: stats.totalRequests,
      totalTokens: stats.totalTokens,
      totalCost: stats.totalCost,
    };
  } catch (error) {
    console.error("Failed to load usage stats:", error);
  }
}

onMounted(async () => {
  await aiStore.loadConfigs();
  await loadUsageStats();
});
</script>

<style scoped lang="scss">
.ai-config-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.config-header {
  margin-bottom: 24px;

  h2 {
    margin: 0 0 8px 0;
    color: var(--el-text-color-primary);
  }

  .subtitle {
    margin: 0;
    color: var(--el-text-color-secondary);
    font-size: 14px;
  }
}

.config-list {
  margin-bottom: 24px;

  .list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    h3 {
      margin: 0;
    }
  }
}

.usage-stats {
  h3 {
    margin-top: 0;
  }
}

.form-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.el-button-group {
  display: flex;
  gap: 4px;
}
</style>
