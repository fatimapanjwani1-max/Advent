import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError) {
    console.error('[Middleware] Auth user error:', userError);
  }

  // 1. Protected routes logic
  const isAuthPage = request.nextUrl.pathname.startsWith('/login');
  const isProtectedRoute = !isAuthPage && !request.nextUrl.pathname.startsWith('/_next') && request.nextUrl.pathname !== '/favicon.ico';

  console.log(`[Middleware] Path: ${request.nextUrl.pathname}, User: ${user?.id || 'none'}, Protected: ${isProtectedRoute}`);

  if (!user && isProtectedRoute) {
    console.log('[Middleware] Redirecting to /login - No session');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (user && isAuthPage) {
    console.log('[Middleware] Redirecting to / - Already logged in');
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 2. Role-based access
  if (user && isProtectedRoute) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('[Middleware] Profile fetch error:', profileError);
    }

    const path = request.nextUrl.pathname;
    
    // Admin/PM only routes
    if (path.startsWith('/admin') && profile?.role === 'client') {
      console.log(`[Middleware] Unauthorized role ${profile?.role} for path ${path}`);
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return response;
}
