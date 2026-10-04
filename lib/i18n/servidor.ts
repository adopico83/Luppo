import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { IDIOMA_POR_DEFECTO, esIdioma, t, type ClaveTexto, type Idioma } from "./index";

// Idioma de la familia del padre que ha entrado (RLS limita la consulta a su familia).
// Sin sesión, sin familia o ante cualquier fallo: castellano.
export async function idiomaDeFamilia(supabase: SupabaseClient): Promise<Idioma> {
  try {
    const { data } = await supabase.from("familias").select("idioma").limit(1).maybeSingle();
    return esIdioma(data?.idioma) ? data.idioma : IDIOMA_POR_DEFECTO;
  } catch {
    return IDIOMA_POR_DEFECTO;
  }
}

// Para componentes de servidor: `const { t, idioma } = await textosServidor();`
export async function textosServidor() {
  const idioma = await idiomaDeFamilia(await createClient());
  return {
    idioma,
    t: (clave: ClaveTexto, variables?: Record<string, string | number>) =>
      t(clave, idioma, variables),
  };
}
