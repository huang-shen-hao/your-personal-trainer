<template>
  <el-dialog
    v-model="visible"
    :title="`添加${config.label}记录`"
    width="90%"
    :style="{ maxWidth: '500px' }"
    @close="handleClose"
  >
    <el-form :model="form" label-width="80px" label-position="left">
      <el-form-item label="日期">
        <el-date-picker
          v-model="form.date"
          type="date"
          placeholder="选择日期"
          style="width: 100%"
          :disabled-date="disabledDate"
        />
      </el-form-item>

      <el-form-item :label="config.label">
        <el-input-number
          v-model="form.value"
          :min="config.min"
          :max="config.max"
          :step="config.step"
          :precision="1"
          style="width: 100%"
        >
          <template #append>{{ config.unit }}</template>
        </el-input-number>
      </el-form-item>

      <el-form-item label="备注">
        <el-input
          v-model="form.note"
          type="textarea"
          :rows="3"
          placeholder="输入备注信息（可选）"
          maxlength="200"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { MetricConfig, MetricType } from '@/types/bodyMetrics'

interface Props {
  modelValue: boolean
  config: MetricConfig
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', data: { date: Date; value: number; note?: string; type: MetricType }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visible = ref(false)
const saving = ref(false)

const form = ref({
  date: new Date(),
  value: props.config.min || 0,
  note: ''
})

watch(
  () => props.modelValue,
  (val) => {
    visible.value = val
    if (val) {
      // 重置表单
      form.value = {
        date: new Date(),
        value: props.config.min || 0,
        note: ''
      }
    }
  }
)

watch(visible, (val) => {
  emit('update:modelValue', val)
})

function disabledDate(date: Date): boolean {
  // 不允许选择未来的日期
  return date.getTime() > Date.now()
}

function handleClose() {
  visible.value = false
}

async function handleSave() {
  if (!form.value.value || form.value.value < (props.config.min || 0)) {
    return
  }

  saving.value = true
  try {
    emit('save', {
      date: form.value.date,
      value: form.value.value,
      note: form.value.note || undefined,
      type: props.config.type
    })
    handleClose()
  } finally {
    saving.value = false
  }
}
</script>

<style scoped lang="scss">
.el-form {
  padding: 20px 0;
}
</style>

