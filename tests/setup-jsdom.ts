// Debe cargarse ANTES que setup.ts: @testing-library/react ya importa react-dom, que
// mira estas propiedades al evaluarse.
// jsdom no trae AnimationEvent ni la propiedad CSS `animation`, y sin ellos React no escucha
// `animationend` (ver getVendorPrefixedEventName en react-dom).
if (typeof window !== "undefined") {
  if (!("AnimationEvent" in window)) {
    Object.assign(window, { AnimationEvent: class AnimationEvent extends Event {} });
  }
  const estilo = window.CSSStyleDeclaration.prototype;
  if (!("animation" in estilo)) {
    Object.defineProperty(estilo, "animation", { value: "", writable: true, configurable: true });
  }
}
