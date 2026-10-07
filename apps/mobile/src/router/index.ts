import { createRouter, createWebHistory } from 'vue-router'
import WorkView from '../views/WorkView.vue'
import RouteView from '../views/RouteView.vue'
import LoginView from '../views/LoginView.vue'
import ProfileView from '../views/ProfileView.vue'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'work', component: WorkView, meta: { permission: 'mobile.work.view' } },
    { path: '/route', name: 'route', component: RouteView, meta: { permission: 'mobile.route.view' } },
    { path: '/profile', name: 'profile', component: ProfileView },
    { path: '/login', name: 'login', component: LoginView, meta: { public: true } },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (!auth.initialized) await auth.loadSession()
  if (!to.meta.public && !auth.isAuthenticated) return { name: 'login' }
  if (typeof to.meta.permission === 'string' && !auth.hasPermission(to.meta.permission)) {
    const fallback = auth.navigation.find((item) => item.application === 'mobile')
    if (!fallback || fallback.path === to.path) return false
    return fallback.path
  }
  if (to.meta.public && auth.isAuthenticated) {
    return auth.navigation.find((item) => item.application === 'mobile')?.path || false
  }
})

export default router
