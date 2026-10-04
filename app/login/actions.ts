"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { ClaveTexto } from "@/lib/i18n";

// `mensaje` es una clave de texto: la pantalla la traduce al idioma de la familia.
export type EstadoLogin = { ok: boolean | null; mensaje: ClaveTexto | ""; limite?: boolean };

const EMAIL_VALIDO = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function enviarEnlace(
  _anterior: EstadoLogin,
  formData: FormData,
): Promise<EstadoLogin> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL_VALIDO.test(email)) {
    return { ok: false, mensaje: "login.emailInvalido" };
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
      limite,
      mensaje: limite ? "login.limite" : "login.errorEnvio",
    };
  }
  return { ok: true, mensaje: "login.enviado" };
}
