/**
 * 训练计划生成器
 * 基于规则引擎生成个性化训练计划
 */

import {
  filterExercises,
} from "./exerciseUtils";
import type { 
  Exercise,
  ExerciseEquipment,
  ExerciseDifficulty
} from "@/types/exercise";
import type {
  TrainingPlan,
  TrainingDay,
  ExerciseSet,
  PlanGenerationConfig,
  TrainingSplit,
  TrainingDayType,
  PlanGoal,
} from "@/types/plan";
import {
  TRAINING_SPLIT_CONFIG,
  PLAN_GOAL_CONFIG,
  TRAINING_DAY_TYPE_CONFIG,
} from "@/types/plan";

/**
 * 生成训练计划
 */
export function generateTrainingPlan(
  config: PlanGenerationConfig
): TrainingPlan {
  // 1. 确定训练分化方式
  const split = determineSplit(config);

  // 2. 生成训练日安排
  const trainingDays = generateTrainingDays(config, split);

  // 3. 为每个训练日分配动作
  const daysWithExercises = trainingDays.map((day) =>
    assignExercisesToDay(day, config)
  );

  // 4. 创建计划对象
  const plan: TrainingPlan = {
    id: crypto.randomUUID(),
    userId: config.userId,
    name: generatePlanName(config, split),
    description: generatePlanDescription(config, split),
    goal: Array.isArray(config.goal) ? config.goal[0] : config.goal,
    split,
    cycle: "weekly",
    weeks: determineWeeks(config),
    daysPerWeek: config.daysPerWeek,
    trainingDays: daysWithExercises,
    isActive: false,
    isCompleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: "system",
    tags: generateTags(config),
  };

  return plan;
}

/**
 * 确定训练分化方式
 */
function determineSplit(config: PlanGenerationConfig): TrainingSplit {
  if (config.preferredSplit) {
    return config.preferredSplit;
  }

  const { daysPerWeek, experienceLevel } = config;

  // 根据每周训练天数和经验水平决定分化方式
  if (daysPerWeek <= 3) {
    return "full_body";
  } else if (daysPerWeek === 4) {
    return experienceLevel === "beginner" ? "upper_lower" : "upper_lower";
  } else if (daysPerWeek === 5 || daysPerWeek === 6) {
    if (experienceLevel === "beginner" || experienceLevel === "none") {
      return "upper_lower";
    } else if (experienceLevel === "intermediate") {
      return "push_pull_legs";
    } else {
      return "body_part_split";
    }
  }

  return "full_body";
}

/**
 * 生成训练日安排
 */
function generateTrainingDays(
  config: PlanGenerationConfig,
  split: TrainingSplit
): TrainingDay[] {
  const { daysPerWeek } = config;
  // const splitConfig = TRAINING_SPLIT_CONFIG[split];
  const days: TrainingDay[] = [];

  // 根据分化类型安排训练日
  let dayTypes: TrainingDayType[] = [];

  switch (split) {
    case "full_body":
      dayTypes = Array(daysPerWeek).fill("full_body");
      break;

    case "upper_lower":
      // 上下肢交替
      dayTypes = [];
      for (let i = 0; i < daysPerWeek; i++) {
        dayTypes.push(i % 2 === 0 ? "upper" : "lower");
      }
      break;

    case "push_pull_legs":
      // 推拉腿循环
      const pplCycle = ["push", "pull", "legs"] as TrainingDayType[];
      dayTypes = [];
      for (let i = 0; i < daysPerWeek; i++) {
        dayTypes.push(pplCycle[i % 3]);
      }
      break;

    case "body_part_split":
      // 部位分化
      const bodyPartCycle = [
        "chest_triceps",
        "back_biceps",
        "legs_glutes",
        "shoulders_abs",
      ] as TrainingDayType[];
      dayTypes = [];
      for (let i = 0; i < daysPerWeek; i++) {
        dayTypes.push(bodyPartCycle[i % 4]);
      }
      break;

    default:
      dayTypes = Array(daysPerWeek).fill("full_body");
  }

  // 在一周中均匀分布训练日
  const trainingDayIndices = distributeTrainingDays(daysPerWeek);

  dayTypes.forEach((type, index) => {
    const dayOfWeek = trainingDayIndices[index];
    const dayConfig = TRAINING_DAY_TYPE_CONFIG[type];

    days.push({
      id: crypto.randomUUID(),
      dayOfWeek,
      type,
      name: dayConfig.label,
      exercises: [],
      warmup: generateWarmupSuggestions(type),
      cooldown: generateCooldownSuggestions(type),
    });
  });

  return days;
}

/**
 * 在一周中均匀分布训练日
 */
function distributeTrainingDays(daysPerWeek: number): number[] {
  const allDays = [1, 2, 3, 4, 5, 6, 0]; // 周一到周日

  if (daysPerWeek >= 7) return allDays;

  // 均匀分布算法
  const interval = 7 / daysPerWeek;
  const days: number[] = [];

  for (let i = 0; i < daysPerWeek; i++) {
    const index = Math.floor(i * interval);
    days.push(allDays[index]);
  }

  return days;
}

