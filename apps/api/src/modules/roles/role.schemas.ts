import { z } from 'zod'

const roleFields = {
  name: z.string().trim().min(2).max(80),
  code: z.string().trim().toLowerCase().min(2).max(40).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  permissions: z.array(z.string().trim().min(1).max(80)).max(50).default([]),
}

export const createCompanyRoleSchema = z.object(roleFields)
export const updateCompanyRoleSchema = z.object({
  name: roleFields.name,
  permissions: roleFields.permissions,
})
