"use client";

import { useEffect, useState } from "react";
import { claseGesto } from "@/lib/catalogo/gestos";
import { reducirMovimiento } from "@/lib/movimiento";

export const INTERVALO_GESTO_MS = 8000;

// Luppo recortado (npm run recortar:luppo), con el mismo lienzo de 1280×720 que el original:
// su cuerpo queda en el 53 % del ancho de la imagen y sus pies al 93 % de la altura.
// El contenedor lleva la posición (con su propio transform) y la imagen el gesto, para que
// las dos transformaciones no se pisen. Hace su gesto al cargar y cada ~8 s.
export function LuppoCasa() {
  const [gesto, setGesto] = useState(false);

  useEffect(() => {
    if (reducirMovimiento()) return;
    const reproducir = () => setGesto(true);
    reproducir();
    const id = setInterval(reproducir, INTERVALO_GESTO_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="pointer-events-none absolute bottom-[calc(var(--u)*63)] left-1/2 h-[calc(var(--u)*250)] w-max -translate-x-[53%]">
      {/* eslint-disable-next-line @next/next/no-img-element -- imagen estática ya optimizada */}
      <img
        src="/fondos/luppo-casa.webp"
        alt="Luppo"
        onAnimationEnd={() => setGesto(false)}
        className={`h-full w-auto max-w-none ${gesto ? (claseGesto("luppo") ?? "") : ""}`}
      />
    </div>
  );
}
