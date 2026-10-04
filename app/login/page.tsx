import { textosServidor } from "@/lib/i18n/servidor";
import { FormularioLogin } from "./FormularioLogin";

export async function generateMetadata() {
  const { t } = await textosServidor();
  return { title: t("login.metaTitulo") };
}

// Misma casa que la Home, con un velo crema suave para que se lea todo.
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { t } = await textosServidor();

  return (
    <main
      className="relative flex min-h-dvh flex-col items-center justify-center bg-crema bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url(/fondos/casa-luppo.webp)" }}
    >
      <div aria-hidden="true" className="absolute inset-0 bg-crema/60" />
      <div className="relative flex w-full flex-col items-center gap-4 px-4 py-6">
        <h1 className="sr-only">{t("login.titulo")}</h1>
        {error && (
          <p
            role="alert"
            className="max-w-md rounded-3xl bg-crema-clara px-5 py-3 text-center text-lg font-bold text-terracota shadow-md"
          >
            {t("login.enlaceCaducado")}
          </p>
        )}
        <FormularioLogin />
      </div>
    </main>
  );
}
