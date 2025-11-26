# Phase 1: 项目基础框架搭建

**时间估算**: 1-2 周  
**优先级**: P0（必须完成）  
**状态**: 📝 待开始

---

## 目标概述

搭建完整的前端项目框架，包括：
- Vue 3 + Vite + TypeScript 项目初始化
- 路由系统配置（9个主要路由）
- 状态管理（7个 Pinia Store）
- UI 组件库集成与主题
- IndexedDB 数据库设计（10张表）
- 基础页面布局

完成后，项目拥有完整的技术骨架，可以开始功能开发。

---

## 任务清单

### 1.1 项目初始化

#### 1.1.1 创建 Vite + Vue 3 项目

```bash
# 使用 Vite 官方模板
npm create vite@latest your-personal-trainer -- --template vue-ts

cd your-personal-trainer
npm install
```

#### 1.1.2 配置 TypeScript

更新 `tsconfig.json`：

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    /* Path Alias */
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.tsx", "src/**/*.vue"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

#### 1.1.3 配置 Vite

更新 `vite.config.ts`：

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173,
    open: true
  }
})
```

#### 1.1.4 安装核心依赖

```bash
# 路由
npm install vue-router@4

# 状态管理
npm install pinia

# IndexedDB
npm install dexie

# UI 组件库（二选一）
npm install element-plus  # 或 npm install naive-ui

# 图标库
npm install @element-plus/icons-vue  # 如选择 Element Plus

# 工具库
npm install @vueuse/core
npm install dayjs

# 表单校验
npm install zod

