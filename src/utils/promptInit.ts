/**
 * Prompt 初始化工具
 */

import { promptRepository } from '@/db/repositories/promptRepository'
import { DEFAULT_PROMPT_TEMPLATES } from '@/data/prompts'

/**
 * 初始化默认 Prompt 模板
 */
export async function initializePrompts(): Promise<void> {
  const isInitialized = await promptRepository.isInitialized()
  
  if (!isInitialized) {
    console.log('正在初始化 Prompt 模板...')
    await promptRepository.saveBatch(DEFAULT_PROMPT_TEMPLATES)
    console.log('Prompt 模板初始化完成')
  }
}

