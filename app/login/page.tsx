import { FormularioLogin } from "./FormularioLogin";

export const metadata = { title: "Entrar · Luppo" };

// Misma casa que la Home, con un velo crema suave para que se lea todo.
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main
      className="relative flex min-h-dvh flex-col items-center justify-center bg-crema bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url(/fondos/casa-luppo.webp)" }}
    >
      <div aria-hidden="true" className="absolute inset-0 bg-crema/60" />
      <div className="relative flex w-full flex-col items-center gap-4 px-4 py-6">
        <h1 className="sr-only">Entrar en Luppo</h1>
        {error && (
          <p
            role="alert"
            className="max-w-md rounded-3xl bg-crema-clara px-5 py-3 text-center text-lg font-bold text-terracota shadow-md"
          >
            El enlace no ha funcionado o ha caducado. Pide uno nuevo.
          </p>
        )}
        <FormularioLogin />
      </div>
    </main>
  );
}
