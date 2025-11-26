# Phase 2 - Task 4: 训练计划生成逻辑 - 完成报告

## 📅 完成时间
2025-11-11

## ✅ 已完成任务

### 1. 类型定义
**文件**: `src/types/plan.ts`

**核心类型**:
- `TrainingPlan`: 训练计划主结构
- `TrainingDay`: 训练日计划
- `ExerciseSet`: 训练动作组
- `PlanGenerationConfig`: 计划生成配置
- `TrainingSplit`: 训练分化类型（5种）
- `TrainingDayType`: 训练日类型（12种）
- `PlanGoal`: 训练目标（6种）
- `TrainingIntensity`: 训练强度（4级）

**配置常量**:
- `TRAINING_SPLIT_CONFIG`: 分化方式配置
  - 全身训练 (2-4天)
  - 上下肢分化 (4-6天)
  - 推拉腿分化 (3-6天)
  - 部位分化 (4-6天)
  - 自定义

- `PLAN_GOAL_CONFIG`: 目标配置
  - 增肌：3-5组×8-12次，60-90秒休息
  - 减脂：3-4组×12-20次，30-60秒休息
  - 体能：2-4组×12-20次，30-60秒休息
  - 力量：4-6组×3-6次，120-180秒休息
  - 康复：2-3组×10-15次，60-90秒休息
  - 综合：3-4组×8-15次，60-90秒休息

- `TRAINING_DAY_TYPE_CONFIG`: 训练日类型配置

### 2. 计划生成引擎
**文件**: `src/utils/planGenerator.ts`

**核心算法**:

#### 2.1 智能分化选择
```typescript
function determineSplit(config: PlanGenerationConfig): TrainingSplit
```
- 根据每周训练天数自动选择最佳分化方式
- 考虑用户经验水平
- 支持用户自定义偏好

**规则**:
- ≤3天/周 → 全身训练
- 4天/周 → 上下肢分化
- 5-6天/周（初中级）→ 上下肢或推拉腿
- 5-6天/周（高级）→ 部位分化

#### 2.2 训练日均匀分布
```typescript
function distributeTrainingDays(daysPerWeek: number): number[]
```
- 在一周内均匀分配训练日
- 避免连续多天训练同一部位
- 确保充分恢复

#### 2.3 动作智能选择
```typescript
function assignExercisesToDay(day, config): TrainingDay
```
- 根据训练日类型筛选动作
- 考虑器械条件和经验水平
- 全身训练确保覆盖主要部位
- 排除用户指定的动作
- 优先选择复合动作

#### 2.4 组数次数计算
```typescript
function generateSets(exercise, order, goalConfig, level)
```
- 根据训练目标生成组数/次数
- 主动作（第一个）做更多组
- 高级动作适当减少组数
- 考虑经验水平调整

#### 2.5 时长预估
```typescript
function calculateDuration(exercises: ExerciseSet[]): number
```
- 每组约30秒 + 组间休息
- 加上热身和整理（10分钟）
- 返回预计总时长

### 3. 数据持久化
**文件**: `src/db/repositories/planRepository.ts`

**核心功能**:
- `getAllPlans()`: 获取用户所有计划
- `getActivePlan()`: 获取当前活跃计划
- `addPlan()`: 添加新计划
- `updatePlan()`: 更新计划
- `deletePlan()`: 删除计划
- `setActivePlan()`: 设置活跃计划
- `completePlan()`: 完成计划
- `getPlanStats()`: 获取计划统计
- `duplicatePlan()`: 复制计划

### 4. 状态管理
**文件**: `src/stores/plan.ts`

**State**:
- `plans`: 所有计划列表
- `activePlan`: 当前活跃计划
- `loading`: 加载状态

**Getters**:
- `hasActivePlan`: 是否有活跃计划
- `completedPlans`: 已完成计划
- `activePlans`: 进行中的计划
- `archivedPlans`: 归档计划

**Actions**:
- `loadPlans()`: 加载计划
- `createPlan()`: 创建计划
- `updatePlan()`: 更新计划
- `deletePlan()`: 删除计划
- `setActivePlan()`: 设置活跃
- `completePlan()`: 完成计划
- `duplicatePlan()`: 复制计划
- `getPlanStats()`: 获取统计
- `getTodayTrainingDay()`: 获取今日训练
- `getWeekTrainingDays()`: 获取本周训练

## 🎯 功能特性

### 1. 智能计划生成
✅ **基于用户档案**:
- 训练目标（增肌/减脂/体能等）
- 经验水平（无/初/中/高级）
- 器械条件（自重/家庭/健身房）
- 每周训练天数（3-6天）
- 单次训练时长（30-120分钟）

✅ **个性化调整**:
- 伤病史排除特定动作
- 重点训练部位优先安排
- 偏好设置（高容量/复合/孤立）

### 2. 科学训练原则
✅ **周期化设计**:
- 根据目标确定计划周期（4-12周）
- 训练强度梯度设置
- 渐进式负荷增加

✅ **分化合理**:
- 全身训练：适合新手，2-4天/周
- 上下肢：适合中级，4-6天/周
- 推拉腿：适合中高级，3-6天/周
- 部位分化：适合高级，4-6天/周

✅ **动作选择**:
- 复合动作为主，孤立为辅
- 难度适配经验水平
- 器械条件匹配

