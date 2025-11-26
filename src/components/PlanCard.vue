<template>
  <el-card 
    class="plan-card" 
    :class="{ 'active': plan.isActive, 'completed': plan.isCompleted }"
    shadow="hover"
    @click="$emit('click', plan)"
  >
    <!-- 顶部标签 -->
    <div class="card-header">
      <div class="tags">
        <el-tag 
          v-if="plan.isActive" 
          type="success" 
          size="small"
          effect="dark"
        >
          进行中
        </el-tag>
        <el-tag 
          v-if="plan.isCompleted" 
          type="info" 
          size="small"
        >
          已完成
        </el-tag>
        <el-tag size="small">{{ PLAN_GOAL_CONFIG[plan.goal].label }}</el-tag>
        <el-tag size="small" type="warning">{{ plan.daysPerWeek }}天/周</el-tag>
      </div>
      <el-dropdown trigger="click" @command="handleCommand">
        <EllipsisVerticalIcon style="width: 20px; height: 20px;" class="more-icon" />
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="view">查看详情</el-dropdown-item>
            <el-dropdown-item command="edit" v-if="!plan.isCompleted">编辑</el-dropdown-item>
            <el-dropdown-item command="activate" v-if="!plan.isActive && !plan.isCompleted">
              设为活跃
            </el-dropdown-item>
            <el-dropdown-item command="complete" v-if="plan.isActive">完成计划</el-dropdown-item>
            <el-dropdown-item command="duplicate">复制</el-dropdown-item>
            <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- 计划名称 -->
    <h3 class="plan-name">{{ plan.name }}</h3>

    <!-- 统计信息 -->
    <div class="stats" v-if="stats">
      <div class="stat-item">
        <span class="label">完成度</span>
        <el-progress 
          :percentage="stats.completionRate" 
          :color="getProgressColor(stats.completionRate)"
          :stroke-width="8"
        />
      </div>
      <div class="stat-row">
        <div class="stat-item">
          <span class="label">已完成</span>
          <span class="value">{{ stats.completedWorkouts }}/{{ stats.totalWorkouts }}</span>
        </div>
        <div class="stat-item">
          <span class="label">周期</span>
          <span class="value">{{ plan.weeks }}周</span>
        </div>
      </div>
    </div>

    <!-- 计划信息 -->
    <div class="plan-info">
      <div class="info-item">
        <CalendarIcon style="width: 16px; height: 16px;" />
        <span>{{ TRAINING_SPLIT_CONFIG[plan.split].label }}</span>
      </div>
      <div class="info-item" v-if="plan.startDate">
        <ClockIcon style="width: 16px; height: 16px;" />
        <span>{{ formatDate(plan.startDate) }} 开始</span>
      </div>
    </div>

    <!-- 标签 -->
    <div class="plan-tags" v-if="plan.tags && plan.tags.length > 0">
      <el-tag 
        v-for="tag in plan.tags.slice(0, 3)" 
        :key="tag" 
        size="small"
        effect="plain"
      >
        {{ tag }}
      </el-tag>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { EllipsisVerticalIcon, CalendarIcon, ClockIcon } from '@heroicons/vue/24/outline'
import { PLAN_GOAL_CONFIG, TRAINING_SPLIT_CONFIG } from '@/types/plan'
import type { TrainingPlan } from '@/types/plan'

const props = defineProps<{
  plan: TrainingPlan
}>()

const emit = defineEmits<{
  click: [plan: TrainingPlan]
  command: [command: string, plan: TrainingPlan]
}>()

const stats = ref<{
  totalWorkouts: number
  completedWorkouts: number
  completionRate: number
} | null>(null)

onMounted(async () => {
  // 这里可以加载统计数据
  // 暂时使用模拟数据
  stats.value = {
    totalWorkouts: props.plan.trainingDays.length * props.plan.weeks,
    completedWorkouts: 0,
    completionRate: 0
  }
})

function handleCommand(command: string) {
  emit('command', command, props.plan)
}

function getProgressColor(percentage: number): string {
  if (percentage < 30) return '#f56c6c'
  if (percentage < 70) return '#e6a23c'
  return '#67c23a'
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.plan-card {
  cursor: pointer;
  transition: $--transition-base;
  border: 1px solid $--border-color-light;
  border-radius: $--el-border-radius-base;
  background: $--bg-color-card;
  box-shadow: $--el-box-shadow-card;

  &:hover {
    transform: translateY(-2px);
    box-shadow: $--el-box-shadow-hover;
    border-color: $--el-color-primary-light;
  }

  &.active {
    border-color: $--el-color-primary;
    background: linear-gradient(135deg, $--el-color-primary-lighter 0%, $--bg-color-card 100%);
    box-shadow: 0 2px 8px 0 rgba(51, 112, 255, 0.12);
  }

  &.completed {
    opacity: 0.85;
    background: $--bg-color-hover;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: $--el-spacing-md;

    .tags {
      display: flex;
      gap: $--el-spacing-xs;
      flex-wrap: wrap;
      flex: 1;
    }

    .more-icon {
      width: 20px;
      height: 20px;
      color: $--text-color-secondary;
      cursor: pointer;
      padding: $--el-spacing-xs;
      border-radius: $--el-border-radius-small;
      transition: $--transition-fast;

      &:hover {
        background: $--bg-color-hover;
        color: $--el-color-primary;
      }
    }
  }

  .plan-name {
    font-size: $--el-font-size-xl;
    font-weight: 600;
    color: $--text-color-primary;
    margin: 0 0 $--el-spacing-md 0;
    line-height: 1.5;
  }

  .stats {
    margin-bottom: $--el-spacing-md;

    .stat-item {
      margin-bottom: $--el-spacing-sm;

      &:last-child {
        margin-bottom: 0;
      }

      .label {
        font-size: $--el-font-size-small;
        color: $--text-color-secondary;
        display: block;
        margin-bottom: $--el-spacing-xs;
      }

      .value {
        font-size: $--el-font-size-large;
        font-weight: 600;
        color: $--text-color-primary;
      }
    }

    .stat-row {
      display: flex;
      gap: $--el-spacing-md;

      .stat-item {
        flex: 1;
      }
    }
  }

  .plan-info {
    display: flex;
    flex-direction: column;
    gap: $--el-spacing-sm;
    margin-bottom: $--el-spacing-sm;

    .info-item {
      display: flex;
      align-items: center;
      gap: $--el-spacing-sm;
      font-size: $--el-font-size-base;
      color: $--text-color-regular;

      svg {
        width: 16px;
        height: 16px;
        color: $--text-color-secondary;
      }
    }
  }

  .plan-tags {
    display: flex;
    gap: $--el-spacing-xs;
    flex-wrap: wrap;
    padding-top: $--el-spacing-sm;
    border-top: 1px solid $--border-color-light;
  }
}
</style>

