// Client-side fetch wrapper around the { ErrorCode, status, message, obj, count }
// response envelope every Route Handler in this app returns (lib/apiResponse.ts).

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

interface Envelope<T> {
  ErrorCode: '9999' | '9990'
  status: string
  message: string
  obj: T | null
  count?: number
}

async function request<T>(path: string, options: RequestInit = {}): Promise<{ message: string; obj: T; count?: number }> {
  const res = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
  })

  let body: Envelope<T> | null = null
  try {
    body = await res.json()
  } catch {
    // non-JSON response (e.g. a proxy-level failure) — fall through to the generic error below
  }

  if (!res.ok || !body || body.ErrorCode !== '9999') {
    throw new ApiError(body?.message ?? `Request failed (${res.status})`, res.status)
  }

  return { message: body.message, obj: body.obj as T, count: body.count }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'POST', body: data !== undefined ? JSON.stringify(data) : undefined }),
  put: <T>(path: string, data?: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(data) }),
  patch: <T>(path: string, data?: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(data) }),
  del: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'DELETE', body: data !== undefined ? JSON.stringify(data) : undefined }),
}

// The DB layer keys every document by `_id` (types/db.ts); the frontend-facing
// models (types/models.ts) use `id`. These normalize raw API responses at the edge
// so the rest of the app only ever deals with `id`.
export function withId<T extends { _id: string }>(raw: T): Omit<T, '_id'> & { id: string } {
  const { _id, ...rest } = raw
  return { ...rest, id: _id }
}

export function withIds<T extends { _id: string }>(raw: T[]): (Omit<T, '_id'> & { id: string })[] {
  return raw.map(withId)
}
