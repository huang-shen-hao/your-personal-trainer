<template>
  <el-container class="main-layout">
    <!-- 头部 -->
    <el-header class="header">
      <div class="logo">
        <!-- 移动端汉堡菜单按钮 -->
        <el-button
          v-if="isMobile"
          text
          circle
          @click="mobileDrawerVisible = true"
          class="menu-toggle"
        >
          <Bars3Icon style="width: 20px; height: 20px; display: block" />
        </el-button>
        <img :src="logo" alt="GYM AI" class="logo-mark" />
        <span class="brand-text">GYM AI</span>
      </div>
      <div class="header-actions">
        <el-popover
          placement="bottom-end"
          :width="280"
          trigger="hover"
          :show-after="300"
          popper-class="user-profile-popover"
        >
          <template #reference>
            <el-button
              circle
              class="user-avatar-btn"
              @click="router.push('/profile')"
            >
              <UserIcon style="width: 20px; height: 20px; display: block" />
            </el-button>
          </template>
          <div class="user-profile-info" v-if="userStore.profile">
            <div class="profile-header">
              <div class="profile-name">
                <div class="nickname">
                  {{
                    userStore.profile.nickname ||
                    userStore.profile.realName ||
                    "GYM AI 用户"
                  }}
                </div>
                <div class="real-name" v-if="userStore.profile.realName">
                  {{ userStore.profile.realName }}
                </div>
              </div>
            </div>
            <el-divider style="margin: 12px 0" />
            <div class="profile-details">
              <div class="detail-item">
                <span class="label">年龄：</span>
                <span class="value">{{ userStore.age || "—" }}岁</span>
              </div>
              <div class="detail-item">
                <span class="label">身高：</span>
                <span class="value"
                  >{{ userStore.profile.height || "—" }}cm</span
                >
              </div>
              <div class="detail-item">
                <span class="label">体重：</span>
                <span class="value">
                  {{ userStore.profile.currentWeight || "—" }}kg
                </span>
              </div>
              <div class="detail-item">
                <span class="label">经验等级：</span>
                <span class="value">{{ experienceLevelLabel }}</span>
              </div>
            </div>
            <el-button
              type="primary"
              style="width: 100%; margin-top: 12px"
              @click="router.push('/profile')"
            >
              查看详情
            </el-button>
          </div>
          <div class="user-profile-info" v-else>
            <div class="profile-header">
              <div class="profile-name">
                <div class="nickname">未登录</div>
              </div>
            </div>
            <el-button
              type="primary"
              style="width: 100%; margin-top: 12px"
              @click="router.push('/profile')"
            >
              完善档案
            </el-button>
          </div>
        </el-popover>
      </div>
    </el-header>

    <el-container>
      <!-- 侧边栏（桌面端） -->
      <el-aside
        v-if="!isMobile"
        :width="sidebarCollapsed ? '84px' : '168px'"
        class="sidebar"
        :class="{ 'sidebar-collapsed': sidebarCollapsed }"
      >
        <el-menu
          :default-active="activeMenu"
          router
          @select="handleMenuSelect"
          :collapse="sidebarCollapsed"
        >
          <el-tooltip
            :disabled="!sidebarCollapsed"
            content="首页"
            placement="right"
            :show-after="200"
          >
            <el-menu-item index="/">
              <span class="menu-icon" v-html="getAsideIcon('/')"></span>
              <span>首页</span>
            </el-menu-item>
          </el-tooltip>
          <el-tooltip
            :disabled="!sidebarCollapsed"
            content="对话"
            placement="right"
            :show-after="200"
          >
            <el-menu-item index="/chat">
              <span class="menu-icon" v-html="getAsideIcon('/chat')"></span>
              <span>对话</span>
            </el-menu-item>
          </el-tooltip>
          <el-tooltip
            :disabled="!sidebarCollapsed"
            content="训练计划"
            placement="right"
            :show-after="200"
          >
            <el-menu-item index="/plan">
              <span class="menu-icon" v-html="getAsideIcon('/plan')"></span>
              <span>计划</span>
            </el-menu-item>
          </el-tooltip>
          <el-tooltip
            :disabled="!sidebarCollapsed"
            content="训练"
            placement="right"
            :show-after="200"
          >
            <el-menu-item index="/workout">
              <span class="menu-icon" v-html="getAsideIcon('/workout')"></span>
              <span>训练</span>
            </el-menu-item>
          </el-tooltip>
          <el-tooltip
            :disabled="!sidebarCollapsed"
            content="统计"
            placement="right"
            :show-after="200"
          >
            <el-menu-item index="/progress">
              <span class="menu-icon" v-html="getAsideIcon('/progress')"></span>
              <span>统计</span>
            </el-menu-item>
          </el-tooltip>
          <el-tooltip
            :disabled="!sidebarCollapsed"
            content="数据"
            placement="right"
            :show-after="200"
          >
            <el-menu-item index="/body-metrics">
              <span
                class="menu-icon"
                v-html="getAsideIcon('/body-metrics')"
              ></span>
              <span>数据</span>
            </el-menu-item>
          </el-tooltip>
          <el-tooltip
            :disabled="!sidebarCollapsed"
            content="配置"
            placement="right"
            :show-after="200"
          >
            <el-menu-item index="/ai-config">
              <span
                class="menu-icon"
                v-html="getAsideIcon('/ai-config')"
              ></span>
              <span>配置</span>
            </el-menu-item>
          </el-tooltip>
        </el-menu>
        <!-- <div class="sidebar-footer">
          <el-button
            v-if="!sidebarCollapsed"
            text
            circle
            class="collapse-btn"
            @click="toggleSidebar"
          >
            <ChevronLeftIcon
              style="width: 20px; height: 20px; display: block"
            />
          </el-button>
          <el-button
            v-else
            text
            circle
            class="collapse-btn"
            @click="toggleSidebar"
          >
            <ChevronRightIcon
              style="width: 20px; height: 20px; display: block"
            />
          </el-button>
        </div> -->
      </el-aside>

      <!-- 移动端抽屉侧边栏 -->
      <el-drawer
        v-model="mobileDrawerVisible"
        :with-header="false"
        direction="ltr"
        size="160px"
        class="mobile-drawer"
      >
        <div class="drawer-header">
          <div class="logo">
            <img :src="logo" alt="GYM AI" class="logo-mark" />
          </div>
          <el-button
            text
            circle
            class="drawer-close"
            @click="mobileDrawerVisible = false"
          >
            <XMarkIcon style="width: 20px; height: 20px; display: block" />
          </el-button>
        </div>
        <div class="drawer-content">
          <el-menu
            :default-active="activeMenu"
            router
            @select="handleMobileMenuSelect"
          >
            <el-menu-item index="/">
              <span class="menu-icon" v-html="getAsideIcon('/')"></span>
              <span class="menu-text">首页</span>
            </el-menu-item>
            <el-menu-item index="/chat">
              <span class="menu-icon" v-html="getAsideIcon('/chat')"></span>
              <span class="menu-text">对话</span>
            </el-menu-item>
            <el-menu-item index="/plan">
              <span class="menu-icon" v-html="getAsideIcon('/plan')"></span>
              <span class="menu-text">计划</span>
            </el-menu-item>
            <el-menu-item index="/workout">
              <span class="menu-icon" v-html="getAsideIcon('/workout')"></span>
              <span class="menu-text">训练</span>
            </el-menu-item>
            <el-menu-item index="/progress">
              <span class="menu-icon" v-html="getAsideIcon('/progress')"></span>
              <span class="menu-text">统计</span>
            </el-menu-item>
            <el-menu-item index="/body-metrics">
              <span
                class="menu-icon"
                v-html="getAsideIcon('/body-metrics')"
              ></span>
              <span class="menu-text">数据</span>
            </el-menu-item>
            <el-menu-item index="/ai-config">
              <span
                class="menu-icon"
                v-html="getAsideIcon('/ai-config')"
              ></span>
              <span class="menu-text">配置</span>
            </el-menu-item>
          </el-menu>
        </div>
      </el-drawer>

      <!-- 主内容区 -->
      <el-main
        class="main-content"
        :class="{ 'content-expanded': sidebarCollapsed && !isMobile }"
      >
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useUserStore } from "@/stores/user";
import { EXPERIENCE_LEVEL_LABELS } from "@/types/user";
import {
  UserIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/vue/24/outline";
import logo from "@/assets/images/logo.svg";
import calendarScheduleFill from "@/assets/images/aside/calendar-schedule-fill.svg?raw";
import calendarScheduleLine from "@/assets/images/aside/calendar-schedule-line.svg?raw";
import chatSmileAiFill from "@/assets/images/aside/chat-smile-ai-fill.svg?raw";
import chatSmileAiLine from "@/assets/images/aside/chat-smile-ai-line.svg?raw";
import homeFill from "@/assets/images/aside/home-3-fill.svg?raw";
import homeLine from "@/assets/images/aside/home-3-line.svg?raw";
import numbersFill from "@/assets/images/aside/numbers-fill.svg?raw";
import numbersLine from "@/assets/images/aside/numbers-line.svg?raw";
import pieChartFill from "@/assets/images/aside/pie-chart-2-fill.svg?raw";
import pieChartLine from "@/assets/images/aside/pie-chart-2-line.svg?raw";
import pingPongFill from "@/assets/images/aside/ping-pong-fill.svg?raw";
import pingPongLine from "@/assets/images/aside/ping-pong-line.svg?raw";
import settingsFill from "@/assets/images/aside/settings-2-fill.svg?raw";
import settingsLine from "@/assets/images/aside/settings-2-line.svg?raw";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

// 经验等级标签
const experienceLevelLabel = computed(() => {
  if (!userStore.profile) return "未设置";
  return EXPERIENCE_LEVEL_LABELS[userStore.profile.experienceLevel] || "未设置";
});

// 侧边栏状态
const sidebarCollapsed = ref(false);
const mobileDrawerVisible = ref(false);

// 窗口宽度状态
const windowWidth = ref(
  typeof window !== "undefined" ? window.innerWidth : 1024
);

// 判断是否为移动端
const isMobile = computed(() => {
  return windowWidth.value < 768;
});

const activeMenu = computed(() => route.path);

type MenuKey =
  | "/"
  | "/chat"
  | "/plan"
  | "/workout"
  | "/progress"
  | "/body-metrics"
  | "/ai-config";

const asideIconMap: Record<MenuKey, { active: string; inactive: string }> = {
  "/": { active: homeFill, inactive: homeLine },
  "/chat": { active: chatSmileAiFill, inactive: chatSmileAiLine },
  "/plan": { active: calendarScheduleFill, inactive: calendarScheduleLine },
  "/workout": { active: pingPongFill, inactive: pingPongLine },
  "/progress": { active: pieChartFill, inactive: pieChartLine },
  "/body-metrics": { active: numbersFill, inactive: numbersLine },
  "/ai-config": { active: settingsFill, inactive: settingsLine },
};

function getAsideIcon(index: MenuKey) {
  const icon = asideIconMap[index];
  return activeMenu.value === index ? icon.active : icon.inactive;
}

// 监听窗口大小变化
function handleResize() {
  windowWidth.value = window.innerWidth;
  // 如果从移动端切换到桌面端，关闭抽屉
  if (windowWidth.value >= 768) {
    mobileDrawerVisible.value = false;
  }
}

onMounted(() => {
  window.addEventListener("resize", handleResize);
  if (!userStore.profile) {
    userStore.loadProfile().catch((err) => {
      console.error("用户档案加载失败", err);
    });
  }
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
});

// Sidebar toggle is handled by mobile drawer
// function toggleSidebar() {
//   sidebarCollapsed.value = !sidebarCollapsed.value;
// }

function handleMenuSelect(index: string) {
  console.log("Menu selected:", index);
}

function handleMobileMenuSelect(index: string) {
  router.push(index);
  // 移动端选择菜单后自动关闭抽屉
  mobileDrawerVisible.value = false;
}
</script>

<style scoped lang="scss">
@import "@/styles/variables.scss";

.main-layout {
  height: 100vh;
  overflow: hidden;
  background-color: $--bg-color-base;
  background:
    radial-gradient(
      20.01% 15% at 14.06% 10.9%,
      rgb(255 199 199 / 20%) 0%,
      rgba(255, 239, 239, 0) 100%
    ),
    linear-gradient(144deg, rgb(252 255 235) 0.9%, rgb(244 245 255) 21.87%),
    rgb(29 255 0);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  // background: rgba(255, 255, 255, 0.82);
  // backdrop-filter: blur(14px);
  // border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  padding: 0 $--el-spacing-lg;
  height: 64px;
  // box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);

  .logo {
    display: flex;
    align-items: center;
    gap: $--el-spacing-sm;
    font-size: 18px;
    font-weight: 700;
    color: #0b1429;

    .logo-mark {
      width: 32px;
      height: 32px;
    }

    .brand-text {
      letter-spacing: 0.02em;
    }

    .menu-toggle {
      margin-right: $--el-spacing-sm;
      color: $--text-color-regular;

      &:hover {
        color: $--el-color-primary;
        background-color: $--bg-color-hover;
      }
    }
  }

  .header-actions {
    display: flex;
    gap: $--el-spacing-sm;
    align-items: center;

    .el-button {
      background: white;
      border: 1px solid rgba(0, 0, 0, 0.06);
      box-shadow: 0 6px 18px rgba(15, 23, 42, 0.06);

      &:hover {
        border-color: $--el-color-primary;
      }
    }

    .user-avatar-btn {
      color: $--text-color-regular;
      transition: $--transition-base;

      &:hover {
        color: $--el-color-primary;
        background-color: $--bg-color-hover;
      }
    }

    .settings-btn {
      color: $--text-color-regular;

      &:hover {
        color: $--el-color-primary;
        background-color: $--bg-color-hover;
      }
    }
  }

  @media (max-width: 768px) {
    padding: 0 $--el-spacing-md;
    height: 56px;

    .logo {
      .logo-mark {
        display: none;
      }

      .brand-text {
        display: none;
      }
    }
  }
}

.sidebar {
  // background: linear-gradient(180deg, #f3f6ff 0%, #f4f2f3 100%);
  // border-right: 1px solid rgba(0, 0, 0, 0.04);
  overflow-y: auto;
  overflow-x: hidden;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  // box-shadow: inset -1px 0 0 rgba(255, 255, 255, 0.6);
  position: relative;
  width: 70px;

  .sidebar-footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding: $--el-spacing-sm;
    border-bottom: 1px solid $--border-color-light;
    height: 48px;
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;

    .collapse-btn {
      margin-left: auto;
      color: $--text-color-secondary;

      &:hover {
        color: $--el-color-primary;
        background-color: $--bg-color-hover;
      }
    }
  }

  .el-menu {
    border-right: none;
    background-color: transparent;
    transition: $--transition-base;
    // padding: $--el-spacing-lg 0;

    // 确保 tooltip 包裹的菜单项能正常显示
    :deep(.el-tooltip__trigger) {
      width: 100%;
    }

    // 菜单项样式
    :deep(.el-menu-item) {
      margin: 0 $--el-spacing-sm;
      border-radius: 14px;
      height: 56px;
      line-height: 1;
      width: calc(100% - $--el-spacing-sm * 2);

      font-weight: 500;
      color: #333;
      font-size: 12px;
      transition: $--transition-base;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
      text-align: center;

      &:hover {
        background: hsla(0, 0%, 100%, 0.8);
        color: #000;
      }

      &.is-active {
        background: hsla(0, 0%, 100%, 0.5);
        color: #000;
        font-weight: 500;
      }

      .menu-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        height: 18px;
      }

      .menu-icon :deep(svg) {
        width: 22px;
        height: 22px;
        margin: 0;
        // color: currentColor;
        // fill: currentColor;
        display: block;
      }
    }
    .el-menu-item + .el-menu-item {
      margin-top: 12px;
    }
  }

  &.sidebar-collapsed {
    width: 64px;
    .sidebar-footer {
      justify-content: center;
    }
  }
}

