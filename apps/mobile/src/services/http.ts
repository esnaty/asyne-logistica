import axios from 'axios'
import { getAccessToken, setAccessToken } from './access-token'

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'
const refreshClient = axios.create({ baseURL, withCredentials: true, timeout: 15_000 })

export const http = axios.create({
  baseURL,
  timeout: 15_000,
  withCredentials: true,
  headers: { Accept: 'application/json' },
})

http.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let refreshPromise: Promise<string> | null = null

export async function renewAccessToken() {
  refreshPromise ??= refreshClient
    .post<{ accessToken: string }>('/auth/access-token')
    .then(({ data }) => {
      setAccessToken(data.accessToken)
      return data.accessToken
    })
    .finally(() => {
      refreshPromise = null
    })
  return refreshPromise
}

http.interceptors.response.use(undefined, async (error) => {
  const config = error.config as (typeof error.config & { _asyneRetried?: boolean }) | undefined
  if (
    error.response?.status !== 401 ||
    !config ||
    config._asyneRetried ||
    config.url?.includes('/auth/login') ||
    config.url?.includes('/auth/access-token')
  ) {
    throw error
  }
  config._asyneRetried = true
  const token = await renewAccessToken()
  config.headers.Authorization = `Bearer ${token}`
  return http.request(config)
})
