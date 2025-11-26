【任务】

根据设计规范重构项目 UI

对照设计规范与 Figma 设计稿，统一全站视觉与交互。

可以在保证项目可运行的前提下，引入 / 替换 / 配置与 UI 相关的依赖包（例如：Element Plus 主题配置、UnoCSS/Tailwind、CSS 变量等）。

需要在不破坏现有业务逻辑的前提下，逐步重构组件样式与布局。

读取设计规范文件

请优先读取并严格遵循项目中的设计说明文件：/prompt/design.md

若 design.md 中存在与代码实现冲突的地方，以 design.md 与 Figma 为准，并在必要时对旧实现进行重构。

实现可配置的主题系统（重点）

建立一套可扩展的「主题令牌体系」，支持主题颜色修改，至少包括：

主品牌色（primary）

辅助色（success / warning / danger / info）

中性色（text / border / background / surface 等）

优先使用 CSS 变量（CSS Custom Properties） 或 Element Plus 官方支持的主题方式（如 --el-color-primary 等）实现主题。

需要支持：

在配置文件中修改主题（如 theme.config.ts 或相似文件）

运行时切换主题（例如：light / dark，或不同品牌主题组），要求结构清晰、易扩展。

【设计稿信息】

Figma 链接：
https://www.figma.com/design/P6A2oiPnJZyqhhaerMJ0Jn/Element-Plus-Design-System-Components---Community-?node-id=6542-142394&p=f&t=l2vjSnyc6IAUgXbJ-0

请完成以下工作：

对照 Figma 中的 颜色体系 / 排版 / 间距 / 圆角 / 阴影 / 状态（hover/active/disabled/focus） 等，抽象出一份 Design Tokens（可以放在 tokens.ts 或 theme/tokens.ts 中）。

将页面和组件中「写死的样式」替换为：

设计令牌（如 --color-primary-500、--font-size-sm）

或 Element Plus 对应的自定义主题变量。

确保基础组件（Button / Input / Select / Table / Tag / Dialog / Tabs 等）视觉与 Figma 设计库一致或足够接近。

统一交互状态：

悬停（hover）

按下/激活（active / pressed）

禁用（disabled）

焦点（focus，含键盘导航时的可见焦点框）

【交互要求】

请在重构中，遵守以下交互规范（若 design.md 有更详细规范，以其为准）：

按钮（Button）

有明确的 hover / active / disabled 状态，颜色与阴影需有层级感变化。

主按钮仅用于页面核心操作；次按钮、文字按钮用于次级操作。

表单（Form & Input）

统一错误态（error）和成功态（success）的样式（边框色、提示色、图标）。

保证表单元素的对齐与栅格布局整洁统一（标签 / 输入框 / 校验信息）。

反馈组件（Modal / Drawer / Message / Notification）

Modal/Dialog 遵循统一的：

头部高度、标题字号

关闭按钮位置

底部操作区按钮排列与间距

全局 Message / Notification 使用统一的颜色和图标规则，与主题色体系保持一致。

列表与表格（Table / List）

行高、间距、分割线对齐，并支持 hover 行高亮（可配置颜色）。

表头样式与 Figma 对齐（背景色、字号、字重、对齐方式）。

【技术要求】

若项目中已有技术栈，请自动识别（如：Vue 3 + Vite + TypeScript + Element Plus），并在此基础上进行改造。

主题实现方式

优先方案：

使用 CSS 变量 + 统一的 theme.css 或 theme.ts，通过 document.documentElement.style.setProperty(...) 实现动态修改主题。

如果使用 Element Plus：

结合其主题定制能力（如 :root { --el-color-primary: ... }），构建主题配置层。

确保新主题系统能：

只通过修改主题配置文件 / 变量，即可完成品牌换肤，而不需要大量改动业务组件。

代码组织与可维护性

为主题与 Design Tokens 建立独立目录，例如：

src/theme/

tokens.ts

light.ts

dark.ts

index.ts

尽量避免「魔法数字 / 魔法颜色」散落在组件内部；统一抽离到 Token 或变量中。

保持类型安全（若使用 TypeScript），例如为 ThemeName / ThemeToken 定义类型。

兼容性与渐进式重构

在可能的情况下，使用渐进式重构：

优先从基础组件、基础布局开始（Button / Input / Layout / Typography）。

再逐步覆盖业务页面，保证每一步改动项目仍可运行。

若遇到遗留样式冲突（如大量 .scss 覆盖），请：

优先移除不必要的覆盖

并将核心样式迁移到主题系统中。

开发体验

可以安装必要依赖（例如：npm install 新的 UI/样式工具包）。

对引入的新库，需简单配置（如 tailwind.config.js / uno.config.ts / postcss.config.js 等），并保证与现有项目兼容。

【输出与交付】

代码层面

完成主题系统与基础组件样式重构的代码改动。

对新增/修改的文件，保证代码风格统一（遵守项目 ESLint/Prettier 规则）。

文档层面

在 README 或 docs/ 下新增一份简单说明，例如 theme-guide.md：

如何新增一个新主题（例如“品牌 B”配色）

如何在运行时切换主题

主题令牌命名规范说明（color / spacing / radius / typography 等）