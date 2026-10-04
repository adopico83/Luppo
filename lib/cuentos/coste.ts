// Coste estimado de un cuento. Solo para los padres y el servidor: va a los logs y a la tabla
// cuentos, NUNCA se enseña al niño.
//
// Tarifas orientativas en dólares (revisar si cambian los precios o el modelo):
// - Claude Haiku 4.5: 1 USD por millón de tokens de entrada y 5 USD por millón de salida.
// - ElevenLabs eleven_multilingual_v2: ~0,30 USD por cada 1000 caracteres (depende del plan).
export const TARIFA_TEXTO_USD_POR_MILLON = { entrada: 1, salida: 5 } as const;
export const TARIFA_VOZ_USD_POR_MIL_CARACTERES = 0.3;

export type UsoCuento = {
  tokensEntrada: number;
  tokensSalida: number;
  caracteresTts: number;
};

export function costeEstimadoUsd({ tokensEntrada, tokensSalida, caracteresTts }: UsoCuento): number {
  const texto =
    (tokensEntrada * TARIFA_TEXTO_USD_POR_MILLON.entrada +
      tokensSalida * TARIFA_TEXTO_USD_POR_MILLON.salida) /
    1_000_000;
  const voz = (caracteresTts / 1000) * TARIFA_VOZ_USD_POR_MIL_CARACTERES;
  return texto + voz;
}

// Céntimos de dólar con 2 decimales (columna cuentos.coste_estimado_centimos).
export function costeEstimadoCentimos(uso: UsoCuento): number {
  return Math.round(costeEstimadoUsd(uso) * 100 * 100) / 100;
}
