import type { ButtonHTMLAttributes } from "react";

type Variante = "terracota" | "salvia" | "ocre";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: Variante;
};

const colores: Record<Variante, string> = {
  terracota: "bg-terracota text-crema-clara",
  salvia: "bg-salvia text-tinta",
  ocre: "bg-ocre text-tinta",
};

// Botón para dedos pequeños: nunca baja de 120 px de alto y de ancho.
export function BotonGigante({
  variante = "terracota",
  className = "",
  type = "button",
  ...resto
}: Props) {
  return (
    <button
      type={type}
      className={`min-h-[120px] min-w-[120px] rounded-3xl px-8 text-2xl font-extrabold shadow-md transition-transform active:scale-95 disabled:opacity-50 ${colores[variante]} ${className}`}
      {...resto}
    />
  );
}
