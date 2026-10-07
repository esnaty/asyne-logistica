import { defineStore } from 'pinia'
import { http } from '../services/http'
import { renewAccessToken } from '../services/http'
import { setAccessToken } from '../services/access-token'
import vuetify from '../plugins/vuetify'

function applyCompanyColor(color?: string | null) {
  const theme = vuetify.theme.themes.value.asyneLight
  const primary = color || '#2563EB'

  if (theme?.colors) {
    theme.colors.primary = primary
    theme.colors['primary-dark'] = darkenHexColor(primary, 0.28)
  }
}

function darkenHexColor(color: string, amount: number) {
  const match = /^#([0-9a-f]{6})$/i.exec(color)
  if (!match) return '#1E40AF'

  const value = Number.parseInt(match[1]!, 16)
  const channel = (shift: number) => Math.round(((value >> shift) & 0xff) * (1 - amount))

  return `#${[channel(16), channel(8), channel(0)]
    .map((component) => component.toString(16).padStart(2, '0'))
    .join('')}`
}

interface User {
  id: string
  email: string
  username: string
  firstName: string
  lastName: string
  secondLastName: string | null
  phone: string | null
  avatarUrl: string | null
  platformRole: 'user' | 'admin' | 'superuser'
}

interface Organization {
  id: string
  name: string
  slug: string
  role: string
  roleName: string
  permissions: string[]
  logoUrl: string | null
  primaryColor: string
}

interface AuthResponse {
  user: User
  activeOrganization: Organization | null
  organizations: Organization[]
  navigation: NavigationItem[]
}

export interface NavigationItem {
  code: string
  application: 'admin' | 'mobile'
  menuLabel: string
  path: string
  icon: string
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    activeOrganization: null as Organization | null,
    organizations: [] as Organization[],
    navigation: [] as NavigationItem[],
    initialized: false,
  }),
  getters: {
    isAuthenticated: (state) => state.user !== null,
    isSuperuser: (state) => state.user?.platformRole === 'superuser',
    isPlatformAdmin: (state) => state.user?.platformRole === 'admin',
    canAccessAdmin: (state) =>
      state.user?.platformRole === 'superuser' || state.user?.platformRole === 'admin',
    hasPermission: (state) => (permission: string) =>
      state.user?.platformRole === 'superuser' || state.navigation.some((item) => item.code === permission),
  },
  actions: {
    async loadSession() {
      try {
        await renewAccessToken()
        const { data } = await http.get<AuthResponse>('/auth/me')
        this.user = data.user
        this.activeOrganization = data.activeOrganization
        this.organizations = data.organizations
        this.navigation = data.navigation
        applyCompanyColor(data.activeOrganization?.primaryColor)
      } catch {
        setAccessToken(null)
        this.user = null
        this.activeOrganization = null
        this.organizations = []
        this.navigation = []
        applyCompanyColor()
      } finally {
        this.initialized = true
      }
    },
    async login(payload: { email: string; password: string }) {
      const { data } = await http.post<{ accessToken: string }>('/auth/login', payload)
      setAccessToken(data.accessToken)
      await this.loadSession()
      if (!this.canAccessAdmin) {
        await this.logout()
        throw new Error('ADMIN_REQUIRED')
      }
    },
    async register(payload: {
      organizationName: string
      firstName: string
      lastName: string
      email: string
      password: string
    }) {
      const { data } = await http.post<{ accessToken: string }>('/auth/register', payload)
      setAccessToken(data.accessToken)
      await this.loadSession()
    },
    async logout() {
      await http.post('/auth/logout')
      setAccessToken(null)
      this.$reset()
      this.initialized = true
    },
  },
})
