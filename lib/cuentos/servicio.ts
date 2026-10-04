import type { SupabaseClient } from "@supabase/supabase-js";
import { esLugar, type ClaveLugar } from "@/lib/catalogo/lugares";
import { edadEnAnios } from "@/lib/edad";
import { asegurarFamilia } from "@/lib/familia";
import { idiomaDeFamilia } from "@/lib/i18n/servidor";
import { parsearPersonajes } from "@/lib/seleccion";
import { existeAudio, rutaAudio, subirAudioSiFalta } from "./audio";
import { EDAD_POR_DEFECTO, LIMITE_CUENTOS_DIA, configVoz } from "./config";
import { costeEstimadoCentimos, costeEstimadoUsd } from "./coste";
import { generarTextoCuento, type ResultadoTexto } from "./generador";
import type { EntradaPrompt, FichaPersonaje } from "./prompt";
import { duracionEstimadaMs, sintetizarVoz, type ConfigVoz } from "./voz";

export type ResultadoCrear =
  | { tipo: "ok"; id: string }
  | { tipo: "limite" }
  | { tipo: "entrada" };

// Piezas externas, sustituibles en los tests para no llamar a Anthropic ni a ElevenLabs.
export type Dependencias = {
  generarTexto: (entrada: EntradaPrompt) => Promise<ResultadoTexto>;
  sintetizar: (texto: string, config: ConfigVoz) => Promise<Uint8Array>;
  voz: ConfigVoz | null;
  ahora: () => Date;
};

export const dependenciasReales = (): Dependencias => ({
  generarTexto: (entrada) => generarTextoCuento(entrada),
  sintetizar: (texto, config) => sintetizarVoz(texto, config),
  voz: configVoz(),
  ahora: () => new Date(),
});

const CONCURRENCIA_VOZ = 2;

// Crea un cuento entero: comprueba el límite diario, pide el texto, guarda las escenas, sintetiza
// la voz de cada una y apunta tokens, caracteres y coste. Un audio por escena: así el niño las
// escucha de una en una y, si una voz falla, el resto del cuento sigue funcionando.
export async function crearCuento(
  supabase: SupabaseClient,
  entrada: { personajes: string; lugar: string },
  deps: Dependencias = dependenciasReales(),
): Promise<ResultadoCrear> {
  const claves = parsearPersonajes(entrada.personajes);
  if (!claves || !esLugar(entrada.lugar)) return { tipo: "entrada" };
  const lugar: ClaveLugar = entrada.lugar;

  const familiaId = await asegurarFamilia(supabase);

  if ((await cuentosHoy(supabase, familiaId, deps.ahora())) >= (await limiteDiario(supabase, familiaId))) {
    return { tipo: "limite" };
  }

  const idioma = await idiomaDeFamilia(supabase);
  const perfil = await perfilDelNino(supabase, familiaId);
  const personajes = await fichasDe(supabase, claves);
  if (!personajes) return { tipo: "entrada" };

  // El cuento se crea ya como «generando»: así cuenta para el límite diario aunque falle algo luego.
  const { data: cuento, error: errorCuento } = await supabase
    .from("cuentos")
    .insert({
      familia_id: familiaId,
      perfil_id: perfil.id,
      protagonistas: personajes.map((p) => p.id),
      lugar_clave: lugar,
      estado: "generando",
      idioma,
      edad_objetivo: perfil.edad,
    })
    .select("id")
    .single();
  if (errorCuento || !cuento) throw new Error(`No se pudo crear el cuento: ${errorCuento?.message}`);
  const cuentoId = cuento.id as string;

  try {
    const texto = await deps.generarTexto({ personajes, lugar, idioma, edad: perfil.edad });
    const escenas = await guardarEscenas(supabase, cuentoId, texto, lugar);

    const { caracteres, modeloVoz } = await sintetizarEscenas(
      supabase,
      deps,
      { familiaId, perfilId: perfil.id, cuentoId },
      escenas,
    );

    const uso = {
      tokensEntrada: texto.tokensEntrada,
      tokensSalida: texto.tokensSalida,
      caracteresTts: caracteres,
    };
    const centimos = costeEstimadoCentimos(uso);
    const { error } = await supabase
      .from("cuentos")
      .update({
        titulo: texto.cuento.titulo,
        json_original: texto.json,
        modelo: texto.modelo,
        version_prompt: texto.version,
        modelo_tts: modeloVoz,
        tokens_entrada: uso.tokensEntrada,
        tokens_salida: uso.tokensSalida,
        caracteres_tts: uso.caracteresTts,
        coste_estimado_usd: Math.round(costeEstimadoUsd(uso) * 10_000) / 10_000,
        coste_estimado_centimos: centimos,
        estado: "listo",
      })
      .eq("id", cuentoId);
    if (error) throw new Error(`No se pudo cerrar el cuento: ${error.message}`);

    // Solo en el log del servidor y en la tabla: el coste nunca llega al niño.
    console.info(
      `[cuentos] ${cuentoId} idioma=${idioma} modelo=${texto.modelo} tokens=${uso.tokensEntrada}/${uso.tokensSalida} ` +
        `tts=${uso.caracteresTts} caracteres coste=${centimos} céntimos USD`,
    );
    return { tipo: "ok", id: cuentoId };
  } catch (error) {
    await supabase.from("cuentos").update({ estado: "error" }).eq("id", cuentoId);
    throw error;
  }
}

// Cuentos que ya ha pedido la familia desde las 00:00 UTC de hoy (los fallidos no cuentan).
async function cuentosHoy(supabase: SupabaseClient, familiaId: string, ahora: Date): Promise<number> {
  const inicio = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate()));
  const { count, error } = await supabase
    .from("cuentos")
    .select("id", { count: "exact", head: true })
    .eq("familia_id", familiaId)
    .gte("created_at", inicio.toISOString())
    .neq("estado", "error");
  if (error) throw new Error(`No se pudo contar los cuentos de hoy: ${error.message}`);
  return count ?? 0;
}

