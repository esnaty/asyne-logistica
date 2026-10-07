import { defineStore } from 'pinia'
import { setAccessToken } from '../services/access-token'
import { http, renewAccessToken } from '../services/http'
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

interface AuthUser {
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

interface ActiveOrganization {
  id: string
  name: string
  slug: string
  role: string
  roleName: string
  permissions: string[]
  logoUrl: string | null
  primaryColor: string
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
    user: null as AuthUser | null,
    activeOrganization: null as ActiveOrganization | null,
    navigation: [] as NavigationItem[],
    initialized: false,
  }),
  getters: {
    isAuthenticated: (state) => state.user !== null && state.activeOrganization !== null,
    isSuperuser: (state) => state.user?.platformRole === 'superuser',
    hasPermission: (state) => (permission: string) =>
      state.user?.platformRole === 'superuser' || state.navigation.some((item) => item.code === permission),
  },
  actions: {
    async loadSession() {
      try {
        await renewAccessToken()
        const { data } = await http.get<{
          user: AuthUser
          activeOrganization: ActiveOrganization | null
          navigation: NavigationItem[]
        }>('/auth/me')
        this.user = data.user
        this.activeOrganization = data.activeOrganization
        this.navigation = data.navigation
        applyCompanyColor(data.activeOrganization?.primaryColor)
      } catch {
        setAccessToken(null)
        this.user = null
        this.activeOrganization = null
        this.navigation = []
        applyCompanyColor()
      } finally {
        this.initialized = true
      }
    },
    async login(email: string, password: string) {
      const { data } = await http.post<{ accessToken: string }>('/auth/login', { email, password })
      setAccessToken(data.accessToken)
      await this.loadSession()
      if (!this.activeOrganization) {
        await this.logout()
        throw new Error('ACTIVE_ORGANIZATION_REQUIRED')
      }
    },
    async logout() {
      await http.post('/auth/logout')
      setAccessToken(null)
      this.user = null
      this.activeOrganization = null
      this.navigation = []
      this.initialized = true
    },
  },
})
