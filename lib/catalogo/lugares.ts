// Lugares donde puede pasar un cuento. Las claves son las que recibirá el generador de cuentos.
// El nombre visible está en lib/i18n (clave `lugar.<clave>`). Aún no hay dibujos de los lugares:
// cada tarjeta usa un emoji grande sobre un color suave de la paleta.
export const LUGARES = [
  { clave: "bosque", emoji: "🌲", fondo: "bg-salvia/30" },
  { clave: "playa", emoji: "🏖️", fondo: "bg-ocre/30" },
  { clave: "espacio", emoji: "🚀", fondo: "bg-tinta/15" },
  { clave: "castillo", emoji: "🏰", fondo: "bg-rosa/40" },
  { clave: "fondo_del_mar", emoji: "🐠", fondo: "bg-terracota/25" },
] as const;

export type ClaveLugar = (typeof LUGARES)[number]["clave"];

export function esLugar(clave: unknown): clave is ClaveLugar {
  return LUGARES.some((l) => l.clave === clave);
}
