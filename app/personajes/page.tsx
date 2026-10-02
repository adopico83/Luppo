import Link from "next/link";
import { CarruselPersonajes } from "@/components/CarruselPersonajes";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PersonajesPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("munecos")
    .select("clave, nombre")
    .eq("es_sistema", true)
    .eq("activo", true)
    .order("nombre");

  return (
    <main className="flex min-h-dvh flex-col gap-8 bg-crema p-6 md:p-10">
      <Link
        href="/"
        className="inline-flex min-h-[120px] min-w-[120px] items-center self-start text-2xl font-extrabold text-tinta underline"
      >
        Volver
      </Link>
      <h1 className="text-center text-4xl font-extrabold">
        ¿Con quién quieres el cuento?
      </h1>
      {error || !data ? (
        <p
          role="alert"
          className="text-center text-2xl font-bold text-terracota"
        >
          Ay, no hemos podido traer a los personajes. Vuelve a intentarlo en un
          ratito.
        </p>
      ) : (
        <CarruselPersonajes munecos={data} />
      )}
    </main>
  );
}
