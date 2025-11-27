<template>
  <el-card
    class="exercise-card"
    :class="{
      'is-completed':
        isExerciseFinalized ||
        isCompleted ||
        (isWorkoutCompleted && isCompleted),
    }"
  >
    <template #header>
      <div class="exercise-header">
        <div class="exercise-info">
          <div class="exercise-title-row">
            <h3 class="exercise-name">{{ exerciseName }}</h3>
            <el-tag
              v-if="isWorkoutCompleted && isCompleted"
              type="success"
              size="small"
              class="completed-tag"
            >
              已完成
            </el-tag>
          </div>
          <div class="exercise-plan" v-if="plannedSets && plannedReps">
            <span>计划: {{ plannedSets }}×{{ plannedReps }}</span>
            <span v-if="plannedIntensity" class="intensity">{{
              plannedIntensity
            }}</span>
          </div>
        </div>
        <div class="exercise-actions">
          <el-button
            text
            @click="toggleExpanded"
            :icon="isExpanded ? 'ArrowUp' : 'ArrowDown'"
          >
            {{ isExpanded ? "收起" : isWorkoutCompleted ? "查看详情" : "详情" }}
          </el-button>
        </div>
      </div>
    </template>

    <!-- 动作详情（可展开） -->
    <el-collapse-transition>
      <div v-show="isExpanded" class="exercise-details">
        <div class="exercise-media" v-if="exerciseImageUrl">
          <img
            :src="exerciseImageUrl"
            :alt="exerciseName"
            class="exercise-image"
          />
        </div>
        <div
          class="exercise-instructions"
          v-if="exerciseInstructions && exerciseInstructions.length > 0"
        >
          <h4>动作步骤：</h4>
          <ol>
            <li
              v-for="(step, index) in exerciseInstructions"
              :key="index"
              class="instruction-item"
            >
              {{ step }}
            </li>
          </ol>
        </div>
        <div
          class="exercise-meta"
          v-if="
            equipmentLabels.length ||
            primaryMuscleLabels.length ||
            secondaryMuscleLabels.length
          "
        >
          <div class="meta-section" v-if="equipmentLabels.length">
            <h4>器械：</h4>
            <el-tag
              v-for="(label, index) in equipmentLabels"
              :key="`eq-${index}`"
              size="small"
              class="meta-tag"
            >
              {{ label }}
            </el-tag>
          </div>
          <div class="meta-section" v-if="primaryMuscleLabels.length">
            <h4>主要肌群：</h4>
            <el-tag
              v-for="(label, index) in primaryMuscleLabels"
              :key="`pm-${index}`"
              size="small"
              type="success"
              class="meta-tag"
            >
              {{ label }}
            </el-tag>
          </div>
          <div class="meta-section" v-if="secondaryMuscleLabels.length">
            <h4>次要肌群：</h4>
            <el-tag
              v-for="(label, index) in secondaryMuscleLabels"
              :key="`sm-${index}`"
              size="small"
              type="info"
              class="meta-tag"
            >
              {{ label }}
            </el-tag>
          </div>
        </div>
        <div
          class="exercise-tips"
          v-if="exerciseTips && exerciseTips.length > 0"
        >
          <h4>要点提示：</h4>
          <ul>
            <li v-for="(tip, index) in exerciseTips" :key="index">{{ tip }}</li>
          </ul>
        </div>
        <div class="exercise-video" v-if="exerciseVideoUrl">
          <el-button text type="primary" @click="openVideo">
            <el-icon><VideoPlay /></el-icon>
            观看视频
          </el-button>
        </div>
      </div>
    </el-collapse-transition>

    <!-- 快捷操作 -->
    <div class="quick-actions" v-if="!isWorkoutCompleted">
      <el-button
        size="small"
        type="primary"
        @click="completeExercise"
        :disabled="isExerciseFinalized || isWorkoutCompleted"
      >
        完成动作
      </el-button>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { VideoPlay } from "@element-plus/icons-vue";
import {
  EQUIPMENT_CONFIG,
  MUSCLE_GROUP_CONFIG,
  type ExerciseEquipment,
  type MuscleGroup,
} from "@/types/exercise";

interface Props {
  exerciseId: string;
  exerciseName: string;
  exerciseTips?: string[];
  exerciseVideoUrl?: string;
  exerciseInstructions?: string[];
  exerciseImageUrl?: string;
  equipment?: ExerciseEquipment[];
  primaryMuscles?: MuscleGroup[];
  secondaryMuscles?: MuscleGroup[];
  plannedSets?: number;
  plannedReps?: number | string;
  plannedIntensity?: string;
  plannedRestSeconds?: number;
  isWorkoutCompleted?: boolean;
  isCompleted?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  plannedSets: 3,
  plannedReps: 10,
  plannedRestSeconds: 60,
  isWorkoutCompleted: false,
  isCompleted: false,
});

