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
const registrarDecision = vi.fn<(id: string) => Promise<void>>(async () => {});
vi.mock("@/app/cuento/actions", () => ({ registrarDecision: (id: string) => registrarDecision(id) }));
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
    {
      texto: "Primera escena.",
      audioUrl: "https://storage.test/1.mp3?token=a",
      acciones: [{ personaje: "luna", posicion: "derecha", gesto: "saludo-pillo", accion: "entrar" }],
      interaccion: null,
    },
    { texto: "Segunda escena.", audioUrl: null, acciones: [], interaccion: null },
    { texto: "Última escena.", audioUrl: "https://storage.test/3.mp3?token=c", acciones: [], interaccion: null },
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
  play.mockReset();
  play.mockImplementation(function (this: HTMLMediaElement) {
    Object.defineProperty(this, "paused", { value: false, configurable: true });
    this.dispatchEvent(new Event("play"));
    return Promise.resolve();
  });
  pause.mockClear();
  notFound.mockClear();
  Object.defineProperty(HTMLMediaElement.prototype, "play", { value: play, configurable: true });
  Object.defineProperty(HTMLMediaElement.prototype, "pause", { value: pause, configurable: true });
});

const srcFondo = () =>
  decodeURIComponent(screen.getByTestId("fondo-lugar").querySelector("img")!.getAttribute("src")!);

