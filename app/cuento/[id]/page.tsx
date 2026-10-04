import { notFound } from "next/navigation";
import { LectorCuento } from "@/components/LectorCuento";
import { esLugar } from "@/lib/catalogo/lugares";
import { ID_CUENTO_EJEMPLO } from "@/lib/cuentos/ejemplo";
import { cargarCuento, cuentoDeEjemplo } from "@/lib/cuentos/lectura";
import { idiomaDeFamilia } from "@/lib/i18n/servidor";
import { parsearPersonajes } from "@/lib/seleccion";
import { createClient } from "@/lib/supabase/server";

// Las URLs firmadas del audio caducan: la página se genera en cada visita.
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ personajes?: string | string[]; lugar?: string | string[] }>;
};

// Cuarto paso: el cuento, escena a escena. /cuento/ejemplo es el cuento fijo que se enseña sin
// claves de Anthropic; el resto de ids son cuentos guardados de la familia.
export default async function CuentoPage({ params, searchParams }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  if (id === ID_CUENTO_EJEMPLO) {
    const { personajes, lugar } = await searchParams;
    const claveLugar = Array.isArray(lugar) ? lugar[0] : lugar;
    const idioma = await idiomaDeFamilia(supabase);
    const cuento = await cuentoDeEjemplo(
      supabase,
      idioma,
      parsearPersonajes(personajes) ?? ["luppo"],
      esLugar(claveLugar) ? claveLugar : "bosque",
    );
    return <LectorCuento cuento={cuento} />;
  }

  const cuento = await cargarCuento(supabase, id);
  if (!cuento) notFound();
  return <LectorCuento cuento={cuento} />;
}
