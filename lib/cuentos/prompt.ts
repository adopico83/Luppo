import { t, type Idioma } from "@/lib/i18n";
import type { ClaveLugar } from "@/lib/catalogo/lugares";
import { NOMBRES_GESTO } from "@/lib/catalogo/gestos";
import { ACCIONES, POSICIONES } from "./escena";
import { EDAD_POR_DEFECTO, VERSION_PROMPT } from "./config";

export type FichaPersonaje = {
  clave: string;
  nombre: string;
  especie?: string | null;
  personalidad?: string | null;
  forma_de_hablar?: string | null;
};

export type EntradaPrompt = {
  personajes: FichaPersonaje[];
  lugar: ClaveLugar;
  idioma: Idioma;
  edad: number;
};

export type BandaEdad = "3-4" | "5-6";

// Menores de 5 años (y los que no llegan a 3) usan la banda pequeña; de 5 en adelante, la mayor.
export function bandaDeEdad(edad: number): BandaEdad {
  return edad >= 5 ? "5-6" : "3-4";
}

const REGLAS_BANDA: Record<BandaEdad, string> = {
  "3-4":
    "Entre 150 y 250 palabras en total y 5 o 6 escenas. Frases muy cortas, vocabulario sencillo " +
    "de todos los días y mucha repetición (un estribillo o una frase que vuelva en cada escena). " +
    "Una idea por escena. Sin problema complicado: un pequeño momento de curiosidad y un final feliz.",
  "5-6":
    "Entre 250 y 400 palabras en total y 6 o 7 escenas. Una pequeña aventura con un problema " +
    "sencillo (algo que se pierde, algo que cuesta lograr) y su solución, que llega gracias a la " +
    "amistad o a la ayuda mutua. Frases claras, con algo de diálogo.",
};

const NOMBRE_IDIOMA: Record<Idioma, string> = {
  es: "castellano",
  eu: "euskera (euskara batua)",
};

// Prompt del servidor: nunca viaja al cliente. Si cambia, hay que subir VERSION_PROMPT.
export function construirPrompt({ personajes, lugar, idioma, edad }: EntradaPrompt) {
  const banda = bandaDeEdad(Number.isFinite(edad) ? edad : EDAD_POR_DEFECTO);
  const nombreLugar = t(`lugar.${lugar}`, idioma);

  const fichas = personajes
    .map((p) => {
      const datos = [
        p.especie && `especie: ${p.especie}`,
        p.personalidad && `personalidad: ${p.personalidad}`,
        p.forma_de_hablar && `forma de hablar: ${p.forma_de_hablar}`,
      ].filter(Boolean);
      return `- [${p.clave}] ${p.nombre}${datos.length ? ` (${datos.join("; ")})` : ""}`;
    })
    .join("\n");

  const system = [
    `Eres un narrador de cuentos para dormir para niños de ${banda} años.`,
    `Escribe el cuento directamente en ${NOMBRE_IDIOMA[idioma]}, con naturalidad; no lo traduzcas de otro idioma.`,
    "Reglas que no se pueden saltar:",
    "- Tono tierno y cálido. Nada de miedo, violencia, peligro real, malos ni castigos.",
    "- El final es calmado y sereno, de antes de dormir: todo está bien y los personajes descansan.",
    "- El lugar es el escenario del cuento: se nota en lo que ven, oyen y hacen.",
    "- Los personajes elegidos son los protagonistas y respetan su personalidad y su forma de hablar.",
    "- No uses nombres de niños reales, marcas ni referencias a pantallas.",
    `- ${REGLAS_BANDA[banda]}`,
    "- Cada escena tiene como mucho 1-3 frases CORTAS: la voz cuenta el cuento y el texto solo lo acompaña. Mejor más escenas cortas que bloques largos.",
    "- Cada escena es texto corrido para leer en voz alta: sin títulos, sin numeración, sin acotaciones, sin emojis ni asteriscos.",
    "Además del texto, cada escena lleva la puesta en escena de los personajes que salen en ella (campo personajes):",
    "- personaje: la clave exacta que aparece entre corchetes en la lista de personajes.",
    `- posicion: ${POSICIONES.join(", ")}. Que no se pisen dos personajes en la misma escena.`,
    `- gesto: uno de ${NOMBRES_GESTO.join(", ")}. Elige el que mejor case con lo que pasa.`,
    `- accion (opcional): ${ACCIONES.join(", ")}. Usa «entrar» cuando alguien llega a la escena, «salir» cuando se va, «caminar» o «saltar» cuando se mueve y «quieto» en el resto.`,
    "Entrega el cuento llamando a la herramienta entregar_cuento.",
  ].join("\n");

  const user = [
    `Lugar: ${nombreLugar}.`,
    "Personajes:",
    fichas,
    `Escribe el cuento para un niño de ${banda} años.`,
  ].join("\n");

  return { system, user, version: VERSION_PROMPT, banda };
}
