import { z } from 'zod'

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Usa solo letras, números y guiones.',
  })
const optionalPhoneSchema = z.union([z.string().trim().min(7).max(32), z.literal(''), z.null()]).optional()
const optionalImageSchema = z.union([z.string().trim().url().max(2000), z.string().trim().regex(/^(avatar|logo)-[a-f0-9-]+\.(jpg|png|webp)$/), z.literal(''), z.null()]).optional()
const colorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/)

export const createPlatformOrganizationSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: slugSchema,
  status: z.enum(['active', 'suspended']).default('active'),
  logoUrl: optionalImageSchema,
  primaryColor: colorSchema.default('#2563EB'),
})

export const updatePlatformOrganizationSchema = z
  .object({
    name: z.string().trim().min(2).max(160).optional(),
    slug: slugSchema.optional(),
    status: z.enum(['active', 'suspended']).optional(),
    logoUrl: optionalImageSchema,
    primaryColor: colorSchema.optional(),
  })
  .refine((input) => Object.values(input).some((value) => value !== undefined), {
    message: 'At least one field is required.',
  })

const platformUserFields = {
  firstName: z.string().trim().min(2).max(100),
  lastName: z.string().trim().min(2).max(140),
  secondLastName: z.union([z.string().trim().max(140), z.literal(''), z.null()]).optional(),
  username: z.string().trim().min(3).max(50).regex(/^[a-zA-Z0-9._-]+$/),
  email: z.string().trim().email().max(320),
  phone: optionalPhoneSchema,
  avatarUrl: optionalImageSchema,
  status: z.enum(['active', 'disabled']),
  platformRole: z.enum(['user', 'admin', 'superuser']),
  organizationId: z.string().uuid(),
  role: z.string().trim().min(2).max(40).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
}

export const createPlatformUserSchema = z.object({
  ...platformUserFields,
  password: z.string().min(10).max(128),
})

export const updatePlatformUserSchema = z.object({
  ...platformUserFields,
  password: z.union([z.string().min(10).max(128), z.literal('')]).optional(),
})
