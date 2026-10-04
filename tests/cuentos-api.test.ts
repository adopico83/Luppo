// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const crearCuento = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser } }),
}));
vi.mock("@/lib/cuentos/servicio", () => ({ crearCuento: (...a: unknown[]) => crearCuento(...a) }));

import { POST } from "@/app/api/cuentos/route";

const peticion = (cuerpo: unknown) =>
  new Request("http://localhost/api/cuentos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof cuerpo === "string" ? cuerpo : JSON.stringify(cuerpo),
  });
const valida = { personajes: ["flan", "luna"], lugar: "bosque" };

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.stubEnv("ANTHROPIC_API_KEY", "clave-de-prueba");
  getUser.mockReset().mockResolvedValue({ data: { user: { id: "u1" } } });
  crearCuento.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/cuentos", () => {
  it("sin sesión responde 401", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const r = await POST(peticion(valida));
    expect(r.status).toBe(401);
    expect(crearCuento).not.toHaveBeenCalled();
  });

  it("con cuerpo inválido responde 400", async () => {
    expect((await POST(peticion("no es json"))).status).toBe(400);
    expect((await POST(peticion({ personajes: [], lugar: "bosque" }))).status).toBe(400);
    expect((await POST(peticion({ personajes: ["a", "b", "c", "d"], lugar: "bosque" }))).status).toBe(400);
  });

  it("sin clave de Anthropic devuelve el cuento de ejemplo en vez de romperse", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const r = await POST(peticion(valida));
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ ejemplo: true });
    expect(crearCuento).not.toHaveBeenCalled();
  });

  it("crea el cuento con personajes y lugar y devuelve su id", async () => {
    crearCuento.mockResolvedValue({ tipo: "ok", id: "cuento-1" });
    const r = await POST(peticion(valida));
    expect(await r.json()).toEqual({ id: "cuento-1" });
    expect(crearCuento.mock.calls[0][1]).toEqual({ personajes: "flan,luna", lugar: "bosque" });
  });

  it("límite diario: 429 con código «limite»", async () => {
    crearCuento.mockResolvedValue({ tipo: "limite" });
    const r = await POST(peticion(valida));
    expect(r.status).toBe(429);
    expect(await r.json()).toEqual({ error: "limite" });
  });

  it("entrada que el servicio no reconoce: 400", async () => {
    crearCuento.mockResolvedValue({ tipo: "entrada" });
    expect((await POST(peticion(valida))).status).toBe(400);
  });

  it("fallo de generación: 502 sin filtrar el error interno", async () => {
    crearCuento.mockRejectedValue(new Error("detalle interno con sk-secreto"));
    const r = await POST(peticion(valida));
    expect(r.status).toBe(502);
    expect(JSON.stringify(await r.json())).not.toMatch(/secreto|interno/);
  });
});
