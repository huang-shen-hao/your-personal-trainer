/**
 * 动作库工具函数
 */

import exercisesData from '@/data/exercises.json'
import type { 
  Exercise, 
  ExerciseFilter, 
  ExerciseCategory,
  ExerciseEquipment,
  ExerciseDifficulty,
  MuscleGroup,
  ExerciseType,
  MovementPattern
} from '@/types/exercise'

// JSON 数据的原始类型（用于类型转换）
interface ExerciseJsonData {
  id: string
  name: string
  nameEn: string
  category: string
  equipment: string
  difficulty: string
  primaryMuscles: string[]
  secondaryMuscles?: string[]
  description: string
  instructions: string[]
  tips: string[]
  videoUrl?: string
  imageUrl?: string
}

/**
 * 根据分类推断动作类型
 */
function inferExerciseType(category: string): ExerciseType {
  if (category === 'cardio') return 'cardio'
  if (category === 'core') return 'isolation'
  return 'compound'
}

/**
 * 根据分类和名称推断动作模式
 */
function inferMovementPattern(category: string, name: string): MovementPattern {
  const nameLower = name.toLowerCase()
  if (nameLower.includes('深蹲') || nameLower.includes('squat')) return 'squat'
  if (nameLower.includes('硬拉') || nameLower.includes('deadlift')) return 'hinge'
  if (nameLower.includes('弓步') || nameLower.includes('lunge')) return 'lunge'
  if (nameLower.includes('平板') || nameLower.includes('plank')) return 'plank'
  if (category === 'chest' || category === 'shoulders' || category === 'arms') {
    if (nameLower.includes('推') || nameLower.includes('press') || nameLower.includes('push')) return 'push'
  }
  if (category === 'back' || category === 'arms') {
    if (nameLower.includes('拉') || nameLower.includes('pull') || nameLower.includes('row')) return 'pull'
  }
  return 'other'
}

/**
 * 将 JSON 数据转换为 Exercise 类型
 */
function normalizeExercise(data: ExerciseJsonData): Exercise {
  return {
    ...data,
    category: data.category as ExerciseCategory,
    equipment: [data.equipment as ExerciseEquipment],
    difficulty: data.difficulty as ExerciseDifficulty,
    primaryMuscles: data.primaryMuscles as MuscleGroup[],
    secondaryMuscles: data.secondaryMuscles as MuscleGroup[] | undefined,
    type: inferExerciseType(data.category),
    movementPattern: inferMovementPattern(data.category, data.name)
  }
}

/**
 * 获取所有动作（已规范化）
 */
let normalizedExercisesCache: Exercise[] | null = null

export function getAllExercises(): Exercise[] {
  if (!normalizedExercisesCache) {
    normalizedExercisesCache = (exercisesData as ExerciseJsonData[]).map(normalizeExercise)
  }
  return normalizedExercisesCache
}

/**
 * 根据ID获取动作
 */
export function getExerciseById(id: string): Exercise | undefined {
  return getAllExercises().find(ex => ex.id === id)
}

/**
 * 根据条件筛选动作
 */
export function filterExercises(filter: ExerciseFilter): Exercise[] {
  let exercises = getAllExercises()

  // 按分类筛选
  if (filter.category) {
    exercises = exercises.filter(ex => ex.category === filter.category)
  }

  // 按器械筛选
  if (filter.equipment) {
    const equipmentArray = Array.isArray(filter.equipment) 
      ? filter.equipment 
      : [filter.equipment]
    exercises = exercises.filter(ex => 
      ex.equipment.some(eq => equipmentArray.includes(eq))
    )
  }

  // 按难度筛选
  if (filter.difficulty) {
    const difficultyArray = Array.isArray(filter.difficulty) 
      ? filter.difficulty 
      : [filter.difficulty]
    exercises = exercises.filter(ex => difficultyArray.includes(ex.difficulty))
  }

  // 按肌肉群筛选
  if (filter.muscleGroup) {
    exercises = exercises.filter(ex => 
      ex.primaryMuscles.includes(filter.muscleGroup as MuscleGroup) ||
      (ex.secondaryMuscles && ex.secondaryMuscles.includes(filter.muscleGroup as MuscleGroup))
    )
  }

  // 关键词搜索
  if (filter.searchKeyword) {
    const keyword = filter.searchKeyword.toLowerCase()
    exercises = exercises.filter(ex =>
      ex.name.toLowerCase().includes(keyword) ||
      ex.nameEn.toLowerCase().includes(keyword) ||
      ex.description.toLowerCase().includes(keyword)
    )
  }

  return exercises
}

