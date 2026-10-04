import { existsSync } from "node:fs";
import { join } from "node:path";
import { act, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

beforeEach(() => {
  replace.mockClear();
  redirect.mockClear();
});

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
  beforeEach(() => vi.useFakeTimers());

  it("Luppo hace malabares con 3 bolitas y las frases rotan cada 3 s", () => {
    const { container } = render(<PantallaEspera />);
    expect(container.querySelectorAll(".malabar-bola")).toHaveLength(3);
    expect(screen.getByAltText("Luppo").className).toContain("malabar-luppo");

    const frase = () => screen.getByRole("status").textContent;
    expect(frase()).toBe("Estoy pensando un cuento…");
    act(() => void vi.advanceTimersByTime(2900));
    expect(frase()).toBe("Estoy pensando un cuento…");
    act(() => void vi.advanceTimersByTime(200));
    expect(frase()).toBe("¡Casi lo tengo!");
  });

  it("a los 4 s vuelve a la Home con el aviso, y solo una vez", () => {
    render(<PantallaEspera />);
    act(() => void vi.advanceTimersByTime(3900));
    expect(replace).not.toHaveBeenCalled();
    act(() => void vi.advanceTimersByTime(200));
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/?aviso=cuento-pronto");
    act(() => void vi.advanceTimersByTime(10_000));
    expect(replace).toHaveBeenCalledTimes(1);
  });

  it("al salir de la pantalla cancela la vuelta a la Home", () => {
    const { unmount } = render(<PantallaEspera />);
    unmount();
    act(() => void vi.advanceTimersByTime(10_000));
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
