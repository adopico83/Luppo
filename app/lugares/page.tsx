import Link from "next/link";

// Marcador: la elección de lugar llega en una fase posterior.
export default async function LugaresPage({
  searchParams,
}: {
  searchParams: Promise<{ personajes?: string | string[] }>;
}) {
  const { personajes } = await searchParams;
  const texto = Array.isArray(personajes) ? personajes[0] : personajes;
  const cantidad = texto ? texto.split(",").filter(Boolean).length : 0;

  return (
    <main className="flex min-h-dvh flex-col items-center gap-6 bg-crema p-6 text-center md:p-10">
      <h1 className="text-4xl font-extrabold">Lugares</h1>
      <p className="text-2xl">Muy pronto: aquí elegirás el lugar del cuento.</p>
      <p className="text-xl">Personajes elegidos: {cantidad}</p>
      <Link
        href="/personajes"
        className="inline-flex min-h-[120px] min-w-[120px] items-center text-2xl font-extrabold underline"
      >
        Volver
      </Link>
    </main>
  );
}