/**
 * 为训练日分配动作
 */
function assignExercisesToDay(
  day: TrainingDay,
  config: PlanGenerationConfig
): TrainingDay {
  const { experienceLevel, equipment, sessionDuration } = config;
  const goal = Array.isArray(config.goal) ? config.goal[0] : config.goal;
  const goalConfig = PLAN_GOAL_CONFIG[goal];
  const dayConfig = TRAINING_DAY_TYPE_CONFIG[day.type];

  // 根据训练时长和经验水平决定动作数量
  const exerciseCount = determineExerciseCount(
    sessionDuration,
    experienceLevel
  );

  // 筛选适合的动作
  let exercises = filterExercises({
    equipment: getEquipmentTypes(equipment),
    difficulty: getDifficultyLevels(experienceLevel),
  }).filter((ex) => {
    // 排除用户指定的动作
    if (config.excludeExercises?.includes(ex.id)) return false;

    // 匹配训练日类型的分类
    if (dayConfig.categories.length > 0) {
      return ex.category && dayConfig.categories.includes(ex.category);
    }

    return true;
  });

  // 如果是全身训练，确保覆盖主要部位
  if (day.type === "full_body") {
    exercises = selectFullBodyExercises(exercises, exerciseCount, config);
  } else {
    // 其他类型，随机选择
    exercises = exercises
      .sort(() => Math.random() - 0.5)
      .slice(0, exerciseCount);
  }

  // 转换为 ExerciseSet
  const exerciseSets: ExerciseSet[] = exercises.map((ex, index) => {
    const sets = generateSets(ex, index, goalConfig, experienceLevel);
    return {
      exerciseId: ex.id,
      exercise: ex,
      sets: sets.sets,
      reps: sets.reps,
      restSeconds: sets.rest,
      intensity: goalConfig.preferredIntensity[0],
      notes: generateExerciseNotes(ex, goal),
    };
  });

  // 计算预计时长
  const totalDuration = calculateDuration(exerciseSets);

  return {
    ...day,
    exercises: exerciseSets,
    totalDuration,
  };
}

/**
 * 选择全身训练动作，确保覆盖主要部位
 */
function selectFullBodyExercises(
  exercises: Exercise[],
  count: number,
  _config: PlanGenerationConfig
): Exercise[] {
  const categories = ["legs", "chest", "back", "shoulders", "core"];
  const selected: Exercise[] = [];

  // 每个部位至少选一个动作
  categories.forEach((category) => {
    const categoryExercises = exercises.filter(
      (ex) => ex.category === category
    );
    if (categoryExercises.length > 0) {
      const randomEx =
        categoryExercises[Math.floor(Math.random() * categoryExercises.length)];
      selected.push(randomEx);
    }
  });

  // 如果还需要更多动作，随机添加
  const remaining = count - selected.length;
  if (remaining > 0) {
    const availableExercises = exercises.filter((ex) => !selected.includes(ex));
    const additionalExercises = availableExercises
      .sort(() => Math.random() - 0.5)
      .slice(0, remaining);
    selected.push(...additionalExercises);
  }

  return selected.slice(0, count);
}

/**
 * 确定动作数量
 */
function determineExerciseCount(duration: number, level: string): number {
  // 假设每个动作平均 10 分钟（包括组间休息）
  const baseCount = Math.floor(duration / 10);

  // 根据经验水平调整
  if (level === "none" || level === "beginner") {
    return Math.max(4, Math.min(baseCount, 6));
  } else if (level === "intermediate") {
    return Math.max(5, Math.min(baseCount, 8));
  } else {
    return Math.max(6, Math.min(baseCount, 10));
  }
}

/**
 * 生成动作的组数和次数
 */
function generateSets(
  exercise: Exercise,
  order: number,
  goalConfig: (typeof PLAN_GOAL_CONFIG)[PlanGoal],
  level: string
): { sets: number; reps: string; rest: number } {
  const [minSets, maxSets] = goalConfig.setsRange;
  const [minReps, maxReps] = goalConfig.repsRange;
  const [minRest, maxRest] = goalConfig.restSeconds;

  // 第一个动作（主动作）通常做更多组
  let sets =
    order === 0
      ? maxSets
      : minSets + Math.floor(Math.random() * (maxSets - minSets));

  // 根据经验水平调整
  if (level === "none" || level === "beginner") {
    sets = Math.max(2, sets - 1);
  }

  // 根据动作难度调整
  if (exercise.difficulty === "advanced") {
    sets = Math.max(2, sets - 1);
  }

  // 生成次数范围
  const reps = `${minReps}-${maxReps}`;

  // 生成休息时间
  const rest = minRest + Math.floor((maxRest - minRest) / 2);

  return { sets, reps, rest };
}

/**
 * 计算训练时长
 */
function calculateDuration(exercises: ExerciseSet[]): number {
  let total = 0;

  exercises.forEach((ex) => {
    // 假设每组平均 30 秒
    const setTime = 30;
    // 总时间 = (组数 * 单组时间) + ((组数-1) * 组间休息)
    total += ex.sets * setTime + (ex.sets - 1) * ex.restSeconds;
  });

  // 加上热身和整理时间（10分钟）
  total += 600;

  // 转换为分钟
  return Math.ceil(total / 60);
}

