// Busca patrones de claves en lo que está en staging (lo que se va a commitear).
// Uso: npm run check:secretos
import { execSync } from "node:child_process";

const PATRONES = [
  /sk-ant-/,
  /sk-[A-Za-z0-9_-]{20,}/,
  /eyJ[A-Za-z0-9_-]{10,}\./,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /private_key/,
  /service_role/,
  /AIza[0-9A-Za-z_-]{20,}/,
];

// Este fichero y la configuración de permisos mencionan los patrones a propósito.
const IGNORAR = new Set(["scripts/check-secretos.mjs", "package-lock.json"]);

const archivos = execSync("git diff --cached --name-only --diff-filter=ACMR", {
  encoding: "utf8",
})
  .split("\n")
  .filter((f) => f && !IGNORAR.has(f));

const problemas = [];
for (const archivo of archivos) {
  let texto;
  try {
    texto = execSync(`git show :"${archivo}"`, {
      encoding: "utf8",
      maxBuffer: 50 * 1024 * 1024,
    });
  } catch {
    continue;
  }
  if (texto.includes("\0")) continue; // binario
  texto.split("\n").forEach((linea, i) => {
    for (const patron of PATRONES) {
      if (patron.test(linea)) problemas.push(`${archivo}:${i + 1} -> ${patron}`);
    }
  });
}

if (problemas.length > 0) {
  console.error("POSIBLE SECRETO en lo que vas a commitear:");
  problemas.forEach((p) => console.error("  " + p));
  console.error("Si es una clave real: no basta con borrarla. Revócala y crea otra.");
  process.exit(1);
}
console.log(`check:secretos OK (${archivos.length} archivos revisados)`);
