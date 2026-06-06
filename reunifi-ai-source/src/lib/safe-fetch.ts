/**
 * Safe fetch utilities that handle common API errors gracefully.
 * Prevents "Unexpected token '<'" errors when the server returns HTML
 * instead of JSON (e.g., when the server is down or returning error pages).
 */

export class ApiError extends Error {
  status: number
  data: Record<string, unknown> | null

  constructor(message: string, status: number, data: Record<string, unknown> | null = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

/**
 * Safely parse a fetch Response as JSON.
 * Throws a user-friendly error if the response is not JSON (e.g., HTML error page).
 */
export async function safeJsonParse<T = Record<string, unknown>>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')

  if (isJson) {
    return res.json() as Promise<T>
  }

  // Response is not JSON — likely an HTML error page or server is down
  if (!res.ok) {
    if (res.status === 0 || res.type === 'error') {
      throw new ApiError(
        'Unable to connect to the server. Please check your internet connection and try again.',
        0
      )
    }
    throw new ApiError(
      `Server error (${res.status}). The service may be temporarily unavailable. Please try again in a moment.`,
      res.status
    )
  }

  // Response was OK but not JSON — shouldn't happen but handle gracefully
  throw new ApiError(
    'Received an unexpected response from the server. Please try again.',
    res.status
  )
}

/**
 * Safe fetch wrapper that handles JSON parsing errors gracefully.
 * Use this for all API calls in the application.
 */
export async function safeFetch<T = Record<string, unknown>>(
  url: string,
  options?: RequestInit
): Promise<{ data: T; response: Response }> {
  let res: Response

  try {
    res = await fetch(url, options)
  } catch (networkError) {
    // Network error — server unreachable, CORS, DNS failure, etc.
    throw new ApiError(
      'Unable to connect to the server. Please check your connection and try again.',
      0
    )
  }

  const data = await safeJsonParse<T>(res)

  if (!res.ok) {
    const errorData = data as Record<string, unknown>
    throw new ApiError(
      (errorData.error as string) || `Request failed with status ${res.status}`,
      res.status,
      errorData
    )
  }

  return { data, response: res }
}

/**
 * Check if the API server is reachable.
 * Returns true if the server responds, false otherwise.
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const res = await fetch('/api/auth', {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    })
    return res.ok || res.status === 200
  } catch {
    return false
  }
}
