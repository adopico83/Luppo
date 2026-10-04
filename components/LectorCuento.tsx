"use client";

import { useRef, useState } from "react";
import { BotonGigante } from "@/components/BotonGigante";
import { FondoLuppo } from "@/components/FondoLuppo";
import { useT } from "@/components/I18nProvider";
import { ImagenMuneco } from "@/components/ImagenMuneco";
import { fondoDeLugar } from "@/lib/catalogo/lugares";
import type { CuentoLectura } from "@/lib/cuentos/lectura";

// Lee el cuento escena a escena: ilustración del lugar de fondo (con el fondo suave de Luppo
// encima), los personajes elegidos haciendo su gesto, el texto grande y botones gigantes para
// escuchar la voz y pasar a la siguiente escena. Sin voz en una escena, el botón de escuchar no sale.
export function LectorCuento({ cuento }: { cuento: CuentoLectura }) {
  const t = useT();
  const [indice, setIndice] = useState(0);
  const [sonando, setSonando] = useState(false);
  const audio = useRef<HTMLAudioElement>(null);

  const escena = cuento.escenas[indice];
  const esUltima = indice === cuento.escenas.length - 1;

  function alternarVoz() {
    const el = audio.current;
    if (!el) return;
    if (el.paused) void el.play().catch(() => setSonando(false));
    else el.pause();
  }

  function siguiente() {
    audio.current?.pause();
    setSonando(false);
    setIndice((i) => Math.min(i + 1, cuento.escenas.length - 1));
  }

  return (
    <main className="relative flex min-h-dvh flex-col items-center gap-5 px-4 py-6">
      <div
        aria-hidden="true"
        data-testid="fondo-lugar"
        className="pointer-events-none fixed inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: `url(${fondoDeLugar(cuento.lugar)})` }}
      />
      <FondoLuppo />

      <h1 className="sr-only">{cuento.titulo}</h1>

      <ul
        aria-label={t("cuento.personajes")}
        className="flex flex-wrap items-end justify-center gap-3"
      >
        {cuento.personajes.map(({ clave, nombre }) => (
          <li key={`${indice}-${clave}`}>
            {/* La clave cambia con la escena: el gesto se repite en cada una. */}
            <ImagenMuneco clave={clave} nombre={nombre} gesto className="h-28 w-28 md:h-40 md:w-40" />
          </li>
        ))}
      </ul>

      <p className="w-full max-w-2xl flex-1 rounded-3xl border-2 border-tinta/20 bg-crema-clara/90 p-6 text-2xl font-bold leading-relaxed text-tinta shadow-md md:text-3xl">
        {escena.texto}
      </p>

      <p className="text-lg font-bold text-tinta">
        {t("cuento.escena", { n: indice + 1, total: cuento.escenas.length })}
      </p>

      {escena.audioUrl && (
        <audio
          key={indice}
          ref={audio}
          src={escena.audioUrl}
          preload="auto"
          onPlay={() => setSonando(true)}
          onPause={() => setSonando(false)}
          onEnded={() => setSonando(false)}
        />
      )}

      <div className="flex flex-wrap items-center justify-center gap-4">
        {escena.audioUrl && (
          <BotonGigante variante="ocre" onClick={alternarVoz} aria-pressed={sonando}>
            {t(sonando ? "cuento.pausar" : "cuento.escuchar")}
          </BotonGigante>
        )}
        {esUltima ? (
          <BotonGigante href="/">{t("cuento.fin")}</BotonGigante>
        ) : (
          <BotonGigante onClick={siguiente}>{t("cuento.siguiente")}</BotonGigante>
        )}
      </div>
    </main>
  );
}
