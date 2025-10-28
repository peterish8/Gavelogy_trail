import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  // Simple redirect logic without complex auth checks
  return NextResponse.next()
}

export const config = {
  matcher: []
}