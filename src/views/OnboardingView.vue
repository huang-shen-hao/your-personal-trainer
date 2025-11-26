<template>
  <div class="onboarding-view">
    <el-card class="onboarding-card">
      <div class="onboarding-header">
        <h1>欢迎使用 GYM AI</h1>
        <p>让我们开始你的健身之旅</p>
      </div>

      <el-steps :active="currentStep" finish-status="success" align-center>
        <el-step title="基础信息" />
        <el-step title="选择教练" />
        <el-step title="AI 配置" />
        <el-step title="完成" />
      </el-steps>

      <div class="step-content">
        <!-- Step 1: 基础信息 -->
        <div v-if="currentStep === 0" class="step-form">
          <h3>填写基础信息</h3>
          <el-form :model="formData" label-width="120px">
            <el-form-item label="昵称">
              <el-input v-model="formData.nickname" placeholder="请输入昵称" />
            </el-form-item>
            <el-form-item label="性别">
              <el-radio-group v-model="formData.gender">
                <el-radio label="male">男</el-radio>
                <el-radio label="female">女</el-radio>
                <el-radio label="other">其他</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="出生年份">
              <el-input-number v-model="formData.birthYear" :min="1950" :max="2010" />
            </el-form-item>
            <el-form-item label="身高 (cm)">
              <el-input-number v-model="formData.height" :min="100" :max="250" />
            </el-form-item>
            <el-form-item label="体重 (kg)">
              <el-input-number v-model="formData.currentWeight" :min="30" :max="200" :precision="1" />
            </el-form-item>
            <el-form-item label="运动经验">
              <el-select v-model="formData.experienceLevel">
                <el-option label="无经验" value="none" />
                <el-option label="初级（<1年）" value="beginner" />
                <el-option label="中级（1-3年）" value="intermediate" />
                <el-option label="高级（>3年）" value="advanced" />
              </el-select>
            </el-form-item>
            <el-form-item label="训练目标">
              <el-checkbox-group v-model="formData.goals">
                <el-checkbox label="muscle_gain">增肌</el-checkbox>
                <el-checkbox label="fat_loss">减脂</el-checkbox>
                <el-checkbox label="fitness">体能提升</el-checkbox>
                <el-checkbox label="rehab">康复训练</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            <el-form-item label="器械条件">
              <el-radio-group v-model="formData.equipment">
                <el-radio label="none">无器械（徒手）</el-radio>
                <el-radio label="home">家用器械</el-radio>
                <el-radio label="gym">健身房</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-form>
        </div>

        <!-- Step 2: 选择教练性格 -->
        <div v-if="currentStep === 1" class="step-form">
          <h3>选择教练性格</h3>
          <el-radio-group v-model="formData.coachPersonality" class="personality-group">
            <el-radio label="strict" border>
              <div class="personality-card">
                <h4>严厉型</h4>
                <p>注重纪律，强调标准动作与计划执行</p>
              </div>
            </el-radio>
            <el-radio label="encouraging" border>
              <div class="personality-card">
                <h4>鼓励型</h4>
                <p>积极正面反馈，注重心理支持</p>
              </div>
            </el-radio>
            <el-radio label="humorous" border>
              <div class="personality-card">
                <h4>幽默型</h4>
                <p>轻松对话风格，降低训练压力</p>
              </div>
            </el-radio>
            <el-radio label="academic" border>
              <div class="personality-card">
                <h4>学术派</h4>
                <p>科学详细解释，引用研究数据</p>
              </div>
            </el-radio>
          </el-radio-group>
        </div>

        <!-- Step 3: AI 配置 -->
        <div v-if="currentStep === 2" class="step-form">
          <h3>AI 服务配置</h3>
          <el-alert title="提示" type="info" :closable="false" style="margin-bottom: 20px;">
            你可以选择自带 API Key，或稍后在设置中配置
          </el-alert>
          <el-button type="primary" @click="router.push('/ai-config')">现在配置</el-button>
          <el-button @click="nextStep">跳过，稍后配置</el-button>
        </div>

        <!-- Step 4: 完成 -->
        <div v-if="currentStep === 3" class="step-form completion-step">
          <el-result icon="success" title="设置完成！" sub-title="开始你的健身之旅吧">
            <template #extra>
              <el-button type="primary" @click="completeOnboarding" :loading="completing">
                进入首页
              </el-button>
            </template>
          </el-result>
        </div>
      </div>

      <div class="step-actions">
        <el-button v-if="currentStep > 0 && currentStep < 3" @click="prevStep">上一步</el-button>
        <el-button v-if="currentStep < 2" type="primary" @click="nextStep">下一步</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import type { TrainingGoal } from '@/types/user'

