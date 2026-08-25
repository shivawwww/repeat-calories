import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Next.js 16 renamed the middleware file convention to `proxy` — this replaces
// what would have been `middleware.ts` in earlier versions.

const PUBLIC_PATHS = ['/', '/login', '/signup', '/activate', '/forgot', '/reset-password']
const PUBLIC_API_PREFIXES = ['/api/auth', '/api/webhook', '/api/firebase-sw']
const PUBLIC_GET_API_PREFIXES = ['/api/menu'] // customer menu browsing — public, GET only

function unauthorized(message: string, status: number) {
  return NextResponse.json({ ErrorCode: '9990', status: 'fail', message, obj: null }, { status })
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next()
  if (PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next()
  if (request.method === 'GET' && PUBLIC_GET_API_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

  if (!token) {
    if (pathname.startsWith('/api')) return unauthorized('Unauthorized', 401)
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/api/admin')
  if (isAdminRoute && !token.is_admin) {
    if (pathname.startsWith('/api')) return unauthorized('Forbidden', 403)
    return NextResponse.redirect(new URL('/menu', request.url))
  }

  return NextResponse.next()
}

export const config = {
  // Excludes framework internals plus any request for a static file (by extension) —
  // public/ assets like logo.png or brand/*.jpg must be fetchable without a session,
  // otherwise next/image's optimizer (which never sends the auth cookie) gets a 307
  // redirect to /login instead of image bytes and fails with "not a valid image".
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|firebase-messaging-sw.js|.*\\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|css|js|map|txt|xml|json|woff2?|ttf)$).*)',
  ],
}
