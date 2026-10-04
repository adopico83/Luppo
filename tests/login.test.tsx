import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FormularioLogin } from "@/app/login/FormularioLogin";
import { ENVIADO, LIMITE, SALUDO } from "@/app/login/textos";

const enviarEnlace = vi.fn();
vi.mock("@/app/login/actions", () => ({
  enviarEnlace: (...args: unknown[]) => enviarEnlace(...args),
}));

async function enviar(email = "mama@ejemplo.com") {
  fireEvent.change(screen.getByLabelText("Correo de mamá o papá"), { target: { value: email } });
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  enviarEnlace.mockReset();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("login de Luppo", () => {
  it("saluda en el bocadillo, con label y Luppo haciendo su gesto al cargar", () => {
    render(<FormularioLogin />);
    expect(screen.getByRole("status").textContent).toBe(SALUDO);
    expect(screen.getByLabelText("Correo de mamá o papá")).toBeTruthy();
    expect(screen.getByAltText("Luppo").className).toContain("gesto-saludo-pillo");
  });

  it("al enviar cambia el bocadillo y «Volver a enviar» espera 60 s con cuenta atrás", async () => {
    enviarEnlace.mockResolvedValue({ ok: true, mensaje: ENVIADO });
    render(<FormularioLogin />);
    await enviar();

    expect(enviarEnlace).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status").textContent).toBe(ENVIADO);
    const volver = () => screen.getByRole("button", { name: /Volver a enviar/ }) as HTMLButtonElement;
    expect(volver().disabled).toBe(true);
    expect(volver().textContent).toBe("Volver a enviar (60 s)");

    await act(async () => void vi.advanceTimersByTime(1000));
    expect(volver().textContent).toBe("Volver a enviar (59 s)");

    for (let i = 0; i < 59; i++) await act(async () => void vi.advanceTimersByTime(1000));
    expect(volver().disabled).toBe(false);
    expect(volver().textContent).toBe("Volver a enviar");

    // Reenvía con el mismo correo.
    enviarEnlace.mockResolvedValue({ ok: true, mensaje: ENVIADO });
    await act(async () => {
      fireEvent.click(volver());
    });
    expect(enviarEnlace).toHaveBeenCalledTimes(2);
    expect((enviarEnlace.mock.calls[1][1] as FormData).get("email")).toBe("mama@ejemplo.com");
  });

  it("si Supabase limita los intentos, Luppo pide esperar y el botón se bloquea", async () => {
    enviarEnlace.mockResolvedValue({ ok: false, limite: true, mensaje: LIMITE });
    render(<FormularioLogin />);
    await enviar();

    expect(screen.getByRole("status").textContent).toBe(LIMITE);
    const entrar = screen.getByRole("button", { name: /Espera/ }) as HTMLButtonElement;
    expect(entrar.disabled).toBe(true);
    expect((screen.getByLabelText("Correo de mamá o papá") as HTMLInputElement).value).toBe(
      "mama@ejemplo.com",
    );
  });

  it("un error normal no bloquea el botón", async () => {
    enviarEnlace.mockResolvedValue({ ok: false, mensaje: "Escribe un email válido." });
    render(<FormularioLogin />);
    await enviar("x@y.z");
    expect(screen.getByRole("status").textContent).toBe("Escribe un email válido.");
    expect((screen.getByRole("button", { name: "Entrar" }) as HTMLButtonElement).disabled).toBe(false);
  });
});
