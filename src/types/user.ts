// 用户档案相关类型定义

export interface UserProfile {
  id: string
  nickname: string
  realName?: string
  gender: 'male' | 'female' | 'other'
  birthYear: number
  height: number // cm
  currentWeight: number // kg
  experienceLevel: 'none' | 'beginner' | 'intermediate' | 'advanced'
  goals: TrainingGoal[]
  injuries?: Injury[]
  equipment: 'none' | 'home' | 'gym'
  location: 'home' | 'gym' | 'outdoor'
  weeklyTrainingDays?: number // 每周可训练天数
  preferredSessionDuration?: number // 单次训练时长偏好（分钟）
  coachPersonality: 'strict' | 'encouraging' | 'humorous' | 'academic' | 'custom'
  customPrompt?: string
  createdAt: Date
  updatedAt: Date
}

export type TrainingGoal = 'muscle_gain' | 'fat_loss' | 'fitness' | 'rehab' | 'general'

export interface Injury {
  id: string
  type: string // 伤病类型（如：膝盖旧伤）
  description: string
  severity: 'mild' | 'moderate' | 'severe'
  date?: Date // 受伤时间
  recovered: boolean
}

// 训练目标显示名称映射
export const TRAINING_GOAL_LABELS: Record<TrainingGoal, string> = {
  muscle_gain: '增肌',
  fat_loss: '减脂',
  fitness: '体能提升',
  rehab: '康复训练',
  general: '综合训练'
}

// 经验等级显示名称映射
export const EXPERIENCE_LEVEL_LABELS: Record<UserProfile['experienceLevel'], string> = {
  none: '无经验',
  beginner: '初级（<1年）',
  intermediate: '中级（1-3年）',
  advanced: '高级（>3年）'
}

// 器械条件显示名称映射
export const EQUIPMENT_LABELS: Record<UserProfile['equipment'], string> = {
  none: '无器械（徒手）',
  home: '家用器械（哑铃、弹力带等）',
  gym: '商业健身房（完整器械）'
}

// 训练场所显示名称映射
export const LOCATION_LABELS: Record<UserProfile['location'], string> = {
  home: '家',
  gym: '健身房',
  outdoor: '户外'
}

// 教练性格显示名称映射
export const COACH_PERSONALITY_LABELS: Record<UserProfile['coachPersonality'], string> = {
  strict: '严厉型',
  encouraging: '鼓励型',
  humorous: '幽默型',
  academic: '学术派',
  custom: '自定义'
}

// 伤病严重程度显示名称映射
export const INJURY_SEVERITY_LABELS: Record<Injury['severity'], string> = {
  mild: '轻度',
  moderate: '中度',
  severe: '严重'
}

// 体测数据类型定义
export interface BodyMetric {
  id: string
  userId?: string
  date: Date
  weight: number
  bodyFat?: number
  muscleMass?: number
  waistCircumference?: number
  hipCircumference?: number
  chestCircumference?: number
  thighCircumference?: number
  armCircumference?: number
  notes?: string
  createdAt?: Date
}

