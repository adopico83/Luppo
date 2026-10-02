import { BotonGigante } from "@/components/BotonGigante";

// Pantalla de bienvenida: la casa de Luppo a pantalla completa.
//
// El fondo (1280×720) se escala con `cover` y va anclado ABAJO, centrado: en pantallas más altas o
// más anchas se recorta por los lados o por arriba, pero la alfombra (abajo, en el centro) siempre
// se ve. Luppo se coloca con la variable --u (ver globals.css), que vale lo mismo que 1 px del
// dibujo original después de escalarlo, así sus pies caen sobre la alfombra en cualquier pantalla.
export function CasaLuppo() {
  return (
    <main
      className="escena-casa relative flex min-h-dvh flex-col items-center overflow-hidden bg-crema bg-cover bg-no-repeat"
      style={{
        backgroundImage: "url(/fondos/casa-luppo.webp)",
        backgroundPosition: "50% 100%",
      }}
    >
      <div className="relative z-10 flex flex-col items-center gap-6 px-4 pt-8 text-center md:pt-12">
        <h1 className="rounded-3xl bg-crema/80 px-6 py-3 text-3xl font-extrabold text-tinta backdrop-blur-sm md:text-5xl">
          ¡Hola! Soy Luppo
        </h1>
        <BotonGigante href="/personajes">¡Vamos a crear un cuento!</BotonGigante>
      </div>

      {/* Luppo recortado (npm run recortar:luppo), con el mismo lienzo de 1280×720 que el original:
          su cuerpo queda en el 53 % del ancho de la imagen y sus pies al 93 % de la altura. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- imagen estática ya optimizada */}
      <img
        src="/fondos/luppo-casa.webp"
        alt="Luppo"
        className="pointer-events-none absolute bottom-[calc(var(--u)*63)] left-1/2 h-[calc(var(--u)*250)] w-auto max-w-none -translate-x-[53%]"
      />
    </main>
  );
}
