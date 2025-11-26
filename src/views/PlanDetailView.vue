<template>
  <div class="plan-detail-view" v-loading="loading">
    <template v-if="plan">
      <!-- 顶部导航 -->
      <div class="top-nav">
        <el-button link @click="goBack">
          <ArrowLeftIcon style="width: 20px; height: 20px;" />
          返回
        </el-button>
        <div class="actions">
          <el-button 
            v-if="!plan.isActive && !plan.isCompleted" 
            type="success"
            @click="activatePlan"
          >
            开始此计划
          </el-button>
          <el-button 
            v-if="plan.isActive" 
            type="warning"
            @click="completePlan"
          >
            完成计划
          </el-button>
          <el-dropdown trigger="click" @command="handleCommand">
            <el-button>
              更多操作
              <ChevronDownIcon style="width: 20px; height: 20px;" />
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="duplicate">复制计划</el-dropdown-item>
                <el-dropdown-item command="export">导出计划</el-dropdown-item>
                <el-dropdown-item command="delete" divided>删除计划</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <!-- 计划头部信息 -->
      <el-card class="plan-header" shadow="never">
        <div class="header-content">
          <div class="plan-info">
            <div class="tags">
              <el-tag v-if="plan.isActive" type="success" effect="dark">进行中</el-tag>
              <el-tag v-if="plan.isCompleted" type="info">已完成</el-tag>
              <el-tag>{{ PLAN_GOAL_CONFIG[plan.goal].label }}</el-tag>
            </div>
            <h1 class="plan-title">{{ plan.name }}</h1>
            <p class="plan-description">{{ plan.description }}</p>
            
            <div class="plan-meta">
              <div class="meta-item">
                <CalendarIcon style="width: 20px; height: 20px;" />
                <span>{{ TRAINING_SPLIT_CONFIG[plan.split].label }}</span>
              </div>
              <div class="meta-item">
                <ClockIcon style="width: 20px; height: 20px;" />
                <span>{{ plan.daysPerWeek }}天/周 × {{ plan.weeks }}周</span>
              </div>
              <div class="meta-item" v-if="plan.startDate">
                <ClockIcon style="width: 20px; height: 20px;" />
                <span>{{ formatDate(plan.startDate) }} 开始</span>
              </div>
            </div>
          </div>

          <!-- 统计信息 -->
          <div class="plan-stats" v-if="stats">
            <div class="stat-card">
              <div class="stat-value">{{ stats.completedWorkouts }}</div>
              <div class="stat-label">已完成</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ stats.totalWorkouts }}</div>
              <div class="stat-label">总训练</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ stats.completionRate }}%</div>
              <div class="stat-label">完成率</div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 训练日列表 -->
      <div class="training-days-section">
        <h2 class="section-title">训练安排</h2>
        
        <el-row :gutter="20">
          <el-col 
            v-for="(day, index) in plan.trainingDays" 
            :key="day.id"
            :xs="24" 
            :sm="12" 
            :lg="8"
          >
            <el-card class="day-card" shadow="hover">
              <template #header>
                <div class="day-header">
                  <div class="day-title">
                    <span class="day-number">第{{ index + 1 }}天</span>
                    <span class="day-name">{{ day.name }}</span>
                  </div>
                  <el-tag size="small">{{ getDayLabel(day.dayOfWeek) }}</el-tag>
                </div>
              </template>

              <!-- 动作列表 -->
              <div class="exercises-list">
                <div 
                  v-for="(exerciseSet, idx) in day.exercises" 
                  :key="idx"
                  class="exercise-item"
                >
                  <div class="exercise-number">{{ idx + 1 }}</div>
                  <div class="exercise-content">
                    <div class="exercise-name">{{ exerciseSet.exercise?.name || '动作' }}</div>
                    <div class="exercise-details">
                      {{ exerciseSet.sets }} 组 × {{ exerciseSet.reps }} 次
                      <span class="rest">休息 {{ exerciseSet.restSeconds }}s</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 预计时长 -->
              <div class="day-footer" v-if="day.totalDuration">
                <ClockIcon style="width: 20px; height: 20px;" />
                <span>约 {{ day.totalDuration }} 分钟</span>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 热身和放松建议 -->
      <el-row :gutter="20" class="suggestions-section">
        <el-col :xs="24" :md="12">
          <el-card>
            <template #header>
              <div class="card-header">
                <SunIcon style="width: 20px; height: 20px;" />
                <span>热身建议</span>
              </div>
            </template>
            <ul class="suggestion-list">
              <li v-for="(item, index) in warmupSuggestions" :key="index">
                {{ item }}
              </li>
            </ul>
          </el-card>
        </el-col>
        <el-col :xs="24" :md="12">
          <el-card>
            <template #header>
              <div class="card-header">
                <MoonIcon style="width: 20px; height: 20px;" />
                <span>放松建议</span>
              </div>
            </template>
            <ul class="suggestion-list">
              <li v-for="(item, index) in cooldownSuggestions" :key="index">
                {{ item }}
              </li>
            </ul>
          </el-card>
        </el-col>
      </el-row>
    </template>

    <el-empty v-else-if="!loading" description="计划不存在" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  ArrowLeftIcon, 
  ChevronDownIcon,
  CalendarIcon, 
  ClockIcon, 
  SunIcon,
  MoonIcon
} from '@heroicons/vue/24/outline'
import { ElMessage, ElMessageBox } from 'element-plus'
import { usePlanStore } from '@/stores/plan'
import { planRepository } from '@/db/repositories/planRepository'
import { PLAN_GOAL_CONFIG, TRAINING_SPLIT_CONFIG } from '@/types/plan'
import type { TrainingPlan } from '@/types/plan'

