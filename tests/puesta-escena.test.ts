// @vitest-environment node
import { describe, expect, it } from "vitest";
import { puestaEnEscena } from "@/lib/cuentos/puesta";

const p = (...claves: string[]) => claves.map((clave) => ({ clave, nombre: clave }));

describe("puestaEnEscena", () => {
  it("sin acciones reparte a los personajes por la escena", () => {
    expect(puestaEnEscena(p("a"), [], "bosque").map((x) => x.izquierda)).toEqual([50]);
    expect(puestaEnEscena(p("a", "b"), [], "bosque").map((x) => x.izquierda)).toEqual([28, 72]);
    expect(puestaEnEscena(p("a", "b", "c"), [], "bosque").map((x) => x.izquierda)).toEqual([20, 50, 80]);
  });

  it("respeta la posición pedida, el gesto y la acción", () => {
    const [a, b] = puestaEnEscena(
      p("a", "b"),
      [
        { personaje: "a", posicion: "derecha", gesto: "hamaca", accion: "entrar" },
        { personaje: "b", posicion: "izquierda", gesto: "tembleque", accion: "quieto" },
      ],
      "playa",
    );
    expect(a).toMatchObject({ izquierda: 80, lado: 1, gesto: "hamaca", movimiento: "entrar" });
    expect(b).toMatchObject({ izquierda: 20, lado: -1, gesto: "tembleque", movimiento: undefined });
  });

  it("si dos piden el mismo sitio, el segundo se corre; ignora claves que no están en el cuento", () => {
    const r = puestaEnEscena(
      p("a", "b"),
      [
        { personaje: "a", posicion: "centro", gesto: "hamaca" },
        { personaje: "b", posicion: "centro", gesto: "hamaca" },
        { personaje: "fuera", posicion: "izquierda", gesto: "hamaca" },
      ],
      "bosque",
    );
    expect(r).toHaveLength(2);
    expect(r[0].izquierda).not.toBe(r[1].izquierda);
  });

  it("en el patinete avanza el que camina, o el primero si nadie camina", () => {
    const camina = puestaEnEscena(
      p("a", "b"),
      [{ personaje: "b", posicion: "centro", gesto: "hamaca", accion: "caminar" }],
      "patinete",
    );
    expect(camina.map((x) => x.movimiento)).toEqual([undefined, "patinete"]);
    expect(puestaEnEscena(p("a", "b"), [], "patinete").map((x) => x.movimiento)).toEqual(["patinete", undefined]);
  });
});
