<template>
  <div class="prompt-management-view">
    <el-card class="header-card">
      <h2>Prompt 模板管理</h2>
      <p class="subtitle">查看和自定义 AI 教练的对话风格与指导方式</p>
    </el-card>

    <el-tabs v-model="activeTab" class="prompt-tabs">
      <!-- 基础身份 -->
      <el-tab-pane label="基础身份" name="base">
        <PromptEditor
          v-if="basePrompt"
          :prompt="basePrompt"
          @save="savePrompt"
        />
      </el-tab-pane>

      <!-- 性格风格 -->
      <el-tab-pane label="性格风格" name="personality">
        <el-row :gutter="20">
          <el-col
            v-for="prompt in personalityPrompts"
            :key="prompt.id"
            :span="12"
          >
            <el-card class="personality-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <span>{{ prompt.name }}</span>
                  <el-button
                    type="primary"
                    text
                    @click="editPrompt(prompt)"
                  >
                    编辑
                  </el-button>
                </div>
              </template>
              <div class="prompt-preview">
                {{ truncate(prompt.content, 200) }}
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <!-- 图片分析 -->
      <el-tab-pane label="图片分析" name="image">
        <el-collapse accordion>
          <el-collapse-item
            v-for="prompt in imagePrompts"
            :key="prompt.id"
            :name="prompt.id"
          >
            <template #title>
              <strong>{{ prompt.name }}</strong>
            </template>
            <PromptEditor
              :prompt="prompt"
              @save="savePrompt"
            />
          </el-collapse-item>
        </el-collapse>
      </el-tab-pane>

      <!-- 其他 Prompts -->
      <el-tab-pane label="其他功能" name="others">
        <el-collapse accordion>
          <el-collapse-item
            v-for="prompt in otherPrompts"
            :key="prompt.id"
            :name="prompt.id"
          >
            <template #title>
              <strong>{{ prompt.name }}</strong>
            </template>
            <PromptEditor
              :prompt="prompt"
              @save="savePrompt"
            />
          </el-collapse-item>
        </el-collapse>
      </el-tab-pane>
    </el-tabs>

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="showEditDialog"
      title="编辑 Prompt"
      width="800px"
      :close-on-click-modal="false"
    >
      <PromptEditor
        v-if="editingPrompt"
        :prompt="editingPrompt"
        @save="handleSave"
      />
    </el-dialog>

    <!-- 使用说明 -->
    <el-card class="help-card">
      <template #header>
        <h3>使用说明</h3>
      </template>
      <el-alert
        title="什么是 System Prompt？"
        type="info"
        :closable="false"
        show-icon
      >
        System Prompt 是 AI 的"身份设定"和"行为准则"。通过调整这些模板，你可以让 AI 教练更符合你的需求和沟通风格。
      </el-alert>

      <div class="help-content">
        <h4>💡 编辑建议</h4>
        <ul>
          <li><strong>基础身份</strong>：定义 AI 教练的专业背景和核心能力</li>
          <li><strong>性格风格</strong>：决定 AI 的沟通方式（严厉/鼓励/幽默/学术）</li>
          <li><strong>图片分析</strong>：指导 AI 如何分析饮食、体态和器械照片</li>
          <li><strong>其他功能</strong>：训练计划生成、进度回顾等专项任务</li>
        </ul>

        <h4>⚠️ 注意事项</h4>
        <ul>
          <li>修改后立即生效，会影响后续所有对话</li>
          <li>可以使用 <code>{{`{{变量名}}`}}</code> 来动态注入用户数据</li>
          <li>建议保留原有的专业性和安全提醒</li>
          <li>如果不确定，可以点击"恢复默认"</li>
        </ul>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useAIStore } from '@/stores/ai'
import type { PromptTemplate } from '@/types/ai'
import PromptEditor from '@/components/PromptEditor.vue'

const aiStore = useAIStore()

const activeTab = ref('base')
const showEditDialog = ref(false)
const editingPrompt = ref<PromptTemplate | null>(null)

// 分类 Prompts
const basePrompt = computed(() => 
  aiStore.promptTemplates.find(p => p.type === 'base')
)

const personalityPrompts = computed(() => 
  aiStore.promptTemplates.filter(p => p.type === 'personality')
)

const imagePrompts = computed(() => 
  aiStore.promptTemplates.filter(p => 
    ['diet_analysis', 'posture_analysis', 'equipment_recognition'].includes(p.type)
  )
)

const otherPrompts = computed(() => 
  aiStore.promptTemplates.filter(p => 
    ['plan_generation', 'workout_guidance', 'progress_review'].includes(p.type)
  )
)

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

function editPrompt(prompt: PromptTemplate) {
  editingPrompt.value = { ...prompt }
  showEditDialog.value = true
}

async function savePrompt(prompt: PromptTemplate) {
  try {
    await aiStore.savePromptTemplate(prompt)
    ElMessage.success('Prompt 已更新')
  } catch (error: any) {
    ElMessage.error(error.message || '保存失败')
  }
}

async function handleSave(prompt: PromptTemplate) {
  await savePrompt(prompt)
  showEditDialog.value = false
  editingPrompt.value = null
}

onMounted(async () => {
  await aiStore.loadPromptTemplates()
})
</script>

<style scoped lang="scss">
.prompt-management-view {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
}

.header-card {
  margin-bottom: 24px;

  h2 {
    margin: 0 0 8px 0;
  }

  .subtitle {
    margin: 0;
    color: var(--el-text-color-secondary);
    font-size: 14px;
  }
}

.prompt-tabs {
  background-color: var(--el-bg-color);
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 24px;
}

.personality-card {
  margin-bottom: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
  }

  .prompt-preview {
    color: var(--el-text-color-secondary);
    font-size: 14px;
    line-height: 1.6;
    white-space: pre-wrap;
  }
}

.help-card {
  h3 {
    margin: 0;
  }

  .help-content {
    margin-top: 16px;

    h4 {
      margin: 16px 0 8px 0;
      color: var(--el-text-color-primary);
    }

    ul {
      margin: 8px 0;
      padding-left: 20px;

      li {
        margin-bottom: 8px;
        line-height: 1.6;
      }
    }

    code {
      background-color: var(--el-fill-color-light);
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 13px;
      color: var(--el-color-primary);
    }
  }
}

:deep(.el-collapse-item__header) {
  padding-left: 16px;
  font-size: 15px;
}
</style>

