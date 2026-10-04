import Link from "next/link";
import { redirect } from "next/navigation";
import { LUGARES } from "@/lib/catalogo/lugares";
import { textosServidor } from "@/lib/i18n/servidor";
import { parsearPersonajes } from "@/lib/seleccion";

// Segundo paso: elegir el lugar del cuento. Sin personajes válidos en la URL, vuelve al carrusel.
export default async function LugaresPage({
  searchParams,
}: {
  searchParams: Promise<{ personajes?: string | string[] }>;
}) {
  const personajes = parsearPersonajes((await searchParams).personajes);
  if (!personajes) redirect("/personajes");
  const { t } = await textosServidor();

  return (
    <main className="flex min-h-dvh flex-col gap-8 bg-crema p-6 md:p-10">
      <Link
        href="/personajes"
        className="inline-flex min-h-[120px] min-w-[120px] items-center self-start text-2xl font-extrabold text-tinta underline"
      >
        {t("lugares.volver")}
      </Link>
      <h1 className="text-center text-4xl font-extrabold">{t("lugares.titulo")}</h1>
      <ul className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LUGARES.map(({ clave, emoji, fondo }) => (
          <li key={clave}>
            <Link
              href={`/espera?personajes=${personajes.join(",")}&lugar=${clave}`}
              className={`flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-3xl p-4 text-center shadow-md transition-transform active:scale-95 ${fondo}`}
            >
              <span aria-hidden="true" className="text-7xl">
                {emoji}
              </span>
              <span className="text-2xl font-extrabold text-tinta">{t(`lugar.${clave}`)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
