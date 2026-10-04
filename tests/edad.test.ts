import { describe, expect, it } from "vitest";
import { edadEnAnios } from "@/lib/edad";

const hoy = new Date(2026, 9, 4); // 4 de octubre de 2026 (hora local)

describe("edadEnAnios", () => {
  it("cuenta los años cumplidos", () => {
    expect(edadEnAnios("2022-03-10", hoy)).toBe(4);
    expect(edadEnAnios("2020-12-31", hoy)).toBe(5);
    expect(edadEnAnios("2026-01-01", hoy)).toBe(0);
  });

  it("el día del cumpleaños ya cuenta; el día anterior, no", () => {
    expect(edadEnAnios("2021-10-04", hoy)).toBe(5);
    expect(edadEnAnios("2021-10-05", hoy)).toBe(4);
  });

  it("nacidos el 29 de febrero cumplen el 1 de marzo en años no bisiestos", () => {
    const nacimiento = "2020-02-29";
    expect(edadEnAnios(nacimiento, new Date(2025, 1, 28))).toBe(4);
    expect(edadEnAnios(nacimiento, new Date(2025, 2, 1))).toBe(5);
    expect(edadEnAnios(nacimiento, new Date(2024, 1, 29))).toBe(4);
  });

  it("acepta un Date", () => {
    expect(edadEnAnios(new Date(2022, 2, 10), hoy)).toBe(4);
  });

  it("usa hoy por defecto", () => {
    const ayerHaceTresAnios = new Date();
    ayerHaceTresAnios.setFullYear(ayerHaceTresAnios.getFullYear() - 3);
    ayerHaceTresAnios.setDate(ayerHaceTresAnios.getDate() - 1);
    expect(edadEnAnios(ayerHaceTresAnios)).toBe(3);
  });

  it("rechaza fechas futuras o inválidas", () => {
    expect(() => edadEnAnios("2026-10-05", hoy)).toThrow(RangeError);
    expect(() => edadEnAnios("2027-01-01", hoy)).toThrow(RangeError);
    expect(() => edadEnAnios("2022-02-31", hoy)).toThrow(RangeError);
    expect(() => edadEnAnios("10/03/2022", hoy)).toThrow(RangeError);
    expect(() => edadEnAnios(new Date("nada"), hoy)).toThrow(RangeError);
  });
});
