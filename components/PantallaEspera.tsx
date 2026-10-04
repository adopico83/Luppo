"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FondoLuppo } from "@/components/FondoLuppo";
import { useT } from "@/components/I18nProvider";
import { AVISO_CUENTO_PROXIMO } from "@/lib/avisos";

export const CAMBIO_FRASE_MS = 3000;
// Provisional: aún no se genera el cuento, así que se simula la espera y se vuelve a la Home.
export const ESPERA_SIMULADA_MS = 4000;

const FRASES = ["espera.frase1", "espera.frase2", "espera.frase3", "espera.frase4"] as const;

// Luppo hace malabares con tres bolitas (cascada de una mano a la otra) mientras se «piensa» el cuento. El malabarismo es solo
// CSS (globals.css) y prefers-reduced-motion lo deja quieto; las frases cambian igualmente.
export function PantallaEspera() {
  const t = useT();
  const router = useRouter();
  const [frase, setFrase] = useState(0);

  useEffect(() => {
    const cambio = setInterval(() => setFrase((i) => (i + 1) % FRASES.length), CAMBIO_FRASE_MS);
    const fin = setTimeout(
      () => router.replace(`/?aviso=${AVISO_CUENTO_PROXIMO}`),
      ESPERA_SIMULADA_MS,
    );
    return () => {
      clearInterval(cambio);
      clearTimeout(fin);
    };
  }, [router]);

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

        <p
          role="status"
          className="w-full rounded-3xl border-2 border-tinta/20 bg-crema-clara px-5 py-4 text-center text-xl font-bold text-tinta shadow-md"
        >
          {t(FRASES[frase])}
        </p>
      </div>
    </main>
  );
}
