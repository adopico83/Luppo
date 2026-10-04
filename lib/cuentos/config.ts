// Configuración del generador de cuentos. Solo se usa en el servidor: las claves salen de
// process.env y nunca llevan el prefijo NEXT_PUBLIC_ (no deben llegar al navegador).

export const MODELO_TEXTO_POR_DEFECTO = "claude-haiku-4-5";
// Multilingüe. Si ElevenLabs no lo hablara bien en euskera, se cambia con ELEVENLABS_MODEL.
export const MODELO_VOZ_POR_DEFECTO = "eleven_multilingual_v2";

// Cambia cuando cambia el prompt: queda guardado en cuentos.version_prompt para poder comparar.
export const VERSION_PROMPT = "cuento-v1";

// Tope duro por familia y día, aunque ajustes_familia.cuentos_max_dia diga más.
export const LIMITE_CUENTOS_DIA = 10;

// Edad que se asume si el perfil no tiene fecha de nacimiento ni rango de edad.
export const EDAD_POR_DEFECTO = 4;

export const modeloTexto = () => process.env.ANTHROPIC_MODEL?.trim() || MODELO_TEXTO_POR_DEFECTO;
export const modeloVoz = () => process.env.ELEVENLABS_MODEL?.trim() || MODELO_VOZ_POR_DEFECTO;

// Sin clave de Anthropic no se puede generar texto: se enseña el cuento de ejemplo.
export const hayClaveTexto = () => Boolean(process.env.ANTHROPIC_API_KEY?.trim());

// La voz es opcional: sin sus claves el cuento se guarda solo con texto.
export function configVoz(): { apiKey: string; voiceId: string; modelo: string } | null {
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  const voiceId = process.env.ELEVENLABS_VOICE_ID?.trim();
  return apiKey && voiceId ? { apiKey, voiceId, modelo: modeloVoz() } : null;
}
