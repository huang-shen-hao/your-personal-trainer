import Dexie, { Table } from 'dexie'

// ==================== 接口定义 ====================

export interface User {
  id?: string
  nickname: string
  realName?: string
  gender: 'male' | 'female' | 'other'
  birthYear: number
  height: number
  currentWeight: number
  experienceLevel: 'none' | 'beginner' | 'intermediate' | 'advanced'
  goals: string[]
  injuries?: string[]
  equipment: 'none' | 'home' | 'gym'
  location: 'home' | 'gym' | 'outdoor'
  weeklyTrainingDays?: number
  preferredSessionDuration?: number
  coachPersonality: 'strict' | 'encouraging' | 'humorous' | 'academic' | 'custom'
  customPrompt?: string
  createdAt: Date
  updatedAt: Date
}

export interface BodyMetric {
  id?: string
  userId: string
  date: Date
  type?: string
  value?: number
  unit?: string
  weight?: number
  bodyFat?: number
  measurements?: {
    chest?: number
    waist?: number
    hips?: number
    neck?: number
    upperArm?: number
    forearm?: number
    thigh?: number
    calf?: number
  }
  notes?: string
  note?: string
  imageIds?: string[]
  photoUrls?: string[]
  createdAt?: Date
}

export interface TrainingPlan {
  id?: string
  userId: string
  name: string
  description?: string
  goal: string
  split: string
  cycle: string
  weeks: number
  daysPerWeek: number
  trainingDays: any[]
  startDate?: Date
  endDate?: Date
  isActive: boolean
  isCompleted: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: string
  tags?: string[]
}

export interface WorkoutLog {
  id?: string
  userId: string
  planId?: string
  sessionId?: string
  date: Date
  startTime: Date
  endTime?: Date
  exercises: any[]
  overallFatigue?: number
  sleepQuality?: number
  nutritionStatus?: string
  notes?: string
}

export interface Exercise {
  id?: string
  nameZh: string
  nameEn: string
  category: string
  primaryMuscles: string[]
  secondaryMuscles?: string[]
  equipment: string[]
  difficulty: string
  description: string
  keyPoints: string[]
  commonMistakes?: string[]
  videoUrl?: string
  imageUrl?: string
  alternatives?: string[]
}

export interface ChatMessage {
  id?: string
  sessionId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  images?: string[]
  timestamp: Date
  metadata?: {
    model?: string
    tokensUsed?: number
    inferenceTime?: number
  }
}

export interface ChatSession {
  id?: string
  userId: string
  title: string
  createdAt: Date
  updatedAt: Date
  messageCount: number
}

export interface ImageRecord {
  id?: string
  userId: string
  type: 'food' | 'posture' | 'equipment' | 'progress' | 'other'
  blob: Blob
  mimeType: string
  size: number
  width?: number
  height?: number
  capturedAt: Date
  tags?: string[]
  metadata?: Record<string, any>
}

export interface AnalysisResult {
  id?: string
  imageId: string
  analysisType: 'food' | 'posture' | 'equipment'
  result: any
  confidence?: number
  modelVersion?: string
  timestamp: Date
}

export interface AIConfig {
  id?: string
  userId: string
  provider: string
  modelId: string
  apiKey: string
  apiEndpoint?: string
  temperature?: number
  maxTokens?: number
  /**
   * AI 教练在界面中展示的名字，例如「AI 教练」「小深」等
   */
  displayName?: string
  /**
   * AI 教练头像的 URL（可以是网络地址或 base64），用于聊天界面头像展示
   */
  avatarUrl?: string
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ChatSessionDB {
  id?: string
  userId: string
  title: string
  messages: any[]
  modelId: string
  provider: string
  createdAt: Date
  updatedAt: Date
  tokens: number
  lastMessageAt: Date
}

export interface PromptTemplate {
  id?: string
  type: string
  name: string
  content: string
  variables?: string[]
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
  version?: string
}

export interface APIUsageStats {
  id?: string
  userId: string
  date: Date
  provider: string
  modelId: string
  requestCount: number
  totalTokens: number
  promptTokens: number
  completionTokens: number
  estimatedCost: number
}

// ==================== 数据库类 ====================

class PersonalTrainerDB extends Dexie {
  // 声明表类型
  users!: Table<User>
  bodyMetrics!: Table<BodyMetric>
  plans!: Table<TrainingPlan>
  workouts!: Table<WorkoutLog>
  exercises!: Table<Exercise>
  messages!: Table<ChatMessage>
  images!: Table<ImageRecord>
  analysisResults!: Table<AnalysisResult>
  aiConfigs!: Table<AIConfig>
  chatSessions!: Table<ChatSessionDB>
  promptTemplates!: Table<PromptTemplate>
  prompts!: Table<PromptTemplate>  // 别名，方便使用
  apiUsageStats!: Table<APIUsageStats>

  constructor() {
    super('PersonalTrainerDB')
    
    // 定义表结构与索引
    // 注意：版本号必须大于浏览器中已存在的版本
    this.version(26).stores({
      users: 'id, nickname',
      bodyMetrics: '++id, id, userId, date',
      plans: '++id, userId, isActive',
      workouts: '++id, userId, sessionId, planId',
      exercises: '++id, nameZh, nameEn, category, difficulty',
      messages: '++id, sessionId',
      images: '++id, userId, type',
      analysisResults: '++id, imageId, analysisType',
      aiConfigs: '++id, userId, provider, isDefault',
      chatSessions: '++id, userId, lastMessageAt',
      promptTemplates: '++id, type, isDefault',
      apiUsageStats: '++id, userId, provider, modelId'
    })
    
    // 设置别名
    this.prompts = this.promptTemplates
  }
}

// 创建数据库实例
export const db = new PersonalTrainerDB()

// 导出便捷函数
export default db

