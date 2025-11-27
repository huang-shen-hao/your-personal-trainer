<template>
  <div class="workout-view">
    <!-- 训练选择界面 -->
    <div v-if="!isWorkoutInProgress" class="workout-selection">
      <el-card>
        <template #header>
          <span>开始训练</span>
        </template>

        <!-- 今日训练计划 -->
        <div v-if="todayTrainingDay" class="today-plan">
          <h3>今日训练计划</h3>
          <el-card 
            shadow="hover" 
            class="plan-card"
            :class="{ 'is-completed': isTodayWorkoutCompleted }"
          >
            <div class="plan-header">
              <h4>{{ todayTrainingDay.name }}</h4>
              <el-tag 
                :type="isTodayWorkoutCompleted ? 'success' : 'primary'"
              >
                {{ todayTrainingDay.exercises.length }} 个动作
              </el-tag>
            </div>
            <div class="plan-exercises">
              <el-tag
                v-for="(exercise, index) in todayTrainingDay.exercises"
                :key="index"
                class="exercise-tag"
              >
                {{ getExerciseName(exercise.exerciseId) }} -
                {{ exercise.sets }}×{{ exercise.reps }}
              </el-tag>
            </div>
            <div class="plan-actions">
              <el-button
                type="primary"
                size="large"
                @click="isTodayWorkoutCompleted ? viewTodayCompletedWorkout() : startTodayWorkout()"
                :loading="loading"
              >
                {{ isTodayWorkoutCompleted ? '查看详情' : '开始今日训练' }}
              </el-button>
            </div>
          </el-card>
        </div>

        <!-- 选择其他训练日 -->
        <div v-else class="no-plan">
          <el-empty description="今日没有训练计划">
            <el-button type="primary" @click="showPlanSelection = true">
              选择训练日
            </el-button>
          </el-empty>
        </div>

        <!-- 训练日选择对话框 -->
        <el-dialog
          v-model="showPlanSelection"
          title="选择训练日"
          width="90%"
          :max-width="600"
        >
          <div v-if="weekTrainingDays.length > 0" class="training-days">
            <el-card
              v-for="day in weekTrainingDays"
              :key="day.id"
              shadow="hover"
              class="day-card"
              @click="startWorkoutFromDay(day)"
            >
              <div class="day-header">
                <h4>{{ day.name }}</h4>
                <el-tag>{{ day.exercises.length }} 个动作</el-tag>
              </div>
              <div class="day-exercises">
                <span
                  v-for="(exercise, index) in day.exercises.slice(0, 3)"
                  :key="index"
                  class="exercise-name"
                >
                  {{ getExerciseName(exercise.exerciseId) }}
                </span>
                <span v-if="day.exercises.length > 3" class="more-exercises">
                  +{{ day.exercises.length - 3 }} 个动作
                </span>
              </div>
            </el-card>
          </div>
          <el-empty v-else description="暂无训练计划" />
        </el-dialog>
      </el-card>
    </div>

    <!-- 训练执行界面 -->
    <div v-else class="workout-execution">
      <!-- 训练信息栏 -->
      <el-card class="workout-header">
        <div class="header-content">
          <div class="workout-info">
            <h3>{{ currentWorkoutName }}</h3>
            <div class="workout-meta">
              <span>开始时间: {{ formatTime(localWorkout?.startTime) }}</span>
              <span
                >进度: {{ currentWorkoutProgress.completed }}/{{
                  currentWorkoutProgress.total
                }}</span
              >
            </div>
          </div>
          <el-progress
            :percentage="currentWorkoutProgress.percentage"
            :stroke-width="8"
          />
        </div>
      </el-card>

      <!-- 动作列表 -->
      <div class="exercises-list">
        <ExerciseCard
          v-for="(exercise, index) in plannedExercises"
          :key="exercise.exerciseId || index"
          :exercise-id="exercise.exerciseId"
          :exercise-name="exercise.exercise?.name || ''"
          :exercise-tips="exercise.exercise?.tips || []"
          :exercise-video-url="exercise.exercise?.videoUrl || ''"
          :exercise-instructions="exercise.exercise?.instructions || []"
          :exercise-image-url="exercise.exercise?.imageUrl || ''"
          :equipment="exercise.exercise?.equipment || []"
          :primary-muscles="exercise.exercise?.primaryMuscles || []"
          :secondary-muscles="exercise.exercise?.secondaryMuscles || []"
          :planned-sets="exercise.sets"
          :planned-reps="exercise.reps"
          :planned-intensity="exercise?.intensity || ''"
          :planned-rest-seconds="exercise?.restSeconds || 75"
          :is-workout-completed="isWorkoutCompleted"
          :is-completed="completedExerciseIds.includes(exercise.exerciseId)"
          @complete="onExerciseComplete"
          @rest-timer="onRestTimer"
        />
      </div>

      <!-- 训练统计 -->
      <el-card class="workout-stats" v-if="workoutStats.completedExercises > 0">
        <template #header>
          <span>训练统计</span>
        </template>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">{{ workoutStats.completedExercises }}</div>
            <div class="stat-label">已完成动作</div>
          </div>
        </div>
      </el-card>

      <!-- 组间休息计时器 -->
      <RestTimer
        v-if="restTimerSeconds > 0"
        :duration="restTimerSeconds"
        :auto-start="true"
        @complete="onRestTimerComplete"
        @skip="onRestTimerSkip"
        ref="restTimerRef"
      />

      <!-- 底部操作栏 -->
      <div class="workout-actions">
        <el-button 
          size="large" 
          @click="handleCancelWorkout"
          v-if="!isWorkoutCompleted"
        >
          取消训练
        </el-button>
        <el-button
          type="primary"
          size="large"
          @click="handleCompleteWorkout"
          :loading="loading"
          :disabled="!canCompleteWorkout || isWorkoutCompleted"
          v-if="!isWorkoutCompleted"
        >
          完成训练
        </el-button>
        <el-button
          type="primary"
          size="large"
          @click="handleReturnToSelection"
          v-if="isWorkoutCompleted"
        >
          返回
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useWorkoutStore } from "@/stores/workout";
import { usePlanStore } from "@/stores/plan";
import { useUserStore } from "@/stores/user";
import { getExerciseById } from "@/utils/exerciseUtils";
import type { TrainingDay } from "@/types/plan";
import ExerciseCard from "@/components/ExerciseCard.vue";
import RestTimer from "@/components/RestTimer.vue";

