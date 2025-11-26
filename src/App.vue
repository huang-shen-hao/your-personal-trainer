<template>
  <div id="app">
    <transition name="fade">
      <div v-if="showSplash" class="splash-overlay">
        <video
          ref="splashVideo"
          class="splash-video"
          :src="introVideo"
          autoplay
          muted
          playsinline
          @ended="closeSplash"
          @error="closeSplash"
        />
        <div class="splash-actions">
          <el-button size="small" plain @click="closeSplash">跳过</el-button>
        </div>
      </div>
    </transition>

    <router-view v-if="isSpecialPage" />
    <MainLayout v-else />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import introVideo from '@/assets/video/OA.mp4'

const route = useRoute()

// 不需要主布局的页面
const specialPages = ['/onboarding', '/404']
const isSpecialPage = computed(() => specialPages.includes(route.path))

const showSplash = ref(true)
const splashVideo = ref<HTMLVideoElement | null>(null)

function closeSplash() {
  showSplash.value = false
}

onMounted(() => {
  // 自动播放失败时也允许关闭
  const fallbackTimeout = window.setTimeout(() => {
    if (showSplash.value) closeSplash()
  }, 5000)

  const videoEl = splashVideo.value
  if (videoEl) {
    const onCanPlay = () => {
      videoEl.play().catch(() => closeSplash())
      videoEl.removeEventListener('canplay', onCanPlay)
    }
    videoEl.addEventListener('canplay', onCanPlay)
  }

  // 清理
  const clear = () => window.clearTimeout(fallbackTimeout)
  window.addEventListener('beforeunload', clear)
})
</script>

<style scoped lang="scss">
#app {
  position: relative;
}

.splash-overlay {
  position: fixed;
  inset: 0;
  background: radial-gradient(circle at 30% 30%, rgba(51, 112, 255, 0.12), transparent 50%),
    radial-gradient(circle at 70% 70%, rgba(15, 23, 42, 0.16), transparent 45%),
    var(--surface-base, #0f172a);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 16px;
}

.splash-video {
  max-width: min(720px, 90vw);
  max-height: min(420px, 70vh);
  border-radius: var(--radius-md, 12px);
  box-shadow: var(--shadow-pop, 0 18px 40px rgba(0, 0, 0, 0.4));
  background: var(--surface-card, #0b1222);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
}

.splash-actions {
  position: absolute;
  bottom: 24px;
  right: 24px;
  display: flex;
  gap: 8px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .splash-actions {
    right: 12px;
    bottom: 12px;
  }

  .splash-video {
    max-height: 60vh;
  }
}
</style>
