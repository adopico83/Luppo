import type { NextRequest } from "next/server";
import { actualizarSesion } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return actualizarSesion(request);
}

export const config = {
  // Se salta lo estático: el service worker y el manifest tienen que cargar sin sesión
  // para que la PWA se pueda instalar, y las imágenes no necesitan comprobación.
  matcher: [
    "/((?!_next/static|_next/image|manifest.webmanifest|sw.js|swe-worker-.*|.*\\.(?:png|jpg|jpeg|webp|svg|ico|mp3|js|map)$).*)",
  ],
};
