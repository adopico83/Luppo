-- Luppo · semilla de la fase 1. Se puede ejecutar varias veces: actualiza lo que ya existe y no duplica.
-- La aplica Ander después de la migración 0001. Sin datos reales de ningún niño.
-- Fuente: docs/munecos.md (copia de la página «Muñecos» de Notion).
--
-- Importante: nombre, especie e imagen salen de los dibujos vigentes. Personalidad, forma de
-- hablar y lugares favoritos son PROPUESTAS que <padre> debe revisar (docs/munecos.md).
-- Las claves de lugar tienen que coincidir con el catálogo real (lib/catalogo/lugares.ts, aún por
-- crear); cuando exista, hay que quitar de aquí las que no estén en él.
-- voz_tts, rive_archivo y capas quedan en null: la voz sale de TTS_VOZ_MUNECO_POR_DEFECTO
-- y se anima con Motion hasta que haya archivos .riv.

-- ---------------------------------------------------------------------------
-- Muñecos del sistema (familia_id = null): Luppo + los 16 personajes elegibles
-- ---------------------------------------------------------------------------
insert into public.munecos
  (clave, nombre, especie, personalidad, forma_de_hablar, imagen_path, lugares_favoritos, es_sistema)
values
  -- Luppo: mascota y anfitrión, no forma parte de los 16. Ficha propia en Notion.
  ('luppo', 'Luppo', 'lince', null, null, 'munecos/luppo.jpg', '{}', true),

  ('dragoncito', 'Dragoncito', 'dragón',
   'Aventurero y valiente, con mucha energía; siempre quiere ver qué hay detrás de la siguiente colina.',
   'Entusiasta, con exclamaciones («¡Vamos, vamos!»). Cuando se emociona suelta una chispita (nunca fuego que queme).',
   'munecos/dragoncito.jpg', '{montana,bosque,castillo}', true),

  ('zorrito', 'Zorrito', 'zorro',
   'Curioso y listo, le encanta orientarse y resolver pistas.',
   '«¡Según mi mapa…!», hace preguntas para pensar juntos.',
   'munecos/zorrito.jpg', '{bosque,prado,parque}', true),

  ('caracol', 'Caracol', 'caracol',
   'Tranquilo, paciente y sabio; enseña que despacito también se llega.',
   'Pausada, alarga las palabras («Pooocooo a pooocooo»).',
   'munecos/caracol.jpg', '{jardin,huerto,prado}', true),

  ('nubecita', 'Nubecita', 'nube',
   'Alegre y algo despistada; cuando se emociona llueven unas gotitas.',
   'Suave, con onomatopeyas de lluvia («plic, plic»).',
   'munecos/nubecita.jpg', '{cielo,prado,playa}', true),

  ('robotito', 'Robotito', 'robot',
   'Amable y ordenado, le gusta contar y arreglar cosas.',
   'Frases cortas con sonidos de robot («¡Bip-bup! Cuento: uno, dos, tres»).',
   'munecos/robotito.jpg', '{taller,ciudad,parque}', true),

  ('seta', 'Seta', 'seta (criatura del bosque)',
   'Tímida y dulce, conoce todos los rincones del bosque.',
   'Bajito, como en secreto («Shh, mira…»).',
   'munecos/seta.jpg', '{bosque,jardin}', true),

  ('estrella', 'Estrella', 'estrella',
   'Valiente y animadora, siempre dispuesta a ayudar.',
   '«¡Al rescate!», anima a los demás («¡Tú puedes!»).',
   'munecos/estrella.jpg', '{cielo,parque}', true),

  ('manzana', 'Manzana', 'manzana',
   'Responsable y cariñosa, le encantan los hábitos sanos (fruta, lavarse las manos).',
   'Alegre y clara; el gusanito a veces dice algo gracioso.',
   'munecos/manzana.jpg', '{huerto,granja,cole}', true),

  ('luna', 'Luna', 'luna creciente',
   'Calmada, soñadora y observadora; ideal para los finales tranquilos.',
   'Lenta y suave, bosteza a veces.',
   'munecos/luna.jpg', '{cielo,playa,casa}', true),

  ('cactus', 'Cactus', 'cactus',
   'Marchoso y bromista, el primero en ponerse a bailar.',
   'Rítmica, con palmas («¡Y un, dos, tres!»).',
   'munecos/cactus.jpg', '{desierto,jardin}', true),

  ('flan', 'Flan', 'flan',
   'Gracioso y elegante a la vez; se ríe y tiembla («¡qué cosquillas!»).',
   'Educado y con risitas («Encantado, ji, ji»).',
   'munecos/flan.jpg', '{cocina,fiesta,casa}', true),

  ('globo', 'Globo', 'globo',
   'Ligero, risueño y soñador; le encanta ver las cosas desde arriba.',
   'Animada, con sonidos de flotar («¡Fiuuu, arriba!»).',
   'munecos/globo.jpg', '{cielo,feria,parque}', true),

  ('zumbillo', 'Zumbillo', 'abeja',
   'Trabajador, mañoso y simpático; ayuda a las flores y a sus amigos.',
   'Con «z» zumbonas («¡Zzzí, vamos!»).',
   'munecos/zumbillo.jpg', '{prado,jardin,bosque}', true),

  ('tiquitaque', 'Tiquitaque', 'reloj despertador',
   'Puntual y ordenado, ayuda a aprender rutinas y a contar.',
   'Al ritmo de su tictac («Tic, tac, ¡es la hora de…!»).',
   'munecos/tiquitaque.jpg', '{casa,ciudad,estacion}', true),

  ('burbujo', 'Burbujo', 'burbuja / pompa',
   'Juguetón y saltarín, se ríe con todo.',
   'Con «plop» y «blub» («¡Plop! ¡Otra pompa!»).',
   'munecos/burbujo.jpg', '{playa,rio,casa}', true),

  ('gargolito', 'Gargolito', 'gárgola',
   'Guardián cariñoso y algo travieso; cuida de los demás desde arriba.',
   'Voz grave pero dulce, hace sonar su campanita («¡Tilín!»).',
   'munecos/gargolito.jpg', '{castillo,ciudad}', true)
