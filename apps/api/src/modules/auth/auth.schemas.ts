import { z } from 'zod'

const passwordSchema = z.string().min(12).max(128)

export const registerSchema = z.object({
  organizationName: z.string().trim().min(2).max(160),
  organizationSlug: z
    .string()
    .trim()
    .min(3)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(140),
  secondLastName: z.string().trim().min(1).max(140).optional(),
  username: z
    .string()
    .trim()
    .min(3)
    .max(50)
    .regex(/^[a-zA-Z0-9._-]+$/)
    .optional(),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().min(7).max(32).optional(),
  password: passwordSchema,
})

export const loginSchema = z.object({
  email: z.string().trim().max(320).optional(),
  identifier: z.string().trim().max(320).optional(),
  password: z.string().min(1).max(128),
  organizationSlug: z.string().trim().max(80).optional(),
}).refine((input) => input.email || input.identifier, { message: 'Email or username is required.' })

export const switchOrganizationSchema = z.object({
  organizationId: z.string().uuid(),
})
