import { describe, expect, it } from "vitest";
import { es } from "@/lib/i18n/es";
import { eu } from "@/lib/i18n/eu";
import { IDIOMA_POR_DEFECTO, esIdioma, t } from "@/lib/i18n";

describe("i18n", () => {
  it("euskera tiene exactamente las mismas claves que castellano, todas con texto", () => {
    expect(Object.keys(eu).sort()).toEqual(Object.keys(es).sort());
    for (const texto of [...Object.values(es), ...Object.values(eu)]) {
      expect(texto.trim()).not.toBe("");
    }
  });

  it("los dos idiomas usan los mismos {huecos}", () => {
    const huecos = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();
    for (const clave of Object.keys(es) as (keyof typeof es)[]) {
      expect(huecos(eu[clave]), clave).toEqual(huecos(es[clave]));
    }
  });

  it("el idioma por defecto es el castellano", () => {
    expect(IDIOMA_POR_DEFECTO).toBe("es");
    expect(t("casa.titulo")).toBe("¡Hola! Soy Luppo");
  });

  it("rellena los huecos y deja intacto el que no recibe valor", () => {
    expect(t("carrusel.elegidos", "es", { n: 2, max: 3 })).toBe("Has elegido 2 de 3");
    expect(t("carrusel.elegidos", "es", { n: 2 })).toBe("Has elegido 2 de {max}");
  });

  it("reconoce solo los idiomas soportados", () => {
    expect(esIdioma("es")).toBe(true);
    expect(esIdioma("eu")).toBe(true);
    expect(esIdioma("fr")).toBe(false);
    expect(esIdioma(null)).toBe(false);
  });
});
