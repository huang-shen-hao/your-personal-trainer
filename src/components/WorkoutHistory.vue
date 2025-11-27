<template>
  <div class="workout-history">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="24" :sm="12">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-label">总训练次数</div>
            <div class="stat-value">{{ workoutHistory.length }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-label">总训练时间</div>
            <div class="stat-value">
              {{ formatTotalDuration(totalDuration) }}
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="charts-row">
      <el-col :xs="24" :md="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>训练时间趋势</span>
            </div>
          </template>
          <WorkoutStatsChart
            :workouts="workoutHistory"
            chart-type="line"
            data-type="duration"
            color="#409eff"
          />
        </el-card>
      </el-col>
      <el-col :xs="24" :md="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>训练频率</span>
            </div>
          </template>
          <div class="frequency-calendar">
            <div class="frequency-header">
              <div class="month-label">{{ currentMonthLabel }}</div>
              <div class="legend">
                <span class="legend-item">
                  <span class="legend-dot has-workout"></span>
                  有训练
                </span>
                <span class="legend-item">
                  <span class="legend-dot no-workout"></span>
                  无训练
                </span>
              </div>
            </div>
            <div class="frequency-grid">
              <div
                v-for="label in weekdayLabels"
                :key="label"
                class="weekday-label"
              >
                {{ label }}
              </div>
              <div
                v-for="n in leadingBlankDays"
                :key="'blank-' + n"
                class="day-cell placeholder"
              ></div>
              <div
                v-for="day in calendarDays"
                :key="day.dateKey"
                class="day-cell"
                :class="{ 'has-workout': day.hasWorkout }"
              >
                <span class="day-number">{{ day.day }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 训练历史列表 -->
    <el-card shadow="hover" class="history-section">
      <template #header>
        <div class="card-header">
          <span>训练历史</span>
          <el-select
            v-model="daysFilter"
            size="small"
            style="width: 120px"
            @change="filterWorkouts"
          >
            <el-option label="全部" :value="0" />
            <el-option label="最近7天" :value="7" />
            <el-option label="最近30天" :value="30" />
            <el-option label="最近90天" :value="90" />
          </el-select>
        </div>
      </template>
      <el-table
        :data="filteredWorkouts"
        stripe
        style="width: 100%"
        v-loading="loading"
      >
        <el-table-column prop="date" label="日期" min-width="120">
          <template #default="{ row }">
            {{ formatDate(row.date) }}
          </template>
        </el-table-column>
        <el-table-column label="时长" min-width="100">
          <template #default="{ row }"> {{ getDuration(row) }} 分钟 </template>
        </el-table-column>
        <el-table-column label="动作数" min-width="80">
          <template #default="{ row }">
            {{ row.exercises.length }}
          </template>
        </el-table-column>
        <el-table-column label="训练动作" min-width="220">
          <template #default="{ row }">
            <div class="exercise-tags">
              <el-tag
                v-for="exercise in row.exercises"
                :key="exercise.id"
                size="small"
                effect="plain"
                class="exercise-tag"
              >
                {{ getExerciseName(exercise.exerciseId) }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="主要肌群" min-width="180">
          <template #default="{ row }">
            <div class="muscle-tags">
              <el-tag
                v-for="muscle in getWorkoutPrimaryMuscles(row)"
                :key="muscle"
                size="small"
                type="info"
                effect="plain"
                class="muscle-tag"
              >
                {{ muscle }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <el-empty
        v-if="!loading && filteredWorkouts.length === 0"
        description="暂无训练记录"
      />
    </el-card>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useWorkoutStore } from "@/stores/workout";
import { useUserStore } from "@/stores/user";
import WorkoutStatsChart from "./WorkoutStatsChart.vue";
import type { WorkoutLog } from "@/stores/workout";
import { ElMessage } from "element-plus";
import { getExerciseById } from "@/utils/exerciseUtils";

const workoutStore = useWorkoutStore();
const userStore = useUserStore();

const workoutHistory = ref<WorkoutLog[]>([]);
const loading = ref(false);
const daysFilter = ref(0);

// 当前日期信息
const today = new Date();
const currentYear = today.getFullYear();
const currentMonth = today.getMonth(); // 0-11

// 星期标签（以周一为一周开始）
const weekdayLabels = ["一", "二", "三", "四", "五", "六", "日"];

const currentMonthLabel = computed(() => {
  return `${currentYear}年${currentMonth + 1}月`;
});

// 计算当月日历格子（小方块）
const calendarDays = computed(() => {
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const workoutDateSet = new Set<string>();
  for (const w of workoutHistory.value) {
    const d = w.date instanceof Date ? w.date : new Date(w.date);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    workoutDateSet.add(key);
  }

  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const key = `${currentYear}-${currentMonth}-${day}`;
    return {
      day,
      dateKey: key,
      hasWorkout: workoutDateSet.has(key),
    };
  });
});

// 计算当月第一天是星期几，用于前置占位（以周一为起点）
const leadingBlankDays = computed(() => {
  const firstDay = new Date(currentYear, currentMonth, 1);
  const day = firstDay.getDay(); // 0(周日) - 6(周六)
  // 转成以周一为起点：周一=0，周二=1 ... 周日=6
  return (day + 6) % 7;
});

// 计算总训练时间（分钟）
const totalDuration = computed(() => {
  let duration = 0;
  for (const workout of workoutHistory.value) {
    duration += getDuration(workout);
  }
  return duration;
});

// 筛选训练记录
const filteredWorkouts = computed(() => {
  if (daysFilter.value === 0) {
    return workoutHistory.value;
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysFilter.value);

  return workoutHistory.value.filter((w) => {
    const workoutDate = w.date instanceof Date ? w.date : new Date(w.date);
    return workoutDate >= cutoffDate;
  });
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

// 获取动作名称
function getExerciseName(exerciseId: string): string {
  const exercise = getExerciseById(exerciseId);
  return exercise ? exercise.name : exerciseId;
}

// 肌群英文枚举到中文名称的映射
const muscleNameMap: Record<string, string> = {
  chest: '胸部',
  back: '背部',
  shoulders: '肩部',
  biceps: '肱二头肌',
  triceps: '肱三头肌',
  forearms: '前臂',
  quads: '股四头肌',
  quadriceps: '股四头肌',
  hamstrings: '腘绳肌',
  glutes: '臀部',
  calves: '小腿',
  abs: '腹肌',
  obliques: '腹斜肌',
  lower_back: '下背部',
  core: '核心',
  cardio: '有氧',
  full_body: '全身',
  latissimus_dorsi: '背阔肌',
  trapezius: '斜方肌',
  rhomboids: '菱形肌',
  erector_spinae: '竖脊肌',
  anterior_deltoid: '前三角肌',
  lateral_deltoid: '侧三角肌',
  rear_deltoid: '后三角肌',
  adductors: '内收肌',
  abductors: '外展肌',
  brachialis: '肱肌',
  rectus_abdominis: '腹直肌',
  hip_flexors: '髋屈肌',
};

function getMuscleLabel(muscle: string): string {
  return muscleNameMap[muscle] || muscle;
}

// 获取一次训练中涉及的主要肌群（去重，展示为中文）
function getWorkoutPrimaryMuscles(workout: WorkoutLog): string[] {
  const muscles = new Set<string>();

  for (const ex of workout.exercises) {
    const exercise = getExerciseById(ex.exerciseId);
    if (exercise?.primaryMuscles) {
      exercise.primaryMuscles.forEach((m) => muscles.add(getMuscleLabel(m)));
    }
  }

  return Array.from(muscles);
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

// 筛选训练记录
function filterWorkouts() {
  // computed 会自动处理
}

// 加载数据
async function loadData() {
  if (!userStore.profile?.id) return;

  loading.value = true;
  try {
    await workoutStore.loadWorkoutHistory(userStore.profile.id);
    workoutHistory.value = workoutStore.workoutHistory;
  } catch (error) {
    ElMessage.error("加载训练记录失败");
    console.error("Load workout history error:", error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadData();
});
</script>

<style scoped lang="scss">
.workout-history {
  .stats-row {
    margin-bottom: 20px;

    .stat-item {
      text-align: center;
      padding: 10px 0;

      .stat-label {
        font-size: 14px;
        color: var(--el-text-color-secondary);
        margin-bottom: 8px;
      }

      .stat-value {
        font-size: 28px;
        font-weight: bold;
        color: var(--el-text-color-primary);

        .unit {
          font-size: 16px;
          font-weight: normal;
          color: var(--el-text-color-secondary);
          margin-left: 4px;
        }
      }
    }
  }

  .charts-row {
    margin-bottom: 20px;

    // 让左右两张卡片等高，以最高的为主
    .el-col {
      display: flex;
    }

    .el-card {
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
    }

    // 让图表/日历区域填满卡片可用高度（需要使用 :deep 作用到 Element Plus 内部结构）
    :deep(.el-card__body) {
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .chart-container,
    .frequency-calendar {
      flex: 1 1 auto;
    }
  }

  // 训练频率日历样式
  .frequency-calendar {
    .frequency-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      .month-label {
        font-weight: 600;
        font-size: 14px;
        color: var(--el-text-color-primary);
      }

      .legend {
        display: flex;
        gap: 12px;
        font-size: 12px;
        color: var(--el-text-color-secondary);

        .legend-item {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .legend-dot {
          width: 10px;
          height: 10px;
          border-radius: 3px;
          border: 1px solid var(--el-border-color);

          &.has-workout {
            background-color: #67c23a;
            border-color: #67c23a;
          }

          &.no-workout {
            background-color: var(--el-fill-color-light);
          }
        }
      }
    }

    .frequency-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 4px;
      font-size: 11px;

      .weekday-label {
        text-align: center;
        color: var(--el-text-color-secondary);
        padding-bottom: 4px;
      }

      .day-cell {
        position: relative;
        width: 100%;
        padding-top: 70%; // 略扁一些的小矩形，整体高度更紧凑
        border-radius: 4px;
        background-color: var(--el-fill-color-light);
        border: 1px solid var(--el-border-color-lighter);
        box-sizing: border-box;
        cursor: default;

        &.has-workout {
          background-color: #67c23a;
          border-color: #67c23a;

          .day-number {
            color: #fff;
            font-weight: 600;
          }
        }

        &.placeholder {
          background-color: transparent;
          border-color: transparent;
        }

        .day-number {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: var(--el-text-color-primary);
        }
      }
    }
  }

  .history-section {
    margin-bottom: 20px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: bold;
    }

    .exercise-tags,
    .muscle-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .exercise-tag,
    .muscle-tag {
      margin-bottom: 2px;
    }
  }

}

// 移动端适配
@media (max-width: 768px) {
  .workout-history {
    .stats-row {
      .el-col {
        margin-bottom: 10px;
      }
    }

    .charts-row {
      .el-col {
        margin-bottom: 20px;
      }
    }
  }
}
</style>
