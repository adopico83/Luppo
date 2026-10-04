import type { SupabaseClient } from "@supabase/supabase-js";
import { esLugar, type ClaveLugar } from "@/lib/catalogo/lugares";
import type { Idioma } from "@/lib/i18n";
import { urlsFirmadas } from "./audio";
import { leerAcciones, type AccionPersonaje } from "./escena";
import { CUENTOS_EJEMPLO } from "./ejemplo";

// Lo que necesita la pantalla del cuento. No lleva nada de coste, tokens ni modelo: eso no es para el niño.
export type CuentoLectura = {
  titulo: string;
  lugar: ClaveLugar;
  personajes: { clave: string; nombre: string }[];
  escenas: { texto: string; audioUrl: string | null; acciones: AccionPersonaje[] }[];
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const esIdCuento = (id: string) => UUID.test(id);

// Cuento guardado de la familia (RLS limita la consulta) con sus audios firmados. null si no existe,
// no es de esta familia o aún no está listo.
export async function cargarCuento(supabase: SupabaseClient, id: string): Promise<CuentoLectura | null> {
  if (!esIdCuento(id)) return null;

  const { data: cuento } = await supabase
    .from("cuentos")
    .select("titulo, lugar_clave, protagonistas, estado")
    .eq("id", id)
    .maybeSingle();
  if (!cuento || cuento.estado !== "listo" || !esLugar(cuento.lugar_clave)) return null;

  const { data: escenas } = await supabase
    .from("escenas")
    .select("orden, texto, audio_path, acciones")
    .eq("cuento_id", id)
    .order("orden", { ascending: true });
  if (!escenas || escenas.length === 0) return null;

  const personajes = await nombresDe(supabase, "id", cuento.protagonistas as string[]);
  const urls = await urlsFirmadas(
    supabase,
    escenas.map((e) => e.audio_path as string | null),
  );

  return {
    titulo: (cuento.titulo as string | null) ?? "",
    lugar: cuento.lugar_clave,
    personajes,
    escenas: escenas.map((e, i) => ({
      texto: e.texto as string,
      audioUrl: urls[i],
      acciones: leerAcciones(e.acciones),
    })),
  };
}

// Cuento de ejemplo: los personajes y el lugar vienen de la elección (ya validada); sin audio.
export async function cuentoDeEjemplo(
  supabase: SupabaseClient,
  idioma: Idioma,
  claves: string[],
  lugar: ClaveLugar,
): Promise<CuentoLectura> {
  const ejemplo = CUENTOS_EJEMPLO[idioma];
  return {
    titulo: ejemplo.titulo,
    lugar,
    personajes: await nombresDe(supabase, "clave", claves),
    escenas: ejemplo.escenas.map((texto) => ({ texto, audioUrl: null, acciones: [] })),
  };
}

// Nombres visibles de los personajes, en el mismo orden en que se pidieron. Por clave, si alguno no
// se encuentra se enseña con su clave (el dibujo cae a un bloque con nombre).
async function nombresDe(supabase: SupabaseClient, campo: "id" | "clave", valores: string[]) {
  const { data } = await supabase.from("munecos").select("id, clave, nombre").in(campo, valores);
  return valores.flatMap((valor) => {
    const fila = (data ?? []).find((m) => m[campo] === valor);
    if (fila) return [{ clave: fila.clave as string, nombre: fila.nombre as string }];
    return campo === "clave" ? [{ clave: valor, nombre: valor }] : []; // un id sin ficha no tiene dibujo
  });
}