/**
 * 按分类分组动作
 */
export function groupExercisesByCategory(): Record<ExerciseCategory, Exercise[]> {
  const exercises = getAllExercises()
  const grouped: Record<string, Exercise[]> = {}

  exercises.forEach(ex => {
    const category = ex.category || 'full_body' // 如果没有分类，默认归为全身
    if (!grouped[category]) {
      grouped[category] = []
    }
    grouped[category].push(ex)
  })

  return grouped as Record<ExerciseCategory, Exercise[]>
}

/**
 * 按器械分组动作
 */
export function groupExercisesByEquipment(): Record<ExerciseEquipment, Exercise[]> {
  const exercises = getAllExercises()
  const grouped: Record<string, Exercise[]> = {}

  exercises.forEach(ex => {
    ex.equipment.forEach(eq => {
      if (!grouped[eq]) {
        grouped[eq] = []
      }
      grouped[eq].push(ex)
    })
  })

  return grouped as Record<ExerciseEquipment, Exercise[]>
}

/**
 * 按难度分组动作
 */
export function groupExercisesByDifficulty(): Record<ExerciseDifficulty, Exercise[]> {
  const exercises = getAllExercises()
  const grouped: Record<string, Exercise[]> = {}

  exercises.forEach(ex => {
    if (!grouped[ex.difficulty]) {
      grouped[ex.difficulty] = []
    }
    grouped[ex.difficulty].push(ex)
  })

  return grouped as Record<ExerciseDifficulty, Exercise[]>
}

/**
 * 获取随机动作
 */
export function getRandomExercises(count: number, filter?: ExerciseFilter): Exercise[] {
  const exercises = filter ? filterExercises(filter) : getAllExercises()
  const shuffled = [...exercises].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

/**
 * 获取推荐动作（基于用户目标和器械条件）
 */
export function getRecommendedExercises(
  goals: string[], 
  equipment: 'none' | 'home' | 'gym',
  experienceLevel: 'none' | 'beginner' | 'intermediate' | 'advanced',
  count: number = 10
): Exercise[] {
  // 根据目标映射到分类
  const categoryMap: Record<string, ExerciseCategory[]> = {
    'muscle_gain': ['chest', 'back', 'legs', 'shoulders', 'arms'],
    'fat_loss': ['cardio', 'full_body'],
    'fitness': ['cardio', 'core', 'full_body'],
    'rehab': ['core', 'legs'],
    'general': ['chest', 'back', 'legs', 'shoulders', 'arms', 'core']
  }

  // 根据器械条件映射
  const equipmentMap: Record<string, ExerciseEquipment[]> = {
    'none': ['bodyweight'],
    'home': ['bodyweight', 'dumbbell', 'kettlebell', 'other'],
    'gym': ['barbell', 'dumbbell', 'kettlebell', 'cable', 'machine', 'bodyweight', 'other']
  }

  // 根据经验水平映射
  const difficultyMap: Record<string, ExerciseDifficulty[]> = {
    'none': ['beginner'],
    'beginner': ['beginner', 'intermediate'],
    'intermediate': ['beginner', 'intermediate', 'advanced'],
    'advanced': ['intermediate', 'advanced']
  }

  // 获取所有相关分类
  const categories: ExerciseCategory[] = []
  goals.forEach(goal => {
    if (categoryMap[goal]) {
      categories.push(...categoryMap[goal])
    }
  })

  // 如果没有目标，使用通用分类
  if (categories.length === 0) {
    categories.push(...categoryMap['general'])
  }

  // 筛选动作
  const exercises = filterExercises({
    equipment: equipmentMap[equipment],
    difficulty: difficultyMap[experienceLevel]
  }).filter(ex => ex.category && categories.includes(ex.category))

  // 随机选取
  const shuffled = [...exercises].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

/**
 * 获取统计信息
 */
export function getExerciseStats() {
  const exercises = getAllExercises()
  
  return {
    total: exercises.length,
    byCategory: Object.entries(groupExercisesByCategory()).map(([category, exs]) => ({
      category,
      count: exs.length
    })),
    byEquipment: Object.entries(groupExercisesByEquipment()).map(([equipment, exs]) => ({
      equipment,
      count: exs.length
    })),
    byDifficulty: Object.entries(groupExercisesByDifficulty()).map(([difficulty, exs]) => ({
      difficulty,
      count: exs.length
    }))
  }
}

