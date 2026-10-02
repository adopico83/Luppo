-- Luppo · migración 0001 · modelo de datos de la fase 1 (Arquitectura v1, sección 4)
-- La aplica Ander (SQL Editor de Supabase o `supabase db push`). Claude Code no toca el Supabase real.
--
-- Idea central: los datos son de una FAMILIA, no de un usuario. Un padre (usuario de Supabase Auth)
-- ve una fila solo si es miembro de su familia (función es_miembro). RLS = reglas dentro de la
-- base de datos que filtran las filas según quién hace la consulta.

-- ============================================================================
-- 1. Tablas
-- ============================================================================

create table public.familias (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  nombre text not null,
  creada_por uuid references auth.users (id) on delete set null default auth.uid(),
  plan text not null default 'beta'
    check (plan in ('beta', 'prueba', 'luppo', 'luppo_plus', 'caducado')),
  plan_hasta timestamptz,
  stripe_customer_id text
);

create table public.miembros_familia (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  familia_id uuid not null references public.familias (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  rol text not null default 'padre' check (rol in ('padre')),
  unique (familia_id, user_id)
);

create table public.invitaciones_familia (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  familia_id uuid not null references public.familias (id) on delete cascade,
  email text not null,
  token_hash text not null unique, -- sha256 en hexadecimal; el token en claro solo viaja en el enlace
  invitado_por uuid references auth.users (id) on delete set null default auth.uid(),
  caduca_at timestamptz not null default now() + interval '7 days',
  aceptada_at timestamptz
);

create table public.ajustes_familia (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  familia_id uuid not null unique references public.familias (id) on delete cascade,
  pin_hash text, -- HMAC del PIN con PIN_PEPPER; nunca el PIN en claro
  aprobaciones_pendientes int not null default 5 check (aprobaciones_pendientes >= 0),
  aprobacion_obligatoria boolean not null default false,
  minutos_max_sesion int not null default 15 check (minutos_max_sesion > 0),
  cuentos_max_dia int not null default 3 check (cuentos_max_dia > 0)
);

create table public.uso_mensual (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  familia_id uuid not null references public.familias (id) on delete cascade,
  mes date not null check (extract(day from mes) = 1),
  cuentos_generados int not null default 0 check (cuentos_generados >= 0),
  coste_usd numeric(10, 4) not null default 0 check (coste_usd >= 0),
  unique (familia_id, mes)
);

create table public.perfiles_hijo (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  familia_id uuid not null references public.familias (id) on delete cascade,
  avatar_clave text not null, -- dibujo del catálogo, nunca una foto
  nombre text,                -- admite el nombre real; nunca apellidos
  consentimiento_padres_at timestamptz,
  rango_edad text check (rango_edad ~ '^[3-6]-[3-6]$'),
  temas_favoritos text[] not null default '{}',
  unique (id, familia_id),
  -- Sin consentimiento explícito de los padres no se guarda el nombre.
  check (nombre is null or consentimiento_padres_at is not null)
);

create table public.munecos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  familia_id uuid references public.familias (id) on delete cascade, -- null = muñeco del sistema
  clave text not null,
  nombre text not null,
  especie text,
  personalidad text,
  forma_de_hablar text,
  voz_tts text,
  imagen_path text,
  rive_archivo text, -- null = se anima con Motion
  lugares_favoritos text[] not null default '{}',
  capas jsonb, -- F2
  es_sistema boolean not null default false,
  activo boolean not null default true,
  check (es_sistema = (familia_id is null))
);
create unique index munecos_clave_sistema_uq on public.munecos (clave) where familia_id is null;
create unique index munecos_clave_familia_uq on public.munecos (familia_id, clave) where familia_id is not null;

