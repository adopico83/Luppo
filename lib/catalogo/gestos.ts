// Gesto propio de cada personaje: siempre el mismo. Los keyframes viven en app/globals.css
// (clase `gesto-<nombre>`).
export const GESTOS = {
  luppo: "saludo-pillo",
  dragoncito: "salto-aleteo",
  zorrito: "mirar-lados",
  caracol: "estirar-lento",
  nubecita: "flotar-balanceo",
  robotito: "robotico",
  seta: "rebote-blando",
  estrella: "giro-brillo",
  manzana: "rodar-poco",
  luna: "hamaca",
  cactus: "bailecito-caderas",
  flan: "tembleque",
  globo: "subir-bajar",
  zumbillo: "revoloteo",
  tiquitaque: "pendulo",
  burbujo: "hinchar",
  gargolito: "agacha-saltito",
} as const;

export type ClaveGesto = keyof typeof GESTOS;

// Clase CSS del gesto de un personaje, o undefined si no tiene (p. ej. uno creado por la familia).
export function claseGesto(clave: string): string | undefined {
  return clave in GESTOS ? `gesto-${GESTOS[clave as ClaveGesto]}` : undefined;
}
