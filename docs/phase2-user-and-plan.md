# Phase 2: 用户系统与训练计划

**时间估算**: 2 周  
**优先级**: P0（必须完成）  
**前置条件**: Phase 1 已完成

---

## 目标概述

实现用户档案管理、体测数据记录、动作库以及训练计划生成与管理系统。完成后，用户可以：
- 完整填写和编辑个人档案
- 记录和追踪体测数据
- 查看丰富的动作库
- 生成个性化训练计划
- 查看和编辑训练计划

---

## 任务清单

### 2.1 用户档案表单与存储逻辑

#### 2.1.1 完善 ProfileView 页面

**功能需求：**
- 显示用户基础信息
- 可编辑用户档案
- 保存到 IndexedDB
- 同步到 userStore

**实现文件：**
- `src/views/ProfileView.vue` - 完整实现
- `src/db/repositories/userRepository.ts` - 用户数据操作层

**页面布局：**
```
┌─────────────────────────────────┐
│  基础信息卡片                    │
│  - 昵称、性别、年龄               │
│  - 身高、体重                     │
│  - 运动经验、目标                 │
│  [编辑按钮]                       │
├─────────────────────────────────┤
│  训练偏好卡片                    │
│  - 器械条件                       │
│  - 训练场所                       │
│  - 每周训练天数                   │
│  - 教练性格                       │
│  [编辑按钮]                       │
├─────────────────────────────────┤
│  伤病史卡片                      │
│  - 伤病记录列表                   │
│  - 注意事项                       │
│  [添加/编辑按钮]                  │
└─────────────────────────────────┘
```

#### 2.1.2 创建用户数据仓库

**功能：**
- 封装 IndexedDB 操作
- CRUD 操作（创建、读取、更新、删除）
- 数据验证

**接口设计：**
```typescript
interface UserRepository {
  create(profile: UserProfile): Promise<string>
  getById(id: string): Promise<UserProfile | undefined>
  update(id: string, profile: Partial<UserProfile>): Promise<void>
  delete(id: string): Promise<void>
  getCurrentUser(): Promise<UserProfile | undefined>
}
```

#### 2.1.3 表单验证

使用 Zod 进行数据校验：
- 昵称：必填，2-20字符
- 身高：100-250 cm
- 体重：30-200 kg
- 出生年份：1950-2010
- 训练目标：至少选择1个

---

### 2.2 体测数据记录与可视化

#### 2.2.1 体测数据录入

**功能需求：**
- 快速记录体重/体脂
- 记录详细体围数据
- 添加备注
- 关联体态照片

**表单字段：**
```typescript
interface BodyMetricForm {
  date: Date
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
  imageIds?: string[]
}
```

#### 2.2.2 数据可视化

**图表类型：**
1. **体重趋势图**（折线图）
   - X轴：日期
   - Y轴：体重（kg）
   - 显示最近30/90/180天数据

2. **体脂趋势图**（折线图）
   - X轴：日期
   - Y轴：体脂率（%）

3. **体围对比图**（雷达图）
   - 对比两个时间点的体围数据
   - 8个维度（胸/腰/臀/颈/上臂/前臂/大腿/小腿）

#### 2.2.3 数据统计

**计算指标：**
- 当前体重/体脂
- 与初始值对比（增/减）
- 最近7天/30天变化
- 平均每周变化
- BMI 计算
- 目标完成度（如设置目标体重）

**实现文件：**
- `src/views/ProfileView.vue` - 体测数据部分
- `src/components/BodyMetricsChart.vue` - 图表组件
- `src/components/BodyMetricsForm.vue` - 录入表单
- `src/db/repositories/bodyMetricsRepository.ts`

---

### 2.3 动作库数据准备

#### 2.3.1 动作数据结构

每个动作包含：
```typescript
interface Exercise {
  id: string
  nameZh: string
  nameEn: string
  category: 'strength' | 'cardio' | 'flexibility' | 'balance'
  primaryMuscles: MuscleGroup[]
  secondaryMuscles?: MuscleGroup[]
  equipment: string[] // ['barbell', 'dumbbell', 'bodyweight', etc.]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  description: string
  keyPoints: string[] // 3-5条要点
  commonMistakes: string[] // 常见错误
  videoUrl?: string // 外部视频链接
  imageUrl?: string // 动作示意图
  alternatives?: string[] // 替代动作IDs
}
```

#### 2.3.2 动作分类

