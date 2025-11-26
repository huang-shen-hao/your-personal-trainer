import { z } from 'zod'

/**
 * 用户档案验证 Schema
 */
export const userProfileSchema = z.object({
  nickname: z
    .string()
    .min(2, '昵称至少2个字符')
    .max(20, '昵称最多20个字符'),
  
  gender: z.enum(['male', 'female', 'other'], {
    errorMap: () => ({ message: '请选择性别' })
  }),
  
  birthYear: z
    .number()
    .int('请输入整数')
    .min(1950, '出生年份不能早于1950年')
    .max(new Date().getFullYear(), '出生年份不能超过当前年份'),
  
  height: z
    .number()
    .min(100, '身高不能低于100cm')
    .max(250, '身高不能超过250cm'),
  
  currentWeight: z
    .number()
    .min(30, '体重不能低于30kg')
    .max(200, '体重不能超过200kg'),
  
  experienceLevel: z.enum(['none', 'beginner', 'intermediate', 'advanced']),
  
  goals: z
    .array(z.string())
    .min(1, '请至少选择一个训练目标')
    .max(4, '最多选择4个训练目标'),
  
  equipment: z.enum(['none', 'home', 'gym']),
  
  coachPersonality: z.enum(['strict', 'encouraging', 'humorous', 'academic'])
})

export type UserProfileFormData = z.infer<typeof userProfileSchema>

/**
 * 体测数据验证 Schema
 */
export const bodyMetricSchema = z.object({
  date: z.date(),
  
  weight: z
    .number()
    .min(30, '体重不能低于30kg')
    .max(200, '体重不能超过200kg')
    .optional(),
  
  bodyFat: z
    .number()
    .min(3, '体脂率不能低于3%')
    .max(50, '体脂率不能超过50%')
    .optional(),
  
  measurements: z.object({
    chest: z.number().min(50).max(200).optional(),
    waist: z.number().min(40).max(200).optional(),
    hips: z.number().min(50).max(200).optional(),
    neck: z.number().min(20).max(60).optional(),
    upperArm: z.number().min(15).max(80).optional(),
    forearm: z.number().min(15).max(60).optional(),
    thigh: z.number().min(30).max(100).optional(),
    calf: z.number().min(20).max(80).optional()
  }).optional(),
  
  notes: z.string().max(500, '备注不能超过500字').optional()
})

export type BodyMetricFormData = z.infer<typeof bodyMetricSchema>

/**
 * 验证用户档案数据
 */
export function validateUserProfile(data: unknown): {
  success: boolean
  data?: UserProfileFormData
  errors?: string[]
} {
  try {
    const validated = userProfileSchema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => err.message)
      return { success: false, errors }
    }
    return { success: false, errors: ['数据验证失败'] }
  }
}

/**
 * 验证体测数据
 */
export function validateBodyMetric(data: unknown): {
  success: boolean
  data?: BodyMetricFormData
  errors?: string[]
} {
  try {
    const validated = bodyMetricSchema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => err.message)
      return { success: false, errors }
    }
    return { success: false, errors: ['数据验证失败'] }
  }
}

/**
 * 计算年龄
 */
export function calculateAge(birthYear: number): number {
  return new Date().getFullYear() - birthYear
}

/**
 * 计算BMI
 */
export function calculateBMI(weight: number, height: number): number {
  // BMI = 体重(kg) / 身高(m)²
  const heightInMeters = height / 100
  return Number((weight / (heightInMeters * heightInMeters)).toFixed(1))
}

/**
 * 获取BMI等级
 */
export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return '偏瘦'
  if (bmi < 24) return '正常'
  if (bmi < 28) return '偏胖'
  return '肥胖'
}

