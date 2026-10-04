-- Luppo · migración 0004 · cuentos interactivos (elegir, tocar y contar).
-- La aplica Ander (SQL Editor de Supabase o `supabase db push`). Claude Code no toca el Supabase real.
--
-- La 0001 ya tenía escenas.interaccion ('elegir', 'aprender') y la tabla decisiones. Aquí se añaden
-- los tipos «tocar» y «contar» y lo que faltaba para guardar la pregunta, la consecuencia de cada
-- opción y su voz. RLS no cambia: escenas y decisiones ya filtran por familia a través del cuento.

alter table public.escenas drop constraint escenas_interaccion_check;
alter table public.escenas
  add constraint escenas_interaccion_check
  check (interaccion in ('elegir', 'tocar', 'contar', 'aprender'));

-- Pregunta o instrucción que la voz lee después del texto y su audio; datos extra del tipo
-- (por ejemplo {"hasta": 5} en «contar»).
alter table public.escenas
  add column pregunta text,
  add column pregunta_audio_path text,
  add column interaccion_datos jsonb not null default '{}';

-- Frase que se lee tras responder, y cuándo eligió el niño esa opción (null = no la ha elegido).
-- En «tocar» y «contar» hay una única fila con la consecuencia.
alter table public.decisiones
  add column consecuencia text,
  add column elegida_at timestamptz;
