// @vitest-environment node
import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  SEED_SQL,
  como,
  crearDb,
  crearUsuario,
  sha256Hex,
} from "./helpers/db";

const RLS = /row-level security/i;
const DENEGADO = /permission denied/i;

let db: PGlite;
let a: string; // padre A, miembro de la familia FA
let b: string; // padre B, invitado a FA
let c: string; // padre C, sin familia
let e: string; // padre E, miembro de otra familia FE
let fa: string;
let fe: string;
let perfilA: string;
let perfilE: string;
let cuentoA: string;
let escenaA: string;

const EMAIL_B = "B@Example.com"; // con mayúsculas: la comparación ignora caso

async function contar(sql: string, params?: unknown[]) {
  const r = await db.query<{ n: number }>(
    `select count(*)::int as n from (${sql}) t`,
    params,
  );
  return r.rows[0].n;
}

beforeAll(async () => {
  db = await crearDb();
  a = await crearUsuario(db, "a@example.com");
  b = await crearUsuario(db, EMAIL_B);
  c = await crearUsuario(db, "c@example.com");
  e = await crearUsuario(db, "e@example.com");

  fa = await como(db, a, async (q) => {
    const r = await q<{ id: string }>(
      "select public.crear_familia('Familia A') as id",
    );
    return r[0].id;
  });
  fe = await como(db, e, async (q) => {
    const r = await q<{ id: string }>(
      "select public.crear_familia('Familia E') as id",
    );
    return r[0].id;
  });

  // Datos de FA y FE como superusuario (la app los crearía por sus rutas).
  perfilA = (
    await db.query<{ id: string }>(
      `insert into perfiles_hijo (familia_id, avatar_clave, nombre, consentimiento_padres_at)
       values ($1, 'zorro', 'Hijo A', now()) returning id`,
      [fa],
    )
  ).rows[0].id;
  perfilE = (
    await db.query<{ id: string }>(
      `insert into perfiles_hijo (familia_id, avatar_clave) values ($1, 'oso') returning id`,
      [fe],
    )
  ).rows[0].id;
  cuentoA = (
    await db.query<{ id: string }>(
      `insert into cuentos (familia_id, perfil_id, titulo, protagonistas, lugar_clave)
       values ($1, $2, 'Cuento A', array[gen_random_uuid()], 'bosque') returning id`,
      [fa, perfilA],
    )
  ).rows[0].id;
  escenaA = (
    await db.query<{ id: string }>(
      `insert into escenas (cuento_id, clave, orden, tipo, texto)
       values ($1, 'inicio', 1, 'narracion', 'Había una vez') returning id`,
      [cuentoA],
    )
  ).rows[0].id;
  await db.query(
    `insert into decisiones (escena_id, orden, etiqueta, icono_clave, destino_clave)
     values ($1, 1, 'Ir al bosque', 'arbol', 'bosque')`,
    [escenaA],
  );
  await db.query(
    `insert into uso_mensual (familia_id, mes, cuentos_generados) values ($1, '2026-10-01', 2)`,
    [fa],
  );
  await db.query(
    `insert into secundarios_pedidos (familia_id, clave_pedida) values ($1, 'dragon')`,
    [fa],
  );
  await db.query(
    `insert into invitaciones_familia (familia_id, email, token_hash, invitado_por)
     values ($1, 'otro@example.com', $2, $3)`,
    [fa, sha256Hex("token-semilla"), a],
  );
  await db.query(
    `insert into storage.objects (bucket_id, name, owner) values ('cuentos', $1, $2)`,
    [`${fa}/${perfilA}/${cuentoA}/escena.mp3`, a],
  );
});

afterAll(async () => {
  await db.close();
});

