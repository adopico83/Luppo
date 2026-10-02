import { BotonGigante } from "@/components/BotonGigante";
import { ImagenMuneco } from "@/components/ImagenMuneco";
import { asegurarFamilia } from "@/lib/familia";
import { createClient } from "@/lib/supabase/server";

// Casa de Luppo. Si un padre tiene sesión pero aún no tiene familia (por ejemplo, si el
// callback falló a medias), se crea aquí.
export default async function Casa() {
  const supabase = await createClient();
  await asegurarFamilia(supabase);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 bg-crema p-6 text-center">
      <ImagenMuneco clave="luppo" nombre="Luppo" className="h-64 w-64 md:h-80 md:w-80" />
      <h1 className="text-5xl font-extrabold text-tinta">¡Hola! Soy Luppo</h1>
      <BotonGigante href="/personajes">¡Vamos a crear un cuento!</BotonGigante>
    </main>
  );
}
