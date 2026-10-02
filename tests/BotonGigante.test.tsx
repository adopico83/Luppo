import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BotonGigante } from "@/components/BotonGigante";

describe("BotonGigante", () => {
  it("muestra su texto y es un botón", () => {
    render(<BotonGigante>Empezar</BotonGigante>);
    expect(screen.getByRole("button", { name: "Empezar" })).toBeTruthy();
  });

  it("tiene un tamaño mínimo de 120 px", () => {
    render(<BotonGigante>Hola</BotonGigante>);
    const clases = screen.getByRole("button").className;
    expect(clases).toContain("min-h-[120px]");
    expect(clases).toContain("min-w-[120px]");
  });
});