describe("criterio 8: aislamiento entre familias", () => {
  const tablas = [
    "perfiles_hijo",
    "cuentos",
    "escenas",
    "decisiones",
    "familias",
    "miembros_familia",
    "ajustes_familia",
    "invitaciones_familia",
    "uso_mensual",
    "secundarios_pedidos",
  ];

  it("el miembro de FA ve filas en todas esas tablas (control)", async () => {
    for (const t of tablas) {
      const filas = await como(db, a, (q) => q(`select * from public.${t}`));
      expect(filas.length, t).toBeGreaterThan(0);
    }
  });

  it.each(tablas)("C (sin familia) ve cero filas en %s", async (t) => {
    const filas = await como(db, c, (q) => q(`select * from public.${t}`));
    expect(filas).toHaveLength(0);
  });

  it("E no ve nada de FA, solo lo de FE", async () => {
    const perfiles = await como(db, e, (q) =>
      q<{ id: string }>("select id from public.perfiles_hijo"),
    );
    expect(perfiles.map((p) => p.id)).toEqual([perfilE]);
    const cuentos = await como(db, e, (q) => q("select * from public.cuentos"));
    expect(cuentos).toHaveLength(0);
  });

  it("C no puede insertar en tablas de otra familia", async () => {
    const intentos: [string, string, unknown[]][] = [
      [
        "perfiles_hijo",
        "insert into public.perfiles_hijo (familia_id, avatar_clave) values ($1, 'x')",
        [fa],
      ],
      [
        "cuentos",
        "insert into public.cuentos (familia_id, perfil_id, protagonistas, lugar_clave) values ($1, $2, array[gen_random_uuid()], 'x')",
        [fa, perfilA],
      ],
      [
        "escenas",
        "insert into public.escenas (cuento_id, clave, orden, tipo, texto) values ($1, 'z', 9, 'narracion', 't')",
        [cuentoA],
      ],
      [
        "decisiones",
        "insert into public.decisiones (escena_id, orden, etiqueta, icono_clave, destino_clave) values ($1, 9, 'e', 'i', 'd')",
        [escenaA],
      ],
      [
        "uso_mensual",
        "insert into public.uso_mensual (familia_id, mes) values ($1, '2026-11-01')",
        [fa],
      ],
      [
        "secundarios_pedidos",
        "insert into public.secundarios_pedidos (familia_id, clave_pedida) values ($1, 'x')",
        [fa],
      ],
      [
        "invitaciones_familia",
        "insert into public.invitaciones_familia (familia_id, email, token_hash, invitado_por) values ($1, 'x@x.com', 'h', auth.uid())",
        [fa],
      ],
    ];
    for (const [t, sql, params] of intentos) {
      await expect(
        como(db, c, (q) => q(sql, params)),
        t,
      ).rejects.toThrow(RLS);
    }
  });

  it("C no puede modificar ni borrar filas de otra familia (0 filas afectadas)", async () => {
    await como(db, c, async (q) => {
      expect(
        await q("update public.cuentos set titulo = 'hack' returning id"),
      ).toHaveLength(0);
      expect(
        await q("delete from public.perfiles_hijo returning id"),
      ).toHaveLength(0);
      expect(
        await q(
          "update public.ajustes_familia set cuentos_max_dia = 99 returning id",
        ),
      ).toHaveLength(0);
    });
    expect(
      await contar("select 1 from cuentos where titulo = 'Cuento A'"),
    ).toBe(1);
    expect(await contar("select 1 from perfiles_hijo")).toBe(2);
  });

  it("storage: C no lee ni inserta bajo la carpeta de FA", async () => {
    const vistos = await como(db, c, (q) => q("select * from storage.objects"));
    expect(vistos).toHaveLength(0);
    await expect(
      como(db, c, (q) =>
        q(
          "insert into storage.objects (bucket_id, name, owner) values ('cuentos', $1, auth.uid())",
          [`${fa}/${perfilA}/${cuentoA}/hack.mp3`],
        ),
      ),
    ).rejects.toThrow(RLS);
  });

  it("storage: E tampoco entra en la carpeta de FA", async () => {
    await expect(
      como(db, e, (q) =>
        q(
          "insert into storage.objects (bucket_id, name) values ('cuentos', $1)",
          [`${fa}/x/y/z.mp3`],
        ),
      ),
    ).rejects.toThrow(RLS);
  });

  it("storage: A lee e inserta bajo su propia carpeta, y no en otro bucket", async () => {
    const vistos = await como(db, a, (q) => q("select * from storage.objects"));
    expect(vistos).toHaveLength(1);
    await como(db, a, (q) =>
      q(
        "insert into storage.objects (bucket_id, name) values ('cuentos', $1)",
        [`${fa}/${perfilA}/${cuentoA}/otra.mp3`],
      ),
    );
    await expect(
      como(db, a, (q) =>
        q("insert into storage.objects (bucket_id, name) values ('otro', $1)", [
          `${fa}/x/y/z.mp3`,
        ]),
      ),
    ).rejects.toThrow(RLS);
    await db.query("delete from storage.objects where name like '%otra.mp3'");
  });

  it("storage: una ruta mal formada se rechaza por RLS, sin error de cast", async () => {
    await expect(
      como(db, a, (q) =>
        q(
          "insert into storage.objects (bucket_id, name) values ('cuentos', 'sin-carpeta.mp3')",
        ),
      ),
    ).rejects.toThrow(RLS);
  });

  it("anon no ve nada (rechazado o cero filas)", async () => {
    for (const t of [...tablas, "munecos", "secundarios", "canciones"]) {
      let filas = 0;
      try {
        filas = (await como(db, null, (q) => q(`select * from public.${t}`)))
          .length;
      } catch (err) {
        expect(String(err), t).toMatch(DENEGADO);
      }
      expect(filas, t).toBe(0);
    }
    const objs = await como(db, null, (q) =>
      q("select * from storage.objects"),
    );
    expect(objs).toHaveLength(0);
  });

  it("anon no puede llamar a las funciones", async () => {
    await expect(
      como(db, null, (q) => q("select public.crear_familia('x')")),
    ).rejects.toThrow(DENEGADO);
    await expect(
      como(db, null, (q) => q("select public.aceptar_invitacion('x')")),
    ).rejects.toThrow(DENEGADO);
  });
});

