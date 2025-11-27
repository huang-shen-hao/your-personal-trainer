<template>
  <div class="onboarding-view">
    <el-card class="onboarding-card">
      <div class="onboarding-card__inner">
        <div class="onboarding-aside">
          <!-- <div class="onboarding-logo">
            <span class="onboarding-logo__dot" />
            <span class="onboarding-logo__text">GYM AI</span>
          </div> -->
          <h1 class="onboarding-title">欢迎加入你的个人训练计划</h1>
          <p class="onboarding-subtitle">根据你的身体情况与训练目标，AI 将为你定制最合适的训练方案。</p>

          <ul class="onboarding-highlights">
            <li>
              <span class="dot success" />
              <span>智能分析身体数据与训练目标</span>
            </li>
            <li>
              <span class="dot primary" />
              <span>个性化训练计划与节奏控制</span>
            </li>
            <li>
              <span class="dot info" />
              <span>多种教练风格，适配你的性格偏好</span>
            </li>
          </ul>
        </div>

        <div class="onboarding-main">
          <div class="onboarding-steps-wrapper">
            <el-steps :active="currentStep" finish-status="success" align-center>
              <el-step title="基础信息" />
              <el-step title="选择教练" />
              <el-step title="AI 配置" />
              <el-step title="完成" />
            </el-steps>
          </div>

          <div class="step-content">
            <!-- Step 1: 基础信息 -->
            <div v-if="currentStep === 0" class="step-form">
              <h3>填写基础信息</h3>
              <p class="step-description">这些信息将用于生成更加精准的训练计划，你可以稍后在个人资料中进行修改。</p>
              <el-form :model="formData" label-width="96px" label-position="top">
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
            <div class="form-grid">
              <el-form-item label="出生年份">
                <el-input-number v-model="formData.birthYear" :min="1950" :max="2010" />
              </el-form-item>
              <el-form-item label="身高 (cm)">
                <el-input-number v-model="formData.height" :min="100" :max="250" />
              </el-form-item>
              <el-form-item label="体重 (kg)">
                <el-input-number v-model="formData.currentWeight" :min="30" :max="200" :precision="1" />
              </el-form-item>
            </div>
            <el-form-item label="运动经验">
              <el-select v-model="formData.experienceLevel" placeholder="请选择当前训练经验">
                <el-option label="无经验" value="none" />
                <el-option label="初级（<1年）" value="beginner" />
                <el-option label="中级（1-3年）" value="intermediate" />
                <el-option label="高级（>3年）" value="advanced" />
              </el-select>
            </el-form-item>
            <el-form-item label="训练目标">
              <el-checkbox-group v-model="formData.goals" class="goals-group">
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
              <p class="step-description">选择你更喜欢的沟通方式，AI 将以对应的语气和风格陪你训练。</p>
              <div class="personality-group">
                <div
                  class="personality-card"
                  :class="{ 'is-active': formData.coachPersonality === 'strict' }"
                  @click="selectPersonality('strict')"
                >
                  <h4>严厉型</h4>
                  <p>注重纪律，强调标准动作与计划执行</p>
                </div>
                <div
                  class="personality-card"
                  :class="{ 'is-active': formData.coachPersonality === 'encouraging' }"
                  @click="selectPersonality('encouraging')"
                >
                  <h4>鼓励型</h4>
                  <p>积极正面反馈，注重心理支持</p>
                </div>
                <div
                  class="personality-card"
                  :class="{ 'is-active': formData.coachPersonality === 'humorous' }"
                  @click="selectPersonality('humorous')"
                >
                  <h4>幽默型</h4>
                  <p>轻松对话风格，降低训练压力</p>
                </div>
                <div
                  class="personality-card"
                  :class="{ 'is-active': formData.coachPersonality === 'academic' }"
                  @click="selectPersonality('academic')"
                >
                  <h4>学术派</h4>
                  <p>科学详细解释，引用研究数据</p>
                </div>
              </div>
            </div>

            <!-- Step 3: AI 配置 -->
            <div v-if="currentStep === 2" class="step-form">
              <h3>AI 服务配置</h3>
              <p class="step-description">
                选择你要使用的 AI 提供商和模型，并填写 API Key。你也可以先跳过，稍后在设置中完善。
              </p>
              <el-alert
                title="API Key 仅保存在本地浏览器中，不会上传到服务器。"
                type="info"
                :closable="false"
                class="ai-alert"
              />
              <el-form :model="aiConfigForm" label-width="96px" label-position="top">
                <el-form-item label="AI 提供商">
                  <el-select v-model="aiConfigForm.provider" placeholder="选择 AI 提供商">
                    <el-option
                      v-for="(info, key) in AI_PROVIDERS"
                      :key="key"
                      :label="info.name"
                      :value="key"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item label="模型">
                  <el-select v-model="aiConfigForm.model" placeholder="选择模型">
                    <el-option
                      v-for="model in availableAiModels"
                      :key="model.id"
                      :label="model.name"
                      :value="model.id"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item label="API Key">
                  <el-input
                    v-model="aiConfigForm.apiKey"
                    type="password"
                    show-password
                    placeholder="输入你的 API Key"
                  />
                </el-form-item>
              </el-form>

              <div class="ai-actions">
                <el-button @click="nextStep">跳过，稍后配置</el-button>
                <el-button type="primary" :loading="aiSaving" @click="saveAiConfigAndNext">
                  保存配置并继续
                </el-button>
              </div>
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
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import type { TrainingGoal } from '@/types/user'
import { useAIStore } from '@/stores/ai'
import { AI_PROVIDERS, type AIProvider } from '@/types/ai'

