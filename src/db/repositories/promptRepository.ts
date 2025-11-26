/**
 * Prompt 模板数据仓库
 */

import { db } from '../index'
import type { PromptTemplate } from '@/types/ai'

export const promptRepository = {
  /**
   * 保存 Prompt 模板
   */
  async save(template: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = new Date()
    const id = crypto.randomUUID()
    
    await db.prompts.add({
      ...template,
      version: template.version || '1.0.0',
      id,
      createdAt: now,
      updatedAt: now
    })

    return id
  },

  /**
   * 批量保存
   */
  async saveBatch(templates: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<void> {
    const now = new Date()
    const records = templates.map(template => ({
      ...template,
      version: template.version || '1.0.0',
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now
    }))

    await db.prompts.bulkAdd(records)
  },

  /**
   * 获取指定类型的 Prompt
   */
  async getByType(type: string): Promise<PromptTemplate[]> {
    const results = await db.prompts
      .where('type')
      .equals(type)
      .toArray()
    return results.map(p => ({
      ...p,
      version: p.version || '1.0.0'
    })) as PromptTemplate[]
  },

  /**
   * 获取默认 Prompt
   */
  async getDefault(type: string): Promise<PromptTemplate | undefined> {
    const result = await db.prompts
      .where({ type, isDefault: true })
      .first()
    if (!result) return undefined
    return {
      ...result,
      version: result.version || '1.0.0'
    } as PromptTemplate
  },

  /**
   * 获取所有 Prompts
   */
  async getAll(): Promise<PromptTemplate[]> {
    const results = await db.prompts.toArray()
    return results.map(p => ({
      ...p,
      version: p.version || '1.0.0'
    })) as PromptTemplate[]
  },

  /**
   * 更新 Prompt
   */
  async update(id: string, updates: Partial<PromptTemplate>): Promise<void> {
    await db.prompts.update(id, {
      ...updates,
      updatedAt: new Date()
    })
  },

  /**
   * 设置默认 Prompt
   */
  async setDefault(id: string, type: string): Promise<void> {
    // 取消同类型其他 Prompt 的默认状态
    const sameType = await this.getByType(type)
    for (const prompt of sameType) {
      if (prompt.id !== id && prompt.isDefault) {
        await db.prompts.update(prompt.id, { isDefault: false, updatedAt: new Date() })
      }
    }

    // 设置当前为默认
    await db.prompts.update(id, { isDefault: true, updatedAt: new Date() })
  },

  /**
   * 删除 Prompt
   */
  async delete(id: string): Promise<void> {
    await db.prompts.delete(id)
  },

  /**
   * 检查是否已初始化
   */
  async isInitialized(): Promise<boolean> {
    const count = await db.prompts.count()
    return count > 0
  }
}

