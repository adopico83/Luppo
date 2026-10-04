// Textos visibles en castellano (idioma por defecto). Las claves son la referencia: eu.ts debe
// tener exactamente las mismas (lo comprueba tests/i18n.test.ts). {nombre} se rellena en t().
export const es = {
  // Home
  "casa.titulo": "¡Hola! Soy Luppo",
  "casa.empezar": "¡Vamos a crear un cuento!",
  "casa.avisoCuento": "El cuento llega en el próximo paso",

  // Entrar
  "login.titulo": "Entrar en Luppo",
  "login.metaTitulo": "Entrar · Luppo",
  "login.saludo": "¡Hola! ¿Me dices el correo de mamá o papá para entrar?",
  "login.enviado": "¡Mira tu correo! Te he mandado una llave mágica ✉️",
  "login.limite": "Uy, vamos muy rápido. Espera un ratito y probamos otra vez",
  "login.errorEnvio": "Uy, no he podido mandar la llave mágica. Inténtalo de nuevo en un momento.",
  "login.emailInvalido": "Escribe un email válido.",
  "login.enlaceCaducado": "El enlace no ha funcionado o ha caducado. Pide uno nuevo.",
  "login.etiquetaCorreo": "Correo de mamá o papá",
  "login.placeholderCorreo": "mama@ejemplo.com",
  "login.entrar": "Entrar",
  "login.enviando": "Enviando…",
  "login.espera": "Espera",
  "login.reenviar": "Volver a enviar",

  // Personajes
  "personajes.volver": "Volver",
  "personajes.titulo": "¿Con quién quieres el cuento?",
  "personajes.error": "Ay, no hemos podido traer a los personajes. Vuelve a intentarlo en un ratito.",
  "carrusel.anteriores": "Ver personajes anteriores",
  "carrusel.siguientes": "Ver más personajes",
  "carrusel.maximo": "Solo puedes elegir {max}",
  "carrusel.crear": "Crear tu propio personaje",
  "carrusel.crearPronto": "¡Muy pronto podrás crear tu propio personaje!",
  "carrusel.elegidos": "Has elegido {n} de {max}",
  "carrusel.siguiente": "Siguiente",

  // Lugares
  "lugares.titulo": "¿Dónde pasa el cuento?",
  "lugares.volver": "Volver",
  "lugar.bosque": "El bosque",
  "lugar.playa": "La playa",
  "lugar.espacio": "El espacio",
  "lugar.castillo": "El castillo",
  "lugar.fondo_del_mar": "El fondo del mar",

  // Espera
  "espera.titulo": "Luppo está preparando tu cuento",
  "espera.frase1": "Estoy pensando un cuento…",
  "espera.frase2": "¡Casi lo tengo!",
  "espera.frase3": "Buscando las palabras mágicas…",
  "espera.frase4": "Mezclando aventuras…",
} as const;

export type ClaveTexto = keyof typeof es;
