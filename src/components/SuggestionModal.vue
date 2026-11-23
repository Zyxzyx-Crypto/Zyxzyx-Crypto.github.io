<script setup>
import { reactive, ref } from 'vue'

defineProps({
  modelValue: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const submitted = ref(false)
const error = ref('')

const form = reactive({
  type: '功能建议',
  email: '',
  content: '',
})

const types = ['功能建议', '问题反馈', '配件纠错', '其他']

function close() {
  emit('update:modelValue', false)
  // 关闭时重置状态
  setTimeout(() => {
    submitted.value = false
    error.value = ''
    form.content = ''
    form.email = ''
    form.type = '功能建议'
  }, 200)
}

function submit() {
  error.value = ''
  if (!form.content.trim()) {
    error.value = '请填写建议内容'
    return
  }
  if (form.content.trim().length < 10) {
    error.value = '建议内容至少 10 个字'
    return
  }
  // 纯前端演示：仅模拟提交成功
  submitted.value = true
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      @click.self="close"
    >
      <!-- 遮罩 -->
      <div class="absolute inset-0 bg-black/60" />

      <!-- 弹窗 -->
      <div class="relative w-full max-w-md rounded-2xl border border-ink-700 bg-ink-900 p-6 shadow-2xl">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-txt-strong">
            提建议
          </h2>
          <button
            class="flex h-7 w-7 items-center justify-center rounded-md text-txt-faint transition hover:text-txt-strong"
            @click="close"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- 成功态 -->
        <div
          v-if="submitted"
          class="py-8 text-center"
        >
          <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          </div>
          <p class="text-base font-semibold text-txt-strong">
            感谢你的建议！
          </p>
          <p class="mt-1 text-sm text-txt-muted">
            我们会认真阅读每一条反馈。
          </p>
          <button
            class="mt-5 rounded-lg bg-brand-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-brand-500"
            @click="close"
          >
            关闭
          </button>
        </div>

        <!-- 表单态 -->
        <form
          v-else
          class="space-y-4"
          @submit.prevent="submit"
        >
          <div>
            <label class="mb-1 block text-sm text-txt-muted">建议类型</label>
            <select
              v-model="form.type"
              class="w-full rounded-lg border border-ink-700 bg-ink-800 px-3 py-2.5 text-sm text-txt-body outline-none focus:border-brand-500"
            >
              <option
                v-for="t in types"
                :key="t"
                :value="t"
              >
                {{ t }}
              </option>
            </select>
          </div>

          <div>
            <label class="mb-1 block text-sm text-txt-muted">联系邮箱（选填）</label>
            <input
              v-model="form.email"
              type="email"
              placeholder="方便我们回复你"
              class="w-full rounded-lg border border-ink-700 bg-ink-800 px-3 py-2.5 text-sm text-txt-body outline-none focus:border-brand-500"
            >
          </div>

          <div>
            <label class="mb-1 block text-sm text-txt-muted">建议内容</label>
            <textarea
              v-model="form.content"
              rows="4"
              placeholder="说说你的想法或遇到的问题…"
              class="w-full resize-none rounded-lg border border-ink-700 bg-ink-800 px-3 py-2.5 text-sm text-txt-body outline-none focus:border-brand-500"
            />
          </div>

          <p
            v-if="error"
            class="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400"
          >
            {{ error }}
          </p>

          <div class="flex gap-2">
            <button
              type="button"
              class="flex-1 rounded-lg border border-ink-700 py-2.5 text-sm font-medium text-txt-muted transition hover:text-txt-strong"
              @click="close"
            >
              取消
            </button>
            <button
              type="submit"
              class="flex-1 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500"
            >
              提交建议
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>