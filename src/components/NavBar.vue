<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { categories } from '@/data/categories'
import { useThemeStore } from '@/stores/theme'
import { useAuthStore } from '@/stores/auth'
import CategoryIcon from './CategoryIcon.vue'
import SuggestionModal from './SuggestionModal.vue'

const theme = useThemeStore()
const auth = useAuthStore()
const route = useRoute()

const showSuggestion = ref(false)
const mobileMenuOpen = ref(false)
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-ink-800/60 bg-ink-950/80 backdrop-blur">
    <nav class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
      <RouterLink
        to="/"
        class="flex items-center gap-2"
      >
        <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
          <CategoryIcon
            name="chip"
            :size="18"
          />
        </span>
        <span class="text-lg font-semibold tracking-tight text-txt-strong">CoreForge</span>
      </RouterLink>

      <div class="flex items-center gap-6">
        <RouterLink
          v-for="c in categories.slice(0, 5)"
          :key="c.id"
          :to="`/parts/${c.id}`"
          class="hidden text-sm transition lg:block"
          :class="
            route.params.category === c.id
              ? 'font-medium text-brand-400'
              : 'text-txt-muted hover:text-txt-strong'
          "
        >
          {{ c.name }}
        </RouterLink>

        <!-- 提建议 -->
        <button
          class="hidden text-sm text-txt-muted transition hover:text-txt-strong sm:block"
          @click="showSuggestion = true"
        >
          提建议
        </button>

        <!-- 登录 / 用户 -->
        <template v-if="auth.isLoggedIn">
          <div class="flex items-center gap-2">
            <span class="text-sm text-txt-muted">{{ auth.user.name }}</span>
            <button
              class="text-sm text-txt-muted transition hover:text-red-400"
              @click="auth.logout()"
            >
              退出
            </button>
          </div>
        </template>
        <RouterLink
          v-else
          to="/login"
          class="hidden rounded-md border border-ink-700 px-3 py-1.5 text-sm font-medium text-txt-muted transition hover:border-brand-500/60 hover:text-brand-400 sm:block"
        >
          登录
        </RouterLink>

        <!-- 主题切换按钮 -->
        <button
          class="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-700 text-txt-muted transition hover:border-brand-500/60 hover:text-brand-400"
          :title="theme.isLight ? '切换到深色' : '切换到浅色'"
          @click="theme.toggle()"
        >
          <svg
            v-if="theme.isLight"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
          <svg
            v-else
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle
              cx="12"
              cy="12"
              r="4"
            />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          </svg>
        </button>

        <RouterLink
          to="/build"
          class="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-brand-500"
        >
          开始装机
        </RouterLink>

        <!-- 移动端菜单按钮 -->
        <button
          class="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-700 text-txt-muted transition hover:text-brand-400 lg:hidden"
          :title="mobileMenuOpen ? '收起菜单' : '展开菜单'"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              v-if="!mobileMenuOpen"
              d="M3 6h18M3 12h18M3 18h18"
            />
            <path
              v-else
              d="M18 6L6 18M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </nav>

    <!-- 移动端下拉菜单 -->
    <div
      v-if="mobileMenuOpen"
      class="border-t border-ink-800/60 bg-ink-950/95 px-4 py-3 lg:hidden"
    >
      <div class="grid grid-cols-2 gap-2">
        <RouterLink
          v-for="c in categories"
          :key="c.id"
          :to="`/parts/${c.id}`"
          class="flex items-center gap-2 rounded-lg border border-ink-700 px-3 py-2 text-sm text-txt-muted transition hover:border-brand-500/60 hover:text-brand-400"
          @click="mobileMenuOpen = false"
        >
          <CategoryIcon
            :name="c.icon"
            :size="16"
          />
          {{ c.name }}
        </RouterLink>
      </div>
      <div class="mt-3 flex gap-2">
        <RouterLink
          to="/login"
          class="flex-1 rounded-lg border border-ink-700 px-3 py-2 text-center text-sm text-txt-muted transition hover:border-brand-500/60 hover:text-brand-400"
          @click="mobileMenuOpen = false"
        >
          登录
        </RouterLink>
        <button
          class="flex-1 rounded-lg border border-ink-700 px-3 py-2 text-center text-sm text-txt-muted transition hover:border-brand-500/60 hover:text-brand-400"
          @click="mobileMenuOpen = false; showSuggestion = true"
        >
          提建议
        </button>
      </div>
    </div>

    <SuggestionModal v-model="showSuggestion" />
  </header>
</template>