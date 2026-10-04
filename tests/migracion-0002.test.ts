// @vitest-environment node
import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { como, crearDb, crearUsuario } from "./helpers/db";

let db: PGlite;
let padre: string;
let otro: string;
let familia: string;

beforeAll(async () => {
  db = await crearDb();
  padre = await crearUsuario(db, "padre@example.com");
  otro = await crearUsuario(db, "otro@example.com");
  familia = await como(db, padre, async (q) => {
    const r = await q<{ id: string }>("select public.crear_familia('Mi familia') as id");
    return r[0].id;
  });
  await como(db, otro, (q) => q("select public.crear_familia('Otra') as id"));
});
afterAll(async () => {
  await db.close();
});

describe("idioma de la familia", () => {
  it("por defecto es castellano", async () => {
    const r = await db.query<{ idioma: string }>("select idioma from familias where id = $1", [familia]);
    expect(r.rows[0].idioma).toBe("es");
  });

  it("solo admite es o eu", async () => {
    await expect(
      db.query("update familias set idioma = 'fr' where id = $1", [familia]),
    ).rejects.toThrow(/check/i);
  });

  it("un padre puede cambiar el de su familia y no el de otra", async () => {
    await como(db, padre, (q) => q("update familias set idioma = 'eu' where id = $1", [familia]));
    const mio = await como(db, padre, (q) => q<{ idioma: string }>("select idioma from familias"));
    expect(mio).toEqual([{ idioma: "eu" }]);

    const ajenas = await como(db, otro, (q) =>
      q("update familias set idioma = 'eu' where id = $1 returning id", [familia]),
    );
    expect(ajenas).toEqual([]);
  });
});

describe("fecha de nacimiento del perfil", () => {
  it("se guarda con consentimiento de los padres", async () => {
    const r = await db.query<{ fecha_nacimiento: Date }>(
      `insert into perfiles_hijo (familia_id, avatar_clave, consentimiento_padres_at, fecha_nacimiento)
       values ($1, 'zorro', now(), '2022-03-10') returning fecha_nacimiento`,
      [familia],
    );
    expect(r.rows[0].fecha_nacimiento).toBeTruthy();
  });

  it("sin consentimiento no se guarda", async () => {
    await expect(
      db.query(
        `insert into perfiles_hijo (familia_id, avatar_clave, fecha_nacimiento)
         values ($1, 'zorro', '2022-03-10')`,
        [familia],
      ),
    ).rejects.toThrow(/perfiles_hijo_nacimiento_con_consentimiento/);
  });

  it("es opcional", async () => {
    await db.query("insert into perfiles_hijo (familia_id, avatar_clave) values ($1, 'oso')", [familia]);
  });
});