describe("criterio 17: invitar a otro padre", () => {
  const token = "token-secreto-para-B-1234567890";

  it("A invita a B; B acepta y ve lo mismo que A", async () => {
    // B aún no ve nada.
    expect(
      await como(db, b, (q) => q("select * from public.perfiles_hijo")),
    ).toHaveLength(0);

    await como(db, a, (q) =>
      q(
        `insert into public.invitaciones_familia (familia_id, email, token_hash, invitado_por)
         values ($1, $2, $3, auth.uid())`,
        [fa, EMAIL_B, sha256Hex(token)],
      ),
    );
    // El invitado no lee las invitaciones: solo acepta con el token.
    expect(
      await como(db, b, (q) => q("select * from public.invitaciones_familia")),
    ).toHaveLength(0);

    const devuelta = await como(db, b, (q) =>
      q<{ id: string }>("select public.aceptar_invitacion($1) as id", [token]),
    );
    expect(devuelta[0].id).toBe(fa);

    const ids = async (user: string, sql: string) =>
      (await como(db, user, (q) => q<{ id: string }>(sql)))
        .map((r) => r.id)
        .sort();
    for (const t of ["perfiles_hijo", "cuentos", "ajustes_familia"]) {
      const sql = `select id from public.${t}`;
      const deA = await ids(a, sql);
      const deB = await ids(b, sql);
      expect(deB, t).toEqual(deA);
      expect(deB.length, t).toBeGreaterThan(0);
    }
    expect(
      await como(db, b, (q) => q("select * from public.miembros_familia")),
    ).toHaveLength(2);
    expect(
      await contar(
        "select 1 from invitaciones_familia where token_hash = $1 and aceptada_at is not null",
        [sha256Hex(token)],
      ),
    ).toBe(1);
  });

  it("un token reutilizado falla, incluso para otro usuario", async () => {
    await expect(
      como(db, b, (q) => q("select public.aceptar_invitacion($1)", [token])),
    ).rejects.toThrow(/no válida o caducada/);
    await expect(
      como(db, c, (q) => q("select public.aceptar_invitacion($1)", [token])),
    ).rejects.toThrow(/no válida o caducada/);
    expect(
      await como(db, c, (q) => q("select * from public.perfiles_hijo")),
    ).toHaveLength(0);
  });

  it("token equivocado, nulo o vacío falla", async () => {
    for (const t of ["no-existe", "", null]) {
      await expect(
        como(db, c, (q) => q("select public.aceptar_invitacion($1)", [t])),
      ).rejects.toThrow(/no válida o caducada/);
    }
  });

  it("invitación caducada falla", async () => {
    const t = "token-caducado";
    await db.query(
      `insert into invitaciones_familia (familia_id, email, token_hash, invitado_por, caduca_at)
       values ($1, 'c@example.com', $2, $3, now() - interval '1 minute')`,
      [fa, sha256Hex(t), a],
    );
    await expect(
      como(db, c, (q) => q("select public.aceptar_invitacion($1)", [t])),
    ).rejects.toThrow(/no válida o caducada/);
  });

  it("invitación para otro email falla y no se consume", async () => {
    const t = "token-para-otro";
    await db.query(
      `insert into invitaciones_familia (familia_id, email, token_hash, invitado_por)
       values ($1, 'alguien@example.com', $2, $3)`,
      [fa, sha256Hex(t), a],
    );
    await expect(
      como(db, c, (q) => q("select public.aceptar_invitacion($1)", [t])),
    ).rejects.toThrow(/otro email/);
    expect(
      await contar(
        "select 1 from invitaciones_familia where aceptada_at is null and token_hash = $1",
        [sha256Hex(t)],
      ),
    ).toBe(1);
    expect(
      await como(db, c, (q) => q("select * from public.miembros_familia")),
    ).toHaveLength(0);
  });

  it("sin usuario en el JWT no se puede crear familia ni aceptar", async () => {
    // Rol authenticated pero sin sub: simula un JWT sin usuario.
    await db.query("select set_config('request.jwt.claim.sub', '', false)");
    await db.exec("set role authenticated");
    try {
      await expect(
        db.query("select public.crear_familia('x')"),
      ).rejects.toThrow(/iniciar sesión/);
      await expect(
        db.query("select public.aceptar_invitacion('x')"),
      ).rejects.toThrow(/iniciar sesión/);
    } finally {
      await db.exec("reset role");
    }
  });

  it("crear_familia valida el nombre", async () => {
    await expect(
      como(db, c, (q) => q("select public.crear_familia('   ')")),
    ).rejects.toThrow(/nombre/);
  });

  it("nadie se inserta a mano en miembros_familia ni crea familias a mano", async () => {
    await expect(
      como(db, c, (q) =>
        q(
          "insert into public.miembros_familia (familia_id, user_id) values ($1, $2)",
          [fa, c],
        ),
      ),
    ).rejects.toThrow(DENEGADO);
    await expect(
      como(db, c, (q) =>
        q("insert into public.familias (nombre) values ('mia')"),
      ),
    ).rejects.toThrow(DENEGADO);
    // Ni siquiera un miembro puede añadir a otro a mano.
    await expect(
      como(db, a, (q) =>
        q(
          "insert into public.miembros_familia (familia_id, user_id) values ($1, $2)",
          [fa, c],
        ),
      ),
    ).rejects.toThrow(DENEGADO);
  });

  it("una invitación debe quedar a nombre de quien la crea", async () => {
    await expect(
      como(db, a, (q) =>
        q(
          "insert into public.invitaciones_familia (familia_id, email, token_hash, invitado_por) values ($1, 'x@x.com', 'h2', $2)",
          [fa, b],
        ),
      ),
    ).rejects.toThrow(RLS);
  });
});

