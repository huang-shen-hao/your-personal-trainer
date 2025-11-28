<template>
  <div class="plan-view">
    <!-- 顶部操作栏 -->
    <div class="top-bar">
      <h2>训练计划</h2>
      <el-button type="primary" @click="showCreateDialog = true">
        <PlusIcon style="width: 20px; height: 20px" />
        创建计划
      </el-button>
    </div>

    <!-- 活跃计划卡片 -->
    <div v-if="planStore.activePlan" class="active-plan-section">
      <h3 class="section-title">
        <StarIcon style="width: 20px; height: 20px" />
        当前计划
      </h3>
      <PlanCard
        :plan="planStore.activePlan"
        @click="viewPlanDetail"
        @command="handlePlanCommand"
      />
    </div>

    <!-- 计划列表 -->
    <div class="plans-section">
      <!-- 标签筛选 -->
      <div class="filter-tabs">
        <el-radio-group v-model="activeTab" size="large">
          <el-radio-button label="all"
            >全部 ({{ allPlans.length }})</el-radio-button
          >
          <el-radio-button label="active"
            >进行中 ({{ planStore.activePlans.length }})</el-radio-button
          >
          <el-radio-button label="archived"
            >未启用 ({{ planStore.archivedPlans.length }})</el-radio-button
          >
          <el-radio-button label="completed"
            >已完成 ({{ planStore.completedPlans.length }})</el-radio-button
          >
        </el-radio-group>
      </div>

      <!-- 计划网格 -->
      <div v-loading="planStore.loading" class="plans-grid">
        <PlanCard
          v-for="plan in filteredPlans"
          :key="plan.id"
          :plan="plan"
          @click="viewPlanDetail"
          @command="handlePlanCommand"
        />

        <el-empty
          v-if="filteredPlans.length === 0 && !planStore.loading"
          description="暂无计划"
          :image-size="120"
        >
          <el-button type="primary" @click="showCreateDialog = true">
            创建第一个计划
          </el-button>
        </el-empty>
      </div>
    </div>

    <!-- 创建计划对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      title="创建训练计划"
      width="90%"
      :style="{ maxWidth: '700px' }"
      @close="resetCreateForm"
    >
      <el-form :model="createForm" label-width="120px" label-position="left">
        <el-form-item label="训练目标" required label-position="top">
          <el-select v-model="createForm.goal" placeholder="选择训练目标">
            <el-option
              v-for="(config, key) in PLAN_GOAL_CONFIG"
              :key="key"
              :label="config.label"
              :value="key"
            >
              <div class="goal-option">
                <span>{{ config.label }}</span>
                <span class="goal-desc">{{ config.description }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="每周训练天数" required label-position="top">
          <el-slider
            v-model="createForm.daysPerWeek"
            :min="2"
            :max="6"
            :marks="{ 2: '2天', 3: '3天', 4: '4天', 5: '5天', 6: '6天' }"
            show-stops
          />
        </el-form-item>

        <el-form-item label="单次训练时长" required>
          <el-slider
            v-model="createForm.sessionDuration"
            :min="30"
            :max="120"
            :step="15"
            :marks="{
              30: '30分钟',
              60: '60分钟',
              90: '90分钟',
              120: '120分钟',
            }"
            show-stops
          />
        </el-form-item>

        <el-form-item label="训练分化" label-position="top">
          <el-select v-model="createForm.preferredSplit" placeholder="自动选择">
            <el-option label="自动选择" value="" />
            <el-option
              v-for="(config, key) in TRAINING_SPLIT_CONFIG"
              :key="key"
              :label="config.label"
              :value="key"
            >
              <div class="split-option">
                <span>{{ config.label }}</span>
                <span class="split-desc">{{ config.description }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="偏好设置" label-position="top">
          <el-checkbox-group v-model="preferences">
            <el-checkbox label="compound">偏好复合动作</el-checkbox>
            <el-checkbox label="isolation">包含孤立动作</el-checkbox>
            <el-checkbox label="cardio">包含有氧训练</el-checkbox>
            <el-checkbox label="highVolume">高容量训练</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="handleCreatePlan">
          生成计划
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { PlusIcon, StarIcon } from "@heroicons/vue/24/outline";
import { ElMessage, ElMessageBox } from "element-plus";
import { usePlanStore } from "@/stores/plan";
import { useUserStore } from "@/stores/user";
import { PLAN_GOAL_CONFIG, TRAINING_SPLIT_CONFIG } from "@/types/plan";
import type {
  TrainingPlan,
  PlanGoal,
  TrainingSplit,
  PlanGenerationConfig,
} from "@/types/plan";
import PlanCard from "@/components/PlanCard.vue";

const router = useRouter();
const planStore = usePlanStore();
const userStore = useUserStore();

const activeTab = ref<"all" | "active" | "archived" | "completed">("all");
const showCreateDialog = ref(false);
const creating = ref(false);

// 创建表单
const createForm = ref({
  goal: "muscle_gain" as PlanGoal,
  daysPerWeek: 4,
  sessionDuration: 60,
  preferredSplit: "" as TrainingSplit | "",
});

const preferences = ref<string[]>(["compound"]);

// 计算属性
const allPlans = computed(() => planStore.plans);

const filteredPlans = computed(() => {
  switch (activeTab.value) {
    case "active":
      return planStore.activePlans;
    case "archived":
      return planStore.archivedPlans;
    case "completed":
      return planStore.completedPlans;
    default:
      return allPlans.value;
  }
});

// 生命周期
onMounted(async () => {
  // 加载用户档案
  if (!userStore.profile) {
    await userStore.loadProfile();
  }

  // 加载训练计划
  if (userStore.profile) {
    await planStore.loadPlans(userStore.profile.id);
  }
});

// 方法
function viewPlanDetail(plan: TrainingPlan) {
  router.push(`/plan/${plan.id}`);
}

async function handlePlanCommand(command: string, plan: TrainingPlan) {
  switch (command) {
    case "view":
      viewPlanDetail(plan);
      break;

    case "edit":
      ElMessage.info("编辑功能开发中...");
      break;

    case "activate":
      try {
        await planStore.setActivePlan(plan.id);
        ElMessage.success("已设为活跃计划");
      } catch (error) {
        ElMessage.error("操作失败");
      }
      break;

    case "complete":
      try {
        await ElMessageBox.confirm("确认完成这个计划吗？", "提示", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        });
        await planStore.completePlan(plan.id);
        ElMessage.success("计划已完成");
      } catch (error) {
        if (error !== "cancel") {
          ElMessage.error("操作失败");
        }
      }
      break;

    case "duplicate":
      try {
        const newPlanId = await planStore.duplicatePlan(plan.id);
        ElMessage.success("计划已复制");
        const newPlan = planStore.plans.find((p) => p.id === newPlanId);
        if (newPlan) {
          viewPlanDetail(newPlan);
        }
      } catch (error) {
        ElMessage.error("复制失败");
      }
      break;

    case "delete":
      try {
        await ElMessageBox.confirm("确定要删除这个计划吗？", "提示", {
          confirmButtonText: "删除",
          cancelButtonText: "取消",
          type: "warning",
        });
        await planStore.deletePlan(plan.id);
        ElMessage.success("计划已删除");
      } catch (error) {
        if (error !== "cancel") {
          ElMessage.error("删除失败");
        }
      }
      break;
  }
}

