/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly BASE_URL: string
  // 可以在这里添加其他环境变量
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// 声明 .md 文件可以作为原始字符串导入
declare module "*.md" {
  const content: string;
  export default content;
}

// 支持 ?raw 后缀导入
declare module "*?raw" {
  const content: string;
  export default content;
}

