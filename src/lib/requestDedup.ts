/**
 * Request deduplication utility for Zustand stores
 *
 * Prevents duplicate API requests when multiple components
 * call the same fetch method simultaneously.
 */

// Store in-flight promises by key
const inFlightRequests = new Map<string, Promise<unknown>>()

/**
 * Wraps an async function to deduplicate concurrent calls.
 * If a request with the same key is already in flight, returns the existing promise.
 *
 * @param key - Unique identifier for this request (e.g., 'fetchProjects')
 * @param fn - The async function to execute
 * @returns The result of the async function
 */
export async function dedup<T>(key: string, fn: () => Promise<T>): Promise<T> {
  // Check if there's already an in-flight request
  const existing = inFlightRequests.get(key)
  if (existing) {
    return existing as Promise<T>
  }

  // Create new request and track it
  const promise = fn().finally(() => {
    // Clean up when done (success or error)
    inFlightRequests.delete(key)
  })

  inFlightRequests.set(key, promise)
  return promise
}

/**
 * Creates a key for parameterized requests
 *
 * @param base - Base key name
 * @param params - Optional parameters to include in key
 * @returns Combined key string
 */
export function createDedupKey(base: string, params?: Record<string, unknown>): string {
  if (!params || Object.keys(params).length === 0) {
    return base
  }
  const paramStr = Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${String(v)}`)
    .join('&')
  return paramStr ? `${base}?${paramStr}` : base
}

/**
 * Clears all in-flight requests (useful for testing)
 */
export function clearInFlightRequests(): void {
  inFlightRequests.clear()
}
