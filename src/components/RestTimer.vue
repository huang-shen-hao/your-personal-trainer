<template>
  <div class="rest-timer" v-if="isActive">
    <el-card class="timer-card">
      <div class="timer-content">
        <div class="timer-display">
          <div class="time-text">{{ formattedTime }}</div>
          <div class="timer-label">组间休息</div>
        </div>
        
        <div class="timer-controls">
          <el-button 
            :type="isPaused ? 'success' : 'warning'"
            @click="togglePause"
            :icon="isPaused ? 'VideoPlay' : 'VideoPause'"
          >
            {{ isPaused ? '继续' : '暂停' }}
          </el-button>
          <el-button 
            type="danger"
            @click="skip"
            icon="Close"
          >
            跳过
          </el-button>
        </div>
      </div>
      
      <el-progress 
        :percentage="progressPercentage" 
        :stroke-width="8"
        :show-text="false"
        status="success"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

interface Props {
  duration: number // 休息时长（秒）
  autoStart?: boolean // 是否自动开始
}

const props = withDefaults(defineProps<Props>(), {
  autoStart: true
})

const emit = defineEmits<{
  complete: []
  skip: []
}>()

const isActive = ref(false)
const isPaused = ref(false)
const remainingSeconds = ref(0)
let timer: number | null = null

const formattedTime = computed(() => {
  const minutes = Math.floor(remainingSeconds.value / 60)
  const seconds = remainingSeconds.value % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

const progressPercentage = computed(() => {
  if (props.duration === 0) return 0
  return Math.round(((props.duration - remainingSeconds.value) / props.duration) * 100)
})

function start() {
  if (isActive.value && !isPaused.value) return
  
  isActive.value = true
  isPaused.value = false
  remainingSeconds.value = props.duration
  
  if (timer) {
    clearInterval(timer)
  }
  
  timer = window.setInterval(() => {
    if (!isPaused.value) {
      remainingSeconds.value--
      
      if (remainingSeconds.value <= 0) {
        stop()
        emit('complete')
      }
    }
  }, 1000)
}

function stop() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  isActive.value = false
  isPaused.value = false
  remainingSeconds.value = 0
}

function togglePause() {
  isPaused.value = !isPaused.value
}

function skip() {
  stop()
  emit('skip')
}

function reset() {
  stop()
  remainingSeconds.value = props.duration
}

watch(() => props.duration, () => {
  if (isActive.value) {
    remainingSeconds.value = props.duration
  }
})

onMounted(() => {
  if (props.autoStart) {
    start()
  }
})

onUnmounted(() => {
  stop()
})

defineExpose({
  start,
  stop,
  reset,
  skip
})
</script>

<style scoped lang="scss">
.rest-timer {
  position: sticky;
  bottom: 0;
  z-index: 100;
  background: var(--el-bg-color);
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.1);
}

.timer-card {
  border-radius: 0;
  border-left: none;
  border-right: none;
  border-bottom: none;
}

.timer-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
}

.timer-display {
  flex: 1;
  text-align: center;
}

.time-text {
  font-size: 48px;
  font-weight: bold;
  color: var(--el-color-primary);
  line-height: 1;
  margin-bottom: 8px;
  font-variant-numeric: tabular-nums;
}

.timer-label {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.timer-controls {
  display: flex;
  gap: 12px;
}

@media (max-width: 768px) {
  .time-text {
    font-size: 36px;
  }
  
  .timer-content {
    flex-direction: column;
    gap: 16px;
  }
  
  .timer-controls {
    width: 100%;
    justify-content: center;
  }
}
</style>