# 开发依赖
npm install -D @types/node
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D prettier eslint-plugin-prettier eslint-config-prettier
npm install -D sass
```

**✅ 完成标志**: 
- [ ] 项目可正常启动（`npm run dev`）
- [ ] TypeScript 无报错
- [ ] 路径别名 `@/` 可正常使用

---

### 1.2 配置 Vue Router

#### 1.2.1 创建路由文件

创建 `src/router/index.ts`：

```typescript
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/HomeView.vue'),
    meta: { title: '首页', requiresAuth: false }
  },
  {
    path: '/onboarding',
    name: 'Onboarding',
    component: () => import('@/views/OnboardingView.vue'),
    meta: { title: '欢迎', requiresAuth: false }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/ProfileView.vue'),
    meta: { title: '个人档案', requiresAuth: true }
  },
  {
    path: '/chat',
    name: 'Chat',
    component: () => import('@/views/ChatView.vue'),
    meta: { title: 'AI 对话', requiresAuth: true }
  },
  {
    path: '/plan',
    name: 'Plan',
    component: () => import('@/views/PlanView.vue'),
    meta: { title: '训练计划', requiresAuth: true }
  },
  {
    path: '/workout',
    name: 'Workout',
    component: () => import('@/views/WorkoutView.vue'),
    meta: { title: '开始训练', requiresAuth: true }
  },
  {
    path: '/progress',
    name: 'Progress',
    component: () => import('@/views/ProgressView.vue'),
    meta: { title: '进度统计', requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/SettingsView.vue'),
    meta: { title: '设置', requiresAuth: true }
  },
  {
    path: '/ai-config',
    name: 'AIConfig',
    component: () => import('@/views/AIConfigView.vue'),
    meta: { title: 'AI 配置', requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: '404' }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 全局前置守卫（后续实现权限检查）
router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title || 'AI 私人教练'} - Your Personal Trainer`
  next()
})

export default router
```

#### 1.2.2 创建占位页面

创建 `src/views/` 目录，为每个路由创建基础 Vue 文件（先放占位内容）：

```vue
<!-- src/views/HomeView.vue -->
<template>
  <div class="home-view">
    <h1>首页</h1>
    <p>TODO: 实现首页内容</p>
  </div>
</template>

<script setup lang="ts">
// TODO: 实现首页逻辑
</script>

<style scoped>
.home-view {
  padding: 20px;
}
</style>
```

对其他页面重复此结构：`OnboardingView.vue`, `ProfileView.vue`, `ChatView.vue`, `PlanView.vue`, `WorkoutView.vue`, `ProgressView.vue`, `SettingsView.vue`, `AIConfigView.vue`, `NotFoundView.vue`。

#### 1.2.3 在 `main.ts` 中注册路由

```typescript
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(router)

app.mount('#app')
```

**✅ 完成标志**: 
- [ ] 所有路由可正常访问
- [ ] 路由切换流畅，无报错
- [ ] 浏览器标题随路由变化

---

### 1.3 配置 Pinia 状态管理

#### 1.3.1 创建 Pinia 实例

创建 `src/stores/index.ts`：

```typescript
import { createPinia } from 'pinia'

const pinia = createPinia()

export default pinia
```

在 `main.ts` 中注册：

```typescript
import pinia from './stores'

app.use(pinia)
```

#### 1.3.2 创建 7 个 Store

**1. User Store** (`src/stores/user.ts`)

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface UserProfile {
  id: string
  nickname: string
  gender: 'male' | 'female' | 'other'
  birthYear: number
  height: number
  currentWeight: number
  experienceLevel: 'none' | 'beginner' | 'intermediate' | 'advanced'
  goals: string[]
  equipment: 'none' | 'home' | 'gym'
  coachPersonality: 'strict' | 'encouraging' | 'humorous' | 'academic'
}

export const useUserStore = defineStore('user', () => {
  const profile = ref<UserProfile | null>(null)
  const isOnboarded = ref(false)

  const isProfileComplete = computed(() => {
    return profile.value !== null && profile.value.nickname !== ''
  })

  function setProfile(data: UserProfile) {
    profile.value = data
    isOnboarded.value = true
  }

  function clearProfile() {
    profile.value = null
    isOnboarded.value = false
  }

  return {
    profile,
    isOnboarded,
    isProfileComplete,
    setProfile,
    clearProfile
  }
})
```

**2. Plan Store** (`src/stores/plan.ts`)

```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface TrainingPlan {
  id: string
  name: string
  startDate: Date
  endDate: Date
  weeks: number
  frequency: number
  isActive: boolean
}

export const usePlanStore = defineStore('plan', () => {
  const currentPlan = ref<TrainingPlan | null>(null)
  const plans = ref<TrainingPlan[]>([])

  function setCurrentPlan(plan: TrainingPlan) {
    currentPlan.value = plan
  }

  function addPlan(plan: TrainingPlan) {
    plans.value.push(plan)
  }

  return {
    currentPlan,
    plans,
    setCurrentPlan,
    addPlan
  }
})
```

**3. Workout Store** (`src/stores/workout.ts`)

```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface WorkoutLog {
  id: string
  date: Date
  exercises: any[]
  completed: boolean
}

export const useWorkoutStore = defineStore('workout', () => {
  const currentWorkout = ref<WorkoutLog | null>(null)
  const workoutHistory = ref<WorkoutLog[]>([])

  function startWorkout() {
    currentWorkout.value = {
      id: crypto.randomUUID(),
      date: new Date(),
      exercises: [],
      completed: false
    }
  }

  function completeWorkout() {
    if (currentWorkout.value) {
      currentWorkout.value.completed = true
      workoutHistory.value.push(currentWorkout.value)
      currentWorkout.value = null
    }
  }

  return {
    currentWorkout,
    workoutHistory,
    startWorkout,
    completeWorkout
  }
})
```

**4. Chat Store** (`src/stores/chat.ts`)

```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: Date
}

export const useChatStore = defineStore('chat', () => {
  const sessions = ref<ChatSession[]>([])
  const currentSessionId = ref<string | null>(null)

  function createSession() {
    const session: ChatSession = {
      id: crypto.randomUUID(),
      title: '新对话',
      messages: [],
      createdAt: new Date()
    }
    sessions.value.push(session)
    currentSessionId.value = session.id
    return session
  }

  function addMessage(sessionId: string, message: ChatMessage) {
    const session = sessions.value.find(s => s.id === sessionId)
    if (session) {
      session.messages.push(message)
    }
  }

  return {
    sessions,
    currentSessionId,
    createSession,
    addMessage
  }
})
```

**5. Media Store** (`src/stores/media.ts`)

```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface ImageRecord {
  id: string
  type: 'food' | 'posture' | 'equipment' | 'progress'
  blob: Blob
  capturedAt: Date
}

