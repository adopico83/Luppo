import { CasaLuppo } from "@/components/CasaLuppo";
import { asegurarFamilia } from "@/lib/familia";
import { AVISO_CUENTO_PROXIMO } from "@/lib/avisos";
import { createClient } from "@/lib/supabase/server";

// Casa de Luppo. Si un padre tiene sesión pero aún no tiene familia (por ejemplo, si el
// callback falló a medias), se crea aquí.
export default async function Casa({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string | string[] }>;
}) {
  const { aviso } = await searchParams;
  const supabase = await createClient();
  await asegurarFamilia(supabase);

  // Solo se admiten avisos conocidos: nunca se pinta texto que venga de la URL.
  return <CasaLuppo aviso={aviso === AVISO_CUENTO_PROXIMO} />;
}