async function handleCreatePlan() {
  if (!userStore.profile) {
    ElMessage.error("请先完成个人档案设置");
    router.push("/profile");
    return;
  }

  creating.value = true;
  try {
    const config: PlanGenerationConfig = {
      userId: userStore.profile.id,
      goal: createForm.value.goal,
      daysPerWeek: createForm.value.daysPerWeek,
      sessionDuration: createForm.value.sessionDuration,
      experienceLevel: userStore.profile.experienceLevel,
      equipment: userStore.profile.equipment,
      preferredSplit: createForm.value.preferredSplit || undefined,
      injuries: userStore.profile.injuries?.map((injury) => injury.description),
      preferences: {
        compound: preferences.value.includes("compound"),
        isolation: preferences.value.includes("isolation"),
        cardio: preferences.value.includes("cardio"),
        highVolume: preferences.value.includes("highVolume"),
      },
    };

    const plan = await planStore.createPlan(config);
    ElMessage.success("计划创建成功！");
    showCreateDialog.value = false;

    // 跳转到计划详情
    viewPlanDetail(plan);
  } catch (error) {
    ElMessage.error("创建失败，请重试");
    console.error("Create plan error:", error);
  } finally {
    creating.value = false;
  }
}

function resetCreateForm() {
  createForm.value = {
    goal: "muscle_gain",
    daysPerWeek: 4,
    sessionDuration: 60,
    preferredSplit: "",
  };
  preferences.value = ["compound"];
}
</script>

