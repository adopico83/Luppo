"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BotonGigante } from "@/components/BotonGigante";
import { FondoLuppo } from "@/components/FondoLuppo";
import { useT } from "@/components/I18nProvider";
import { ID_CUENTO_EJEMPLO } from "@/lib/cuentos/ejemplo";

export const CAMBIO_FRASE_MS = 3000;

const FRASES = ["espera.frase1", "espera.frase2", "espera.frase3", "espera.frase4"] as const;

type Props = { personajes: string[]; lugar: string };
type Fallo = "limite" | "generacion";

// Luppo hace malabares con tres bolitas (cascada de una mano a la otra) mientras se prepara el
// cuento. El malabarismo es solo CSS (globals.css) y prefers-reduced-motion lo deja quieto; las
// frases cambian igualmente. Al montarse pide el cuento a POST /api/cuentos (una sola vez, aunque
// React monte dos veces en desarrollo) y al terminar navega a /cuento/[id], o al cuento de ejemplo
// si el servidor no tiene claves.
export function PantallaEspera({ personajes, lugar }: Props) {
  const t = useT();
  const router = useRouter();
  const [frase, setFrase] = useState(0);
  const [fallo, setFallo] = useState<Fallo | null>(null);
  const pedido = useRef(false);
  const montada = useRef(true);

  useEffect(() => {
    const cambio = setInterval(() => setFrase((i) => (i + 1) % FRASES.length), CAMBIO_FRASE_MS);
    return () => clearInterval(cambio);
  }, []);

  useEffect(() => {
    montada.current = true;
    if (!pedido.current) {
      pedido.current = true;
      void pedirCuento(personajes, lugar).then((resultado) => {
        if (!montada.current) return;
        if (typeof resultado === "string") setFallo(resultado);
        else router.replace(resultado.destino);
      });
    }
    return () => {
      montada.current = false;
    };
  }, [personajes, lugar, router]);

  const volver =
    fallo === "limite" ? "/" : `/lugares?personajes=${personajes.join(",")}`;

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center">
      <FondoLuppo />
      <div className="relative flex w-full max-w-md flex-col items-center gap-4 px-4 py-6">
        <h1 className="sr-only">{t("espera.titulo")}</h1>

        <div className="malabar-escena mt-24">
          {/* eslint-disable-next-line @next/next/no-img-element -- imagen estática ya optimizada */}
          <img
            src="/fondos/luppo-login.webp"
            alt="Luppo"
            className="malabar-luppo h-full w-auto max-w-full"
          />
          <div aria-hidden="true" className="malabar-manos">
            <span className="malabar-bola malabar-bola-1 absolute -ml-4 -mt-4 h-8 w-8 rounded-full bg-salvia shadow" />
            <span className="malabar-bola malabar-bola-2 absolute -ml-4 -mt-4 h-8 w-8 rounded-full bg-ocre shadow" />
            <span className="malabar-bola malabar-bola-3 absolute -ml-4 -mt-4 h-8 w-8 rounded-full bg-rosa shadow" />
          </div>
        </div>

        {fallo ? (
          <>
            <p
              role="alert"
              className="w-full rounded-3xl border-2 border-terracota/40 bg-crema-clara px-5 py-4 text-center text-xl font-bold text-tinta shadow-md"
            >
              {t(fallo === "limite" ? "espera.limite" : "espera.errorGenerico")}
            </p>
            <BotonGigante href={volver} variante="salvia">
              {t("espera.volver")}
            </BotonGigante>
          </>
        ) : (
          <p
            role="status"
            className="w-full rounded-3xl border-2 border-tinta/20 bg-crema-clara px-5 py-4 text-center text-xl font-bold text-tinta shadow-md"
          >
            {t(FRASES[frase])}
          </p>
        )}
      </div>
    </main>
  );
}

// Devuelve a dónde ir o el tipo de fallo. Nunca lanza: cualquier problema es un mensaje amable.
async function pedirCuento(
  personajes: string[],
  lugar: string,
): Promise<{ destino: string } | Fallo> {
  try {
    const respuesta = await fetch("/api/cuentos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personajes, lugar }),
    });
    if (respuesta.status === 429) return "limite";
    if (!respuesta.ok) return "generacion";
    const datos = (await respuesta.json()) as { id?: string; ejemplo?: boolean };
    if (datos.id) return { destino: `/cuento/${datos.id}` };
    if (datos.ejemplo) {
      const consulta = new URLSearchParams({ personajes: personajes.join(","), lugar });
      return { destino: `/cuento/${ID_CUENTO_EJEMPLO}?${consulta}` };
    }
    return "generacion";
  } catch {
    return "generacion";
  }
}
