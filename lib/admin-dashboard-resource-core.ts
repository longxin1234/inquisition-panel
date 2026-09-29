export interface DashboardLoadOptions {
  force?: boolean
  now?: number
}

interface DashboardCacheEntry<T> {
  token: string
  data: T
  receivedAt: number
}

interface DashboardInFlightEntry<T> {
  token: string
  promise: Promise<T>
}

export function createAdminDashboardResource<T>(
  fetcher: (token: string) => Promise<T>,
  ttlMs = 15_000,
) {
  let cache: DashboardCacheEntry<T> | null = null
  let inFlight: DashboardInFlightEntry<T> | null = null

  const getSnapshot = (token: string): T | null => {
    if (!cache || cache.token !== token) return null
    return cache.data
  }

  const getCached = (token: string, now = Date.now()): T | null => {
    if (!cache || cache.token !== token || now - cache.receivedAt >= ttlMs) return null
    return cache.data
  }

  const load = (token: string, options: DashboardLoadOptions = {}): Promise<T> => {
    if (inFlight?.token === token) return inFlight.promise
    if (!options.force) {
      const cached = getCached(token, options.now)
      if (cached) return Promise.resolve(cached)
    }

    const promise = fetcher(token)
      .then((data) => {
        cache = { token, data, receivedAt: Date.now() }
        return data
      })
      .finally(() => {
        if (inFlight?.promise === promise) inFlight = null
      })
    inFlight = { token, promise }
    return promise
  }

  const clear = () => {
    cache = null
    inFlight = null
  }

  return { getSnapshot, getCached, load, clear }
}
