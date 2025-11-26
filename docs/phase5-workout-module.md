# Phase 5: 训练记录模块（Workout Module）

**时间估算**: 2 周  
**优先级**: P0（必须完成）  
**前置条件**: Phase 2 已完成（用户系统与训练计划）

---

## 目标概述

实现完整的训练执行与记录功能。完成后，用户可以：
- 开始训练并记录每次训练
- 逐动作执行并记录每组数据（重量、次数、RPE）
- 使用组间休息计时器
- 查看历史训练数据作为参考
- 记录训练反馈（疲劳度、睡眠质量等）
- 保存训练日志到数据库

---

## 任务清单

### 5.1 数据库仓库层（Workout Repository）

- [x] 创建 `src/db/repositories/workoutRepository.ts`
- [x] 实现 CRUD 操作（创建、读取、更新、删除训练记录）
- [x] 实现按日期范围查询
- [x] 实现按计划ID查询
- [x] 实现按动作ID查询历史记录
- [x] 实现统计功能（总训练量、PR记录等）

### 5.2 完善 Workout Store

- [x] 集成 workoutRepository 实现数据持久化
- [x] 添加加载历史训练记录功能
- [x] 添加获取动作历史数据功能
- [x] 添加计算训练统计功能
- [x] 添加PR检测功能

### 5.3 训练执行界面（WorkoutView）

- [x] 实现训练选择界面（今日计划/选择训练日）
- [x] 实现训练进度显示（进度条、完成度）
- [x] 实现动作列表展示（可展开/折叠）
- [x] 实现动作详情展示（要点、视频链接等）
- [x] 实现训练完成/取消功能

### 5.4 动作记录组件

- [x] 创建 `ExerciseCard.vue` 组件
- [x] 实现动作信息展示（名称、组数×次数、强度）
- [x] 实现组记录输入（重量、次数、RPE）
- [x] 实现快捷操作（按计划完成、复制上组、查看历史）
- [x] 实现动作完成标记

### 5.5 组间休息计时器

- [x] 创建 `RestTimer.vue` 组件
- [x] 实现倒计时功能
- [x] 实现暂停/继续/跳过功能
- [ ] 实现声音提醒（可选）
- [x] 实现自动开始下一组

### 5.6 训练反馈表单

- [x] 创建 `WorkoutFeedback.vue` 组件
- [x] 实现整体疲劳度评分（1-5星）
- [x] 实现睡眠质量评分（1-5星）
- [x] 实现饮食状态选择
- [x] 实现自由备注输入
- [x] 实现动作级反馈（RPE、质量、异常标记）

### 5.7 历史数据参考

- [x] 实现获取动作历史记录功能
- [x] 实现显示上次训练数据
- [x] 实现显示最佳记录（PR）
- [ ] 实现显示趋势图表（可选）

### 5.8 训练统计与完成

- [x] 实现训练总时长计算
- [x] 实现总训练量计算（Tonnage）
- [x] 实现完成度计算
- [x] 实现训练总结展示
- [x] 实现保存到数据库

---

## 详细设计

### 5.1 数据库仓库层

**文件**: `src/db/repositories/workoutRepository.ts`

**接口设计**:
```typescript
interface WorkoutRepository {
  // 基础CRUD
  addWorkout(workout: WorkoutLog): Promise<string>
  getWorkoutById(id: string): Promise<WorkoutLog | undefined>
  updateWorkout(id: string, updates: Partial<WorkoutLog>): Promise<void>
  deleteWorkout(id: string): Promise<void>
  
  // 查询
  getWorkoutsByUserId(userId: string): Promise<WorkoutLog[]>
  getWorkoutsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<WorkoutLog[]>
  getWorkoutsByPlanId(planId: string): Promise<WorkoutLog[]>
  getWorkoutsBySessionId(sessionId: string): Promise<WorkoutLog[]>
  
  // 动作历史
  getExerciseHistory(userId: string, exerciseId: string, limit?: number): Promise<LoggedExercise[]>
  getExercisePR(userId: string, exerciseId: string): Promise<{ weight: number; reps: number; date: Date } | null>
  
  // 统计
  getWorkoutStats(userId: string, startDate?: Date, endDate?: Date): Promise<WorkoutStats>
}
```

### 5.2 Workout Store 增强

