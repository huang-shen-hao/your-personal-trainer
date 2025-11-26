/**
 * 训练计划相关类型定义
 */

import type { Exercise } from './exercise'

// 训练计划周期类型
export type PlanCycle = 
  | 'weekly'    // 每周循环
  | 'biweekly'  // 两周循环
  | 'monthly'   // 每月循环

// 训练计划目标
export type PlanGoal = 
  | 'muscle_gain'  // 增肌
  | 'fat_loss'     // 减脂
  | 'fitness'      // 体能提升
  | 'strength'     // 力量提升
  | 'rehab'        // 康复
  | 'general'      // 综合

// 训练分化类型
export type TrainingSplit = 
  | 'full_body'         // 全身训练
  | 'upper_lower'       // 上下肢分化
  | 'push_pull_legs'    // 推拉腿分化
  | 'body_part_split'   // 部位分化
  | 'custom'            // 自定义

// 训练日类型
export type TrainingDayType = 
  | 'push'      // 推
  | 'pull'      // 拉
  | 'legs'      // 腿
  | 'upper'     // 上肢
  | 'lower'     // 下肢
  | 'full_body' // 全身
  | 'chest_triceps'   // 胸+三头
  | 'back_biceps'     // 背+二头
  | 'shoulders_abs'   // 肩+腹
  | 'legs_glutes'     // 腿+臀
  | 'cardio'          // 有氧
  | 'rest'            // 休息

// 训练强度
export type TrainingIntensity = 
  | 'light'      // 轻度
  | 'moderate'   // 中等
  | 'high'       // 高强度
  | 'very_high'  // 极高

// 训练动作组
export interface ExerciseSet {
  exerciseId: string       // 动作ID
  exercise?: Exercise      // 动作详情（可选，用于展示）
  sets: number            // 组数
  reps: string            // 次数（如 "8-12"、"20"、"max"）
  restSeconds: number     // 组间休息（秒）
  notes?: string          // 备注
  intensity?: TrainingIntensity // 强度
  tempo?: string          // 节奏（如 "3-1-1"）
}

// 训练日计划
export interface TrainingDay {
  id: string
  dayOfWeek: number       // 星期几（0=周日，1=周一...6=周六）
  type: TrainingDayType   // 训练类型
  name: string            // 训练日名称（如 "推日"、"胸+三头"）
  exercises: ExerciseSet[] // 动作列表
  totalDuration?: number  // 预计时长（分钟）
  warmup?: string[]       // 热身建议
  cooldown?: string[]     // 放松建议
  notes?: string          // 备注
}

// 训练计划
export interface TrainingPlan {
  id: string
  userId: string
  name: string                  // 计划名称
  description?: string          // 计划描述
  goal: PlanGoal               // 训练目标
  split: TrainingSplit         // 分化类型
  cycle: PlanCycle             // 周期类型
  weeks: number                // 周期长度（周）
  daysPerWeek: number          // 每周训练天数
  trainingDays: TrainingDay[]  // 训练日安排
  startDate?: Date             // 开始日期
  endDate?: Date               // 结束日期
  isActive: boolean            // 是否为当前活跃计划
  isCompleted: boolean         // 是否已完成
  createdAt: Date
  updatedAt: Date
  createdBy: 'user' | 'ai' | 'system' // 创建方式
  tags?: string[]              // 标签
}

// 计划生成配置
export interface PlanGenerationConfig {
  userId: string
  goal: PlanGoal | PlanGoal[]
  daysPerWeek: number         // 每周训练天数（3-6）
  sessionDuration: number     // 单次训练时长（分钟）
  experienceLevel: 'none' | 'beginner' | 'intermediate' | 'advanced'
  equipment: 'none' | 'home' | 'gym'
  preferredSplit?: TrainingSplit
  excludeExercises?: string[] // 排除的动作ID
  focusAreas?: string[]       // 重点训练部位
  injuries?: string[]         // 伤病史
  preferences?: {
    highVolume?: boolean      // 偏好高容量训练
    compound?: boolean        // 偏好复合动作
    isolation?: boolean       // 偏好孤立动作
    cardio?: boolean          // 包含有氧
  }
}

// 计划统计
export interface PlanStats {
  totalWorkouts: number         // 总训练次数
  completedWorkouts: number     // 已完成次数
  completionRate: number        // 完成率
  totalVolume: number           // 总训练量
  averageDuration: number       // 平均时长
  exerciseCount: number         // 动作总数
  muscleGroupCoverage: string[] // 覆盖的肌肉群
}

