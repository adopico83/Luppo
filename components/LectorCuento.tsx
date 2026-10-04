"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { BotonGigante } from "@/components/BotonGigante";
import { FondoLuppo } from "@/components/FondoLuppo";
import { useT } from "@/components/I18nProvider";
import { ImagenMuneco } from "@/components/ImagenMuneco";
import { fondoDeLugar } from "@/lib/catalogo/lugares";
import type { CuentoLectura } from "@/lib/cuentos/lectura";
import { puestaEnEscena } from "@/lib/cuentos/puesta";

// Lee el cuento escena a escena: ilustración del lugar a pantalla completa (con el fondo suave de
// Luppo encima), los personajes elegidos de cuerpo entero sobre el suelo del dibujo, y abajo una
// franja con el texto (corto: lo cuenta la voz) y los botones gigantes. La voz de cada escena suena
// sola al entrar (tras el primer toque, por la política de autoplay del navegador) y «Siguiente»
// se resalta cuando acaba.
export function LectorCuento({ cuento }: { cuento: CuentoLectura }) {
  const t = useT();
  const [indice, setIndice] = useState(0);
  const [sonando, setSonando] = useState(false);
  const [terminado, setTerminado] = useState(false);
  const [bloqueado, setBloqueado] = useState(false);
  const audio = useRef<HTMLAudioElement>(null);

  const escena = cuento.escenas[indice];
  const esUltima = indice === cuento.escenas.length - 1;
  const puesta = puestaEnEscena(cuento.personajes, escena.acciones, cuento.lugar);

  function reproducir() {
    const el = audio.current;
    if (!el) return;
    el.play()?.then(() => setBloqueado(false), () => setBloqueado(true));
  }

  // Al entrar en una escena con voz intenta sonar sola. Si el navegador no lo deja (aún no ha
  // habido ningún toque), queda pendiente y suena con el primer toque en la pantalla.
  useEffect(() => {
    reproducir();
  }, [indice]);

  useEffect(() => {
    if (!bloqueado) return;
    const alTocar = () => reproducir();
    window.addEventListener("pointerdown", alTocar, { once: true });
    return () => window.removeEventListener("pointerdown", alTocar);
  }, [bloqueado]);

  function alternarVoz() {
    const el = audio.current;
    if (!el) return;
    if (sonando) {
      el.pause();
      return;
    }
    el.currentTime = 0; // «Repetir voz»: siempre desde el principio
    setTerminado(false);
    reproducir();
  }

  function siguiente() {
    audio.current?.pause();
    setSonando(false);
    setTerminado(false);
    setBloqueado(false);
    setIndice((i) => Math.min(i + 1, cuento.escenas.length - 1));
  }

  return (
    <main className="relative flex h-dvh flex-col justify-end overflow-hidden">
      <div aria-hidden="true" data-testid="fondo-lugar" className="pointer-events-none fixed inset-0 -z-20">
        <Image
          src={fondoDeLugar(cuento.lugar)}
          alt=""
          fill
          sizes="100vw"
          quality={88}
          preload
          className="object-cover"
        />
      </div>
      <FondoLuppo />

      <h1 className="sr-only">{cuento.titulo}</h1>

      {/* Escenario: los pies de los personajes pisan el suelo del dibujo (parte baja-media). */}
      <ul aria-label={t("cuento.personajes")} className="pointer-events-none absolute inset-0">
        {puesta.map(({ clave, nombre, izquierda, lado, gesto, movimiento }) => (
          <li
            key={`${indice}-${clave}`}
            data-testid={`personaje-${clave}`}
            className="absolute bottom-[38%] h-[40dvh] w-[32vw] -translate-x-1/2 md:bottom-[34%] md:h-[48dvh] md:w-[24vw]"
            style={{ left: `${izquierda}%`, "--lado": lado } as CSSProperties}
          >
            {/* Capa de movimiento (entrar, caminar...) entre la posición y el gesto del dibujo. */}
            <div className={`relative h-full w-full ${movimiento ? `mover-${movimiento}` : ""}`}>
              <span
                aria-hidden="true"
                className="absolute inset-x-[12%] bottom-0 h-[6%] rounded-[50%] bg-tinta/35 blur-md"
              />
              {/* La clave cambia con la escena: el gesto se repite en cada una. */}
              <ImagenMuneco
                clave={clave}
                nombre={nombre}
                gesto
                variante="recorte"
                nombreGesto={gesto}
                className="relative h-full w-full"
              />
            </div>
          </li>
        ))}
      </ul>

      {escena.audioUrl && (
        <audio
          key={indice}
          ref={audio}
          src={escena.audioUrl}
          preload="auto"
          onPlay={() => setSonando(true)}
          onPause={() => setSonando(false)}
          onEnded={() => {
            setSonando(false);
            setTerminado(true);
          }}
          onError={() => setTerminado(true)}
        />
      )}

      {/* Franja de abajo: poco texto para tapar poco dibujo. */}
      <div className="relative flex flex-col gap-3 p-3 md:flex-row md:items-end md:gap-5 md:p-5">
        <div className="flex-1 rounded-3xl border-2 border-tinta/20 bg-crema-clara/90 px-5 py-3 text-tinta shadow-md">
          <p className="text-lg font-bold leading-snug md:text-xl">{escena.texto}</p>
          <p className="mt-1 text-sm font-bold opacity-70">
            {t("cuento.escena", { n: indice + 1, total: cuento.escenas.length })}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {escena.audioUrl && (
            <BotonGigante variante="ocre" onClick={alternarVoz} aria-pressed={sonando}>
              {t(sonando ? "cuento.pausar" : "cuento.repetir")}
            </BotonGigante>
          )}
          {esUltima ? (
            <BotonGigante href="/" className={terminado ? "animate-pulse ring-8 ring-ocre" : ""}>
              {t("cuento.fin")}
            </BotonGigante>
          ) : (
            <BotonGigante
              onClick={siguiente}
              data-resaltado={terminado}
              className={terminado ? "animate-pulse ring-8 ring-ocre" : ""}
            >
              {t("cuento.siguiente")}
            </BotonGigante>
          )}
        </div>
      </div>
    </main>
  );
}
