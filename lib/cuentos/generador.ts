import Anthropic from "@anthropic-ai/sdk";
import { modeloTexto } from "./config";
import { construirPrompt, type EntradaPrompt } from "./prompt";
import { CuentoGeneradoSchema, JSON_SCHEMA_CUENTO, type CuentoGenerado } from "./schema";

export class ErrorGeneracion extends Error {
  constructor(mensaje: string, options?: { cause?: unknown }) {
    super(mensaje, options);
    this.name = "ErrorGeneracion";
  }
}

// Lo mínimo del SDK que usamos: así los tests pasan un cliente falso y no hay llamadas reales.
export type ClienteTexto = { messages: { create: Anthropic["messages"]["create"] } };

export type ResultadoTexto = {
  cuento: CuentoGenerado;
  json: unknown;
  modelo: string;
  version: string;
  tokensEntrada: number;
  tokensSalida: number;
};

const MAX_TOKENS = 4000;
const INTENTOS = 2; // un reintento si la salida no cumple el esquema

export function crearClienteTexto(): ClienteTexto {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new ErrorGeneracion("Falta ANTHROPIC_API_KEY");
  return new Anthropic({ apiKey });
}

// Pide el cuento a Claude con salida estructurada (herramienta forzada) y la valida con zod.
// Suma los tokens de todos los intentos: es lo que se paga.
export async function generarTextoCuento(
  entrada: EntradaPrompt,
  cliente: ClienteTexto = crearClienteTexto(),
): Promise<ResultadoTexto> {
  const { system, user, version } = construirPrompt(entrada);
  const modelo = modeloTexto();
  let tokensEntrada = 0;
  let tokensSalida = 0;
  let ultimoError: unknown;

  for (let intento = 0; intento < INTENTOS; intento++) {
    let respuesta;
    try {
      respuesta = await cliente.messages.create({
        model: modelo,
        max_tokens: MAX_TOKENS,
        system,
        messages: [{ role: "user", content: user }],
        tools: [
          {
            name: "entregar_cuento",
            description: "Entrega el cuento terminado: título y escenas.",
            input_schema: JSON_SCHEMA_CUENTO as unknown as Anthropic.Tool.InputSchema,
          },
        ],
        tool_choice: { type: "tool", name: "entregar_cuento" },
      });
    } catch (error) {
      throw new ErrorGeneracion("Anthropic no ha respondido", { cause: error });
    }

    tokensEntrada += respuesta.usage?.input_tokens ?? 0;
    tokensSalida += respuesta.usage?.output_tokens ?? 0;

    const bloque = respuesta.content.find((b) => b.type === "tool_use");
    const analisis = CuentoGeneradoSchema.safeParse(bloque && "input" in bloque ? bloque.input : null);
    if (analisis.success) {
      return {
        cuento: analisis.data,
        json: bloque && "input" in bloque ? bloque.input : null,
        modelo,
        version,
        tokensEntrada,
        tokensSalida,
      };
    }
    ultimoError = analisis.error;
  }
  throw new ErrorGeneracion("El modelo no devolvió un cuento válido", { cause: ultimoError });
}
