// Reglas de selección de personajes del cuento (funciones puras).
export const MAX_PERSONAJES = 3;

// Quita la clave si ya estaba; la añade si hay hueco; si está lleno y la
// clave es nueva, devuelve la misma selección. Nunca muta la entrada.
export function alternarSeleccion(
  seleccion: string[],
  clave: string,
  max: number = MAX_PERSONAJES,
): string[] {
  if (seleccion.includes(clave)) {
    return seleccion.filter((c) => c !== clave);
  }
  if (seleccion.length >= max) return seleccion;
  return [...seleccion, clave];
}

// Se puede continuar con 1 a 3 personajes.
export function puedeContinuar(seleccion: string[]): boolean {
  return seleccion.length >= 1 && seleccion.length <= MAX_PERSONAJES;
}
