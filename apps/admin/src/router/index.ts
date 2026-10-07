import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'
import OrdersView from '../views/OrdersView.vue'
import CompanyView from '../views/CompanyView.vue'
import LoginView from '../views/LoginView.vue'
import SessionsView from '../views/SessionsView.vue'
import UsersView from '../views/UsersView.vue'
import CompanyFormView from '../views/CompanyFormView.vue'
import UserFormView from '../views/UserFormView.vue'
import RolesView from '../views/RolesView.vue'
import RoleFormView from '../views/RoleFormView.vue'
import OperationalView from '../views/OperationalView.vue'
import PartnersView from '../views/PartnersView.vue'
import PartnerFormView from '../views/PartnerFormView.vue'
import ProductsView from '../views/ProductsView.vue'
import ProductFormView from '../views/ProductFormView.vue'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'dashboard', component: DashboardView, meta: { permission: 'dashboard.view' } },
    { path: '/orders', name: 'orders', component: OrdersView, meta: { permission: 'orders.view' } },
    { path: '/partners', name: 'partners', component: PartnersView, meta: { permission: 'partners.view' } },
    { path: '/partners/form/:id?', name: 'partner-form', component: PartnerFormView, meta: { permission: 'partners.view' } },
    { path: '/products', name: 'products', component: ProductsView, meta: { permission: 'products.view' } },
    { path: '/products/form/:id?', name: 'product-form', component: ProductFormView, meta: { permission: 'products.view' } },
    { path: '/routes', name: 'routes', component: OperationalView, meta: { permission: 'routes.view', title: 'Rutas', description: 'Planificación y seguimiento de rutas.' } },
    { path: '/company', name: 'company', component: CompanyView },
    { path: '/company/form/:id?', name: 'company-form', component: CompanyFormView },
    { path: '/users', name: 'users', component: UsersView, meta: { permission: 'users.view' } },
    { path: '/users/form/:id?', name: 'user-form', component: UserFormView, meta: { permission: 'users.view' } },
    { path: '/sessions', name: 'sessions', component: SessionsView, meta: { permission: 'sessions.view' } },
    { path: '/roles', name: 'roles', component: RolesView, meta: { permission: 'roles.view' } },
    { path: '/roles/form/:code?', name: 'role-form', component: RoleFormView, meta: { permission: 'roles.view' } },
    { path: '/login', name: 'login', component: LoginView, meta: { public: true } },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (!auth.initialized) await auth.loadSession()
  const firstAllowedPath = auth.navigation.find((item) => item.application === 'admin')?.path

  if (!to.meta.public && (!auth.isAuthenticated || !auth.canAccessAdmin)) return { name: 'login' }
  if ((to.name === 'company' || to.name === 'company-form') && !auth.isSuperuser) {
    return firstAllowedPath || false
  }
  if (typeof to.meta.permission === 'string' && !auth.hasPermission(to.meta.permission)) {
    if (!firstAllowedPath || firstAllowedPath === to.path) return false
    return firstAllowedPath
  }
  if (to.meta.public && auth.isAuthenticated) return firstAllowedPath || false
})

export default router
