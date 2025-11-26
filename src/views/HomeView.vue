<template>
  <div class="home-view">
    <el-card class="welcome-card">
      <template #header>
        <div class="card-header">
          <span>欢迎回来，{{ userStore.profile?.nickname || "训练者" }}！</span>
        </div>
      </template>

      <div class="welcome-content">
        <el-empty v-if="!userStore.isOnboarded" description="还未完成初始设置">
          <el-button type="primary" @click="router.push('/onboarding')"
            >开始设置</el-button
          >
        </el-empty>

        <div v-else>
          <el-row :gutter="20">
            <el-col :xs="24" :sm="12" :md="8">
              <el-card shadow="hover" class="stat-card">
                <el-statistic
                  title="本周训练"
                  :value="weeklyWorkouts"
                  suffix="次"
                />
              </el-card>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8">
              <el-card shadow="hover" class="stat-card">
                <el-statistic
                  title="训练天数"
                  :value="trainingDays"
                  suffix="天"
                />
              </el-card>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8">
              <el-card shadow="hover" class="stat-card">
                <el-statistic
                  title="当前体重"
                  :value="currentWeight"
                  suffix="kg"
                  :precision="1"
                />
              </el-card>
            </el-col>
          </el-row>

          <el-card class="today-workout" style="margin-top: 20px">
            <template #header>
              <div class="card-header">
                <span>今日训练</span>
                <el-button type="primary" @click="router.push('/workout')"
                  >开始训练</el-button
                >
              </div>
            </template>
            <el-empty description="今日暂无训练计划" />
          </el-card>

          <el-row :gutter="20" style="margin-top: 20px">
            <el-col :xs="24" :sm="12">
              <el-card>
                <template #header>快捷操作</template>
                <div class="quick-actions">
                  <el-button
                    @click="router.push('/chat')"
                    :icon="ChatBubbleLeftRightIcon"
                    >与 AI 对话</el-button
                  >
                  <el-button @click="router.push('/plan')" :icon="CalendarIcon"
                    >查看计划</el-button
                  >
                  <el-button
                    @click="router.push('/progress')"
                    :icon="ChartBarIcon"
                    >查看进度</el-button
                  >
                </div>
              </el-card>
            </el-col>
            <el-col :xs="24" :sm="12">
              <el-card>
                <template #header>训练提示</template>
                <el-alert
                  title="记得热身"
                  type="info"
                  description="训练前进行 5-10 分钟热身可以有效减少受伤风险"
                  :closable="false"
                />
              </el-card>
            </el-col>
          </el-row>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/stores/user";
import { useWorkoutStore } from "@/stores/workout";
import { useBodyMetricsStore } from "@/stores/bodyMetrics";
import {
  ChatBubbleLeftRightIcon,
  CalendarIcon,
  ChartBarIcon,
} from "@heroicons/vue/24/outline";

const router = useRouter();
const userStore = useUserStore();
const workoutStore = useWorkoutStore();
const bodyMetricsStore = useBodyMetricsStore();

const weeklyWorkouts = computed(
  () =>
    workoutStore.workoutHistory.filter((w) => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(w.date) > weekAgo;
    }).length
);

const trainingDays = computed(() => workoutStore.workoutHistory.length);

// 优先使用最新的体测记录体重，如果没有则使用用户档案中的体重
const currentWeight = computed(() => {
  return bodyMetricsStore.latestWeight || userStore.profile?.currentWeight || 0;
});

// 加载用户档案和体测数据
onMounted(async () => {
  if (!userStore.profile) {
    await userStore.loadProfile();
  }

  // 加载体测数据以获取最新体重
  if (userStore.profile) {
    await bodyMetricsStore.loadMetrics();
  }
});
</script>

<style scoped lang="scss">
@import "@/styles/variables.scss";

.home-view {
  margin: 0 auto;
}

.welcome-card {
  border-radius: $--el-border-radius-base;
  box-shadow: $--el-box-shadow-card;
  border: 1px solid $--border-color-light;
  background: $--bg-color-card;

  :deep(.el-card__header) {
    padding: $--el-spacing-md;
    border-bottom: 1px solid $--border-color-light;
    background: transparent;
  }

  :deep(.el-card__body) {
    padding: $--el-spacing-md;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: $--el-font-size-large;
    font-weight: 600;
    color: $--text-color-primary;
  }
}

.welcome-content {
  min-height: 200px;
}

.stat-card {
  margin-bottom: $--el-spacing-md;
  text-align: center;
  border-radius: $--el-border-radius-base;
  border: 1px solid $--border-color-light;
  box-shadow: $--el-box-shadow-card;
  transition: $--transition-base;

  &:hover {
    box-shadow: $--el-box-shadow-light;
    transform: translateY(-2px);
  }

  :deep(.el-card__body) {
    padding: $--el-spacing-md;
  }

  @media (max-width: 768px) {
    margin-bottom: $--el-spacing-sm;
  }
}

.today-workout {
  border-radius: $--el-border-radius-base;
  box-shadow: $--el-box-shadow-card;
  border: 1px solid $--border-color-light;
  background: $--bg-color-card;

  :deep(.el-card__header) {
    padding: $--el-spacing-md;
    border-bottom: 1px solid $--border-color-light;
    background: transparent;
  }

  :deep(.el-card__body) {
    padding: $--el-spacing-md;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: $--el-font-size-large;
    font-weight: 600;
    color: $--text-color-primary;
  }
}

.quick-actions {
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  flex-direction: column;
  gap: $--el-spacing-sm;

  .el-button {
    width: 100%;
    justify-content: flex-start;
    border-radius: $--el-border-radius-small;
    transition: $--transition-base;

    &:hover {
      background-color: $--bg-color-hover;
    }
  }
  .el-button + .el-button {
    margin-left: 0 !important;
  }
}
</style>
