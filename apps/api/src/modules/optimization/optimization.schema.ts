import { z } from 'zod'

const coordinateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
})

export const optimizeRouteSchema = z.object({
  depot: coordinateSchema,
  stops: z
    .array(
      coordinateSchema.extend({
        id: z.string().min(1),
        demand: z.number().int().nonnegative().default(1),
        serviceMinutes: z.number().int().nonnegative().default(5),
      }),
    )
    .min(1),
  vehicles: z
    .array(
      z.object({
        id: z.string().min(1),
        capacity: z.number().int().positive(),
      }),
    )
    .min(1),
})