**按肌群分类：**
- 胸部：卧推、飞鸟、俯卧撑等（10-15个）
- 背部：划船、引体向上、硬拉等（10-15个）
- 肩部：推举、侧平举等（8-12个）
- 手臂：二头弯举、三头屈伸等（8-10个）
- 腿部：深蹲、弓步蹲、腿举等（10-15个）
- 核心：卷腹、平板支撑等（8-10个）
- 有氧：跑步、跳绳等（5-8个）

**按器械分类：**
- 杠铃动作：20-30个
- 哑铃动作：20-30个
- 固定器械：15-20个
- 自重动作：15-20个
- 弹力带：10-15个

**总计：100-120个常见动作**

#### 2.3.3 数据准备方式

创建 `src/data/exercises.json`：
```json
[
  {
    "id": "ex001",
    "nameZh": "杠铃卧推",
    "nameEn": "Barbell Bench Press",
    "category": "strength",
    "primaryMuscles": ["chest"],
    "secondaryMuscles": ["triceps", "shoulders"],
    "equipment": ["barbell", "bench"],
    "difficulty": "beginner",
    "description": "经典的胸部训练动作，主要刺激胸大肌，同时锻炼三头肌和前束三角肌",
    "keyPoints": [
      "躺在平板卧推凳上，双脚平放地面",
      "握距略宽于肩宽，手腕保持中立",
      "下放时肘关节约45度角",
      "杠铃轻触胸部中下方",
      "发力推起至手臂伸直但不锁死"
    ],
    "commonMistakes": [
      "肘关节过度外展（90度）增加肩部压力",
      "臀部离开凳面",
      "下放过快失去控制",
      "憋气不呼吸"
    ],
    "alternatives": ["ex002", "ex003"]
  }
]
```

#### 2.3.4 数据初始化

创建初始化脚本：
```typescript
// src/utils/initExercises.ts
export async function initializeExercises() {
  const existingCount = await db.exercises.count()
  if (existingCount > 0) {
    console.log('Exercises already initialized')
    return
  }
  
  const exercisesData = await import('@/data/exercises.json')
  await db.exercises.bulkAdd(exercisesData.default)
  console.log(`Initialized ${exercisesData.default.length} exercises`)
}
```

在 `main.ts` 中调用：
```typescript
initializeExercises().catch(console.error)
```

---

### 2.4 训练计划生成逻辑

#### 2.4.1 计划生成器设计

**输入参数：**
```typescript
interface PlanGeneratorInput {
  userProfile: UserProfile
  weeks: number // 4/6/8/12周
  frequency: number // 每周训练天数 2-6
  duration: number // 单次时长（分钟）
  split?: 'full_body' | 'upper_lower' | 'ppl' | 'bro_split' | 'auto'
}
```

**生成流程：**
```
1. 分析用户信息
   ├─ 运动经验 → 决定动作难度
   ├─ 训练目标 → 决定次数范围/强度
   ├─ 器械条件 → 筛选可用动作
   └─ 伤病史 → 排除禁忌动作

2. 确定分化方式
   ├─ 经验：无/初级 → 全身训练
   ├─ 经验：中级 + 频次3-4 → 上下肢或推拉腿
   └─ 经验：高级 + 频次5-6 → 五分化

3. 选择动作
   ├─ 每次训练6-10个动作
   ├─ 优先复合动作（深蹲、卧推、硬拉、引体等）
   ├─ 搭配孤立动作
   └─ 考虑动作多样性（杠铃、哑铃、自重）

4. 分配容量
   ├─ 增肌：3-4组 × 8-12次
   ├─ 力量：4-5组 × 3-6次
   ├─ 耐力：2-3组 × 15-20次
   └─ 根据经验调整总组数

5. 设置强度
   ├─ 新手：RPE 6-7
   ├─ 中级：RPE 7-8
   └─ 高级：RPE 8-9

6. 周期化设计
   ├─ 每4周调整动作/强度
   ├─ 渐进超负荷（重量/次数/组数）
   └─ 适时安排减量周
```

#### 2.4.2 规则引擎实现

