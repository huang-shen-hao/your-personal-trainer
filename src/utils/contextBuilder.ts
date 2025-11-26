/**
 * 上下文构建工具
 * 用于为 AI 对话构建用户相关的上下文信息
 */

import type { User } from '@/db'
import type { BodyMetric } from '@/types/bodyMetrics'
import type { TrainingPlan } from '@/types/plan'

export interface ContextOptions {
  includeUserProfile: boolean
  includeBodyMetrics: boolean
  includeTrainingPlan: boolean
  includeWorkoutHistory: boolean
}

export interface ContextData {
  user?: User
  bodyMetrics?: BodyMetric[]
  trainingPlan?: TrainingPlan
  workoutHistory?: any[]
}

/**
 * 构建用户档案上下文
 */
export function buildUserProfileContext(user: User): string {
  const age = new Date().getFullYear() - user.birthYear
  const bmi = (user.currentWeight / Math.pow(user.height / 100, 2)).toFixed(1)
  
  const experienceMap = {
    'none': '无经验',
    'beginner': '初学者',
    'intermediate': '中级',
    'advanced': '高级'
  }
  
  const equipmentMap = {
    'none': '无器械（徒手）',
    'home': '家用器械（哑铃、弹力带等）',
    'gym': '商业健身房（完整器械）'
  }
  
  const locationMap = {
    'home': '家庭',
    'gym': '健身房',
    'outdoor': '户外'
  }

  let context = `## 用户档案\n\n`
  context += `- **昵称**：${user.nickname}\n`
  context += `- **基本信息**：${age}岁，${user.gender === 'male' ? '男' : user.gender === 'female' ? '女' : '其他'}\n`
  context += `- **身体数据**：身高 ${user.height}cm，体重 ${user.currentWeight}kg，BMI ${bmi}\n`
  context += `- **训练经验**：${experienceMap[user.experienceLevel]}\n`
  context += `- **训练目标**：${user.goals?.join('、') || '保持健康'}\n`
  context += `- **器械条件**：${equipmentMap[user.equipment]}\n`
  context += `- **训练场所**：${locationMap[user.location]}\n`
  
  if (user.weeklyTrainingDays) {
    context += `- **每周训练**：${user.weeklyTrainingDays}次\n`
  }
  
  if (user.preferredSessionDuration) {
    context += `- **单次时长**：${user.preferredSessionDuration}分钟\n`
  }
  
  if (user.injuries && user.injuries.length > 0) {
    context += `- **伤病史**：${user.injuries.join('、')}\n`
  } else {
    context += `- **伤病史**：无\n`
  }

  return context
}

/**
 * 构建体测数据上下文
 */
export function buildBodyMetricsContext(metrics: BodyMetric[]): string {
  if (!metrics || metrics.length === 0) {
    return ''
  }

  let context = `## 最近体测数据\n\n`
  
  const recent = metrics.slice(0, 5)
  
  recent.forEach((metric, index) => {
    const date = new Date(metric.date).toLocaleDateString('zh-CN')
    context += `**${date}**：`
    
    const data: string[] = []
    
    if (metric.weight) {
      data.push(`体重 ${metric.weight}kg`)
    }
    
    if (metric.bodyFat) {
      data.push(`体脂率 ${metric.bodyFat}%`)
    }
    
    if (metric.measurements) {
      const m = metric.measurements
      const measurements: string[] = []
      if (m.chest) measurements.push(`胸围${m.chest}cm`)
      if (m.waist) measurements.push(`腰围${m.waist}cm`)
      if (m.hips) measurements.push(`臀围${m.hips}cm`)
      if (measurements.length > 0) {
        data.push(measurements.join('、'))
      }
    }
    
    context += data.join('，') + '\n'
  })

  // 体重变化趋势
  if (metrics.length >= 2) {
    const latest = metrics[0]
    const previous = metrics[1]
    
    if (latest.weight && previous.weight) {
      const change = latest.weight - previous.weight
      const changeStr = change > 0 ? `增加${change.toFixed(1)}kg` : `减少${Math.abs(change).toFixed(1)}kg`
      context += `\n**趋势**：较上次${changeStr}\n`
    }
  }

  return context
}

/**
 * 构建训练计划上下文
 */
export function buildTrainingPlanContext(plan: TrainingPlan): string {
  if (!plan) {
    return ''
  }

  let context = `## 当前训练计划\n\n`
  context += `- **计划名称**：${plan.name}\n`
  
  if (plan.description) {
    context += `- **说明**：${plan.description}\n`
  }
  
  context += `- **周期**：${plan.weeks}周\n`
  context += `- **频次**：每周${plan.frequency}次\n`
  context += `- **分化方式**：${getSplitName(plan.split)}\n`
  
  const startDate = new Date(plan.startDate).toLocaleDateString('zh-CN')
  const endDate = new Date(plan.endDate).toLocaleDateString('zh-CN')
  context += `- **时间**：${startDate} 至 ${endDate}\n`
  
  // 计算进度
  const now = new Date()
  const start = new Date(plan.startDate)
  const end = new Date(plan.endDate)
  const total = end.getTime() - start.getTime()
  const passed = now.getTime() - start.getTime()
  const progress = Math.min(100, Math.max(0, (passed / total) * 100))
  
  context += `- **进度**：${progress.toFixed(0)}%\n`

  return context
}

/**
 * 获取分化方式名称
 */
function getSplitName(split: string): string {
  const splitMap: Record<string, string> = {
    'full_body': '全身训练',
    'upper_lower': '上下肢分化',
    'ppl': '推拉腿',
    'bro_split': '五分化（胸/背/肩/腿/手臂）'
  }
  return splitMap[split] || split
}

/**
 * 构建训练历史上下文
 */
export function buildWorkoutHistoryContext(workouts: any[]): string {
  if (!workouts || workouts.length === 0) {
    return ''
  }

  let context = `## 最近训练记录\n\n`
  
  const recent = workouts.slice(0, 5)
  
  recent.forEach((workout) => {
    const date = new Date(workout.date).toLocaleDateString('zh-CN')
    context += `**${date}**：`
    
    const exerciseCount = workout.exercises?.length || 0
    context += `完成${exerciseCount}个动作`
    
    if (workout.overallFatigue) {
      context += `，疲劳度 ${workout.overallFatigue}/5`
    }
    
    if (workout.notes) {
      context += `，备注：${workout.notes}`
    }
    
    context += '\n'
  })

  return context
}

/**
 * 构建完整上下文
 */
export async function buildFullContext(
  options: ContextOptions,
  data: ContextData
): Promise<string> {
  const sections: string[] = []

  if (options.includeUserProfile && data.user) {
    sections.push(buildUserProfileContext(data.user))
  }

  if (options.includeBodyMetrics && data.bodyMetrics && data.bodyMetrics.length > 0) {
    sections.push(buildBodyMetricsContext(data.bodyMetrics))
  }

  if (options.includeTrainingPlan && data.trainingPlan) {
    sections.push(buildTrainingPlanContext(data.trainingPlan))
  }

  if (options.includeWorkoutHistory && data.workoutHistory && data.workoutHistory.length > 0) {
    sections.push(buildWorkoutHistoryContext(data.workoutHistory))
  }

  if (sections.length === 0) {
    return ''
  }

  return `\n\n---\n\n# 用户信息\n\n${sections.join('\n\n')}\n\n---\n\n`
}
