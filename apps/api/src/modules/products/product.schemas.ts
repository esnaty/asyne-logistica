import { z } from 'zod'

const optionalText = (max: number) => z.union([z.string().trim().max(max), z.literal(''), z.null()]).optional()
const optionalMeasure = z.number().finite().positive().max(1_000_000).nullable().optional()

const productCodeSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().trim().min(2).max(160),
  type: z.enum(['barcode', 'qr', 'supplier', 'other']),
  isPrimary: z.boolean().default(false),
})

const productFields = {
  supplierId: z.union([z.string().uuid(), z.literal(''), z.null()]).optional(),
  sku: z.string().trim().min(2).max(80),
  name: z.string().trim().min(2).max(180),
  description: optionalText(4000),
  category: optionalText(120),
  unit: z.enum(['unit', 'box', 'tire', 'pallet', 'kilogram', 'liter']),
  weightKg: optionalMeasure,
  lengthCm: optionalMeasure,
  widthCm: optionalMeasure,
  heightCm: optionalMeasure,
  status: z.enum(['active', 'inactive']),
  codes: z.array(productCodeSchema).max(30),
}

export const createProductSchema = z.object(productFields).superRefine((value, context) => {
  const normalizedCodes = value.codes.map((item) => item.code.toLowerCase())
  if (new Set(normalizedCodes).size !== normalizedCodes.length) {
    context.addIssue({ code: 'custom', path: ['codes'], message: 'No puedes repetir códigos en el mismo producto.' })
  }
  if (value.codes.filter((item) => item.isPrimary).length > 1) {
    context.addIssue({ code: 'custom', path: ['codes'], message: 'Solo puede haber un código principal.' })
  }
})

export const updateProductSchema = createProductSchema
