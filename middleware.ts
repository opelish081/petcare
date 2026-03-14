// middleware.ts — จัดการ Auth guard และ i18n routing
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'

const locales = ['th', 'en']
const defaultLocale = 'th'
const protectedRoutes = ['/dashboard', '/pets', '/appointments', '/calendar', '/profile']

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
})

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  if (pathname.startsWith('/_next') || pathname.startsWith('/api/cron')) {
    return NextResponse.next()
  }

  // จัดการ Supabase Auth Error
  const errorCode = searchParams.get('error_code')
  const errorType = searchParams.get('error')
  if (errorCode || errorType === 'access_denied') {
    const locale = pathname.split('/')[1] || defaultLocale
    const validLocale = locales.includes(locale) ? locale : defaultLocale
    const loginUrl = new URL(`/${validLocale}/login`, request.url)
    loginUrl.searchParams.set('message', 'link_expired')
    return NextResponse.redirect(loginUrl)
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isProtected = protectedRoutes.some(route => pathname.includes(route))

  if (!user && isProtected) {
    const locale = pathname.split('/')[1] || defaultLocale
    const loginUrl = new URL(`/${locale}/login`, request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (user && (pathname.includes('/login') || pathname.includes('/register'))) {
    const locale = pathname.split('/')[1] || defaultLocale
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url))
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
