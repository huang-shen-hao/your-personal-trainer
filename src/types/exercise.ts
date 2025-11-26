/**
 * 动作库相关类型定义
 */

// 训练部位分类
export type ExerciseCategory = 
  | 'chest'      // 胸部
  | 'back'       // 背部
  | 'shoulders'  // 肩部
  | 'legs'       // 腿部
  | 'arms'       // 手臂
  | 'core'       // 核心
  | 'cardio'     // 有氧
  | 'full_body'  // 全身

// 器械类型
export type ExerciseEquipment = 
  | 'barbell'      // 杠铃
  | 'dumbbell'     // 哑铃
  | 'kettlebell'   // 壶铃
  | 'cable'        // 绳索
  | 'machine'      // 器械
  | 'bodyweight'   // 自重
  | 'foam_roller'  // 泡沫轴
  | 'medicine_ball' // 药球
  | 'other'        // 其他

// 难度等级
export type ExerciseDifficulty = 
  | 'beginner'     // 初级
  | 'intermediate' // 中级
  | 'advanced'     // 高级

// 肌肉群
export type MuscleGroup = 
  | 'chest'        // 胸部
  | 'back'         // 背部
  | 'shoulders'    // 肩部
  | 'triceps'      // 肱三头肌
  | 'biceps'       // 肱二头肌
  | 'forearms'     // 前臂
  | 'quads'        // 股四头肌
  | 'hamstrings'   // 腘绳肌
  | 'glutes'       // 臀大肌
  | 'calves'       // 小腿
  | 'abs'          // 腹肌
  | 'obliques'     // 腹斜肌
  | 'lower_back'   // 下背部
  | 'cardio'       // 有氧
  | 'full_body'    // 全身
  // 保留原有详细分类以兼容
  | 'pectoralis'        // 胸大肌
  | 'upper_chest'       // 胸上部
  | 'lower_chest'       // 胸下部
  | 'latissimus_dorsi'  // 背阔肌
  | 'trapezius'         // 斜方肌
  | 'rhomboids'         // 菱形肌
  | 'erector_spinae'    // 竖脊肌
  | 'anterior_deltoid'  // 三角肌前束
  | 'lateral_deltoid'   // 三角肌中束
  | 'rear_deltoid'      // 三角肌后束
  | 'quadriceps'        // 股四头肌
  | 'adductors'         // 内收肌
  | 'abductors'         // 外展肌
  | 'brachialis'        // 肱肌
  | 'rectus_abdominis'  // 腹直肌
  | 'core'              // 核心
  | 'hip_flexors'       // 髋屈肌
  | '全身'              // 全身

// 动作类型
export type ExerciseType = 
  | 'compound'    // 复合动作
  | 'isolation'   // 孤立动作
  | 'cardio'      // 有氧
  | 'warmup'      // 热身
  | 'stretch'     // 拉伸
  | 'cooldown'    // 放松

// 动作模式
export type MovementPattern = 
  | 'push'           // 推
  | 'pull'           // 拉
  | 'squat'          // 深蹲
  | 'hinge'          // 铰链
  | 'lunge'          // 弓步
  | 'plank'          // 平板
  | 'rotation'       // 旋转
  | 'anti_rotation'  // 抗旋转
  | 'carry'          // 搬运
  | 'other'          // 其他

// 动作数据结构
export interface Exercise {
  id: string
  name: string                      // 中文名称
  nameEn: string                    // 英文名称
  description: string               // 简要描述
  primaryMuscles: MuscleGroup[]     // 主要肌群
  secondaryMuscles?: MuscleGroup[]  // 次要肌群（可选）
  equipment: ExerciseEquipment[]    // 器械类型（数组）
  type: ExerciseType                // 动作类型
  difficulty: ExerciseDifficulty    // 难度等级
  movementPattern: MovementPattern  // 动作模式
  instructions: string[]            // 动作步骤
  tips: string[]                    // 技巧提示
  commonMistakes?: string[]         // 常见错误
  recommendedSets?: [number, number] // 推荐组数范围
  recommendedReps?: [number, number] // 推荐次数范围
  recommendedRestSeconds?: number   // 推荐休息时间（秒）
  alternatives?: string[]           // 替代动作ID
  requiredSkills?: string[]         // 所需技能
  tags?: string[]                   // 标签
  category?: ExerciseCategory       // 训练部位（可选，用于兼容）
  videoUrl?: string                 // 视频链接
  imageUrl?: string                 // 图片链接
}

// 动作筛选条件
export interface ExerciseFilter {
  category?: ExerciseCategory
  equipment?: ExerciseEquipment | ExerciseEquipment[]
  difficulty?: ExerciseDifficulty | ExerciseDifficulty[]
  muscleGroup?: MuscleGroup
  searchKeyword?: string
}

// 分类配置
export const CATEGORY_CONFIG: Record<ExerciseCategory, { label: string; icon: string }> = {
  chest: { label: '胸部', icon: '💪' },
  back: { label: '背部', icon: '🔙' },
  shoulders: { label: '肩部', icon: '💪' },
  legs: { label: '腿部', icon: '🦵' },
  arms: { label: '手臂', icon: '💪' },
  core: { label: '核心', icon: '🎯' },
  cardio: { label: '有氧', icon: '🏃' },
  full_body: { label: '全身', icon: '🏋️' }
}

// 器械配置
export const EQUIPMENT_CONFIG: Record<ExerciseEquipment, { label: string; icon: string }> = {
  barbell: { label: '杠铃', icon: '🏋️' },
  dumbbell: { label: '哑铃', icon: '🏋️' },
  kettlebell: { label: '壶铃', icon: '🏋️' },
  cable: { label: '绳索', icon: '🔗' },
  machine: { label: '器械', icon: '⚙️' },
  bodyweight: { label: '自重', icon: '🧍' },
  foam_roller: { label: '泡沫轴', icon: '🔄' },
  medicine_ball: { label: '药球', icon: '⚽' },
  other: { label: '其他', icon: '🔧' }
}

// 难度配置
export const DIFFICULTY_CONFIG: Record<ExerciseDifficulty, { label: string; color: string }> = {
  beginner: { label: '初级', color: 'success' },
  intermediate: { label: '中级', color: 'warning' },
  advanced: { label: '高级', color: 'danger' }
}

// 肌肉群配置
export const MUSCLE_GROUP_CONFIG: Partial<Record<MuscleGroup, string>> = {
  // 简化分类
  chest: '胸部',
  back: '背部',
  shoulders: '肩部',
  triceps: '肱三头肌',
  biceps: '肱二头肌',
  forearms: '前臂',
  quads: '股四头肌',
  hamstrings: '腘绳肌',
  glutes: '臀大肌',
  calves: '小腿',
  abs: '腹肌',
  obliques: '腹斜肌',
  lower_back: '下背部',
  cardio: '有氧',
  full_body: '全身',
  // 详细分类
  pectoralis: '胸大肌',
  upper_chest: '胸上部',
  lower_chest: '胸下部',
  latissimus_dorsi: '背阔肌',
  trapezius: '斜方肌',
  rhomboids: '菱形肌',
  erector_spinae: '竖脊肌',
  anterior_deltoid: '三角肌前束',
  lateral_deltoid: '三角肌中束',
  rear_deltoid: '三角肌后束',
  quadriceps: '股四头肌',
  adductors: '内收肌',
  abductors: '外展肌',
  brachialis: '肱肌',
  rectus_abdominis: '腹直肌',
  core: '核心',
  hip_flexors: '髋屈肌',
  '全身': '全身'
}
