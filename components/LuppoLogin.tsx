import { claseGesto } from "@/lib/catalogo/gestos";

// Luppo grande, ajustado a su cuerpo (npm run recortar:luppo). Su gesto es solo CSS: se
// reproduce una vez al cargar y prefers-reduced-motion lo desactiva (ver globals.css).
export function LuppoLogin() {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- imagen estática ya optimizada
    <img
      src="/fondos/luppo-login.webp"
      alt="Luppo"
      className={`h-[min(28dvh,16rem)] w-auto max-w-full ${claseGesto("luppo") ?? ""}`}
    />
  );
}
