"use client";

import { useActionState, useEffect, useState } from "react";
import { BotonGigante } from "@/components/BotonGigante";
import { LuppoLogin } from "@/components/LuppoLogin";
import { enviarEnlace, type EstadoLogin } from "./actions";
import { ESPERA_REENVIO_S, SALUDO } from "./textos";

const inicial: EstadoLogin = { ok: null, mensaje: "" };

const claseInput =
  "min-h-16 rounded-3xl border-2 border-tinta/30 bg-crema-clara px-5 text-xl outline-none focus:border-ocre focus-visible:ring-4 focus-visible:ring-ocre/40";

// Bocadillo de Luppo + formulario. El bocadillo es la única región «viva»: lo que dice Luppo
// (saludo, enlace enviado, errores) se anuncia ahí.
export function FormularioLogin() {
  const [email, setEmail] = useState("");
  const [espera, setEspera] = useState(0);

  const [estado, accion, enviando] = useActionState(
    async (anterior: EstadoLogin, formData: FormData) => {
      const nuevo = await enviarEnlace(anterior, formData);
      if (nuevo.ok || nuevo.limite) setEspera(ESPERA_REENVIO_S);
      return nuevo;
    },
    inicial,
  );

  useEffect(() => {
    if (espera <= 0) return;
    const id = setTimeout(() => setEspera((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [espera]);

  const enviado = estado.ok === true;
  const cuenta = espera > 0 ? ` (${espera} s)` : "";

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-3">
      <p
        role="status"
        className="relative w-full rounded-3xl border-2 border-tinta/20 bg-crema-clara px-5 py-4 text-center text-xl font-bold text-tinta shadow-md after:absolute after:left-1/2 after:top-full after:-mt-3 after:h-5 after:w-5 after:-translate-x-1/2 after:rotate-45 after:border-b-2 after:border-r-2 after:border-tinta/20 after:bg-crema-clara after:content-['']"
      >
        {estado.mensaje || SALUDO}
      </p>

      <LuppoLogin />

      <form
        action={accion}
        className="flex w-full flex-col gap-4 rounded-3xl bg-crema/85 p-5 shadow-md backdrop-blur-sm"
      >
        {enviado ? (
          <>
            <input type="hidden" name="email" value={email} />
            <BotonGigante
              type="submit"
              variante="salvia"
              disabled={enviando || espera > 0}
              className="w-full"
            >
              {enviando ? "Enviando…" : `Volver a enviar${cuenta}`}
            </BotonGigante>
          </>
        ) : (
          <>
            <label htmlFor="email" className="text-xl font-extrabold text-tinta">
              Correo de mamá o papá
            </label>
            <input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              placeholder="mama@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={claseInput}
            />
            <BotonGigante
              type="submit"
              disabled={enviando || espera > 0}
              className="w-full"
            >
              {enviando ? "Enviando…" : espera > 0 ? `Espera${cuenta}` : "Entrar"}
            </BotonGigante>
          </>
        )}
      </form>
    </div>
  );
}
