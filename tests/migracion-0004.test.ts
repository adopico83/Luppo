// @vitest-environment node
import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { como, crearDb, crearUsuario } from "./helpers/db";

let db: PGlite;
let padre: string;
let otro: string;
let cuento: string;

const escena = async (clave: string, orden: number, tipo: string, interaccion: string | null) => {
  const r = await db.query<{ id: string }>(
    `insert into escenas (cuento_id, clave, orden, tipo, interaccion, texto, pregunta, interaccion_datos)
     values ($1, $2, $3, $4, $5, 'Hola', '¿Y ahora?', '{"hasta": 5}') returning id`,
    [cuento, clave, orden, tipo, interaccion],
  );
  return r.rows[0].id;
};

beforeAll(async () => {
  db = await crearDb();
  padre = await crearUsuario(db, "padre@example.com");
  otro = await crearUsuario(db, "otro@example.com");
  const familia = await como(db, padre, async (q) => (await q<{ id: string }>("select public.crear_familia('Mi familia') as id"))[0].id);
  await como(db, otro, (q) => q("select public.crear_familia('Otra') as id"));
  const perfil = (await db.query<{ id: string }>("insert into perfiles_hijo (familia_id, avatar_clave) values ($1, 'luppo') returning id", [familia])).rows[0].id;
  const muneco = (await db.query<{ id: string }>("select id from munecos where clave = 'luppo'")).rows[0].id;
  cuento = (
    await db.query<{ id: string }>(
      `insert into cuentos (familia_id, perfil_id, protagonistas, lugar_clave) values ($1, $2, $3, 'futbol') returning id`,
      [familia, perfil, [muneco]],
    )
  ).rows[0].id;
});
afterAll(async () => {
  await db.close();
});

describe("interacciones de las escenas", () => {
  it("admite elegir, tocar, contar y aprender, y rechaza otros tipos", async () => {
    await escena("e1", 1, "decision", "elegir");
    await escena("e2", 2, "decision", "tocar");
    await escena("e3", 3, "decision", "contar");
    await escena("e4", 4, "decision", "aprender");
    await expect(escena("e5", 5, "decision", "bailar")).rejects.toThrow(/check/i);
  });

  it("una interacción solo cabe en una escena de tipo decisión", async () => {
    await expect(escena("e6", 6, "narracion", "tocar")).rejects.toThrow(/check/i);
  });

  it("guarda la pregunta y los datos del tipo", async () => {
    const r = await db.query<{ pregunta: string; interaccion_datos: { hasta: number } }>(
      "select pregunta, interaccion_datos from escenas where clave = 'e3' and cuento_id = $1",
      [cuento],
    );
    expect(r.rows[0]).toEqual({ pregunta: "¿Y ahora?", interaccion_datos: { hasta: 5 } });
  });
});

describe("decisiones", () => {
  it("guardan consecuencia y cuándo la eligió el niño; RLS: solo su familia las toca", async () => {
    const e = (await db.query<{ id: string }>("select id from escenas where clave = 'e1' and cuento_id = $1", [cuento])).rows[0].id;
    const d = (
      await db.query<{ id: string }>(
        `insert into decisiones (escena_id, orden, etiqueta, icono_clave, destino_clave, consecuencia)
         values ($1, 1, 'Chutar', '⚽', 'e2', '¡Gooool!') returning id`,
        [e],
      )
    ).rows[0].id;
    expect(await como(db, otro, (q) => q("update decisiones set elegida_at = now() where id = $1 returning id", [d]))).toEqual([]);
    const mia = await como(db, padre, (q) => q<{ consecuencia: string; elegida_at: string | null }>(
      "update decisiones set elegida_at = now() where id = $1 returning consecuencia, elegida_at", [d]));
    expect(mia[0].consecuencia).toBe("¡Gooool!");
    expect(mia[0].elegida_at).not.toBeNull();
  });
});
