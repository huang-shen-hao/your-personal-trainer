<template>
  <div class="chart-container">
    <Line v-if="chartType === 'line' && loaded" :data="lineChartData" :options="lineChartOptions" />
    <Bar v-else-if="chartType === 'bar' && loaded" :data="barChartData" :options="barChartOptions" />
    <el-empty v-else description="暂无数据" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Line, Bar } from "vue-chartjs";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartData,
  type ChartOptions,
} from "chart.js";
import type { WorkoutLog } from "@/stores/workout";

// 注册 Chart.js 组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Props {
  workouts: WorkoutLog[];
  chartType?: "line" | "bar";
  dataType?: "volume" | "frequency" | "duration";
  color?: string;
  title?: string;
}

const props = withDefaults(defineProps<Props>(), {
  chartType: "line",
  dataType: "volume",
  color: "#409eff",
});

const loaded = computed(() => props.workouts && props.workouts.length > 0);

// 计算训练量（总重量 × 次数）
function calculateVolume(workout: WorkoutLog): number {
  let volume = 0;
  for (const exercise of workout.exercises) {
    for (const set of exercise.sets) {
      if (set.completed && set.weight && set.reps) {
        volume += set.weight * set.reps;
      }
    }
  }
  return Math.round(volume);
}

// 计算训练时长（分钟）
function calculateDuration(workout: WorkoutLog): number {
  if (!workout.endTime || !workout.startTime) return 0;
  const start = workout.startTime instanceof Date ? workout.startTime : new Date(workout.startTime);
  const end = workout.endTime instanceof Date ? workout.endTime : new Date(workout.endTime);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
}

// 折线图数据（训练量趋势）
const lineChartData = computed<ChartData<"line">>(() => {
  const sortedWorkouts = [...props.workouts].sort(
    (a, b) => {
      const dateA = a.date instanceof Date ? a.date : new Date(a.date);
      const dateB = b.date instanceof Date ? b.date : new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    }
  );

  const labels = sortedWorkouts.map((w) => {
    const date = w.date instanceof Date ? w.date : new Date(w.date);
    return date.toLocaleDateString("zh-CN", {
      month: "short",
      day: "numeric",
    });
  });

  const data = sortedWorkouts.map((w) => {
    if (props.dataType === "volume") {
      return calculateVolume(w);
    } else if (props.dataType === "duration") {
      return calculateDuration(w);
    } else {
      return calculateDuration(w);
    }
  });

  return {
    labels,
    datasets: [
      {
        label: props.dataType === "volume" ? "训练量 (kg)" : props.dataType === "duration" ? "训练时长 (分钟)" : "训练时长 (分钟)",
        data,
        borderColor: props.color,
        backgroundColor: `${props.color}33`,
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };
});

// 柱状图数据（训练频率）
const barChartData = computed<ChartData<"bar">>(() => {
  // 按日期分组统计
  const dateMap = new Map<string, { count: number; timestamp: number }>();
  
  props.workouts.forEach((w) => {
    const date = w.date instanceof Date ? w.date : new Date(w.date);
    const dateKey = date.toLocaleDateString("zh-CN", {
      month: "short",
      day: "numeric",
    });
    const existing = dateMap.get(dateKey);
    if (existing) {
      existing.count += 1;
    } else {
      dateMap.set(dateKey, { count: 1, timestamp: date.getTime() });
    }
  });

  // 按时间戳排序
  const sortedEntries = Array.from(dateMap.entries()).sort((a, b) => {
    return a[1].timestamp - b[1].timestamp;
  });

  const labels = sortedEntries.map(([date]) => date);
  const data = sortedEntries.map(([, info]) => info.count);

  return {
    labels,
    datasets: [
      {
        label: "训练次数",
        data,
        backgroundColor: props.color,
        borderColor: props.color,
        borderWidth: 1,
      },
    ],
  };
});

const lineChartOptions = computed<ChartOptions<"line">>(() => {
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
              label += context.parsed.y.toLocaleString();
              label += props.dataType === "volume" ? " kg" : props.dataType === "duration" ? " 分钟" : " 分钟";
            }
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => {
            return value.toLocaleString() + (props.dataType === "volume" ? " kg" : props.dataType === "duration" ? " 分钟" : " 分钟");
          },
        },
      },
    },
  };
});

const barChartOptions = computed<ChartOptions<"bar">>(() => {
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
              label += context.parsed.y + " 次";
            }
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          callback: (value) => {
            return value + " 次";
          },
        },
      },
    },
  };
});
</script>

<style scoped lang="scss">
.chart-container {
  width: 100%;
  height: 300px;
  position: relative;
}
</style>

