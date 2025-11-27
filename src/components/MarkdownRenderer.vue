<template>
  <div class="markdown-renderer" v-html="renderedHtml"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import python from 'highlight.js/lib/languages/python'
import 'highlight.js/styles/github-dark.css'

// 注册常用语言
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('python', python)

const props = defineProps<{
  content: string
}>()

// 配置 marked（新版本 API）
marked.use({
  breaks: true,
  gfm: true
})

const renderedHtml = computed(() => {
  try {
    const html = marked.parse(props.content) as string
    // 手动高亮代码块
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html
    const codeBlocks = tempDiv.querySelectorAll('pre code')
    codeBlocks.forEach((block) => {
      const codeElement = block as HTMLElement
      const lang = codeElement.className.match(/language-(\w+)/)?.[1]
      if (lang && hljs.getLanguage(lang)) {
        try {
          codeElement.innerHTML = hljs.highlight(codeElement.textContent || '', { language: lang }).value
        } catch (err) {
          console.error(err)
        }
      }
    })
    return tempDiv.innerHTML
  } catch (error) {
    console.error('Markdown rendering error:', error)
    return props.content
  }
})
</script>

<style scoped lang="scss">
.markdown-renderer {
  line-height: 1.6;
  color: var(--el-text-color-primary);

  :deep(h1), :deep(h2), :deep(h3), :deep(h4), :deep(h5), :deep(h6) {
    margin-top: 24px;
    margin-bottom: 16px;
    font-weight: 600;
    line-height: 1.25;
  }

  :deep(h1) {
    font-size: 2em;
    border-bottom: 1px solid var(--el-border-color);
    padding-bottom: 0.3em;
  }

  :deep(h2) {
    font-size: 1.5em;
    border-bottom: 1px solid var(--el-border-color-lighter);
    padding-bottom: 0.3em;
  }

  :deep(h3) {
    font-size: 1.25em;
  }

  :deep(p) {
    margin-bottom: 16px;
  }

  :deep(ul), :deep(ol) {
    padding-left: 2em;
    margin-bottom: 16px;
  }

  :deep(li) {
    margin-bottom: 4px;
  }

  :deep(code) {
    background-color: var(--el-fill-color-light);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 0.9em;
  }

  :deep(pre) {
    background-color: #1e1e1e;
    padding: 16px;
    border-radius: 8px;
    overflow-x: auto;
    margin-bottom: 16px;

    code {
      background-color: transparent;
      padding: 0;
      color: #d4d4d4;
    }
  }

  :deep(blockquote) {
    border-left: 4px solid var(--el-color-primary);
    padding-left: 16px;
    margin-left: 0;
    color: var(--el-text-color-secondary);
    font-style: italic;
  }

  :deep(table) {
    border-collapse: collapse;
    width: 100%;
    margin-bottom: 16px;
  }

  :deep(th), :deep(td) {
    border: 1px solid var(--el-border-color);
    padding: 8px 12px;
    text-align: left;
  }

  :deep(th) {
    background-color: var(--el-fill-color);
    font-weight: 600;
  }

  :deep(a) {
    color: var(--el-color-primary);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  :deep(img) {
    max-width: 100%;
    border-radius: 8px;
    margin: 16px 0;
  }

  :deep(hr) {
    border: none;
    border-top: 1px solid var(--el-border-color);
    margin: 24px 0;
  }

  :deep(strong) {
    font-weight: 600;
  }

  :deep(em) {
    font-style: italic;
  }
}
</style>

