import { describe, expect, it } from "vitest";
import {
  MAX_PERSONAJES,
  alternarSeleccion,
  parsearPersonajes,
  puedeContinuar,
} from "@/lib/seleccion";

describe("alternarSeleccion", () => {
  it("añade en orden de toque", () => {
    expect(alternarSeleccion(alternarSeleccion([], "a"), "b")).toEqual([
      "a",
      "b",
    ]);
  });

  it("quita si ya estaba", () => {
    expect(alternarSeleccion(["a", "b"], "a")).toEqual(["b"]);
  });

  it("ignora un cuarto personaje nuevo", () => {
    const sel = ["a", "b", "c"];
    expect(alternarSeleccion(sel, "d")).toBe(sel);
  });

  it("permite quitar con el máximo alcanzado y elegir otro después", () => {
    const sin = alternarSeleccion(["a", "b", "c"], "b");
    expect(sin).toEqual(["a", "c"]);
    expect(alternarSeleccion(sin, "d")).toEqual(["a", "c", "d"]);
  });

  it("no muta la entrada ni duplica", () => {
    const sel = Object.freeze(["a"]) as string[];
    expect(alternarSeleccion(sel, "b")).toEqual(["a", "b"]);
    expect(alternarSeleccion(sel, "a")).toEqual([]);
    expect(sel).toEqual(["a"]);
  });

  it("respeta un máximo personalizado", () => {
    expect(alternarSeleccion(["a"], "b", 1)).toEqual(["a"]);
  });

  it("el máximo por defecto es 3", () => {
    expect(MAX_PERSONAJES).toBe(3);
  });
});

describe("puedeContinuar", () => {
  it("falso con 0, verdadero con 1 y 3, falso con más de 3", () => {
    expect(puedeContinuar([])).toBe(false);
    expect(puedeContinuar(["a"])).toBe(true);
    expect(puedeContinuar(["a", "b", "c"])).toBe(true);
    expect(puedeContinuar(["a", "b", "c", "d"])).toBe(false);
  });
});

describe("parsearPersonajes", () => {
  it("lee de 1 a 3 claves sin repetir", () => {
    expect(parsearPersonajes("luppo")).toEqual(["luppo"]);
    expect(parsearPersonajes("zorrito,flan,luna")).toEqual(["zorrito", "flan", "luna"]);
    expect(parsearPersonajes("flan,flan")).toEqual(["flan"]);
    expect(parsearPersonajes(["flan,luna", "otro"])).toEqual(["flan", "luna"]);
  });

  it("rechaza vacío, más de 3 y claves raras", () => {
    expect(parsearPersonajes(undefined)).toBeNull();
    expect(parsearPersonajes("")).toBeNull();
    expect(parsearPersonajes("a,b,c,d")).toBeNull();
    expect(parsearPersonajes("flan,,luna")).toBeNull();
    expect(parsearPersonajes("Flan")).toBeNull();
    expect(parsearPersonajes("<script>")).toBeNull();
    expect(parsearPersonajes("../x")).toBeNull();
  });
});
