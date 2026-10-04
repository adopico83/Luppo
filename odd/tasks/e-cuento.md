# Feature: e-cuento (primer cuento real)

Branch: feat/e-cuento · PR contra main, sin mergear.
Objetivo: elección de personajes -> lugar -> /espera -> /cuento/[id] con texto (Claude Haiku) + voz (ElevenLabs), guardado en Supabase.
TDD: no configurado (checks funcionales). Runner: `npm test` (vitest). Checks: lint, typecheck, test, check:secretos.
Ruta: delegada (escritor único para backend+UI) por trigger de 2+ ficheros no triviales.
Heurística ~400 líneas/tarea: solo orientativa.

## Tareas
- [x] T1 Migración 0003 (idioma, coste en céntimos, rutas audio; RLS es_miembro) + test de migración. NO aplicar en remoto. (bce55c5)
- [x] T2 Generador de texto: zod, prompt por edad/idioma, cliente Anthropic (mockeable), tokens. (3785852)
- [x] T3 Voz ElevenLabs + Storage privado + URLs firmadas. (146d91a)
- [x] T4 Route handler/servicio: límite 10/día, coste en céntimos, guardado, cuento de ejemplo sin claves. (5d8b153)
- [x] T5 /espera conectada + /cuento/[id] (fondo del lugar, escenas, reproducir/pausar, gestos). (a9ecb47)
- [ ] T6 .env.example, i18n es/eu, tests con mocks, lint/tipos/tests/secretos, PR.
  - i18n es/eu hecho (a9ecb47); tests con mocks hechos; checks en verde.
  - PENDIENTE: .env.example (permiso denegado en este entorno: añadir ANTHROPIC_MODEL, ELEVENLABS_VOICE_ID, ELEVENLABS_MODEL; ANTHROPIC_API_KEY y ELEVENLABS_API_KEY ya estaban). PR lo abre Ander.

## Decisiones
- Un audio por escena (reproducción escena a escena; si una voz falla el resto sigue). Concurrencia 2.
- Voz opcional: sin claves de ElevenLabs el cuento se guarda solo con texto. Sin ANTHROPIC_API_KEY -> cuento de ejemplo (/cuento/ejemplo).
- Perfil: el primero de la familia; si no hay, se crea uno sin datos personales. Edad: fecha_nacimiento > rango_edad > 4.
- Coste en céntimos de dólar (tarifas en lib/cuentos/coste.ts), solo en logs y tabla.
- Límite: min(ajustes_familia.cuentos_max_dia, 10) por día UTC; los cuentos en error no cuentan.

## Evidencia
- 2026-10-04: `npm run lint` OK, `npm run typecheck` OK, `npm test` 20 ficheros / 190 tests OK, `npm run check:secretos` OK (por commit).
- vitest: hookTimeout 60 s porque PGlite en paralelo superaba 10 s con el fichero nuevo.
- Sin ejecutar: build de Next, llamadas reales a Anthropic/ElevenLabs/Supabase, migración en remoto.
