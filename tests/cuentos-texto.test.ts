// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { costeEstimadoCentimos, costeEstimadoUsd } from "@/lib/cuentos/coste";
import { MODELO_TEXTO_POR_DEFECTO } from "@/lib/cuentos/config";
import { ErrorGeneracion, generarTextoCuento, type ClienteTexto } from "@/lib/cuentos/generador";
import { LUGARES } from "@/lib/catalogo/lugares";
import { ACTIVIDAD_POR_LUGAR, bandaDeEdad, construirPrompt } from "@/lib/cuentos/prompt";
import { CuentoGeneradoSchema } from "@/lib/cuentos/schema";

const personajes = [
  { clave: "zumbillo", nombre: "Zumbillo", especie: "abeja", personalidad: "Trabajador", forma_de_hablar: "Con «z»" },
  { clave: "luna", nombre: "Luna" },
];
const escenas = (n: number) => Array.from({ length: n }, (_, i) => ({ texto: `Escena ${i + 1}` }));
const elegir = {
  tipo: "elegir",
  pregunta: "¿Chutamos o pasamos?",
  opciones: [
    { texto: "Chutar", emoji: "⚽", consecuencia: "¡Gooool!" },
    { texto: "Pasar", emoji: "🤝", consecuencia: "¡Buen pase!" },
  ],
};
const tocar = { tipo: "tocar", instruccion: "¡Toca el balón para chutar!", emoji: "⚽", consecuencia: "¡Golazo!" };
const contar = { tipo: "contar", instruccion: "Contemos hasta 5", hasta: 5, consecuencia: "¡Cinco!" };
// Cuento válido de n escenas (n >= 5): interacciones en la 2.ª y la 3.ª.
const cuentoValido = (n = 5, extra: Record<string, unknown> = {}) => ({
  titulo: "El panal",
  tema_educativo: "contar hasta 5",
  escenas: escenas(n).map((e, i) => (i === 1 ? { ...e, interaccion: elegir } : i === 2 ? { ...e, interaccion: tocar } : e)),
  ...extra,
});
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
  const con = (escenasPersonajes: unknown[]) => ({
    ...cuentoValido(),
    escenas: [{ texto: "a", personajes: escenasPersonajes }, ...cuentoValido().escenas.slice(1)],
  });
  const conInteracciones = (...posiciones: [number, unknown][]) => ({
    ...cuentoValido(6),
    escenas: escenas(6).map((e, i) => {
      const p = posiciones.find(([n]) => n === i);
      return p ? { ...e, interaccion: p[1] } : e;
    }),
  });

  it("acepta título, tema educativo y de 5 a 7 escenas", () => {
    for (const n of [5, 6, 7]) expect(CuentoGeneradoSchema.safeParse(cuentoValido(n)).success).toBe(true);
  });
  it("rechaza menos de 5 o más de 7 escenas, textos vacíos y falta de título o tema", () => {
    expect(CuentoGeneradoSchema.safeParse(cuentoValido(4)).success).toBe(false);
    expect(CuentoGeneradoSchema.safeParse(cuentoValido(8)).success).toBe(false);
    const vacia = cuentoValido();
    vacia.escenas[4] = { texto: " " };
    expect(CuentoGeneradoSchema.safeParse(vacia).success).toBe(false);
    expect(CuentoGeneradoSchema.safeParse({ ...cuentoValido(), titulo: undefined }).success).toBe(false);
    expect(CuentoGeneradoSchema.safeParse({ ...cuentoValido(), tema_educativo: undefined }).success).toBe(false);
  });
  it("valida la puesta en escena: posición, gesto existente y acción opcional", () => {
    expect(CuentoGeneradoSchema.safeParse(con([puesta])).success).toBe(true);
    expect(CuentoGeneradoSchema.safeParse(con([{ ...puesta, accion: undefined }])).success).toBe(true);
    expect(CuentoGeneradoSchema.safeParse(con([{ ...puesta, posicion: "arriba" }])).success).toBe(false);
    expect(CuentoGeneradoSchema.safeParse(con([{ ...puesta, gesto: "volar" }])).success).toBe(false);
    expect(CuentoGeneradoSchema.safeParse(con([{ ...puesta, accion: "bailar" }])).success).toBe(false);
  });
  it("sin personajes en la escena asume una lista vacía", () => {
    expect(CuentoGeneradoSchema.parse(cuentoValido()).escenas[0].personajes).toEqual([]);
  });

  it("exige entre 2 y 3 interacciones", () => {
    expect(CuentoGeneradoSchema.safeParse(conInteracciones([1, elegir])).success).toBe(false);
    expect(CuentoGeneradoSchema.safeParse({ ...cuentoValido(), escenas: escenas(5) }).success).toBe(false);
    expect(CuentoGeneradoSchema.safeParse(conInteracciones([1, elegir], [2, tocar])).success).toBe(true);
    expect(CuentoGeneradoSchema.safeParse(conInteracciones([1, elegir], [2, tocar], [3, contar])).success).toBe(true);
    expect(CuentoGeneradoSchema.safeParse(conInteracciones([1, elegir], [2, tocar], [3, contar], [4, tocar])).success).toBe(false);
  });
  it("nunca hay interacción en la primera escena ni en la última", () => {
    expect(CuentoGeneradoSchema.safeParse(conInteracciones([0, elegir], [2, tocar])).success).toBe(false);
    expect(CuentoGeneradoSchema.safeParse(conInteracciones([1, elegir], [5, tocar])).success).toBe(false);
  });
  it("valida cada tipo: elegir 2-3 opciones, tocar con emoji, contar con número", () => {
    const ok = (i: unknown) => CuentoGeneradoSchema.safeParse(conInteracciones([1, i], [2, tocar])).success;
    expect(ok(elegir)).toBe(true);
    expect(ok(contar)).toBe(true);
    expect(ok({ ...elegir, opciones: elegir.opciones.slice(0, 1) })).toBe(false);
    expect(ok({ ...elegir, opciones: [] })).toBe(false);
    expect(ok({ ...tocar, emoji: undefined })).toBe(false);
    expect(ok({ ...contar, hasta: 0 })).toBe(false);
    expect(ok({ tipo: "bailar" })).toBe(false);
    expect(ok({ ...elegir, opciones: [{ texto: "Solo", emoji: "x" }, ...elegir.opciones] })).toBe(false); // sin consecuencia
  });
  it("recorta en vez de rechazar lo que se pasa de largo", () => {
    const largo = "x".repeat(5000);
    const opcion = { texto: largo, emoji: "⚽", consecuencia: largo };
    const r = CuentoGeneradoSchema.parse({
      titulo: largo,
      tema_educativo: largo,
      escenas: cuentoValido().escenas.map((e, i) =>
        i === 0
          ? { texto: largo, personajes: Array.from({ length: 9 }, () => puesta) }
          : i === 1
            ? { texto: e.texto, interaccion: { tipo: "elegir", pregunta: largo, opciones: [opcion, opcion, opcion, opcion, opcion] } }
            : e,
      ),
    });
    expect(r.titulo).toHaveLength(120);
    expect(r.escenas[0].texto).toHaveLength(600);
    expect(r.escenas[0].personajes).toHaveLength(6);
    const inter = r.escenas[1].interaccion;
    expect(inter?.tipo === "elegir" && inter.opciones).toHaveLength(3);
    expect(inter?.tipo === "elegir" && inter.opciones[0].texto.length).toBeLessThanOrEqual(40);
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
    expect(system).not.toMatch(/calmado|para dormir|descansan\b|serena/);
    expect(system).toMatch(/divertidos, educativos e interactivos/);
    expect(system).toMatch(/Objetivo educativo/);
    expect(system).toMatch(/contar hasta 5/);
    expect(system).not.toMatch(/contar hasta 10/); // 5-6 años
    expect(user).toContain("Lugar: Bosque.");
    expect(user).toContain("- [zumbillo] Zumbillo (especie: abeja; personalidad: Trabajador; forma de hablar: Con «z»)");
    expect(user).toContain("- [luna] Luna");
    expect(version).toBe("cuento-v3");
  });

  it("5-6 años: 250-400 palabras con problema y solución", () => {
    const { system } = construirPrompt({ personajes, lugar: "playa", idioma: "es", edad: 6 });
    expect(system).toContain("250 y 400 palabras");
    expect(system).toMatch(/problema/);
    expect(system).toMatch(/solución/);
    expect(system).toMatch(/contar hasta 10/);
    expect(system).toMatch(/compartir/);
    expect(system).not.toMatch(/colores/);
  });

  it("cada lugar incluye su actividad en el prompt", () => {
    expect(Object.keys(ACTIVIDAD_POR_LUGAR).sort()).toEqual(LUGARES.map((l) => l.clave).sort());
    for (const { clave } of LUGARES) {
      const { system, user } = construirPrompt({ personajes, lugar: clave, idioma: "es", edad: 4 });
      expect(system).toContain(ACTIVIDAD_POR_LUGAR[clave]);
      expect(user).toContain(ACTIVIDAD_POR_LUGAR[clave]);
    }
  });

  it("el campo de fútbol: jugar un partido y marcar gol, no descansar", () => {
    const { system } = construirPrompt({ personajes, lugar: "futbol", idioma: "es", edad: 5 });
    expect(system).toMatch(/jugar un partido de fútbol y marcar gol/);
    expect(ACTIVIDAD_POR_LUGAR.playa).toMatch(/castillos de arena/);
    expect(ACTIVIDAD_POR_LUGAR.espacio).toMatch(/cohete.*planetas/);
  });

  it("pide 2-3 interacciones (elegir, tocar, contar), nunca en la primera escena, y estructura con problema y final alegre", () => {
    const { system } = construirPrompt({ personajes, lugar: "futbol", idioma: "es", edad: 4 });
    expect(system).toMatch(/entre 2 y 3 escenas llevan el campo interaccion/);
    expect(system).toMatch(/nunca la primera/);
    for (const tipo of ["elegir", "tocar", "contar"]) expect(system).toContain(`- ${tipo}:`);
    expect(system).toMatch(/problema divertido/);
    expect(system).toMatch(/final alegre/);
    expect(system).toMatch(/tema_educativo/);
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
  const malo = (usage?: { input_tokens: number; output_tokens: number }) => toolUse({ titulo: "T", tema_educativo: "x", escenas: escenas(2) }, usage);

  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it("devuelve el cuento validado, el modelo por defecto y los tokens", async () => {
    const { cliente, create } = clienteQue(toolUse(cuentoValido()));
    const r = await generarTextoCuento(entrada, cliente);
    expect(r.cuento.titulo).toBe("El panal");
    expect(r.cuento.tema_educativo).toBe("contar hasta 5");
    expect(r.cuento.escenas).toHaveLength(5);
    expect(r.modelo).toBe(MODELO_TEXTO_POR_DEFECTO);
    expect(r).toMatchObject({ version: "cuento-v3", tokensEntrada: 500, tokensSalida: 900 });
    const args = create.mock.calls[0][0];
    expect(args.model).toBe("claude-haiku-4-5");
    expect(args.tool_choice).toEqual({ type: "tool", name: "entregar_cuento" });
  });

  it("ANTHROPIC_MODEL cambia el modelo", async () => {
    vi.stubEnv("ANTHROPIC_MODEL", "claude-otro");
    const { cliente, create } = clienteQue(toolUse(cuentoValido()));
    const r = await generarTextoCuento(entrada, cliente);
    expect(r.modelo).toBe("claude-otro");
    expect(create.mock.calls[0][0].model).toBe("claude-otro");
  });

  it("reintenta si la salida no es válida, registra el detalle de zod y suma los tokens", async () => {
    const { cliente, create } = clienteQue(
      malo({ input_tokens: 100, output_tokens: 50 }),
      toolUse(cuentoValido(6), { input_tokens: 100, output_tokens: 700 }),
    );
    const r = await generarTextoCuento(entrada, cliente);
    expect(create).toHaveBeenCalledTimes(2);
    expect(r).toMatchObject({ tokensEntrada: 200, tokensSalida: 750 });
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(vi.mocked(console.error).mock.calls[0][0]).toMatch(/intento 1\/3[\s\S]*escenas/);
  });

  it("pasa el error de zod al modelo en el reintento, respondiendo a su llamada a la herramienta", async () => {
    const { cliente, create } = clienteQue(malo(), toolUse(cuentoValido()));
    await generarTextoCuento(entrada, cliente);
    const mensajes = create.mock.calls[1][0].messages;
    expect(mensajes).toHaveLength(3);
    expect(mensajes[1].role).toBe("assistant");
    expect(mensajes[2].role).toBe("user");
    expect(mensajes[2].content[0]).toMatchObject({ type: "tool_result", tool_use_id: "t1", is_error: true });
    expect(mensajes[2].content[0].content).toMatch(/escenas/);
    expect(create.mock.calls[0][0].messages).toHaveLength(1);
  });

  it("hasta 3 intentos: el tercero todavía puede salvar el cuento", async () => {
    const { cliente, create } = clienteQue(malo(), malo(), toolUse(cuentoValido()));
    const r = await generarTextoCuento(entrada, cliente);
    expect(create).toHaveBeenCalledTimes(3);
    expect(r.cuento.titulo).toBe("El panal");
  });

  it("un cuento sin interacciones se reintenta, pero uno con textos largos se acepta recortado", async () => {
    const sinInteracciones = toolUse({ ...cuentoValido(), escenas: escenas(5) });
    const largo = toolUse({ ...cuentoValido(), titulo: "T".repeat(500) });
    const { cliente, create } = clienteQue(sinInteracciones, largo);
    const r = await generarTextoCuento(entrada, cliente);
    expect(create).toHaveBeenCalledTimes(2);
    expect(r.cuento.titulo).toHaveLength(120);
  });

  it("falla con ErrorGeneracion tras 3 intentos inválidos o si la API falla", async () => {
    const { cliente, create } = clienteQue(malo(), malo(), malo());
    await expect(generarTextoCuento(entrada, cliente)).rejects.toBeInstanceOf(ErrorGeneracion);
    expect(create).toHaveBeenCalledTimes(3);
    expect(console.error).toHaveBeenCalledTimes(3);

    const roto = { messages: { create: vi.fn().mockRejectedValue(new Error("red")) } } as unknown as ClienteTexto;
    await expect(generarTextoCuento(entrada, roto)).rejects.toBeInstanceOf(ErrorGeneracion);
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