### 3. 完整的数据结构
✅ **计划层级**:
```
TrainingPlan (训练计划)
  ├── TrainingDay (训练日) × N
  │   ├── ExerciseSet (动作组) × M
  │   │   ├── Exercise (动作详情)
  │   │   ├── Sets (组数)
  │   │   ├── Reps (次数)
  │   │   └── Rest (休息)
  │   ├── Warmup (热身)
  │   └── Cooldown (放松)
  └── Stats (统计)
```

## 💡 使用示例

### 1. 生成增肌计划（中级用户）
```typescript
import { usePlanStore } from '@/stores/plan'
import type { PlanGenerationConfig } from '@/types/plan'

const planStore = usePlanStore()

const config: PlanGenerationConfig = {
  userId: 'user123',
  goal: 'muscle_gain',
  daysPerWeek: 5,
  sessionDuration: 75,
  experienceLevel: 'intermediate',
  equipment: 'gym'
}

const plan = await planStore.createPlan(config)
console.log(`生成计划: ${plan.name}`)
```

### 2. 生成减脂计划（初级用户，家庭训练）
```typescript
const config: PlanGenerationConfig = {
  userId: 'user456',
  goal: 'fat_loss',
  daysPerWeek: 4,
  sessionDuration: 45,
  experienceLevel: 'beginner',
  equipment: 'home',
  preferences: {
    cardio: true,
    highVolume: true
  }
}

const plan = await planStore.createPlan(config)
```

### 3. 设置活跃计划
```typescript
await planStore.setActivePlan('plan-id-123')
```

### 4. 获取今日训练
```typescript
const todayWorkout = planStore.getTodayTrainingDay()
if (todayWorkout) {
  console.log(`今日${todayWorkout.name}`)
  console.log(`${todayWorkout.exercises.length}个动作`)
}
```

## 📊 生成示例

### 示例 1: 全身训练（3天/周）
```
目标：综合发展
分化：全身训练
周期：6周

周一、三、五:
1. 深蹲 3×8-12 休息60s
2. 卧推 3×8-12 休息60s
3. 杠铃划船 3×8-12 休息60s
4. 推举 3×8-12 休息60s
5. 平板支撑 3×30-60s 休息60s
```

### 示例 2: 推拉腿（6天/周）
```
目标：增肌
分化：推拉腿
周期：8周

周一、四 - 推日:
1. 卧推 4×8-10
2. 上斜卧推 3×10-12
3. 哑铃飞鸟 3×12-15
4. 推举 4×8-10
5. 侧平举 3×12-15
6. 三头下压 3×12-15

周二、五 - 拉日:
1. 硬拉 4×6-8
2. 引体向上 4×max
3. 杠铃划船 3×8-10
4. 高位下拉 3×10-12
5. 反向飞鸟 3×12-15
6. 杠铃弯举 3×10-12

周三、六 - 腿日:
1. 深蹲 4×8-10
2. 罗马尼亚硬拉 3×10-12
3. 腿举 3×12-15
4. 腿弯举 3×12-15
5. 提踵 4×15-20
```

## 🔄 算法流程

```
用户配置输入
    ↓
1. 确定训练分化
    ├─ 分析训练天数
    ├─ 考虑经验水平
    └─ 选择最佳分化
    ↓
2. 生成训练日安排
    ├─ 根据分化类型
    ├─ 均匀分布周内
    └─ 设置日类型
    ↓
3. 为每日分配动作
    ├─ 筛选适合动作
    ├─ 确保部位覆盖
    ├─ 计算动作数量
    └─ 排除禁忌动作
    ↓
4. 生成组数次数
    ├─ 根据目标配置
    ├─ 考虑动作顺序
    ├─ 调整难度级别
    └─ 设置休息时间
    ↓
5. 添加辅助信息
    ├─ 热身建议
    ├─ 放松建议
    ├─ 动作备注
    └─ 时长预估
    ↓
生成完整计划
```

## 🎓 设计亮点

### 1. 规则引擎架构
- 清晰的决策树
- 可扩展的规则系统
- 便于调试和优化

### 2. 科学训练理论
- 基于 SAID 原则（特异性适应）
- 遵循渐进超负荷原则
- 考虑恢复和周期化

### 3. 灵活配置
- 多种分化方式可选
- 丰富的个性化选项
- 支持用户偏好

### 4. 类型安全
- 完整的 TypeScript 定义
- 编译时错误检查
- IDE 自动补全

## 🐛 注意事项

### 1. 当前限制
- ⚠️ 暂不支持周期内的渐进调整（后续可加入 RPE/RM 自动调整）
- ⚠️ 未集成 AI 生成（Phase 3 接入 LLM API）
- ⚠️ 动作替换逻辑待完善

### 2. 优化方向
- 📈 添加自动渐进系统
- 🤖 接入 AI 优化建议
- 📊 基于历史数据调整
- 💪 动作难度自适应

## 📝 下一步计划

### Phase 2 - Task 5: 训练计划展示与编辑界面
- 计划浏览页面
- 计划详情展示
- 在线编辑功能
- 计划比较工具

### Phase 3: AI 集成
- 接入大模型 API
- AI 计划生成优化
- 智能调整建议
- 对话式计划定制

## 🎉 总结

训练计划生成逻辑已完成，包括：
- ✅ 完整的类型定义系统
- ✅ 智能计划生成引擎
- ✅ 多种训练分化支持
- ✅ 科学的组数次数配置
- ✅ 数据持久化层
- ✅ Pinia 状态管理
- ✅ 丰富的个性化选项

为用户提供科学、个性化的训练计划！

**下一步**: Phase 2 - Task 5: 开发训练计划展示与编辑界面

