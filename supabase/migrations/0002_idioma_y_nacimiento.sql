-- Luppo · migración 0002 · idioma de la familia y fecha de nacimiento del niño.
-- La aplica Ander (SQL Editor de Supabase o `supabase db push`). Claude Code no toca el Supabase real.

-- Idioma de la app para toda la familia. Por ahora solo hay castellano; euskera está preparado
-- (lib/i18n). Los padres podrán cambiarlo cuando haya selector (de momento solo lo lee la app).
alter table public.familias
  add column idioma text not null default 'es' check (idioma in ('es', 'eu'));
grant update (idioma) on public.familias to authenticated;

-- Fecha de nacimiento del niño: sirve para calcular su edad y adaptar los cuentos (lib/edad.ts).
-- Es un dato personal como el nombre, así que sin el consentimiento explícito de los padres
-- tampoco se guarda. Convive con rango_edad, que sigue siendo válido.
alter table public.perfiles_hijo
  add column fecha_nacimiento date,
  add constraint perfiles_hijo_nacimiento_con_consentimiento
    check (fecha_nacimiento is null or consentimiento_padres_at is not null);
