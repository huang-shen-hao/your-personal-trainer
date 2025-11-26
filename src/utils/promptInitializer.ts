/**
 * Prompt 模板初始化工具
 * 在应用首次启动时初始化默认的 Prompt 模板
 */

import { DEFAULT_PROMPT_TEMPLATES } from '@/data/prompts'
import { promptTemplateRepository } from '@/db/repositories/aiRepository'
import { db } from '@/db'

/**
 * 检查是否已初始化
 */
export async function isPromptsInitialized(): Promise<boolean> {
  const count = await db.promptTemplates.count()
  return count > 0
}

/**
 * 初始化默认 Prompt 模板
 */
export async function initializeDefaultPrompts(): Promise<void> {
  try {
    // 检查是否已初始化
    if (await isPromptsInitialized()) {
      console.log('Prompts already initialized')
      return
    }

    console.log('Initializing default prompts...')

    // 批量插入默认模板
    for (const template of DEFAULT_PROMPT_TEMPLATES) {
      await promptTemplateRepository.saveTemplate(template)
    }

    console.log(`Initialized ${DEFAULT_PROMPT_TEMPLATES.length} default prompts`)
  } catch (error) {
    console.error('Failed to initialize default prompts:', error)
    throw error
  }
}

/**
 * 重置 Prompt 模板（清空后重新初始化）
 */
export async function resetPrompts(): Promise<void> {
  try {
    // 清空现有模板
    await db.promptTemplates.clear()
    
    // 重新初始化
    await initializeDefaultPrompts()
    
    console.log('Prompts reset successfully')
  } catch (error) {
    console.error('Failed to reset prompts:', error)
    throw error
  }
}
