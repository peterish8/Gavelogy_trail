import { NextResponse } from 'next/server'

export function middleware() {
  // Simple redirect logic without complex auth checks
  return NextResponse.next()
}

export const config = {
  matcher: []
}