const emit = defineEmits(["complete", "rest-timer"]);

const equipmentLabels = computed(() =>
  (props.equipment || []).map(
    (eq) => EQUIPMENT_CONFIG[eq]?.label || (eq as string)
  )
);

const primaryMuscleLabels = computed(
  () =>
    (props.primaryMuscles || [])
      .map((m) => MUSCLE_GROUP_CONFIG[m])
      .filter(Boolean) as string[]
);

const secondaryMuscleLabels = computed(
  () =>
    (props.secondaryMuscles || [])
      .map((m) => MUSCLE_GROUP_CONFIG[m])
      .filter(Boolean) as string[]
);

// UI state only (no data state)
const isExpanded = ref(true); // 默认展开详情
const isExerciseFinalized = ref(false); // 标记动作是否已正式完成

function toggleExpanded() {
  isExpanded.value = !isExpanded.value;
}

function completeExercise() {
  // 标记动作已正式完成
  isExerciseFinalized.value = true;

  emit("complete", props.exerciseId);

  // 触发休息计时器
  if (props.plannedRestSeconds && props.plannedRestSeconds > 0) {
    emit("rest-timer", props.plannedRestSeconds);
  }
}

function openVideo() {
  if (props.exerciseVideoUrl) {
    window.open(props.exerciseVideoUrl, "_blank");
  }
}
</script>

<style scoped lang="scss">
.exercise-card {
  margin-bottom: 16px;
  transition: all 0.3s ease;

  &.is-completed {
    border-color: var(--el-color-success);
    background-color: rgba(0, 200, 83, 0.05); // #00c853 with 5% opacity
    position: relative;

    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background-color: var(--el-color-success);
      border-radius: 2px 2px 0 0;
    }

    .exercise-name {
      color: var(--el-color-success);
    }

    // 确保详情按钮在完成状态下仍然可用
    .exercise-actions {
      .el-button {
        // 详情按钮应该始终可用，不受完成状态影响
        pointer-events: auto;
        cursor: pointer;
      }
    }

    .quick-actions {
      .el-button {
        &.is-disabled {
          color: var(--el-text-color-regular) !important;
          background-color: var(--el-disabled-bg-color) !important;
          border-color: var(--el-disabled-border-color) !important;
          opacity: 1 !important;
          cursor: not-allowed;
        }
      }
    }
  }
}

.exercise-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.exercise-info {
  flex: 1;
}

.exercise-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.exercise-name {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.completed-tag {
  flex-shrink: 0;
}

.exercise-plan {
  display: flex;
  gap: 12px;
  font-size: 14px;
  color: var(--el-text-color-secondary);

  .intensity {
    color: var(--el-color-primary);
  }
}

.exercise-details {
  padding: 16px 0;
  border-top: 1px solid var(--el-border-color-lighter);
  border-bottom: 1px solid var(--el-border-color-lighter);
  margin-bottom: 16px;
}

.exercise-media {
  margin-bottom: 16px;
}

.exercise-image {
  max-width: 100%;
  border-radius: 8px;
}

.exercise-description {
  margin-bottom: 16px;
  color: var(--el-text-color-regular);
}

.exercise-instructions {
  margin-bottom: 16px;

  h4 {
    margin: 0 0 8px 0;
    font-size: 14px;
    font-weight: 600;
  }

  ol {
    margin: 0;
    padding-left: 20px;

    .instruction-item {
      margin-bottom: 4px;
      color: var(--el-text-color-regular);
      line-height: 1.5;
    }
  }
}

.exercise-meta {
  margin-bottom: 16px;

  .meta-section {
    margin-bottom: 8px;

    h4 {
      margin: 0 0 4px 0;
      font-size: 14px;
      font-weight: 600;
    }

    .meta-tag {
      margin-right: 4px;
      margin-bottom: 4px;
    }
  }
}

.exercise-tips {
  h4 {
    margin: 0 0 8px 0;
    font-size: 14px;
    font-weight: 600;
  }

  ul {
    margin: 0;
    padding-left: 20px;

    li {
      margin-bottom: 4px;
      color: var(--el-text-color-regular);
    }
  }
}

.exercise-video {
  margin-top: 16px;
}

.quick-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

@media (max-width: 768px) {
  .quick-actions {
    flex-direction: column;

    .el-button {
      width: 100%;
    }
  }
}
</style>
