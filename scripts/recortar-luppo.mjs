// Quita el fondo crema de papel de public/munecos/luppo.jpg y guarda una versión con
// transparencia para ponerlo sobre la habitación de la Home: public/fondos/luppo-casa.webp.
// Mantiene el lienzo de 1280x720: la posición de Luppo en CasaLuppo.tsx depende de ese tamaño.
// Uso: npm run recortar:luppo
import sharp from "sharp";

const ORIGEN = "public/munecos/luppo.jpg";
const DESTINO = "public/fondos/luppo-casa.webp";

// Por debajo de DESDE un píxel es papel (transparente); por encima de HASTA es Luppo (opaco).
// Entre medias es semitransparente, para los bordes suaves. La sombra de los pies (papel más
// oscuro, sin color propio) se convierte en una sombra negra translúcida.
const DESDE = 12;
const HASTA = 48;

const { data, info } = await sharp(ORIGEN).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;

// Color del papel: mediana de los píxeles del borde (Luppo no toca los bordes).
const muestras = [[], [], []];
const mirar = (x, y) => {
  const i = (y * width + x) * channels;
  for (let c = 0; c < 3; c++) muestras[c].push(data[i + c]);
};
for (let x = 0; x < width; x++) {
  mirar(x, 0);
  mirar(x, height - 1);
}
for (let y = 0; y < height; y++) {
  mirar(0, y);
  mirar(width - 1, y);
}
const mediana = (v) => v.sort((a, b) => a - b)[Math.floor(v.length / 2)];
const papel = muestras.map(mediana);

const suave = (t) => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
};

const punto = papel[0] ** 2 + papel[1] ** 2 + papel[2] ** 2;
const SOMBRA = [35, 28, 22]; // color de la sombra translúcida

// Solo es fondo lo parecido al papel que está CONECTADO con el borde del lienzo. Así los blancos
// de dentro de Luppo (los ojos, el hocico), casi del color del papel, se quedan opacos en vez de
// volverse agujeros por los que se ve el fondo.
const distancia = new Float32Array(width * height);
for (let p = 0; p < width * height; p++) {
  const i = p * channels;
  distancia[p] = Math.hypot(data[i] - papel[0], data[i + 1] - papel[1], data[i + 2] - papel[2]);
}
const esFondo = new Uint8Array(width * height);
const pila = [];
const sembrar = (x, y) => {
  const p = y * width + x;
  if (!esFondo[p] && distancia[p] < HASTA) {
    esFondo[p] = 1;
    pila.push(p);
  }
};
for (let x = 0; x < width; x++) {
  sembrar(x, 0);
  sembrar(x, height - 1);
}
for (let y = 0; y < height; y++) {
  sembrar(0, y);
  sembrar(width - 1, y);
}
while (pila.length) {
  const p = pila.pop();
  const x = p % width;
  const y = (p - x) / width;
  if (x > 0) sembrar(x - 1, y);
  if (x < width - 1) sembrar(x + 1, y);
  if (y > 0) sembrar(x, y - 1);
  if (y < height - 1) sembrar(x, y + 1);
}

for (let p = 0; p < width * height; p++) {
  const i = p * channels;
  const r = data[i], g = data[i + 1], b = data[i + 2];
  const d = distancia[p];
  const alfaRecorte = esFondo[p] ? suave((d - DESDE) / (HASTA - DESDE)) : 1;

  // ¿Es solo papel más oscuro (sin color propio)? Entonces es sombra: negro translúcido.
  // k = cuánto más oscuro que el papel; resto = lo que se aleja del tono del papel.
  const k = (r * papel[0] + g * papel[1] + b * papel[2]) / punto;
  const resto = Math.hypot(r - k * papel[0], g - k * papel[1], b - k * papel[2]);
  // Solo en la franja de los pies: en el resto, el pelaje claro de Luppo se confundiría con sombra.
  const enSuelo = Math.floor(p / width) >= height * 0.88;
  const esSombra = enSuelo ? 1 - suave((resto - 5) / 9) : 0; // 1 = sombra pura, 0 = color de Luppo
  const alfaSombra = Math.min(1, Math.max(0, 1 - k)) * 0.85;

  const alfa = esSombra * alfaSombra + (1 - esSombra) * alfaRecorte;
  for (let c = 0; c < 3; c++) {
    // Quita la parte de papel que se mezcla en los píxeles semitransparentes.
    const limpio = alfaRecorte > 0 ? (data[i + c] - (1 - alfaRecorte) * papel[c]) / alfaRecorte : 0;
    const color = esSombra * SOMBRA[c] + (1 - esSombra) * limpio;
    data[i + c] = Math.min(255, Math.max(0, Math.round(color)));
  }
  data[i + 3] = Math.round(alfa * 255);
}

const salida = await sharp(data, { raw: { width, height, channels } })
  .webp({ quality: 85, alphaQuality: 90 })
  .toFile(DESTINO);
console.log("papel", papel, "->", DESTINO, `${Math.round(salida.size / 1024)} KB`);

// Versión ajustada al cuerpo de Luppo (sin el lienzo vacío de 1280×720) para la pantalla de login.
const AJUSTADO = "public/fondos/luppo-login.webp";
const ajustado = await sharp(DESTINO)
  .extract({ left: 340, top: 0, width: 680, height: 700 })
  .webp({ quality: 85, alphaQuality: 90 })
  .toFile(AJUSTADO);
console.log("->", AJUSTADO, `${Math.round(ajustado.size / 1024)} KB`);
