-- Luppo · semilla de la fase 1. Se puede ejecutar varias veces (no duplica nada).
-- La aplica Ander después de la migración 0001. Sin datos reales de ningún niño.
--
-- PENDIENTE: la arquitectura habla de 16 muñecos, pero su ficha completa está en la página
-- «Muñecos» de Notion, que no está en el repo. Aquí solo van los 3 que nombra la arquitectura.
-- Cuando se disponga de las fichas, se añaden con otra migración o ampliando este archivo.

-- ---------------------------------------------------------------------------
-- Muñecos del sistema (familia_id = null)
-- ---------------------------------------------------------------------------
insert into public.munecos (clave, nombre, especie, imagen_path, es_sistema)
values
  ('luppo',    'Luppo',    'lince', 'munecos/luppo.png',    true),
  ('zumbillo', 'Zumbillo', null,    'munecos/zumbillo.png', true),
  ('nubecita', 'Nubecita', null,    'munecos/nubecita.png', true)
on conflict (clave) where familia_id is null do nothing;

-- ---------------------------------------------------------------------------
-- Catálogo de personajes secundarios (arquitectura 10.4)
-- PENDIENTE: solo están los nombrados en la arquitectura (13 + comodín); el catálogo final
-- será de 20-25. Los «lugares» son provisionales hasta cerrar el catálogo de lugares.
-- Ninguno lleva bufanda, orejas ni cola de Luppo.
-- ---------------------------------------------------------------------------
insert into public.secundarios (clave, nombre, descripcion, lugares, imagen_path, acciones_disponibles, es_comodin)
values
  ('taquillero',       'Taquillero',        'Vende billetes con una sonrisa.',          '{plaza}',                     'secundarios/taquillero.png',       '{quieto,saludar,dar_billete}', false),
  ('bruja',            'Bruja',             'Una bruja amable con su escoba.',          '{bosque}',                    'secundarios/bruja.png',            '{quieto,saludar,volar}',       false),
  ('guardia',          'Guardia',           'Cuida el parque y saluda a todos.',        '{parque,plaza}',              'secundarios/guardia.png',          '{quieto,saludar}',             false),
  ('panadero',         'Panadero',          'Huele a pan recién hecho.',                '{plaza}',                     'secundarios/panadero.png',         '{quieto,saludar}',             false),
  ('pirata',           'Pirata',            'Un pirata simpático que busca tesoros.',   '{playa}',                     'secundarios/pirata.png',           '{quieto,saludar}',             false),
  ('medico',           'Médico',            'Cuida de todos con cariño.',               '{plaza}',                     'secundarios/medico.png',           '{quieto,saludar}',             false),
  ('granjero',         'Granjero',          'Cuida los animales de la granja.',         '{granja,prado,bosque}',       'secundarios/granjero.png',         '{quieto,saludar}',             false),
  ('cartero',          'Cartero',           'Reparte cartas por todas partes.',         '{plaza,paseo}',               'secundarios/cartero.png',          '{quieto,saludar}',             false),
  ('pescadero',        'Pescadero',         'Vende pescado fresquito.',                 '{playa,plaza}',               'secundarios/pescadero.png',        '{quieto,saludar}',             false),
  ('maestra',          'Maestra',           'Le encanta enseñar cosas nuevas.',         '{parque,plaza}',              'secundarios/maestra.png',          '{quieto,saludar}',             false),
  ('bombero',          'Bombero',           'Un bombero amable y valiente.',            '{plaza}',                     'secundarios/bombero.png',          '{quieto,saludar}',             false),
  ('jardinera',        'Jardinera',         'Cuida las flores del jardín.',             '{parque,prado}',              'secundarios/jardinera.png',        '{quieto,saludar}',             false),
  ('conductor_tren',   'Conductor de tren', 'Conduce el tren y toca el silbato.',       '{plaza,paseo}',               'secundarios/conductor_tren.png',   '{quieto,saludar}',             false),
  ('comodin',          'Amigo de paso',     'Personaje genérico cuando falta uno.',     '{}',                          'secundarios/comodin.png',          '{quieto,saludar}',             true)
on conflict (clave) do nothing;