// 训练分化配置
export const TRAINING_SPLIT_CONFIG: Record<TrainingSplit, {
  label: string
  description: string
  minDays: number
  maxDays: number
  dayTypes: TrainingDayType[]
}> = {
  'full_body': {
    label: '全身训练',
    description: '每次训练全身主要肌群',
    minDays: 2,
    maxDays: 4,
    dayTypes: ['full_body']
  },
  'upper_lower': {
    label: '上下肢分化',
    description: '上肢和下肢分开训练',
    minDays: 4,
    maxDays: 6,
    dayTypes: ['upper', 'lower']
  },
  'push_pull_legs': {
    label: '推拉腿分化',
    description: '推、拉、腿三分化',
    minDays: 3,
    maxDays: 6,
    dayTypes: ['push', 'pull', 'legs']
  },
  'body_part_split': {
    label: '部位分化',
    description: '每天训练特定部位',
    minDays: 4,
    maxDays: 6,
    dayTypes: ['chest_triceps', 'back_biceps', 'shoulders_abs', 'legs_glutes']
  },
  'custom': {
    label: '自定义',
    description: '自定义训练安排',
    minDays: 1,
    maxDays: 7,
    dayTypes: []
  }
}

// 目标配置
export const PLAN_GOAL_CONFIG: Record<PlanGoal, {
  label: string
  description: string
  setsRange: [number, number]     // 组数范围
  repsRange: [number, number]     // 次数范围
  restSeconds: [number, number]   // 休息时间范围
  preferredIntensity: TrainingIntensity[]
}> = {
  'muscle_gain': {
    label: '增肌',
    description: '增加肌肉量和围度',
    setsRange: [3, 5],
    repsRange: [8, 12],
    restSeconds: [60, 90],
    preferredIntensity: ['moderate', 'high']
  },
  'fat_loss': {
    label: '减脂',
    description: '减少体脂，改善身体成分',
    setsRange: [3, 4],
    repsRange: [12, 20],
    restSeconds: [30, 60],
    preferredIntensity: ['moderate', 'high', 'very_high']
  },
  'fitness': {
    label: '体能提升',
    description: '提升整体体能和耐力',
    setsRange: [2, 4],
    repsRange: [12, 20],
    restSeconds: [30, 60],
    preferredIntensity: ['light', 'moderate', 'high']
  },
  'strength': {
    label: '力量提升',
    description: '增加最大力量',
    setsRange: [4, 6],
    repsRange: [3, 6],
    restSeconds: [120, 180],
    preferredIntensity: ['high', 'very_high']
  },
  'rehab': {
    label: '康复',
    description: '恢复伤病，循序渐进',
    setsRange: [2, 3],
    repsRange: [10, 15],
    restSeconds: [60, 90],
    preferredIntensity: ['light', 'moderate']
  },
  'general': {
    label: '综合',
    description: '全面发展',
    setsRange: [3, 4],
    repsRange: [8, 15],
    restSeconds: [60, 90],
    preferredIntensity: ['light', 'moderate', 'high']
  }
}

// 训练日类型配置
export const TRAINING_DAY_TYPE_CONFIG: Record<TrainingDayType, {
  label: string
  categories: string[]
  primaryMuscles: string[]
}> = {
  'push': {
    label: '推日',
    categories: ['chest', 'shoulders', 'arms'],
    primaryMuscles: ['pectoralis', 'anterior_deltoid', 'lateral_deltoid', 'triceps']
  },
  'pull': {
    label: '拉日',
    categories: ['back', 'arms'],
    primaryMuscles: ['latissimus_dorsi', 'trapezius', 'rear_deltoid', 'biceps']
  },
  'legs': {
    label: '腿日',
    categories: ['legs'],
    primaryMuscles: ['quadriceps', 'hamstrings', 'glutes', 'calves']
  },
  'upper': {
    label: '上肢',
    categories: ['chest', 'back', 'shoulders', 'arms'],
    primaryMuscles: ['pectoralis', 'latissimus_dorsi', 'anterior_deltoid', 'biceps', 'triceps']
  },
  'lower': {
    label: '下肢',
    categories: ['legs'],
    primaryMuscles: ['quadriceps', 'hamstrings', 'glutes', 'calves']
  },
  'full_body': {
    label: '全身',
    categories: ['chest', 'back', 'legs', 'shoulders', 'arms', 'core'],
    primaryMuscles: []
  },
  'chest_triceps': {
    label: '胸+三头',
    categories: ['chest', 'arms'],
    primaryMuscles: ['pectoralis', 'triceps']
  },
  'back_biceps': {
    label: '背+二头',
    categories: ['back', 'arms'],
    primaryMuscles: ['latissimus_dorsi', 'trapezius', 'biceps']
  },
  'shoulders_abs': {
    label: '肩+腹',
    categories: ['shoulders', 'core'],
    primaryMuscles: ['anterior_deltoid', 'lateral_deltoid', 'rear_deltoid', 'core']
  },
  'legs_glutes': {
    label: '腿+臀',
    categories: ['legs'],
    primaryMuscles: ['quadriceps', 'hamstrings', 'glutes']
  },
  'cardio': {
    label: '有氧',
    categories: ['cardio'],
    primaryMuscles: []
  },
  'rest': {
    label: '休息',
    categories: [],
    primaryMuscles: []
  }
}

