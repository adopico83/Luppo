-- Luppo · migración 0003 · cuentos generados con IA (texto de Claude + voz de ElevenLabs).
-- La aplica Ander (SQL Editor de Supabase o `supabase db push`). Claude Code no toca el Supabase real.
--
-- Casi todo lo necesario ya existe desde la 0001: cuentos (tokens, caracteres_tts, coste_estimado_usd,
-- modelo, version_prompt, json_original), escenas (texto, audio_path, audio_ms) y el bucket privado
-- «cuentos» con su política. Aquí solo se añade lo que faltaba. RLS no cambia: cuentos y escenas
-- ya filtran con es_miembro y los permisos de tabla cubren las columnas nuevas.

-- Idioma en el que se escribió el cuento (el de la familia en ese momento), la edad con la que se
-- adaptó y el coste estimado en céntimos de dólar (las tarifas están en USD; ver lib/cuentos/coste.ts).
-- Solo lo ven los padres: nunca se enseña al niño. coste_estimado_usd (0001) se rellena a la vez.
alter table public.cuentos
  add column idioma text not null default 'es' check (idioma in ('es', 'eu')),
  add column edad_objetivo int check (edad_objetivo between 0 and 12),
  add column modelo_tts text,
  add column coste_estimado_centimos numeric(10, 2) not null default 0
    check (coste_estimado_centimos >= 0);

-- El límite diario cuenta los cuentos de hoy por familia: este índice lo hace barato.
create index cuentos_familia_creado_idx on public.cuentos (familia_id, created_at);

-- Una escena por posición dentro de cada cuento.
create unique index escenas_cuento_orden_uq on public.escenas (cuento_id, orden);

-- Límite por defecto: 10 cuentos al día por familia (antes 3). Se actualizan las familias que
-- nunca tocaron el valor; no hay pantalla de ajustes que lo haya podido cambiar todavía.
alter table public.ajustes_familia alter column cuentos_max_dia set default 10;
update public.ajustes_familia set cuentos_max_dia = 10 where cuentos_max_dia = 3;
