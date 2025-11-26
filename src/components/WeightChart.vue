<template>
  <div class="chart-container">
    <Line v-if="loaded" :data="chartData" :options="chartOptions" />
    <el-empty v-else description="暂无数据" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Line } from "vue-chartjs";
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
  type ChartData,
  type ChartOptions,
} from "chart.js";
import type { BodyMetric } from "@/types/user";

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
);

const props = defineProps<{
  metrics: BodyMetric[];
  dataKey?: "weight" | "bodyFat" | "muscleMass";
  title?: string;
  color?: string;
}>();

const loaded = computed(() => props.metrics && props.metrics.length > 0);

const chartData = computed<ChartData<"line">>(() => {
  const dataKey = props.dataKey || "weight";
  const sortedMetrics = [...props.metrics].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const labels = sortedMetrics.map((m) =>
    new Date(m.date).toLocaleDateString("zh-CN", {
      month: "short",
      day: "numeric",
    })
  );

  const data = sortedMetrics
    .map((m) => m[dataKey] as number)
    .filter((v) => v !== undefined);

  return {
    labels,
    datasets: [
      {
        label: getLabel(dataKey),
        data,
        borderColor: props.color || "#409eff",
        backgroundColor: props.color ? `${props.color}33` : "#409eff33",
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };
});

const chartOptions = computed<ChartOptions<"line">>(() => {
  const dataKey = props.dataKey || "weight";
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top",
      },
      title: {
        display: !!props.title,
        text: props.title || "",
      },
      tooltip: {
        mode: "index",
        intersect: false,
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toFixed(1);
              label += dataKey === "weight" ? " kg" : " %";
            }
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: (value) => {
            return value + (dataKey === "weight" ? " kg" : " %");
          },
        },
      },
    },
  };
});

function getLabel(key: string): string {
  const labels: Record<string, string> = {
    weight: "体重",
    bodyFat: "体脂率",
    muscleMass: "骨骼肌率",
  };
  return labels[key] || key;
}
</script>

<style scoped lang="scss">
.chart-container {
  width: 100%;
  height: 300px;
  position: relative;
}
</style>
