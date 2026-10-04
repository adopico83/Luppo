// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { costeEstimadoCentimos, costeEstimadoUsd } from "@/lib/cuentos/coste";
import { MODELO_TEXTO_POR_DEFECTO } from "@/lib/cuentos/config";
import { ErrorGeneracion, generarTextoCuento, type ClienteTexto } from "@/lib/cuentos/generador";
import { bandaDeEdad, construirPrompt } from "@/lib/cuentos/prompt";
import { CuentoGeneradoSchema } from "@/lib/cuentos/schema";

const personajes = [
  { clave: "zumbillo", nombre: "Zumbillo", especie: "abeja", personalidad: "Trabajador", forma_de_hablar: "Con «z»" },
  { clave: "luna", nombre: "Luna" },
];
const escenas = (n: number) => Array.from({ length: n }, (_, i) => ({ texto: `Escena ${i + 1}` }));
const puesta = { personaje: "zumbillo", posicion: "izquierda", gesto: "revoloteo", accion: "entrar" };

const clienteQue = (...respuestas: unknown[]) => {
  const create = vi.fn();
  for (const r of respuestas) create.mockResolvedValueOnce(r);
  return { cliente: { messages: { create } } as unknown as ClienteTexto, create };
};
const toolUse = (input: unknown, usage = { input_tokens: 500, output_tokens: 900 }) => ({
  content: [{ type: "tool_use", id: "t1", name: "entregar_cuento", input }],
  usage,
});

beforeEach(() => vi.unstubAllEnvs());
afterEach(() => vi.unstubAllEnvs());

describe("esquema del cuento", () => {
  it("acepta título y de 5 a 7 escenas", () => {
    for (const n of [5, 6, 7]) {
      expect(CuentoGeneradoSchema.safeParse({ titulo: "El panal", escenas: escenas(n) }).success).toBe(true);
    }
  });
  it("rechaza menos de 5 o más de 7 escenas, textos vacíos y falta de título", () => {
    expect(CuentoGeneradoSchema.safeParse({ titulo: "x", escenas: escenas(4) }).success).toBe(false);
    expect(CuentoGeneradoSchema.safeParse({ titulo: "x", escenas: escenas(8) }).success).toBe(false);
    expect(CuentoGeneradoSchema.safeParse({ titulo: "x", escenas: [...escenas(4), { texto: " " }] }).success).toBe(false);
    expect(CuentoGeneradoSchema.safeParse({ escenas: escenas(5) }).success).toBe(false);
  });
  it("valida la puesta en escena: posición, gesto existente y acción opcional", () => {
    const con = (personajes: unknown[]) => ({
      titulo: "x",
      escenas: [{ texto: "a", personajes }, ...escenas(4)],
    });
    expect(CuentoGeneradoSchema.safeParse(con([puesta])).success).toBe(true);
    expect(CuentoGeneradoSchema.safeParse(con([{ ...puesta, accion: undefined }])).success).toBe(true);
    expect(CuentoGeneradoSchema.safeParse(con([{ ...puesta, posicion: "arriba" }])).success).toBe(false);
    expect(CuentoGeneradoSchema.safeParse(con([{ ...puesta, gesto: "volar" }])).success).toBe(false);
    expect(CuentoGeneradoSchema.safeParse(con([{ ...puesta, accion: "bailar" }])).success).toBe(false);
  });
  it("sin personajes en la escena asume una lista vacía", () => {
    const r = CuentoGeneradoSchema.parse({ titulo: "x", escenas: escenas(5) });
    expect(r.escenas[0].personajes).toEqual([]);
  });
});

