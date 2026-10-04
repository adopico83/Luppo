"use client";

import { BotonGigante } from "@/components/BotonGigante";
import { LuppoCasa } from "@/components/LuppoCasa";
import { useT } from "@/components/I18nProvider";

// Pantalla de bienvenida: la casa de Luppo a pantalla completa.
//
// El fondo (1280×720) se escala con `cover` y va anclado ABAJO, centrado: en pantallas más altas o
// más anchas se recorta por los lados o por arriba, pero la alfombra (abajo, en el centro) siempre
// se ve. Luppo se coloca con la variable --u (ver globals.css), que vale lo mismo que 1 px del
// dibujo original después de escalarlo, así sus pies caen sobre la alfombra en cualquier pantalla.
export function CasaLuppo({ aviso = false }: { aviso?: boolean }) {
  const t = useT();

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
          {t("casa.titulo")}
        </h1>
        <BotonGigante href="/personajes">{t("casa.empezar")}</BotonGigante>
        {aviso && (
          <p
            role="status"
            className="rounded-3xl bg-crema-clara px-6 py-3 text-xl font-bold text-tinta shadow-md"
          >
            {t("casa.avisoCuento")}
          </p>
        )}
      </div>

      <LuppoCasa />
    </main>
  );
}
