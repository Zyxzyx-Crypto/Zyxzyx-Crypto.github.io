<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { findPartById } from '@/data/parts'
import { categories } from '@/data/categories'
import PartImage from '@/components/PartImage.vue'

const route = useRoute()
const router = useRouter()

const part = computed(() => findPartById(route.params.id))

// 参数字段映射：按分类展示对应字段的"中文标签 + 取值"
const fieldDefs = {
  socket: { label: 'CPU 插槽', suffix: '' },
  tdp: { label: '功耗 (TDP)', suffix: ' W' },
  memoryType: { label: '内存类型', suffix: '' },
  formFactor: { label: '规格', suffix: '' },
  length: { label: '长度', suffix: ' mm' },
  powerDraw: { label: '功耗', suffix: ' W' },
  capacity: { label: '容量', suffix: ' GB' },
  wattage: { label: '额定功率', suffix: ' W' },
  coolerHeight: { label: '高度', suffix: ' mm' },
  coolingCapacity: { label: '解热能力', suffix: ' W' },
  maxGpuLength: { label: '显卡限长', suffix: ' mm' },
  maxCoolerHeight: { label: '散热限高', suffix: ' mm' },
}

// 组装参数行：基础字段 + 分类特有字段
const params = computed(() => {
  if (!part.value) return []
  const p = part.value
  const rows = []

  // 通用字段
  rows.push({ label: '品牌', value: p.brand })
  rows.push({ label: '型号', value: p.name })
  rows.push({ label: '规格', value: p.spec })

  // 分类特有字段（按字段定义遍历）
  for (const [key, def] of Object.entries(fieldDefs)) {
    if (p[key] !== undefined && p[key] !== null) {
      rows.push({ label: def.label, value: p[key] + (def.suffix || '') })
    }
  }

  rows.push({ label: '价格', value: '¥' + p.price.toLocaleString('zh-CN') })
  rows.push({ label: '评分', value: p.rating + ' / 5.0（' + p.reviews.toLocaleString() + ' 评价）' })

  return rows
})

const category = computed(() => categories.find((c) => c.id === part.value?.category))

function formatPrice(v) {
  return '¥' + v.toLocaleString('zh-CN')
}

function goBack() {
  router.back()
}
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-8 sm:px-6">
    <button
      class="mb-6 flex items-center gap-1 text-sm text-txt-muted transition hover:text-brand-400"
      @click="goBack"
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
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
      返回
    </button>

    <div v-if="part">
      <!-- 头部 -->
      <div class="flex flex-col gap-6 sm:flex-row sm:items-start">
        <div class="aspect-[4/3] w-full shrink-0 overflow-hidden rounded-2xl sm:w-64">
          <PartImage
            :part="part"
            mode="detail"
          />
        </div>
        <div class="flex-1">
          <p class="text-sm font-medium uppercase tracking-wide text-txt-faint">
            {{ category?.name }} · {{ part.brand }}
          </p>
          <h1 class="mt-1 text-2xl font-bold text-txt-strong">
            {{ part.name }}
          </h1>
          <p class="mt-2 text-sm text-txt-muted">
            {{ part.spec }}
          </p>
          <div class="mt-3 flex flex-wrap gap-1.5">
            <span
              v-for="t in part.tags"
              :key="t"
              class="rounded-md bg-ink-800 px-2 py-0.5 text-xs text-txt-muted"
            >
              {{ t }}
            </span>
          </div>
        </div>
        <div class="shrink-0 text-right">
          <div class="text-3xl font-bold text-txt-strong">
            {{ formatPrice(part.price) }}
          </div>
          <div class="mt-1 flex items-center justify-end gap-1 text-sm text-amber-400">
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
      </div>

      <!-- 参数表 -->
      <div class="mt-8 rounded-xl border border-ink-700/70 bg-ink-900 overflow-hidden">
        <h2 class="border-b border-ink-700/70 px-5 py-4 text-base font-semibold text-txt-strong">
          详细参数
        </h2>
        <dl>
          <div
            v-for="(row, i) in params"
            :key="i"
            class="flex items-start justify-between px-5 py-3"
            :class="i % 2 === 0 ? 'bg-ink-900' : 'bg-ink-800/50'"
          >
            <dt class="text-sm text-txt-muted">
              {{ row.label }}
            </dt>
            <dd class="ml-4 max-w-[60%] text-right text-sm font-medium text-txt-strong">
              {{ row.value }}
            </dd>
          </div>
        </dl>
      </div>
    </div>

    <div
      v-else
      class="flex flex-col items-center justify-center rounded-xl border border-dashed border-ink-700 py-20 text-txt-faint"
    >
      未找到该配件
      <RouterLink
        to="/parts"
        class="mt-3 text-sm text-brand-400 hover:underline"
      >
        返回配件库
      </RouterLink>
    </div>
  </div>
</template>