// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { crearCuento, type Dependencias } from "@/lib/cuentos/servicio";
import type { ResultadoTexto } from "@/lib/cuentos/generador";
import { crearSupabaseFalso } from "./helpers/supabase-falso";

const FAMILIA = "fam-1";
const hoy = new Date("2026-10-04T12:00:00Z");

const munecos = [
  { id: "m-zum", clave: "zumbillo", nombre: "Zumbillo", especie: "abeja", personalidad: "Trabajador", forma_de_hablar: "Con z", es_sistema: true, activo: true },
  { id: "m-luna", clave: "luna", nombre: "Luna", especie: "luna", personalidad: null, forma_de_hablar: null, es_sistema: true, activo: true },
];

const baseDatos = (extra: Record<string, Record<string, unknown>[]> = {}) =>
  crearSupabaseFalso({
    miembros_familia: [{ familia_id: FAMILIA }],
    familias: [{ id: FAMILIA, idioma: "es" }],
    ajustes_familia: [{ familia_id: FAMILIA, cuentos_max_dia: 10 }],
    perfiles_hijo: [{ id: "p-1", familia_id: FAMILIA, fecha_nacimiento: "2020-01-01", rango_edad: null, created_at: "2025-01-01" }],
    munecos,
    ...extra,
  });

const texto = (): ResultadoTexto => ({
  cuento: { titulo: "El panal", escenas: ["Uno.", "Dos.", "Tres.", "Cuatro."].map((t, i) => ({ texto: t, personajes: i === 0 ? [{ personaje: "zumbillo", posicion: "izquierda" as const, gesto: "revoloteo" as const, accion: "entrar" as const }] : [] })) },
  json: { titulo: "El panal" },
  modelo: "claude-haiku-4-5",
  version: "cuento-v2",
  tokensEntrada: 1000,
  tokensSalida: 2000,
});

let deps: Dependencias;
beforeEach(() => {
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  deps = {
    generarTexto: vi.fn().mockResolvedValue(texto()),
    sintetizar: vi.fn().mockResolvedValue(new Uint8Array(32_000)),
    voz: { apiKey: "k", voiceId: "v", modelo: "eleven_multilingual_v2" },
    ahora: () => hoy,
  };
});

const entrada = { personajes: "zumbillo,luna", lugar: "bosque" };

