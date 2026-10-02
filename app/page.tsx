import { BotonGigante } from "@/components/BotonGigante";

export default function Inicio() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 bg-crema p-6 text-center">
      <h1 className="text-5xl font-extrabold text-tinta">Luppo</h1>
      <p className="max-w-md text-xl">Cuentos para escuchar, tocar y bailar.</p>
      <BotonGigante>Empezar</BotonGigante>
    </main>
  );
}
