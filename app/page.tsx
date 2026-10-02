import { CasaLuppo } from "@/components/CasaLuppo";
import { asegurarFamilia } from "@/lib/familia";
import { createClient } from "@/lib/supabase/server";

// Casa de Luppo. Si un padre tiene sesión pero aún no tiene familia (por ejemplo, si el
// callback falló a medias), se crea aquí.
export default async function Casa() {
  const supabase = await createClient();
  await asegurarFamilia(supabase);

  return <CasaLuppo />;
}
