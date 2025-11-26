<template>
  <el-card class="workout-feedback">
    <template #header>
      <span>训练反馈</span>
    </template>
    
    <el-form :model="feedback" label-width="120px" size="default">
      <el-form-item label="整体疲劳度">
        <el-rate
          v-model="feedback.overallFatigue"
          :max="5"
          show-score
          score-template="{value} 星"
          :allow-half="false"
        />
        <div class="form-item-hint">1-5星，评估本次训练的整体疲劳程度</div>
      </el-form-item>
      
      <el-form-item label="睡眠质量（前一晚）">
        <el-rate
          v-model="feedback.sleepQuality"
          :max="5"
          show-score
          score-template="{value} 星"
          :allow-half="false"
        />
        <div class="form-item-hint">1-5星，评估前一晚的睡眠质量</div>
      </el-form-item>
      
      <el-form-item label="饮食状态">
        <el-radio-group v-model="feedback.nutritionStatus">
          <el-radio label="good">充足</el-radio>
          <el-radio label="average">一般</el-radio>
          <el-radio label="poor">不足</el-radio>
        </el-radio-group>
        <div class="form-item-hint">评估训练前的饮食状态</div>
      </el-form-item>
      
      <el-form-item label="自由备注">
        <el-input
          v-model="feedback.notes"
          type="textarea"
          :rows="4"
          placeholder="记录训练感受、注意事项、疼痛部位等..."
          maxlength="500"
          show-word-limit
        />
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface WorkoutFeedbackData {
  overallFatigue?: number // 1-5
  sleepQuality?: number // 1-5
  nutritionStatus?: 'good' | 'average' | 'poor'
  notes?: string
}

interface Props {
  modelValue?: WorkoutFeedbackData
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: WorkoutFeedbackData]
}>()

const feedback = ref<WorkoutFeedbackData>({
  overallFatigue: props.modelValue?.overallFatigue,
  sleepQuality: props.modelValue?.sleepQuality,
  nutritionStatus: props.modelValue?.nutritionStatus || 'average',
  notes: props.modelValue?.notes
})

watch(feedback, (newValue) => {
  emit('update:modelValue', newValue)
}, { deep: true })

watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    feedback.value = { ...newValue }
  }
}, { deep: true })

defineExpose({
  getFeedback: () => feedback.value,
  reset: () => {
    feedback.value = {
      overallFatigue: undefined,
      sleepQuality: undefined,
      nutritionStatus: 'average',
      notes: ''
    }
  }
})
</script>

<style scoped lang="scss">
.workout-feedback {
  margin-top: 16px;
}

.form-item-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}
</style>

