import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 1. KRİTİK KONTROL: Eğer değişkenler eksikse hata verip login'e atma, 
  // en azından sayfayı açmaya çalış ki ne olduğunu anlayalım.
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase environment variables are missing!");
    return response; 
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 2. YÖNLENDİRME KONTROLÜ: Sadece user yoksa ve /sign-in sayfasında değilsek yönlendir.
  if (!user && !request.nextUrl.pathname.startsWith('/sign-in')) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/search/:path*", "/library/:path*"],
};