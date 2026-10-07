import { and, asc, desc, eq, sql } from 'drizzle-orm'
import { Router } from 'express'
import { db } from '../../database/client.js'
import { businessPartners, productCodes, products } from '../../database/schema.js'
import { getOrganizationAuthContext, requireAuthentication, requirePermission, requirePlatformAdmin } from '../../middleware/authentication.js'
import { HttpError } from '../../shared/http-error.js'
import { createProductSchema, updateProductSchema } from './product.schemas.js'

export const productRouter = Router()
productRouter.use(requireAuthentication, requirePlatformAdmin, requirePermission('products.view'))

productRouter.get('/', async (_request, response) => {
  const auth = getOrganizationAuthContext(response)
  const data = await db.select({
    id: products.id,
    sku: products.sku,
    name: products.name,
    category: products.category,
    unit: products.unit,
    status: products.status,
    supplierId: products.supplierId,
    supplierName: businessPartners.name,
    codes: sql<number>`count(${productCodes.id})::int`,
    createdAt: products.createdAt,
  }).from(products)
    .leftJoin(businessPartners, eq(businessPartners.id, products.supplierId))
    .leftJoin(productCodes, eq(productCodes.productId, products.id))
    .where(eq(products.organizationId, auth.organizationId))
    .groupBy(products.id, businessPartners.id)
    .orderBy(desc(products.createdAt))
  response.json({ data })
})

productRouter.get('/:productId', async (request, response) => {
  const auth = getOrganizationAuthContext(response)
  const productId = String(request.params.productId)
  const [product] = await db.select().from(products).where(and(
    eq(products.id, productId),
    eq(products.organizationId, auth.organizationId),
  ))
  if (!product) throw new HttpError(404, 'PRODUCT_NOT_FOUND', 'Producto no encontrado.')
  const codes = await db.select().from(productCodes).where(and(
    eq(productCodes.productId, productId),
    eq(productCodes.organizationId, auth.organizationId),
  )).orderBy(desc(productCodes.isPrimary), asc(productCodes.createdAt))
  response.json({ ...product, codes })
})

productRouter.post('/', async (request, response) => {
  const auth = getOrganizationAuthContext(response)
  const input = createProductSchema.parse(request.body)
  await validateSupplier(auth.organizationId, input.supplierId)
  const product = await handleUniqueConflict(() => db.transaction(async (transaction) => {
      const [created] = await transaction.insert(products).values(productValues(auth.organizationId, input)).returning()
      if (!created) throw new Error('Product creation returned no record.')
      if (input.codes.length) await transaction.insert(productCodes).values(
        input.codes.map((code) => codeValues(auth.organizationId, created.id, code)),
      )
      return created
    }))
  response.status(201).json(product)
})

productRouter.put('/:productId', async (request, response) => {
  const auth = getOrganizationAuthContext(response)
  const productId = String(request.params.productId)
  const input = updateProductSchema.parse(request.body)
  await validateSupplier(auth.organizationId, input.supplierId)
  const product = await handleUniqueConflict(() => db.transaction(async (transaction) => {
    const [updated] = await transaction.update(products)
      .set({ ...productValues(auth.organizationId, input), updatedAt: new Date() })
      .where(and(eq(products.id, productId), eq(products.organizationId, auth.organizationId)))
      .returning()
    if (!updated) throw new HttpError(404, 'PRODUCT_NOT_FOUND', 'Producto no encontrado.')
    await transaction.delete(productCodes).where(and(
      eq(productCodes.productId, productId),
      eq(productCodes.organizationId, auth.organizationId),
    ))
    if (input.codes.length) await transaction.insert(productCodes).values(
      input.codes.map((code) => codeValues(auth.organizationId, productId, code)),
    )
      return updated
    }))
  response.json(product)
})

productRouter.delete('/:productId', async (request, response) => {
  const auth = getOrganizationAuthContext(response)
  const [deleted] = await db.delete(products).where(and(
    eq(products.id, String(request.params.productId)),
    eq(products.organizationId, auth.organizationId),
  )).returning({ id: products.id })
  if (!deleted) throw new HttpError(404, 'PRODUCT_NOT_FOUND', 'Producto no encontrado.')
  response.status(204).send()
})

async function validateSupplier(organizationId: string, supplierId: string | null | undefined) {
  if (!supplierId) return
  const [supplier] = await db.select({ id: businessPartners.id }).from(businessPartners).where(and(
    eq(businessPartners.id, supplierId),
    eq(businessPartners.organizationId, organizationId),
    eq(businessPartners.isSender, true),
  ))
  if (!supplier) throw new HttpError(400, 'INVALID_SUPPLIER', 'El proveedor no pertenece a la empresa o no está marcado como remitente.')
}

function nullable(value: string | null | undefined) {
  return value || null
}

function productValues(organizationId: string, input: ReturnType<typeof createProductSchema.parse>) {
  return {
    organizationId,
    supplierId: nullable(input.supplierId),
    sku: input.sku,
    name: input.name,
    description: nullable(input.description),
    category: nullable(input.category),
    unit: input.unit,
    weightKg: input.weightKg ?? null,
    lengthCm: input.lengthCm ?? null,
    widthCm: input.widthCm ?? null,
    heightCm: input.heightCm ?? null,
    status: input.status,
  }
}

function codeValues(organizationId: string, productId: string, code: ReturnType<typeof createProductSchema.parse>['codes'][number]) {
  return { organizationId, productId, code: code.code, type: code.type, isPrimary: code.isPrimary }
}

async function handleUniqueConflict<T>(operation: () => Promise<T>) {
  try {
    return await operation()
  } catch (error: unknown) {
    if ((error as { code?: string })?.code === '23505') {
      throw new HttpError(409, 'PRODUCT_ALREADY_EXISTS', 'El SKU o alguno de los códigos ya está registrado en la empresa.')
    }
    throw error
  }
}
