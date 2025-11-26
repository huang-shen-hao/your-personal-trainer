<template>
  <div class="profile-view">
    <el-page-header @back="router.push('/')" title="返回首页">
      <template #content>
        <span class="page-title">个人档案</span>
      </template>
    </el-page-header>

    <!-- 基础信息卡片 -->
    <el-card class="info-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>基础信息</span>
          <el-button
            v-if="!isEditingBasic"
            type="primary"
            size="small"
            @click="startEditBasic"
          >
            编辑
          </el-button>
          <div v-else>
            <el-button size="small" @click="cancelEditBasic">取消</el-button>
            <el-button type="primary" size="small" @click="saveBasicInfo" :loading="saving">
              保存
            </el-button>
          </div>
        </div>
      </template>

      <div v-if="!isEditingBasic && profile" class="info-display">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="昵称">{{ profile.nickname }}</el-descriptions-item>
          <el-descriptions-item label="性别">
            {{ genderMap[profile.gender] }}
          </el-descriptions-item>
          <el-descriptions-item label="年龄">
            {{ calculateAge(profile.birthYear) }} 岁
          </el-descriptions-item>
          <el-descriptions-item label="出生年份">
            {{ profile.birthYear }}
          </el-descriptions-item>
          <el-descriptions-item label="身高">
            {{ profile.height }} cm
          </el-descriptions-item>
          <el-descriptions-item label="体重">
            {{ profile.currentWeight }} kg
          </el-descriptions-item>
          <el-descriptions-item label="BMI">
            {{ bmi }} ({{ bmiCategory }})
          </el-descriptions-item>
          <el-descriptions-item label="运动经验">
            {{ experienceLevelMap[profile.experienceLevel] }}
          </el-descriptions-item>
          <el-descriptions-item label="训练目标" :span="2">
            <el-tag
              v-for="goal in profile.goals"
              :key="goal"
              size="small"
              style="margin-right: 8px"
            >
              {{ goalMap[goal] || goal }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <el-form
        v-else
        ref="basicFormRef"
        :model="basicForm"
        label-width="120px"
        @submit.prevent
      >
        <el-form-item label="昵称" required>
          <el-input v-model="basicForm.nickname" placeholder="请输入昵称" />
        </el-form-item>

        <el-form-item label="性别" required>
          <el-radio-group v-model="basicForm.gender">
            <el-radio label="male">男</el-radio>
            <el-radio label="female">女</el-radio>
            <el-radio label="other">其他</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="出生年份" required>
          <el-input-number
            v-model="basicForm.birthYear"
            :min="1950"
            :max="new Date().getFullYear()"
            :step="1"
          />
        </el-form-item>

        <el-form-item label="身高 (cm)" required>
          <el-input-number v-model="basicForm.height" :min="100" :max="250" :step="1" />
        </el-form-item>

        <el-form-item label="体重 (kg)" required>
          <el-input-number
            v-model="basicForm.currentWeight"
            :min="30"
            :max="200"
            :step="0.1"
            :precision="1"
          />
        </el-form-item>

        <el-form-item label="运动经验" required>
          <el-select v-model="basicForm.experienceLevel">
            <el-option label="无经验" value="none" />
            <el-option label="初级（<1年）" value="beginner" />
            <el-option label="中级（1-3年）" value="intermediate" />
            <el-option label="高级（>3年）" value="advanced" />
          </el-select>
        </el-form-item>

        <el-form-item label="训练目标" required>
          <el-checkbox-group v-model="basicForm.goals">
            <el-checkbox label="muscle_gain">增肌</el-checkbox>
            <el-checkbox label="fat_loss">减脂</el-checkbox>
            <el-checkbox label="fitness">体能提升</el-checkbox>
            <el-checkbox label="rehab">康复训练</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 训练偏好卡片 -->
    <el-card class="info-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>训练偏好</span>
          <el-button
            v-if="!isEditingPreference"
            type="primary"
            size="small"
            @click="startEditPreference"
          >
            编辑
          </el-button>
          <div v-else>
            <el-button size="small" @click="cancelEditPreference">取消</el-button>
            <el-button type="primary" size="small" @click="savePreference" :loading="saving">
              保存
            </el-button>
          </div>
        </div>
      </template>

      <div v-if="!isEditingPreference && profile" class="info-display">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="器械条件">
            {{ equipmentMap[profile.equipment] }}
          </el-descriptions-item>
          <el-descriptions-item label="教练性格">
            {{ personalityMap[profile.coachPersonality] }}
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <el-form
        v-else
        ref="preferenceFormRef"
        :model="preferenceForm"
        label-width="120px"
      >
        <el-form-item label="器械条件" required>
          <el-radio-group v-model="preferenceForm.equipment">
            <el-radio label="none">无器械（徒手）</el-radio>
            <el-radio label="home">家用器械</el-radio>
            <el-radio label="gym">健身房</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="教练性格" required>
          <el-radio-group v-model="preferenceForm.coachPersonality">
            <el-radio label="strict" border>严厉型</el-radio>
            <el-radio label="encouraging" border>鼓励型</el-radio>
            <el-radio label="humorous" border>幽默型</el-radio>
            <el-radio label="academic" border>学术派</el-radio>
            <el-radio label="custom" border>自定义</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据统计卡片 -->
    <el-card class="info-card" shadow="hover">
      <template #header>
        <span>数据统计</span>
      </template>
      <el-row :gutter="20">
        <el-col :xs="12" :sm="6">
          <el-statistic title="BMI" :value="bmi" />
          <div class="stat-label">{{ bmiCategory }}</div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <el-statistic title="年龄" :value="profile ? calculateAge(profile.birthYear) : 0" suffix="岁" />
        </el-col>
        <el-col :xs="12" :sm="6">
          <el-statistic title="训练天数" :value="0" suffix="天" />
          <div class="stat-label">即将开始</div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <el-statistic title="完成训练" :value="0" suffix="次" />
          <div class="stat-label">继续加油</div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { userRepository } from '@/db/repositories/userRepository'
import { calculateAge, calculateBMI, getBMICategory } from '@/utils/validation'
import { ElMessage } from 'element-plus'
import type { User } from '@/db'

const router = useRouter()
const userStore = useUserStore()

const profile = ref<User | null>(null)
const isEditingBasic = ref(false)
const isEditingPreference = ref(false)
const saving = ref(false)

// 表单数据
const basicForm = ref({
  nickname: '',
  gender: 'male' as 'male' | 'female' | 'other',
  birthYear: 1990,
  height: 170,
  currentWeight: 70,
  experienceLevel: 'beginner' as 'none' | 'beginner' | 'intermediate' | 'advanced',
  goals: [] as string[]
})

const preferenceForm = ref({
  equipment: 'home' as 'none' | 'home' | 'gym',
  coachPersonality: 'encouraging' as 'strict' | 'encouraging' | 'humorous' | 'academic' | 'custom'
})

// 映射字典
const genderMap = {
  male: '男',
  female: '女',
  other: '其他'
}

const experienceLevelMap = {
  none: '无经验',
  beginner: '初级',
  intermediate: '中级',
  advanced: '高级'
}

const equipmentMap = {
  none: '无器械（徒手）',
  home: '家用器械',
  gym: '健身房'
}

const personalityMap = {
  strict: '严厉型',
  encouraging: '鼓励型',
  humorous: '幽默型',
  academic: '学术派',
  custom: '自定义'
}

const goalMap: Record<string, string> = {
  muscle_gain: '增肌',
  fat_loss: '减脂',
  fitness: '体能提升',
  rehab: '康复训练',
  general: '综合'
}

// 计算属性
const bmi = computed(() => {
  if (!profile.value) return 0
  return calculateBMI(profile.value.currentWeight, profile.value.height)
})

const bmiCategory = computed(() => {
  return getBMICategory(bmi.value)
})

// 加载用户档案
async function loadProfile() {
  const user = await userRepository.getCurrent()
  if (user) {
    profile.value = user
    // 如果 user.id 存在，转换为 UserProfile 格式并设置到 store
    if (user.id) {
      try {
        // 将 User 转换为 UserProfile 格式
        const userProfile = {
          ...user,
          id: user.id,
          goals: user.goals as any,
          injuries: user.injuries?.map((str: string) => {
            try {
              return typeof str === 'string' ? JSON.parse(str) : str
            } catch {
              return str
            }
          }) || []
        }
        userStore.setProfile(userProfile as any)
      } catch (error) {
        console.error('设置用户档案到 store 失败:', error)
      }
    }
  } else if (userStore.profile) {
    // 将 UserProfile 转换为 User 格式
    const storeProfile = userStore.profile
    profile.value = {
      ...storeProfile,
      goals: storeProfile.goals.map(g => String(g)),
      injuries: storeProfile.injuries?.map(injury => 
        typeof injury === 'string' ? injury : JSON.stringify(injury)
      ) || []
    } as User
  }
}

// 编辑基础信息
function startEditBasic() {
  if (profile.value) {
    basicForm.value = {
      nickname: profile.value.nickname,
      gender: profile.value.gender,
      birthYear: profile.value.birthYear,
      height: profile.value.height,
      currentWeight: profile.value.currentWeight,
      experienceLevel: profile.value.experienceLevel,
      goals: [...profile.value.goals]
    }
  }
  isEditingBasic.value = true
}

function cancelEditBasic() {
  isEditingBasic.value = false
}

async function saveBasicInfo() {
  if (!profile.value) return

  // 简单验证
  if (!basicForm.value.nickname) {
    ElMessage.warning('请输入昵称')
    return
  }
  if (basicForm.value.goals.length === 0) {
    ElMessage.warning('请至少选择一个训练目标')
    return
  }

  saving.value = true
  try {
    await userRepository.update(profile.value.id!, {
      ...basicForm.value
    })
    
    // 重新加载
    await loadProfile()
    isEditingBasic.value = false
    ElMessage.success('保存成功')
  } catch (error) {
    ElMessage.error('保存失败')
    console.error(error)
  } finally {
    saving.value = false
  }
}

// 编辑训练偏好
function startEditPreference() {
  if (profile.value) {
    preferenceForm.value = {
      equipment: profile.value.equipment,
      coachPersonality: profile.value.coachPersonality
    }
  }
  isEditingPreference.value = true
}

function cancelEditPreference() {
  isEditingPreference.value = false
}

async function savePreference() {
  if (!profile.value) return

  saving.value = true
  try {
    await userRepository.update(profile.value.id!, {
      ...preferenceForm.value
    })
    
    await loadProfile()
    isEditingPreference.value = false
    ElMessage.success('保存成功')
  } catch (error) {
    ElMessage.error('保存失败')
    console.error(error)
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadProfile()
})
</script>

<style scoped lang="scss">
.profile-view {
  max-width: 1000px;
  margin: 0 auto;
}

.page-title {
  font-size: 18px;
  font-weight: bold;
}

.info-card {
  margin-top: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

.info-display {
  :deep(.el-descriptions__label) {
    font-weight: 500;
  }
}

.stat-label {
  text-align: center;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 8px;
}

@media (max-width: 768px) {
  .el-form {
    :deep(.el-form-item__label) {
      width: 100px !important;
    }
  }
}
</style>
