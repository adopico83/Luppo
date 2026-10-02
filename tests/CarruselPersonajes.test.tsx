import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CarruselPersonajes } from "@/components/CarruselPersonajes";
import { ImagenMuneco } from "@/components/ImagenMuneco";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const munecos = [
  { clave: "zumbillo", nombre: "Zumbillo" },
  { clave: "luppo", nombre: "Luppo" },
  { clave: "nube", nombre: "Nube" },
  { clave: "pipa", nombre: "Pipa" },
];

const tarjeta = (nombre: string) =>
  screen.getByRole("button", { name: new RegExp(nombre) });
const siguiente = () =>
  screen.getByRole("button", { name: "Siguiente" }) as HTMLButtonElement;

beforeEach(() => push.mockClear());

describe("CarruselPersonajes", () => {
  it("muestra todos los nombres y la tarjeta +", () => {
    render(<CarruselPersonajes munecos={munecos} />);
    for (const { nombre } of munecos) {
      expect(tarjeta(nombre)).toBeTruthy();
    }
    expect(screen.getByText("+")).toBeTruthy();
  });

  it("al tocar una tarjeta se marca y al volver a tocar se desmarca", () => {
    render(<CarruselPersonajes munecos={munecos} />);
    fireEvent.click(tarjeta("Luppo"));
    expect(tarjeta("Luppo").getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(tarjeta("Luppo"));
    expect(tarjeta("Luppo").getAttribute("aria-pressed")).toBe("false");
  });

  it("ignora el cuarto personaje", () => {
    render(<CarruselPersonajes munecos={munecos} />);
    for (const n of ["Zumbillo", "Luppo", "Nube", "Pipa"]) {
      fireEvent.click(tarjeta(n));
    }
    expect(tarjeta("Pipa").getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByText("Has elegido 3 de 3")).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain(
      "Solo puedes elegir 3",
    );
  });

  it("Siguiente está desactivado con 0 y activo con 1 a 3", () => {
    render(<CarruselPersonajes munecos={munecos} />);
    expect(siguiente().disabled).toBe(true);
    for (const n of ["Zumbillo", "Luppo", "Nube"]) {
      fireEvent.click(tarjeta(n));
      expect(siguiente().disabled).toBe(false);
    }
  });

  it("Siguiente navega con los personajes en orden de toque", () => {
    render(<CarruselPersonajes munecos={munecos} />);
    fireEvent.click(tarjeta("Nube"));
    fireEvent.click(tarjeta("Zumbillo"));
    fireEvent.click(siguiente());
    expect(push).toHaveBeenCalledWith("/lugares?personajes=nube,zumbillo");
  });

  it("el + muestra el mensaje de muy pronto", () => {
    render(<CarruselPersonajes munecos={munecos} />);
    fireEvent.click(screen.getByText("+"));
    expect(screen.getByRole("status").textContent).toContain(
      "¡Muy pronto podrás crear tu propio personaje!",
    );
  });

  it("las flechas no fallan aunque jsdom no tenga scrollBy", () => {
    render(<CarruselPersonajes munecos={munecos} />);
    fireEvent.click(screen.getByLabelText("Ver más personajes"));
    fireEvent.click(screen.getByLabelText("Ver personajes anteriores"));
  });
});

describe("ImagenMuneco", () => {
  it("muestra la imagen y, si falla, un marcador con el nombre", () => {
    render(<ImagenMuneco clave="zumbillo" nombre="Zumbillo" />);
    const img = screen.getByAltText("Zumbillo");
    expect(img.getAttribute("src")).toBe("/munecos/zumbillo.jpg");
    fireEvent.error(img);
    expect(screen.queryByAltText("Zumbillo")).toBeNull();
    expect(screen.getByText("Zumbillo")).toBeTruthy();
  });
});
