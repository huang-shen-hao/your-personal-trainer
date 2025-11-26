<template>
  <div class="workout-history">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="24" :sm="8">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-label">总训练次数</div>
            <div class="stat-value">{{ workoutHistory.length }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="8">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-label">总训练时间</div>
            <div class="stat-value">{{ formatTotalDuration(totalDuration) }}</div>
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
          <WorkoutStatsChart
            :workouts="workoutHistory"
            chart-type="bar"
            data-type="frequency"
            color="#67c23a"
          />
        </el-card>
      </el-col>
    </el-row>

    <!-- 训练历史列表 -->
    <el-card shadow="hover" class="history-section">
      <template #header>
        <div class="card-header">
          <span>训练历史</span>
          <el-select v-model="daysFilter" size="small" style="width: 120px" @change="filterWorkouts">
            <el-option label="全部" :value="0" />
            <el-option label="最近7天" :value="7" />
            <el-option label="最近30天" :value="30" />
            <el-option label="最近90天" :value="90" />
          </el-select>
        </div>
      </template>
      <el-table :data="filteredWorkouts" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="date" label="日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.date) }}
          </template>
        </el-table-column>
        <el-table-column label="时长" width="100">
          <template #default="{ row }">
            {{ getDuration(row) }} 分钟
          </template>
        </el-table-column>
        <el-table-column label="动作数" width="100">
          <template #default="{ row }">
            {{ row.exercises.length }}
          </template>
        </el-table-column>
        <el-table-column label="总训练量" width="120">
          <template #default="{ row }">
            {{ calculateVolume(row).toLocaleString() }} kg
          </template>
        </el-table-column>
        <el-table-column label="平均 RPE" width="110">
          <template #default="{ row }">
            {{ getAverageRPE(row) || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="viewWorkout(row)">
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && filteredWorkouts.length === 0" description="暂无训练记录" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useWorkoutStore } from '@/stores/workout'
import { useUserStore } from '@/stores/user'
import WorkoutStatsChart from './WorkoutStatsChart.vue'
import type { WorkoutLog } from '@/stores/workout'
import { ElMessage } from 'element-plus'

const workoutStore = useWorkoutStore()
const userStore = useUserStore()

const workoutHistory = ref<WorkoutLog[]>([])
const loading = ref(false)
const daysFilter = ref(0)

// 计算总训练时间（分钟）
const totalDuration = computed(() => {
  let duration = 0
  for (const workout of workoutHistory.value) {
    duration += getDuration(workout)
  }
  return duration
})

// 筛选训练记录
const filteredWorkouts = computed(() => {
  if (daysFilter.value === 0) {
    return workoutHistory.value
  }
  
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysFilter.value)
  
  return workoutHistory.value.filter(w => {
    const workoutDate = w.date instanceof Date ? w.date : new Date(w.date)
    return workoutDate >= cutoffDate
  })
})

// 计算单个训练的训练量
function calculateVolume(workout: WorkoutLog): number {
  let volume = 0
  for (const exercise of workout.exercises) {
    for (const set of exercise.sets) {
      if (set.completed && set.weight && set.reps) {
        volume += set.weight * set.reps
      }
    }
  }
  return Math.round(volume)
}

// 获取训练时长
function getDuration(workout: WorkoutLog): number {
  if (!workout.endTime || !workout.startTime) return 0
  const start = workout.startTime instanceof Date ? workout.startTime : new Date(workout.startTime)
  const end = workout.endTime instanceof Date ? workout.endTime : new Date(workout.endTime)
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60))
}

// 获取平均 RPE
function getAverageRPE(workout: WorkoutLog): string {
  let totalRPE = 0
  let count = 0
  
  for (const exercise of workout.exercises) {
    if (exercise.overallRPE) {
      totalRPE += exercise.overallRPE
      count++
    }
    for (const set of exercise.sets) {
      if (set.rpe) {
        totalRPE += set.rpe
        count++
      }
    }
  }
  
  if (count === 0) return ''
  return (totalRPE / count).toFixed(1)
}

// 格式化日期
function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('zh-CN')
}

// 格式化总训练时间
function formatTotalDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} 分钟`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) {
    return `${hours} 小时`
  }
  return `${hours} 小时 ${mins} 分钟`
}

// 筛选训练记录
function filterWorkouts() {
  // computed 会自动处理
}

// 查看训练详情
function viewWorkout(workout: WorkoutLog) {
  // TODO: 可以跳转到训练详情页面或显示对话框
  ElMessage.info('查看训练详情功能待实现')
}

// 加载数据
async function loadData() {
  if (!userStore.profile?.id) return
  
  loading.value = true
  try {
    await workoutStore.loadWorkoutHistory(userStore.profile.id)
    workoutHistory.value = workoutStore.workoutHistory
  } catch (error) {
    ElMessage.error('加载训练记录失败')
    console.error('Load workout history error:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
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
  }

  .history-section {
    margin-bottom: 20px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: bold;
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

