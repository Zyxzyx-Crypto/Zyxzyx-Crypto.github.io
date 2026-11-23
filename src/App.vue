<script setup>
import NavBar from '@/components/NavBar.vue'
import MusicPlayer from '@/components/MusicPlayer.vue'
import WelcomeOverlay from '@/components/WelcomeOverlay.vue'
</script>

<template>
  <div class="min-h-screen bg-ink-950 text-txt-body">
    <WelcomeOverlay />
    <NavBar />
    <main>
      <RouterView v-slot="{ Component }">
        <Transition
          name="page"
          mode="out-in"
        >
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
    <footer class="border-t border-line-subtle py-8 text-center text-xs text-txt-faint">
      CoreForge · 用于学习演示的 PC 装机配置平台（数据为本地模拟）
    </footer>
    <MusicPlayer />
  </div>
</template>

<style scoped>
.page-enter-active,
.page-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>