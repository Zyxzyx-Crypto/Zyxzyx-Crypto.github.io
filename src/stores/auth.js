import { defineStore } from 'pinia'

// 登录状态（纯前端演示版，不接入后端，不持久化）
// 仅用于展示登录/注册界面交互；真实项目需接入后端与鉴权
export const useAuthStore = defineStore('auth', {
  state: () => ({
    // 当前登录用户（null 表示未登录）
    user: null,
    // 模拟注册的用户库（仅内存）
    registered: [],
  }),
  getters: {
    isLoggedIn: (state) => !!state.user,
  },
  actions: {
    // 模拟登录：如果该邮箱已注册且密码匹配则成功；否则视为"账号或密码错误"
    login(email, password) {
      const found = this.registered.find((u) => u.email === email)
      if (!found) return { ok: false, msg: '该邮箱尚未注册' }
      if (found.password !== password) return { ok: false, msg: '密码错误' }
      this.user = { email: found.email, name: found.name }
      return { ok: true }
    },
    // 模拟注册
    register(name, email, password) {
      if (this.registered.some((u) => u.email === email)) {
        return { ok: false, msg: '该邮箱已被注册' }
      }
      this.registered.push({ name, email, password })
      this.user = { email, name }
      return { ok: true }
    },
    logout() {
      this.user = null
    },
  },
})