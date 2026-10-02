import { PGlite } from "@electric-sql/pglite";
import { createHash, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

const leer = (...ruta: string[]) =>
  readFileSync(path.resolve(process.cwd(), ...ruta), "utf8");

export const STUB_SQL = () => leer("tests", "helpers", "supabase-stub.sql");
export const MIGRACION_SQL = () =>
  leer("supabase", "migrations", "0001_inicial.sql");
export const SEED_SQL = () => leer("supabase", "seed.sql");

/** PGlite en memoria con el stub de Supabase, la migración real y la semilla real. */
export async function crearDb(): Promise<PGlite> {
  const db = new PGlite();
  await db.exec(STUB_SQL());
  await db.exec(MIGRACION_SQL());
  await db.exec(SEED_SQL());
  return db;
}

/** sha256 en hexadecimal, igual que la base hace con el token. */
export const sha256Hex = (token: string) =>
  createHash("sha256").update(token, "utf8").digest("hex");

/** Inserta un usuario en auth.users (como superusuario) y devuelve su id. */
export async function crearUsuario(db: PGlite, email: string): Promise<string> {
  const id = randomUUID();
  await db.query("insert into auth.users (id, email) values ($1, $2)", [
    id,
    email,
  ]);
  return id;
}

type Consulta = <T = Record<string, unknown>>(
  sql: string,
  params?: unknown[],
) => Promise<T[]>;

/**
 * Ejecuta `fn` con el rol `authenticated` (o `anon` si userId es null) y
 * request.jwt.claim.sub puesto, y luego restaura el superusuario.
 * Así las políticas RLS se aplican de verdad.
 */
export async function como<R>(
  db: PGlite,
  userId: string | null,
  fn: (q: Consulta) => Promise<R>,
): Promise<R> {
  const rol = userId ? "authenticated" : "anon";
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [
    userId ?? "",
  ]);
  await db.exec(`set role ${rol}`);
  try {
    const q: Consulta = async (sql, params) =>
      (await db.query(sql, params)).rows as never;
    return await fn(q);
  } finally {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub', '', false)");
  }
}
