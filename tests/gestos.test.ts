import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { GESTOS, claseGesto } from "@/lib/catalogo/gestos";

const css = readFileSync("app/globals.css", "utf8");
const claves = readdirSync("public/munecos").map((f) => f.replace(/\.jpg$/, ""));

describe("gestos de los personajes", () => {
  it("los 17 personajes tienen gesto, y cada uno el suyo", () => {
    expect(claves).toHaveLength(17);
    for (const clave of claves) expect(GESTOS).toHaveProperty(clave);
    expect(Object.keys(GESTOS).sort()).toEqual([...claves].sort());
    expect(new Set(Object.values(GESTOS)).size).toBe(17);
  });

  it("claseGesto devuelve la clase del gesto o undefined si no existe", () => {
    expect(claseGesto("luppo")).toBe("gesto-saludo-pillo");
    expect(claseGesto("inventado")).toBeUndefined();
  });

  it.each(Object.entries(GESTOS))("%s: keyframes y duración de 0,6 a 1,2 s", (_clave, gesto) => {
    expect(css).toContain(`@keyframes ${gesto} {`);
    const m = css.match(
      new RegExp(String.raw`\.gesto-${gesto}\s*\{\s*animation:\s*${gesto}\s+([\d.]+)s`),
    );
    expect(m, `falta .gesto-${gesto}`).not.toBeNull();
    const segundos = Number(m![1]);
    expect(segundos).toBeGreaterThanOrEqual(0.6);
    expect(segundos).toBeLessThanOrEqual(1.2);
  });

  it("respeta prefers-reduced-motion quitando la animación", () => {
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: reduce\)\s*\{\s*\[class\*="gesto-"\],\s*\[class\*="malabar-"\]\s*\{\s*animation: none !important/,
    );
  });
});