describe("LectorCuento", () => {
  it("pone de fondo el lugar (nítido, a 100vw) con el fondo suave de Luppo encima", () => {
    render(<LectorCuento cuento={cuento} />);
    const lugar = screen.getByTestId("fondo-lugar");
    const imagen = lugar.querySelector("img")!;
    expect(srcFondo()).toContain("/lugares/playa.webp");
    expect(imagen.getAttribute("sizes")).toBe("100vw");
    expect(lugar.getAttribute("aria-hidden")).toBe("true");
    const fondo = screen.getByTestId("fondo-luppo");
    expect(lugar.compareDocumentPosition(fondo) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("pone a los personajes sobre el fondo, de cuerpo entero y sin marco, con su gesto", () => {
    render(<LectorCuento cuento={cuento} />);
    const lista = screen.getByRole("list", { name: "Personajes del cuento" });
    const imgs = Array.from(lista.querySelectorAll("img")) as HTMLImageElement[];
    expect(imgs.map((i) => i.getAttribute("src"))).toEqual(["/recortes/zumbillo.webp", "/recortes/luna.webp"]);
    expect(imgs.every((i) => i.className.includes("object-contain") && !i.className.includes("rounded"))).toBe(true);
    expect(imgs[0].className).toContain("gesto-revoloteo"); // Zumbillo: su gesto propio
    expect(imgs[1].className).toContain("gesto-saludo-pillo"); // Luna: el que pide la escena
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(screen.getByRole("list", { name: "Personajes del cuento" }).querySelectorAll("img")).toHaveLength(2);
  });

  it("aplica la posición y la acción de la escena; sin acción no hay movimiento", () => {
    render(<LectorCuento cuento={cuento} />);
    const luna = screen.getByTestId("personaje-luna");
    expect(luna.style.left).toBe("80%");
    expect(luna.style.getPropertyValue("--lado")).toBe("1");
    expect(luna.querySelector(".mover-entrar")).not.toBeNull();
    expect(screen.getByTestId("personaje-zumbillo").querySelector("[class*=mover-]")).toBeNull();
  });

  it("en el patinete avanza un personaje por el camino", () => {
    render(<LectorCuento cuento={{ ...cuento, lugar: "patinete" }} />);
    expect(screen.getByTestId("personaje-zumbillo").querySelector(".mover-patinete")).not.toBeNull();
    expect(screen.getByTestId("personaje-luna").querySelector(".mover-patinete")).toBeNull();
  });

  it("el texto va en una franja pequeña: 17 px en móvil y text-xl en pantalla ancha", () => {
    render(<LectorCuento cuento={cuento} />);
    const texto = screen.getByText("Primera escena.");
    expect(texto.className).toContain("text-[17px]");
    expect(texto.className).toContain("ancho:text-xl");
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

  it("la voz suena sola al entrar en la escena; sin audio no hay botón de voz", () => {
    const { container } = render(<LectorCuento cuento={cuento} />);
    expect(container.querySelector("audio")?.getAttribute("src")).toBe("https://storage.test/1.mp3?token=a");
    expect(play).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Pausar" }).getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(container.querySelector("audio")).toBeNull();
    expect(screen.queryByRole("button", { name: "Repetir voz" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Pausar" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(play).toHaveBeenCalledTimes(2); // la tercera escena también arranca sola
  });

  it("si el navegador bloquea el autoplay, suena con el primer toque", async () => {
    play.mockImplementationOnce(() => Promise.reject(new DOMException("bloqueado", "NotAllowedError")));
    render(<LectorCuento cuento={cuento} />);
    await act(async () => {});
    expect(play).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Repetir voz" })).toBeTruthy();

    await act(async () => void fireEvent.pointerDown(window));
    expect(play).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("button", { name: "Pausar" })).toBeTruthy();
  });

  it("se puede pausar y repetir la voz desde el principio", () => {
    const { container } = render(<LectorCuento cuento={cuento} />);
    fireEvent.click(screen.getByRole("button", { name: "Pausar" }));
    expect(pause).toHaveBeenCalled();
    container.querySelector("audio")!.currentTime = 5;
    fireEvent.click(screen.getByRole("button", { name: "Repetir voz" }));
    expect(container.querySelector("audio")!.currentTime).toBe(0);
    expect(play).toHaveBeenCalledTimes(2);
  });

  it("al pasar de escena se para la voz", () => {
    render(<LectorCuento cuento={cuento} />);
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(pause).toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Pausar" })).toBeNull();
  });

  it("al terminar la voz «Siguiente» se resalta, y al repetirla deja de estarlo", () => {
    const { container } = render(<LectorCuento cuento={cuento} />);
    const siguiente = () => screen.getByRole("button", { name: "Siguiente" });
    expect(siguiente().getAttribute("data-resaltado")).toBe("false");
    act(() => void container.querySelector("audio")!.dispatchEvent(new Event("ended")));
    expect(siguiente().getAttribute("data-resaltado")).toBe("true");
    expect(siguiente().className).toContain("ring-8");
    fireEvent.click(screen.getByRole("button", { name: "Repetir voz" }));
    expect(siguiente().getAttribute("data-resaltado")).toBe("false");
  });

  it("los textos salen en euskera con la familia en euskera y no hay ni rastro de costes", () => {
    const { container } = render(
      <I18nProvider idioma="eu">
        <LectorCuento cuento={cuento} />
      </I18nProvider>,
    );
    expect(screen.getByRole("button", { name: t("cuento.siguiente", "eu") })).toBeTruthy();
    expect(screen.getByRole("button", { name: t("cuento.pausar", "eu") })).toBeTruthy();
    expect(screen.getByText(t("cuento.escena", "eu", { n: 1, total: 3 }))).toBeTruthy();
    expect(container.textContent).not.toMatch(/céntim|coste|token|USD|€|\$/i);
  });
});

describe("escenas interactivas", () => {
  const opcion = (id: string, texto: string, icono: string, consecuencia: string, audioUrl: string | null = null) => ({
    id, texto, icono, consecuencia, audioUrl,
  });
  const interactivo = (interaccion: NonNullable<CuentoLectura["escenas"][number]["interaccion"]>): CuentoLectura => ({
    ...cuento,
    personajes: [
      { clave: "zumbillo", nombre: "Zumbillo" },
      { clave: "luppo", nombre: "Luppo" },
    ],
    escenas: [
      { texto: "Empieza el partido.", audioUrl: null, acciones: [], interaccion: null },
      { texto: "El balón rueda.", audioUrl: "https://storage.test/2.mp3", acciones: [], interaccion },
      { texto: "Fin del partido.", audioUrl: null, acciones: [], interaccion: null },
    ],
  });
  const elegir = interactivo({
    tipo: "elegir",
    pregunta: "¿Chutamos o pasamos?",
    preguntaAudioUrl: "https://storage.test/2-pregunta.mp3",
    hasta: null,
    opciones: [
      opcion("d1", "Chutar", "⚽", "¡Gooool!", "https://storage.test/2-op1.mp3"),
      opcion("d2", "Pasar", "🤝", "¡Buen pase!"),
    ],
  });
  const llegarALaEscena2 = () => fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));

  beforeEach(() => registrarDecision.mockClear());

  it("se para en la pregunta: botones grandes con emoji y sin «Siguiente» hasta responder", () => {
    render(<LectorCuento cuento={elegir} />);
    llegarALaEscena2();
    expect(screen.getByText("El balón rueda.")).toBeTruthy();
    expect(screen.getByTestId("pregunta").textContent).toBe("¿Chutamos o pasamos?");
    expect(screen.queryByRole("button", { name: "Siguiente" })).toBeNull();
    const chutar = screen.getByRole("button", { name: "Chutar" });
    expect(chutar.className).toContain("min-h-[150px]");
    expect(chutar.textContent).toContain("⚽");
    expect(screen.getByRole("button", { name: "Pasar" })).toBeTruthy();
    expect(screen.queryByTestId("celebracion")).toBeNull();
  });

  it("la voz lee el texto y luego la pregunta, y se para sin avanzar", () => {
    const { container } = render(<LectorCuento cuento={elegir} />);
    llegarALaEscena2();
    const audio = () => container.querySelector("audio")!;
    expect(audio().getAttribute("src")).toBe("https://storage.test/2.mp3");
    act(() => void audio().dispatchEvent(new Event("ended")));
    expect(audio().getAttribute("src")).toBe("https://storage.test/2-pregunta.mp3");
    expect(play).toHaveBeenCalledTimes(2);
    act(() => void audio().dispatchEvent(new Event("ended")));
    expect(screen.getByTestId("pregunta").textContent).toBe("¿Chutamos o pasamos?");
    expect(screen.queryByRole("button", { name: "Siguiente" })).toBeNull();
    expect(screen.getByRole("button", { name: "Chutar" }).className).toContain("ring-8");
  });

  it("al elegir se lee la consecuencia, Luppo celebra, se guarda la decisión y se puede continuar", () => {
    const { container } = render(<LectorCuento cuento={elegir} />);
    llegarALaEscena2();
    fireEvent.click(screen.getByRole("button", { name: "Chutar" }));
    expect(registrarDecision).toHaveBeenCalledWith("d1");
    expect(screen.getByTestId("pregunta").textContent).toBe("¡Gooool!");
    expect(container.querySelector("audio")!.getAttribute("src")).toBe("https://storage.test/2-op1.mp3");
    expect(screen.getByTestId("celebracion")).toBeTruthy();
    expect(screen.getByTestId("personaje-luppo").querySelector(".mover-saltar")).not.toBeNull();
    expect(screen.getByTestId("personaje-zumbillo").querySelector("[class*=mover-]")).toBeNull();
    expect(screen.queryByRole("button", { name: "Chutar" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(screen.getByText("Fin del partido.")).toBeTruthy();
    expect(screen.queryByTestId("celebracion")).toBeNull();
  });

  it("una consecuencia sin voz deja continuar enseguida", () => {
    render(<LectorCuento cuento={elegir} />);
    llegarALaEscena2();
    fireEvent.click(screen.getByRole("button", { name: "Pasar" }));
    expect(screen.getByTestId("pregunta").textContent).toBe("¡Buen pase!");
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeTruthy();
  });

  it("tocar: un solo botón grande con el elemento; contar: un botón para avanzar", () => {
    const { unmount } = render(
      <LectorCuento
        cuento={interactivo({
          tipo: "tocar", pregunta: "¡Toca el balón para chutar!", preguntaAudioUrl: null, hasta: null,
          opciones: [opcion("t1", "¡Toca el balón para chutar!", "⚽", "¡Golazo!")],
        })}
      />,
    );
    llegarALaEscena2();
    fireEvent.click(screen.getByRole("button", { name: "¡Toca el balón para chutar!" }));
    expect(registrarDecision).toHaveBeenCalledWith("t1");
    expect(screen.getByTestId("pregunta").textContent).toBe("¡Golazo!");
    unmount();

    render(
      <LectorCuento
        cuento={interactivo({
          tipo: "contar", pregunta: "Contemos hasta 5", preguntaAudioUrl: null, hasta: 5,
          opciones: [opcion("c1", "5", "🔢", "¡Cinco!")],
        })}
      />,
    );
    llegarALaEscena2();
    expect(screen.queryByRole("button", { name: "Siguiente" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Contemos hasta 5" }));
    expect(screen.getByTestId("pregunta").textContent).toBe("¡Cinco!");
  });
});

describe("cargar el cuento guardado", () => {
  const ID = "11111111-1111-4111-8111-111111111111";
  const datos = () =>
    crearSupabaseFalso({
      cuentos: [{ id: ID, titulo: "El panal", lugar_clave: "bosque", estado: "listo", protagonistas: ["m2", "m1"] }],
      escenas: [
        { cuento_id: ID, orden: 2, texto: "Dos", audio_path: null },
        {
          cuento_id: ID,
          orden: 1,
          texto: "Uno",
          audio_path: "f/p/c/escena-1.mp3",
          acciones: [
            { personaje: "zumbillo", posicion: "centro", gesto: "revoloteo" },
            { personaje: "luna", posicion: "arriba", gesto: "volar" }, // inválida: se descarta
          ],
        },
      ],
      munecos: [
        { id: "m1", clave: "zumbillo", nombre: "Zumbillo" },
        { id: "m2", clave: "luna", nombre: "Luna" },
      ],
    });

  it("devuelve escenas en orden, personajes en el orden elegido, URLs firmadas y la puesta en escena válida", async () => {
    const r = await cargarCuento(datos().client, ID);
    expect(r).toEqual({
      titulo: "El panal",
      lugar: "bosque",
      personajes: [
        { clave: "luna", nombre: "Luna" },
        { clave: "zumbillo", nombre: "Zumbillo" },
      ],
      escenas: [
        {
          texto: "Uno",
          audioUrl: "https://storage.test/f/p/c/escena-1.mp3?token=firmado",
          acciones: [{ personaje: "zumbillo", posicion: "centro", gesto: "revoloteo" }],
          interaccion: null,
        },
        { texto: "Dos", audioUrl: null, acciones: [], interaccion: null },
      ],
    });
  });

  it("carga las interacciones con sus opciones, sus voces firmadas y el número a contar", async () => {
    const { client, base } = datos();
    base.tablas.escenas[0] = {
      id: "e2", cuento_id: ID, orden: 2, texto: "Dos", audio_path: "f/p/c/escena-2.mp3",
      interaccion: "elegir", pregunta: "¿Chutamos o pasamos?", pregunta_audio_path: "f/p/c/escena-2-pregunta.mp3", interaccion_datos: {},
    };
    base.tablas.decisiones = [
      { id: "d2", escena_id: "e2", orden: 2, etiqueta: "Pasar", icono_clave: "🤝", consecuencia: "¡Buen pase!", audio_path: null },
      { id: "d1", escena_id: "e2", orden: 1, etiqueta: "Chutar", icono_clave: "⚽", consecuencia: "¡Gooool!", audio_path: "f/p/c/escena-2-opcion-1.mp3" },
    ];
    const r = await cargarCuento(client, ID);
    expect(r!.escenas[1].interaccion).toEqual({
      tipo: "elegir",
      pregunta: "¿Chutamos o pasamos?",
      preguntaAudioUrl: "https://storage.test/f/p/c/escena-2-pregunta.mp3?token=firmado",
      hasta: null,
      opciones: [
        { id: "d1", texto: "Chutar", icono: "⚽", consecuencia: "¡Gooool!", audioUrl: "https://storage.test/f/p/c/escena-2-opcion-1.mp3?token=firmado" },
        { id: "d2", texto: "Pasar", icono: "🤝", consecuencia: "¡Buen pase!", audioUrl: null },
      ],
    });
    base.tablas.escenas[0].interaccion = "contar";
    base.tablas.escenas[0].interaccion_datos = { hasta: 5 };
    expect((await cargarCuento(client, ID))!.escenas[1].interaccion?.hasta).toBe(5);
  });

  it("una interacción sin opciones se lee como narración normal", async () => {
    const { client, base } = datos();
    Object.assign(base.tablas.escenas[0], { id: "e2", interaccion: "tocar", pregunta: "¡Toca!" });
    expect((await cargarCuento(client, ID))!.escenas[1].interaccion).toBeNull();
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
    expect(eu.escenas.every((e) => e.audioUrl === null && e.acciones.length === 0)).toBe(true);
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
    expect(srcFondo()).toContain("castillo.webp");
  });

  it("el ejemplo sin parámetros válidos cae a Luppo en el bosque", async () => {
    render(await CuentoPage({ params: params({ id: "ejemplo" }), searchParams: params({ lugar: "volcan" }) }));
    expect(srcFondo()).toContain("bosque.webp");
  });

  it("un id desconocido da 404", async () => {
    await expect(
      CuentoPage({ params: params({ id: "33333333-3333-4333-8333-333333333333" }), searchParams: params({}) }),
    ).rejects.toThrow("NOT_FOUND");
  });
});
