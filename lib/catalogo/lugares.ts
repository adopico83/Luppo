// Lugares donde puede pasar un cuento. Las claves son las que recibirá el generador de cuentos.
// El nombre visible está en lib/i18n (clave `lugar.<clave>`). `fondo` es la ilustración del
// lugar (public/lugares): la usan las tarjetas de /lugares y servirá de escenario del cuento.
export const LUGARES = [
  { clave: "bosque", fondo: "/lugares/bosque.webp" },
  { clave: "playa", fondo: "/lugares/playa.webp" },
  { clave: "espacio", fondo: "/lugares/espacio.webp" },
  { clave: "castillo", fondo: "/lugares/castillo.webp" },
  { clave: "fondo-mar", fondo: "/lugares/fondo-mar.webp" },
  { clave: "futbol", fondo: "/lugares/futbol.webp" },
  { clave: "patinete", fondo: "/lugares/patinete.webp" },
  { clave: "atracciones", fondo: "/lugares/atracciones.webp" },
] as const;

export type ClaveLugar = (typeof LUGARES)[number]["clave"];

export function esLugar(clave: unknown): clave is ClaveLugar {
  return LUGARES.some((l) => l.clave === clave);
}

export function fondoDeLugar(clave: ClaveLugar): string {
  return LUGARES.find((l) => l.clave === clave)!.fondo;
}
