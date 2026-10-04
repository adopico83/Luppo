"use client";

import { useEffect, useRef, useState } from "react";
import { claseGesto } from "@/lib/catalogo/gestos";

type Props = {
  clave: string;
  nombre: string;
  className?: string;
  // Mientras sea true, reproduce el gesto del personaje; avisa al terminar.
  gesto?: boolean;
  onGestoTerminado?: () => void;
};

// Fondos suaves y apagados (paleta Luppo a baja opacidad).
const FONDOS = [
  "bg-salvia/30",
  "bg-ocre/30",
  "bg-terracota/25",
  "bg-rosa/40",
  "bg-tinta/15",
];

function fondoPara(clave: string): string {
  let hash = 0;
  for (const letra of clave) hash = (hash * 31 + letra.charCodeAt(0)) >>> 0;
  return FONDOS[hash % FONDOS.length];
}

// Muestra el dibujo del muñeco; si no existe aún, un bloque suave con su nombre.
export function ImagenMuneco({
  clave,
  nombre,
  className = "",
  gesto = false,
  onGestoTerminado,
}: Props) {
  const animacion = gesto ? (claseGesto(clave) ?? "") : "";
  const [fallo, setFallo] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  // La imagen puede haber fallado antes de hidratar: onError ya no saltaría.
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFallo(true);
  }, []);

  if (fallo) {
    return (
      <div
        role="img"
        aria-label={nombre}
        className={`flex items-center justify-center rounded-3xl p-2 text-center text-2xl font-extrabold text-tinta ${fondoPara(clave)} ${className} ${animacion}`}
        onAnimationEnd={onGestoTerminado}
      >
        {nombre}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- imágenes estáticas sin optimizar
    <img
      ref={ref}
      src={`/munecos/${clave}.jpg`}
      alt={nombre}
      onError={() => setFallo(true)}
      onAnimationEnd={onGestoTerminado}
      className={`rounded-3xl object-cover ${className} ${animacion}`}
    />
  );
}
