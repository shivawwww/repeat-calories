import { NextResponse } from 'next/server'

export interface ApiResponseBody<T> {
  ErrorCode: '9999' | '9990'
  status: 'success' | 'fail'
  message: string
  obj: T | null
  count?: number
}

export function success<T>(message: string, obj: T, init?: { status?: number; count?: number }) {
  const body: ApiResponseBody<T> = { ErrorCode: '9999', status: 'success', message, obj }
  if (init?.count !== undefined) body.count = init.count
  return NextResponse.json(body, { status: init?.status ?? 200 })
}

export function fail(message: string, status = 400) {
  const body: ApiResponseBody<null> = { ErrorCode: '9990', status: 'fail', message, obj: null }
  return NextResponse.json(body, { status })
}