export const useMediaStore = defineStore('media', () => {
  const images = ref<ImageRecord[]>([])

  function addImage(image: ImageRecord) {
    images.value.push(image)
  }

  function deleteImage(id: string) {
    images.value = images.value.filter(img => img.id !== id)
  }

  return {
    images,
    addImage,
    deleteImage
  }
})
```

**6. AI Store** (`src/stores/ai.ts`)

```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface AIConfig {
  provider: 'openai' | 'anthropic' | 'qwen' | 'wenxin' | 'doubao' | 'kimi' | 'glm'
  model: string
  apiKey: string
  temperature: number
}

export const useAIStore = defineStore('ai', () => {
  const config = ref<AIConfig | null>(null)
  const isConfigured = ref(false)
  const usageStats = ref({
    textCalls: 0,
    imageCalls: 0,
    totalTokens: 0
  })

  function setConfig(newConfig: AIConfig) {
    config.value = newConfig
    isConfigured.value = true
  }

  function incrementUsage(type: 'text' | 'image', tokens: number) {
    if (type === 'text') {
      usageStats.value.textCalls++
    } else {
      usageStats.value.imageCalls++
    }
    usageStats.value.totalTokens += tokens
  }

  return {
    config,
    isConfigured,
    usageStats,
    setConfig,
    incrementUsage
  }
})
```

**7. Settings Store** (`src/stores/settings.ts`)

```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  const theme = ref<'light' | 'dark' | 'auto'>('auto')
  const language = ref<'zh-CN' | 'en-US'>('zh-CN')
  const fontSize = ref<'small' | 'medium' | 'large'>('medium')

  function setTheme(newTheme: 'light' | 'dark' | 'auto') {
    theme.value = newTheme
    applyTheme()
  }

  function applyTheme() {
    // TODO: 实现主题切换逻辑
    if (theme.value === 'dark') {
      document.documentElement.classList.add('dark')
    } else if (theme.value === 'light') {
      document.documentElement.classList.remove('dark')
    } else {
      // auto: 跟随系统
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }

  return {
    theme,
    language,
    fontSize,
    setTheme,
    applyTheme
  }
})
```

**✅ 完成标志**: 
- [ ] 7 个 Store 均可正常导入使用
- [ ] Store 之间无循环依赖
- [ ] TypeScript 类型定义完整

---

### 1.4 UI 组件库集成（以 Element Plus 为例）

#### 1.4.1 自动导入配置

安装自动导入插件：

```bash
npm install -D unplugin-vue-components unplugin-auto-import
```

更新 `vite.config.ts`：

```typescript
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
      imports: ['vue', 'vue-router', 'pinia']
    }),
    Components({
      resolvers: [ElementPlusResolver()]
    })
  ],
  // ...其他配置
})
```

#### 1.4.2 主题配置

创建 `src/styles/variables.scss`：

```scss
// Element Plus 主题变量
$--el-color-primary: #5c7cfa; // 主色调（蓝紫色）
$--el-color-success: #51cf66;
$--el-color-warning: #ffd43b;
$--el-color-danger: #ff6b6b;
$--el-color-info: #909399;

// 字体
$--el-font-size-base: 14px;
```

在 `main.ts` 中导入样式：

```typescript
import 'element-plus/dist/index.css'
import '@/styles/variables.scss'
```

#### 1.4.3 创建全局样式

创建 `src/styles/global.scss`：

```scss
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
               'Helvetica Neue', Arial, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: #333;
  background-color: #f5f5f5;
}

#app {
  min-height: 100vh;
}

