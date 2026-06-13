import { createServerClient, type CookieOptions } from "@supabase/ssr"; // ✅ type CookieOptions ထပ်ထည့်
import { cookies } from "next/headers";

/**
 * Server-side Supabase client bound to the request cookies.
 * Use in Server Components, Route Handlers, and Server Actions.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) { // ✅ type ထည့်ပြီ
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if there is middleware refreshing sessions.
          }
        },
      },
    }
  );
}

/**
 * Service-role Supabase client — BYPASSES Row Level Security.
 * ONLY use inside server route handlers for privileged operations
 * (admin actions, credit deduction, writing on behalf of the user).
 * Never expose the service role key to the browser.
 */
export function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // no-op: service client is stateless
        },
      },
    }
  );
}