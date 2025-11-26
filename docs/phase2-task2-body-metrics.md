# Phase 2 - Task 2: 体测数据记录与可视化展示

## 任务概述
实现体测数据（体重、体脂率、围度等）的记录、存储和可视化展示功能。

## 已完成的工作

### 1. 数据类型定义
**文件**: `src/types/bodyMetrics.ts`

定义了体测数据的核心类型：
- `MetricType`: 9种体测指标类型（体重、体脂率、肌肉量、胸围、腰围、臀围、臂围、腿围、小腿围）
- `BodyMetric`: 体测数据记录接口
- `MetricConfig`: 指标配置接口（包含标签、单位、图标、颜色、范围等）
- `METRIC_CONFIGS`: 所有指标的预设配置对象

### 2. 数据仓库层
**文件**: `src/db/repositories/bodyMetricsRepository.ts`

实现了 IndexedDB 数据操作的封装：
- `getAllMetrics(userId)`: 获取用户所有体测数据
- `getMetricsByType(userId, type)`: 获取特定类型的体测数据
- `getLatestMetric(userId, type)`: 获取最新的体测数据
- `getMetricsInRange(userId, type, startDate, endDate)`: 获取时间范围内的数据
- `saveMetric(metric)`: 保存单条体测数据
- `saveMetrics(metrics)`: 批量保存体测数据
- `updateMetric(id, updates)`: 更新体测数据
- `deleteMetric(id)`: 删除体测数据
- `getMetricStats(userId, type, count)`: 获取统计信息（平均值、最大值、最小值、变化等）

### 3. 状态管理
**文件**: `src/stores/bodyMetrics.ts`

实现了 Pinia store 用于管理体测数据状态：
- **状态**:
  - `metrics`: 所有体测数据
  - `loading`: 加载状态
  - `error`: 错误信息
- **计算属性**:
  - `metricsByType`: 按类型分组的指标
  - `latestWeight`: 最新体重
  - `latestBodyFat`: 最新体脂率
- **方法**:
  - `loadMetrics()`: 加载所有数据
  - `loadMetricsByType(type)`: 加载特定类型数据
  - `saveMetric(metric)`: 保存单条数据
  - `saveMetrics(metrics)`: 批量保存数据
  - `updateMetric(id, updates)`: 更新数据
  - `deleteMetric(id)`: 删除数据
  - `getMetricStats(type, count)`: 获取统计信息
  - `clearMetrics()`: 清空数据

### 4. 可视化组件

#### 4.1 MetricChart 组件
**文件**: `src/components/BodyMetrics/MetricChart.vue`

功能：
- 使用 Chart.js 和 vue-chartjs 绘制折线图
- 支持趋势填充
- 自适应配色（根据指标类型）
- 交互式 Tooltip
- 平滑曲线动画

技术点：
- 注册 Chart.js 必要的组件（CategoryScale, LinearScale, PointElement, LineElement, etc.）
- 响应式图表配置
- 自定义日期格式化

#### 4.2 MetricCard 组件
**文件**: `src/components/BodyMetrics/MetricCard.vue`

功能：
- 展示单个指标的最新数值
- 显示变化趋势（正/负/中性）
- 显示平均值统计
- 显示最后更新时间
- 提供"查看详情"和"添加记录"操作

样式特点：
- 卡片式布局
- 悬停阴影效果
- 大号数值显示
- 彩色趋势标识
- 响应式设计

#### 4.3 AddMetricDialog 组件
**文件**: `src/components/BodyMetrics/AddMetricDialog.vue`

功能：
- 对话框形式的添加记录界面
- 日期选择器（限制未来日期）
- 数值输入（带单位、范围限制、步长）
- 备注文本框（可选）
- 表单验证

### 5. 进度视图页面
**文件**: `src/views/ProgressView.vue`

功能：
- **概览区域**: 展示 4 个快捷指标卡片（体重、体脂率、肌肉量、腰围）
- **快速记录**: 快速添加体重和体脂率
- **详细数据展示**:
  - 点击卡片查看特定指标的详细数据
  - 显示折线图趋势
  - 数据列表表格（可编辑/删除）
- **操作**:
  - 添加单个指标记录
  - 批量快速记录
  - 删除记录（带确认）
  - 编辑记录（TODO）

布局特点：
- 响应式网格布局（手机/平板/桌面适配）
- 卡片悬停效果
- 统一的操作按钮

### 6. 首页集成
**文件**: `src/views/HomeView.vue`

更新内容：
- 引入 `useBodyMetricsStore`
- 优先使用最新的体测记录体重（而非用户档案中的初始体重）
- 在 `onMounted` 中加载体测数据

## 依赖安装

```bash
npm install chart.js vue-chartjs
```

已安装的版本：
- `chart.js`: ^4.x
- `vue-chartjs`: ^5.x

## 数据流程

```
用户操作 (ProgressView)
    ↓
Pinia Store (bodyMetrics.ts)
    ↓
Repository (bodyMetricsRepository.ts)
    ↓
IndexedDB (Dexie.js)
```

## 核心代码示例

### 1. 保存体测数据

```typescript
// 单条保存
await bodyMetricsStore.saveMetric({
  date: new Date(),
  type: 'weight',
  value: 70.5,
  unit: 'kg',
  note: '早晨空腹'
})

// 批量保存
await bodyMetricsStore.saveMetrics([
  { date: new Date(), type: 'weight', value: 70.5, unit: 'kg' },
  { date: new Date(), type: 'bodyfat', value: 18.5, unit: '%' }
])
```

### 2. 获取统计信息

```typescript
const stats = await bodyMetricsStore.getMetricStats('weight', 10)
// 返回: { average, max, min, latest, change, changePercent, count }
```

### 3. 渲染图表

```vue
<MetricChart
  :metrics="metricsStore.metricsByType['weight']"
  :title="体重趋势"
/>
```

## 验收标准

- ✅ 可以添加9种不同类型的体测数据
- ✅ 数据持久化到 IndexedDB
- ✅ 每种指标显示折线图趋势
- ✅ 显示统计信息（平均、变化、最新值）
- ✅ 支持查看历史记录
- ✅ 支持删除记录
- ✅ 响应式布局适配移动端
- ✅ 图表交互流畅（Tooltip、动画）
- ✅ 快速记录功能（体重+体脂率）
- ⏳ 编辑记录功能（标记为 TODO，后续实现）

## 测试建议

1. **基本功能测试**:
   - 添加各类体测数据
   - 查看图表和统计信息
   - 删除数据并验证

2. **边界测试**:
   - 输入最小/最大值
   - 未来日期应被禁用
   - 空数据状态显示

3. **响应式测试**:
   - 在不同屏幕尺寸下测试布局
   - 移动端触摸操作

4. **性能测试**:
   - 添加大量数据（100+ 条）
   - 图表渲染性能

## 下一步

- ✅ Task 2 完成
- ⏳ Task 3: 准备动作库数据（100+ 常见动作的JSON）

---

**完成时间**: 2025-11-11  
**开发者**: AI Assistant

