import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/cadastro",
  "/privacidade",
  "/termos",
  "/excluir-conta",
  "/convite",
  "/onboarding",
  "/debug-pwa",
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );
}

export async function middleware(request: NextRequest) {
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

  const { pathname } = request.nextUrl;

  // Usuário logado: redireciona landing, login e cadastro para /home
  // EXCETO se tem convite — preserva o fluxo do convite
  if (user && (pathname === "/" || pathname === "/login" || pathname === "/cadastro")) {
    const convite = request.nextUrl.searchParams.get("convite");
    if (convite) {
      // Tem convite → redireciona para aceitar o convite (já está logado)
      return NextResponse.redirect(new URL(`/convite/${convite}`, request.url));
    }
    return NextResponse.redirect(new URL("/home", request.url));
  }

  if (!user && !isPublicPath(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Roda em TODAS as rotas EXCETO:
     * - _next/static (arquivos estáticos do Next.js)
     * - _next/image (otimização de imagem)
     * - Arquivos estáticos do public/ (favicon, ícones, SW, manifest, etc.)
     * - .well-known/ (Digital Asset Links do TWA — NUNCA pode redirecionar,
     *   senão a verificação do app na Play falha e a barra de URL aparece)
     */
    "/((?!_next/static|_next/image|opengraph-image|twitter-image|\\.well-known|favicon\\.ico|manifest\\.json|sw\\.js|.*\\.png|.*\\.svg|.*\\.mp4|.*\\.webm|.*\\.jpg|.*\\.jpeg|.*\\.webp|.*\\.html|.*\\.ico|.*\\.xml|.*\\.txt|api/).*)",
  ],
};
