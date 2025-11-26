<template>
  <div class="progress-view">
    <div class="page-header">
      <h1>进度统计</h1>
    </div>

    <!-- 快捷入口 -->
    <el-row :gutter="20" class="quick-links">
      <el-col :xs="24" :sm="12" :md="8">
        <el-card shadow="hover" class="link-card" @click="goToBodyMetrics">
          <div class="card-content">
            <ChartBarIcon style="width: 48px; height: 48px" class="card-icon" />
            <div class="card-text">
              <h3>体测数据</h3>
              <p>查看体重、体脂等数据变化</p>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="8">
        <el-card
          shadow="hover"
          class="link-card"
          @click="showWorkoutHistory = true"
        >
          <div class="card-content">
            <ChartBarIcon style="width: 48px; height: 48px" class="card-icon" />
            <div class="card-text">
              <h3>训练记录</h3>
              <p>查看训练历史和 PR</p>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="8">
        <el-card
          shadow="hover"
          class="link-card"
          @click="showWorkoutReport = true"
        >
          <div class="card-content">
            <CalendarIcon style="width: 48px; height: 48px" class="card-icon" />
            <div class="card-text">
              <h3>周报/月报</h3>
              <p>查看训练总结报告</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 训练概览（周/月切换） -->
    <div class="overview-section">
      <el-card shadow="hover">
        <template #header>
          <div class="section-header">
            <span>{{ rangeLabel }}训练概览</span>
            <el-radio-group
              v-model="overviewRange"
              size="small"
              class="range-toggle"
            >
              <el-radio-button label="week">本周</el-radio-button>
              <el-radio-button label="month">本月</el-radio-button>
            </el-radio-group>
          </div>
        </template>
        <div v-loading="loading">
          <el-row
            :gutter="20"
            class="week-stats"
            v-if="overviewWorkouts.length > 0"
          >
            <el-col :xs="24" :sm="6">
              <div class="stat-item">
                <div class="stat-label">训练次数</div>
                <div class="stat-value">{{ overviewWorkouts.length }}</div>
              </div>
            </el-col>
            <el-col :xs="24" :sm="6">
              <div class="stat-item">
                <div class="stat-label">总训练时间</div>
                <div class="stat-value">
                  {{ formatTotalDuration(totalDuration) }}
                </div>
              </div>
            </el-col>
            <el-col :xs="24" :sm="6">
              <div class="stat-item">
                <div class="stat-label">平均时长</div>
                <div class="stat-value">
                  {{ avgDuration }} <span class="unit">分钟</span>
                </div>
              </div>
            </el-col>
            <el-col :xs="24" :sm="6">
              <div class="stat-item">
                <div class="stat-label">完成动作</div>
                <div class="stat-value">{{ totalExercises }}</div>
              </div>
            </el-col>
          </el-row>

          <el-table
            :data="overviewWorkouts"
            stripe
            class="week-table"
            v-if="overviewWorkouts.length > 0"
          >
            <el-table-column prop="date" label="日期" min-width="160">
              <template #default="{ row }">
                {{ formatDate(row.date) }}
              </template>
            </el-table-column>
            <el-table-column label="时长" min-width="140">
              <template #default="{ row }">
                {{ getDuration(row) }} 分钟
              </template>
            </el-table-column>
            <el-table-column label="动作数" min-width="140">
              <template #default="{ row }">
                {{ row.exercises.length }}
              </template>
            </el-table-column>
          </el-table>

          <el-empty v-else :description="rangeLabel + '暂无训练记录'" />
        </div>
      </el-card>
    </div>

    <!-- 训练记录对话框 -->
    <el-dialog
      v-model="showWorkoutHistory"
      title="训练记录"
      width="90%"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <WorkoutHistory />
    </el-dialog>

    <!-- 周报/月报对话框 -->
    <el-dialog
      v-model="showWorkoutReport"
      title="训练报告"
      width="90%"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <WorkoutReport />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { ChartBarIcon, CalendarIcon } from "@heroicons/vue/24/outline";
import { useWorkoutStore } from "@/stores/workout";
import { useUserStore } from "@/stores/user";
import WorkoutHistory from "@/components/WorkoutHistory.vue";
import WorkoutReport from "@/components/WorkoutReport.vue";
import type { WorkoutLog } from "@/stores/workout";
import { ElMessage } from "element-plus";

const router = useRouter();
const workoutStore = useWorkoutStore();
const userStore = useUserStore();

