import { t, type Idioma } from "@/lib/i18n";
import type { ClaveLugar } from "@/lib/catalogo/lugares";
import { NOMBRES_GESTO } from "@/lib/catalogo/gestos";
import { ACCIONES, POSICIONES } from "./escena";
import { MAX_INTERACCIONES, MIN_INTERACCIONES } from "./schema";
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
    "Una idea por escena. El problema es muy pequeño y se arregla enseguida.",
  "5-6":
    "Entre 250 y 400 palabras en total y 6 o 7 escenas. Una pequeña aventura con un problema " +
    "divertido, un par de intentos que no salen del todo bien y una solución. Frases claras, con algo de diálogo.",
};

// Objetivo educativo sencillo según la edad: el modelo elige uno y lo trabaja dentro de la historia.
export const OBJETIVOS_POR_BANDA: Record<BandaEdad, string[]> = {
  "3-4": ["los colores", "contar hasta 5", "esperar el turno", "las emociones básicas (alegría, tristeza, enfado, sorpresa)"],
  "5-6": ["esforzarse y no rendirse", "compartir", "resolver problemas", "contar hasta 10", "los opuestos"],
};

// Lo que se hace en cada lugar: el cuento gira en torno a esta actividad, no al descanso.
export const ACTIVIDAD_POR_LUGAR: Record<ClaveLugar, string> = {
  futbol: "jugar un partido de fútbol y marcar gol",
  playa: "construir castillos de arena y saltar las olas",
  espacio: "pilotar un cohete y visitar planetas",
  castillo: "explorar el castillo: buscar una llave, cruzar el puente y encontrar el tesoro del rey",
  "fondo-mar": "bucear entre peces y corales y descubrir un tesoro escondido",
  bosque: "buscar un tesoro por el bosque siguiendo huellas y pistas con los animales",
  patinete: "recorrer el parque en patinete, esquivar charcos y llegar a la meta",
  atracciones: "subir a las atracciones: noria, montaña rusa suave y carrusel",
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

  const actividad = ACTIVIDAD_POR_LUGAR[lugar];
  const objetivos = OBJETIVOS_POR_BANDA[banda].join("; ");

  const system = [
    `Eres un narrador de cuentos divertidos, educativos e interactivos para niños de ${banda} años.`,
    `Escribe el cuento directamente en ${NOMBRE_IDIOMA[idioma]}, con naturalidad; no lo traduzcas de otro idioma.`,
    "Reglas que no se pueden saltar:",
    "- Tono alegre, con humor suave y algo de emoción. Nada de miedo, violencia, peligro real, malos ni castigos. Es un cuento de acción y juego: nadie se acuesta ni se queda descansando al final.",
    `- El lugar es el escenario y el cuento gira en torno a su actividad: ${actividad}. Se nota en lo que ven, oyen y hacen.`,
    "- Estructura: inicio; un problema divertido propio del lugar; intentos; una solución que llega gracias a la ayuda del niño que escucha y de los amigos; y un final alegre y de celebración.",
    `- Objetivo educativo: elige UNO sencillo para esta edad (${objetivos}) y trabájalo dentro de la historia, que se note en lo que pasa. Sin moraleja sermoneada ni frase final de lección. Anótalo en tema_educativo.`,
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
    `Interacción: entre ${MIN_INTERACCIONES} y ${MAX_INTERACCIONES} escenas llevan el campo interaccion (nunca la primera ni la última). Las demás no lo llevan. Cada una espera la respuesta del niño antes de seguir, así que el texto de la escena debe terminar justo antes de la pregunta. Tipos:`,
    "- elegir: pregunta corta y 2 o 3 opciones. Cada opción lleva texto breve (1-3 palabras), un emoji grande y una consecuencia (una frase alegre que se lee tras elegirla). Que cualquier opción lleve a buen puerto: no hay respuestas malas.",
    "- tocar: instruccion corta como «¡Toca el balón para chutar!», un emoji del elemento que se toca y una consecuencia.",
    "- contar: instruccion que pide contar en voz alta («Contemos juntos hasta 5»), hasta (2-10, adecuado a la edad) y una consecuencia.",
    "Mezcla tipos distintos y que cada interacción ayude de verdad a la historia (y, si encaja, al objetivo educativo).",
    "Entrega el cuento llamando a la herramienta entregar_cuento.",
  ].join("\n");

  const user = [
    `Lugar: ${nombreLugar}.`,
    "Personajes:",
    fichas,
    `Actividad del lugar: ${actividad}.`,
    `Escribe el cuento para un niño de ${banda} años.`,
  ].join("\n");

  return { system, user, version: VERSION_PROMPT, banda };
}
