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
  // 新版姿势数据中 nameEn、category、equipment 等字段可能缺失或为中文
  nameEn?: string
  category?: string
  equipment?: string | string[]
  difficulty?: string
  primaryMuscles?: string[]
  secondaryMuscles?: string[]
  description?: string
  instructions?: string[]
  tips?: string[]
  videoUrl?: string
  imageUrl?: string
}

/**
 * 将原始 category（可能是中文或英文）映射为内部枚举
 */
function mapCategory(raw?: string): ExerciseCategory {
  if (!raw) return 'full_body'
  switch (raw) {
    // 中文映射
    case '胸部':
      return 'chest'
    case '背部':
      return 'back'
    case '肩部':
      return 'shoulders'
    // 下肢相关分类统一归为 legs
    case '腿部':
    case '大腿':
    case '小腿':
    case '下肢':
      return 'legs'
    case '手臂':
      return 'arms'
    case '核心':
      return 'core'
    case '有氧':
      return 'cardio'
    case '全身':
      return 'full_body'
    // 旧版英文值直接透传
    case 'chest':
    case 'back':
    case 'shoulders':
    case 'legs':
    case 'arms':
    case 'core':
    case 'cardio':
    case 'full_body':
      return raw
    default:
      return 'full_body'
  }
}

/**
 * 将原始器械字段映射为内部枚举
 */
function mapEquipment(raw: string): ExerciseEquipment {
  switch (raw) {
    // 中文
    case '杠铃':
      return 'barbell'
    case '哑铃':
      return 'dumbbell'
    case '壶铃':
      return 'kettlebell'
    case '绳索':
      return 'cable'
    case '器械':
      return 'machine'
    case '自重':
      return 'bodyweight'
    case '泡沫轴':
      return 'foam_roller'
    case '药球':
      return 'medicine_ball'
    // 旧版英文值
    case 'barbell':
    case 'dumbbell':
    case 'kettlebell':
    case 'cable':
    case 'machine':
    case 'bodyweight':
    case 'foam_roller':
    case 'medicine_ball':
    case 'other':
      return raw
    default:
      return 'other'
  }
}

/**
 * 将原始肌肉名称（可能是中文或英文）映射为内部枚举
 * 这里只做与计划生成相关的主肌群粗略映射，避免因为字段变化导致筛选不到动作
 */
function mapMuscle(raw: string): MuscleGroup {
  switch (raw) {
    // 中文
    case '胸部':
    case '胸肌':
    case '胸大肌':
      return 'chest'
    case '背部':
    case '上背部':
    case '背阔肌':
      return 'back'
    case '下背部':
      return 'lower_back'
    case '肩部':
    case '三角肌':
      return 'shoulders'
    case '肱二头肌':
      return 'biceps'
    case '肱三头肌':
      return 'triceps'
    case '前臂':
      return 'forearms'
    case '股四头肌':
      return 'quadriceps'
    case '腘绳肌':
      return 'hamstrings'
    case '臀部':
    case '臀大肌':
      return 'glutes'
    case '小腿':
      return 'calves'
    case '腹部':
    case '腹肌':
    case '腹直肌':
      return 'abs'
    case '腹斜肌':
      return 'obliques'
    case '核心':
      return 'core'
    case '有氧':
      return 'cardio'
    case '全身':
      return 'full_body'
    // 已有英文枚举值（直接透传，兼容旧数据）
    case 'chest':
    case 'back':
    case 'shoulders':
    case 'triceps':
    case 'biceps':
    case 'forearms':
    case 'quads':
    case 'hamstrings':
    case 'glutes':
    case 'calves':
    case 'abs':
    case 'obliques':
    case 'lower_back':
    case 'cardio':
    case 'full_body':
    case 'pectoralis':
    case 'upper_chest':
    case 'lower_chest':
    case 'latissimus_dorsi':
    case 'trapezius':
    case 'rhomboids':
    case 'erector_spinae':
    case 'anterior_deltoid':
    case 'lateral_deltoid':
    case 'rear_deltoid':
    case 'quadriceps':
    case 'adductors':
    case 'abductors':
    case 'brachialis':
    case 'rectus_abdominis':
    case 'core':
    case 'hip_flexors':
    case '全身':
      return raw
    default:
      return 'full_body'
  }
}

/**
 * 将原始难度字段规范为内部枚举
 */
function mapDifficulty(raw?: string): ExerciseDifficulty {
  if (!raw) return 'beginner'
  switch (raw) {
    case 'beginner':
    case 'intermediate':
    case 'advanced':
      return raw
    case '初级':
      return 'beginner'
    case '中级':
      return 'intermediate'
    case '高级':
      return 'advanced'
    default:
      return 'beginner'
  }
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
  const category = mapCategory(data.category)

  const rawEquipment = Array.isArray(data.equipment)
    ? data.equipment
    : data.equipment
      ? [data.equipment]
      : ['bodyweight']

  const equipment = rawEquipment.map(eq => mapEquipment(eq))

  const primaryMuscles = (data.primaryMuscles || []).map(m => mapMuscle(m))
  const secondaryMuscles = (data.secondaryMuscles || []).map(m => mapMuscle(m))

  return {
    // 基础字段
    id: data.id,
    name: data.name,
    nameEn: data.nameEn || data.name,
    description: data.description || '',
    primaryMuscles,
    secondaryMuscles: secondaryMuscles.length > 0 ? secondaryMuscles : undefined,
    equipment,
    difficulty: mapDifficulty(data.difficulty),
    type: inferExerciseType(category),
    movementPattern: inferMovementPattern(category, data.name),
    instructions: data.instructions || [],
    tips: data.tips || [],
    // 兼容字段
    category,
    videoUrl: data.videoUrl,
    imageUrl: data.imageUrl
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

