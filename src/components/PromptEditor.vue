<template>
  <div class="prompt-editor">
    <el-form :model="localPrompt" label-width="100px">
      <el-form-item label="名称">
        <el-input v-model="localPrompt.name" placeholder="Prompt 名称" />
      </el-form-item>

      <el-form-item label="版本">
        <el-input v-model="localPrompt.version" placeholder="版本号" />
      </el-form-item>

      <el-form-item label="内容">
        <el-input
          v-model="localPrompt.content"
          type="textarea"
          :rows="15"
          placeholder="输入 Prompt 内容..."
        />
        <div class="editor-hint">
          <InformationCircleIcon style="width: 20px; height: 20px;" />
          <span>可使用 <code>{{`{{变量名}}`}}</code> 来动态注入数据</span>
        </div>
      </el-form-item>

      <el-form-item label="变量" v-if="localPrompt.variables && localPrompt.variables.length > 0">
        <el-tag
          v-for="variable in localPrompt.variables"
          :key="variable"
          type="info"
          style="margin-right: 8px;"
        >
          {{ `{{${variable}}}` }}
        </el-tag>
      </el-form-item>

      <el-form-item>
        <el-button-group>
          <el-button type="primary" @click="save">
            <CheckIcon style="width: 20px; height: 20px;" />
            保存修改
          </el-button>
          <el-button @click="reset">
            <ArrowPathIcon style="width: 20px; height: 20px;" />
            重置
          </el-button>
          <el-button @click="showPreview = true">
            <EyeIcon style="width: 20px; height: 20px;" />
            预览
          </el-button>
        </el-button-group>
      </el-form-item>
    </el-form>

    <!-- 预览对话框 -->
    <el-dialog
      v-model="showPreview"
      title="Prompt 预览"
      width="700px"
    >
      <div class="preview-content">
        <el-alert
          title="预览模式"
          type="info"
          :closable="false"
          show-icon
        >
          下面是当前 Prompt 的渲染效果
        </el-alert>
        <div class="preview-text">
          {{ localPrompt.content }}
        </div>
      </div>
      <template #footer>
        <el-button @click="showPreview = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { CheckIcon, ArrowPathIcon, EyeIcon, InformationCircleIcon } from '@heroicons/vue/24/outline'
import type { PromptTemplate } from '@/types/ai'

interface Props {
  prompt: PromptTemplate
}

interface Emits {
  (e: 'save', prompt: PromptTemplate): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localPrompt = ref<PromptTemplate>({ ...props.prompt })
const showPreview = ref(false)

// 监听 props 变化
watch(() => props.prompt, (newPrompt) => {
  localPrompt.value = { ...newPrompt }
}, { deep: true })

function save() {
  emit('save', { 
    ...localPrompt.value,
    updatedAt: new Date()
  })
}

function reset() {
  localPrompt.value = { ...props.prompt }
}
</script>

<style scoped lang="scss">
.prompt-editor {
  width: 100%;
}

.editor-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  font-size: 13px;
  color: var(--el-text-color-secondary);

  code {
    background-color: var(--el-fill-color-light);
    padding: 2px 6px;
    border-radius: 4px;
    color: var(--el-color-primary);
  }
}

.preview-content {
  .preview-text {
    margin-top: 16px;
    padding: 16px;
    background-color: var(--el-fill-color-lighter);
    border-radius: 8px;
    white-space: pre-wrap;
    line-height: 1.6;
    font-family: monospace;
    max-height: 500px;
    overflow-y: auto;
  }
}

:deep(.el-textarea__inner) {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  line-height: 1.6;
}
</style>

