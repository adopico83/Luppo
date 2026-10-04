// @vitest-environment node
import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { como, crearDb, crearUsuario } from "./helpers/db";

let db: PGlite;
let padre: string;
let otro: string;
let familia: string;
let perfil: string;
let cuento: string;

beforeAll(async () => {
  db = await crearDb();
  padre = await crearUsuario(db, "padre@example.com");
  otro = await crearUsuario(db, "otro@example.com");
  familia = await como(db, padre, async (q) => {
    const r = await q<{ id: string }>("select public.crear_familia('Mi familia') as id");
    return r[0].id;
  });
  await como(db, otro, (q) => q("select public.crear_familia('Otra') as id"));
  const p = await db.query<{ id: string }>(
    "insert into perfiles_hijo (familia_id, avatar_clave) values ($1, 'luppo') returning id",
    [familia],
  );
  perfil = p.rows[0].id;
  const muneco = await db.query<{ id: string }>("select id from munecos where clave = 'luppo'");
  const c = await db.query<{ id: string }>(
    `insert into cuentos (familia_id, perfil_id, protagonistas, lugar_clave)
     values ($1, $2, $3, 'bosque') returning id`,
    [familia, perfil, [muneco.rows[0].id]],
  );
  cuento = c.rows[0].id;
});
afterAll(async () => {
  await db.close();
});

describe("columnas nuevas de cuentos", () => {
  it("idioma es castellano por defecto y solo admite es o eu", async () => {
    const r = await db.query<{ idioma: string; coste_estimado_centimos: string }>(
      "select idioma, coste_estimado_centimos from cuentos where id = $1",
      [cuento],
    );
    expect(r.rows[0].idioma).toBe("es");
    expect(Number(r.rows[0].coste_estimado_centimos)).toBe(0);
    await expect(
      db.query("update cuentos set idioma = 'fr' where id = $1", [cuento]),
    ).rejects.toThrow(/check/i);
  });

  it("el coste no puede ser negativo y la edad tiene un rango razonable", async () => {
    await expect(
      db.query("update cuentos set coste_estimado_centimos = -1 where id = $1", [cuento]),
    ).rejects.toThrow(/check/i);
    await expect(
      db.query("update cuentos set edad_objetivo = 40 where id = $1", [cuento]),
    ).rejects.toThrow(/check/i);
  });

  it("un padre guarda idioma, edad, coste y modelo de voz en su cuento", async () => {
    const r = await como(db, padre, (q) =>
      q<{ idioma: string }>(
        `update cuentos set idioma = 'eu', edad_objetivo = 5, coste_estimado_centimos = 1.25,
           coste_estimado_usd = 0.0125, modelo_tts = 'eleven_multilingual_v2'
         where id = $1 returning idioma`,
        [cuento],
      ),
    );
    expect(r).toEqual([{ idioma: "eu" }]);
  });

  it("RLS: otra familia no ve ni cambia esos datos", async () => {
    expect(await como(db, otro, (q) => q("select id from cuentos"))).toEqual([]);
    expect(
      await como(db, otro, (q) =>
        q("update cuentos set coste_estimado_centimos = 99 where id = $1 returning id", [cuento]),
      ),
    ).toEqual([]);
  });
});

describe("escenas", () => {
  it("no admite dos escenas en la misma posición del cuento", async () => {
    const nueva = (clave: string, orden: number) =>
      db.query(
        `insert into escenas (cuento_id, clave, orden, tipo, texto) values ($1, $2, $3, 'narracion', 'Hola')`,
        [cuento, clave, orden],
      );
    await nueva("e1", 1);
    await expect(nueva("e1bis", 1)).rejects.toThrow(/escenas_cuento_orden_uq/);
    await nueva("e2", 2);
  });
});

describe("límite diario por defecto", () => {
  it("una familia nueva tiene 10 cuentos al día", async () => {
    const r = await como(db, padre, (q) =>
      q<{ cuentos_max_dia: number }>("select cuentos_max_dia from ajustes_familia"),
    );
    expect(r).toEqual([{ cuentos_max_dia: 10 }]);
  });
});
