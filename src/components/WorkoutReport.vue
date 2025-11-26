<template>
  <div class="workout-report">
    <!-- 报告标题和切换 -->
    <div class="report-header">
      <div class="header-left">
        <h2>{{ reportType === 'weekly' ? '周报' : '月报' }}</h2>
        <span class="period-text">{{ periodText }}</span>
      </div>
      <div class="header-right">
        <el-radio-group v-model="reportType" @change="loadReport">
          <el-radio-button label="weekly">周报</el-radio-button>
          <el-radio-button label="monthly">月报</el-radio-button>
        </el-radio-group>
        <el-button-group style="margin-left: 12px">
          <el-button size="small" @click="previousPeriod">
            <ArrowLeftIcon style="width: 16px; height: 16px;" />
          </el-button>
          <el-button size="small" @click="nextPeriod">
            <ArrowRightIcon style="width: 16px; height: 16px;" />
          </el-button>
        </el-button-group>
      </div>
    </div>

    <div v-loading="loading">
      <!-- 统计卡片 -->
      <el-row :gutter="20" class="stats-row">
        <el-col :xs="24" :sm="6">
          <el-card shadow="hover">
            <div class="stat-item">
              <div class="stat-label">训练次数</div>
              <div class="stat-value">{{ reportData?.stats.totalWorkouts || 0 }}</div>
              <div v-if="reportData?.comparison" class="stat-change" :class="getChangeClass(reportData.comparison.frequencyChange)">
                {{ formatChange(reportData.comparison.frequencyChange, '次') }}
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="6">
          <el-card shadow="hover">
            <div class="stat-item">
              <div class="stat-label">总训练量</div>
              <div class="stat-value">{{ (reportData?.stats.totalVolume || 0).toLocaleString() }} <span class="unit">kg</span></div>
              <div v-if="reportData?.comparison" class="stat-change" :class="getChangeClass(reportData.comparison.volumeChange)">
                {{ formatChange(reportData.comparison.volumeChange, '%') }}
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="6">
          <el-card shadow="hover">
            <div class="stat-item">
              <div class="stat-label">平均时长</div>
              <div class="stat-value">{{ reportData?.stats.averageDuration || 0 }} <span class="unit">分钟</span></div>
              <div v-if="reportData?.comparison" class="stat-change" :class="getChangeClass(reportData.comparison.durationChange)">
                {{ formatChange(reportData.comparison.durationChange, '%') }}
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="6">
          <el-card shadow="hover">
            <div class="stat-item">
              <div class="stat-label">平均 RPE</div>
              <div class="stat-value">{{ reportData?.stats.averageRPE.toFixed(1) || '0.0' }}</div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- PR 记录汇总 -->
      <el-card shadow="hover" class="pr-section" v-if="reportData && reportData.prs.length > 0">
        <template #header>
          <div class="card-header">
            <span>PR 记录 ({{ reportData.prs.length }})</span>
          </div>
        </template>
        <el-table :data="reportData.prs" stripe style="width: 100%">
          <el-table-column prop="exerciseId" label="动作" width="200">
            <template #default="{ row }">
              {{ getExerciseName(row.exerciseId) }}
            </template>
          </el-table-column>
          <el-table-column prop="weight" label="重量 (kg)" width="120">
            <template #default="{ row }">
              {{ row.weight.toFixed(1) }}
            </template>
          </el-table-column>
          <el-table-column prop="reps" label="次数" width="100" />
          <el-table-column prop="date" label="日期" width="150">
            <template #default="{ row }">
              {{ formatDate(row.date) }}
            </template>
          </el-table-column>
          <el-table-column label="训练量" width="120">
            <template #default="{ row }">
              {{ (row.weight * row.reps).toFixed(0) }} kg
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 训练列表 -->
      <el-card shadow="hover" class="workouts-section" v-if="reportData && reportData.workouts.length > 0">
        <template #header>
          <div class="card-header">
            <span>训练记录 ({{ reportData.workouts.length }})</span>
          </div>
        </template>
        <el-table :data="reportData.workouts" stripe style="width: 100%">
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
        </el-table>
      </el-card>

      <!-- 空状态 -->
      <el-empty v-if="!loading && (!reportData || reportData.workouts.length === 0)" description="暂无训练记录" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { generateWeeklyReport, generateMonthlyReport, formatPeriodRange, type ReportData } from '@/utils/reportGenerator'
