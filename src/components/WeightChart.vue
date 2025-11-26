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

type MetricKey =
  | "weight"
  | "bodyFat"
  | "muscleMass"
  | "waistCircumference"
  | "hipCircumference"
  | "chestCircumference"
  | "thighCircumference"
  | "armCircumference";

const props = defineProps<{
  metrics: BodyMetric[];
  dataKey?: MetricKey;
  title?: string;
  color?: string;
}>();

const loaded = computed(() => props.metrics && props.metrics.length > 0);

const chartData = computed<ChartData<"line">>(() => {
  const dataKey: MetricKey = props.dataKey || "weight";
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
  const dataKey: MetricKey = props.dataKey || "weight";
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
              label += getUnit(dataKey);
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
            return value + getUnit(dataKey);
          },
        },
      },
    },
  };
});

function getLabel(key: MetricKey): string {
  const labels: Record<MetricKey, string> = {
    weight: "体重",
    bodyFat: "体脂率",
    muscleMass: "骨骼肌率",
    waistCircumference: "腰围",
    hipCircumference: "臀围",
    chestCircumference: "胸围",
    thighCircumference: "大腿围",
    armCircumference: "大臂围",
  };
  return labels[key] || key;
}

function getUnit(key: MetricKey): string {
  if (key === "weight") return " kg";
  if (key === "bodyFat" || key === "muscleMass") return " %";
  // 围度类统一使用 cm
  return " cm";
}
</script>

<style scoped lang="scss">
.chart-container {
  width: 100%;
  height: 300px;
  position: relative;
}
</style>
