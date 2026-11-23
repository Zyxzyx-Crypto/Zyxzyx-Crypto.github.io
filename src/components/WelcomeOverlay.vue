<script setup>
import { useWelcomeStore } from '@/stores/welcome'
import CategoryIcon from '@/components/CategoryIcon.vue'

const welcome = useWelcomeStore()
</script>

<template>
  <Transition name="welcome">
    <div
      v-if="!welcome.entered"
      class="fixed inset-0 z-[60] flex items-center justify-center bg-ink-950 px-6"
    >
      <div class="flex flex-col items-center text-center">
        <div
          class="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-2xl shadow-brand-600/30"
        >
          <CategoryIcon
            name="chip"
            :size="40"
          />
        </div>

        <h1 class="text-4xl font-bold tracking-tight text-white sm:text-5xl">
          CoreForge
        </h1>

        <p class="mt-3 max-w-md text-base text-slate-400">
          一站式 PC 装机配置平台<br>
          浏览硬件 · 3D 预览 · 检查兼容性
        </p>

        <button
          class="mt-8 flex items-center gap-2 rounded-xl bg-brand-600 px-8 py-3 text-base font-semibold text-white transition hover:bg-brand-500 hover:shadow-lg hover:shadow-brand-600/30"
          @click="welcome.enter()"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
          进入网站
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.welcome-leave-active {
  transition:
    opacity 0.4s ease,
    transform 0.4s ease;
}
.welcome-leave-to {
  opacity: 0;
  transform: scale(1.05);
}
</style>