create table public.cuentos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  familia_id uuid not null references public.familias (id) on delete cascade,
  perfil_id uuid not null,
  creado_por uuid references auth.users (id) on delete set null default auth.uid(),
  aprobado_por uuid references auth.users (id) on delete set null,
  titulo text,
  protagonistas uuid[] not null check (cardinality(protagonistas) between 1 and 3),
  lugar_clave text not null,
  tema_educativo text,
  estado text not null default 'generando'
    check (estado in ('generando', 'revisando', 'pendiente_aprobacion', 'listo', 'rechazado', 'error')),
  json_original jsonb,
  modelo text,
  version_prompt text,
  portada_path text,
  tokens_entrada int not null default 0,
  tokens_salida int not null default 0,
  caracteres_tts int not null default 0,
  coste_estimado_usd numeric(10, 4) not null default 0,
  aprobado_at timestamptz,
  guardado boolean not null default false,
  -- El perfil tiene que ser de la misma familia que el cuento.
  foreign key (perfil_id, familia_id) references public.perfiles_hijo (id, familia_id) on delete cascade
);

create table public.escenas (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  cuento_id uuid not null references public.cuentos (id) on delete cascade,
  clave text not null,
  orden int not null,
  tipo text not null check (tipo in ('narracion', 'decision', 'rama', 'final')),
  interaccion text check (interaccion in ('elegir', 'aprender')),
  habla text not null default 'narrador', -- 'narrador' o clave de muñeco
  texto text not null,
  acciones jsonb not null default '[]',
  secundarios jsonb not null default '[]',
  fondo_clave text,
  siguiente_clave text,
  opcion_por_defecto text,
  audio_path text,
  audio_ms int,
  unique (cuento_id, clave),
  check (interaccion is null or tipo = 'decision')
);

create table public.decisiones (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  escena_id uuid not null references public.escenas (id) on delete cascade,
  orden int not null,
  etiqueta text not null,
  icono_clave text not null,
  destino_clave text not null,
  es_correcta boolean, -- solo en las de tipo aprender
  audio_path text
);

create table public.canciones (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  muneco_id uuid not null references public.munecos (id) on delete cascade,
  cuento_id uuid references public.cuentos (id) on delete cascade, -- null = canción base
  tipo text not null
    check (tipo in ('instrumental_base', 'estribillo_cantado', 'estrofa_hablada', 'cancion_cuento')),
  letra text,
  audio_path text,
  proveedor text,
  duracion_s numeric(7, 2),
  coste_usd numeric(10, 4) not null default 0
);

create table public.secundarios (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  clave text not null unique,
  nombre text not null,
  descripcion text,
  lugares text[] not null default '{}',
  imagen_path text,
  rive_archivo text,
  acciones_disponibles text[] not null default '{quieto}',
  es_comodin boolean not null default false,
  activo boolean not null default true
);
-- Solo puede haber un comodín.
create unique index secundarios_un_comodin_uq on public.secundarios (es_comodin) where es_comodin;

create table public.secundarios_pedidos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  familia_id uuid not null references public.familias (id) on delete cascade,
  cuento_id uuid references public.cuentos (id) on delete set null,
  clave_pedida text not null,
  descripcion text,
  veces int not null default 1,
  primer_pedido_at timestamptz not null default now(),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'dibujado', 'descartado'))
);

create index on public.miembros_familia (user_id);
create index on public.perfiles_hijo (familia_id);
create index on public.cuentos (familia_id, perfil_id, guardado);
create index on public.escenas (cuento_id, orden);
create index on public.decisiones (escena_id, orden);
create index on public.secundarios_pedidos (familia_id);

-- ============================================================================
-- 2. Funciones
-- ============================================================================

-- ¿El usuario que consulta es padre/madre de esta familia?
-- SECURITY DEFINER: se ejecuta con los permisos del dueño de la función, así puede leer
-- miembros_familia sin que su propia regla RLS la haga entrar en bucle.
create function public.es_miembro(fid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.miembros_familia m
    where m.familia_id = fid and m.user_id = auth.uid()
  );
$$;