// 本地训练状态接口
interface LocalWorkoutState {
  userId: string;
  sessionId: string;
  planId?: string;
  startTime: Date;
  completedExercises: Set<string>; // 已完成的动作ID集合
}

const workoutStore = useWorkoutStore();
const planStore = usePlanStore();
const userStore = useUserStore();

const loading = ref(false);
const showPlanSelection = ref(false);
const restTimerSeconds = ref(0);
const isWorkoutCompleted = ref(false); // 标记训练是否已完成

const restTimerRef = ref<InstanceType<typeof RestTimer> | null>(null);

// 本地训练状态 - 单一数据源
const localWorkout = ref<LocalWorkoutState | null>(null);

// 获取今日训练日
const todayTrainingDay = computed(() => {
  return planStore.getTodayTrainingDay();
});

// 获取本周训练日
const weekTrainingDays = computed(() => {
  return planStore.getWeekTrainingDays();
});

// 训练是否进行中
const isWorkoutInProgress = computed(() => {
  return localWorkout.value !== null;
});

// 获取当前训练名称
const currentWorkoutName = computed(() => {
  if (!localWorkout.value) return "训练中";

  const sessionId = localWorkout.value.sessionId;
  if (sessionId && planStore.activePlan) {
    const day = planStore.activePlan.trainingDays.find(
      (d) => d.id === sessionId
    );
    return day?.name || "训练中";
  }

  return "自由训练";
});

// 获取计划中的动作列表
const plannedExercises = computed(() => {
  if (!localWorkout.value?.sessionId || !planStore.activePlan) {
    return [];
  }

  const sessionId = localWorkout.value.sessionId;
  const day = planStore.activePlan.trainingDays.find(
    (d: any) => d.id === sessionId
  );
  console.log("55555555555", day);
  return day?.exercises || [];
});

// 获取训练统计（简化版，只显示完成的动作数）
const workoutStats = computed(() => {
  if (!localWorkout.value) {
    return { completedExercises: 0 };
  }

  return {
    completedExercises: localWorkout.value.completedExercises.size,
  };
});

