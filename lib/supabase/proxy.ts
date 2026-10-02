import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { esRutaPublica } from "./rutas";

// Se ejecuta en cada petición: refresca la sesión del padre y expulsa a /login a quien no la tenga.
export async function actualizarSesion(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headers ?? {}).forEach(([clave, valor]) =>
            response.headers.set(clave, valor),
          );
        },
      },
    },
  );

  // getClaims valida el token; no te fíes de getSession() en el servidor.
  const { data } = await supabase.auth.getClaims();
  const haySesion = Boolean(data?.claims);
  const { pathname } = request.nextUrl;

  const destino =
    !haySesion && !esRutaPublica(pathname)
      ? "/login"
      : haySesion && pathname === "/login"
        ? "/"
        : null;

  if (destino) {
    const redireccion = NextResponse.redirect(new URL(destino, request.url));
    // Conserva las cookies de sesión que haya refrescado Supabase.
    response.cookies.getAll().forEach((c) => redireccion.cookies.set(c));
    return redireccion;
  }
  return response;
}
