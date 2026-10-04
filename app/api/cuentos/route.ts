import { z } from "zod";
import { hayClaveTexto } from "@/lib/cuentos/config";
import { crearCuento } from "@/lib/cuentos/servicio";
import { createClient } from "@/lib/supabase/server";

// Generar texto y voz puede tardar bastante: se pide margen a la plataforma.
export const maxDuration = 120;

const Entrada = z.object({
  personajes: z.array(z.string()).min(1).max(3),
  lugar: z.string(),
});

// POST /api/cuentos { personajes: string[], lugar: string }
//   200 { id }           cuento creado
//   200 { ejemplo: true } sin ANTHROPIC_API_KEY: se enseña el cuento de ejemplo
//   400 { error: "entrada" } · 401 { error: "sesion" } · 429 { error: "limite" } · 502 { error: "generacion" }
// El cliente traduce el código a un mensaje amable (i18n). Nunca se devuelve texto de error interno.
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return Response.json({ error: "sesion" }, { status: 401 });

  const entrada = Entrada.safeParse(await request.json().catch(() => null));
  if (!entrada.success) return Response.json({ error: "entrada" }, { status: 400 });

  if (!hayClaveTexto()) return Response.json({ ejemplo: true });

  try {
    const resultado = await crearCuento(supabase, {
      personajes: entrada.data.personajes.join(","),
      lugar: entrada.data.lugar,
    });
    switch (resultado.tipo) {
      case "ok":
        return Response.json({ id: resultado.id });
      case "limite":
        return Response.json({ error: "limite" }, { status: 429 });
      case "entrada":
        return Response.json({ error: "entrada" }, { status: 400 });
    }
  } catch (error) {
    console.error("[cuentos] no se pudo crear el cuento:", (error as Error).message);
    return Response.json({ error: "generacion" }, { status: 502 });
  }
}
