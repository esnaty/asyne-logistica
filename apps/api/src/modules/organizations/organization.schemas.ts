import { z } from 'zod'

export const updateOrganizationSchema = z
  .object({
    name: z.string().trim().min(2).max(160).optional(),
  })
  .refine((value) => value.name !== undefined, { message: 'At least one field is required.' })
