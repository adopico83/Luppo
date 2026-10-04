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

// Lee `?personajes=a,b,c` de la URL. Devuelve las claves (sin repetir) o null si no hay entre 1 y
// MAX_PERSONAJES claves válidas: la URL la puede escribir cualquiera, así que no se fía de ella.
export function parsearPersonajes(
  valor: string | string[] | undefined,
  max: number = MAX_PERSONAJES,
): string[] | null {
  const texto = Array.isArray(valor) ? valor[0] : valor;
  if (!texto) return null;
  const claves = texto.split(",");
  if (claves.some((c) => !/^[a-z0-9_]{1,40}$/.test(c))) return null;
  const unicas = [...new Set(claves)];
  return unicas.length >= 1 && unicas.length <= max ? unicas : null;
}
