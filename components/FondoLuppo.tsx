// Fondo decorativo suave para las pantallas de elegir (personajes, lugares, espera): sobre el
// crema base pone textura de papel, manchas de acuarela apagadas, colinas y unas estrellitas.
// Todo es CSS/SVG inline, va fijo por detrás del contenido y no recibe clics. Las manchas se
// mecen muy despacio; prefers-reduced-motion lo deja quieto (ver globals.css).
const PAPEL =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .35 0 0 0 0 .3 0 0 0 0 .2 0 0 0 .5 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

const ESTRELLAS = [
  [8, 6, 3], [22, 14, 2], [41, 5, 2.5], [63, 11, 2], [82, 7, 3], [93, 17, 2],
] as const;

export function FondoLuppo() {
  return (
    <div
      aria-hidden="true"
      data-testid="fondo-luppo"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="fondo-mancha fondo-mancha-1 absolute -left-[15%] -top-[10%] h-[55%] w-[75%] rounded-full bg-salvia opacity-20 blur-3xl" />
      <div className="fondo-mancha fondo-mancha-2 absolute -right-[20%] top-[25%] h-[50%] w-[70%] rounded-full bg-rosa opacity-25 blur-3xl" />
      <div className="fondo-mancha fondo-mancha-3 absolute -left-[10%] bottom-[10%] h-[40%] w-[65%] rounded-full bg-[#8fa3b8] opacity-20 blur-3xl" />

      <svg
        data-testid="fondo-aguada"
        className="fondo-aguada absolute inset-x-0 top-0 h-[25%] w-full"
        viewBox="0 0 400 100"
        preserveAspectRatio="none"
        style={{ maskImage: "linear-gradient(to bottom, #000 35%, transparent 100%)", WebkitMaskImage: "linear-gradient(to bottom, #000 35%, transparent 100%)" }}
      >
        <defs>
          <filter id="aguada-borde" x="-20%" y="-40%" width="140%" height="180%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.03" numOctaves="3" seed="7" result="ruido" />
            <feDisplacementMap in="SourceGraphic" in2="ruido" scale="38" result="irregular" />
            <feGaussianBlur in="irregular" stdDeviation="9" />
          </filter>
        </defs>
        <g filter="url(#aguada-borde)">
          <g className="fondo-mancha fondo-mancha-1">
            <ellipse cx="70" cy="22" rx="95" ry="26" fill="#8fa3b8" opacity="0.16" />
            <ellipse cx="330" cy="18" rx="85" ry="22" fill="#8fa3b8" opacity="0.12" />
          </g>
          <g className="fondo-mancha fondo-mancha-2">
            <ellipse cx="215" cy="10" rx="80" ry="20" fill="#d9a5a5" opacity="0.15" />
            <ellipse cx="375" cy="50" rx="45" ry="16" fill="#d9a5a5" opacity="0.1" />
          </g>
          <g className="fondo-mancha fondo-mancha-3">
            <ellipse cx="30" cy="62" rx="50" ry="14" fill="#9db08f" opacity="0.12" />
            <ellipse cx="140" cy="8" rx="55" ry="14" fill="#9db08f" opacity="0.1" />
          </g>
        </g>
      </svg>

      <svg className="absolute inset-x-0 top-0 h-[22%] w-full" viewBox="0 0 100 22" preserveAspectRatio="none">
        {ESTRELLAS.map(([x, y, r]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={r / 6} fill="#c99a4b" opacity="0.3" />
        ))}
      </svg>

      <svg className="absolute inset-x-0 bottom-0 h-[22%] w-full" viewBox="0 0 400 100" preserveAspectRatio="none">
        <path d="M0 55 Q70 15 160 45 T400 30 V100 H0Z" fill="#9db08f" opacity="0.22" />
        <path d="M0 75 Q100 40 200 70 T400 60 V100 H0Z" fill="#9db08f" opacity="0.28" />
        <path d="M0 92 Q120 78 240 90 T400 86 V100 H0Z" fill="#8a9f7c" opacity="0.3" />
      </svg>

      <div className="absolute inset-0 opacity-[0.07] mix-blend-multiply" style={{ backgroundImage: PAPEL }} />
    </div>
  );
}