.main-content {
  background-color: #fff;
  border-radius: 18px;
  // padding: $--el-spacing-md;
  padding: 0 !important;
  overflow-y: auto;
  height: calc(100vh - 56px);
  transition: $--transition-base;

  @media (max-width: 768px) {
    height: calc(100vh - 52px);
    padding: $--el-spacing-sm;
    // 移动端底部安全边距优化
    padding-bottom: calc($--el-spacing-sm + env(safe-area-inset-bottom));
  }
}

.mobile-drawer {
  :deep(.mobile-drawer.el-drawer) {
    background-color: transparent;
    box-shadow: none;
  }

  .drawer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $--el-spacing-sm $--el-spacing-md;
    border-bottom: 1px solid rgba(15, 23, 42, 0.04);
    background-color: rgba(255, 255, 255, 0.96);
    backdrop-filter: blur(18px);

    .logo {
      display: flex;
      align-items: center;
      gap: $--el-spacing-sm;
      color: #020617;

      .logo-mark {
        width: 28px;
        height: 28px;
        border-radius: 8px;
        box-shadow: 0 8px 20px rgba(15, 23, 42, 0.16);
      }

      .brand {
        display: flex;
        flex-direction: column;
        gap: 2px;

        .brand-text {
          font-size: 16px;
          font-weight: 700;
          letter-spacing: 0.02em;
        }

        .brand-subtitle {
          font-size: 11px;
          color: #6b7280;
        }
      }
    }

    .drawer-close {
      color: #6b7280;
      border-radius: 999px;

      &:hover {
        background-color: #f3f4f6;
        color: #111827;
      }
    }
  }

  .drawer-content {
    padding: $--el-spacing-sm $--el-spacing-xs $--el-spacing-md;
    // 为底部添加安全边距
    padding-bottom: calc($--el-spacing-md + env(safe-area-inset-bottom));
    height: 100%;
  }

  .drawer-section-title {
    padding: 0 $--el-spacing-lg;
    margin-bottom: $--el-spacing-xs;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #9ca3af;
  }

  .el-menu {
    border-right: none;
    background-color: transparent;
    padding: $--el-spacing-xs 0;

    :deep(.el-menu-item) {
      margin: 2px $--el-spacing-sm;
      border-radius: 999px;
      height: 44px;
      line-height: 44px;
      color: #111827;
      transition: $--transition-base;
      display: flex;
      align-items: center;
      padding-inline: $--el-spacing-lg;

      &:hover {
        background-color: #f3f4f6;
        color: #111827;
      }

      &.is-active {
        background: #111827;
        color: #f9fafb;
        font-weight: 500;
      }

      .menu-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        margin-right: 10px;
      }

      .menu-icon :deep(svg) {
        width: 18px;
        height: 18px;
        display: block;
      }

      .menu-text {
        font-size: 14px;
        font-weight: 500;
      }
    }
  }
}

