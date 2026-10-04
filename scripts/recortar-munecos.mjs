// Quita el fondo crema de papel de cada muñeco de public/munecos/<clave>.jpg y guarda un recorte
// con transparencia, ajustado al cuerpo, en public/recortes/<clave>.webp. Lo usa el lector
// del cuento para poner a los personajes de cuerpo entero sobre el dibujo del lugar.
// Misma técnica que recortar-luppo.mjs: solo es fondo lo parecido al papel CONECTADO con el borde
// (los blancos de dentro del personaje se quedan opacos). La sombra de los pies del dibujo se
// descarta: el lector pone una propia, suave, con CSS. Uso: npm run recortar:munecos
import { mkdirSync, readdirSync } from "node:fs";
import sharp from "sharp";

const ORIGEN = "public/munecos";
const DESTINO = "public/recortes";
const DESDE = 14;
const HASTA = 30;
const UMBRAL_ALFA = 110; // por debajo, el píxel no cuenta para ajustar el recorte
const MIN_POR_LINEA = 6; // filas/columnas con menos píxeles opacos son motas sueltas
const MARGEN = 12;
// Personajes blancos como el papel: su cuerpo tiene zonas del color del papel que no son fondo, así que
// solo se buscan bolsas de papel en la franja de los pies (a partir de esa fracción del alto).
const BOLSAS_DESDE = { nubecita: 0.8 };

const suave = (t) => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
};
const mediana = (v) => v.sort((a, b) => a - b)[Math.floor(v.length / 2)];

async function recortar(clave) {
  const { data, info } = await sharp(`${ORIGEN}/${clave}.jpg`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

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
  const papel = muestras.map(mediana);

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

  // Bolsas de papel entre las piernas o el brazo y el cuerpo: manchas grandes del color del papel
  // en la mitad de abajo que el recorte desde el borde no alcanza.
  const visto = new Uint8Array(width * height);
  for (let p0 = Math.floor(height * (BOLSAS_DESDE[clave] ?? 0.6)) * width; p0 < width * height; p0++) {
    if (visto[p0] || esFondo[p0] || distancia[p0] >= HASTA) continue;
    const mancha = [p0];
    visto[p0] = 1;
    for (let j = 0; j < mancha.length; j++) {
      const p = mancha[j];
      const x = p % width;
      for (const q of [x > 0 ? p - 1 : -1, x < width - 1 ? p + 1 : -1, p - width, p + width]) {
        if (q >= 0 && q < width * height && !visto[q] && !esFondo[q] && distancia[q] < HASTA) {
          visto[q] = 1;
          mancha.push(q);
        }
      }
    }
    if (mancha.length > 800) for (const p of mancha) esFondo[p] = 1;
  }

  const porColumna = new Uint32Array(width);
  const porFila = new Uint32Array(height);
  const n = width * height;
  const alfas = new Uint8Array(n);
  for (let p = 0; p < n; p++) {
    const i = p * channels;
    const alfaRecorte = esFondo[p] ? suave((distancia[p] - DESDE) / (HASTA - DESDE)) : 1;
    for (let c = 0; c < 3; c++) {
      const limpio = alfaRecorte > 0 ? (data[i + c] - (1 - alfaRecorte) * papel[c]) / alfaRecorte : 0;
      data[i + c] = Math.min(255, Math.max(0, Math.round(limpio)));
    }
    // La sombra de los pies (papel más oscuro, sin color propio) se descarta.
    const k = (data[i] * papel[0] + data[i + 1] * papel[1] + data[i + 2] * papel[2]) / (papel[0] ** 2 + papel[1] ** 2 + papel[2] ** 2);
    const resto = Math.hypot(data[i] - k * papel[0], data[i + 1] - k * papel[1], data[i + 2] - k * papel[2]);
    const sombra = Math.floor(p / width) >= height * 0.8 && distancia[p] < 95 && resto < 17;
    alfas[p] = sombra ? 0 : Math.round(alfaRecorte * 255);
  }

  // Se queda solo el cuerpo (la mayor mancha opaca) y su borde suave: fuera las motas del papel.
  const etiqueta = new Int32Array(n);
  let mejor = 0, mejorTam = 0, total = 0;
  for (let p0 = 0; p0 < n; p0++) {
    if (alfas[p0] <= UMBRAL_ALFA || etiqueta[p0]) continue;
    total++;
    let tam = 0;
    etiqueta[p0] = total;
    const cola = [p0];
    while (cola.length) {
      const p = cola.pop();
      tam++;
      const x = p % width;
      for (const q of [x > 0 ? p - 1 : -1, x < width - 1 ? p + 1 : -1, p - width, p + width]) {
        if (q >= 0 && q < n && !etiqueta[q] && alfas[q] > UMBRAL_ALFA) {
          etiqueta[q] = total;
          cola.push(q);
        }
      }
    }
    if (tam > mejorTam) { mejorTam = tam; mejor = total; }
  }
  const cerca = new Uint8Array(n); // cuerpo + 4 px alrededor
  for (let p = 0; p < n; p++) {
    if (etiqueta[p] !== mejor) continue;
    const x = p % width, y = (p - x) / width;
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const xx = x + dx, yy = y + dy;
      if (xx >= 0 && xx < width && yy >= 0 && yy < height) cerca[yy * width + xx] = 1;
    }
  }
  for (let p = 0; p < n; p++) {
    data[p * channels + 3] = cerca[p] ? alfas[p] : 0;
    if (etiqueta[p] === mejor) {
      porColumna[p % width]++;
      porFila[Math.floor(p / width)]++;
    }
  }
  const primero = (v) => v.findIndex((n) => n >= MIN_POR_LINEA);
  const ultimo = (v) => v.length - 1 - [...v].reverse().findIndex((n) => n >= MIN_POR_LINEA);
  const minX = primero(porColumna), maxX = ultimo(porColumna);
  const minY = primero(porFila), maxY = ultimo(porFila);

  const left = Math.max(0, minX - MARGEN);
  const top = Math.max(0, minY - MARGEN);
  const salida = await sharp(data, { raw: { width, height, channels } })
    .extract({
      left,
      top,
      width: Math.min(width, maxX + MARGEN + 1) - left,
      height: Math.min(height, maxY + MARGEN + 1) - top,
    })
    .webp({ quality: 88, alphaQuality: 90 })
    .toFile(`${DESTINO}/${clave}.webp`);
  console.log(clave, `${salida.width}x${salida.height}`, `${Math.round(salida.size / 1024)} KB`);
}

mkdirSync(DESTINO, { recursive: true });
for (const f of readdirSync(ORIGEN).filter((f) => f.endsWith(".jpg"))) await recortar(f.replace(/\.jpg$/, ""));