/* 暗色模式 */
.dark {
  body {
    color: #e0e0e0;
    background-color: #1a1a1a;
  }
}
```

**✅ 完成标志**: 
- [ ] Element Plus 组件可正常使用
- [ ] 主题色调配置生效
- [ ] 暗色模式可切换

---

### 1.5 IndexedDB 数据库设计

#### 1.5.1 创建 Dexie 数据库

创建 `src/db/index.ts`：

```typescript
import Dexie, { Table } from 'dexie'

// 导入所有表的接口定义
export interface User {
  id?: string
  nickname: string
  gender: 'male' | 'female' | 'other'
  birthYear: number
  height: number
  currentWeight: number
  experienceLevel: 'none' | 'beginner' | 'intermediate' | 'advanced'
  goals: string[]
  equipment: 'none' | 'home' | 'gym'
  coachPersonality: 'strict' | 'encouraging' | 'humorous' | 'academic'
  createdAt: Date
  updatedAt: Date
}

export interface BodyMetric {
  id?: string
  userId: string
  date: Date
  weight?: number
  bodyFat?: number
  measurements?: {
    chest?: number
    waist?: number
    hips?: number
  }
}

export interface TrainingPlan {
  id?: string
  userId: string
  name: string
  startDate: Date
  endDate: Date
  weeks: number
  frequency: number
  split: string
  sessions: any[]
  isActive: boolean
  createdAt: Date
}

export interface WorkoutLog {
  id?: string
  userId: string
  sessionId?: string
  date: Date
  startTime: Date
  endTime?: Date
  exercises: any[]
  overallFatigue?: number
  notes?: string
}

export interface Exercise {
  id?: string
  nameZh: string
  nameEn: string
  category: string
  primaryMuscles: string[]
  equipment: string[]
  difficulty: string
  description: string
  keyPoints: string[]
}

export interface ChatMessage {
  id?: string
  sessionId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  images?: string[]
  timestamp: Date
}

export interface ChatSession {
  id?: string
  userId: string
  title: string
  createdAt: Date
  updatedAt: Date
  messageCount: number
}

export interface ImageRecord {
  id?: string
  userId: string
  type: 'food' | 'posture' | 'equipment' | 'progress' | 'other'
  blob: Blob
  mimeType: string
  size: number
  capturedAt: Date
}

export interface AnalysisResult {
  id?: string
  imageId: string
  analysisType: 'food' | 'posture' | 'equipment'
  result: any
  timestamp: Date
}

export interface AIConfig {
  id?: string
  userId: string
  provider: string
  model: string
  apiKey?: string
  apiEndpoint?: string
  temperature?: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface APIUsageStats {
  id?: string
  userId: string
  date: Date
  provider: string
  model: string
  textCallCount: number
  imageCallCount: number
  totalTokensUsed: number
  estimatedCost?: number
}

// 创建数据库类
class PersonalTrainerDB extends Dexie {
  users!: Table<User>
  bodyMetrics!: Table<BodyMetric>
  plans!: Table<TrainingPlan>
  workouts!: Table<WorkoutLog>
  exercises!: Table<Exercise>
  messages!: Table<ChatMessage>
  sessions!: Table<ChatSession>
  images!: Table<ImageRecord>
  analysisResults!: Table<AnalysisResult>
  aiConfigs!: Table<AIConfig>
  apiUsageStats!: Table<APIUsageStats>

