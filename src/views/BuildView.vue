<script setup>
import { computed, ref } from 'vue'
import { useBuildStore, buildSteps } from '@/stores/build'
import { isCategoryInvolved } from '@/utils/compatibility'
import { analyzeBuild } from '@/utils/analyzeBuild'
import CategoryIcon from '@/components/CategoryIcon.vue'
import BuildPreview3D from '@/components/BuildPreview3D.vue'
import PartImage from '@/components/PartImage.vue'

const store = useBuildStore()

const copied = ref(false)

// 复制配置单到剪贴板
async function copySummary() {
  try {
    await navigator.clipboard.writeText(store.summaryText)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  } catch {
    downloadSummary()
  }
}

// 下载配置单为 txt 文件
function downloadSummary() {
  const blob = new Blob([store.summaryText], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'CoreForge-配置单.txt'
  a.click()
  URL.revokeObjectURL(url)
}

const currentStep = computed(() => store.activeStep)
const currentLabel = computed(
  () => buildSteps.find((s) => s.key === currentStep.value)?.label || '',
)

// 当前步骤候选配件（小白模式已前置过滤）
const candidates = computed(() => store.currentCandidates)
const compatibleParts = computed(() => candidates.value.compatible)
const incompatibleParts = computed(() => candidates.value.incompatible)

// 兼容性问题（达人模式后置检查）
const issues = computed(() => store.compatibilityIssues)
const errorCount = computed(() => issues.value.filter((it) => it.level === 'error').length)
const warningCount = computed(() => issues.value.filter((it) => it.level === 'warning').length)

// 某步骤是否涉及不兼容
function stepHasIssue(key) {
  return isCategoryInvolved(issues.value, key)
}

// 当前步骤对应的分类图标
const catIconMap = {
  cpu: 'chip',
  motherboard: 'board',
  gpu: 'gpu',
  ram: 'ram',
  storage: 'drive',
  psu: 'bolt',
  cooler: 'fan',
  case: 'box',
}
const currentIcon = computed(() => catIconMap[currentStep.value] || 'chip')

// 是否已被选中
function isSelected(p) {
  return store.selected[currentStep.value]?.id === p.id
}

function formatPrice(v) {
  return '¥' + v.toLocaleString('zh-CN')
}

// 切换模式：达人切小白时，清理掉当前不兼容的已选配件
function switchMode(mode) {
  if (mode === store.mode) return
  store.setMode(mode)
  // 从达人切回小白：把与已选配置冲突的配件移除，保证配置始终合理
  if (mode === 'beginner') {
    // 依赖顺序：cpu -> motherboard -> ram -> gpu/cooler -> psu/case
    const order = ['cpu', 'motherboard', 'ram', 'storage', 'gpu', 'psu', 'cooler', 'case']
    for (const key of order) {
      const p = store.selected[key]
      if (!p) continue
      // 复用前置过滤：判断当前已选配件是否还兼容于「其他已选配件」
      if (!isPartStillValid(store.selected, key)) {
        store.remove(key)
      }
    }
  }
}

// 判断已选配件 p 是否仍与「其余已选配件」兼容（用于切回小白模式时清理）
import { isPartCompatible } from '@/utils/compatibility'
function isPartStillValid(selected, key) {
  const p = selected[key]
  if (!p) return true
  // 构造一个不含该配件本身的 selected 快照，判断它是否兼容
  const snapshot = { ...selected }
  snapshot[key] = null
  return isPartCompatible(snapshot, p)
}

// RGB 灯效可选颜色
const rgbOptions = [
  { name: '冰蓝', value: '#44aaff' },
  { name: '青绿', value: '#2fe6c8' },
  { name: '粉紫', value: '#b44fff' },
  { name: '暖橙', value: '#ff9f3d' },
  { name: '正红', value: '#ff4f6c' },
  { name: '纯白', value: '#f0f4ff' },
]

// —— AI 智能点评 ——
const analyzing = ref(false)
const analysis = ref(null)
const analysisExpanded = ref(true)

// 生成点评（带一个短暂的"思考"动画，体验更像 AI）
function runAnalysis() {
  if (!store.selectedCount || analyzing.value) return
  analyzing.value = true
  analysis.value = null
  setTimeout(() => {
    analysis.value = analyzeBuild(store.selected)
    analyzing.value = false
    analysisExpanded.value = true
  }, 650)
}

// 评级对应的配色
const gradeColors = {
  S: '#fbbf24',
  A: '#34d399',
  B: '#60a5fa',
  C: '#fb923c',
  D: '#f87171',
}
function gradeColor(grade) {
  return gradeColors[grade] || '#60a5fa'
}
</script>

<template>
  <div class="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
    <!-- 顶部标题 + 模式切换 -->
    <div class="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-txt-strong">配置单构建器</h1>
        <p class="mt-1 text-sm text-txt-muted">
          左侧挑选配件，右侧实时 3D 预览与清单汇总
        </p>
      </div>

      <!-- 双模式切换 -->
      <div class="flex rounded-xl border border-ink-700 bg-ink-900 p-1">
        <button
          class="flex-1 rounded-lg px-4 py-2 text-sm font-medium transition"
          :class="
            store.mode === 'beginner'
              ? 'bg-brand-600 text-white shadow'
              : 'text-txt-muted hover:text-txt-strong'
          "
          @click="switchMode('beginner')"
        >
          🎯 装机小白
        </button>
        <button
          class="flex-1 rounded-lg px-4 py-2 text-sm font-medium transition"
          :class="
            store.mode === 'expert'
              ? 'bg-brand-600 text-white shadow'
              : 'text-txt-muted hover:text-txt-strong'
          "
          @click="switchMode('expert')"
        >
          🧑‍💻 装机达人
        </button>
      </div>
    </div>

    <!-- 模式说明 -->
    <div
      class="mb-5 flex items-start gap-2 rounded-lg border px-3 py-2 text-xs"
      :class="
        store.mode === 'beginner'
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
          : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
      "
    >
      <span class="mt-0.5">💡</span>
      <span>
        <template v-if="store.mode === 'beginner'">
          小白模式：选好 CPU 后，会自动帮你过滤掉装不上的主板、内存等配件，不兼容的直接置灰，照着点就行。
        </template>
        <template v-else>
          达人模式：所有配件自由选择，选完后下方会自动检查并提示冲突，高手自己权衡。
        </template>
      </span>
    </div>

    <!-- 左右双栏布局 -->
    <div class="flex flex-col gap-6 xl:flex-row">
      <!-- 左侧：选配件 -->
      <div class="min-w-0 flex-1">
        <!-- 步骤条 -->
        <div class="mb-5 flex flex-wrap gap-2">
          <button
            v-for="s in buildSteps"
            :key="s.key"
            class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition"
            :class="
              store.activeStep === s.key
                ? 'bg-brand-600 text-white'
                : stepHasIssue(s.key)
                  ? 'border border-red-500/60 bg-red-500/10 text-red-400'
                  : store.selected[s.key]
                    ? 'bg-ink-800 text-brand-400'
                    : 'bg-ink-800 text-txt-muted hover:text-txt-strong'
            "
            @click="store.setStep(s.key)"
          >
            <span
              class="h-1.5 w-1.5 rounded-full"
              :class="
                stepHasIssue(s.key)
                  ? 'bg-red-500'
                  : store.selected[s.key]
                    ? 'bg-brand-400'
                    : 'bg-slate-500'
              "
            />
            {{ s.label }}
            <svg
              v-if="stepHasIssue(s.key)"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
          </button>
        </div>

        <!-- 当前分类标题 -->
        <div class="mb-4 flex items-center gap-2">
          <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-800 text-brand-400">
            <CategoryIcon :name="currentIcon" :size="20" />
          </span>
          <div>
            <h2 class="text-lg font-semibold text-txt-strong">{{ currentLabel }}</h2>
            <p class="text-xs text-txt-faint">
              <template v-if="store.mode === 'beginner'">
                兼容 {{ compatibleParts.length }} 款 · 已排除 {{ incompatibleParts.length }} 款
              </template>
              <template v-else>
                共 {{ compatibleParts.length }} 款可选
              </template>
            </p>
          </div>
        </div>

        <!-- 可选配件网格 -->
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            v-for="p in compatibleParts"
            :key="p.id"
            class="flex flex-col rounded-xl border p-4 text-left transition hover:border-brand-500/60 hover:bg-ink-800"
            :class="
              isSelected(p)
                ? 'border-brand-500 bg-brand-500/10'
                : 'border-ink-700/70 bg-ink-900'
            "
            @click="store.select(currentStep, p)"
          >
            <!-- 产品图 -->
            <div class="mb-3 h-36 w-full overflow-hidden rounded-lg bg-white">
              <PartImage :part="p" />
            </div>
            <div class="flex items-start justify-between">
              <span class="text-xs font-medium uppercase tracking-wide text-txt-faint">{{ p.brand }}</span>
              <span v-if="isSelected(p)" class="text-xs font-medium text-brand-400">已选择</span>
            </div>
            <span class="mt-1 text-sm font-semibold text-txt-strong">{{ p.name }}</span>
            <span class="mt-1 text-xs text-txt-muted">{{ p.spec }}</span>
            <div class="mt-3 flex items-end justify-between">
              <span class="text-base font-bold text-txt-strong">{{ formatPrice(p.price) }}</span>
              <span class="flex items-center gap-2 text-xs text-txt-faint">
                ⭐ {{ p.rating }}
                <RouterLink
                  :to="`/part/${p.id}`"
                  class="rounded border border-ink-600 px-1.5 py-0.5 text-txt-faint transition hover:border-brand-500/60 hover:text-brand-400"
                  title="查看详情"
                  @click.stop
                >
                  详情
                </RouterLink>
              </span>
            </div>
          </button>
        </div>

        <!-- 小白模式：不兼容配件置灰区 -->
        <div v-if="store.mode === 'beginner' && incompatibleParts.length" class="mt-6">
          <p class="mb-2 flex items-center gap-1.5 text-xs text-txt-faint">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" class="text-txt-faint">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v2h2v-2h-2zm0-10v6h2V7h-2z" />
            </svg>
            以下配件与当前配置不兼容（已自动排除）
          </p>
          <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div
              v-for="it in incompatibleParts"
              :key="it.part.id"
              class="flex items-start gap-2 rounded-lg border border-ink-700/50 bg-ink-900/50 px-3 py-2 opacity-50"
            >
              <span class="mt-0.5 text-xs text-txt-faint">🔒</span>
              <div class="min-w-0">
                <p class="truncate text-xs font-medium text-txt-muted">
                  {{ it.part.brand }} {{ it.part.name }}
                </p>
                <p class="mt-0.5 text-[11px] leading-snug text-txt-faint">{{ it.reason }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：3D 预览 + 配置清单 -->
      <aside class="w-full shrink-0 xl:w-[420px]">
        <div class="sticky top-20 flex flex-col gap-4">
          <!-- 3D 预览 -->
          <div class="relative">
            <BuildPreview3D />
            <!-- 下滑引导箭头 -->
            <div
              class="pointer-events-none absolute inset-x-0 bottom-3 flex flex-col items-center gap-1"
            >
              <span class="text-[11px] text-white/70 drop-shadow">下滑看配置清单</span>
              <svg
                class="animate-bounce text-white/80"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
          </div>

          <!-- RGB 灯效 -->
          <div class="flex flex-wrap items-center justify-center gap-2">
            <span class="mr-1 text-xs text-txt-faint">RGB 灯效</span>
            <button
              v-for="c in rgbOptions"
              :key="c.value"
              class="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition"
              :class="
                store.rgbColor === c.value
                  ? 'border-white/40 bg-white/10 text-white'
                  : 'border-ink-700 text-txt-muted hover:text-txt-strong'
              "
              :title="c.name"
              @click="store.setRgb(c.value)"
            >
              <span class="h-3 w-3 rounded-full" :style="{ background: c.value }" />
              {{ c.name }}
            </button>
          </div>

          <!-- 配置清单 -->
          <div class="rounded-xl border border-ink-700/70 bg-ink-900 p-5">
            <div class="mb-4 flex items-center justify-between">
              <h3 class="text-base font-semibold text-txt-strong">配置清单</h3>
              <button
                v-if="store.selectedCount"
                class="text-xs text-txt-faint hover:text-red-400"
                @click="store.clearAll()"
              >
                清空
              </button>
            </div>

            <ul v-if="store.selectedCount" class="space-y-2">
              <li
                v-for="s in buildSteps.filter((x) => store.selected[x.key])"
                :key="s.key"
                class="flex items-center justify-between rounded-lg bg-ink-800 px-3 py-2"
              >
                <div class="min-w-0">
                  <p class="truncate text-sm text-txt-strong">{{ store.selected[s.key].name }}</p>
                  <p class="text-xs text-txt-faint">{{ s.label }} · {{ store.selected[s.key].brand }}</p>
                </div>
                <span class="ml-2 shrink-0 text-sm font-semibold text-txt-body">
                  {{ formatPrice(store.selected[s.key].price) }}
                </span>
              </li>
            </ul>
            <p v-else class="py-8 text-center text-sm text-txt-faint">
              还没有选择配件，<br>从左侧开始挑选吧
            </p>

            <div class="mt-4 border-t border-ink-700 pt-4">
              <div class="flex items-center justify-between text-sm">
                <span class="text-txt-muted">已选 {{ store.selectedCount }} / {{ buildSteps.length }} 件</span>
              </div>
              <div class="mt-2 flex items-end justify-between">
                <span class="text-sm text-txt-muted">总价</span>
                <span class="text-2xl font-bold text-txt-strong">{{ formatPrice(store.totalPrice) }}</span>
              </div>
              <div class="mt-2 flex items-center justify-between text-xs text-txt-faint">
                <span>预估功耗</span>
                <span>{{ store.estPowerDraw }} W</span>
              </div>
            </div>

            <!-- 兼容性检查（达人模式后置；小白模式默认已过滤，通常无冲突） -->
            <div class="mt-4 border-t border-ink-700 pt-4">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-txt-strong">兼容性检查</span>
                <span
                  v-if="store.selectedCount >= 2"
                  class="flex items-center gap-1 text-xs font-medium"
                  :class="errorCount ? 'text-red-400' : 'text-emerald-400'"
                >
                  <svg v-if="!errorCount" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                  <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                  </svg>
                  {{ errorCount ? errorCount + ' 项冲突' : '全部兼容' }}
                </span>
              </div>

              <ul v-if="issues.length" class="mt-3 space-y-2">
                <li
                  v-for="it in issues"
                  :key="it.id"
                  class="rounded-lg border p-2.5"
                  :class="
                    it.level === 'error'
                      ? 'border-red-500/40 bg-red-500/10'
                      : 'border-amber-500/40 bg-amber-500/10'
                  "
                >
                  <p class="text-xs font-semibold" :class="it.level === 'error' ? 'text-red-400' : 'text-amber-400'">
                    {{ it.title }}
                  </p>
                  <p class="mt-0.5 text-[11px] leading-relaxed text-txt-muted">{{ it.detail }}</p>
                </li>
              </ul>
              <p v-else-if="store.selectedCount >= 2" class="mt-3 text-xs text-emerald-400">
                当前已选配件互相兼容，无冲突。
              </p>
              <p v-else class="mt-3 text-xs text-txt-faint">
                再选择至少 2 件配件后开始检查兼容性。
              </p>
            </div>

            <!-- AI 智能点评 -->
            <div v-if="store.selectedCount" class="mt-4 border-t border-ink-700 pt-4">
              <button
                class="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                style="background: linear-gradient(90deg, #7c3aed, #4f46e5)"
                :disabled="analyzing"
                @click="runAnalysis"
              >
                <svg
                  v-if="!analyzing"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2l1.9 5.8L20 9.7l-5.1 3.7 1.9 5.8L12 15.5 7.2 19.2l1.9-5.8L4 9.7l6.1-1.9L12 2z" />
                </svg>
                <svg
                  v-else
                  class="animate-spin"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                >
                  <circle cx="12" cy="12" r="9" opacity="0.25" />
                  <path d="M21 12a9 9 0 0 0-9-9" stroke-linecap="round" />
                </svg>
                {{ analyzing ? 'AI 正在分析…' : 'AI 智能点评这套配置' }}
              </button>
              <p class="mt-1.5 text-center text-[11px] text-txt-faint">
                基于配件参数智能分析 · 无需联网 · 保护隐私
              </p>
            </div>

            <!-- 导出 / 分享 -->
            <div v-if="store.selectedCount" class="mt-4 border-t border-ink-700 pt-4">
              <div class="flex gap-2">
                <button
                  class="flex-1 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-500"
                  @click="copySummary"
                >
                  {{ copied ? '已复制 ✓' : '复制配置单' }}
                </button>
                <button
                  class="flex-1 rounded-lg border border-ink-700 px-3 py-2 text-sm font-medium text-txt-muted transition hover:border-brand-500/60 hover:text-brand-400"
                  @click="downloadSummary"
                >
                  下载 .txt
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>

    <!-- AI 点评弹窗 -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="analysis"
          class="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          @click.self="analysis = null"
        >
          <div
            class="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-ink-700 bg-ink-900 shadow-2xl"
          >
            <!-- 头部：评分 -->
            <div
              class="relative overflow-hidden px-6 py-6"
              style="background: linear-gradient(135deg, rgba(124,58,237,0.18), rgba(79,70,229,0.10))"
            >
              <button
                class="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-txt-muted transition hover:bg-white/10 hover:text-white"
                title="关闭"
                @click="analysis = null"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>

              <div class="flex items-center gap-5">
                <!-- 评分圆环 -->
                <div class="relative h-24 w-24 shrink-0">
                  <svg viewBox="0 0 100 100" class="h-full w-full -rotate-90">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="8" />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      :stroke="gradeColor(analysis.grade)"
                      stroke-width="8"
                      stroke-linecap="round"
                      :stroke-dasharray="`${analysis.score * 2.64} 264`"
                    />
                  </svg>
                  <div class="absolute inset-0 flex flex-col items-center justify-center">
                    <span class="text-2xl font-bold" :style="{ color: gradeColor(analysis.grade) }">
                      {{ analysis.score }}
                    </span>
                    <span class="text-[10px] text-txt-faint">综合评分</span>
                  </div>
                </div>

                <div class="min-w-0">
                  <div class="flex items-center gap-2">
                    <span
                      class="rounded-md px-2 py-0.5 text-sm font-bold"
                      :style="{
                        color: gradeColor(analysis.grade),
                        background: gradeColor(analysis.grade) + '22',
                      }"
                    >
                      {{ analysis.grade }} 级 · {{ analysis.gradeLabel }}
                    </span>
                  </div>
                  <div class="mt-2 flex flex-wrap gap-1.5">
                    <span
                      v-for="u in analysis.usage"
                      :key="u"
                      class="rounded-full border border-brand-500/40 bg-brand-500/10 px-2 py-0.5 text-[11px] text-brand-300"
                    >
                      {{ u }}
                    </span>
                  </div>
                  <p class="mt-2 text-xs text-txt-faint">
                    ¥{{ analysis.total.toLocaleString('zh-CN') }} · 约 {{ analysis.power }}W · 已选 {{ analysis.selectedCount }}/8 件
                  </p>
                </div>
              </div>
            </div>

            <!-- 总评 -->
            <div class="border-b border-ink-700 px-6 py-4">
              <p class="text-sm leading-relaxed text-txt-body">{{ analysis.verdict }}</p>
            </div>

            <!-- 三大板块 -->
            <div class="space-y-5 px-6 py-5">
              <!-- 亮点 -->
              <section>
                <h4 class="mb-2 flex items-center gap-1.5 text-sm font-semibold text-emerald-400">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                  这套配置的亮点
                </h4>
                <ul class="space-y-2">
                  <li
                    v-for="(item, i) in analysis.pros"
                    :key="i"
                    class="rounded-lg border border-emerald-500/25 bg-emerald-500/5 px-3 py-2"
                  >
                    <p class="text-xs font-semibold text-emerald-300">{{ item.title }}</p>
                    <p class="mt-0.5 text-[11px] leading-relaxed text-txt-muted">{{ item.desc }}</p>
                  </li>
                </ul>
              </section>

              <!-- 短板 -->
              <section v-if="analysis.cons.length">
                <h4 class="mb-2 flex items-center gap-1.5 text-sm font-semibold text-red-400">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                  </svg>
                  需要注意的地方
                </h4>
                <ul class="space-y-2">
                  <li
                    v-for="(item, i) in analysis.cons"
                    :key="i"
                    class="rounded-lg border px-3 py-2"
                    :class="item.level === 'error'
                      ? 'border-red-500/40 bg-red-500/10'
                      : 'border-amber-500/30 bg-amber-500/5'"
                  >
                    <p
                      class="text-xs font-semibold"
                      :class="item.level === 'error' ? 'text-red-400' : 'text-amber-400'"
                    >
                      {{ item.level === 'error' ? '✗' : '⚠' }} {{ item.title }}
                    </p>
                    <p class="mt-0.5 text-[11px] leading-relaxed text-txt-muted">{{ item.desc }}</p>
                  </li>
                </ul>
              </section>

              <!-- 升级建议 -->
              <section v-if="analysis.tips.length">
                <h4 class="mb-2 flex items-center gap-1.5 text-sm font-semibold text-sky-400">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
                  </svg>
                  升级建议
                </h4>
                <ul class="space-y-2">
                  <li
                    v-for="(item, i) in analysis.tips"
                    :key="i"
                    class="rounded-lg border border-sky-500/25 bg-sky-500/5 px-3 py-2"
                  >
                    <p class="text-xs font-semibold text-sky-300">{{ item.title }}</p>
                    <p class="mt-0.5 text-[11px] leading-relaxed text-txt-muted">{{ item.desc }}</p>
                  </li>
                </ul>
              </section>
            </div>

            <!-- 底部 -->
            <div class="flex items-center justify-between gap-3 border-t border-ink-700 px-6 py-4">
              <p class="text-[11px] text-txt-faint">点评基于配件参数生成，仅供参考</p>
              <button
                class="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-500"
                @click="analysis = null"
              >
                知道了
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-active > div,
.modal-leave-active > div {
  transition: transform 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from > div,
.modal-leave-to > div {
  transform: scale(0.96);
}
</style>
