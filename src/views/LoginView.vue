<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const mode = ref('login') // 'login' | 'register'
const error = ref('')

const form = reactive({
  name: '',
  email: '',
  password: '',
  confirm: '',
})

function switchMode(m) {
  mode.value = m
  error.value = ''
}

function validate() {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    return '请输入有效的邮箱地址'
  }
  if (form.password.length < 6) {
    return '密码至少 6 位'
  }
  if (mode.value === 'register') {
    if (!form.name.trim()) return '请输入昵称'
    if (form.password !== form.confirm) return '两次密码不一致'
  }
  return null
}

function submit() {
  error.value = ''
  const err = validate()
  if (err) {
    error.value = err
    return
  }

  let res
  if (mode.value === 'login') {
    res = auth.login(form.email, form.password)
  } else {
    res = auth.register(form.name.trim(), form.email, form.password)
  }

  if (!res.ok) {
    error.value = res.msg
    return
  }

  // 登录成功，跳转到首页
  router.push('/')
}
</script>

<template>
  <div class="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-12">
    <div class="w-full rounded-2xl border border-ink-700/70 bg-ink-900 p-8">
      <div class="mb-6 text-center">
        <h1 class="text-2xl font-bold text-txt-strong">
          {{ mode === 'login' ? '登录' : '注册' }}
        </h1>
        <p class="mt-1 text-sm text-txt-muted">
          {{ mode === 'login' ? '欢迎回来，登录你的账号' : '创建账号，开启你的装机之旅' }}
        </p>
      </div>

      <!-- 模式切换 -->
      <div class="mb-6 flex rounded-lg bg-ink-800 p-1">
        <button
          class="flex-1 rounded-md py-2 text-sm font-medium transition"
          :class="mode === 'login' ? 'bg-brand-600 text-white' : 'text-txt-muted hover:text-txt-strong'"
          @click="switchMode('login')"
        >
          登录
        </button>
        <button
          class="flex-1 rounded-md py-2 text-sm font-medium transition"
          :class="mode === 'register' ? 'bg-brand-600 text-white' : 'text-txt-muted hover:text-txt-strong'"
          @click="switchMode('register')"
        >
          注册
        </button>
      </div>

      <form
        class="space-y-4"
        @submit.prevent="submit"
      >
        <div v-if="mode === 'register'">
          <label class="mb-1 block text-sm text-txt-muted">昵称</label>
          <input
            v-model="form.name"
            type="text"
            placeholder="你的昵称"
            class="w-full rounded-lg border border-ink-700 bg-ink-800 px-3 py-2.5 text-sm text-txt-body outline-none transition focus:border-brand-500"
          >
        </div>

        <div>
          <label class="mb-1 block text-sm text-txt-muted">邮箱</label>
          <input
            v-model="form.email"
            type="email"
            placeholder="you@example.com"
            class="w-full rounded-lg border border-ink-700 bg-ink-800 px-3 py-2.5 text-sm text-txt-body outline-none transition focus:border-brand-500"
          >
        </div>

        <div>
          <label class="mb-1 block text-sm text-txt-muted">密码</label>
          <input
            v-model="form.password"
            type="password"
            placeholder="至少 6 位"
            class="w-full rounded-lg border border-ink-700 bg-ink-800 px-3 py-2.5 text-sm text-txt-body outline-none transition focus:border-brand-500"
          >
        </div>

        <div v-if="mode === 'register'">
          <label class="mb-1 block text-sm text-txt-muted">确认密码</label>
          <input
            v-model="form.confirm"
            type="password"
            placeholder="再次输入密码"
            class="w-full rounded-lg border border-ink-700 bg-ink-800 px-3 py-2.5 text-sm text-txt-body outline-none transition focus:border-brand-500"
          >
        </div>

        <p
          v-if="error"
          class="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400"
        >
          {{ error }}
        </p>

        <button
          type="submit"
          class="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500"
        >
          {{ mode === 'login' ? '登录' : '注册' }}
        </button>
      </form>

      <p class="mt-4 text-center text-xs text-txt-faint">
        演示版登录，数据仅保存在内存中，刷新后重置
      </p>
    </div>
  </div>
</template>