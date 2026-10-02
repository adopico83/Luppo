import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { asegurarFamilia } from "@/lib/familia";
import { createClient } from "@/lib/supabase/server";

// A esta ruta llega el padre al abrir el enlace mágico del email. Admite dos formatos:
//  - ?code=...                     (plantilla por defecto de Supabase; hay que abrirlo en el mismo navegador)
//  - ?token_hash=...&type=email    (plantilla personalizada; funciona aunque el email se abra en otro navegador)
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const tipo = searchParams.get("type");

  const supabase = await createClient();
  let fallo = true;

  if (tokenHash && (tipo === "email" || tipo === "magiclink")) {
    const { error } = await supabase.auth.verifyOtp({
      type: tipo as EmailOtpType,
      token_hash: tokenHash,
    });
    fallo = Boolean(error);
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    fallo = Boolean(error);
  }

  if (!fallo) {
    try {
      await asegurarFamilia(supabase);
    } catch {
      fallo = true;
    }
  }

  return NextResponse.redirect(new URL(fallo ? "/login?error=enlace" : "/", request.url));
}
