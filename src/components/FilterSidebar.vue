<script setup>
import { usePartsStore } from '@/stores/parts'

const store = usePartsStore()

const priceOptions = [
  { label: '全部价格', value: null },
  { label: '¥0 - ¥1000', value: [0, 1000] },
  { label: '¥1000 - ¥3000', value: [1000, 3000] },
  { label: '¥3000 - ¥6000', value: [3000, 6000] },
  { label: '¥6000 以上', value: [6000, null] },
]
</script>

<template>
  <aside class="w-full space-y-6 lg:w-64 lg:shrink-0">
    <div>
      <h3 class="mb-3 text-sm font-semibold text-txt-strong">
        品牌
      </h3>
      <div class="space-y-2">
        <label
          v-for="b in store.availableBrands"
          :key="b"
          class="flex cursor-pointer items-center gap-2 text-sm text-txt-muted"
        >
          <input
            type="checkbox"
            :checked="store.brands.includes(b)"
            class="h-4 w-4 rounded border-ink-600 bg-ink-800 accent-brand-500"
            @change="store.toggleBrand(b)"
          >
          {{ b }}
        </label>
      </div>
    </div>

    <div>
      <h3 class="mb-3 text-sm font-semibold text-txt-strong">
        价格区间
      </h3>
      <select
        class="w-full rounded-lg border border-ink-700 bg-ink-800 px-3 py-2 text-sm text-txt-body outline-none focus:border-brand-500"
        @change="store.priceRange = JSON.parse($event.target.value)"
      >
        <option
          v-for="(o, i) in priceOptions"
          :key="i"
          :value="JSON.stringify(o.value)"
          :selected="JSON.stringify(store.priceRange) === JSON.stringify(o.value)"
        >
          {{ o.label }}
        </option>
      </select>
    </div>

    <button
      class="w-full rounded-lg border border-ink-700 px-3 py-2 text-sm text-txt-muted transition hover:border-red-500/60 hover:text-red-400"
      @click="store.clearFilters()"
    >
      清除筛选
    </button>
  </aside>
</template>