import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LectorCuento } from "@/components/LectorCuento";
import { I18nProvider } from "@/components/I18nProvider";
import { CUENTOS_EJEMPLO } from "@/lib/cuentos/ejemplo";
import { cargarCuento, cuentoDeEjemplo, esIdCuento, type CuentoLectura } from "@/lib/cuentos/lectura";
import { t } from "@/lib/i18n";
import { crearSupabaseFalso } from "./helpers/supabase-falso";

const notFound = vi.fn(() => {
  throw new Error("NOT_FOUND");
});
const idioma = vi.fn(async () => "es");
vi.mock("next/navigation", () => ({ useRouter: () => ({}), notFound: () => notFound() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => crearSupabaseFalso().client }));
vi.mock("@/lib/i18n/servidor", () => ({ idiomaDeFamilia: () => idioma() }));

import CuentoPage from "@/app/cuento/[id]/page";

const cuento: CuentoLectura = {
  titulo: "El panal",
  lugar: "playa",
  personajes: [
    { clave: "zumbillo", nombre: "Zumbillo" },
    { clave: "luna", nombre: "Luna" },
  ],
  escenas: [
    { texto: "Primera escena.", audioUrl: "https://storage.test/1.mp3?token=a" },
    { texto: "Segunda escena.", audioUrl: null },
    { texto: "Última escena.", audioUrl: "https://storage.test/3.mp3?token=c" },
  ],
};

const play = vi.fn(function (this: HTMLMediaElement) {
  Object.defineProperty(this, "paused", { value: false, configurable: true });
  this.dispatchEvent(new Event("play"));
  return Promise.resolve();
});
const pause = vi.fn(function (this: HTMLMediaElement) {
  Object.defineProperty(this, "paused", { value: true, configurable: true });
  this.dispatchEvent(new Event("pause"));
});
beforeEach(() => {
  play.mockClear();
  pause.mockClear();
  notFound.mockClear();
  Object.defineProperty(HTMLMediaElement.prototype, "play", { value: play, configurable: true });
  Object.defineProperty(HTMLMediaElement.prototype, "pause", { value: pause, configurable: true });
});

