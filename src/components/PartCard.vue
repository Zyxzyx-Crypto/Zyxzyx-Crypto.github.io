<script setup>
import PartImage from './PartImage.vue'

const props = defineProps({
  part: { type: Object, required: true },
})

function formatPrice(v) {
  return '¥' + v.toLocaleString('zh-CN')
}
</script>

<template>
  <RouterLink
    :to="`/part/${part.id}`"
    class="group flex flex-col overflow-hidden rounded-xl border border-ink-700/70 bg-ink-900 transition hover:-translate-y-0.5 hover:border-brand-500/60 hover:shadow-lg hover:shadow-brand-500/10"
  >
    <!-- 产品图：程序化 SVG 封面 -->
    <div class="relative aspect-square w-full">
      <PartImage :part="part" />
      <div class="absolute right-2 top-2 flex items-center gap-1 rounded-lg bg-black/45 px-2 py-1 text-sm text-amber-400 backdrop-blur-sm">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2l2.9 6.3 6.9.6-5.2 4.6 1.5 6.8L12 16.9 5.9 20.3l1.5-6.8L2.2 8.9l6.9-.6z" />
        </svg>
        {{ part.rating }}
      </div>
    </div>

    <div class="flex flex-1 flex-col p-4">
      <p class="text-xs font-medium uppercase tracking-wide text-txt-faint">
        {{ part.brand }}
      </p>
      <h3 class="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-txt-strong">
        {{ part.name }}
      </h3>
      <p class="mt-1.5 line-clamp-2 text-xs leading-relaxed text-txt-muted">
        {{ part.spec }}
      </p>

      <div class="mt-3 flex flex-wrap gap-1.5">
        <span
          v-for="t in part.tags"
          :key="t"
          class="rounded-md bg-ink-800 px-2 py-0.5 text-[11px] text-txt-muted"
        >
          {{ t }}
        </span>
      </div>

      <div class="mt-auto flex items-end justify-between pt-4">
        <span class="text-lg font-bold text-txt-strong">{{ formatPrice(part.price) }}</span>
        <div class="text-right text-xs text-txt-faint">
          <p v-if="part.released">{{ part.released.replace('-', '年') + '月 上市' }}</p>
          <p>{{ part.reviews.toLocaleString() }} 评价</p>
        </div>
      </div>
    </div>
  </RouterLink>
</template>