<script setup>
import { categories } from '@/data/categories'
import parts from '@/data/parts'
import CategoryIcon from '@/components/CategoryIcon.vue'
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="relative overflow-hidden border-b border-ink-800/60">
      <div
        class="pointer-events-none absolute inset-0"
        style="background: radial-gradient(60% 60% at 50% 0%, rgba(99,102,241,0.18), transparent 70%)"
      />
      <div class="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
        <p class="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-400">
          <span class="h-1.5 w-1.5 rounded-full bg-brand-400" />
          从零规划你的下一台主机
        </p>
        <h1 class="max-w-3xl text-4xl font-bold leading-tight tracking-tight text-txt-strong sm:text-5xl">
          浏览硬件 · 组装配置 · 检查兼容性
        </h1>
        <p class="mt-4 max-w-2xl text-base text-txt-muted">
          一站式 PC 装机配置平台，覆盖 CPU、主板、显卡等八大品类，支持参数筛选、实时价格统计与兼容性校验，让装机不再踩坑。
        </p>
        <div class="mt-8 flex flex-wrap gap-4">
          <RouterLink
            to="/build"
            class="rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-txt-strong transition hover:bg-brand-500"
          >
            开始装机
          </RouterLink>
          <RouterLink
            to="/parts"
            class="rounded-lg border border-ink-700 px-6 py-3 text-sm font-semibold text-txt-body transition hover:border-brand-500/60"
          >
            浏览配件库
          </RouterLink>
        </div>
        <div class="mt-10 flex flex-wrap gap-8 text-sm text-txt-faint">
          <div><span class="text-2xl font-bold text-txt-strong">8</span> 大品类</div>
          <div><span class="text-2xl font-bold text-txt-strong">{{ parts.length }}+</span> 精选配件</div>
          <div><span class="text-2xl font-bold text-txt-strong">100%</span> 兼容性校验</div>
        </div>
      </div>
    </section>

    <!-- 分类卡片 -->
    <section class="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <h2 class="text-2xl font-bold text-txt-strong">
        按品类浏览
      </h2>
      <p class="mt-2 text-sm text-txt-muted">
        选择硬件大类，进入筛选与配置
      </p>

      <div class="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <RouterLink
          v-for="c in categories"
          :key="c.id"
          :to="`/parts/${c.id}`"
          class="group flex flex-col rounded-xl border border-ink-700/70 bg-ink-900 p-5 transition hover:-translate-y-0.5 hover:border-brand-500/60 hover:bg-ink-800"
        >
          <span
            class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-ink-800 text-txt-muted transition group-hover:text-brand-400"
          >
            <CategoryIcon
              :name="c.icon"
              :size="26"
            />
          </span>
          <span class="text-base font-semibold text-txt-strong">{{ c.name }}</span>
          <span class="mt-0.5 text-xs text-txt-faint">{{ c.en }}</span>
          <span class="mt-2 text-xs text-txt-muted">{{ c.desc }}</span>
        </RouterLink>
      </div>
    </section>
  </div>
</template>