// 获取当前训练进度
const currentWorkoutProgress = computed(() => {
  if (!localWorkout.value || !plannedExercises.value.length) {
    return { completed: 0, total: 0, percentage: 0 };
  }

  const total = plannedExercises.value.length;
  const completed = localWorkout.value.completedExercises.size;

  return {
    completed,
    total,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
});

// 是否可以完成训练
const canCompleteWorkout = computed(() => {
  if (!localWorkout.value) return false;
  return localWorkout.value.completedExercises.size > 0;
});

// 获取已完成的动作ID数组
const completedExerciseIds = computed(() => {
  if (!localWorkout.value) return [];
  return Array.from(localWorkout.value.completedExercises);
});

// 获取今日已完成的训练记录
const todayCompletedWorkout = computed(() => {
  const todayDay = todayTrainingDay.value;
  if (!todayDay || !userStore.profile?.id) return null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // 检查训练历史中是否有今天完成的训练记录
  const workout = workoutStore.workoutHistory.find((workout) => {
    const workoutDate = workout.date instanceof Date ? workout.date : new Date(workout.date);
    const workoutDay = new Date(workoutDate);
    workoutDay.setHours(0, 0, 0, 0);
    
    return (
      workoutDay.getTime() === today.getTime() &&
      workout.sessionId === todayDay.id &&
      workout.endTime // 有结束时间表示已完成
    );
  });
  
  return workout || null;
});

// 检查今日训练是否已完成
const isTodayWorkoutCompleted = computed(() => {
  return !!todayCompletedWorkout.value;
});

// 获取动作名称
function getExerciseName(exerciseId: string): string {
  const exercise = getExerciseById(exerciseId);
  return exercise ? exercise.name : exerciseId;
}


// 开始今日训练
async function startTodayWorkout() {
  if (!todayTrainingDay.value || !userStore.profile?.id) {
    ElMessage.warning("请先完成用户档案设置");
    return;
  }

  loading.value = true;
  try {
    // 初始化本地训练状态
    localWorkout.value = {
      userId: userStore.profile.id,
      sessionId: todayTrainingDay.value.id,
      planId: planStore.activePlan?.id,
      startTime: new Date(),
      completedExercises: new Set(),
    };
    isWorkoutCompleted.value = false;
  } catch (error) {
    console.error("开始训练失败:", error);
    ElMessage.error("开始训练失败");
  } finally {
    loading.value = false;
  }
}

// 查看今日已完成的训练
function viewTodayCompletedWorkout() {
  const completedWorkout = todayCompletedWorkout.value;
  if (!completedWorkout || !userStore.profile?.id) {
    ElMessage.warning("未找到已完成的训练记录");
    return;
  }

  // 从已完成的训练记录中恢复状态
  localWorkout.value = {
    userId: completedWorkout.userId,
    sessionId: completedWorkout.sessionId || todayTrainingDay.value?.id || '',
    planId: completedWorkout.planId,
    startTime: completedWorkout.startTime instanceof Date 
      ? completedWorkout.startTime 
      : new Date(completedWorkout.startTime),
    completedExercises: new Set(completedWorkout.exercises.map(ex => ex.exerciseId)),
  };
  
  // 标记为已完成状态（查看模式）
  isWorkoutCompleted.value = true;
}

// 从训练日开始训练
async function startWorkoutFromDay(day: TrainingDay) {
  if (!userStore.profile?.id) {
    ElMessage.warning("请先完成用户档案设置");
    return;
  }

  loading.value = true;
  try {
    // 初始化本地训练状态
    localWorkout.value = {
      userId: userStore.profile.id,
      sessionId: day.id,
      planId: planStore.activePlan?.id,
      startTime: new Date(),
      completedExercises: new Set(),
    };
    isWorkoutCompleted.value = false;

    showPlanSelection.value = false;
  } catch (error) {
    console.error("开始训练失败:", error);
    ElMessage.error("开始训练失败");
  } finally {
    loading.value = false;
  }
}

// 动作完成
function onExerciseComplete(exerciseId: string) {
  if (!localWorkout.value) return;
  
  localWorkout.value.completedExercises.add(exerciseId);
  ElMessage.success(`${getExerciseName(exerciseId)} 已完成`);
}

// 休息计时器
function onRestTimer(seconds: number) {
  restTimerSeconds.value = seconds;
}

function onRestTimerComplete() {
  restTimerSeconds.value = 0;
  ElMessage.success("休息时间到，继续训练！");
}

function onRestTimerSkip() {
  restTimerSeconds.value = 0;
}

// 完成训练
async function handleCompleteWorkout() {
  if (!localWorkout.value) return;

  try {
    await ElMessageBox.confirm("确定要完成本次训练吗？", "完成训练", {
      confirmButtonText: "完成",
      cancelButtonText: "取消",
      type: "info",
    });

    loading.value = true;

    // 转换本地训练状态为 WorkoutLog 格式
    const workoutLog = {
      id: crypto.randomUUID(),
      userId: localWorkout.value.userId,
      planId: localWorkout.value.planId,
      sessionId: localWorkout.value.sessionId,
      date: localWorkout.value.startTime,
      startTime: localWorkout.value.startTime,
      endTime: new Date(),
      exercises: Array.from(localWorkout.value.completedExercises).map(
        (exerciseId) => ({
          id: crypto.randomUUID(),
          exerciseId,
          sets: [], // 不再记录组数据
        })
      ),
    };

    // 保存到数据库
    await workoutStore.saveCompletedWorkout(workoutLog);

    // 标记训练已完成，但保持界面显示
    isWorkoutCompleted.value = true;

    ElMessage.success("训练记录已保存");

    // 检测PR
    const prs = workoutStore.detectPRs(workoutLog);
    if (prs.length > 0) {
      ElMessage.success(`恭喜！创造了 ${prs.length} 个新纪录！`);
    }

    // 重新加载历史记录
    if (userStore.profile?.id) {
      await workoutStore.loadWorkoutHistory(userStore.profile.id);
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("完成训练失败:", error);
      ElMessage.error("完成训练失败");
    }
  } finally {
    loading.value = false;
  }
}

// 取消训练
async function handleCancelWorkout() {
  try {
    await ElMessageBox.confirm(
      "确定要取消本次训练吗？未保存的数据将丢失。",
      "取消训练",
      {
        confirmButtonText: "确定取消",
        cancelButtonText: "继续训练",
        type: "warning",
      }
    );

    // 清空本地训练状态
    localWorkout.value = null;
    isWorkoutCompleted.value = false;

    ElMessage.info("训练已取消");
  } catch (error) {
    // 用户取消
  }
}

// 返回选择界面
async function handleReturnToSelection() {
  localWorkout.value = null;
  isWorkoutCompleted.value = false;
  
  // 重新加载训练历史，以便检测完成状态
  if (userStore.profile?.id) {
    await workoutStore.loadWorkoutHistory(userStore.profile.id);
  }
}

// 格式化时间
function formatTime(date?: Date): string {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}

// 初始化
onMounted(async () => {
  // 确保用户档案已加载
  if (!userStore.profile) {
    await userStore.loadProfile();
  }

  // 如果有用户ID，加载数据
  if (userStore.profile?.id) {
    const userId = userStore.profile.id;

    // 加载训练历史
    await workoutStore.loadWorkoutHistory(userId);

    // 加载计划数据
    if (!planStore.activePlan) {
      await planStore.loadPlans(userId);
    }
  }
});
</script>

<style scoped lang="scss">
.workout-view {
  padding: 16px;

  margin: 0 auto;
}

.workout-selection {
  .today-plan {
    h3 {
      margin: 0 0 16px 0;
    }
  }

  .plan-card {
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

      .plan-header {
        h4 {
          color: var(--el-color-success);
        }
      }

      .plan-actions {
        .el-button {
          &.is-disabled {
            color: var(--el-text-color-regular) !important;
            background-color: var(--el-disabled-bg-color) !important;
            border-color: var(--el-disabled-border-color) !important;
            opacity: 1 !important;
          }
        }
      }
    }
  }

  .plan-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    h4 {
      margin: 0;
      transition: color 0.3s ease;
    }
  }

  .plan-exercises {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
  }

  .plan-actions {
    text-align: center;
  }
}

