import { and, asc, desc, eq, sql } from 'drizzle-orm'
import { Router } from 'express'
import { db } from '../../database/client.js'
import { businessPartners, partnerLocations } from '../../database/schema.js'
import { getOrganizationAuthContext, requireAuthentication, requirePlatformAdmin } from '../../middleware/authentication.js'
import { HttpError } from '../../shared/http-error.js'
import { createPartnerSchema, updatePartnerSchema } from './partner.schemas.js'

export const partnerRouter = Router()
partnerRouter.use(requireAuthentication, requirePlatformAdmin)

partnerRouter.get('/', async (_request, response) => {
  const auth = getOrganizationAuthContext(response)
  const data = await db.select({
    id: businessPartners.id,
    name: businessPartners.name,
    taxId: businessPartners.taxId,
    externalCode: businessPartners.externalCode,
    isSender: businessPartners.isSender,
    isRecipient: businessPartners.isRecipient,
    contactName: businessPartners.contactName,
    email: businessPartners.email,
    phone: businessPartners.phone,
    status: businessPartners.status,
    locations: sql<number>`count(${partnerLocations.id})::int`,
    createdAt: businessPartners.createdAt,
  }).from(businessPartners)
    .leftJoin(partnerLocations, eq(partnerLocations.partnerId, businessPartners.id))
    .where(eq(businessPartners.organizationId, auth.organizationId))
    .groupBy(businessPartners.id)
    .orderBy(desc(businessPartners.createdAt))
  response.json({ data })
})

partnerRouter.get('/:partnerId', async (request, response) => {
  const auth = getOrganizationAuthContext(response)
  const partnerId = String(request.params.partnerId)
  const [partner] = await db.select().from(businessPartners).where(and(
    eq(businessPartners.id, partnerId),
    eq(businessPartners.organizationId, auth.organizationId),
  ))
  if (!partner) throw new HttpError(404, 'PARTNER_NOT_FOUND', 'Interviniente no encontrado.')
  const locations = await db.select().from(partnerLocations).where(and(
    eq(partnerLocations.partnerId, partnerId),
    eq(partnerLocations.organizationId, auth.organizationId),
  )).orderBy(asc(partnerLocations.createdAt))
  response.json({ ...partner, locations })
})

partnerRouter.post('/', async (request, response) => {
  const auth = getOrganizationAuthContext(response)
  const input = createPartnerSchema.parse(request.body)
  const partner = await db.transaction(async (transaction) => {
    const [created] = await transaction.insert(businessPartners).values(partnerValues(auth.organizationId, input)).returning()
    if (!created) throw new Error('Partner creation returned no record.')
    if (input.locations.length) await transaction.insert(partnerLocations).values(
      input.locations.map((location) => locationValues(auth.organizationId, created.id, location)),
    )
    return created
  })
  response.status(201).json(partner)
})

partnerRouter.put('/:partnerId', async (request, response) => {
  const auth = getOrganizationAuthContext(response)
  const partnerId = String(request.params.partnerId)
  const input = updatePartnerSchema.parse(request.body)
  const partner = await db.transaction(async (transaction) => {
    const [updated] = await transaction.update(businessPartners)
      .set({ ...partnerValues(auth.organizationId, input), updatedAt: new Date() })
      .where(and(eq(businessPartners.id, partnerId), eq(businessPartners.organizationId, auth.organizationId)))
      .returning()
    if (!updated) throw new HttpError(404, 'PARTNER_NOT_FOUND', 'Interviniente no encontrado.')
    await transaction.delete(partnerLocations).where(and(
      eq(partnerLocations.partnerId, partnerId),
      eq(partnerLocations.organizationId, auth.organizationId),
    ))
    if (input.locations.length) await transaction.insert(partnerLocations).values(
      input.locations.map((location) => locationValues(auth.organizationId, partnerId, location)),
    )
    return updated
  })
  response.json(partner)
})

partnerRouter.delete('/:partnerId', async (request, response) => {
  const auth = getOrganizationAuthContext(response)
  const [deleted] = await db.delete(businessPartners).where(and(
    eq(businessPartners.id, String(request.params.partnerId)),
    eq(businessPartners.organizationId, auth.organizationId),
  )).returning({ id: businessPartners.id })
  if (!deleted) throw new HttpError(404, 'PARTNER_NOT_FOUND', 'Interviniente no encontrado.')
  response.status(204).send()
})

function nullable(value: string | null | undefined) {
  return value || null
}

function partnerValues(organizationId: string, input: ReturnType<typeof createPartnerSchema.parse>) {
  return {
    organizationId,
    name: input.name,
    taxId: nullable(input.taxId),
    externalCode: nullable(input.externalCode),
    isSender: input.isSender,
    isRecipient: input.isRecipient,
    contactName: nullable(input.contactName),
    email: nullable(input.email),
    phone: nullable(input.phone),
    status: input.status,
    notes: nullable(input.notes),
  }
}

function locationValues(organizationId: string, partnerId: string, location: ReturnType<typeof createPartnerSchema.parse>['locations'][number]) {
  return {
    organizationId,
    partnerId,
    name: location.name,
    address: location.address,
    postalCode: nullable(location.postalCode),
    city: location.city,
    province: nullable(location.province),
    country: location.country,
    latitude: location.latitude ?? null,
    longitude: location.longitude ?? null,
    receivingHours: nullable(location.receivingHours),
    serviceMinutes: location.serviceMinutes,
    instructions: nullable(location.instructions),
  }
}
