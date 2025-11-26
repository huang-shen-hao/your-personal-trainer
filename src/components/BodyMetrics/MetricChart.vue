<template>
  <div class="metric-chart">
    <Line v-if="chartData" :data="chartData" :options="chartOptions" />
    <el-empty v-else description="暂无数据" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions
} from 'chart.js'
import type { BodyMetric } from '@/types/bodyMetrics'
import { METRIC_CONFIGS } from '@/types/bodyMetrics'

// 注册 Chart.js 组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface Props {
  metrics: BodyMetric[]
  title?: string
  showTrend?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  showTrend: true
})

const chartData = computed(() => {
  if (!props.metrics || props.metrics.length === 0) {
    return null
  }

  const sortedMetrics = [...props.metrics].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  const labels = sortedMetrics.map(m => {
    const date = new Date(m.date)
    return `${date.getMonth() + 1}/${date.getDate()}`
  })

  const values = sortedMetrics.map(m => m.value)
  const type = sortedMetrics[0]?.type
  const config = type ? METRIC_CONFIGS[type] : null
  const color = config?.color || '#409eff'

  return {
    labels,
    datasets: [
      {
        label: config?.label || '数值',
        data: values,
        borderColor: color,
        backgroundColor: `${color}33`, // 添加透明度
        borderWidth: 2,
        fill: props.showTrend,
        tension: 0.3, // 平滑曲线
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: color,
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      }
    ]
  }
})

const chartOptions = computed<ChartOptions<'line'>>(() => {
  const type = props.metrics[0]?.type
  const config = type ? METRIC_CONFIGS[type] : null

  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: !!props.title,
        text: props.title,
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || ''
            const value = context.parsed.y
            const unit = config?.unit || ''
            return `${label}: ${value}${unit}`
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero: false,
        ticks: {
          callback: (value) => {
            return `${value}${config?.unit || ''}`
          }
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  }
})
</script>

<style scoped lang="scss">
.metric-chart {
  width: 100%;
  height: 300px;
  padding: 20px;
}
</style>

