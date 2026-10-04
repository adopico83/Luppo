// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import nextConfig from "@/next.config";

describe("imágenes nítidas en escritorio", () => {
  it("next.config permite calidad 88 (Next 16 rebaja a 75 lo que no esté en la lista)", () => {
    expect(nextConfig.images?.qualities).toContain(88);
  });

  it("las tarjetas de /lugares piden sizes 50vw/25vw y calidad 88", () => {
    const fuente = readFileSync("app/lugares/page.tsx", "utf8");
    expect(fuente).toContain('sizes="(max-width: 768px) 50vw, 25vw"');
    expect(fuente).toContain("quality={88}");
  });

  it("el fondo del cuento pide 100vw y calidad 88", () => {
    const fuente = readFileSync("components/LectorCuento.tsx", "utf8");
    expect(fuente).toContain('sizes="100vw"');
    expect(fuente).toContain("quality={88}");
  });
});