const router = useRouter()
const userStore = useUserStore()

const currentStep = ref(0)
const completing = ref(false)

const formData = ref({
  nickname: '',
  gender: 'male' as 'male' | 'female' | 'other',
  birthYear: 1990,
  height: 170,
  currentWeight: 70,
  experienceLevel: 'beginner' as 'none' | 'beginner' | 'intermediate' | 'advanced',
  goals: [] as TrainingGoal[],
  equipment: 'home' as 'none' | 'home' | 'gym',
  coachPersonality: 'encouraging' as 'strict' | 'encouraging' | 'humorous' | 'academic'
})

function nextStep() {
  if (currentStep.value === 0) {
    if (!formData.value.nickname) {
      ElMessage.warning('请填写昵称')
      return
    }
    if (formData.value.goals.length === 0) {
      ElMessage.warning('请至少选择一个训练目标')
      return
    }
  }
  currentStep.value++
}

function prevStep() {
  currentStep.value--
}

async function completeOnboarding() {
  completing.value = true
  try {
    // 验证必填字段
    if (!formData.value.nickname) {
      ElMessage.warning('请填写昵称')
      completing.value = false
      return
    }
    
    if (formData.value.goals.length === 0) {
      ElMessage.warning('请至少选择一个训练目标')
      completing.value = false
      return
    }
    
    // 确保 goals 是纯字符串数组
    const cleanGoals = Array.isArray(formData.value.goals) 
      ? formData.value.goals.map(g => String(g) as TrainingGoal)
      : [] as TrainingGoal[]
    
    // 准备完整的用户数据，包含必需的 location 字段
    const profileData = {
      nickname: formData.value.nickname,
      gender: formData.value.gender,
      birthYear: formData.value.birthYear,
      height: formData.value.height,
      currentWeight: formData.value.currentWeight,
      experienceLevel: formData.value.experienceLevel,
      goals: cleanGoals,
      equipment: formData.value.equipment,
      // 根据 equipment 字段推断 location
      location: formData.value.equipment === 'gym' ? 'gym' as const : 'home' as const,
      coachPersonality: formData.value.coachPersonality
    }
    
    console.log('准备保存的用户数据:', profileData)
    console.log('goals 数组详情:', {
      original: formData.value.goals,
      cleaned: cleanGoals,
      isArray: Array.isArray(cleanGoals),
      length: cleanGoals.length,
      items: cleanGoals.map((g, i) => ({
        index: i,
        value: g,
        type: typeof g
      }))
    })
    
    await userStore.saveProfile(profileData)
    
    console.log('用户数据保存成功')
    ElMessage.success('设置完成！')
    
    // 延迟跳转，确保消息显示
    setTimeout(() => {
      router.push('/')
    }, 500)
  } catch (error) {
    console.error('保存用户档案错误:', error)
    console.error('表单数据:', formData.value)
    
    // 详细的错误信息
    let errorMessage = '未知错误'
    if (error instanceof Error) {
      errorMessage = error.message
      console.error('错误堆栈:', error.stack)
    }
    
    ElMessage.error({
      message: `保存失败：${errorMessage}`,
      duration: 5000,
      showClose: true
    })
  } finally {
    completing.value = false
  }
}
</script>

<style scoped lang="scss">
.onboarding-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.onboarding-card {
  max-width: 800px;
  width: 100%;
  padding: 40px;

  @media (max-width: 768px) {
    padding: 20px;
  }
}

.onboarding-header {
  text-align: center;
  margin-bottom: 40px;

  h1 {
    font-size: 32px;
    margin-bottom: 10px;
    color: var(--el-color-primary);
  }

  p {
    font-size: 16px;
    color: var(--el-text-color-secondary);
  }
}

.step-content {
  margin: 40px 0;
  min-height: 400px;
}

.step-form {
  h3 {
    margin-bottom: 20px;
    color: var(--el-text-color-primary);
  }
}

.personality-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  width: 100%;

  .el-radio {
    margin-right: 0;
    width: 100%;

    :deep(.el-radio__label) {
      width: 100%;
    }
  }

  .personality-card {
    padding: 10px;

    h4 {
      margin-bottom: 8px;
      color: var(--el-color-primary);
    }

    p {
      font-size: 14px;
      color: var(--el-text-color-secondary);
      margin: 0;
    }
  }
}

.completion-step {
  display: flex;
  justify-content: center;
  align-items: center;
}

.step-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 30px;
}
</style>
