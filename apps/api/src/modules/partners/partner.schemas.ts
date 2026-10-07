import { z } from 'zod'

const optionalText = (max: number) => z.union([z.string().trim().max(max), z.literal(''), z.null()]).optional()

const locationSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(140),
  address: z.string().trim().min(4).max(240),
  postalCode: optionalText(20),
  city: z.string().trim().min(2).max(120),
  province: optionalText(120),
  country: z.string().trim().toUpperCase().length(2).default('ES'),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  receivingHours: optionalText(180),
  serviceMinutes: z.number().int().min(0).max(1440).default(10),
  instructions: optionalText(2000),
}).refine((value) => (value.latitude == null) === (value.longitude == null), {
  message: 'Indica latitud y longitud juntas.',
  path: ['latitude'],
})

const partnerFields = {
  name: z.string().trim().min(2).max(180),
  taxId: optionalText(40),
  externalCode: optionalText(80),
  isSender: z.boolean(),
  isRecipient: z.boolean(),
  contactName: optionalText(160),
  email: z.union([z.string().trim().email().max(320), z.literal(''), z.null()]).optional(),
  phone: optionalText(32),
  status: z.enum(['active', 'inactive']),
  notes: optionalText(4000),
  locations: z.array(locationSchema).max(50),
}

export const createPartnerSchema = z.object(partnerFields).refine((value) => value.isSender || value.isRecipient, {
  message: 'Selecciona remitente, destinatario o ambos.',
  path: ['isSender'],
})

export const updatePartnerSchema = createPartnerSchema
