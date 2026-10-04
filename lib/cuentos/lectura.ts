import type { SupabaseClient } from "@supabase/supabase-js";
import { esLugar, type ClaveLugar } from "@/lib/catalogo/lugares";
import type { Idioma } from "@/lib/i18n";
import { urlsFirmadas } from "./audio";
import { leerAcciones, type AccionPersonaje } from "./escena";
import { CUENTOS_EJEMPLO } from "./ejemplo";
import { TIPOS_INTERACCION, type TipoInteraccion } from "./schema";

// Lo que el niño ve y oye en una escena que espera respuesta. En «tocar» y «contar» hay una sola
// opción (la consecuencia); en «elegir», de dos a tres.
export type OpcionLectura = {
  id: string;
  texto: string;
  icono: string;
  consecuencia: string;
  audioUrl: string | null;
};
export type InteraccionLectura = {
  tipo: TipoInteraccion;
  pregunta: string;
  preguntaAudioUrl: string | null;
  hasta: number | null;
  opciones: OpcionLectura[];
};

// Lo que necesita la pantalla del cuento. No lleva nada de coste, tokens ni modelo: eso no es para el niño.
export type CuentoLectura = {
  titulo: string;
  lugar: ClaveLugar;
  personajes: { clave: string; nombre: string }[];
  escenas: {
    texto: string;
    audioUrl: string | null;
    acciones: AccionPersonaje[];
    interaccion: InteraccionLectura | null;
  }[];
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
    .select("id, orden, texto, audio_path, acciones, interaccion, pregunta, pregunta_audio_path, interaccion_datos")
    .eq("cuento_id", id)
    .order("orden", { ascending: true });
  if (!escenas || escenas.length === 0) return null;

  const personajes = await nombresDe(supabase, "id", cuento.protagonistas as string[]);

  const conInteraccion = escenas.filter((e) => esTipoInteraccion(e.interaccion));
  const { data: decisiones } = conInteraccion.length
    ? await supabase
        .from("decisiones")
        .select("id, escena_id, orden, etiqueta, icono_clave, consecuencia, audio_path")
        .in("escena_id", conInteraccion.map((e) => e.id))
        .order("orden", { ascending: true })
    : { data: [] };

  // Una sola firma para todos los audios: el de cada escena, el de su pregunta y los de sus opciones.
  const rutas = [
    ...escenas.flatMap((e) => [e.audio_path as string | null, e.pregunta_audio_path as string | null]),
    ...(decisiones ?? []).map((d) => d.audio_path as string | null),
  ];
  const urls = await urlsFirmadas(supabase, rutas);
  const urlDe = (ruta: unknown) => (ruta ? (urls[rutas.indexOf(ruta as string)] ?? null) : null);

  return {
    titulo: (cuento.titulo as string | null) ?? "",
    lugar: cuento.lugar_clave,
    personajes,
    escenas: escenas.map((e) => {
      const opciones = (decisiones ?? [])
        .filter((d) => d.escena_id === e.id && d.consecuencia)
        .map((d) => ({
          id: d.id as string,
          texto: d.etiqueta as string,
          icono: d.icono_clave as string,
          consecuencia: d.consecuencia as string,
          audioUrl: urlDe(d.audio_path),
        }));
      const tipo = e.interaccion;
      const interaccion: InteraccionLectura | null =
        esTipoInteraccion(tipo) && e.pregunta && opciones.length > 0
          ? {
              tipo,
              pregunta: e.pregunta as string,
              preguntaAudioUrl: urlDe(e.pregunta_audio_path),
              hasta: Number((e.interaccion_datos as { hasta?: unknown } | null)?.hasta) || null,
              opciones,
            }
          : null; // una interacción incompleta no bloquea el cuento: se lee como narración
      return { texto: e.texto as string, audioUrl: urlDe(e.audio_path), acciones: leerAcciones(e.acciones), interaccion };
    }),
  };
}

const esTipoInteraccion = (v: unknown): v is TipoInteraccion =>
  TIPOS_INTERACCION.includes(v as TipoInteraccion);

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
    escenas: ejemplo.escenas.map((texto) => ({ texto, audioUrl: null, acciones: [], interaccion: null })),
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
