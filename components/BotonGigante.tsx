import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variante = "terracota" | "salvia" | "ocre";

type PropsBoton = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: Variante;
  href?: undefined;
};

// Con `href` se pinta un enlace con el mismo aspecto (un <button> dentro de un <a> no es válido).
type PropsEnlace = {
  variante?: Variante;
  href: string;
  className?: string;
  children: ReactNode;
};

const colores: Record<Variante, string> = {
  terracota: "bg-terracota text-crema-clara",
  salvia: "bg-salvia text-tinta",
  ocre: "bg-ocre text-tinta",
};

// Botón para dedos pequeños: nunca baja de 120 px de alto y de ancho.
const base =
  "inline-flex min-h-[120px] min-w-[120px] items-center justify-center rounded-3xl px-8 text-center text-2xl font-extrabold shadow-md transition-transform active:scale-95 disabled:opacity-50";

export function BotonGigante(props: PropsBoton | PropsEnlace) {
  if (props.href !== undefined) {
    const { variante = "terracota", className = "", href, children } = props;
    return (
      <Link href={href} className={`${base} ${colores[variante]} ${className}`}>
        {children}
      </Link>
    );
  }

  const { variante = "terracota", className = "", type = "button", ...resto } = props;
  return <button type={type} className={`${base} ${colores[variante]} ${className}`} {...resto} />;
}
