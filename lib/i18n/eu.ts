import type { ClaveTexto } from "./es";

// Euskera: aún sin traducir. Cada texto está en castellano y marcado TODO(eu) para que se
// encuentre fácil. Las claves deben ser las mismas que en es.ts.
export const eu: Record<ClaveTexto, string> = {

  // Home
  "casa.titulo": "¡Hola! Soy Luppo", // TODO(eu)
  "casa.empezar": "¡Vamos a crear un cuento!", // TODO(eu)
  "casa.avisoCuento": "El cuento llega en el próximo paso", // TODO(eu)

  // Entrar
  "login.titulo": "Entrar en Luppo", // TODO(eu)
  "login.metaTitulo": "Entrar · Luppo", // TODO(eu)
  "login.saludo": "¡Hola! ¿Me dices el correo de mamá o papá para entrar?", // TODO(eu)
  "login.enviado": "¡Mira tu correo! Te he mandado una llave mágica ✉️", // TODO(eu)
  "login.limite": "Uy, vamos muy rápido. Espera un ratito y probamos otra vez", // TODO(eu)
  "login.errorEnvio": "Uy, no he podido mandar la llave mágica. Inténtalo de nuevo en un momento.", // TODO(eu)
  "login.emailInvalido": "Escribe un email válido.", // TODO(eu)
  "login.enlaceCaducado": "El enlace no ha funcionado o ha caducado. Pide uno nuevo.", // TODO(eu)
  "login.etiquetaCorreo": "Correo de mamá o papá", // TODO(eu)
  "login.placeholderCorreo": "mama@ejemplo.com", // TODO(eu)
  "login.entrar": "Entrar", // TODO(eu)
  "login.enviando": "Enviando…", // TODO(eu)
  "login.espera": "Espera", // TODO(eu)
  "login.reenviar": "Volver a enviar", // TODO(eu)

  // Personajes
  "personajes.volver": "Volver", // TODO(eu)
  "personajes.titulo": "¿Con quién quieres el cuento?", // TODO(eu)
  "personajes.error": "Ay, no hemos podido traer a los personajes. Vuelve a intentarlo en un ratito.", // TODO(eu)
  "carrusel.anteriores": "Ver personajes anteriores", // TODO(eu)
  "carrusel.siguientes": "Ver más personajes", // TODO(eu)
  "carrusel.maximo": "Solo puedes elegir {max}", // TODO(eu)
  "carrusel.crear": "Crear tu propio personaje", // TODO(eu)
  "carrusel.crearPronto": "¡Muy pronto podrás crear tu propio personaje!", // TODO(eu)
  "carrusel.elegidos": "Has elegido {n} de {max}", // TODO(eu)
  "carrusel.siguiente": "Siguiente", // TODO(eu)

  // Lugares
  "lugares.titulo": "¿Dónde pasa el cuento?", // TODO(eu)
  "lugares.volver": "Volver", // TODO(eu)
  "lugar.bosque": "Bosque", // TODO(eu)
  "lugar.playa": "Playa", // TODO(eu)
  "lugar.espacio": "Espacio", // TODO(eu)
  "lugar.castillo": "Castillo", // TODO(eu)
  "lugar.fondo-mar": "Fondo del mar", // TODO(eu)
  "lugar.futbol": "Campo de fútbol", // TODO(eu)
  "lugar.patinete": "Paseo en patinete", // TODO(eu)
  "lugar.atracciones": "Parque de atracciones", // TODO(eu)

  // Espera
  "espera.titulo": "Luppo está preparando tu cuento", // TODO(eu)
  "espera.frase1": "Estoy pensando un cuento…", // TODO(eu)
  "espera.frase2": "¡Casi lo tengo!", // TODO(eu)
  "espera.frase3": "Buscando las palabras mágicas…", // TODO(eu)
  "espera.frase4": "Mezclando aventuras…", // TODO(eu)
  "espera.errorGenerico": "Ai! Ipuina korapilatu zaigu. Saia gaitezen berriro apur bat geroago.",
  "espera.limite": "Gaur ipuin asko irakurri ditugu! Bihar beste bat prestatuko dizut, ados?",
  "espera.volver": "Atzera",

  // Cuento
  "cuento.personajes": "Ipuineko pertsonaiak",
  "cuento.escena": "{n}. eszena ({total} guztira)",
  "cuento.pausar": "Pausatu",
  "cuento.repetir": "Errepikatu ahotsa",
  "cuento.siguiente": "Hurrengoa",
  "cuento.fin": "Amaiera",
  "cuento.contado": "Kontatu dugu!",
  "cuento.tocar": "Ukitu hemen",

};
