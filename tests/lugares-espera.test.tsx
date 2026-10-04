import { existsSync } from "node:fs";
import { join } from "node:path";
import { act, render, screen, within } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CasaLuppo } from "@/components/CasaLuppo";
import { PantallaEspera } from "@/components/PantallaEspera";
import { LUGARES, esLugar, fondoDeLugar } from "@/lib/catalogo/lugares";
import { t } from "@/lib/i18n";
import LugaresPage from "@/app/lugares/page";
import EsperaPage from "@/app/espera/page";

const replace = vi.fn();
const router = { replace, push: vi.fn() };
const redirect = vi.fn((destino: string) => {
  throw new Error(`REDIRECT ${destino}`);
});
vi.mock("next/navigation", () => ({ useRouter: () => router, redirect: (d: string) => redirect(d) }));
vi.mock("@/lib/i18n/servidor", () => ({
  textosServidor: async () => ({ idioma: "es", t: (c: never, v?: never) => t(c, "es", v) }),
}));

const params = <T,>(valor: T) => Promise.resolve(valor);

// Nada de red real: /espera pide el cuento a /api/cuentos.
const fetchMock = vi.fn();

beforeEach(() => {
  replace.mockClear();
  redirect.mockClear();
  fetchMock.mockReset().mockReturnValue(new Promise(() => {}));
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe("catálogo de lugares", () => {
  it("tiene los 8 lugares, con fondo ilustrado y nombre en los dos idiomas", () => {
    expect(LUGARES.map((l) => l.clave)).toEqual([
      "bosque", "playa", "espacio", "castillo", "fondo-mar", "futbol", "patinete", "atracciones",
    ]);
    for (const { clave, fondo } of LUGARES) {
      expect(fondo).toBe(`/lugares/${clave}.webp`);
      expect(existsSync(join(process.cwd(), "public", fondo))).toBe(true);
      expect(t(`lugar.${clave}`, "es")).not.toMatch(/^lugar\./);
      expect(t(`lugar.${clave}`, "eu")).not.toMatch(/^lugar\./);
    }
    expect(t("lugar.fondo-mar", "es")).toBe("Fondo del mar");
    expect(t("lugar.futbol", "es")).toBe("Campo de fútbol");
    expect(esLugar("playa")).toBe(true);
    expect(esLugar("volcan")).toBe(false);
    expect(fondoDeLugar("castillo")).toBe("/lugares/castillo.webp");
  });
});

describe("pantalla de lugares", () => {
  it("enseña una tarjeta por lugar con su ilustración y nombre, que lleva a la espera", async () => {
    render(await LugaresPage({ searchParams: params({ personajes: "flan,luna" }) }));
    expect(screen.getByRole("heading", { name: "¿Dónde pasa el cuento?" })).toBeTruthy();
    const lista = within(screen.getByRole("list"));
    expect(lista.getAllByRole("link")).toHaveLength(8);
    const playa = lista.getByRole("link", { name: "Playa" });
    expect(playa.getAttribute("href")).toBe("/espera?personajes=flan,luna&lugar=playa");
    expect(playa.className).toContain("min-h-[120px]");
    expect(playa.querySelector("img")?.getAttribute("src")).toContain("playa.webp");
    expect(playa.textContent).toBe("Playa");
    expect(lista.getByRole("link", { name: "Parque de atracciones" })).toBeTruthy();
    // La imagen cubre toda la tarjeta y el nombre es una franja fina encima
    expect(playa.className).toContain("aspect-[4/5]");
    expect(playa.querySelector("img")?.className).toContain("object-cover");
    expect(playa.querySelector("span")?.className).toContain("backdrop-blur-sm");
    expect(screen.getByTestId("fondo-luppo")).toBeTruthy();
  });

  it("tiene botón Volver al carrusel", async () => {
    render(await LugaresPage({ searchParams: params({ personajes: "flan" }) }));
    expect(screen.getByRole("link", { name: "Volver" }).getAttribute("href")).toBe("/personajes");
  });

  it("sin personajes válidos vuelve al carrusel", async () => {
    await expect(LugaresPage({ searchParams: params({}) })).rejects.toThrow("REDIRECT /personajes");
    await expect(LugaresPage({ searchParams: params({ personajes: "a,b,c,d" }) })).rejects.toThrow(
      "REDIRECT /personajes",
    );
  });
});

describe("ruta de espera", () => {
  it("con lugar y personajes válidos enseña la pantalla de espera", async () => {
    render(await EsperaPage({ searchParams: params({ personajes: "flan", lugar: "bosque" }) }));
    expect(screen.getByRole("status")).toBeTruthy();
    const fondo = screen.getByTestId("fondo-luppo");
    expect(fondo.getAttribute("aria-hidden")).toBe("true");
    expect(fondo.className).toContain("pointer-events-none");
  });

  it("si falta el lugar vuelve a elegirlo; si faltan los personajes, al carrusel", async () => {
    await expect(
      EsperaPage({ searchParams: params({ personajes: "flan", lugar: "volcan" }) }),
    ).rejects.toThrow("REDIRECT /lugares?personajes=flan");
    await expect(EsperaPage({ searchParams: params({ lugar: "bosque" }) })).rejects.toThrow(
      "REDIRECT /personajes",
    );
  });
});

describe("pantalla de espera", () => {
  const props = { personajes: ["flan", "luna"], lugar: "bosque" };
  const respuesta = (estado: number, cuerpo: unknown = {}) =>
    ({ ok: estado >= 200 && estado < 300, status: estado, json: async () => cuerpo }) as Response;

  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("Luppo hace malabares con 3 bolitas y las frases rotan cada 3 s", () => {
    fetchMock.mockReturnValue(new Promise(() => {}));
    const { container } = render(<PantallaEspera {...props} />);
    expect(container.querySelectorAll(".malabar-bola")).toHaveLength(3);
    expect(screen.getByAltText("Luppo").className).toContain("malabar-luppo");

    const frase = () => screen.getByRole("status").textContent;
    expect(frase()).toBe("Estoy pensando un cuento…");
    act(() => void vi.advanceTimersByTime(2900));
    expect(frase()).toBe("Estoy pensando un cuento…");
    act(() => void vi.advanceTimersByTime(200));
    expect(frase()).toBe("¡Casi lo tengo!");
  });

  it("pide el cuento una sola vez con personajes y lugar, y al terminar navega a /cuento/[id]", async () => {
    fetchMock.mockResolvedValue(respuesta(200, { id: "abc-123" }));
    render(<PantallaEspera {...props} />);
    await act(async () => {});
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/cuentos");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ personajes: ["flan", "luna"], lugar: "bosque" });
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/cuento/abc-123");
    act(() => void vi.advanceTimersByTime(10_000));
    expect(replace).toHaveBeenCalledTimes(1);
  });

  it("mientras tarda no navega y mantiene frases y malabares", async () => {
    fetchMock.mockReturnValue(new Promise(() => {}));
    render(<PantallaEspera {...props} />);
    act(() => void vi.advanceTimersByTime(20_000));
    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toBeTruthy();
  });

  it("aunque React la monte dos veces (StrictMode) solo hay una petición y se navega", async () => {
    fetchMock.mockResolvedValue(respuesta(200, { id: "x1" }));
    render(
      <StrictMode>
        <PantallaEspera {...props} />
      </StrictMode>,
    );
    await act(async () => {});
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/cuento/x1");
  });

  it("sin claves en el servidor lleva al cuento de ejemplo con la misma elección", async () => {
    fetchMock.mockResolvedValue(respuesta(200, { ejemplo: true }));
    render(<PantallaEspera {...props} />);
    await act(async () => {});
    const destino = new URL(replace.mock.calls[0][0], "http://luppo.test");
    expect(destino.pathname).toBe("/cuento/ejemplo");
    expect(destino.searchParams.get("personajes")).toBe("flan,luna");
    expect(destino.searchParams.get("lugar")).toBe("bosque");
  });

  it("al pasarse del límite diario avisa con cariño y vuelve a la Home", async () => {
    fetchMock.mockResolvedValue(respuesta(429, { error: "limite" }));
    render(<PantallaEspera {...props} />);
    await act(async () => {});
    expect(screen.getByRole("alert").textContent).toBe(t("espera.limite", "es"));
    expect(screen.getByRole("link", { name: "Volver" }).getAttribute("href")).toBe("/");
    expect(replace).not.toHaveBeenCalled();
  });

  it("si falla el servidor o la red, mensaje amable y vuelta a elegir lugar", async () => {
    fetchMock.mockResolvedValueOnce(respuesta(502, { error: "generacion" }));
    const { unmount } = render(<PantallaEspera {...props} />);
    await act(async () => {});
    expect(screen.getByRole("alert").textContent).toBe(t("espera.errorGenerico", "es"));
    expect(screen.getByRole("link", { name: "Volver" }).getAttribute("href")).toBe(
      "/lugares?personajes=flan,luna",
    );
    unmount();

    fetchMock.mockRejectedValueOnce(new Error("sin red"));
    render(<PantallaEspera personajes={["flan"]} lugar="playa" />);
    await act(async () => {});
    expect(screen.getByRole("alert").textContent).toBe(t("espera.errorGenerico", "es"));
    expect(replace).not.toHaveBeenCalled();
  });

  it("al salir de la pantalla no navega aunque llegue la respuesta", async () => {
    let resolver: (r: Response) => void = () => {};
    fetchMock.mockReturnValue(new Promise<Response>((r) => (resolver = r)));
    const { unmount } = render(<PantallaEspera {...props} />);
    unmount();
    resolver(respuesta(200, { id: "tarde" }));
    await act(async () => {});
    expect(replace).not.toHaveBeenCalled();
  });
});

describe("aviso en la Home", () => {
  it("solo aparece si se pide", () => {
    const { rerender } = render(<CasaLuppo />);
    expect(screen.queryByText("El cuento llega en el próximo paso")).toBeNull();
    rerender(<CasaLuppo aviso />);
    expect(screen.getByRole("status").textContent).toBe("El cuento llega en el próximo paso");
  });
});
