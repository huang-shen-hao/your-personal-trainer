<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑体测数据' : '添加体测数据'"
    width="90%"
    :style="{ maxWidth: '600px' }"
    @close="handleClose"
  >
    <el-form :model="formData" label-width="120px" label-position="left">
      <el-form-item label="日期">
        <el-date-picker
          v-model="formData.date"
          type="date"
          placeholder="选择日期"
          style="width: 100%"
          :disabled-date="disabledDate"
        />
      </el-form-item>

      <el-form-item label="体重 (kg)" required>
        <el-input-number
          v-model="formData.weight"
          :min="30"
          :max="300"
          :step="0.1"
          :precision="1"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="体脂率 (%)">
        <el-input-number
          v-model="formData.bodyFat"
          :min="3"
          :max="60"
          :step="0.1"
          :precision="1"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="骨骼肌率 (%)">
        <el-input-number
          v-model="formData.muscleMass"
          :min="0"
          :max="70"
          :step="0.1"
          :precision="1"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="腰围 (cm)">
        <el-input-number
          v-model="formData.waistCircumference"
          :min="0"
          :max="200"
          :step="0.1"
          :precision="1"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="臀围 (cm)">
        <el-input-number
          v-model="formData.hipCircumference"
          :min="0"
          :max="200"
          :step="0.1"
          :precision="1"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="胸围 (cm)">
        <el-input-number
          v-model="formData.chestCircumference"
          :min="0"
          :max="200"
          :step="0.1"
          :precision="1"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="大腿围 (cm)">
        <el-input-number
          v-model="formData.thighCircumference"
          :min="0"
          :max="100"
          :step="0.1"
          :precision="1"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="大臂围 (cm)">
        <el-input-number
          v-model="formData.armCircumference"
          :min="0"
          :max="60"
          :step="0.1"
          :precision="1"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="备注">
        <el-input
          v-model="formData.notes"
          type="textarea"
          :rows="3"
          placeholder="添加备注（可选）"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ isEdit ? "保存" : "添加" }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { ElMessage } from "element-plus";
import type { BodyMetric } from "@/types/user";

const props = defineProps<{
  modelValue: boolean;
  metric?: BodyMetric;
  latestMetric?: BodyMetric;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  success: [];
}>();

const visible = ref(props.modelValue);
const submitting = ref(false);
const isEdit = ref(false);

interface FormData {
  date: Date;
  weight: number;
  bodyFat?: number;
  muscleMass?: number;
  waistCircumference?: number;
  hipCircumference?: number;
  chestCircumference?: number;
  thighCircumference?: number;
  armCircumference?: number;
  notes?: string;
}

const formData = ref<FormData>({
  date: new Date(),
  weight: 70,
});

// 监听 modelValue 变化
watch(
  () => props.modelValue,
  (newVal) => {
    visible.value = newVal;
    if (newVal) {
      if (props.metric) {
        isEdit.value = true;
        formData.value = {
          date: new Date(props.metric.date),
          weight: props.metric.weight,
          bodyFat: props.metric.bodyFat,
          muscleMass: props.metric.muscleMass,
          waistCircumference: props.metric.waistCircumference,
          hipCircumference: props.metric.hipCircumference,
          chestCircumference: props.metric.chestCircumference,
          thighCircumference: props.metric.thighCircumference,
          armCircumference: props.metric.armCircumference,
          notes: props.metric.notes,
        };
      } else {
        isEdit.value = false;
        // 新增时，如果有最新记录，默认使用最新记录作为初始值
        if (props.latestMetric) {
          formData.value = {
            date: new Date(),
            weight: props.latestMetric.weight,
            bodyFat: props.latestMetric.bodyFat,
            muscleMass: props.latestMetric.muscleMass,
            waistCircumference: props.latestMetric.waistCircumference,
            hipCircumference: props.latestMetric.hipCircumference,
            chestCircumference: props.latestMetric.chestCircumference,
            thighCircumference: props.latestMetric.thighCircumference,
            armCircumference: props.latestMetric.armCircumference,
            notes: props.latestMetric.notes,
          };
        } else {
          formData.value = {
            date: new Date(),
            weight: 70,
          };
        }
      }
    }
  }
);

// 监听 visible 变化并同步到父组件
watch(visible, (newVal) => {
  emit("update:modelValue", newVal);
});

// 禁用未来日期
function disabledDate(date: Date) {
  return date.getTime() > Date.now();
}

function handleClose() {
  visible.value = false;
}

async function handleSubmit() {
  if (!formData.value.weight) {
    ElMessage.warning("请填写体重");
    return;
  }

  submitting.value = true;
  try {
    // 这里通过 emit 传递数据给父组件处理
    emit("success");
    ElMessage.success(isEdit.value ? "更新成功！" : "添加成功！");
    visible.value = false;
  } catch (error) {
    ElMessage.error("操作失败，请重试");
    console.error("Submit metric error:", error);
  } finally {
    submitting.value = false;
  }
}

// 暴露表单数据供父组件访问
defineExpose({
  formData,
});
</script>

<style scoped lang="scss">
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.el-form-item {
  margin-bottom: 20px;
}
</style>
