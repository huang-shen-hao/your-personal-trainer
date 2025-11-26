# 主题与 Design Tokens 指南

本项目已接入一套可扩展的主题令牌体系，覆盖颜色、字号、间距、圆角、阴影和交互状态。主题通过 CSS 变量驱动，可在运行时无刷新切换浅/深色，并支持扩展品牌主题。

## 文件结构

- `src/theme/tokens.ts`：设计令牌定义、`light/dark` 主题配置与 `applyTheme` 方法。
- `src/theme/index.ts`：主题对外入口（`setThemeBySetting`、`themeOptions` 等）。
- `src/styles/variables.scss`：将 SCSS 变量映射到 CSS 变量的别名，方便在组件样式里直接使用。
- `src/styles/global.scss`：全局样式与 Element Plus 状态覆盖，依赖上方令牌。

## 主要令牌（CSS Variables）

- 颜色：`--color-primary`、`--color-primary-hover`、`--color-success|warning|danger|info`、`--text-primary|secondary|tertiary|placeholder`。
- 表面：`--surface-base`、`--surface-card`、`--surface-raised`、`--surface-overlay`。
- 边框与状态：`--border-subtle`、`--border-strong`、`--state-hover|active|muted`、`--focus-ring`、`--focus-color`。
- 版式：`--font-family`、`--font-size-xs|sm|md|lg|xl`、`--line-height-*`、`--font-weight-*`。
- 间距/圆角：`--space-xxs|xs|sm|md|lg|xl|xxl`、`--radius-xs|sm|md|lg|full`。
- 阴影/动效：`--shadow-soft|card|pop`、`--motion-fast|normal|slow`。

使用 SCSS 时，可继续在 `<style lang="scss">` 中 `@import '@/styles/variables.scss'`，然后直接使用 `$--el-color-primary`、`$--el-spacing-md` 等别名，它们会在运行时跟随 CSS 变量更新。

## 运行时切换主题

```ts
import { useSettingsStore } from '@/stores/settings'

const settings = useSettingsStore()

// 切换浅/深/跟随系统
settings.setTheme('dark')
settings.setTheme('light')
settings.setTheme('auto')
```

`settings.setTheme` 内部会调用 `setThemeBySetting` 将令牌写入 `document.documentElement`，并重新应用字号缩放。

## 新增品牌主题

1. 复制 `src/theme/tokens.ts` 中的 `lightTokens`，修改配色/阴影/圆角等得到 `brandTokens`。
2. 将新对象加入 `themes` 映射与 `themeOptions` 列表：
   ```ts
   export const themes = { ...existing, brand: brandTokens }
   export const themeOptions = ['light', 'dark', 'brand'] as const
   ```
3. 在 UI 中使用 `themeOptions` 渲染选择器，调用 `setTheme('brand')` 即可切换。

## 样式编写规范

- 优先使用令牌：`color: var(--color-primary); background: var(--surface-card);`。
- 组件交互态统一：hover 使用 `--state-hover`，active 使用 `--state-active`，focus 使用 `box-shadow: var(--focus-ring)`。
- Element Plus 覆盖：依赖全局设置的 `--el-*` 变量，无需手动硬编码颜色。
- 移动端：使用 `--space-*` 作为间距基准，保持 8px 刻度的一致性。

通过仅修改令牌（或新增主题对象），即可完成品牌换肤，而无需大面积调整业务组件样式。
