import { type NextRequest } from 'next/server'
import { updateSession } from './lib/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/pengaduan-bulanan/:path*",
    "/aktivitas-user/:path*",
    "/data-rekam/:path*",
    "/api/chat/:path*",
    "/api/selly/:path*",
  ],
};