// El ajuste de la familia puede bajar el límite, nunca subirlo por encima del tope.
async function limiteDiario(supabase: SupabaseClient, familiaId: string): Promise<number> {
  const { data } = await supabase
    .from("ajustes_familia")
    .select("cuentos_max_dia")
    .eq("familia_id", familiaId)
    .maybeSingle();
  const ajuste = Number(data?.cuentos_max_dia);
  return Number.isFinite(ajuste) && ajuste > 0 ? Math.min(ajuste, LIMITE_CUENTOS_DIA) : LIMITE_CUENTOS_DIA;
}

// Todavía no hay pantalla para crear perfiles: se usa el primero de la familia y, si no existe,
// se crea uno sin datos personales (sin nombre ni fecha). Edad: fecha de nacimiento > rango > 4.
async function perfilDelNino(supabase: SupabaseClient, familiaId: string) {
  const { data } = await supabase
    .from("perfiles_hijo")
    .select("id, fecha_nacimiento, rango_edad")
    .eq("familia_id", familiaId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!data) {
    const { data: nuevo, error } = await supabase
      .from("perfiles_hijo")
      .insert({ familia_id: familiaId, avatar_clave: "luppo" })
      .select("id")
      .single();
    if (error || !nuevo) throw new Error(`No se pudo crear el perfil: ${error?.message}`);
    return { id: nuevo.id as string, edad: EDAD_POR_DEFECTO };
  }
  return { id: data.id as string, edad: edadDelPerfil(data.fecha_nacimiento, data.rango_edad) };
}

function edadDelPerfil(nacimiento: string | null, rango: string | null): number {
  if (nacimiento) {
    try {
      return edadEnAnios(nacimiento);
    } catch {
      // fecha rara: se prueba con el rango
    }
  }
  const m = rango ? /^([3-6])-[3-6]$/.exec(rango) : null;
  return m ? Number(m[1]) : EDAD_POR_DEFECTO;
}

// Fichas de los personajes elegidos, en el orden de la URL. null si alguno no existe.
async function fichasDe(supabase: SupabaseClient, claves: string[]) {
  const { data, error } = await supabase
    .from("munecos")
    .select("id, clave, nombre, especie, personalidad, forma_de_hablar, es_sistema")
    .in("clave", claves)
    .eq("activo", true);
  if (error) throw new Error(`No se pudieron leer los personajes: ${error.message}`);

  const fichas: (FichaPersonaje & { id: string })[] = [];
  for (const clave of claves) {
    const candidatas = (data ?? []).filter((m) => m.clave === clave);
    const ficha = candidatas.find((m) => m.es_sistema) ?? candidatas[0];
    if (!ficha) return null;
    fichas.push(ficha as FichaPersonaje & { id: string });
  }
  return fichas;
}

type EscenaGuardada = { id: string; clave: string; texto: string };

async function guardarEscenas(
  supabase: SupabaseClient,
  cuentoId: string,
  { cuento }: ResultadoTexto,
  lugar: ClaveLugar,
): Promise<EscenaGuardada[]> {
  const filas = cuento.escenas.map((escena, i) => ({
    cuento_id: cuentoId,
    clave: `escena-${i + 1}`,
    orden: i + 1,
    tipo: i === cuento.escenas.length - 1 ? "final" : "narracion",
    habla: "narrador",
    texto: escena.texto,
    fondo_clave: lugar,
  }));
  const { data, error } = await supabase.from("escenas").insert(filas).select("id, clave, texto, orden");
  if (error || !data) throw new Error(`No se pudieron guardar las escenas: ${error?.message}`);
  return [...data].sort((a, b) => a.orden - b.orden) as EscenaGuardada[];
}

// Un audio por escena, de dos en dos. Si la voz no está configurada o una escena falla, el cuento
// se queda con texto en esa escena (el lector oculta el botón de voz). Si el audio ya existe en
// Storage no se vuelve a pagar. Devuelve los caracteres enviados a ElevenLabs con éxito.
async function sintetizarEscenas(
  supabase: SupabaseClient,
  deps: Dependencias,
  ids: { familiaId: string; perfilId: string; cuentoId: string },
  escenas: EscenaGuardada[],
): Promise<{ caracteres: number; modeloVoz: string | null }> {
  const voz = deps.voz;
  if (!voz) {
    console.warn("[cuentos] sin ELEVENLABS_API_KEY/ELEVENLABS_VOICE_ID: el cuento se guarda sin voz");
    return { caracteres: 0, modeloVoz: null };
  }

  let caracteres = 0;
  const pendientes = [...escenas];
  const trabajador = async () => {
    for (let escena = pendientes.shift(); escena; escena = pendientes.shift()) {
      try {
        const ruta = rutaAudio(ids.familiaId, ids.perfilId, ids.cuentoId, escena.clave);
        let audioMs: number | null = null;
        if (!(await existeAudio(supabase, ruta))) {
          const audio = await deps.sintetizar(escena.texto, voz);
          caracteres += escena.texto.length;
          await subirAudioSiFalta(supabase, ruta, audio);
          audioMs = duracionEstimadaMs(audio);
        }
        const { error } = await supabase
          .from("escenas")
          .update({ audio_path: ruta, audio_ms: audioMs })
          .eq("id", escena.id);
        if (error) throw new Error(error.message);
      } catch (error) {
        console.error(`[cuentos] sin voz en ${ids.cuentoId}/${escena.clave}:`, (error as Error).message);
      }
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCIA_VOZ }, trabajador));
  return { caracteres, modeloVoz: voz.modelo };
}
