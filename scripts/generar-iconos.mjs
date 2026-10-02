// Genera los iconos de la PWA (marcador de posición hasta tener el arte final de Luppo).
// Uso: node scripts/generar-iconos.mjs
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const SALVIA = "#9DB08F";
const TERRACOTA = "#C0694E";
const CREMA = "#F4EAD8";
const TINTA = "#2F4566";

// `margen` deja espacio alrededor (el icono "maskable" se recorta por los bordes).
const svg = (margen) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${SALVIA}"/>
  <g transform="translate(256 256) scale(${1 - margen}) translate(-256 -256)">
    <circle cx="256" cy="240" r="170" fill="${CREMA}"/>
    <path d="M110 120 L150 40 L210 90 Z M402 120 L362 40 L302 90 Z" fill="${CREMA}"/>
    <circle cx="200" cy="215" r="20" fill="${TINTA}"/>
    <circle cx="312" cy="215" r="20" fill="${TINTA}"/>
    <path d="M232 262 Q256 286 280 262" stroke="${TINTA}" stroke-width="10" fill="none" stroke-linecap="round"/>
    <rect x="130" y="380" width="252" height="48" rx="24" fill="${TERRACOTA}"/>
  </g>
</svg>`;

const salidas = [
  ["public/icons/icon-192.png", 192, 0],
  ["public/icons/icon-512.png", 512, 0],
  ["public/icons/icon-maskable-512.png", 512, 0.2],
  ["app/apple-icon.png", 180, 0],
];

await mkdir("public/icons", { recursive: true });
for (const [ruta, tam, margen] of salidas) {
  await sharp(Buffer.from(svg(margen))).resize(tam, tam).png().toFile(ruta);
  console.log("creado", ruta);
}