describe("prompt", () => {
  it("separa 3-4 y 5-6 años", () => {
    expect([3, 4, 2].map(bandaDeEdad)).toEqual(["3-4", "3-4", "3-4"]);
    expect([5, 6, 7].map(bandaDeEdad)).toEqual(["5-6", "5-6", "5-6"]);
  });

  it("3-4 años: 150-250 palabras, 5-6 escenas, frases cortas y repetición", () => {
    const { system, user, version } = construirPrompt({ personajes, lugar: "bosque", idioma: "es", edad: 4 });
    expect(system).toContain("150 y 250 palabras");
    expect(system).toMatch(/1-3 frases CORTAS/);
    expect(system).toMatch(/revoloteo/);
    expect(system).toMatch(/izquierda, centro, derecha/);
    expect(system).toMatch(/repetición/);
    expect(system).toContain("castellano");
    expect(system).toMatch(/Nada de miedo, violencia/);
    expect(system).toMatch(/calmado/);
    expect(user).toContain("Lugar: Bosque.");
    expect(user).toContain("- [zumbillo] Zumbillo (especie: abeja; personalidad: Trabajador; forma de hablar: Con «z»)");
    expect(user).toContain("- [luna] Luna");
    expect(version).toBe("cuento-v2");
  });

  it("5-6 años: 250-400 palabras con problema y solución", () => {
    const { system } = construirPrompt({ personajes, lugar: "playa", idioma: "es", edad: 6 });
    expect(system).toContain("250 y 400 palabras");
    expect(system).toMatch(/problema/);
    expect(system).toMatch(/solución/);
  });

  it("en euskera pide escribir directamente en euskera y nombra el lugar en euskera", () => {
    const { system, user } = construirPrompt({ personajes, lugar: "fondo-mar", idioma: "eu", edad: 5 });
    expect(system).toContain("directamente en euskera");
    expect(system).toContain("no lo traduzcas");
    expect(user).toMatch(/^Lugar: /);
  });
});

describe("generarTextoCuento", () => {
  const entrada = { personajes, lugar: "bosque", idioma: "es", edad: 4 } as const;

  it("devuelve el cuento validado, el modelo por defecto y los tokens", async () => {
    const { cliente, create } = clienteQue(toolUse({ titulo: "El panal", escenas: escenas(5) }));
    const r = await generarTextoCuento(entrada, cliente);
    expect(r.cuento.titulo).toBe("El panal");
    expect(r.cuento.escenas).toHaveLength(5);
    expect(r.modelo).toBe(MODELO_TEXTO_POR_DEFECTO);
    expect(r).toMatchObject({ version: "cuento-v2", tokensEntrada: 500, tokensSalida: 900 });
    const args = create.mock.calls[0][0];
    expect(args.model).toBe("claude-haiku-4-5");
    expect(args.tool_choice).toEqual({ type: "tool", name: "entregar_cuento" });
  });

  it("ANTHROPIC_MODEL cambia el modelo", async () => {
    vi.stubEnv("ANTHROPIC_MODEL", "claude-otro");
    const { cliente, create } = clienteQue(toolUse({ titulo: "T", escenas: escenas(5) }));
    const r = await generarTextoCuento(entrada, cliente);
    expect(r.modelo).toBe("claude-otro");
    expect(create.mock.calls[0][0].model).toBe("claude-otro");
  });

  it("reintenta una vez si la salida no es válida y suma los tokens de los dos intentos", async () => {
    const { cliente, create } = clienteQue(
      toolUse({ titulo: "T", escenas: escenas(2) }, { input_tokens: 100, output_tokens: 50 }),
      toolUse({ titulo: "T", escenas: escenas(6) }, { input_tokens: 100, output_tokens: 700 }),
    );
    const r = await generarTextoCuento(entrada, cliente);
    expect(create).toHaveBeenCalledTimes(2);
    expect(r).toMatchObject({ tokensEntrada: 200, tokensSalida: 750 });
  });

  it("falla con ErrorGeneracion si no hay cuento válido o la API falla", async () => {
    const malo = toolUse({ titulo: "", escenas: [] });
    await expect(generarTextoCuento(entrada, clienteQue(malo, malo).cliente)).rejects.toBeInstanceOf(ErrorGeneracion);

    const cliente = { messages: { create: vi.fn().mockRejectedValue(new Error("red")) } } as unknown as ClienteTexto;
    await expect(generarTextoCuento(entrada, cliente)).rejects.toBeInstanceOf(ErrorGeneracion);
  });
});

describe("coste", () => {
  it("suma texto (1 / 5 USD por millón de tokens) y voz (0,30 USD por 1000 caracteres)", () => {
    const uso = { tokensEntrada: 1000, tokensSalida: 2000, caracteresTts: 2000 };
    expect(costeEstimadoUsd(uso)).toBeCloseTo(0.001 + 0.01 + 0.6, 6);
    expect(costeEstimadoCentimos(uso)).toBe(61.1);
  });
  it("sin uso no cuesta nada", () => {
    expect(costeEstimadoCentimos({ tokensEntrada: 0, tokensSalida: 0, caracteresTts: 0 })).toBe(0);
  });
});
