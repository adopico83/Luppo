"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type EstadoLogin = { ok: boolean | null; mensaje: string };

const EMAIL_VALIDO = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function enviarEnlace(
  _anterior: EstadoLogin,
  formData: FormData,
): Promise<EstadoLogin> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL_VALIDO.test(email)) {
    return { ok: false, mensaje: "Escribe un email válido." };
  }

  // El enlace del email debe volver a ESTA web (en local o en Vercel).
  const cabeceras = await headers();
  const host = cabeceras.get("x-forwarded-host") ?? cabeceras.get("host");
  const protocolo =
    cabeceras.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${protocolo}://${host}/auth/callback` },
  });

  if (error) {
    const limite = error.status === 429 || /rate|seconds/i.test(error.message);
    return {
      ok: false,
      mensaje: limite
        ? "Has pedido muchos enlaces seguidos. Espera un poco y vuelve a intentarlo."
        : "No hemos podido enviar el enlace. Inténtalo de nuevo en un momento.",
    };
  }
  return { ok: true, mensaje: "Listo. Te hemos enviado un enlace: ábrelo desde tu email." };
}