const router = useRouter()
const userStore = useUserStore()
const aiStore = useAIStore()

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

const aiConfigForm = reactive({
  provider: 'deepseek' as AIProvider,
  model: '',
  apiKey: ''
})

const aiSaving = ref(false)

const availableAiModels = computed(() => {
  const models = AI_PROVIDERS[aiConfigForm.provider]?.models || []
  if (!aiConfigForm.model && models.length > 0) {
    aiConfigForm.model = models[0].id
  }
  return models
})

function selectPersonality(type: 'strict' | 'encouraging' | 'humorous' | 'academic') {
  formData.value.coachPersonality = type
}

async function saveAiConfigAndNext() {
  if (!aiConfigForm.apiKey) {
    ElMessage.warning('请输入 API Key，或点击跳过稍后配置')
    return
  }

  if (!aiConfigForm.model) {
    ElMessage.warning('请选择模型')
    return
  }

  try {
    aiSaving.value = true
    await aiStore.saveConfig({
      provider: aiConfigForm.provider,
      modelId: aiConfigForm.model,
      model: aiConfigForm.model,
      apiKey: aiConfigForm.apiKey,
      isDefault: true
    })
    ElMessage.success('AI 配置已保存')
    nextStep()
  } catch (error) {
    console.error('保存 AI 配置失败:', error)
    ElMessage.error('保存 AI 配置失败，请稍后重试')
  } finally {
    aiSaving.value = false
  }
}

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
  padding: 40px 24px;
  background: var(--el-bg-color-page);

  @media (max-width: 768px) {
    padding: 24px 16px;
  }
}

.onboarding-card {
  max-width: 1040px;
  width: 100%;
  border-radius: 24px;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.12);
  border: 1px solid var(--el-border-color-lighter);

  :deep(.el-card__body) {
    padding: 0;
  }

  @media (max-width: 768px) {
    border-radius: 20px;
  }
}

.onboarding-card__inner {
  display: grid;
  grid-template-columns: 1.1fr 1.4fr;
  gap: 32px;
  padding: 32px 32px 28px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    padding: 24px 20px 20px;
  }
}

.onboarding-aside {
  padding: 8px 8px 8px 4px;
  display: flex;
  flex-direction: column;
  justify-content: center;

  @media (max-width: 1024px) {
    padding: 4px 0 0;
  }
}

.onboarding-logo {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px 4px 6px;
  border-radius: 999px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-size: 12px;
  margin-bottom: 16px;
}

