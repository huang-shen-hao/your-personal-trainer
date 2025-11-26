<template>
  <el-card class="metric-card" shadow="hover">
    <div class="card-header">
      <div class="title-section">
        <span class="icon">{{ config.icon }}</span>
        <span class="label">{{ config.label }}</span>
      </div>
      <el-button link type="primary" @click="$emit('view-detail')">
        <ChartBarIcon style="width: 20px; height: 20px;" />
      </el-button>
    </div>

    <div class="card-body">
      <div class="value-section">
        <span class="value">{{ displayValue }}</span>
        <span class="unit">{{ config.unit }}</span>
      </div>

      <div v-if="stats" class="stats-section">
        <div class="stat-item">
          <span class="stat-label">变化</span>
          <span class="stat-value" :class="changeClass">
            {{ changeText }}
          </span>
        </div>
        <div class="stat-item">
          <span class="stat-label">平均</span>
          <span class="stat-value">{{ stats.average.toFixed(1) }}{{ config.unit }}</span>
        </div>
      </div>

      <div v-if="latestMetric?.date" class="date-section">
        <span class="date-label">最后更新:</span>
        <span class="date-value">{{ formatDate(latestMetric.date) }}</span>
      </div>
    </div>

    <div class="card-footer">
      <el-button type="primary" size="small" @click="$emit('add-record')">
        <PlusIcon style="width: 20px; height: 20px;" />
        <span>添加记录</span>
      </el-button>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ChartBarIcon, PlusIcon } from '@heroicons/vue/24/outline'
import type { BodyMetric, MetricConfig } from '@/types/bodyMetrics'

interface Props {
  config: MetricConfig
  latestMetric?: BodyMetric | null
  stats?: {
    average: number
    change: number
    changePercent: number
  } | null
}

const props = defineProps<Props>()

defineEmits<{
  'view-detail': []
  'add-record': []
}>()

const displayValue = computed(() => {
  if (!props.latestMetric) {
    return '--'
  }
  return props.latestMetric.value.toFixed(1)
})

const changeText = computed(() => {
  if (!props.stats) {
    return '--'
  }
  const change = props.stats.change
  const percent = props.stats.changePercent
  const prefix = change > 0 ? '+' : ''
  return `${prefix}${change.toFixed(1)}${props.config.unit} (${prefix}${percent.toFixed(1)}%)`
})

const changeClass = computed(() => {
  if (!props.stats) {
    return ''
  }
  return props.stats.change > 0 ? 'positive' : props.stats.change < 0 ? 'negative' : 'neutral'
})

function formatDate(date: Date | string): string {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    return '今天'
  } else if (days === 1) {
    return '昨天'
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return `${d.getMonth() + 1}月${d.getDate()}日`
  }
}
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.metric-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: $--el-border-radius-base;
  border: 1px solid $--border-color-light;
  box-shadow: $--el-box-shadow-card;
  transition: $--transition-base;

  &:hover {
    box-shadow: $--el-box-shadow-light;
    border-color: $--el-color-primary-light;
  }

  :deep(.el-card__body) {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: $--el-spacing-md;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $--el-spacing-md;

    .title-section {
      display: flex;
      align-items: center;
      gap: $--el-spacing-sm;

      .icon {
        font-size: 24px;
      }

      .label {
        font-size: $--el-font-size-large;
        font-weight: 600;
        color: $--text-color-primary;
      }
    }
  }

  .card-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: $--el-spacing-sm;

    .value-section {
      display: flex;
      align-items: baseline;
      gap: $--el-spacing-xs;

      .value {
        font-size: 36px;
        font-weight: bold;
        color: $--text-color-primary;
      }

      .unit {
        font-size: $--el-font-size-xl;
        color: $--text-color-secondary;
      }
    }

    .stats-section {
      display: flex;
      gap: $--el-spacing-md;
      padding: $--el-spacing-sm 0;
      border-top: 1px solid $--border-color-light;
      border-bottom: 1px solid $--border-color-light;

      .stat-item {
        display: flex;
        flex-direction: column;
        gap: $--el-spacing-xs;

        .stat-label {
          font-size: $--el-font-size-small;
          color: $--text-color-secondary;
        }

        .stat-value {
          font-size: $--el-font-size-base;
          font-weight: 600;
          color: $--text-color-primary;

          &.positive {
            color: $--el-color-danger;
          }

          &.negative {
            color: $--el-color-success;
          }

          &.neutral {
            color: $--text-color-regular;
          }
        }
      }
    }

    .date-section {
      display: flex;
      align-items: center;
      gap: $--el-spacing-xs;
      font-size: $--el-font-size-small;

      .date-label {
        color: $--text-color-secondary;
      }

      .date-value {
        color: $--text-color-regular;
      }
    }
  }

  .card-footer {
    margin-top: $--el-spacing-md;
    display: flex;
    justify-content: center;

    .el-button {
      width: 100%;
      border-radius: $--el-border-radius-small;
    }
  }
}
</style>

