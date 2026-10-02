"use client";

import { useActionState } from "react";
import { BotonGigante } from "@/components/BotonGigante";
import { enviarEnlace, type EstadoLogin } from "./actions";

const inicial: EstadoLogin = { ok: null, mensaje: "" };

export function FormularioLogin() {
  const [estado, accion, enviando] = useActionState(enviarEnlace, inicial);

  return (
    <form action={accion} className="flex w-full max-w-md flex-col gap-5">
      <label htmlFor="email" className="text-lg font-extrabold">
        Tu email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        placeholder="papa@ejemplo.com"
        className="min-h-14 rounded-2xl border-2 border-tinta/30 bg-crema-clara px-4 text-lg outline-none focus:border-ocre"
      />
      <BotonGigante type="submit" disabled={enviando}>
        {enviando ? "Enviando…" : "Enviarme un enlace"}
      </BotonGigante>
      {estado.mensaje && (
        <p
          role="status"
          className={`rounded-2xl px-4 py-3 text-base font-semibold ${
            estado.ok ? "bg-salvia/30" : "bg-terracota/20"
          }`}
        >
          {estado.mensaje}
        </p>
      )}
    </form>
  );
}