import { getExerciseById } from '@/utils/exerciseUtils'
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/vue/24/outline'
import { ElMessage } from 'element-plus'
import type { WorkoutLog } from '@/stores/workout'

const userStore = useUserStore()

const reportType = ref<'weekly' | 'monthly'>('weekly')
const reportData = ref<ReportData | null>(null)
const loading = ref(false)
const currentDate = ref(new Date())

const periodText = computed(() => {
  if (!reportData.value) return ''
  return formatPeriodRange(reportData.value.period)
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

// 获取动作名称
function getExerciseName(exerciseId: string): string {
  const exercise = getExerciseById(exerciseId)
  return exercise ? exercise.name : exerciseId
}

// 格式化日期
function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('zh-CN')
}

// 格式化变化
function formatChange(change: number, unit: string): string {
  if (change === 0) return '无变化'
  const sign = change > 0 ? '+' : ''
  return `较上${reportType.value === 'weekly' ? '周' : '月'} ${sign}${change.toFixed(1)}${unit}`
}

// 获取变化样式类
function getChangeClass(change: number): string {
  if (change > 0) return 'increase'
  if (change < 0) return 'decrease'
  return ''
}

// 加载报告
async function loadReport() {
  if (!userStore.profile?.id) return
  
  loading.value = true
  try {
    if (reportType.value === 'weekly') {
      reportData.value = await generateWeeklyReport(userStore.profile.id, currentDate.value)
    } else {
      reportData.value = await generateMonthlyReport(userStore.profile.id, currentDate.value)
    }
  } catch (error) {
    ElMessage.error('加载报告失败')
    console.error('Load report error:', error)
  } finally {
    loading.value = false
  }
}

// 上一周期
function previousPeriod() {
  if (reportType.value === 'weekly') {
    currentDate.value = new Date(currentDate.value.getTime() - 7 * 24 * 60 * 60 * 1000)
  } else {
    const newDate = new Date(currentDate.value)
    newDate.setMonth(newDate.getMonth() - 1)
    currentDate.value = newDate
  }
  loadReport()
}

// 下一周期
function nextPeriod() {
  if (reportType.value === 'weekly') {
    currentDate.value = new Date(currentDate.value.getTime() + 7 * 24 * 60 * 60 * 1000)
  } else {
    const newDate = new Date(currentDate.value)
    newDate.setMonth(newDate.getMonth() + 1)
    currentDate.value = newDate
  }
  loadReport()
}

onMounted(() => {
  loadReport()
})
</script>

<style scoped lang="scss">
.workout-report {
  .report-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    flex-wrap: wrap;
    gap: 16px;

    .header-left {
      h2 {
        margin: 0 0 4px 0;
        font-size: 24px;
        color: var(--el-text-color-primary);
      }

      .period-text {
        font-size: 14px;
        color: var(--el-text-color-secondary);
      }
    }

    .header-right {
      display: flex;
      align-items: center;
    }
  }

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
        margin-bottom: 4px;

        .unit {
          font-size: 16px;
          font-weight: normal;
          color: var(--el-text-color-secondary);
          margin-left: 4px;
        }
      }

      .stat-change {
        font-size: 12px;
        color: var(--el-text-color-secondary);

        &.increase {
          color: var(--el-color-success);
        }

        &.decrease {
          color: var(--el-color-danger);
        }
      }
    }
  }

  .pr-section,
  .workouts-section {
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
  .workout-report {
    .report-header {
      flex-direction: column;
      align-items: flex-start;

      .header-right {
        width: 100%;
        justify-content: space-between;
      }
    }

    .stats-row {
      .el-col {
        margin-bottom: 10px;
      }
    }
  }
}
</style>

