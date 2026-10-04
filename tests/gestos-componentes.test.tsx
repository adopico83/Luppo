import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CarruselPersonajes } from "@/components/CarruselPersonajes";
import { CasaLuppo } from "@/components/CasaLuppo";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

function simularMovimientoReducido(reducido: boolean) {
  window.matchMedia = ((q: string) => ({
    matches: reducido && q.includes("prefers-reduced-motion"),
  })) as unknown as typeof window.matchMedia;
}

afterEach(() => {
  // @ts-expect-error jsdom no define matchMedia
  delete window.matchMedia;
  vi.useRealTimers();
});

describe("gesto en el carrusel", () => {
  const munecos = [{ clave: "flan", nombre: "Flan" }];
  const imagen = () => screen.getByAltText("Flan");

  it("al tocar reproduce el gesto una vez y al terminar se quita", () => {
    render(<CarruselPersonajes munecos={munecos} />);
    expect(imagen().className).not.toContain("gesto-");
    fireEvent.click(screen.getByRole("button", { name: /Flan/ }));
    expect(imagen().className).toContain("gesto-tembleque");
    fireEvent.animationEnd(imagen());
    expect(imagen().className).not.toContain("gesto-");
  });

  it("con prefers-reduced-motion no hay gesto", () => {
    simularMovimientoReducido(true);
    render(<CarruselPersonajes munecos={munecos} />);
    fireEvent.click(screen.getByRole("button", { name: /Flan/ }));
    expect(imagen().className).not.toContain("gesto-");
  });
});

describe("gesto de Luppo en la Home", () => {
  beforeEach(() => vi.useFakeTimers());

  it("lo hace al cargar y se repite cada ~8 s", () => {
    render(<CasaLuppo />);
    const luppo = () => screen.getByAltText("Luppo");
    expect(luppo().className).toContain("gesto-saludo-pillo");
    fireEvent.animationEnd(luppo());
    expect(luppo().className).not.toContain("gesto-");
    act(() => vi.advanceTimersByTime(7900));
    expect(luppo().className).not.toContain("gesto-");
    act(() => vi.advanceTimersByTime(200));
    expect(luppo().className).toContain("gesto-saludo-pillo");
  });

  it("con prefers-reduced-motion no se anima", () => {
    simularMovimientoReducido(true);
    render(<CasaLuppo />);
    act(() => vi.advanceTimersByTime(20000));
    expect(screen.getByAltText("Luppo").className).not.toContain("gesto-");
  });
});