  constructor() {
    super('PersonalTrainerDB')
    
    this.version(1).stores({
      users: '++id, nickname, createdAt',
      bodyMetrics: '++id, userId, date',
      plans: '++id, userId, isActive, createdAt',
      workouts: '++id, userId, sessionId, date',
      exercises: '++id, nameZh, nameEn, category',
      messages: '++id, sessionId, timestamp',
      sessions: '++id, userId, createdAt',
      images: '++id, userId, type, capturedAt',
      analysisResults: '++id, imageId, timestamp',
      aiConfigs: '++id, userId, isActive',
      apiUsageStats: '++id, userId, date'
    })
  }
}

export const db = new PersonalTrainerDB()
```

#### 1.5.2 创建数据库工具函数

创建 `src/db/utils.ts`：

```typescript
import { db } from './index'

// 初始化数据库（首次使用时调用）
export async function initializeDatabase() {
  try {
    await db.open()
    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Failed to initialize database:', error)
    throw error
  }
}

// 清空所有数据（谨慎使用）
export async function clearAllData() {
  await db.users.clear()
  await db.bodyMetrics.clear()
  await db.plans.clear()
  await db.workouts.clear()
  await db.messages.clear()
  await db.sessions.clear()
  await db.images.clear()
  await db.analysisResults.clear()
  await db.aiConfigs.clear()
  await db.apiUsageStats.clear()
}

// 导出数据为 JSON
export async function exportData() {
  const data = {
    users: await db.users.toArray(),
    bodyMetrics: await db.bodyMetrics.toArray(),
    plans: await db.plans.toArray(),
    workouts: await db.workouts.toArray(),
    exercises: await db.exercises.toArray(),
    sessions: await db.sessions.toArray(),
    aiConfigs: await db.aiConfigs.toArray(),
    apiUsageStats: await db.apiUsageStats.toArray()
  }
  return JSON.stringify(data, null, 2)
}
```

在 `main.ts` 中初始化数据库：

```typescript
import { initializeDatabase } from '@/db/utils'

// 初始化数据库
initializeDatabase().catch(console.error)
```

**✅ 完成标志**: 
- [ ] 数据库可正常打开
- [ ] 可在浏览器 DevTools > Application > IndexedDB 中看到数据库
- [ ] 10 张表均创建成功

---

### 1.6 基础页面布局

#### 1.6.1 创建主布局组件

创建 `src/layouts/MainLayout.vue`：

```vue
<template>
  <el-container class="main-layout">
    <!-- 头部 -->
    <el-header class="header">
      <div class="logo">
        <img src="@/assets/logo.svg" alt="Logo" />
        <span>AI 私人教练</span>
      </div>
      <div class="header-actions">
        <el-button circle @click="toggleTheme">
          <el-icon><Moon /></el-icon>
        </el-button>
      </div>
    </el-header>

    <el-container>
      <!-- 侧边栏（桌面端） -->
      <el-aside v-if="!isMobile" width="200px" class="sidebar">
        <el-menu
          :default-active="activeMenu"
          router
          @select="handleMenuSelect"
        >
          <el-menu-item index="/">
            <el-icon><HomeFilled /></el-icon>
            <span>首页</span>
          </el-menu-item>
          <el-menu-item index="/chat">
            <el-icon><ChatDotRound /></el-icon>
            <span>AI 对话</span>
          </el-menu-item>
          <el-menu-item index="/plan">
            <el-icon><Calendar /></el-icon>
            <span>训练计划</span>
          </el-menu-item>
          <el-menu-item index="/workout">
            <el-icon><Trophy /></el-icon>
            <span>开始训练</span>
          </el-menu-item>
          <el-menu-item index="/progress">
            <el-icon><TrendCharts /></el-icon>
            <span>进度统计</span>
          </el-menu-item>
          <el-menu-item index="/profile">
            <el-icon><User /></el-icon>
            <span>个人档案</span>
          </el-menu-item>
          <el-menu-item index="/settings">
            <el-icon><Setting /></el-icon>
            <span>设置</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <!-- 主内容区 -->
      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>

    <!-- 底部导航栏（移动端） -->
    <el-footer v-if="isMobile" class="mobile-nav">
      <el-button-group>
        <el-button @click="$router.push('/')">
          <el-icon><HomeFilled /></el-icon>
        </el-button>
        <el-button @click="$router.push('/chat')">
          <el-icon><ChatDotRound /></el-icon>
        </el-button>
        <el-button @click="$router.push('/workout')">
          <el-icon><Trophy /></el-icon>
        </el-button>
        <el-button @click="$router.push('/progress')">
          <el-icon><TrendCharts /></el-icon>
        </el-button>
        <el-button @click="$router.push('/settings')">
          <el-icon><Setting /></el-icon>
        </el-button>
      </el-button-group>
    </el-footer>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useSettingsStore } from '@/stores/settings'
