import { Router } from 'express'
import { env } from '../../config/env.js'
import { requireAuthentication, requirePlatformAdmin } from '../../middleware/authentication.js'
import { HttpError } from '../../shared/http-error.js'
import { autocompleteQuerySchema, lookupParamsSchema, reverseQuerySchema } from './geocoding.schemas.js'

interface GeoapifyProperties {
  place_id?: string
  formatted?: string
  address_line1?: string
  postcode?: string
  city?: string
  town?: string
  village?: string
  municipality?: string
  state?: string
  county?: string
  country_code?: string
  lat?: number
  lon?: number
  rank?: { confidence?: number }
  result_type?: string
}

interface GeoapifyFeature {
  properties?: GeoapifyProperties
  geometry?: { coordinates?: [number, number] }
}

interface GeoapifyFeatureCollection {
  features?: GeoapifyFeature[]
}

export const geocodingRouter = Router()
geocodingRouter.use(requireAuthentication, requirePlatformAdmin)

geocodingRouter.get('/autocomplete', async (request, response) => {
  const { q } = autocompleteQuerySchema.parse(request.query)
  const data = await geoapifyRequest<GeoapifyFeatureCollection>(geoapifyUrl('/v1/geocode/autocomplete', {
    text: q,
    filter: 'countrycode:es',
    lang: 'es',
    format: 'geojson',
    limit: '8',
  }))
  response.json({
    data: (data.features ?? []).flatMap((feature) => {
      const properties = feature.properties
      if (!properties?.place_id) return []
      return [{
        id: properties.place_id,
        title: properties.formatted ?? properties.address_line1 ?? '',
        resultType: properties.result_type,
        ...normalizeLocation(feature),
      }]
    }),
  })
})

geocodingRouter.get('/lookup/:id', async (request, response) => {
  const { id } = lookupParamsSchema.parse(request.params)
  const data = await geoapifyRequest<GeoapifyFeatureCollection>(geoapifyUrl('/v2/place-details', {
    id,
    lang: 'es',
  }))
  const feature = data.features?.[0]
  if (!feature) throw new HttpError(404, 'ADDRESS_NOT_FOUND', 'No se encontró la dirección seleccionada.')
  response.json(normalizeLocation(feature))
})

geocodingRouter.get('/reverse', async (request, response) => {
  const input = reverseQuerySchema.parse(request.query)
  const data = await geoapifyRequest<GeoapifyFeatureCollection>(geoapifyUrl('/v1/geocode/reverse', {
    lat: String(input.latitude),
    lon: String(input.longitude),
    lang: 'es',
    format: 'geojson',
    limit: '1',
  }))
  const feature = data.features?.[0]
  if (!feature) throw new HttpError(404, 'ADDRESS_NOT_FOUND', 'No se encontró una dirección cercana.')
  response.json(normalizeLocation(feature, { latitude: input.latitude, longitude: input.longitude }))
})

function geoapifyUrl(path: string, params: Record<string, string>) {
  if (!env.GEOAPIFY_API_KEY) {
    throw new HttpError(503, 'GEOCODING_NOT_CONFIGURED', 'Configura GEOAPIFY_API_KEY para usar la búsqueda de direcciones.')
  }
  const url = new URL(path, 'https://api.geoapify.com')
  Object.entries({ ...params, apiKey: env.GEOAPIFY_API_KEY }).forEach(([key, value]) => url.searchParams.set(key, value))
  return url
}

async function geoapifyRequest<T>(url: URL): Promise<T> {
  const response = await fetch(url, { signal: AbortSignal.timeout(8_000) })
  if (!response.ok) throw new HttpError(502, 'GEOCODING_PROVIDER_ERROR', 'El proveedor de geocodificación no respondió correctamente.')
  return response.json() as Promise<T>
}

function normalizeLocation(feature: GeoapifyFeature, selected?: { latitude: number; longitude: number }) {
  const properties = feature.properties ?? {}
  const coordinates = feature.geometry?.coordinates
  const latitude = properties.lat ?? coordinates?.[1]
  const longitude = properties.lon ?? coordinates?.[0]
  if ((latitude === undefined || longitude === undefined) && !selected) {
    throw new HttpError(404, 'POSITION_NOT_FOUND', 'El resultado no contiene coordenadas.')
  }
  return {
    providerPlaceId: properties.place_id ?? null,
    address: properties.address_line1 ?? properties.formatted ?? '',
    formattedAddress: properties.formatted ?? '',
    postalCode: properties.postcode ?? '',
    city: properties.city ?? properties.town ?? properties.village ?? properties.municipality ?? '',
    province: properties.state ?? properties.county ?? '',
    country: properties.country_code?.toUpperCase() ?? 'ES',
    latitude: selected?.latitude ?? latitude,
    longitude: selected?.longitude ?? longitude,
    precision: properties.result_type ?? properties.rank?.confidence ?? null,
  }
}
