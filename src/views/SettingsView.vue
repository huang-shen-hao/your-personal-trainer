<template>
  <div class="settings-view">
    <el-card>
      <template #header>
        <span>设置</span>
      </template>
      
      <el-form label-width="120px">
        <el-divider content-position="left">外观设置</el-divider>
        
        <el-form-item label="主题模式">
          <el-radio-group v-model="settingsStore.theme" @change="settingsStore.applyTheme()">
            <el-radio label="light">浅色</el-radio>
            <el-radio label="dark">深色</el-radio>
            <el-radio label="auto">跟随系统</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="字体大小">
          <el-radio-group v-model="settingsStore.fontSize">
            <el-radio label="small">小</el-radio>
            <el-radio label="medium">中</el-radio>
            <el-radio label="large">大</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-divider content-position="left">语言设置</el-divider>
        
        <el-form-item label="语言">
          <el-select v-model="settingsStore.language">
            <el-option label="简体中文" value="zh-CN" />
            <el-option label="English" value="en-US" />
          </el-select>
        </el-form-item>

        <el-divider content-position="left">数据管理</el-divider>
        
        <el-form-item label="数据导出">
          <el-button>导出所有数据</el-button>
        </el-form-item>

        <el-form-item label="清除数据">
          <el-button type="danger">清除所有数据</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings'

const settingsStore = useSettingsStore()
</script>

<style scoped lang="scss">
.settings-view {
  max-width: 800px;
  margin: 0 auto;
}
</style>

