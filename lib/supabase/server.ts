import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Cliente para el servidor: usa la sesión del padre (cookies), así que RLS se aplica siempre.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Un Server Component no puede escribir cookies. No pasa nada:
            // el proxy ya refresca la sesión en cada petición.
          }
        },
      },
    },
  );
}
