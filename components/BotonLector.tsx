import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variante = "terracota" | "salvia" | "ocre";

const colores: Record<Variante, string> = {
  terracota: "bg-terracota text-crema-clara",
  salvia: "bg-salvia text-tinta",
  ocre: "bg-ocre text-tinta",
};

// Móvil en vertical: botón redondo de 64 px con solo el icono. Pantalla ancha: el botón gigante de
// siempre, con icono y texto. El texto sigue en el DOM (sr-only) para lectores de pantalla.
const base =
  "inline-flex h-[56px] w-[56px] shrink-0 items-center justify-center gap-3 rounded-full text-center font-extrabold shadow-md transition-transform active:scale-95 disabled:opacity-50 " +
  "ancho:h-auto ancho:min-h-[120px] ancho:w-auto ancho:min-w-[120px] ancho:rounded-3xl ancho:px-8 ancho:text-2xl";

type Comun = { variante?: Variante; icono: ReactNode; children: ReactNode; className?: string };
type PropsBoton = Comun & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className"> & { href?: undefined };
type PropsEnlace = Comun & { href: string };

function Contenido({ icono, children }: { icono: ReactNode; children: ReactNode }) {
  return (
    <>
      <span aria-hidden="true" className="flex h-7 w-7 items-center justify-center ancho:h-8 ancho:w-8">
        {icono}
      </span>
      <span className="sr-only ancho:not-sr-only">{children}</span>
    </>
  );
}

export function BotonLector(props: PropsBoton | PropsEnlace) {
  if (props.href !== undefined) {
    const { variante = "terracota", className = "", href, icono, children } = props;
    return (
      <Link href={href} className={`${base} ${colores[variante]} ${className}`}>
        <Contenido icono={icono}>{children}</Contenido>
      </Link>
    );
  }
  const { variante = "terracota", className = "", type = "button", icono, children, ...resto } = props;
  return (
    <button type={type} className={`${base} ${colores[variante]} ${className}`} {...resto}>
      <Contenido icono={icono}>{children}</Contenido>
    </button>
  );
}

const svg = { viewBox: "0 0 24 24", fill: "currentColor", className: "h-full w-full" } as const;
export const IconoPausa = () => (
  <svg {...svg}>
    <rect x="6" y="5" width="4" height="14" rx="1.5" />
    <rect x="14" y="5" width="4" height="14" rx="1.5" />
  </svg>
);
export const IconoRepetir = () => (
  <svg {...svg}>
    <path d="M12 5V2L7 6l5 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z" />
  </svg>
);
export const IconoSiguiente = () => (
  <svg {...svg}>
    <path d="M8 4l12 8-12 8z" />
  </svg>
);
export const IconoFin = () => (
  <svg {...svg}>
    <path d="M9.5 17.5L4 12l2-2 3.5 3.5L18 5l2 2z" />
  </svg>
);