**核心类：**
```typescript
class TrainingPlanGenerator {
  private userProfile: UserProfile
  private exercises: Exercise[]
  
  constructor(userProfile: UserProfile, exercises: Exercise[]) {
    this.userProfile = userProfile
    this.exercises = exercises
  }
  
  async generate(input: PlanGeneratorInput): Promise<TrainingPlan> {
    // 1. 确定分化方式
    const split = this.determineSplit(input)
    
    // 2. 生成会话列表
    const sessions = this.generateSessions(split, input)
    
    // 3. 为每个会话选择动作
    for (const session of sessions) {
      session.exercises = this.selectExercises(session, input)
    }
    
    // 4. 分配容量与强度
    this.assignVolumeAndIntensity(sessions, input)
    
    // 5. 生成计划对象
    return this.buildPlan(sessions, input)
  }
  
  private determineSplit(input: PlanGeneratorInput): Split {
    // 根据经验和频次决定分化
  }
  
  private generateSessions(split: Split, input: PlanGeneratorInput): Session[] {
    // 生成会话框架
  }
  
  private selectExercises(session: Session, input: PlanGeneratorInput): PlannedExercise[] {
    // 为会话选择动作
  }
  
  private assignVolumeAndIntensity(sessions: Session[], input: PlanGeneratorInput): void {
    // 分配组数、次数、强度
  }
  
  private buildPlan(sessions: Session[], input: PlanGeneratorInput): TrainingPlan {
    // 构建完整计划对象
  }
}
```

**实现文件：**
- `src/services/planGenerator.ts` - 计划生成器
- `src/services/exerciseSelector.ts` - 动作选择逻辑
- `src/utils/trainingRules.ts` - 训练规则

#### 2.4.3 示例：全身训练计划（新手）

**用户信息：**
- 经验：新手
- 目标：增肌
- 频次：每周3次
- 器械：健身房
- 单次时长：60分钟

**生成结果：**
```
第1-4周 - 适应期
━━━━━━━━━━━━━━━━━━━━━━━━
训练A（周一）：
1. 杠铃深蹲      3×10    RPE 6-7    90s休息
2. 杠铃卧推      3×10    RPE 6-7    90s休息
3. 坐姿划船      3×10    RPE 6-7    60s休息
4. 哑铃肩推      3×10    RPE 6-7    60s休息
5. 哑铃二头弯举  2×12    RPE 6-7    60s休息
6. 绳索三头下压  2×12    RPE 6-7    60s休息
7. 卷腹          3×15    RPE 6-7    45s休息

训练B（周三）：
1. 罗马尼亚硬拉  3×10    RPE 6-7    90s休息
2. 上斜哑铃卧推  3×10    RPE 6-7    90s休息
3. 高位下拉      3×10    RPE 6-7    60s休息
4. 侧平举        3×12    RPE 6-7    60s休息
5. 锤式弯举      2×12    RPE 6-7    60s休息
6. 双杠臂屈伸    2×8-10  RPE 6-7    60s休息
7. 平板支撑      3×30s   RPE 6-7    45s休息

训练C（周五）：
1. 腿举          3×12    RPE 6-7    90s休息
2. 哑铃卧推      3×10    RPE 6-7    90s休息
3. 单臂哑铃划船  3×10    RPE 6-7    60s休息
4. 哑铃推举      3×10    RPE 6-7    60s休息
5. 绳索弯举      2×12    RPE 6-7    60s休息
6. 窄距卧推      2×10    RPE 6-7    60s休息
7. 俄罗斯转体    3×20    RPE 6-7    45s休息
```

---

### 2.5 训练计划展示与编辑

#### 2.5.1 PlanView 页面设计

**布局：**
```
┌─────────────────────────────────┐
│  计划概览卡片                    │
│  - 计划名称、周期、分化方式       │
│  - 进度条（第X周/共Y周）          │
│  - [生成新计划] [编辑]            │
├─────────────────────────────────┤
│  周训练安排                      │
│  ┌─────┬─────┬─────┬─────┐      │
│  │ 一  │ 三  │ 五  │ 休息│      │
│  │训练A│训练B│训练C│     │      │
│  └─────┴─────┴─────┴─────┘      │
├─────────────────────────────────┤
│  详细训练列表                    │
│  ▼ 训练A - 全身训练              │
│    1. 杠铃深蹲  3×10  RPE 7-8    │
│       [查看详情] [替换]           │
│    2. 杠铃卧推  3×10  RPE 7-8    │
│    ...                           │
│  ▼ 训练B - 全身训练              │
│    ...                           │
└─────────────────────────────────┘
```

#### 2.5.2 动作详情抽屉

点击动作后，右侧弹出抽屉显示：
- 动作名称（中英文）
- 目标肌群（主要/次要）
- 文字描述
- 关键要点（列表）
- 常见错误（列表）
- 替代动作（可点击切换）
- 视频链接（如有）

