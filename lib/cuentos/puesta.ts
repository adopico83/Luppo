import type { ClaveLugar } from "@/lib/catalogo/lugares";
import type { AccionPersonaje, Posicion } from "./escena";

export type PersonajeEnEscena = {
  clave: string;
  nombre: string;
  izquierda: number; // % del ancho de la escena donde están los pies
  lado: -1 | 1; // por dónde entra o sale
  gesto?: string; // gesto pedido para la escena; sin él, el propio del personaje
  movimiento?: "entrar" | "salir" | "caminar" | "saltar" | "patinete";
};

const PORCENTAJE: Record<Posicion, number> = { izquierda: 20, centro: 50, derecha: 80 };
// Si dos personajes piden el mismo sitio, el segundo se corre al hueco libre más cercano.
const HUECOS = [20, 50, 80, 35, 65, 8, 92];
const REPARTO: Record<number, number[]> = { 1: [50], 2: [28, 72], 3: [20, 50, 80] };

// Coloca a los personajes elegidos en una escena. Los que el generador no ha colocado (o todos, en
// cuentos sin puesta en escena como el de ejemplo) se reparten por los sitios que quedan libres.
export function puestaEnEscena(
  personajes: { clave: string; nombre: string }[],
  acciones: AccionPersonaje[],
  lugar: ClaveLugar,
): PersonajeEnEscena[] {
  const reparto = REPARTO[personajes.length] ?? HUECOS.slice(0, personajes.length);
  const ocupados: number[] = [];
  const colocados = personajes.map(({ clave, nombre }, i) => {
    const accion = acciones.find((a) => a.personaje === clave);
    const deseado = accion ? PORCENTAJE[accion.posicion] : reparto[i];
    const izquierda =
      [deseado, ...HUECOS].find((h) => !ocupados.some((o) => Math.abs(o - h) < 12)) ?? deseado;
    ocupados.push(izquierda);
    return { clave, nombre, izquierda, accion };
  });

  // En el patinete avanza el que camina o, si nadie camina, el primero.
  const patinero =
    lugar === "patinete"
      ? (colocados.find((c) => c.accion?.accion === "caminar") ?? colocados[0])?.clave
      : undefined;

  return colocados.map(({ clave, nombre, izquierda, accion }) => {
    const movimiento =
      clave === patinero
        ? "patinete"
        : accion?.accion && accion.accion !== "quieto"
          ? accion.accion
          : undefined;
    return {
      clave,
      nombre,
      izquierda,
      lado: izquierda > 50 ? 1 : -1,
      gesto: accion?.gesto,
      movimiento,
    };
  });
}
