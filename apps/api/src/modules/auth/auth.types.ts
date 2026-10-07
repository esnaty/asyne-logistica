export type MembershipRole = string

export interface AuthContext {
  sessionId: string
  userId: string
  email: string
  username: string
  firstName: string
  lastName: string
  secondLastName: string | null
  phone: string | null
  avatarUrl: string | null
  platformRole: 'user' | 'admin' | 'superuser'
  organizationId: string | null
  organizationName: string | null
  organizationSlug: string | null
  organizationLogoUrl: string | null
  organizationPrimaryColor: string | null
  role: MembershipRole | null
  roleName: string | null
  permissions: string[]
}
