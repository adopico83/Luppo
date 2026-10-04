// true si la persona pidió menos movimiento (en jsdom no existe matchMedia: se asume que no).
export function reducirMovimiento(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
