<template>
  <div class="body-metrics-view">
    <!-- 顶部操作栏 -->
    <el-row :gutter="20" class="top-bar">
      <el-col :span="12">
        <h2>体测数据</h2>
      </el-col>
      <el-col :span="12" class="text-right">
        <el-button type="primary" @click="openAddDialog">
          <PlusIcon style="width: 20px; height: 20px;" />
          添加数据
        </el-button>
      </el-col>
    </el-row>

    <!-- 数据统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="24" :sm="8">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-label">当前体重</div>
            <div class="stat-value">{{ latestWeight }} <span class="unit">kg</span></div>
            <div class="stat-change" :class="weightChangeClass">
              {{ weightChangeText }}
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="8">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-label">体脂率</div>
            <div class="stat-value">{{ latestBodyFat }} <span class="unit">%</span></div>
            <div class="stat-change">{{ latestBodyFat ? '最新记录' : '暂无数据' }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="8">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-label">骨骼肌率</div>
            <div class="stat-value">{{ latestMuscleMass }} <span class="unit">%</span></div>
            <div class="stat-change">{{ latestMuscleMass ? '最新记录' : '暂无数据' }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 数据可视化 -->
    <el-row :gutter="20" class="charts-row">
      <el-col :xs="24" :md="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>体重趋势</span>
              <el-select v-model="weightDays" size="small" style="width: 100px">
                <el-option label="7天" :value="7" />
                <el-option label="30天" :value="30" />
                <el-option label="90天" :value="90" />
              </el-select>
            </div>
          </template>
          <WeightChart
            :metrics="recentMetrics"
            data-key="weight"
            color="#409eff"
          />
        </el-card>
      </el-col>
      <el-col :xs="24" :md="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>体脂率趋势</span>
              <el-select v-model="bodyFatDays" size="small" style="width: 100px">
                <el-option label="7天" :value="7" />
                <el-option label="30天" :value="30" />
                <el-option label="90天" :value="90" />
              </el-select>
            </div>
          </template>
          <WeightChart
            :metrics="recentMetricsBodyFat"
            data-key="bodyFat"
            color="#67c23a"
          />
        </el-card>
      </el-col>
    </el-row>

    <!-- 数据列表 -->
    <el-card shadow="hover" class="data-table">
      <template #header>
        <div class="card-header">
          <span>历史记录</span>
        </div>
      </template>
      <el-table :data="metrics" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="date" label="日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.date) }}
          </template>
        </el-table-column>
        <el-table-column prop="weight" label="体重 (kg)" width="100" />
        <el-table-column prop="bodyFat" label="体脂率 (%)" width="110">
          <template #default="{ row }">
            {{ row.bodyFat ? row.bodyFat.toFixed(1) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="muscleMass" label="骨骼肌率 (%)" width="120">
          <template #default="{ row }">
            {{ row.muscleMass ? row.muscleMass.toFixed(1) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="waistCircumference" label="腰围 (cm)" width="100">
          <template #default="{ row }">
            {{ row.waistCircumference ? row.waistCircumference.toFixed(1) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="notes" label="备注" min-width="150">
          <template #default="{ row }">
            {{ row.notes || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="editMetric(row)">
              编辑
            </el-button>
            <el-button link type="danger" size="small" @click="deleteMetric(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加/编辑对话框 -->
    <MetricForm
      v-model="dialogVisible"
      :metric="currentMetric"
      @success="handleSuccess"
      ref="metricFormRef"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { PlusIcon } from '@heroicons/vue/24/outline'
import { ElMessage, ElMessageBox } from 'element-plus'
import { bodyMetricRepository } from '@/db/repositories/bodyMetricRepository'
import MetricForm from '@/components/MetricForm.vue'
import WeightChart from '@/components/WeightChart.vue'
import type { BodyMetric } from '@/types/user'

const metrics = ref<BodyMetric[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const currentMetric = ref<BodyMetric | undefined>(undefined)
const metricFormRef = ref<InstanceType<typeof MetricForm> | null>(null)

const weightDays = ref(30)
const bodyFatDays = ref(30)

// 最新数据
const latestMetric = computed(() => metrics.value[0])
const latestWeight = computed(() => latestMetric.value?.weight.toFixed(1) || '-')
const latestBodyFat = computed(() =>
  latestMetric.value?.bodyFat ? latestMetric.value.bodyFat.toFixed(1) : '-'
)
const latestMuscleMass = computed(() =>
  latestMetric.value?.muscleMass ? latestMetric.value.muscleMass.toFixed(1) : '-'
)

// 体重变化
const weightChange = computed(() => {
  if (metrics.value.length < 2) return 0
  const current = metrics.value[0].weight
  const previous = metrics.value[1].weight
  return current - previous
})

const weightChangeText = computed(() => {
  if (metrics.value.length < 2) return '暂无对比'
  const change = weightChange.value
  const sign = change > 0 ? '+' : ''
  return `${sign}${change.toFixed(1)} kg (较上次)`
})

const weightChangeClass = computed(() => {
  if (weightChange.value > 0) return 'increase'
  if (weightChange.value < 0) return 'decrease'
  return ''
})

// 近期数据（用于图表）
const recentMetrics = computed(() => {
  const days = weightDays.value
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)
  return metrics.value.filter((m) => new Date(m.date) >= cutoffDate)
})

const recentMetricsBodyFat = computed(() => {
  const days = bodyFatDays.value
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)
  return metrics.value.filter((m) => new Date(m.date) >= cutoffDate && m.bodyFat)
})

// 加载数据
async function loadMetrics() {
  loading.value = true
  try {
    metrics.value = await bodyMetricRepository.getAllMetrics()
  } catch (error) {
    ElMessage.error('加载数据失败')
    console.error('Load metrics error:', error)
  } finally {
    loading.value = false
  }
}

// 打开添加对话框
function openAddDialog() {
  currentMetric.value = undefined
  dialogVisible.value = true
}

// 编辑记录
function editMetric(metric: BodyMetric) {
  currentMetric.value = metric
  dialogVisible.value = true
}

// 删除记录
async function deleteMetric(metric: BodyMetric) {
  try {
    await ElMessageBox.confirm('确定要删除这条记录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await bodyMetricRepository.deleteMetric(metric.id)
    ElMessage.success('删除成功！')
    await loadMetrics()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
      console.error('Delete metric error:', error)
    }
  }
}

// 处理表单提交成功
async function handleSuccess() {
  if (!metricFormRef.value) return

  const formData = metricFormRef.value.formData
  try {
    if (currentMetric.value?.id) {
      // 更新
      await bodyMetricRepository.updateMetric(currentMetric.value.id, formData)
    } else {
      // 添加
      await bodyMetricRepository.addMetric(formData)
    }
    await loadMetrics()
  } catch (error) {
    ElMessage.error('保存失败')
    console.error('Save metric error:', error)
  }
}

// 格式化日期
function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('zh-CN')
}

// 监听天数变化，重新加载图表数据（通过 computed 自动处理）
watch([weightDays, bodyFatDays], () => {
  // computed 会自动重新计算
})

onMounted(() => {
  loadMetrics()
})
</script>

<style scoped lang="scss">
.body-metrics-view {
  max-width: 1400px;
  margin: 0 auto;

  .top-bar {
    margin-bottom: 20px;
    display: flex;
    align-items: center;

    h2 {
      margin: 0;
      font-size: 24px;
      color: var(--el-text-color-primary);
    }

    .text-right {
      text-align: right;
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
        font-size: 32px;
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
        font-size: 14px;
        color: var(--el-text-color-secondary);

        &.increase {
          color: var(--el-color-danger);
        }

        &.decrease {
          color: var(--el-color-success);
        }
      }
    }
  }

  .charts-row {
    margin-bottom: 20px;
  }

  .data-table {
    .el-table {
      font-size: 14px;
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: bold;
  }
}

// 移动端适配
@media (max-width: 768px) {
  .body-metrics-view {
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

