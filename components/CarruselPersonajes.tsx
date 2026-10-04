"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/components/I18nProvider";
import { reducirMovimiento } from "@/lib/movimiento";
import { BotonGigante } from "@/components/BotonGigante";
import { ImagenMuneco } from "@/components/ImagenMuneco";
import {
  MAX_PERSONAJES,
  alternarSeleccion,
  puedeContinuar,
} from "@/lib/seleccion";

type Props = { munecos: { clave: string; nombre: string }[] };

const claseFlecha =
  "hidden md:flex min-h-[120px] min-w-[120px] shrink-0 items-center justify-center rounded-3xl bg-crema-clara text-5xl font-extrabold text-tinta shadow-md transition-transform active:scale-95";

export function CarruselPersonajes({ munecos }: Props) {
  const t = useT();
  const router = useRouter();
  const pista = useRef<HTMLDivElement>(null);
  const [seleccion, setSeleccion] = useState<string[]>([]);
  const [aviso, setAviso] = useState("");
  const [gesto, setGesto] = useState<string | null>(null);

  function tocar(clave: string) {
    if (!reducirMovimiento()) setGesto(clave);
    const nueva = alternarSeleccion(seleccion, clave);
    if (nueva === seleccion) {
      setAviso(t("carrusel.maximo", { max: MAX_PERSONAJES }));
      return;
    }
    setAviso("");
    setSeleccion(nueva);
  }

  function desplazar(sentido: 1 | -1) {
    const el = pista.current;
    // jsdom no implementa scrollBy.
    el?.scrollBy?.({ left: sentido * el.clientWidth * 0.8, behavior: "smooth" });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label={t("carrusel.anteriores")}
          onClick={() => desplazar(-1)}
          className={claseFlecha}
        >
          ‹
        </button>

        <div
          ref={pista}
          className="flex min-w-0 flex-1 snap-x snap-mandatory gap-4 overflow-x-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {munecos.map(({ clave, nombre }) => {
            const elegido = seleccion.includes(clave);
            return (
              <button
                key={clave}
                type="button"
                aria-pressed={elegido}
                onClick={() => tocar(clave)}
                className={`relative flex aspect-square min-h-[120px] min-w-[120px] flex-[0_0_max(9rem,23%)] snap-start flex-col items-center justify-between gap-2 rounded-3xl p-3 shadow-md transition-transform active:scale-95 ${
                  elegido ? "bg-crema ring-8 ring-ocre" : "bg-crema-clara"
                }`}
              >
                <ImagenMuneco
                  clave={clave}
                  nombre={nombre}
                  className="h-full min-h-0 w-full flex-1"
                  gesto={gesto === clave}
                  onGestoTerminado={() => setGesto(null)}
                />
                <span className="text-2xl font-extrabold text-tinta">
                  {nombre}
                </span>
                {elegido && (
                  <span
                    aria-hidden="true"
                    className="absolute right-2 top-2 flex h-12 w-12 items-center justify-center rounded-full bg-ocre text-3xl font-extrabold text-tinta"
                  >
                    ✓
                  </span>
                )}
              </button>
            );
          })}

          <button
            type="button"
            aria-label={t("carrusel.crear")}
            onClick={() => setAviso(t("carrusel.crearPronto"))}
            className="flex aspect-square min-h-[120px] min-w-[120px] flex-[0_0_max(9rem,23%)] snap-start items-center justify-center rounded-3xl bg-salvia/30 text-7xl font-extrabold text-tinta shadow-md transition-transform active:scale-95"
          >
            +
          </button>
        </div>

        <button
          type="button"
          aria-label={t("carrusel.siguientes")}
          onClick={() => desplazar(1)}
          className={claseFlecha}
        >
          ›
        </button>
      </div>

      <p
        role="status"
        className="min-h-8 text-center text-xl font-bold text-terracota"
      >
        {aviso}
      </p>

      <div className="flex flex-col items-center gap-4">
        <p className="text-2xl font-extrabold">
          {t("carrusel.elegidos", { n: seleccion.length, max: MAX_PERSONAJES })}
        </p>
        <BotonGigante
          variante="salvia"
          disabled={!puedeContinuar(seleccion)}
          onClick={() =>
            router.push(`/lugares?personajes=${seleccion.join(",")}`)
          }
        >
          {t("carrusel.siguiente")}
        </BotonGigante>
      </div>
    </div>
  );
}
