// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { crearDb, SEED_SQL } from "./helpers/db";

const PERSONAJES = [
  "dragoncito", "zorrito", "caracol", "nubecita", "robotito", "seta", "estrella",
  "manzana", "luna", "cactus", "flan", "globo", "zumbillo", "tiquitaque", "burbujo",
  "gargolito",
];

let db: PGlite;
beforeAll(async () => {
  db = await crearDb();
});
afterAll(async () => {
  await db.close();
});

describe("semilla de muñecos y secundarios", () => {
  it("incluye los 16 personajes de docs/munecos.md más Luppo", async () => {
    const r = await db.query<{ clave: string }>(
      "select clave from munecos where es_sistema order by clave",
    );
    expect(r.rows.map((m) => m.clave)).toEqual([...PERSONAJES, "luppo"].sort());
  });

  it("deja voz, animación y capas en null y los activa", async () => {
    const r = await db.query<{ n: number }>(
      `select count(*)::int as n from munecos
       where es_sistema and (voz_tts is not null or rive_archivo is not null or capas is not null or not activo)`,
    );
    expect(r.rows[0].n).toBe(0);
  });

  it("cada personaje tiene ficha completa e imagen con su clave", async () => {
    const r = await db.query<{ clave: string; ok: boolean }>(
      `select clave,
         (especie is not null and personalidad is not null and forma_de_hablar is not null
          and imagen_path = 'munecos/' || clave || '.jpg'
          and cardinality(lugares_favoritos) > 0) as ok
       from munecos where clave = any($1)`,
      [PERSONAJES],
    );
    expect(r.rows).toHaveLength(16);
    expect(r.rows.filter((m) => !m.ok)).toEqual([]);
  });

  it("incluye Bruma, Tilo, Pomo y Coco con sus acciones propias", async () => {
    const r = await db.query<{ clave: string; acciones_disponibles: string[] }>(
      "select clave, acciones_disponibles from secundarios where clave in ('bruma','tilo','pomo','coco')",
    );
    const por = Object.fromEntries(r.rows.map((s) => [s.clave, s.acciones_disponibles]));
    expect(por).toEqual({
      bruma: ["quieto", "saludar", "abrir_tarro"],
      tilo: ["quieto", "saludar", "senalar_mapa"],
      pomo: ["quieto", "saludar", "regar"],
      coco: ["quieto", "saludar", "inventar"],
    });
  });

  it("volver a ejecutar el seed corrige filas editadas sin duplicar", async () => {
    await db.exec("update munecos set personalidad = 'x' where clave = 'zorrito'");
    await db.exec("update secundarios set descripcion = 'x' where clave = 'tilo'");
    await db.exec(SEED_SQL());
    const m = await db.query<{ personalidad: string }>(
      "select personalidad from munecos where clave = 'zorrito'",
    );
    const s = await db.query<{ descripcion: string }>(
      "select descripcion from secundarios where clave = 'tilo'",
    );
    expect(m.rows[0].personalidad).not.toBe("x");
    expect(s.rows[0].descripcion).not.toBe("x");
    const n = await db.query<{ n: number }>("select count(*)::int as n from munecos");
    expect(n.rows[0].n).toBe(17);
  });
});