#### 2.5.3 计划编辑功能

**可编辑项：**
- 修改动作（从动作库选择）
- 调整组数/次数
- 调整强度（RPE 或百分比）
- 调整休息时间
- 添加/删除动作
- 调整动作顺序（拖拽）
- 设置超级组/巨型组

**实现方式：**
```vue
<template>
  <draggable v-model="exercises" @end="onDragEnd">
    <div v-for="exercise in exercises" :key="exercise.id" class="exercise-item">
      <div class="exercise-name">{{ exercise.nameZh }}</div>
      <el-input-number v-model="exercise.sets" :min="1" :max="10" />
      <el-input-number v-model="exercise.reps" :min="1" :max="50" />
      <!-- ... -->
    </div>
  </draggable>
</template>
```

#### 2.5.4 计划生成向导

**步骤：**
1. 选择计划参数
   - 周期：4/6/8/12周
   - 频次：2/3/4/5/6 天/周
   - 时长：30/45/60/90 分钟
   - 分化：自动/全身/上下肢/推拉腿/五分化

2. 预览生成的计划
   - 显示完整计划结构
   - 可点击查看每个训练的详情

3. 确认并保存
   - 设置计划名称
   - 设置开始日期
   - 保存到数据库
   - 设为当前活动计划

**实现文件：**
- `src/views/PlanView.vue` - 计划展示
- `src/components/PlanGenerator.vue` - 生成向导
- `src/components/ExerciseDetailDrawer.vue` - 动作详情
- `src/components/ExerciseSelector.vue` - 动作选择器

---

## 数据流设计

### 用户档案流
```
ProfileView
  ↓ (编辑)
userRepository.update()
  ↓
IndexedDB (users表)
  ↓ (同步)
userStore.setProfile()
```

### 体测数据流
```
BodyMetricsForm
  ↓ (提交)
bodyMetricsRepository.create()
  ↓
IndexedDB (bodyMetrics表)
  ↓ (查询)
BodyMetricsChart (可视化)
```

### 计划生成流
```
PlanGenerator (向导)
  ↓ (参数)
TrainingPlanGenerator.generate()
  ↓ (查询动作库)
db.exercises.where()...
  ↓ (应用规则)
生成 TrainingPlan 对象
  ↓ (保存)
planRepository.create()
  ↓
IndexedDB (plans表)
  ↓ (同步)
planStore.setCurrentPlan()
```

---

## 验收标准

### 功能验收
- [ ] 用户可完整编辑个人档案
- [ ] 档案数据保存到数据库
- [ ] 可添加体测记录
- [ ] 体重/体脂趋势图正常显示
- [ ] 动作库数据加载成功（100+条）
- [ ] 可通过向导生成训练计划
- [ ] 生成的计划符合用户特征
- [ ] 计划详情正常展示
- [ ] 可编辑计划中的动作
- [ ] 可查看动作详细说明

### 数据验收
- [ ] 用户数据正确保存到 users 表
- [ ] 体测数据正确保存到 bodyMetrics 表
- [ ] 动作数据正确导入到 exercises 表
- [ ] 计划数据正确保存到 plans 表
- [ ] 数据关联关系正确

### UI/UX 验收
- [ ] 表单交互流畅
- [ ] 图表加载速度快（< 1s）
- [ ] 计划展示清晰易读
- [ ] 编辑操作反馈及时
- [ ] 移动端适配良好

---

## 开发顺序建议

**第1-2天：** 用户档案
- 完善 ProfileView
- 实现 userRepository
- 表单验证

**第3-4天：** 体测数据
- 体测表单
- 数据图表（集成 Chart.js）
- bodyMetricsRepository

**第5-7天：** 动作库
- 准备 exercises.json（100+动作）
- 数据初始化
- 动作详情组件

**第8-10天：** 计划生成
- 实现 TrainingPlanGenerator
- 规则引擎
- 计划生成向导

**第11-12天：** 计划展示与编辑
- PlanView 完整实现
- 动作编辑功能
- 计划保存与加载

**第13-14天：** 测试与优化
- 功能测试
- 性能优化
- Bug 修复

---

## 参考资料

- [Chart.js 官方文档](https://www.chartjs.org/)
- [Zod 官方文档](https://zod.dev/)
- [运动科学原理](https://www.nsca.com/)

---

## 下一步

Phase 2 完成后，继续 **Phase 3: AI 集成**。

📝 [查看 Phase 3 文档](./phase3-ai-integration.md)（待创建）