/**
 * 获取器械类型数组
 */
function getEquipmentTypes(equipment: string): ExerciseEquipment[] {
  const map: Record<string, ExerciseEquipment[]> = {
    none: ["bodyweight"],
    home: ["bodyweight", "dumbbell", "kettlebell", "other"],
    gym: [
      "barbell",
      "dumbbell",
      "kettlebell",
      "cable",
      "machine",
      "bodyweight",
      "other",
    ],
  };
  return map[equipment] || map["gym"];
}

/**
 * 获取难度等级数组
 */
function getDifficultyLevels(level: string): ExerciseDifficulty[] {
  const map: Record<string, ExerciseDifficulty[]> = {
    none: ["beginner"],
    beginner: ["beginner", "intermediate"],
    intermediate: ["beginner", "intermediate", "advanced"],
    advanced: ["intermediate", "advanced"],
  };
  return map[level] || map["beginner"];
}

/**
 * 生成热身建议
 */
function generateWarmupSuggestions(type: TrainingDayType): string[] {
  const common = ["5-10分钟轻度有氧", "动态拉伸"];

  const specific: Record<TrainingDayType, string[]> = {
    push: ["肩部环绕", "墙面俯卧撑"],
    pull: ["肩胛骨激活", "弹力带拉伸"],
    legs: ["深蹲激活", "腿部摆动"],
    upper: ["上肢环绕", "轻重量激活"],
    lower: ["髋关节激活", "深蹲练习"],
    full_body: ["全身动态拉伸", "轻跳跃"],
    chest_triceps: ["肩部环绕", "俯卧撑准备"],
    back_biceps: ["肩胛激活", "吊环悬挂"],
    shoulders_abs: ["肩部环绕", "核心激活"],
    legs_glutes: ["髋关节激活", "臀部激活"],
    cardio: ["慢跑5分钟", "关节活动"],
    rest: [],
  };

  return [...common, ...(specific[type] || [])];
}

/**
 * 生成放松建议
 */
function generateCooldownSuggestions(_type: TrainingDayType): string[] {
  return ["5分钟轻度有氧", "目标肌群静态拉伸", "泡沫轴放松", "深呼吸放松"];
}

/**
 * 生成动作备注
 */
function generateExerciseNotes(exercise: Exercise, goal: PlanGoal): string {
  const notes: string[] = [];

  if (exercise.difficulty === "advanced") {
    notes.push("高难度动作，注意动作规范");
  }

  if (goal === "muscle_gain" && exercise.category === "legs") {
    notes.push("腿部动作，注意深蹲深度");
  }

  if (goal === "fat_loss") {
    notes.push("控制组间休息时间");
  }

  return notes.join("；");
}

/**
 * 生成计划名称
 */
function generatePlanName(
  config: PlanGenerationConfig,
  split: TrainingSplit
): string {
  const goal = Array.isArray(config.goal) ? config.goal[0] : config.goal;
  const goalLabel = PLAN_GOAL_CONFIG[goal].label;
  const splitLabel = TRAINING_SPLIT_CONFIG[split].label;
  const daysPerWeek = config.daysPerWeek;

  return `${goalLabel} - ${splitLabel} (${daysPerWeek}天/周)`;
}

/**
 * 生成计划描述
 */
function generatePlanDescription(
  config: PlanGenerationConfig,
  split: TrainingSplit
): string {
  const goal = Array.isArray(config.goal) ? config.goal[0] : config.goal;
  const goalConfig = PLAN_GOAL_CONFIG[goal];
  const splitConfig = TRAINING_SPLIT_CONFIG[split];

  return `
    目标：${goalConfig.description}
    分化方式：${splitConfig.description}
    每周训练：${config.daysPerWeek}天
    单次时长：约${config.sessionDuration}分钟
    经验水平：${config.experienceLevel}
  `.trim();
}

/**
 * 确定计划周期（周数）
 */
function determineWeeks(config: PlanGenerationConfig): number {
  const goal = Array.isArray(config.goal) ? config.goal[0] : config.goal;

  // 根据目标确定周期
  const weeksByGoal: Record<PlanGoal, number> = {
    muscle_gain: 8,
    fat_loss: 12,
    fitness: 6,
    strength: 8,
    rehab: 4,
    general: 6,
  };

  return weeksByGoal[goal] || 6;
}

/**
 * 生成标签
 */
function generateTags(config: PlanGenerationConfig): string[] {
  const tags: string[] = [];

  const goals = Array.isArray(config.goal) ? config.goal : [config.goal];
  goals.forEach((g) => tags.push(PLAN_GOAL_CONFIG[g].label));

  tags.push(`${config.daysPerWeek}天`);
  tags.push(config.experienceLevel);
  tags.push(
    config.equipment === "none"
      ? "自重"
      : config.equipment === "home"
        ? "家庭"
        : "健身房"
  );

  return tags;
}