<style scoped lang="scss">
@import "@/styles/variables.scss";

.plan-view {
  margin: 0 auto;
  padding: $--el-spacing-md;

  .top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $--el-spacing-xl;

    h2 {
      margin: 0;
      font-size: $--el-font-size-xxl;
      font-weight: 600;
      color: $--text-color-primary;
    }
  }

  .active-plan-section {
    margin-bottom: $--el-spacing-xl;

    .section-title {
      display: flex;
      align-items: center;
      gap: $--el-spacing-sm;
      font-size: $--el-font-size-xl;
      font-weight: 600;
      color: $--text-color-primary;
      margin-bottom: $--el-spacing-md;

      svg {
        color: $--el-color-warning;
      }
    }
  }

  .plans-section {
    .filter-tabs {
      margin-bottom: $--el-spacing-lg;
      background: $--bg-color-card;
      padding: $--el-spacing-sm;
      border-radius: $--el-border-radius-base;
      border: 1px solid $--border-color-light;

      .el-radio-group {
        width: 100%;
        display: flex;
        gap: $--el-spacing-xs;

        :deep(.el-radio-button) {
          flex: 1;

          .el-radio-button__inner {
            width: 100%;
            border-radius: $--el-border-radius-small;
            transition: $--transition-base;
          }

          &.is-active .el-radio-button__inner {
            background-color: $--el-color-primary;
            border-color: $--el-color-primary;
          }
        }
      }
    }

    .plans-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: $--el-spacing-md;
      min-height: 200px;

      .el-empty {
        grid-column: 1 / -1;
      }
    }
  }
}

// 选项样式
.goal-option,
.split-option {
  display: flex;
  flex-direction: column;
  gap: $--el-spacing-xs;

  .goal-desc,
  .split-desc {
    font-size: $--el-font-size-small;
    color: $--text-color-secondary;
  }
}

// 移动端适配
@media (max-width: 768px) {
  .plan-view {
    padding: $--el-spacing-sm;

    .top-bar {
      margin-bottom: $--el-spacing-md;

      h2 {
        font-size: $--el-font-size-xl;
      }
    }

    .plans-section {
      .filter-tabs {
        padding: $--el-spacing-xs;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;

        &::-webkit-scrollbar {
          display: none;
        }

        .el-radio-group {
          flex-wrap: nowrap;
        }
      }

      .plans-grid {
        grid-template-columns: 1fr;
        gap: $--el-spacing-sm;
      }
    }

    .filter-tabs {
      .el-radio-group {
        gap: $--el-spacing-xs;

        :deep(.el-radio-button) {
          .el-radio-button__inner {
            border-radius: $--el-border-radius-small !important;
            white-space: nowrap;
          }
        }
      }
    }

    // 创建计划对话框表单：移动端 label 在上、控件在下垂直排列
    :deep(.el-dialog__body) {
      padding: $--el-spacing-md $--el-spacing-sm;
    }

    :deep(.el-form-item) {
      flex-direction: column;
      align-items: flex-start;
    }

    :deep(.el-form-item__label) {
      width: 100%;
      text-align: left;

      padding-right: 0;
    }

    :deep(.el-form-item__content) {
      width: 100%;
    }

    // 限制对话框内 slider 不左右溢出容器
    :deep(.el-slider) {
      width: 100%;
      margin: 0;
      box-sizing: border-box;
    }
  }
}
</style>
