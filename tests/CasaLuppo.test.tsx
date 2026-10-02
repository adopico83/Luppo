import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CasaLuppo } from "@/components/CasaLuppo";

describe("CasaLuppo", () => {
  it("saluda, enseña a Luppo y lleva al carrusel con el botón gigante", () => {
    render(<CasaLuppo />);
    expect(screen.getByRole("heading", { name: /soy luppo/i })).toBeTruthy();
    expect(screen.getByAltText("Luppo").getAttribute("src")).toBe("/fondos/luppo-casa.webp");

    const boton = screen.getByRole("link", { name: "¡Vamos a crear un cuento!" });
    expect(boton.getAttribute("href")).toBe("/personajes");
    expect(boton.className).toContain("min-h-[120px]");
  });

  it("pone la habitación de fondo, cubriendo la pantalla y anclada abajo en el centro", () => {
    const { container } = render(<CasaLuppo />);
    const escena = container.querySelector("main") as HTMLElement;
    expect(escena.style.backgroundImage).toContain("/fondos/casa-luppo.webp");
    expect(escena.style.backgroundPosition).toBe("50% 100%");
    expect(escena.className).toContain("bg-cover");
  });

  it("deja el título legible con un fondo crema semitransparente", () => {
    render(<CasaLuppo />);
    expect(screen.getByRole("heading").className).toContain("bg-crema/80");
  });
});
