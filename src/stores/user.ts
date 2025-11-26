import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/db'
import type { UserProfile } from '@/types/user'

export const useUserStore = defineStore('user', () => {
  const profile = ref<UserProfile | null>(null)
  const isOnboarded = ref(false)

  const isProfileComplete = computed(() => {
    return profile.value !== null && profile.value.nickname !== ''
  })

  const age = computed(() => {
    if (!profile.value) return 0
    return new Date().getFullYear() - profile.value.birthYear
  })

  // 从数据库加载用户档案
  async function loadProfile() {
    try {
      const users = await db.users.toArray()
      if (users.length > 0) {
        const dbUser = users[0]
        // 将数据库格式转换为 UserProfile 格式
        profile.value = {
          ...dbUser,
          goals: dbUser.goals as any,
          injuries: dbUser.injuries?.map(str => JSON.parse(str)) || []
        } as UserProfile
        isOnboarded.value = true
      }
    } catch (error) {
      console.error('加载用户档案失败:', error)
      throw error
    }
  }

  // 保存用户档案到数据库
  async function saveProfile(data: Partial<UserProfile>) {
    try {
      if (profile.value && profile.value.id) {
        // 更新现有档案
        const updated = { ...profile.value, ...data, updatedAt: new Date() }
        
        // 转换为数据库格式 - 确保所有字段都是可序列化的
        const dbData = {
          id: updated.id,
          nickname: updated.nickname,
          realName: updated.realName,
          gender: updated.gender,
          birthYear: updated.birthYear,
          height: updated.height,
          currentWeight: updated.currentWeight,
          experienceLevel: updated.experienceLevel,
          goals: Array.from(updated.goals || []).map(g => String(g)),
          injuries: updated.injuries?.map(injury => JSON.stringify(injury)) || [],
          equipment: updated.equipment,
          location: updated.location,
          weeklyTrainingDays: updated.weeklyTrainingDays,
          preferredSessionDuration: updated.preferredSessionDuration,
          coachPersonality: updated.coachPersonality,
          customPrompt: updated.customPrompt,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt
        }
        
        console.log('准备更新到数据库的数据:', dbData)
        await db.users.put(dbData as any)
        profile.value = updated
      } else {
        // 创建新档案
        const newProfile: UserProfile = {
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
          nickname: '',
          gender: 'male',
          birthYear: 1990,
          height: 170,
          currentWeight: 70,
          experienceLevel: 'beginner',
          goals: [],
          equipment: 'home',
          location: 'home',
          coachPersonality: 'encouraging',
          ...data
        } as UserProfile
        
        // 确保数据符合数据库schema - 所有字段都是可序列化的
        const dbData = {
          id: newProfile.id,
          nickname: newProfile.nickname,
          realName: newProfile.realName,
          gender: newProfile.gender,
          birthYear: newProfile.birthYear,
          height: newProfile.height,
          currentWeight: newProfile.currentWeight,
          experienceLevel: newProfile.experienceLevel,
          goals: Array.from(newProfile.goals || []).map(g => String(g)),
          injuries: newProfile.injuries?.map(injury => JSON.stringify(injury)) || [],
          equipment: newProfile.equipment,
          location: newProfile.location,
          weeklyTrainingDays: newProfile.weeklyTrainingDays,
          preferredSessionDuration: newProfile.preferredSessionDuration,
          coachPersonality: newProfile.coachPersonality,
          customPrompt: newProfile.customPrompt,
          createdAt: newProfile.createdAt,
          updatedAt: newProfile.updatedAt
        }
        
        console.log('准备保存到数据库的数据:', dbData)
        console.log('goals 数组:', dbData.goals, '类型:', typeof dbData.goals, '是否数组:', Array.isArray(dbData.goals))
        
        await db.users.put(dbData as any)
        profile.value = newProfile
        isOnboarded.value = true
      }
    } catch (error) {
      console.error('保存用户档案失败:', error)
      console.error('错误详情:', error instanceof Error ? error.message : error)
      if (error instanceof Error) {
        console.error('错误堆栈:', error.stack)
      }
      throw error
    }
  }

  // 设置用户档案（兼容旧代码，同时保存到数据库）
  async function setProfile(data: UserProfile) {
    profile.value = data
    isOnboarded.value = true
    try {
      // 保存到数据库
      await db.users.put(data as any)
    } catch (error) {
      console.error('保存用户档案到数据库失败:', error)
    }
  }

  // 更新用户档案部分字段
  function updateProfile(updates: Partial<UserProfile>) {
    if (profile.value) {
      profile.value = {
        ...profile.value,
        ...updates,
        updatedAt: new Date()
      }
    }
  }

  // 清除用户档案
  async function clearProfile() {
    try {
      if (profile.value) {
        await db.users.delete(profile.value.id)
      }
      profile.value = null
      isOnboarded.value = false
    } catch (error) {
      console.error('清除用户档案失败:', error)
      throw error
    }
  }

  return {
    profile,
    isOnboarded,
    isProfileComplete,
    age,
    loadProfile,
    saveProfile,
    setProfile,
    updateProfile,
    clearProfile
  }
})