-- Crea una familia con el usuario actual como primer miembro y sus ajustes por defecto.
-- Es la única forma de crear una familia: nadie puede insertar a mano en familias ni miembros.
create function public.crear_familia(p_nombre text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_familia uuid;
begin
  if auth.uid() is null then
    raise exception 'Hace falta iniciar sesión' using errcode = '28000';
  end if;
  if p_nombre is null or length(trim(p_nombre)) = 0 then
    raise exception 'La familia necesita un nombre' using errcode = '22023';
  end if;

  insert into public.familias (nombre, creada_por) values (trim(p_nombre), auth.uid())
    returning id into v_familia;
  insert into public.miembros_familia (familia_id, user_id) values (v_familia, auth.uid());
  insert into public.ajustes_familia (familia_id) values (v_familia);
  return v_familia;
end;
$$;

-- Acepta una invitación: p_token es el token en claro del enlace; en la base solo hay su hash.
-- Comprueba que no ha caducado, que no está usada y que el email de la invitación es el del usuario.
create function public.aceptar_invitacion(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv public.invitaciones_familia;
  v_email text;
begin
  if auth.uid() is null then
    raise exception 'Hace falta iniciar sesión' using errcode = '28000';
  end if;

  select * into v_inv
  from public.invitaciones_familia
  where token_hash = encode(sha256(convert_to(coalesce(p_token, ''), 'UTF8')), 'hex')
  for update;

  if not found or v_inv.aceptada_at is not null or v_inv.caduca_at <= now() then
    raise exception 'Invitación no válida o caducada' using errcode = '22023';
  end if;

  select lower(u.email) into v_email from auth.users u where u.id = auth.uid();
  if v_email is null or v_email <> lower(v_inv.email) then
    raise exception 'Esta invitación es para otro email' using errcode = '42501';
  end if;

  insert into public.miembros_familia (familia_id, user_id)
    values (v_inv.familia_id, auth.uid())
    on conflict (familia_id, user_id) do nothing;
  update public.invitaciones_familia set aceptada_at = now() where id = v_inv.id;
  return v_inv.familia_id;
end;
$$;

-- ============================================================================
-- 3. Permisos (grants) y RLS
-- ============================================================================
-- Dos candados: (1) grants = qué operaciones puede intentar cada rol; (2) RLS = qué filas.

revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;
grant usage on schema public to authenticated;
grant execute on function public.es_miembro(uuid) to authenticated;
grant execute on function public.crear_familia(text) to authenticated;
grant execute on function public.aceptar_invitacion(text) to authenticated;

alter table public.familias enable row level security;
alter table public.miembros_familia enable row level security;
alter table public.invitaciones_familia enable row level security;
alter table public.ajustes_familia enable row level security;
alter table public.uso_mensual enable row level security;
alter table public.perfiles_hijo enable row level security;
alter table public.munecos enable row level security;
alter table public.cuentos enable row level security;
alter table public.escenas enable row level security;
alter table public.decisiones enable row level security;
alter table public.canciones enable row level security;
alter table public.secundarios enable row level security;
alter table public.secundarios_pedidos enable row level security;

-- familias: solo el nombre se puede cambiar desde la app. El plan lo toca únicamente el servidor
-- (migraciones o, más adelante, el webhook de cobro): si no, un padre se subiría de plan solo.
grant select on public.familias to authenticated;
grant update (nombre) on public.familias to authenticated;
create policy familias_select on public.familias for select to authenticated
  using (public.es_miembro(id));
create policy familias_update on public.familias for update to authenticated
  using (public.es_miembro(id)) with check (public.es_miembro(id));

-- miembros_familia: cada padre ve a los miembros de sus familias. Nadie inserta a mano.
grant select on public.miembros_familia to authenticated;
create policy miembros_select on public.miembros_familia for select to authenticated
  using (public.es_miembro(familia_id));

-- invitaciones_familia: los miembros las gestionan (la cookie de padres se exige en la ruta de API).
-- El invitado NO las lee: acepta con aceptar_invitacion(token).
grant select, insert, update, delete on public.invitaciones_familia to authenticated;
create policy invitaciones_all on public.invitaciones_familia for all to authenticated
  using (public.es_miembro(familia_id))
  with check (public.es_miembro(familia_id) and invitado_por = auth.uid());

-- ajustes_familia: la fila se crea con la familia; luego solo se lee y se cambia.
grant select, update on public.ajustes_familia to authenticated;
create policy ajustes_select on public.ajustes_familia for select to authenticated
  using (public.es_miembro(familia_id));
create policy ajustes_update on public.ajustes_familia for update to authenticated
  using (public.es_miembro(familia_id)) with check (public.es_miembro(familia_id));

grant select, insert, update, delete on public.uso_mensual to authenticated;
create policy uso_mensual_all on public.uso_mensual for all to authenticated
  using (public.es_miembro(familia_id)) with check (public.es_miembro(familia_id));

grant select, insert, update, delete on public.perfiles_hijo to authenticated;
create policy perfiles_all on public.perfiles_hijo for all to authenticated
  using (public.es_miembro(familia_id)) with check (public.es_miembro(familia_id));

-- munecos: los del sistema los lee cualquier padre; los de la familia, solo su familia.
grant select, insert, update, delete on public.munecos to authenticated;
create policy munecos_select on public.munecos for select to authenticated
  using (es_sistema or public.es_miembro(familia_id));
create policy munecos_insert on public.munecos for insert to authenticated
  with check (not es_sistema and public.es_miembro(familia_id));
create policy munecos_update on public.munecos for update to authenticated
  using (not es_sistema and public.es_miembro(familia_id))
  with check (not es_sistema and public.es_miembro(familia_id));
create policy munecos_delete on public.munecos for delete to authenticated
  using (not es_sistema and public.es_miembro(familia_id));

grant select, insert, update, delete on public.cuentos to authenticated;
create policy cuentos_all on public.cuentos for all to authenticated
  using (public.es_miembro(familia_id)) with check (public.es_miembro(familia_id));

-- escenas y decisiones no llevan familia_id: se comprueba a través del cuento.
grant select, insert, update, delete on public.escenas to authenticated;
create policy escenas_all on public.escenas for all to authenticated
  using (exists (select 1 from public.cuentos c where c.id = cuento_id and public.es_miembro(c.familia_id)))
  with check (exists (select 1 from public.cuentos c where c.id = cuento_id and public.es_miembro(c.familia_id)));

grant select, insert, update, delete on public.decisiones to authenticated;
create policy decisiones_all on public.decisiones for all to authenticated
  using (exists (
    select 1 from public.escenas e join public.cuentos c on c.id = e.cuento_id
    where e.id = escena_id and public.es_miembro(c.familia_id)))
  with check (exists (
    select 1 from public.escenas e join public.cuentos c on c.id = e.cuento_id
    where e.id = escena_id and public.es_miembro(c.familia_id)));

-- canciones: las base (sin cuento) son del sistema y las lee cualquier padre; las de un cuento,
-- solo su familia. En F1 solo se lee; se escribe con migraciones.
grant select on public.canciones to authenticated;
create policy canciones_select on public.canciones for select to authenticated
  using (cuento_id is null or exists (
    select 1 from public.cuentos c where c.id = cuento_id and public.es_miembro(c.familia_id)));

-- secundarios: catálogo del sistema, solo lectura (se escribe con migraciones).
grant select on public.secundarios to authenticated;
create policy secundarios_select on public.secundarios for select to authenticated
  using (true);

grant select, insert, update, delete on public.secundarios_pedidos to authenticated;
create policy secundarios_pedidos_all on public.secundarios_pedidos for all to authenticated
  using (public.es_miembro(familia_id)) with check (public.es_miembro(familia_id));

-- ============================================================================
-- 4. Storage: bucket privado «cuentos», rutas familia_id/perfil_id/cuento_id/escena.mp3
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('cuentos', 'cuentos', false)
on conflict (id) do nothing;

-- Se compara como texto para que una ruta mal formada no provoque un error de cast a uuid.
create policy cuentos_storage_all on storage.objects for all to authenticated
  using (
    bucket_id = 'cuentos' and exists (
      select 1 from public.miembros_familia m
      where m.user_id = auth.uid() and m.familia_id::text = (storage.foldername(name))[1])
  )
  with check (
    bucket_id = 'cuentos' and exists (
      select 1 from public.miembros_familia m
      where m.user_id = auth.uid() and m.familia_id::text = (storage.foldername(name))[1])
  );
