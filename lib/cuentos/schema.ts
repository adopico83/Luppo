import { z } from "zod";

// Salida estructurada que debe devolver el modelo: título + de 4 a 6 escenas de texto.
export const CuentoGeneradoSchema = z.object({
  titulo: z.string().trim().min(1).max(120),
  escenas: z
    .array(z.object({ texto: z.string().trim().min(1).max(3000) }))
    .min(4)
    .max(6),
});

export type CuentoGenerado = z.infer<typeof CuentoGeneradoSchema>;

// Mismo contrato en JSON Schema, para forzar la herramienta de Anthropic.
export const JSON_SCHEMA_CUENTO = {
  type: "object",
  properties: {
    titulo: { type: "string", description: "Título corto y tierno del cuento." },
    escenas: {
      type: "array",
      minItems: 4,
      maxItems: 6,
      description: "Escenas en orden. Cada una es un fragmento de cuento para leer en voz alta.",
      items: {
        type: "object",
        properties: { texto: { type: "string" } },
        required: ["texto"],
      },
    },
  },
  required: ["titulo", "escenas"],
} as const;