const showWorkoutHistory = ref(false);
const showWorkoutReport = ref(false);
const loading = ref(false);
const overviewRange = ref<"week" | "month">("week");
const overviewWorkouts = ref<WorkoutLog[]>([]);

const rangeLabel = computed(() =>
  overviewRange.value === "week" ? "本周" : "本月"
);

// 计算本周总训练时间（分钟）
const totalDuration = computed(() => {
  let duration = 0;
  for (const workout of overviewWorkouts.value) {
    duration += getDuration(workout);
  }
  return duration;
});

// 计算本周平均时长
const avgDuration = computed(() => {
  if (overviewWorkouts.value.length === 0) return 0;
  let totalDuration = 0;
  let count = 0;
  for (const workout of overviewWorkouts.value) {
    const duration = getDuration(workout);
    if (duration > 0) {
      totalDuration += duration;
      count++;
    }
  }
  return count > 0 ? Math.round(totalDuration / count) : 0;
});

// 计算本周完成动作总数
const totalExercises = computed(() => {
  return overviewWorkouts.value.reduce(
    (sum, workout) => sum + workout.exercises.length,
    0
  );
});

// 获取训练时长
function getDuration(workout: WorkoutLog): number {
  if (!workout.endTime || !workout.startTime) return 0;
  const start =
    workout.startTime instanceof Date
      ? workout.startTime
      : new Date(workout.startTime);
  const end =
    workout.endTime instanceof Date
      ? workout.endTime
      : new Date(workout.endTime);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
}

// 格式化日期
function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("zh-CN");
}

// 格式化总训练时间
function formatTotalDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} 分钟`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours} 小时`;
  }
  return `${hours} 小时 ${mins} 分钟`;
}

// 加载本周训练数据
function getRangeDates(range: "week" | "month") {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  if (range === "week") {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }

  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

async function loadOverviewWorkouts() {
  if (!userStore.profile?.id) return;

  loading.value = true;
  try {
    const { start, end } = getRangeDates(overviewRange.value);
    const workouts = await workoutStore.getWorkoutsByDateRange(
      userStore.profile.id,
      start,
      end
    );
    overviewWorkouts.value = workouts;
  } catch (error) {
    ElMessage.error("加载训练数据失败");
    console.error("Load workouts error:", error);
  } finally {
    loading.value = false;
  }
}

function goToBodyMetrics() {
  router.push("/body-metrics");
}

onMounted(() => {
  loadOverviewWorkouts();
});

watch(overviewRange, () => {
  loadOverviewWorkouts();
});
</script>

<style scoped lang="scss">
.progress-view {
  margin: 0 auto;

  .page-header {
    margin-bottom: 24px;

    h1 {
      font-size: 24px;
      font-weight: bold;
      color: var(--el-text-color-primary);
      margin: 0;
    }
  }

  .quick-links {
    margin-bottom: 32px;

    .el-col {
      margin-bottom: 20px;
    }

    .link-card {
      cursor: pointer;
      transition: all 0.3s ease;
      height: 100%;

      &:hover:not(.disabled) {
        transform: translateY(-4px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      &.disabled {
        cursor: not-allowed;
        opacity: 0.6;

        &:hover {
          transform: none;
        }
      }

      .card-content {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 8px;

        .card-icon {
          width: 48px;
          height: 48px;
          color: var(--el-color-primary);
        }

        .card-text {
          flex: 1;

          h3 {
            font-size: 18px;
            font-weight: 600;
            margin: 0 0 8px 0;
            color: var(--el-text-color-primary);
          }

          p {
            font-size: 14px;
            color: var(--el-text-color-secondary);
            margin: 0 0 4px 0;
          }

          .el-tag {
            margin-top: 4px;
          }
        }
      }
    }
  }

  .overview-section {
    margin-bottom: 32px;

    .section-header {
      font-weight: bold;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .range-toggle {
      background: var(--surface-card);
    }

    .week-stats {
      margin-bottom: 20px;

      .stat-item {
        text-align: center;
        padding: 16px 0;

        .stat-label {
          font-size: 14px;
          color: var(--el-text-color-secondary);
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: var(--el-text-color-primary);

          .unit {
            font-size: 14px;
            font-weight: normal;
            color: var(--el-text-color-secondary);
            margin-left: 4px;
          }
        }
      }
    }
  }
}

// 移动端适配
@media (max-width: 768px) {
  .progress-view {
    .quick-links .link-card .card-content {
      .card-icon {
        width: 36px;
        height: 36px;
      }

      .card-text h3 {
        font-size: 16px;
      }
    }
  }
}
</style>