describe("LectorCuento", () => {
  it("pone de fondo el lugar con el fondo suave de Luppo encima", () => {
    render(<LectorCuento cuento={cuento} />);
    const lugar = screen.getByTestId("fondo-lugar");
    expect(lugar.getAttribute("style")).toContain("/lugares/playa.webp");
    expect(lugar.getAttribute("aria-hidden")).toBe("true");
    const fondo = screen.getByTestId("fondo-luppo");
    expect(lugar.compareDocumentPosition(fondo) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("enseña los personajes elegidos con su gesto en cada escena", () => {
    render(<LectorCuento cuento={cuento} />);
    const lista = screen.getByRole("list", { name: "Personajes del cuento" });
    const gestos = Array.from(lista.querySelectorAll("img, [role=img]")).map((e) => e.className);
    expect(gestos).toHaveLength(2);
    expect(gestos[0]).toContain("gesto-revoloteo"); // Zumbillo
    expect(gestos[1]).toContain("gesto-hamaca"); // Luna
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(screen.getByRole("list", { name: "Personajes del cuento" }).querySelectorAll("img, [role=img]")).toHaveLength(2);
  });

  it("muestra las escenas de una en una con botón gigante «Siguiente» y acaba en «Fin»", () => {
    render(<LectorCuento cuento={cuento} />);
    expect(screen.getByText("Primera escena.")).toBeTruthy();
    expect(screen.queryByText("Segunda escena.")).toBeNull();
    expect(screen.getByText("Escena 1 de 3")).toBeTruthy();

    const siguiente = screen.getByRole("button", { name: "Siguiente" });
    expect(siguiente.className).toContain("min-h-[120px]");
    fireEvent.click(siguiente);
    expect(screen.getByText("Segunda escena.")).toBeTruthy();
    expect(screen.queryByText("Primera escena.")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(screen.getByText("Última escena.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Siguiente" })).toBeNull();
    expect(screen.getByRole("link", { name: "Fin" }).getAttribute("href")).toBe("/");
  });

  it("reproduce y pausa la voz de la escena; sin audio no hay botón", () => {
    const { container } = render(<LectorCuento cuento={cuento} />);
    expect(container.querySelector("audio")?.getAttribute("src")).toBe("https://storage.test/1.mp3?token=a");

    fireEvent.click(screen.getByRole("button", { name: "Escuchar" }));
    expect(play).toHaveBeenCalledTimes(1);
    const pausar = screen.getByRole("button", { name: "Pausar" });
    expect(pausar.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(pausar);
    expect(pause).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Escuchar" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(container.querySelector("audio")).toBeNull();
    expect(screen.queryByRole("button", { name: "Escuchar" })).toBeNull();
  });

  it("al pasar de escena se para la voz y el botón vuelve a «Escuchar»", () => {
    render(<LectorCuento cuento={cuento} />);
    fireEvent.click(screen.getByRole("button", { name: "Escuchar" }));
    expect(screen.getByRole("button", { name: "Pausar" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(screen.getByRole("button", { name: "Escuchar" })).toBeTruthy();
  });

  it("al terminar la voz vuelve a «Escuchar»", () => {
    const { container } = render(<LectorCuento cuento={cuento} />);
    fireEvent.click(screen.getByRole("button", { name: "Escuchar" }));
    act(() => void container.querySelector("audio")!.dispatchEvent(new Event("ended")));
    expect(screen.getByRole("button", { name: "Escuchar" })).toBeTruthy();
  });

  it("los textos salen en euskera con la familia en euskera y no hay ni rastro de costes", () => {
    const { container } = render(
      <I18nProvider idioma="eu">
        <LectorCuento cuento={cuento} />
      </I18nProvider>,
    );
    expect(screen.getByRole("button", { name: t("cuento.siguiente", "eu") })).toBeTruthy();
    expect(screen.getByText(t("cuento.escena", "eu", { n: 1, total: 3 }))).toBeTruthy();
    expect(container.textContent).not.toMatch(/céntim|coste|token|USD|€|\$/i);
  });
});

describe("cargar el cuento guardado", () => {
  const ID = "11111111-1111-4111-8111-111111111111";
  const datos = () =>
    crearSupabaseFalso({
      cuentos: [{ id: ID, titulo: "El panal", lugar_clave: "bosque", estado: "listo", protagonistas: ["m2", "m1"] }],
      escenas: [
        { cuento_id: ID, orden: 2, texto: "Dos", audio_path: null },
        { cuento_id: ID, orden: 1, texto: "Uno", audio_path: "f/p/c/escena-1.mp3" },
      ],
      munecos: [
        { id: "m1", clave: "zumbillo", nombre: "Zumbillo" },
        { id: "m2", clave: "luna", nombre: "Luna" },
      ],
    });

  it("devuelve escenas en orden, personajes en el orden elegido y URLs firmadas", async () => {
    const r = await cargarCuento(datos().client, ID);
    expect(r).toEqual({
      titulo: "El panal",
      lugar: "bosque",
      personajes: [
        { clave: "luna", nombre: "Luna" },
        { clave: "zumbillo", nombre: "Zumbillo" },
      ],
      escenas: [
        { texto: "Uno", audioUrl: "https://storage.test/f/p/c/escena-1.mp3?token=firmado" },
        { texto: "Dos", audioUrl: null },
      ],
    });
  });

  it("null si el id no es un uuid, no existe o aún no está listo", async () => {
    const { client, base } = datos();
    expect(esIdCuento("ejemplo")).toBe(false);
    expect(await cargarCuento(client, "no-es-uuid")).toBeNull();
    expect(await cargarCuento(client, "22222222-2222-4222-8222-222222222222")).toBeNull();
    base.tablas.cuentos[0].estado = "generando";
    expect(await cargarCuento(client, ID)).toBeNull();
  });
});

describe("cuento de ejemplo", () => {
  it("existe en castellano y euskera, sin audio, y usa los personajes y el lugar elegidos", async () => {
    for (const idiomaEj of ["es", "eu"] as const) {
      expect(CUENTOS_EJEMPLO[idiomaEj].escenas.length).toBeGreaterThanOrEqual(4);
    }
    const { client } = crearSupabaseFalso({ munecos: [{ id: "m1", clave: "flan", nombre: "Flan" }] });
    const eu = await cuentoDeEjemplo(client, "eu", ["flan", "otro"], "castillo");
    expect(eu.titulo).toBe(CUENTOS_EJEMPLO.eu.titulo);
    expect(eu.lugar).toBe("castillo");
    expect(eu.personajes).toEqual([
      { clave: "flan", nombre: "Flan" },
      { clave: "otro", nombre: "otro" },
    ]);
    expect(eu.escenas.every((e) => e.audioUrl === null)).toBe(true);
  });
});

describe("página /cuento/[id]", () => {
  const params = <T,>(v: T) => Promise.resolve(v);

  it("/cuento/ejemplo enseña el cuento fijo en el idioma de la familia", async () => {
    idioma.mockResolvedValueOnce("eu");
    render(
      await CuentoPage({
        params: params({ id: "ejemplo" }),
        searchParams: params({ personajes: "flan,luna", lugar: "castillo" }),
      }),
    );
    expect(screen.getByText(CUENTOS_EJEMPLO.eu.escenas[0])).toBeTruthy();
    expect(screen.getByTestId("fondo-lugar").getAttribute("style")).toContain("castillo.webp");
  });

  it("el ejemplo sin parámetros válidos cae a Luppo en el bosque", async () => {
    render(await CuentoPage({ params: params({ id: "ejemplo" }), searchParams: params({ lugar: "volcan" }) }));
    expect(screen.getByTestId("fondo-lugar").getAttribute("style")).toContain("bosque.webp");
  });

  it("un id desconocido da 404", async () => {
    await expect(
      CuentoPage({ params: params({ id: "33333333-3333-4333-8333-333333333333" }), searchParams: params({}) }),
    ).rejects.toThrow("NOT_FOUND");
  });
});
