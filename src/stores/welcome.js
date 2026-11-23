import { defineStore } from 'pinia'

// 欢迎页状态：用户是否已点击"进入网站"
// 首次进入显示欢迎页，点击进入后隐藏；配合音乐自动播放（点击即触发播放）
export const useWelcomeStore = defineStore('welcome', {
  state: () => ({
    entered: false,
  }),
  actions: {
    enter() {
      this.entered = true
    },
  },
})