const route = useRoute()
const router = useRouter()
const planStore = usePlanStore()

const plan = ref<TrainingPlan | null>(null)
const loading = ref(true)
const stats = ref<{
  totalWorkouts: number
  completedWorkouts: number
  completionRate: number
} | null>(null)

// 计算属性
const warmupSuggestions = computed(() => {
  if (!plan.value || plan.value.trainingDays.length === 0) return []
  // 获取第一个训练日的热身建议作为示例
  return plan.value.trainingDays[0].warmup || []
})

const cooldownSuggestions = computed(() => {
  if (!plan.value || plan.value.trainingDays.length === 0) return []
  return plan.value.trainingDays[0].cooldown || []
})

// 生命周期
onMounted(async () => {
  await loadPlan()
})

// 方法
async function loadPlan() {
  loading.value = true
  try {
    const planId = route.params.id as string
    plan.value = await planRepository.getPlanById(planId) || null
    
    if (plan.value) {
      stats.value = await planRepository.getPlanStats(planId)
    }
  } catch (error) {
    ElMessage.error('加载计划失败')
    console.error('Load plan error:', error)
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.back()
}

async function activatePlan() {
  if (!plan.value) return
  
  try {
    await planStore.setActivePlan(plan.value.id)
    ElMessage.success('计划已激活！')
    await loadPlan() // 重新加载以更新状态
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

async function completePlan() {
  if (!plan.value) return
  
  try {
    await ElMessageBox.confirm('确认完成这个计划吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await planStore.completePlan(plan.value.id)
    ElMessage.success('计划已完成！')
    await loadPlan()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

async function handleCommand(command: string) {
  if (!plan.value) return
  
  switch (command) {
    case 'duplicate':
      try {
        const newPlanId = await planStore.duplicatePlan(plan.value.id)
        ElMessage.success('计划已复制')
        router.push(`/plan/${newPlanId}`)
      } catch (error) {
        ElMessage.error('复制失败')
      }
      break
    
    case 'export':
      ElMessage.info('导出功能开发中...')
      break
    
    case 'delete':
      try {
        await ElMessageBox.confirm('确定要删除这个计划吗？', '提示', {
          confirmButtonText: '删除',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        await planStore.deletePlan(plan.value.id)
        ElMessage.success('计划已删除')
        router.push('/plan')
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('删除失败')
        }
      }
      break
  }
}

function getDayLabel(dayOfWeek: number): string {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return days[dayOfWeek] || ''
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
.plan-detail-view {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;

  .top-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .actions {
      display: flex;
      gap: 12px;
    }
  }

  .plan-header {
    margin-bottom: 32px;

    .header-content {
      display: flex;
      justify-content: space-between;
      gap: 40px;

      .plan-info {
        flex: 1;

        .tags {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .plan-title {
          font-size: 32px;
          font-weight: bold;
          color: var(--el-text-color-primary);
          margin: 0 0 12px 0;
          line-height: 1.3;
        }

        .plan-description {
          font-size: 16px;
          color: var(--el-text-color-regular);
          line-height: 1.6;
          margin: 0 0 24px 0;
          white-space: pre-line;
        }

        .plan-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 24px;

          .meta-item {
            display: flex;
            align-items: center;
            gap: 8px;
            color: var(--el-text-color-regular);

            svg {
              width: 18px;
              height: 18px;
              color: var(--el-text-color-secondary);
            }
          }
        }
      }

      .plan-stats {
        display: flex;
        gap: 24px;

        .stat-card {
          text-align: center;
          padding: 16px;
          background: var(--el-fill-color-lighter);
          border-radius: 8px;
          min-width: 100px;

          .stat-value {
            font-size: 32px;
            font-weight: bold;
            color: var(--el-color-primary);
            margin-bottom: 8px;
          }

          .stat-label {
            font-size: 14px;
            color: var(--el-text-color-secondary);
          }
        }
      }
    }
  }

  .training-days-section {
    margin-bottom: 32px;

    .section-title {
      font-size: 24px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin-bottom: 20px;
    }

    .day-card {
      height: 100%;
      margin-bottom: 20px;

      .day-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .day-title {
          display: flex;
          flex-direction: column;
          gap: 4px;

          .day-number {
            font-size: 12px;
            color: var(--el-text-color-secondary);
          }

          .day-name {
            font-size: 16px;
            font-weight: 600;
            color: var(--el-text-color-primary);
          }
        }
      }

      .exercises-list {
        .exercise-item {
          display: flex;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid var(--el-border-color-lighter);

          &:last-child {
            border-bottom: none;
          }

          .exercise-number {
            width: 24px;
            height: 24px;
            background: var(--el-color-primary);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            flex-shrink: 0;
          }

          .exercise-content {
            flex: 1;

            .exercise-name {
              font-size: 15px;
              font-weight: 500;
              color: var(--el-text-color-primary);
              margin-bottom: 4px;
            }

            .exercise-details {
              font-size: 13px;
              color: var(--el-text-color-secondary);

              .rest {
                margin-left: 8px;
                padding-left: 8px;
                border-left: 1px solid var(--el-border-color);
              }
            }
          }
        }
      }

      .day-footer {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid var(--el-border-color-lighter);
        font-size: 13px;
        color: var(--el-text-color-secondary);

        svg {
          width: 14px;
          height: 14px;
        }
      }
    }
  }

  .suggestions-section {
    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
    }

    .suggestion-list {
      list-style: none;
      padding: 0;
      margin: 0;

      li {
        padding: 8px 0;
        padding-left: 20px;
        position: relative;
        color: var(--el-text-color-regular);

        &::before {
          content: "•";
          position: absolute;
          left: 0;
          color: var(--el-color-primary);
          font-weight: bold;
        }
      }
    }
  }
}

// 移动端适配
@media (max-width: 768px) {
  .plan-detail-view {
    padding: 16px;

    .top-nav {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;

      .actions {
        width: 100%;
        flex-direction: column;

        .el-button {
          width: 100%;
        }
      }
    }

    .plan-header .header-content {
      flex-direction: column;

      .plan-info .plan-title {
        font-size: 24px;
      }

      .plan-stats {
        width: 100%;
        justify-content: space-around;

        .stat-card {
          min-width: 80px;
          padding: 12px;

          .stat-value {
            font-size: 24px;
          }
        }
      }
    }

    .suggestions-section {
      .el-col {
        margin-bottom: 16px;
      }
    }
  }
}
</style>

