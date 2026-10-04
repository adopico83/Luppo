import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/components/I18nProvider";
import { textosServidor } from "@/lib/i18n/servidor";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["600", "800"],
});

export const metadata: Metadata = {
  title: "Luppo",
  description: "Cuentos interactivos para niños de 3 a 6 años.",
  applicationName: "Luppo",
  appleWebApp: { capable: true, title: "Luppo", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#9DB08F",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { idioma } = await textosServidor();

  return (
    <html lang={idioma} className={`${nunito.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <I18nProvider idioma={idioma}>{children}</I18nProvider>
      </body>
    </html>
  );
}
