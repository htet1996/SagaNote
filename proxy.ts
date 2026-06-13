import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes that require an authenticated session.
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/recorder",
  "/transcriptions",
  "/agent",
  "/notes",
  "/workspace",
  "/credits",
  "/settings",
  "/help",
  "/admin",
];

/**
 * Next.js 16 middleware.
 * IMPORTANT: the file must be named `proxy.ts` and the export named `proxy`.
 *
 * Performance: we ONLY contact Supabase (a network round-trip) when the request
 * actually needs an auth decision — i.e. a protected route or the /login page.
 * Public pages, API routes, and RSC prefetches skip the round-trip entirely.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  const isLogin = pathname === "/login";

  // Nothing to decide here — don't pay for a Supabase call.
  if (!isProtected && !isLogin) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — required for SSR auth to stay valid.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Unauthenticated user trying to access a protected route → /login
  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user on /login → /dashboard
  if (isLogin && user) {
    const dashUrl = request.nextUrl.clone();
    dashUrl.pathname = "/dashboard";
    dashUrl.search = "";
    return NextResponse.redirect(dashUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (they do their own auth; no need for a middleware round-trip)
     * - _next/static, _next/image (build assets)
     * - favicon, manifest, robots
     * - public files with an extension (images, svgs, etc.)
     * - the auth callback route (handled separately)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icons|logo|payment-qr|auth/callback|.*\\..*).*)",
  ],
};
