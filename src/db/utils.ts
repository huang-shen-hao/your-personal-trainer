import { db } from './index'

/**
 * 初始化数据库（首次使用时调用）
 */
export async function initializeDatabase() {
  try {
    await db.open()
    console.log('✅ Database initialized successfully')
    return true
  } catch (error) {
    console.error('❌ Failed to initialize database:', error)
    throw error
  }
}

/**
 * 清空所有数据（谨慎使用！）
 */
export async function clearAllData() {
  try {
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
    // exercises 表不清空，因为是预设数据
    console.log('✅ All data cleared')
  } catch (error) {
    console.error('❌ Failed to clear data:', error)
    throw error
  }
}

/**
 * 导出数据为 JSON
 */
export async function exportData() {
  try {
    const data = {
      users: await db.users.toArray(),
      bodyMetrics: await db.bodyMetrics.toArray(),
      plans: await db.plans.toArray(),
      workouts: await db.workouts.toArray(),
      exercises: await db.exercises.toArray(),
      sessions: await db.sessions.toArray(),
      aiConfigs: await db.aiConfigs.toArray(),
      apiUsageStats: await db.apiUsageStats.toArray(),
      // 注意：images 包含 Blob，需要特殊处理
      // 这里先不导出图片数据
      exportedAt: new Date().toISOString()
    }
    return JSON.stringify(data, null, 2)
  } catch (error) {
    console.error('❌ Failed to export data:', error)
    throw error
  }
}

/**
 * 导入数据从 JSON
 */
export async function importData(jsonString: string) {
  try {
    const data = JSON.parse(jsonString)
    
    // 清空现有数据（可选）
    // await clearAllData()
    
    // 导入数据
    if (data.users) await db.users.bulkAdd(data.users)
    if (data.bodyMetrics) await db.bodyMetrics.bulkAdd(data.bodyMetrics)
    if (data.plans) await db.plans.bulkAdd(data.plans)
    if (data.workouts) await db.workouts.bulkAdd(data.workouts)
    if (data.exercises) await db.exercises.bulkAdd(data.exercises)
    if (data.sessions) await db.sessions.bulkAdd(data.sessions)
    if (data.aiConfigs) await db.aiConfigs.bulkAdd(data.aiConfigs)
    if (data.apiUsageStats) await db.apiUsageStats.bulkAdd(data.apiUsageStats)
    
    console.log('✅ Data imported successfully')
  } catch (error) {
    console.error('❌ Failed to import data:', error)
    throw error
  }
}

/**
 * 获取数据库统计信息
 */
export async function getDatabaseStats() {
  try {
    const stats = {
      users: await db.users.count(),
      bodyMetrics: await db.bodyMetrics.count(),
      plans: await db.plans.count(),
      workouts: await db.workouts.count(),
      exercises: await db.exercises.count(),
      messages: await db.messages.count(),
      sessions: await db.sessions.count(),
      images: await db.images.count(),
      analysisResults: await db.analysisResults.count(),
      aiConfigs: await db.aiConfigs.count(),
      apiUsageStats: await db.apiUsageStats.count()
    }
    return stats
  } catch (error) {
    console.error('❌ Failed to get database stats:', error)
    throw error
  }
}

/**
 * 估算数据库大小（粗略估算）
 */
export async function estimateDataSize() {
  try {
    // 获取所有图片的总大小
    const images = await db.images.toArray()
    const imageSize = images.reduce((sum, img) => sum + img.size, 0)
    
    // 粗略估算其他数据大小（假设每条记录平均 1KB）
    const stats = await getDatabaseStats()
    const otherDataCount = Object.values(stats).reduce((sum, count) => sum + count, 0) - stats.images
    const estimatedOtherSize = otherDataCount * 1024 // 1KB per record
    
    return {
      imageSize,
      otherSize: estimatedOtherSize,
      totalSize: imageSize + estimatedOtherSize,
      imageSizeMB: (imageSize / 1024 / 1024).toFixed(2),
      otherSizeMB: (estimatedOtherSize / 1024 / 1024).toFixed(2),
      totalSizeMB: ((imageSize + estimatedOtherSize) / 1024 / 1024).toFixed(2)
    }
  } catch (error) {
    console.error('❌ Failed to estimate data size:', error)
    throw error
  }
}