describe("familias: columnas de plan protegidas", () => {
  it("un miembro cambia el nombre", async () => {
    const r = await como(db, a, (q) =>
      q<{ nombre: string }>(
        "update public.familias set nombre = 'Los A' where id = $1 returning nombre",
        [fa],
      ),
    );
    expect(r[0].nombre).toBe("Los A");
  });

  it.each([
    "plan = 'luppo_plus'",
    "plan_hasta = now()",
    "stripe_customer_id = 'cus_1'",
  ])("un miembro no puede cambiar %s", async (set) => {
    await expect(
      como(db, a, (q) =>
        q(`update public.familias set ${set} where id = $1`, [fa]),
      ),
    ).rejects.toThrow(DENEGADO);
  });

  it("un no miembro no cambia el nombre de otra familia", async () => {
    const r = await como(db, c, (q) =>
      q("update public.familias set nombre = 'hack' where id = $1 returning id", [
        fa,
      ]),
    );
    expect(r).toHaveLength(0);
  });
});

describe("integridad de datos", () => {
  it("un cuento con perfil de otra familia se rechaza (FK compuesta)", async () => {
    await expect(
      como(db, e, (q) =>
        q(
          `insert into public.cuentos (familia_id, perfil_id, protagonistas, lugar_clave)
           values ($1, $2, array[gen_random_uuid()], 'x')`,
          [fe, perfilA],
        ),
      ),
    ).rejects.toThrow(/foreign key|violates/i);
    // Control: con su propio perfil sí.
    const ok = await como(db, e, (q) =>
      q(
        `insert into public.cuentos (familia_id, perfil_id, protagonistas, lugar_clave)
         values ($1, $2, array[gen_random_uuid()], 'x') returning id`,
        [fe, perfilE],
      ),
    );
    expect(ok).toHaveLength(1);
  });

  it("nombre sin consentimiento de los padres se rechaza", async () => {
    await expect(
      como(db, a, (q) =>
        q(
          "insert into public.perfiles_hijo (familia_id, avatar_clave, nombre) values ($1, 'x', 'Pepe')",
          [fa],
        ),
      ),
    ).rejects.toThrow(/check constraint/i);
    // Con consentimiento sí; sin nombre y sin consentimiento, también.
    await como(db, a, async (q) => {
      await q(
        "insert into public.perfiles_hijo (familia_id, avatar_clave, nombre, consentimiento_padres_at) values ($1, 'x', 'Pepe', now())",
        [fa],
      );
      await q(
        "insert into public.perfiles_hijo (familia_id, avatar_clave) values ($1, 'y')",
        [fa],
      );
    });
  });
});

