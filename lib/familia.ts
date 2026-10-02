import type { SupabaseClient } from "@supabase/supabase-js";

// Devuelve la familia del padre que ha entrado y, si es su primer login, la crea.
// Se usa crear_familia (función de la base de datos): es la única forma de crear una familia,
// porque nadie puede insertar a mano en familias ni miembros_familia (ver migración 0001).
export async function asegurarFamilia(supabase: SupabaseClient): Promise<string> {
  const { data: miembro, error: errorLeer } = await supabase
    .from("miembros_familia")
    .select("familia_id")
    .limit(1)
    .maybeSingle();
  if (errorLeer) throw new Error(`No se pudo leer la familia: ${errorLeer.message}`);
  if (miembro) return miembro.familia_id as string;

  const { data, error } = await supabase.rpc("crear_familia", { p_nombre: "Mi familia" });
  if (error) throw new Error(`No se pudo crear la familia: ${error.message}`);
  return data as string;
}
