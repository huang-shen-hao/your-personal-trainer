import { db, type User } from '../index'

/**
 * 用户数据仓库
 * 封装用户相关的数据库操作
 */
export class UserRepository {
  /**
   * 创建新用户
   */
  async create(profile: Omit<User, 'id'>): Promise<string> {
    try {
      const id = await db.users.add({
        ...profile,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      return id as string
    } catch (error) {
      console.error('Failed to create user:', error)
      throw new Error('创建用户失败')
    }
  }

  /**
   * 根据ID获取用户
   */
  async getById(id: string): Promise<User | undefined> {
    try {
      return await db.users.get(id)
    } catch (error) {
      console.error('Failed to get user:', error)
      return undefined
    }
  }

  /**
   * 获取当前用户（假设只有一个用户）
   */
  async getCurrent(): Promise<User | undefined> {
    try {
      const users = await db.users.toArray()
      return users.length > 0 ? users[0] : undefined
    } catch (error) {
      console.error('Failed to get current user:', error)
      return undefined
    }
  }

  /**
   * 更新用户信息
   */
  async update(id: string, profile: Partial<User>): Promise<void> {
    try {
      // 确保所有字段都是可序列化的
      const updateData: Partial<User> = {
        updatedAt: new Date()
      }
      
      // 只复制可序列化的字段
      if (profile.nickname !== undefined) updateData.nickname = profile.nickname
      if (profile.realName !== undefined) updateData.realName = profile.realName
      if (profile.gender !== undefined) updateData.gender = profile.gender
      if (profile.birthYear !== undefined) updateData.birthYear = profile.birthYear
      if (profile.height !== undefined) updateData.height = profile.height
      if (profile.currentWeight !== undefined) updateData.currentWeight = profile.currentWeight
      if (profile.experienceLevel !== undefined) updateData.experienceLevel = profile.experienceLevel
      if (profile.equipment !== undefined) updateData.equipment = profile.equipment
      if (profile.location !== undefined) updateData.location = profile.location
      if (profile.weeklyTrainingDays !== undefined) updateData.weeklyTrainingDays = profile.weeklyTrainingDays
      if (profile.preferredSessionDuration !== undefined) updateData.preferredSessionDuration = profile.preferredSessionDuration
      if (profile.coachPersonality !== undefined) updateData.coachPersonality = profile.coachPersonality
      if (profile.customPrompt !== undefined) updateData.customPrompt = profile.customPrompt
      
      // 处理数组字段，确保它们是字符串数组
      if (profile.goals !== undefined) {
        updateData.goals = Array.isArray(profile.goals) 
          ? profile.goals.map(g => String(g))
          : []
      }
      if (profile.injuries !== undefined) {
        // 如果 injuries 是对象数组，转换为字符串数组
        if (Array.isArray(profile.injuries)) {
          updateData.injuries = profile.injuries.map(injury => {
            if (typeof injury === 'string') {
              return injury
            } else {
              // 如果是对象，转换为 JSON 字符串
              return JSON.stringify(injury)
            }
          })
        } else {
          updateData.injuries = []
        }
      }
      
      await db.users.update(id, updateData)
    } catch (error) {
      console.error('Failed to update user:', error)
      throw new Error('更新用户失败')
    }
  }

  /**
   * 删除用户
   */
  async delete(id: string): Promise<void> {
    try {
      await db.users.delete(id)
    } catch (error) {
      console.error('Failed to delete user:', error)
      throw new Error('删除用户失败')
    }
  }

  /**
   * 检查用户是否存在
   */
  async exists(): Promise<boolean> {
    try {
      const count = await db.users.count()
      return count > 0
    } catch (error) {
      console.error('Failed to check user existence:', error)
      return false
    }
  }
}

// 导出单例
export const userRepository = new UserRepository()