describe("catálogos del sistema", () => {
  it("cualquier autenticado lee los muñecos del sistema", async () => {
    const r = await como(db, c, (q) =>
      q<{ clave: string }>("select clave from public.munecos where es_sistema"),
    );
    expect(r).toHaveLength(17); // Luppo + los 16 personajes elegibles
    expect(r.map((m) => m.clave)).toContain("luppo");
    expect(r.map((m) => m.clave)).toContain("zumbillo");
  });

  it("un usuario no crea, cambia ni borra muñecos del sistema", async () => {
    await expect(
      como(db, a, (q) =>
        q(
          "insert into public.munecos (clave, nombre, es_sistema) values ('falso', 'Falso', true)",
        ),
      ),
    ).rejects.toThrow(RLS);
    await expect(
      como(db, a, (q) =>
        q(
          "insert into public.munecos (familia_id, clave, nombre, es_sistema) values ($1, 'falso', 'Falso', true)",
          [fa],
        ),
      ),
    ).rejects.toThrow(RLS);
    await como(db, a, async (q) => {
      expect(
        await q(
          "update public.munecos set nombre = 'hack' where es_sistema returning id",
        ),
      ).toHaveLength(0);
      expect(
        await q("delete from public.munecos where es_sistema returning id"),
      ).toHaveLength(0);
    });
    expect(
      await contar("select 1 from munecos where es_sistema and nombre = 'hack'"),
    ).toBe(0);
    expect(await contar("select 1 from munecos where es_sistema")).toBe(17);
  });

  it("no se puede convertir un muñeco de familia en uno del sistema", async () => {
    const id = (
      await como(db, a, (q) =>
        q<{ id: string }>(
          "insert into public.munecos (familia_id, clave, nombre) values ($1, 'mio', 'Mio') returning id",
          [fa],
        ),
      )
    )[0].id;
    await expect(
      como(db, a, (q) =>
        q(
          "update public.munecos set es_sistema = true, familia_id = null where id = $1",
          [id],
        ),
      ),
    ).rejects.toThrow(RLS);
  });

  it("los muñecos de una familia solo los ve esa familia", async () => {
    expect(
      await como(db, c, (q) =>
        q("select * from public.munecos where not es_sistema"),
      ),
    ).toHaveLength(0);
    expect(
      (
        await como(db, a, (q) =>
          q("select * from public.munecos where not es_sistema"),
        )
      ).length,
    ).toBeGreaterThan(0);
  });

  it("secundarios: legibles, no escribibles", async () => {
    const r = await como(db, c, (q) => q("select * from public.secundarios"));
    expect(r.length).toBe(18);
    await expect(
      como(db, a, (q) =>
        q("insert into public.secundarios (clave, nombre) values ('nuevo', 'Nuevo')"),
      ),
    ).rejects.toThrow(DENEGADO);
    await expect(
      como(db, a, (q) => q("update public.secundarios set nombre = 'x'")),
    ).rejects.toThrow(DENEGADO);
    await expect(
      como(db, a, (q) => q("delete from public.secundarios")),
    ).rejects.toThrow(DENEGADO);
  });

  it("canciones base legibles por cualquiera; las de un cuento solo por su familia", async () => {
    const luppo = (
      await db.query<{ id: string }>(
        "select id from munecos where clave = 'luppo'",
      )
    ).rows[0].id;
    await db.query(
      "insert into canciones (muneco_id, cuento_id, tipo) values ($1, null, 'instrumental_base')",
      [luppo],
    );
    await db.query(
      "insert into canciones (muneco_id, cuento_id, tipo) values ($1, $2, 'cancion_cuento')",
      [luppo, cuentoA],
    );
    expect(
      await como(db, c, (q) => q("select * from public.canciones")),
    ).toHaveLength(1);
    expect(
      await como(db, a, (q) => q("select * from public.canciones")),
    ).toHaveLength(2);
    await expect(
      como(db, a, (q) =>
        q(
          "insert into public.canciones (muneco_id, tipo) values ($1, 'instrumental_base')",
          [luppo],
        ),
      ),
    ).rejects.toThrow(DENEGADO);
  });
});

describe("semilla", () => {
  it("es idempotente y el comodín es único", async () => {
    const copia = await crearDb(); // ya aplica la semilla una vez
    const contarCopia = async () => {
      const r = await copia.query<{ m: number; s: number }>(
        "select (select count(*) from munecos)::int as m, (select count(*) from secundarios)::int as s",
      );
      return r.rows[0];
    };
    const antes = await contarCopia();
    await copia.exec(SEED_SQL());
    await copia.exec(SEED_SQL());
    expect(await contarCopia()).toEqual(antes);
    expect(antes).toEqual({ m: 17, s: 18 });

    const comodines = await copia.query<{ n: number }>(
      "select count(*)::int as n from secundarios where es_comodin",
    );
    expect(comodines.rows[0].n).toBe(1);
    await expect(
      copia.query(
        "insert into secundarios (clave, nombre, es_comodin) values ('otro', 'Otro', true)",
      ),
    ).rejects.toThrow(/duplicate key/i);
    await copia.close();
  });
});
