import { redirect } from "next/navigation";
import { PantallaEspera } from "@/components/PantallaEspera";
import { esLugar } from "@/lib/catalogo/lugares";
import { parsearPersonajes } from "@/lib/seleccion";

// Tercer paso: Luppo prepara el cuento. Con una URL incompleta se vuelve al paso que falta.
export default async function EsperaPage({
  searchParams,
}: {
  searchParams: Promise<{ personajes?: string | string[]; lugar?: string | string[] }>;
}) {
  const { personajes, lugar } = await searchParams;
  const claves = parsearPersonajes(personajes);
  if (!claves) redirect("/personajes");
  if (!esLugar(Array.isArray(lugar) ? lugar[0] : lugar)) {
    redirect(`/lugares?personajes=${claves.join(",")}`);
  }

  return <PantallaEspera />;
}