:deep(.mobile-drawer .el-drawer__body) {
  padding: 0 !important;
  background-color: transparent;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 用户档案 Popover 样式 */
:deep(.user-profile-popover) {
  .user-profile-info {
    .profile-header {
      display: flex;
      align-items: center;
      gap: $--el-spacing-md;
      padding-bottom: 8px;

      .profile-icon {
        background-color: $--el-color-primary-lighter;
        border-radius: 50%;
        padding: 8px;
      }

      .profile-name {
        flex: 1;

        .nickname {
          font-size: $--el-font-size-large;
          font-weight: 600;
          color: #fff;
          margin-bottom: 4px;
        }

        .real-name {
          font-size: $--el-font-size-small;
          color: #fff;
        }
      }
    }

    .profile-details {
      .detail-item {
        display: flex;
        justify-content: space-between;
        padding: 6px 0;
        font-size: $--el-font-size-base;

        .label {
          color: $--text-color-secondary;
        }

        .value {
          color: $--text-color-primary;
          font-weight: 500;
        }
      }
    }
  }
}

:global(.dark) {
  :deep(.user-profile-popover) {
    background-color: $--bg-color-card;
    border-color: $--border-color-light;

    .user-profile-info {
      .profile-header {
        .profile-name {
          .nickname {
            color: $--text-color-primary;
          }

          .real-name {
            color: $--text-color-secondary;
          }
        }
      }

      .profile-details {
        .detail-item {
          .label {
            color: $--text-color-secondary;
          }

          .value {
            color: $--text-color-primary;
          }
        }
      }
    }
  }
}
</style>