describe("crearCuento", () => {
  it("guarda cuento y escenas, sintetiza un audio por escena y registra uso y coste", async () => {
    const { client, base } = baseDatos();
    const r = await crearCuento(client, entrada, deps);
    expect(r.tipo).toBe("ok");

    const [cuento] = base.tablas.cuentos;
    expect(r).toEqual({ tipo: "ok", id: cuento.id });
    expect(cuento).toMatchObject({
      familia_id: FAMILIA,
      perfil_id: "p-1",
      protagonistas: ["m-zum", "m-luna"],
      lugar_clave: "bosque",
      idioma: "es",
      estado: "listo",
      titulo: "El panal",
      modelo: "claude-haiku-4-5",
      version_prompt: "cuento-v2",
      modelo_tts: "eleven_multilingual_v2",
      tokens_entrada: 1000,
      tokens_salida: 2000,
      caracteres_tts: 20,
    });
    // 0,001 + 0,01 USD de texto + 20 caracteres de voz (0,006 USD)
    expect(cuento.coste_estimado_centimos).toBe(1.7);
    expect(cuento.coste_estimado_usd).toBeCloseTo(0.017, 4);

    const escenas = base.tablas.escenas;
    expect(escenas.map((e) => [e.clave, e.orden, e.tipo])).toEqual([
      ["escena-1", 1, "narracion"],
      ["escena-2", 2, "narracion"],
      ["escena-3", 3, "narracion"],
      ["escena-4", 4, "final"],
    ]);
    expect(escenas.every((e) => e.fondo_clave === "bosque")).toBe(true);
    expect(escenas[0].acciones).toEqual([
      { personaje: "zumbillo", posicion: "izquierda", gesto: "revoloteo", accion: "entrar" },
    ]);
    expect(escenas[0].audio_path).toBe(`${FAMILIA}/p-1/${cuento.id}/escena-1.mp3`);
    expect(escenas[0].audio_ms).toBe(2000);
    expect([...base.archivos.keys()]).toHaveLength(4);
    expect(deps.sintetizar).toHaveBeenCalledTimes(4);
  });

  it("pasa al generador la edad calculada, el idioma de la familia y las fichas en orden", async () => {
    const nacio = `${hoy.getFullYear() - 6}-01-01`;
    const { client } = baseDatos({
      familias: [{ id: FAMILIA, idioma: "eu" }],
      perfiles_hijo: [{ id: "p-1", familia_id: FAMILIA, fecha_nacimiento: nacio, rango_edad: null, created_at: "2025-01-01" }],
    });
    await crearCuento(client, { personajes: "luna,zumbillo", lugar: "playa" }, deps);
    const llamada = vi.mocked(deps.generarTexto).mock.calls[0][0];
    expect(llamada.idioma).toBe("eu");
    expect(llamada.lugar).toBe("playa");
    expect(llamada.edad).toBeGreaterThanOrEqual(6);
    expect(llamada.personajes.map((p) => p.clave)).toEqual(["luna", "zumbillo"]);
  });

  it("sin fecha de nacimiento usa el rango de edad, y sin nada, 4 años; crea el perfil si falta", async () => {
    const conRango = baseDatos({ perfiles_hijo: [{ id: "p-1", familia_id: FAMILIA, fecha_nacimiento: null, rango_edad: "5-6", created_at: "x" }] });
    await crearCuento(conRango.client, entrada, deps);
    expect(vi.mocked(deps.generarTexto).mock.calls[0][0].edad).toBe(5);

    const sinPerfil = baseDatos({ perfiles_hijo: [] });
    await crearCuento(sinPerfil.client, entrada, deps);
    expect(vi.mocked(deps.generarTexto).mock.calls[1][0].edad).toBe(4);
    expect(sinPerfil.base.tablas.perfiles_hijo).toHaveLength(1);
    expect(sinPerfil.base.tablas.perfiles_hijo[0]).toMatchObject({ familia_id: FAMILIA, avatar_clave: "luppo" });
    expect(sinPerfil.base.tablas.perfiles_hijo[0].nombre).toBeUndefined();
  });

  it("a partir de 10 cuentos hoy responde «limite» sin llamar a nadie; los de ayer y los fallidos no cuentan", async () => {
    const de = (estado: string, fecha: string) => ({ familia_id: FAMILIA, estado, created_at: fecha });
    const casiLleno = [
      ...Array.from({ length: 8 }, () => de("listo", "2026-10-04T08:00:00Z")),
      de("error", "2026-10-04T09:00:00Z"),
      de("listo", "2026-10-03T23:59:00Z"),
    ];
    const { client } = baseDatos({ cuentos: casiLleno });
    expect((await crearCuento(client, entrada, deps)).tipo).toBe("ok"); // 9.º
    expect((await crearCuento(client, entrada, deps)).tipo).toBe("ok"); // 10.º
    expect((await crearCuento(client, entrada, deps)).tipo).toBe("limite"); // 11.º
    expect(deps.generarTexto).toHaveBeenCalledTimes(2);
  });

  it("el ajuste de la familia puede bajar el límite pero no subirlo por encima de 10", async () => {
    const lleno = (n: number) =>
      Array.from({ length: n }, () => ({ familia_id: FAMILIA, estado: "listo", created_at: "2026-10-04T08:00:00Z" }));
    const bajo = baseDatos({ ajustes_familia: [{ familia_id: FAMILIA, cuentos_max_dia: 2 }], cuentos: lleno(2) });
    expect((await crearCuento(bajo.client, entrada, deps)).tipo).toBe("limite");
    const alto = baseDatos({ ajustes_familia: [{ familia_id: FAMILIA, cuentos_max_dia: 50 }], cuentos: lleno(10) });
    expect((await crearCuento(alto.client, entrada, deps)).tipo).toBe("limite");
  });

  it("si una voz falla, el cuento sigue listo y solo cobra las escenas con audio", async () => {
    vi.mocked(deps.sintetizar).mockImplementation(async (t) => {
      if (t === "Dos.") throw new Error("429");
      return new Uint8Array(16_000);
    });
    const { client, base } = baseDatos();
    expect((await crearCuento(client, entrada, deps)).tipo).toBe("ok");
    expect(base.tablas.cuentos[0]).toMatchObject({ estado: "listo", caracteres_tts: 16 });
    expect(base.tablas.escenas.map((e) => Boolean(e.audio_path))).toEqual([true, false, true, true]);
  });

  it("sin claves de voz guarda solo el texto", async () => {
    deps.voz = null;
    const { client, base } = baseDatos();
    expect((await crearCuento(client, entrada, deps)).tipo).toBe("ok");
    expect(deps.sintetizar).not.toHaveBeenCalled();
    expect(base.tablas.cuentos[0]).toMatchObject({ estado: "listo", caracteres_tts: 0, modelo_tts: null });
    expect(base.archivos.size).toBe(0);
  });

  it("si falla el texto marca el cuento como error y propaga el fallo", async () => {
    vi.mocked(deps.generarTexto).mockRejectedValue(new Error("sin respuesta"));
    const { client, base } = baseDatos();
    await expect(crearCuento(client, entrada, deps)).rejects.toThrow("sin respuesta");
    expect(base.tablas.cuentos[0].estado).toBe("error");
    expect(base.tablas.escenas ?? []).toHaveLength(0);
  });

  it("rechaza entradas inválidas y personajes que no existen", async () => {
    const { client, base } = baseDatos();
    expect((await crearCuento(client, { personajes: "a,b,c,d", lugar: "bosque" }, deps)).tipo).toBe("entrada");
    expect((await crearCuento(client, { personajes: "zumbillo", lugar: "volcan" }, deps)).tipo).toBe("entrada");
    expect((await crearCuento(client, { personajes: "zumbillo,fantasma", lugar: "bosque" }, deps)).tipo).toBe("entrada");
    expect(base.tablas.cuentos ?? []).toHaveLength(0);
    expect(deps.generarTexto).not.toHaveBeenCalled();
  });
});