.onboarding-logo__dot {
  width: 16px;
  height: 16px;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-success));
  box-shadow: 0 0 0 3px rgba(80, 125, 252, 0.2);
  animation: pulse-dot 1.6s ease-out infinite;
}

.onboarding-logo__text {
  font-weight: 600;
  letter-spacing: 0.06em;
}

.onboarding-title {
  font-size: 26px;
  line-height: 1.3;
  margin: 0 0 10px;
  color: var(--el-text-color-primary);
  opacity: 0;
  transform: translateY(12px);
  animation: fade-up 0.6s ease-out 0.05s forwards;
}

.onboarding-subtitle {
  font-size: 14px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
  margin: 0 0 24px;
  opacity: 0;
  transform: translateY(10px);
  animation: fade-up 0.6s ease-out 0.18s forwards;
}

.onboarding-highlights {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-size: 13px;
  color: var(--el-text-color-secondary);

  li {
    display: flex;
    align-items: center;
    gap: 8px;
    opacity: 0;
    transform: translateY(8px);
    animation: fade-up 0.45s ease-out forwards;
  }

  li:nth-child(1) {
    animation-delay: 0.26s;
  }

  li:nth-child(2) {
    animation-delay: 0.34s;
  }

  li:nth-child(3) {
    animation-delay: 0.42s;
  }

  .dot {
    width: 10px;
    height: 10px;
    border-radius: 999px;

    &.success {
      background: var(--el-color-success);
    }

    &.primary {
      background: var(--el-color-primary);
    }

    &.info {
      background: var(--el-color-info);
    }
  }
}

.onboarding-main {
  border-left: 1px solid var(--el-border-color-lighter);
  padding-left: 24px;

  @media (max-width: 1024px) {
    border-left: none;
    border-top: 1px solid var(--el-border-color-lighter);
    padding-left: 0;
    padding-top: 16px;
    margin-top: 8px;
  }
}

.onboarding-steps-wrapper {
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  margin-bottom: 20px;

  :deep(.el-steps) {
    max-width: 100%;
  }

  :deep(.el-step__title.is-process),
  :deep(.el-step__title.is-finish) {
    font-weight: 600;
  }

  :deep(.el-step__head.is-process .el-step__icon),
  :deep(.el-step__head.is-finish .el-step__icon) {
    box-shadow: 0 0 0 4px rgba(80, 125, 252, 0.16);
  }
}

.step-content {
  margin: 12px 0 0;
  min-height: 340px;
}

.step-form {
  h3 {
    margin-bottom: 8px;
    color: var(--el-text-color-primary);
    font-size: 18px;
    font-weight: 600;
  }
}

.step-description {
  margin-bottom: 18px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px 16px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 576px) {
    grid-template-columns: 1fr;
  }
}

.goals-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;

  :deep(.el-checkbox) {
    margin-right: 0;
  }
}

.personality-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  width: 100%;
  .personality-card {
    padding: 10px 12px;
    border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  word-break: break-word;
    border: 1px solid var(--el-border-color);
    cursor: pointer;
    transition: border-color 0.16s ease, box-shadow 0.16s ease, background-color 0.16s ease,
      transform 0.12s ease;

    &:hover {
      border-color: var(--el-color-primary-light-5);
      box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
      transform: translateY(-1px);
    }

    &.is-active {
      border-color: var(--el-color-primary);
      background-color: var(--el-color-primary-light-9);
      box-shadow: 0 10px 22px rgba(37, 99, 235, 0.18);
    }

    @media (max-width: 576px) {
      padding: 10px;
    }

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
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
}

.ai-alert {
  margin-bottom: 16px;
}

.ai-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

@keyframes fade-up {
  0% {
    opacity: 0;
    transform: translateY(16px);
  }

  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse-dot {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 3px rgba(80, 125, 252, 0.2);
  }

  50% {
    transform: scale(1.08);
    box-shadow: 0 0 0 6px rgba(80, 125, 252, 0.08);
  }

  100% {
    transform: scale(1);
    box-shadow: 0 0 0 3px rgba(80, 125, 252, 0.2);
  }
}
</style>
