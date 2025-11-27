import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import pinia from './stores'
import { initializeDatabase } from '@/db/utils'
import { useUserStore } from '@/stores/user'
import { useSettingsStore } from '@/stores/settings'

// Element Plus 样式
import 'element-plus/dist/index.css'
// 自定义主题变量
import '@/styles/variables.scss'
// 全局样式
import '@/styles/global.scss'

const app = createApp(App)

app.use(router)
app.use(pinia)

// 首屏前应用主题与字号，避免闪烁
const settingsStore = useSettingsStore()
settingsStore.loadFromLocalStorage()

// 初始化数据库并加载用户数据
async function initApp() {
  try {
    // 初始化数据库
    await initializeDatabase()
    
    // 初始化默认 Prompts
    const { initializeDefaultPrompts } = await import('@/utils/promptInitializer')
    await initializeDefaultPrompts()
    
    // 加载用户档案
    const userStore = useUserStore()
    await userStore.loadProfile()

    // 如果用户尚未完成引导，默认跳转到 Onboarding 页面
    if (!userStore.isOnboarded && router.currentRoute.value.name !== 'Onboarding') {
      await router.replace({ name: 'Onboarding' })
    }
  } catch (error) {
    console.error('应用初始化失败:', error)
  } finally {
    // 确保无论初始化是否成功，都能挂载应用
    app.mount('#app')
  }
}

initApp()