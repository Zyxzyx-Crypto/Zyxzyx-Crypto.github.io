import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import PartsView from '@/views/PartsView.vue'
import BuildView from '@/views/BuildView.vue'
import PartDetailView from '@/views/PartDetailView.vue'
import LoginView from '@/views/LoginView.vue'

const router = createRouter({
  // 使用 hash 模式：兼容双击打开单文件 HTML（file:// 协议）与 dev 服务器
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/parts', name: 'parts', component: PartsView },
    { path: '/parts/:category', name: 'parts-category', component: PartsView },
    { path: '/part/:id', name: 'part-detail', component: PartDetailView },
    { path: '/build', name: 'build', component: BuildView },
    { path: '/login', name: 'login', component: LoginView },
  ],
  // 路由切换后回到页面顶部（避免停留在上一页的滚动位置）
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router