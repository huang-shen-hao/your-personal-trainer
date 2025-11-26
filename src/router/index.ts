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
    path: '/plan/:id',
    name: 'PlanDetail',
    component: () => import('@/views/PlanDetailView.vue'),
    meta: { title: '计划详情', requiresAuth: true }
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
    path: '/body-metrics',
    name: 'BodyMetrics',
    component: () => import('@/views/BodyMetricsView.vue'),
    meta: { title: '体测数据', requiresAuth: true }
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

// 全局前置守卫
router.beforeEach((to, _from, next) => {
  document.title = `${to.meta.title || 'GYM AI'} - Your Personal Trainer`
  next()
})

export default router