**需要添加的功能**:
- `loadWorkoutHistory(userId: string)`: 加载历史训练记录
- `getExerciseHistoryData(exerciseId: string)`: 获取动作历史数据
- `calculateWorkoutStats(workout: WorkoutLog)`: 计算训练统计
- `detectPRs(workout: WorkoutLog)`: 检测PR记录
- `saveWorkoutToDB(workout: WorkoutLog)`: 保存到数据库

### 5.3 训练执行界面布局

```
┌─────────────────────────────────────┐
│  训练信息栏                          │
│  [训练名称] [开始时间] [进度: 2/5]   │
├─────────────────────────────────────┤
│  动作列表（可滚动）                  │
│  ┌───────────────────────────────┐ │
│  │ 动作1: 卧推                    │ │
│  │ 计划: 3×10 @ RPE 7-8          │ │
│  │ [展开详情] [查看历史]          │ │
│  │                               │ │
│  │ 组1: [重量] [次数] [RPE] [✓]  │ │
│  │ 组2: [重量] [次数] [RPE] [✓]  │ │
│  │ 组3: [重量] [次数] [RPE] [ ]  │ │
│  │                               │ │
│  │ [按计划完成] [复制上组]        │ │
│  │ [完成动作]                     │ │
│  └───────────────────────────────┘ │
│  ...                                │
├─────────────────────────────────────┤
│  组间休息计时器                      │
│  [60s] [暂停] [跳过]                │
├─────────────────────────────────────┤
│  [完成训练] [取消训练]               │
└─────────────────────────────────────┘
```

### 5.4 动作记录组件设计

**ExerciseCard.vue 功能**:
- 显示动作名称（中英文）
- 显示计划信息（组数×次数、强度、休息时间）
- 显示动作详情（可展开，包含要点、视频链接）
- 组记录输入表单
- 快捷操作按钮
- 历史数据参考（上次训练、PR）

### 5.5 组间休息计时器设计

**RestTimer.vue 功能**:
- 倒计时显示（大字体，醒目）
- 进度环/进度条
- 暂停/继续按钮
- 跳过按钮
- 完成提示（声音/震动）
- 自动开始下一组选项

### 5.6 训练反馈表单设计

**WorkoutFeedback.vue 字段**:
- 整体疲劳度：1-5星评分
- 睡眠质量（前一晚）：1-5星评分
- 饮食状态：好/一般/不足
- 自由备注：多行文本
- 动作级反馈（每个动作）：
  - 整体RPE：1-10
  - 完成质量：完美/良好/勉强
  - 异常标记：疼痛/不适/提前力竭
  - 备注

---

## 实现步骤

### Step 1: 数据库仓库层
1. 创建 `workoutRepository.ts`
2. 实现所有CRUD和查询方法
3. 添加单元测试（可选）

### Step 2: Store 增强
1. 更新 `workout.ts` store
2. 集成 repository
3. 添加新功能方法

### Step 3: 核心组件开发
1. 创建 `ExerciseCard.vue`
2. 创建 `RestTimer.vue`
3. 创建 `WorkoutFeedback.vue`

### Step 4: 主界面开发
1. 实现 `WorkoutView.vue`
2. 集成所有组件
3. 实现交互逻辑

### Step 5: 历史数据功能
1. 实现历史数据查询
2. 实现PR检测
3. 实现数据展示

### Step 6: 测试与优化
1. 功能测试
2. UI/UX优化
3. 性能优化

---

## 验收标准

- [ ] 用户可以开始训练并记录完整数据
- [ ] 组记录功能正常，支持快捷操作
- [ ] 计时器功能正常，支持暂停/跳过
- [ ] 历史数据可以正确查询和展示
- [ ] 训练记录可以保存到数据库
- [ ] PR检测功能正常
- [ ] 训练统计计算准确
- [ ] UI响应流畅，交互友好

---

## 注意事项

1. **数据持久化**: 确保训练记录实时保存，防止数据丢失
2. **性能优化**: 大量历史数据查询时注意性能
3. **用户体验**: 训练过程中尽量减少操作步骤
4. **错误处理**: 网络异常、数据保存失败等情况需要友好提示
5. **离线支持**: 训练记录功能应支持离线使用

---

## 后续优化方向

- [ ] 支持训练模板（快速开始常用训练）
- [ ] 支持训练分享（导出训练记录）
- [ ] 支持训练照片记录
- [ ] 支持语音输入（记录重量/次数）
- [ ] 支持智能建议（基于历史数据推荐重量）

