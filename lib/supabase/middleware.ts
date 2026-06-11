import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
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
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // API routes handle their own auth; don't redirect them to login pages
  if (pathname.startsWith("/api/")) {
    return supabaseResponse;
  }

  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/verify-email") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password");

  if (!user && !isAuthRoute && pathname !== "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const { data: profile } = await supabase
      .from("users")
      .select("role, status")
      .eq("id", user.id)
      .single();

    if (profile?.status === "active") {
      const url = request.nextUrl.clone();
      url.pathname = profile.role === "admin" ? "/admin" : "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  if (user && !isAuthRoute) {
    const { data: profile } = await supabase
      .from("users")
      .select("role, status")
      .eq("id", user.id)
      .single();

    if (!profile || profile.status !== "active") {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      if (profile?.status === "pending") {
        url.searchParams.set("message", "pending");
      } else if (profile?.status === "rejected") {
        url.searchParams.set("message", "rejected");
      }
      return NextResponse.redirect(url);
    }

    if (pathname.startsWith("/admin") && profile.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
