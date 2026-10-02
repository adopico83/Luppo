import { FormularioLogin } from "./FormularioLogin";

export const metadata = { title: "Entrar · Luppo" };

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-crema p-6 text-center">
      <h1 className="text-4xl font-extrabold">Luppo</h1>
      <p className="max-w-md text-lg">
        Entra con tu email. Te enviaremos un enlace para abrir la app, sin contraseña.
      </p>
      {error && (
        <p role="alert" className="max-w-md rounded-2xl bg-terracota/20 px-4 py-3 font-semibold">
          El enlace no ha funcionado o ha caducado. Pide uno nuevo.
        </p>
      )}
      <FormularioLogin />
    </main>
  );
}
