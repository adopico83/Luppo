import { z } from "zod";
import { AccionPersonajeSchema, JSON_SCHEMA_ACCION } from "./escena";

// Lo que se puede recortar no hace fallar el cuento: un texto de más se corta y una lista larga se
// queda en su máximo. Solo se rechaza lo que no se puede arreglar (vacío, tipo equivocado...).
const texto = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .transform((s) => s.slice(0, max).trim());
const lista = <T extends z.ZodType>(item: T, max: number) =>
  z.preprocess((v) => (Array.isArray(v) ? v.slice(0, max) : v), z.array(item).max(max));

export const TIPOS_INTERACCION = ["elegir", "tocar", "contar"] as const;
export type TipoInteraccion = (typeof TIPOS_INTERACCION)[number];

export const MIN_INTERACCIONES = 2;
export const MAX_INTERACCIONES = 3;

const OpcionSchema = z.object({
  texto: texto(40), // etiqueta breve del botón
  emoji: texto(16), // icono visual grande
  consecuencia: texto(300), // frase que la voz lee después de elegirla
});

// Una interacción por escena: elegir (2-3 opciones), tocar (un elemento) o contar (en voz alta).
export const InteraccionSchema = z.discriminatedUnion("tipo", [
  z.object({
    tipo: z.literal("elegir"),
    pregunta: texto(200),
    opciones: lista(OpcionSchema, 3).pipe(z.array(OpcionSchema).min(2)),
  }),
  z.object({
    tipo: z.literal("tocar"),
    instruccion: texto(200),
    emoji: texto(16),
    consecuencia: texto(300),
  }),
  z.object({
    tipo: z.literal("contar"),
    instruccion: texto(200),
    hasta: z.coerce.number().int().min(2).max(10),
    consecuencia: texto(300),
  }),
]);

export type Interaccion = z.infer<typeof InteraccionSchema>;

export const EscenaGeneradaSchema = z.object({
  texto: texto(600),
  personajes: lista(AccionPersonajeSchema, 6).default([]),
  interaccion: InteraccionSchema.optional(),
});

// Salida estructurada que debe devolver el modelo: título, objetivo educativo y de 5 a 7 escenas
// cortas, cada una con su texto, la puesta en escena de los personajes y, en 2-3 escenas (nunca la
// primera ni la última), una interacción.
export const CuentoGeneradoSchema = z
  .object({
    titulo: texto(120),
    tema_educativo: texto(160),
    escenas: z.array(EscenaGeneradaSchema).min(5).max(7),
  })
  .superRefine((cuento, ctx) => {
    const con = cuento.escenas.flatMap((e, i) => (e.interaccion ? [i] : []));
    if (con.length < MIN_INTERACCIONES || con.length > MAX_INTERACCIONES) {
      ctx.addIssue({
        code: "custom",
        path: ["escenas"],
        message: `El cuento debe tener entre ${MIN_INTERACCIONES} y ${MAX_INTERACCIONES} escenas con interaccion y tiene ${con.length}`,
      });
    }
    for (const i of con) {
      if (i === 0 || i === cuento.escenas.length - 1) {
        ctx.addIssue({
          code: "custom",
          path: ["escenas", i, "interaccion"],
          message: "La interaccion no puede estar en la primera ni en la última escena",
        });
      }
    }
  });

export type CuentoGenerado = z.infer<typeof CuentoGeneradoSchema>;

// Lo que ve el modelo cuando falla la validación: una línea por problema, con su ruta.
export function detalleError(error: z.ZodError): string {
  return error.issues.map((i) => `- ${i.path.join(".") || "(raíz)"}: ${i.message}`).join("\n");
}

const CADENA = { type: "string" } as const;

// Mismo contrato en JSON Schema, para forzar la herramienta de Anthropic.
export const JSON_SCHEMA_CUENTO = {
  type: "object",
  properties: {
    titulo: { type: "string", description: "Título corto y alegre del cuento." },
    tema_educativo: {
      type: "string",
      description: "Objetivo educativo sencillo que trabaja el cuento (p. ej. «contar hasta 5»).",
    },
    escenas: {
      type: "array",
      minItems: 5,
      maxItems: 7,
      description:
        "Escenas en orden. Cada una tiene 1-3 frases cortas para leer en voz alta. " +
        "Entre 2 y 3 llevan interaccion; la primera y la última no.",
      items: {
        type: "object",
        properties: {
          texto: CADENA,
          personajes: {
            type: "array",
            description: "Puesta en escena: una entrada por cada personaje que sale en la escena.",
            items: JSON_SCHEMA_ACCION,
          },
          interaccion: {
            type: "object",
            description:
              "Opcional. tipo «elegir»: pregunta y opciones (2-3). tipo «tocar»: instruccion, emoji y consecuencia. " +
              "tipo «contar»: instruccion, hasta (2-10) y consecuencia.",
            properties: {
              tipo: { type: "string", enum: [...TIPOS_INTERACCION] },
              pregunta: { ...CADENA, description: "Solo en «elegir»: pregunta corta." },
              opciones: {
                type: "array",
                minItems: 2,
                maxItems: 3,
                description: "Solo en «elegir».",
                items: {
                  type: "object",
                  properties: {
                    texto: { ...CADENA, description: "Texto breve del botón." },
                    emoji: { ...CADENA, description: "Un emoji grande que represente la opción." },
                    consecuencia: { ...CADENA, description: "Frase que se lee tras elegirla." },
                  },
                  required: ["texto", "emoji", "consecuencia"],
                },
              },
              instruccion: { ...CADENA, description: "En «tocar» y «contar»: lo que hay que hacer." },
              emoji: { ...CADENA, description: "Solo en «tocar»: el elemento que se toca." },
              hasta: { type: "integer", minimum: 2, maximum: 10, description: "Solo en «contar»." },
              consecuencia: { ...CADENA, description: "En «tocar» y «contar»: frase tras responder." },
            },
            required: ["tipo"],
          },
        },
        required: ["texto", "personajes"],
      },
    },
  },
  required: ["titulo", "tema_educativo", "escenas"],
} as const;
