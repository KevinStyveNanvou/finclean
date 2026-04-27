import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')
  const { pathname } = request.nextUrl

  const publicPaths = ['/', '/login', '/register']
  const isPublic = publicPaths.some(p => pathname === p || pathname.startsWith(p + '/'))

  // Pages publiques : toujours laisser passer, token ou pas
  if (isPublic) {
    return NextResponse.next()
  }

  // Pages protégées sans token → login
  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname) // optionnel, pour redirect après login
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/register',
    '/dashboard/:path*',
    '/scans/:path*',
    '/profile/:path*',
    '/scan/:path*',
    '/exploitation/:path*',
  ],
}