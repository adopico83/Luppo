import { z } from "zod";
import { NOMBRES_GESTO } from "@/lib/catalogo/gestos";

// Puesta en escena de un personaje: dónde está, qué gesto hace y, si hace falta, un movimiento.
// Lo devuelve el generador junto al texto y se guarda en escenas.acciones (jsonb).
export const POSICIONES = ["izquierda", "centro", "derecha"] as const;
export const ACCIONES = ["entrar", "salir", "caminar", "saltar", "quieto"] as const;

export type Posicion = (typeof POSICIONES)[number];
export type Accion = (typeof ACCIONES)[number];

export const AccionPersonajeSchema = z.object({
  personaje: z.string().trim().min(1).max(60), // clave del muñeco
  posicion: z.enum(POSICIONES),
  gesto: z.enum(NOMBRES_GESTO),
  accion: z.enum(ACCIONES).optional(),
});

export type AccionPersonaje = z.infer<typeof AccionPersonajeSchema>;

// Lo guardado puede venir de cuentos antiguos (sin acciones) o estar estropeado: se descartan las
// entradas inválidas en vez de romper el cuento.
export function leerAcciones(valor: unknown): AccionPersonaje[] {
  if (!Array.isArray(valor)) return [];
  return valor.flatMap((v) => {
    const r = AccionPersonajeSchema.safeParse(v);
    return r.success ? [r.data] : [];
  });
}

// JSON Schema equivalente, para la herramienta forzada de Anthropic.
export const JSON_SCHEMA_ACCION = {
  type: "object",
  properties: {
    personaje: { type: "string", description: "Clave exacta del personaje (la que aparece entre corchetes)." },
    posicion: { type: "string", enum: [...POSICIONES] },
    gesto: { type: "string", enum: [...NOMBRES_GESTO], description: "Gesto del propio personaje." },
    accion: { type: "string", enum: [...ACCIONES], description: "Movimiento opcional en la escena." },
  },
  required: ["personaje", "posicion", "gesto"],
} as const;
