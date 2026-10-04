import type { SupabaseClient } from "@supabase/supabase-js";

// Bucket privado de la migración 0001. La política de Storage deja a los miembros de la familia
// tocar solo lo que cuelga de su carpeta familia_id/.
export const BUCKET_CUENTOS = "cuentos";
// Las URLs firmadas caducan: se piden de nuevo cada vez que se abre el cuento.
export const CADUCIDAD_URL_SEGUNDOS = 60 * 60;

// familia_id/perfil_id/cuento_id/escena.mp3 (la clave de la escena ya es «escena-N»).
export const rutaAudio = (familia: string, perfil: string, cuento: string, clave: string) =>
  `${familia}/${perfil}/${cuento}/${clave}.mp3`;

// Sube el mp3 sin sobrescribir: si ya existía no se regenera ni se paga otra vez.
// Devuelve true si lo ha subido ahora y false si ya estaba.
export async function subirAudioSiFalta(
  supabase: SupabaseClient,
  ruta: string,
  audio: Uint8Array,
): Promise<boolean> {
  const { error } = await supabase.storage
    .from(BUCKET_CUENTOS)
    .upload(ruta, audio, { contentType: "audio/mpeg", upsert: false });
  if (!error) return true;
  if (/already exists|duplicate/i.test(error.message)) return false;
  throw new Error(`No se pudo guardar el audio: ${error.message}`);
}

// URL firmada de cada ruta (null si no hay audio o no se pudo firmar).
export async function urlsFirmadas(
  supabase: SupabaseClient,
  rutas: (string | null)[],
): Promise<(string | null)[]> {
  const validas = rutas.filter((r): r is string => Boolean(r));
  if (validas.length === 0) return rutas.map(() => null);
  const { data, error } = await supabase.storage
    .from(BUCKET_CUENTOS)
    .createSignedUrls(validas, CADUCIDAD_URL_SEGUNDOS);
  if (error || !data) return rutas.map(() => null);
  const porRuta = new Map(data.map((d) => [d.path, d.signedUrl ?? null]));
  return rutas.map((r) => (r ? (porRuta.get(r) ?? null) : null));
}
