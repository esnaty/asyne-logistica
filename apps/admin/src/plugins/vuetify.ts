import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { es } from 'vuetify/locale'
import { lucideAliases, lucideSet } from './lucide-icons'

export default createVuetify({
  icons: { defaultSet: 'lucide', aliases: lucideAliases, sets: { lucide: lucideSet } },
  locale: { locale: 'es', fallback: 'es', messages: { es } },
  theme: {
    defaultTheme: 'asyneLight',
    themes: {
      asyneLight: {
        dark: false,
        colors: {
          primary: '#2563EB',
          'primary-dark': '#1E40AF',
          secondary: '#0891B2',
          success: '#16A34A',
          warning: '#F59E0B',
          surface: '#FFFFFF',
          background: '#F8FAFC',
          error: '#DC2626',
          danger: '#DC2626',
          'text-primary': '#0F172A',
          'text-secondary': '#64748B',
          border: '#E2E8F0',
        },
      },
    },
  },
  defaults: {
    VBtn: { variant: 'flat' },
    VTextField: { density: 'compact', variant: 'outlined', hideDetails: 'auto' },
    VTextarea: { density: 'compact', variant: 'outlined', hideDetails: 'auto' },
    VSelect: { density: 'compact', variant: 'outlined', hideDetails: 'auto' },
    VAutocomplete: { density: 'compact', variant: 'outlined', hideDetails: 'auto' },
    VCombobox: { density: 'compact', variant: 'outlined', hideDetails: 'auto' },
    VFileInput: { density: 'compact', variant: 'outlined', hideDetails: 'auto' },
  },
})