import { useBreakpoints } from '@vueuse/core'

const route = useRoute()
const settingsStore = useSettingsStore()

const breakpoints = useBreakpoints({
  mobile: 768,
  desktop: 1024
})

const isMobile = computed(() => !breakpoints.greaterOrEqual('mobile').value)
const activeMenu = computed(() => route.path)

function toggleTheme() {
  const newTheme = settingsStore.theme === 'dark' ? 'light' : 'dark'
  settingsStore.setTheme(newTheme)
}

function handleMenuSelect(index: string) {
  console.log('Menu selected:', index)
}
</script>

<style scoped lang="scss">
.main-layout {
  height: 100vh;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #fff;
  border-bottom: 1px solid #e0e0e0;

  .logo {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 18px;
    font-weight: bold;
    color: var(--el-color-primary);

    img {
      width: 32px;
      height: 32px;
    }
  }
}

.sidebar {
  background-color: #fff;
  border-right: 1px solid #e0e0e0;
}

.main-content {
  background-color: #f5f5f5;
  padding: 20px;
}

.mobile-nav {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #fff;
  border-top: 1px solid #e0e0e0;
  padding: 10px 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 暗色模式 */
.dark {
  .header,
  .sidebar,
  .mobile-nav {
    background-color: #2a2a2a;
    border-color: #444;
  }

  .main-content {
    background-color: #1a1a1a;
  }
}
</style>
```

#### 1.6.2 更新 App.vue

```vue
<template>
  <div id="app">
    <router-view v-if="isSpecialPage" />
    <MainLayout v-else />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'

const route = useRoute()

// 不需要主布局的页面
const specialPages = ['/onboarding', '/404']
const isSpecialPage = computed(() => specialPages.includes(route.path))
</script>

<style>
@import '@/styles/global.scss';
</style>
```

**✅ 完成标志**: 
- [ ] 布局在桌面端和移动端均正常显示
- [ ] 侧边栏菜单可正常导航
- [ ] 移动端底部导航栏显示正确
- [ ] 主题切换按钮可用

---

## 验收标准

完成 Phase 1 后，项目应满足：

### 功能验收
- [ ] 项目可正常启动，无报错
- [ ] 9 个路由均可访问
- [ ] 7 个 Pinia Store 可正常使用
- [ ] UI 组件库集成完成，样式正常
- [ ] IndexedDB 数据库创建成功，可读写数据
- [ ] 主布局组件在桌面端和移动端均正常显示
- [ ] 主题切换功能正常

### 代码质量
- [ ] TypeScript 无类型错误
- [ ] ESLint 无警告
- [ ] 代码格式符合 Prettier 规范
- [ ] 目录结构清晰，命名规范

### 文档
- [ ] README.md 包含项目启动说明
- [ ] 关键配置文件有注释说明

---

## 技术债务与优化项

Phase 1 完成后，以下内容可在后续 Phase 中优化：

- [ ] PWA 配置（Service Worker、Manifest）
- [ ] 单元测试框架搭建（Vitest）
- [ ] E2E 测试框架（Playwright）
- [ ] 国际化（i18n）支持
- [ ] 更完善的错误边界处理
- [ ] 更细致的响应式断点
- [ ] 动画效果优化

---

## 参考资料

- [Vue 3 官方文档](https://cn.vuejs.org/)
- [Vite 官方文档](https://cn.vitejs.dev/)
- [Pinia 官方文档](https://pinia.vuejs.org/zh/)
- [Vue Router 官方文档](https://router.vuejs.org/zh/)
- [Element Plus 官方文档](https://element-plus.org/zh-CN/)
- [Dexie.js 官方文档](https://dexie.org/)
- [VueUse 官方文档](https://vueuse.org/)

---

## 下一步

Phase 1 完成后，继续 **Phase 2: 用户系统与训练计划**。

📝 [查看 Phase 2 文档](./phase2-user-and-plan.md)

