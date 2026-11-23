import { defineStore } from 'pinia'

// 主题状态：深色（默认）/ 浅色
// 通过给 <html> 加 theme-light class 触发 CSS 变量切换
export const useThemeStore = defineStore('theme', {
  state: () => ({
    isLight: false,
  }),
  actions: {
    toggle() {
      this.isLight = !this.isLight
      this.apply()
    },
    apply() {
      const root = document.documentElement
      if (this.isLight) {
        root.classList.add('theme-light')
      } else {
        root.classList.remove('theme-light')
      }
    },
    init() {
      this.apply()
    },
  },
})