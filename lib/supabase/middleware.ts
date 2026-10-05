import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// /api/cron/* authenticates itself via the CRON_SECRET bearer header (see app/api/cron/*/route.ts) —
// it has no user session to redirect-to-login on, and Vercel Cron can't follow a redirect anyway.
const PUBLIC_PATHS = ["/login", "/signup", "/auth/callback", "/auth/signout", "/api/cron"];

const AUTH_FORM_PATHS = ["/login", "/signup"];

// Refreshes the Supabase session cookie on every request, redirects
// unauthenticated visitors to /login, and keeps already-signed-in visitors
// off the login/signup forms.
export async function updateSession(request: NextRequest) {
  // Before README §10 step 2 wires up a Supabase project + /login, there's
  // nothing to refresh or gate yet — pass through rather than redirect-looping.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data } = await supabase.auth.getUser();
  const isPublic = PUBLIC_PATHS.some((p) => request.nextUrl.pathname.startsWith(p));

  if (!data.user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (data.user && AUTH_FORM_PATHS.some((p) => request.nextUrl.pathname.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
