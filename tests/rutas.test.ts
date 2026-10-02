import { describe, expect, it } from "vitest";
import { esRutaPublica } from "@/lib/supabase/rutas";

describe("esRutaPublica", () => {
  it("deja ver solo /login y el callback del enlace mágico", () => {
    expect(esRutaPublica("/login")).toBe(true);
    expect(esRutaPublica("/auth/callback")).toBe(true);
  });

  it("protege el resto de rutas", () => {
    for (const ruta of ["/", "/personajes", "/lugares", "/api/cuentos", "/padres"]) {
      expect(esRutaPublica(ruta)).toBe(false);
    }
  });

  it("no se deja engañar por rutas que solo empiezan parecido", () => {
    expect(esRutaPublica("/login-falso")).toBe(false);
    expect(esRutaPublica("/auth/callbackx")).toBe(false);
    expect(esRutaPublica("/x/login")).toBe(false);
  });
});
