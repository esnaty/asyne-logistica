import { z } from 'zod'

export const autocompleteQuerySchema = z.object({
  q: z.string().trim().min(3).max(200),
})

export const lookupParamsSchema = z.object({
  id: z.string().trim().min(1).max(500),
})

export const reverseQuerySchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
})
