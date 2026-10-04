import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

// Supabase en memoria para probar la lógica del servidor sin red: solo implementa lo que usa
// lib/cuentos (select/insert/update con eq, neq, gte, in, order, limit, maybeSingle, single y
// count) y las tres operaciones de Storage. RLS se prueba aparte, con PGlite.
type Fila = Record<string, unknown>;
type Filtro = (fila: Fila) => boolean;

export type BaseFalsa = {
  tablas: Record<string, Fila[]>;
  archivos: Map<string, Uint8Array>;
};

class Consulta implements PromiseLike<{ data: unknown; error: unknown; count?: number }> {
  private filtros: Filtro[] = [];
  private op: "select" | "insert" | "update" = "select";
  private carga: Fila[] = [];
  private conteo = false;
  private soloConteo = false;
  private campoOrden?: { campo: string; asc: boolean };
  private tope?: number;
  private devuelve = true;

  constructor(
    private base: BaseFalsa,
    private tabla: string,
  ) {}

  select(_columnas?: string, opciones?: { count?: string; head?: boolean }) {
    if (this.op === "select") {
      this.conteo = opciones?.count === "exact";
      this.soloConteo = Boolean(opciones?.head);
    }
    this.devuelve = true;
    return this;
  }
  insert(valor: Fila | Fila[]) {
    this.op = "insert";
    this.devuelve = false;
    this.carga = Array.isArray(valor) ? valor : [valor];
    return this;
  }
  update(valor: Fila) {
    this.op = "update";
    this.devuelve = false;
    this.carga = [valor];
    return this;
  }
  eq(campo: string, valor: unknown) {
    this.filtros.push((f) => f[campo] === valor);
    return this;
  }
  neq(campo: string, valor: unknown) {
    this.filtros.push((f) => f[campo] !== valor);
    return this;
  }
  gte(campo: string, valor: string) {
    this.filtros.push((f) => String(f[campo]) >= valor);
    return this;
  }
  in(campo: string, valores: unknown[]) {
    this.filtros.push((f) => valores.includes(f[campo]));
    return this;
  }
  order(campo: string, opciones?: { ascending?: boolean }) {
    this.campoOrden = { campo, asc: opciones?.ascending !== false };
    return this;
  }
  limit(n: number) {
    this.tope = n;
    return this;
  }
  maybeSingle() {
    return this.ejecutar().then((r) => ({ ...r, data: (r.data as Fila[])[0] ?? null }));
  }
  single() {
    return this.ejecutar().then((r) => {
      const fila = (r.data as Fila[])[0];
      return fila ? { ...r, data: fila } : { data: null, error: { message: "sin filas" } };
    });
  }
  then<R1, R2>(
    alOk?: ((v: { data: unknown; error: unknown; count?: number }) => R1 | PromiseLike<R1>) | null,
    alError?: ((e: unknown) => R2 | PromiseLike<R2>) | null,
  ) {
    return this.ejecutar().then(alOk, alError);
  }

  private async ejecutar(): Promise<{ data: Fila[] | null; error: unknown; count?: number }> {
    const filas = (this.base.tablas[this.tabla] ??= []);
    if (this.op === "insert") {
      const nuevas = this.carga.map((c) => ({
        id: randomUUID(),
        created_at: new Date().toISOString(),
        ...c,
      }));
      filas.push(...nuevas);
      return { data: this.devuelve ? nuevas : null, error: null };
    }
    let seleccion = filas.filter((f) => this.filtros.every((fn) => fn(f)));
    if (this.op === "update") {
      seleccion.forEach((f) => Object.assign(f, this.carga[0]));
      return { data: this.devuelve ? seleccion : null, error: null };
    }
    const count = seleccion.length;
    if (this.campoOrden) {
      const { campo, asc } = this.campoOrden;
      seleccion = [...seleccion].sort((a, b) => (String(a[campo]) < String(b[campo]) ? -1 : 1) * (asc ? 1 : -1));
    }
    if (this.tope !== undefined) seleccion = seleccion.slice(0, this.tope);
    return {
      data: this.soloConteo ? null : seleccion,
      error: null,
      ...(this.conteo ? { count } : {}),
    };
  }
}

export function crearSupabaseFalso(tablas: Record<string, Fila[]> = {}) {
  const base: BaseFalsa = { tablas: structuredClone(tablas), archivos: new Map() };
  const client = {
    from: (tabla: string) => new Consulta(base, tabla),
    storage: {
      from: () => ({
        upload: async (ruta: string, audio: Uint8Array) => {
          if (base.archivos.has(ruta)) return { error: { message: "The resource already exists" } };
          base.archivos.set(ruta, audio);
          return { error: null };
        },
        list: async (carpeta: string, opciones?: { search?: string }) => ({
          data: [...base.archivos.keys()]
            .filter((r) => r.startsWith(`${carpeta}/`))
            .map((r) => ({ name: r.slice(carpeta.length + 1) }))
            .filter((f) => !opciones?.search || f.name.includes(opciones.search)),
          error: null,
        }),
        createSignedUrls: async (rutas: string[]) => ({
          data: rutas.map((path) => ({ path, signedUrl: `https://storage.test/${path}?token=firmado` })),
          error: null,
        }),
      }),
    },
  } as unknown as SupabaseClient;
  return { client, base };
}
