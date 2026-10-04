import { z } from "zod";
import { AccionPersonajeSchema, JSON_SCHEMA_ACCION } from "./escena";

// Salida estructurada que debe devolver el modelo: título + de 5 a 7 escenas cortas, cada una con
// su texto y la puesta en escena de los personajes (posición, gesto y acción).
export const CuentoGeneradoSchema = z.object({
  titulo: z.string().trim().min(1).max(120),
  escenas: z
    .array(
      z.object({
        texto: z.string().trim().min(1).max(600),
        personajes: z.array(AccionPersonajeSchema).max(6).default([]),
      }),
    )
    .min(5)
    .max(7),
});

export type CuentoGenerado = z.infer<typeof CuentoGeneradoSchema>;

// Mismo contrato en JSON Schema, para forzar la herramienta de Anthropic.
export const JSON_SCHEMA_CUENTO = {
  type: "object",
  properties: {
    titulo: { type: "string", description: "Título corto y tierno del cuento." },
    escenas: {
      type: "array",
      minItems: 5,
      maxItems: 7,
      description: "Escenas en orden. Cada una tiene 1-3 frases cortas para leer en voz alta.",
      items: {
        type: "object",
        properties: {
          texto: { type: "string" },
          personajes: {
            type: "array",
            description: "Puesta en escena: una entrada por cada personaje que sale en la escena.",
            items: JSON_SCHEMA_ACCION,
          },
        },
        required: ["texto", "personajes"],
      },
    },
  },
  required: ["titulo", "escenas"],
} as const;