on conflict (clave) where familia_id is null do update set
  nombre = excluded.nombre,
  especie = excluded.especie,
  personalidad = excluded.personalidad,
  forma_de_hablar = excluded.forma_de_hablar,
  imagen_path = excluded.imagen_path,
  lugares_favoritos = excluded.lugares_favoritos;

-- ---------------------------------------------------------------------------
-- Catálogo de personajes secundarios (arquitectura 10.4 y docs/munecos.md)
-- Objetivo de F1: 20-25 más el comodín; aquí están los aprobados hasta ahora (17 + comodín).
-- Los «lugares» de los 13 primeros son provisionales. Ninguno lleva bufanda, ni las orejas de
-- puntas azules ni la cola de Luppo. Las imágenes (webp) aún hay que dibujarlas.
-- ---------------------------------------------------------------------------
insert into public.secundarios
  (clave, nombre, descripcion, lugares, imagen_path, acciones_disponibles, es_comodin)
values
  ('taquillero',     'Taquillero',        'Vende billetes con una sonrisa.',
   '{plaza}',                'secundarios/taquillero.webp',     '{quieto,saludar,dar_billete}',  false),
  ('bruja',          'Bruja',             'Una bruja amable con su escoba.',
   '{bosque}',               'secundarios/bruja.webp',          '{quieto,saludar,volar}',        false),
  ('guardia',        'Guardia',           'Cuida el parque y saluda a todos.',
   '{parque,plaza}',         'secundarios/guardia.webp',        '{quieto,saludar}',              false),
  ('panadero',       'Panadero',          'Huele a pan recién hecho.',
   '{plaza}',                'secundarios/panadero.webp',       '{quieto,saludar}',              false),
  ('pirata',         'Pirata',            'Un pirata simpático que busca tesoros.',
   '{playa}',                'secundarios/pirata.webp',         '{quieto,saludar}',              false),
  ('medico',         'Médico',            'Cuida de todos con cariño.',
   '{plaza}',                'secundarios/medico.webp',         '{quieto,saludar}',              false),
  ('granjero',       'Granjero',          'Cuida los animales de la granja.',
   '{granja,prado,bosque}',  'secundarios/granjero.webp',       '{quieto,saludar}',              false),
  ('cartero',        'Cartero',           'Reparte cartas por todas partes.',
   '{plaza,paseo}',          'secundarios/cartero.webp',        '{quieto,saludar}',              false),
  ('pescadero',      'Pescadero',         'Vende pescado fresquito.',
   '{playa,plaza}',          'secundarios/pescadero.webp',      '{quieto,saludar}',              false),
  ('maestra',        'Maestra',           'Le encanta enseñar cosas nuevas.',
   '{parque,plaza}',         'secundarios/maestra.webp',        '{quieto,saludar}',              false),
  ('bombero',        'Bombero',           'Un bombero amable y valiente.',
   '{plaza}',                'secundarios/bombero.webp',        '{quieto,saludar}',              false),
  ('jardinera',      'Jardinera',         'Cuida las flores del jardín.',
   '{parque,prado}',         'secundarios/jardinera.webp',      '{quieto,saludar}',              false),
  ('conductor_tren', 'Conductor de tren', 'Conduce el tren y toca el silbato.',
   '{plaza,paseo}',          'secundarios/conductor_tren.webp', '{quieto,saludar}',              false),

  -- Aprobados por <padre> el 2/10/2026 (docs/munecos.md). Acciones propias: propuestas.
  ('bruma', 'Bruma',
   'Criatura nocturna que colecciona sonidos perdidos: capa con capucha azul tinta, antenas con campanitas y un tarro lleno de notas musicales. Aparece cuando algo suena raro o falta música; siempre amable, nunca da miedo.',
   '{bosque,castillo,cielo,casa}',   'secundarios/bruma.webp', '{quieto,saludar,abrir_tarro}', false),
  ('tilo', 'Tilo',
   'Liebre cartógrafa: gafas de explorador, lápiz y mapa tras las orejas, chaleco de bolsillos y zurrón con planos. Aparece cuando alguien se pierde y hay que encontrar el camino.',
   '{bosque,prado,parque,montana}',  'secundarios/tilo.webp',  '{quieto,saludar,senalar_mapa}', false),
  ('pomo', 'Pomo',
   'Invernadero con patas: tripa de cristal tipo terrario con plantas, una seta y una lucecita, regadera por sombrero y botas de barro. Cariñoso y algo torpe. Aparece cuando hay que cuidar algo o hacer que crezca.',
   '{jardin,huerto,granja,prado}',   'secundarios/pomo.webp',  '{quieto,saludar,regar}',        false),
  ('coco', 'Coco',
   'Mapache inventora: mono color ciruela lleno de herramientas, lupa en una cinta en la cabeza, coleta y un cacharro con hélices. Aparece cuando hay que arreglar o construir algo.',
   '{taller,parque,ciudad,casa}',    'secundarios/coco.webp',  '{quieto,saludar,inventar}',     false),

  ('comodin', 'Amigo de paso', 'Personaje genérico cuando falta uno.',
   '{}', 'secundarios/comodin.webp', '{quieto,saludar}', true)
on conflict (clave) do update set
  nombre = excluded.nombre,
  descripcion = excluded.descripcion,
  lugares = excluded.lugares,
  imagen_path = excluded.imagen_path,
  acciones_disponibles = excluded.acciones_disponibles;