.training-days {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.day-card {
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;

  h4 {
    margin: 0;
  }
}

.day-exercises {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 14px;
  color: var(--el-text-color-regular);

  .exercise-name {
    &::after {
      content: "、";
    }

    &:last-of-type::after {
      content: "";
    }
  }

  .more-exercises {
    color: var(--el-text-color-secondary);
  }
}

.workout-execution {
  .workout-header {
    margin-bottom: 16px;
    position: sticky;
    top: 0;
    z-index: 10;
    background: var(--el-bg-color);
  }

  .header-content {
    .workout-info {
      margin-bottom: 16px;

      h3 {
        margin: 0 0 8px 0;
      }

      .workout-meta {
        display: flex;
        gap: 16px;
        font-size: 14px;
        color: var(--el-text-color-secondary);
      }
    }
  }

  .exercises-list {
    margin-bottom: 16px;
  }

  .workout-stats {
    margin-bottom: 16px;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 16px;
  }

  .stat-item {
    text-align: center;

    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: var(--el-color-primary);
      margin-bottom: 4px;
    }

    .stat-label {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }

  .workout-actions {
    position: sticky;
    bottom: 0;
    display: flex;
    gap: 12px;
    padding: 16px;
    background: var(--el-bg-color);
    box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.1);
    z-index: 10;

    .el-button {
      flex: 1;
    }
  }
}

@media (max-width: 768px) {
  .workout-view {
    padding: 8px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
