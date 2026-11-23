<script setup>
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { usePartsStore } from '@/stores/parts'
import { categories } from '@/data/categories'
import FilterSidebar from '@/components/FilterSidebar.vue'
import PartCard from '@/components/PartCard.vue'

const route = useRoute()
const store = usePartsStore()

// 同步路由参数到 store
watch(
  () => route.params.category,
  (cat) => {
    store.setCategory(cat || 'all')
  },
  { immediate: true },
)

const currentCategory = computed(
  () => categories.find((c) => c.id === store.category) || null,
)

const sortOptions = [
  { label: '最新发布', value: 'newest' },
  { label: '默认排序', value: '' },
  { label: '价格从低到高', value: 'price-asc' },
  { label: '价格从高到低', value: 'price-desc' },
  { label: '评分优先', value: 'rating' },
]
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
    <!-- 面包屑 + 分类标题 -->
    <div class="mb-6">
      <nav class="mb-2 text-xs text-txt-faint">
        <RouterLink
          to="/"
          class="hover:text-txt-muted"
        >首页</RouterLink>
        <span class="mx-1">/</span>
        <span class="text-txt-muted">{{ currentCategory ? currentCategory.name : '全部配件' }}</span>
      </nav>
      <h1 class="text-2xl font-bold text-txt-strong">
        {{ currentCategory ? currentCategory.name : '全部配件' }}
        <span class="ml-2 text-base font-normal text-txt-faint">
          {{ currentCategory ? currentCategory.en : 'All parts' }}
        </span>
      </h1>
      <p class="mt-1 text-sm text-txt-muted">
        {{ currentCategory ? currentCategory.desc : '全部硬件品类' }} · 共 {{ store.list.length }} 款
      </p>
    </div>

    <div class="flex flex-col gap-8 lg:flex-row">
      <FilterSidebar />

      <div class="flex-1">
        <!-- 分类标签 + 排序 -->
        <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-wrap gap-2">
            <button
              class="rounded-lg px-3 py-1.5 text-sm transition"
              :class="
                store.category === 'all'
                  ? 'bg-brand-600 text-white'
                  : 'bg-ink-800 text-txt-muted hover:text-txt-strong'
              "
              @click="store.setCategory('all')"
            >
              全部
            </button>
            <button
              v-for="c in categories"
              :key="c.id"
              class="rounded-lg px-3 py-1.5 text-sm transition"
              :class="
                store.category === c.id
                  ? 'bg-brand-600 text-white'
                  : 'bg-ink-800 text-txt-muted hover:text-txt-strong'
              "
              @click="store.setCategory(c.id)"
            >
              {{ c.name }}
            </button>
          </div>

          <select
            v-model="store.sort"
            class="rounded-lg border border-ink-700 bg-ink-800 px-3 py-1.5 text-sm text-txt-body outline-none focus:border-brand-500"
          >
            <option
              v-for="o in sortOptions"
              :key="o.value"
              :value="o.value"
            >
              {{ o.label }}
            </option>
          </select>
        </div>

        <!-- 结果列表 -->
        <div
          v-if="store.list.length"
          class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          <PartCard
            v-for="p in store.list"
            :key="p.id"
            :part="p"
          />
        </div>
        <div
          v-else
          class="flex flex-col items-center justify-center rounded-xl border border-dashed border-ink-700 py-20 text-txt-faint"
        >
          没有匹配的配件，试试清除筛选条件
        </div>
      </div>
    </div>
  </div>
</template>