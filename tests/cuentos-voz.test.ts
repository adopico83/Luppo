// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { rutaAudio, subirAudioSiFalta, urlsFirmadas } from "@/lib/cuentos/audio";
import { configVoz, MODELO_VOZ_POR_DEFECTO } from "@/lib/cuentos/config";
import { duracionEstimadaMs, ErrorVoz, sintetizarVoz } from "@/lib/cuentos/voz";
import type { SupabaseClient } from "@supabase/supabase-js";

const config = { apiKey: "clave-de-prueba", voiceId: "voz/1", modelo: MODELO_VOZ_POR_DEFECTO };

describe("sintetizarVoz", () => {
  it("llama a la API REST de ElevenLabs con la clave en cabecera y devuelve el mp3", async () => {
    const mp3 = new Uint8Array([1, 2, 3, 4]);
    const fetchFn = vi.fn().mockResolvedValue(new Response(mp3, { status: 200 }));
    const audio = await sintetizarVoz("Había una vez", config, fetchFn as unknown as typeof fetch);
    expect([...audio]).toEqual([1, 2, 3, 4]);

    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe("https://api.elevenlabs.io/v1/text-to-speech/voz%2F1?output_format=mp3_44100_128");
    expect(init.method).toBe("POST");
    expect(init.headers["xi-api-key"]).toBe("clave-de-prueba");
    expect(JSON.parse(init.body)).toEqual({ text: "Había una vez", model_id: "eleven_multilingual_v2" });
  });

  it("falla con ErrorVoz si la API responde con error o con un audio vacío", async () => {
    const mal = vi.fn().mockResolvedValue(new Response("no", { status: 401 }));
    await expect(sintetizarVoz("x", config, mal as unknown as typeof fetch)).rejects.toMatchObject({
      name: "ErrorVoz",
      estado: 401,
    });
    const vacio = vi.fn().mockResolvedValue(new Response(new Uint8Array(), { status: 200 }));
    await expect(sintetizarVoz("x", config, vacio as unknown as typeof fetch)).rejects.toBeInstanceOf(ErrorVoz);
  });

  it("estima la duración a 128 kbps", () => {
    expect(duracionEstimadaMs(new Uint8Array(160_000))).toBe(10_000);
  });
});

describe("configuración de la voz", () => {
  it("solo está activa con clave y voz, y el modelo es configurable", () => {
    vi.unstubAllEnvs();
    vi.stubEnv("ELEVENLABS_API_KEY", "");
    vi.stubEnv("ELEVENLABS_VOICE_ID", "");
    expect(configVoz()).toBeNull();
    vi.stubEnv("ELEVENLABS_API_KEY", "k");
    vi.stubEnv("ELEVENLABS_VOICE_ID", "v");
    expect(configVoz()).toEqual({ apiKey: "k", voiceId: "v", modelo: "eleven_multilingual_v2" });
    vi.stubEnv("ELEVENLABS_MODEL", "eleven_flash_v2_5");
    expect(configVoz()?.modelo).toBe("eleven_flash_v2_5");
    vi.unstubAllEnvs();
  });
});

describe("almacenamiento privado", () => {
  const supabaseCon = (bucket: Record<string, unknown>) => {
    const from = vi.fn().mockReturnValue(bucket);
    return { client: { storage: { from } } as unknown as SupabaseClient, from };
  };

  it("la ruta es familia/perfil/cuento/escena.mp3", () => {
    expect(rutaAudio("f", "p", "c", "escena-1")).toBe("f/p/c/escena-1.mp3");
  });

  it("sube al bucket «cuentos» sin sobrescribir y no falla si ya existía", async () => {
    const upload = vi.fn().mockResolvedValueOnce({ error: null }).mockResolvedValueOnce({
      error: { message: "The resource already exists" },
    });
    const { client, from } = supabaseCon({ upload });
    const audio = new Uint8Array([1]);
    expect(await subirAudioSiFalta(client, "f/p/c/escena-1.mp3", audio)).toBe(true);
    expect(await subirAudioSiFalta(client, "f/p/c/escena-1.mp3", audio)).toBe(false);
    expect(from).toHaveBeenCalledWith("cuentos");
    expect(upload).toHaveBeenCalledWith("f/p/c/escena-1.mp3", audio, {
      contentType: "audio/mpeg",
      upsert: false,
    });
  });

  it("propaga otros errores de subida", async () => {
    const upload = vi.fn().mockResolvedValue({ error: { message: "boom" } });
    await expect(subirAudioSiFalta(supabaseCon({ upload }).client, "r", new Uint8Array([1]))).rejects.toThrow(/boom/);
  });

  it("firma las URLs en orden y deja null donde no hay audio", async () => {
    const createSignedUrls = vi.fn().mockResolvedValue({
      data: [
        { path: "a.mp3", signedUrl: "https://x/a?token=1" },
        { path: "b.mp3", signedUrl: "https://x/b?token=2" },
      ],
      error: null,
    });
    const { client } = supabaseCon({ createSignedUrls });
    expect(await urlsFirmadas(client, ["a.mp3", null, "b.mp3"])).toEqual([
      "https://x/a?token=1",
      null,
      "https://x/b?token=2",
    ]);
    expect(createSignedUrls).toHaveBeenCalledWith(["a.mp3", "b.mp3"], 3600);
    expect(await urlsFirmadas(client, [null, null])).toEqual([null, null]);
  });
});
