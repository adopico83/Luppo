import Image from "next/image";
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
      <ul className="mx-auto grid w-full max-w-4xl grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {LUGARES.map(({ clave, fondo }) => (
          <li key={clave}>
            <Link
              href={`/espera?personajes=${personajes.join(",")}&lugar=${clave}`}
              className="relative flex aspect-[4/3] min-h-[120px] flex-col justify-end overflow-hidden rounded-3xl shadow-md transition-transform active:scale-95"
            >
              <Image
                src={fondo}
                alt=""
                fill
                sizes="(min-width: 896px) 224px, (min-width: 768px) 25vw, 50vw"
                className="object-cover"
              />
              <span className="relative bg-crema/95 px-2 py-2 text-center text-lg font-extrabold leading-tight text-tinta md:text-xl">
                {t(`lugar.${clave}`)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
