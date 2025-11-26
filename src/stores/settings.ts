import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { setThemeBySetting, resolveThemeName, themes, type ThemeSetting, type ThemeName } from '@/theme'

export const useSettingsStore = defineStore('settings', () => {
  const theme = ref<ThemeSetting>('auto')
  const language = ref<'zh-CN' | 'en-US'>('zh-CN')
  const fontSize = ref<'small' | 'medium' | 'large' | 'extra-large'>('medium')
  const enableNotifications = ref(true)
  const enableSounds = ref(true)
  const autoSaveWorkouts = ref(true)
  const measurementUnit = ref<'metric' | 'imperial'>('metric') // kg/cm vs lb/in

  const resolvedTheme = computed<ThemeName>(() => resolveThemeName(theme.value))

  function applyThemeSetting(setting: ThemeSetting = theme.value) {
    const applied = setThemeBySetting(setting)
    theme.value = setting
    return applied
  }

  function setTheme(newTheme: ThemeSetting) {
    applyThemeSetting(newTheme)
    applyFontSize()
    saveToLocalStorage()
  }

  function setLanguage(newLanguage: 'zh-CN' | 'en-US') {
    language.value = newLanguage
    saveToLocalStorage()
  }

  function setFontSize(newSize: 'small' | 'medium' | 'large' | 'extra-large') {
    fontSize.value = newSize
    applyFontSize()
    saveToLocalStorage()
  }

  function applyFontSize() {
    const root = document.documentElement
    const baseSize = themes.light.typography.size
    const scaleMap: Record<typeof fontSize.value, number> = {
      small: 0.93,
      medium: 1,
      large: 1.07,
      'extra-large': 1.14,
    }
    const scale = scaleMap[fontSize.value]

    const scaled = {
      xs: `${(baseSize.xs * scale).toFixed(2)}px`,
      sm: `${(baseSize.sm * scale).toFixed(2)}px`,
      md: `${(baseSize.md * scale).toFixed(2)}px`,
      lg: `${(baseSize.lg * scale).toFixed(2)}px`,
      xl: `${(baseSize.xl * scale).toFixed(2)}px`,
    }

    root.style.setProperty('--font-size-xs', scaled.xs)
    root.style.setProperty('--font-size-sm', scaled.sm)
    root.style.setProperty('--font-size-md', scaled.md)
    root.style.setProperty('--font-size-lg', scaled.lg)
    root.style.setProperty('--font-size-xl', scaled.xl)
    root.style.setProperty('--el-font-size-base', scaled.md)
    root.style.setProperty('--el-font-size-small', scaled.sm)
    root.style.setProperty('--el-font-size-large', scaled.lg)
    root.style.fontSize = scaled.md
  }

  function toggleNotifications() {
    enableNotifications.value = !enableNotifications.value
    saveToLocalStorage()
  }

  function toggleSounds() {
    enableSounds.value = !enableSounds.value
    saveToLocalStorage()
  }

  function toggleAutoSave() {
    autoSaveWorkouts.value = !autoSaveWorkouts.value
    saveToLocalStorage()
  }

  function setMeasurementUnit(unit: 'metric' | 'imperial') {
    measurementUnit.value = unit
    saveToLocalStorage()
  }

  function saveToLocalStorage() {
    const settings = {
      theme: theme.value,
      language: language.value,
      fontSize: fontSize.value,
      enableNotifications: enableNotifications.value,
      enableSounds: enableSounds.value,
      autoSaveWorkouts: autoSaveWorkouts.value,
      measurementUnit: measurementUnit.value
    }
    localStorage.setItem('app-settings', JSON.stringify(settings))
  }

  function loadFromLocalStorage() {
    const saved = localStorage.getItem('app-settings')
    if (saved) {
      try {
        const settings = JSON.parse(saved)
        theme.value = settings.theme || 'auto'
        language.value = settings.language || 'zh-CN'
        fontSize.value = settings.fontSize || 'medium'
        enableNotifications.value = settings.enableNotifications ?? true
        enableSounds.value = settings.enableSounds ?? true
        autoSaveWorkouts.value = settings.autoSaveWorkouts ?? true
        measurementUnit.value = settings.measurementUnit || 'metric'
        
        applyThemeSetting(theme.value)
        applyFontSize()
      } catch (error) {
        console.error('Failed to load settings:', error)
      }
    } else {
      // 首次使用，应用默认设置
      applyThemeSetting(theme.value)
      applyFontSize()
    }
  }

  function resetToDefaults() {
    theme.value = 'auto'
    language.value = 'zh-CN'
    fontSize.value = 'medium'
    enableNotifications.value = true
    enableSounds.value = true
    autoSaveWorkouts.value = true
    measurementUnit.value = 'metric'
    
    applyThemeSetting(theme.value)
    applyFontSize()
    saveToLocalStorage()
  }

  // 监听系统主题变化
  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', () => {
      if (theme.value === 'auto') {
        applyThemeSetting('auto')
        applyFontSize()
      }
    })
  }

  return {
    theme,
    language,
    fontSize,
    resolvedTheme,
    enableNotifications,
    enableSounds,
    autoSaveWorkouts,
    measurementUnit,
    setTheme,
    applyTheme: () => {
      applyThemeSetting(theme.value)
      applyFontSize()
    },
    setLanguage,
    setFontSize,
    applyFontSize,
    toggleNotifications,
    toggleSounds,
    toggleAutoSave,
    setMeasurementUnit,
    saveToLocalStorage,
    loadFromLocalStorage,
    resetToDefaults
  }
})
