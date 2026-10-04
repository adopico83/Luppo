import { es, type ClaveTexto } from "./es";
import { eu } from "./eu";

export type { ClaveTexto };

export const IDIOMAS = ["es", "eu"] as const;
export type Idioma = (typeof IDIOMAS)[number];
export const IDIOMA_POR_DEFECTO: Idioma = "es";

const TEXTOS: Record<Idioma, Record<ClaveTexto, string>> = { es, eu };

export function esIdioma(valor: unknown): valor is Idioma {
  return IDIOMAS.includes(valor as Idioma);
}

type Variables = Record<string, string | number>;

// Devuelve el texto de `clave` en `idioma`, rellenando los {huecos} con `variables`.
export function t(
  clave: ClaveTexto,
  idioma: Idioma = IDIOMA_POR_DEFECTO,
  variables?: Variables,
): string {
  const texto = TEXTOS[idioma][clave] ?? es[clave];
  if (!variables) return texto;
  return texto.replace(/\{(\w+)\}/g, (hueco, nombre: string) =>
    nombre in variables ? String(variables[nombre]) : hueco,
  );
}
