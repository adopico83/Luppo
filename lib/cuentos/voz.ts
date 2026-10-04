// Voz con ElevenLabs por la API REST (sin SDK). Solo servidor.
const BASE = "https://api.elevenlabs.io/v1/text-to-speech";
const FORMATO = "mp3_44100_128";
// 128 kbps = 16 000 bytes por segundo: sirve para estimar la duración sin descodificar el mp3.
const BYTES_POR_MS = 16;
const MAX_DETALLE = 300;

export type ConfigVoz = { apiKey: string; voiceId: string; modelo: string };

export class ErrorVoz extends Error {
  constructor(
    mensaje: string,
    readonly estado?: number,
  ) {
    super(mensaje);
    this.name = "ErrorVoz";
  }
}

// Convierte el texto en un mp3. `fetchFn` se puede sustituir en los tests.
export async function sintetizarVoz(
  texto: string,
  { apiKey, voiceId, modelo }: ConfigVoz,
  fetchFn: typeof fetch = fetch,
): Promise<Uint8Array> {
  const respuesta = await fetchFn(
    `${BASE}/${encodeURIComponent(voiceId)}?output_format=${FORMATO}`,
    {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({ text: texto, model_id: modelo }),
    },
  );
  if (!respuesta.ok) {
    // El cuerpo explica el motivo (clave inválida, voz inexistente, cuota...). Nunca lleva la API key.
    const detalle = await respuesta.text().catch(() => "");
    throw new ErrorVoz(
      `ElevenLabs respondió ${respuesta.status}${detalle ? `: ${detalle.slice(0, MAX_DETALLE)}` : ""}`,
      respuesta.status,
    );
  }
  const audio = new Uint8Array(await respuesta.arrayBuffer());
  if (audio.byteLength === 0) throw new ErrorVoz("ElevenLabs devolvió un audio vacío");
  return audio;
}

export const duracionEstimadaMs = (audio: Uint8Array) => Math.round(audio.byteLength / BYTES_POR_MS);
