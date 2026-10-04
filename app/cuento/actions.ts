"use server";

import { createClient } from "@/lib/supabase/server";
import { esIdCuento } from "@/lib/cuentos/lectura";

// Apunta qué opción eligió el niño en una escena interactiva (decisiones.elegida_at). Es un extra:
// si falla no pasa nada, el cuento sigue. RLS limita el cambio a las decisiones de la familia.
export async function registrarDecision(decisionId: string): Promise<void> {
  if (!esIdCuento(decisionId)) return; // mismo formato uuid
  try {
    const supabase = await createClient();
    await supabase
      .from("decisiones")
      .update({ elegida_at: new Date().toISOString() })
      .eq("id", decisionId);
  } catch (error) {
    console.error("[cuentos] no se pudo guardar la decisión:", (error as Error).message);
  }
}
