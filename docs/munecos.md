# Muñecos de Luppo – catálogo para el seed

> **Copia de la página «Muñecos» (Notion) para Claude Code. Fuente de verdad: Notion. Datos personales sustituidos por marcadores.**
>
> Copia preparada el 2/10/2026. La página de Notion solo contiene **las imágenes vigentes** (versión estilo Luppo) y una nota de estilo; **no tiene fichas de texto**.
> Por eso, en este documento:
> - **Nombre, especie, accesorio distintivo y colores** salen de las imágenes vigentes (lo que se ve en cada dibujo).
> - **Personalidad, forma de hablar y lugares favoritos** son **propuestas** que encajan con el dibujo. No están en Notion: `<padre>` debe revisarlas antes de dar el seed por cerrado.
> - **Canción base**: todavía no existe ninguna. Se generará con ElevenLabs Music después de probar con la niña qué estilo le gusta (ver arquitectura, 10.1). En el seed: `null`.

## Reglas de estilo (de Notion)

- Todos los muñecos siguen el **estilo Luppo**: ilustración de libro de cuentos con textura de papel, proporciones estilizadas (no de bebé) y colores apagados (verde salvia, ocre, terracota, rosa, azul tinta y crema). Para niños de 3 a 6 años.
- **La bufanda es exclusiva de Luppo.** Ningún otro muñeco ni secundario lleva bufanda, ni las orejas de puntas azules ni la cola esponjosa que cambia de color de Luppo.
- Los 7 muñecos que antes llevaban bufanda (Dragoncito, Zorrito, Caracol, Nubecita, Robotito, Estrella y Gargolito) tienen ahora una **versión v2** con otro accesorio. Abajo se usa siempre esa versión v2.
- La sección «Estilo anterior (descartado)» de la página (muñecos en 3D infantil del 1/10/2026) **no se usa**.

## Luppo (mascota, no forma parte de los 16)

Luppo tiene su propia página («Luppo — personaje oficial»). Es un **lince inventado verde salvia**, con orejas de puntas azules, **bufanda terracota**, abrigo verde con bolsillo rosa, mochila ocre con forma de libro y una cola esponjosa que cambia de azul tinta a rosa y ocre con la música. Es **neutro** (ni chico ni chica). Caras vigentes: pillo simpático, contento, riendo, sorprendido y pensando. Si se mete en `munecos` como muñeco del sistema, usar `clave = "luppo"`.

## Resumen para `seed.sql` (tabla `munecos`, 16 filas, `es_sistema = true`, `familia_id = null`)

| # | clave | nombre | especie | accesorio distintivo | colores | imagen (Notion) |
|---|---|---|---|---|---|---|
| 1 | `dragoncito` | Dragoncito | dragón | Mochila azul tinta con correas de cuero | terracota, melocotón (tripa), azul tinta | `muneco-dragoncito-luppo-v2.jpg` |
| 2 | `zorrito` | Zorrito | zorro | Salacot de explorador, brújula colgada al cuello y mapa enrollado | terracota, crema, ocre, marrón | `muneco-zorrito-luppo-v2.jpg` |
| 3 | `caracol` | Caracol | caracol | Gafas redondas y concha-casita con ventana redonda, chimenea y maceta con planta | verde salvia, terracota, azul tinta (botas) | `muneco-caracol-luppo-v2.jpg` |
| 4 | `nubecita` | Nubecita | nube | Paraguas terracota, diadema de arcoíris y botas de agua | crema/blanco, terracota, arcoíris suave, azul tinta | `muneco-nubecita-luppo-v2.jpg` |
| 5 | `robotito` | Robotito | robot | Pajarita terracota, maletín de herramientas y antena con bolita azul | verde grisáceo, cobre/terracota, azul | `muneco-robotito-luppo-v2.jpg` |
| 6 | `seta` | Seta | seta (criatura del bosque) | Sombrero de seta con lunares y farolillo | verde salvia, rosa terracota, crema | `muneco-seta-luppo.jpg` |
| 7 | `estrella` | Estrella | estrella | Capa verde salvia de superhéroe y estela de chispas | ocre/amarillo, verde salvia, azul tinta | `muneco-estrella-luppo-v2.jpg` |
| 8 | `manzana` | Manzana | manzana | Mochila ocre y gusanito amigo que se asoma por un agujero | rojo apagado/rosa, verde (hoja), ocre, azul tinta (botas) | `muneco-manzana-luppo.jpg` |
| 9 | `luna` | Luna | luna creciente | Gorro de dormir azul con estrellita y catalejo | crema, azul tinta, ocre | `muneco-luna-luppo.jpg` |
| 10 | `cactus` | Cactus | cactus | Flor rosa en la cabeza y sandalias | verde salvia, rosa, ocre | `muneco-cactus-luppo.jpg` |
| 11 | `flan` | Flan | flan | Pajarita azul y cuchara a modo de bastón | ocre/caramelo, marrón, azul tinta | `muneco-flan-luppo.jpg` |
| 12 | `globo` | Globo | globo | Gorro de aviador con gafas | rosa/coral, verde salvia, marrón, azul tinta | `muneco-globo-luppo.jpg` |
| 13 | `zumbillo` | Zumbillo | abeja | Gafas de aviador y cinturón de herramientas | ocre, azul tinta, terracota | `muneco-zumbillo-luppo.jpg` |
| 14 | `tiquitaque` | Tiquitaque | reloj despertador | Pajarita terracota, llave de cuerda y muelle con engranaje | latón/ocre, crema, terracota | `muneco-tiquitaque-luppo.jpg` |
| 15 | `burbujo` | Burbujo | burbuja / pompa | Gorro de lana verde con pompón y varita de pompas | azul claro translúcido, verde salvia | `muneco-burbujo-luppo.jpg` |
| 16 | `gargolito` | Gargolito | gárgola | Corona de musgo y campanita al cuello (vive en los tejados) | gris azulado, verde musgo, terracota (tejado) | `muneco-gargolito-luppo-v2.jpg` |

Notas para el seed:
- `clave` = slug en minúsculas y sin tildes. `imagen_path` propuesto: `public/munecos/<clave>.jpg` (copiar las imágenes vigentes de Notion con ese nombre).
- `rive_archivo = null` en todos al principio (se animan con Motion hasta tener su `.riv`).
- `voz_tts`: pendiente de la prueba de voces (pregunta abierta 2 de la arquitectura). Usar `TTS_VOZ_MUNECO_POR_DEFECTO` hasta entonces.
- `capas = null` (F2). `activo = true`.

## Fichas de los 16 muñecos

Leyenda: **(Notion)** = se ve en la imagen vigente; **(propuesta)** = no está en Notion, a revisar.

### 1. Dragoncito · `dragoncito`
- **Descripción corta** (Notion): dragoncito terracota de tripa clara, con alitas y cresta, que va de excursión con su mochila.
- **Accesorio distintivo** (Notion): mochila azul tinta con correas de cuero (v2, sustituye a la bufanda).
- **Colores** (Notion): terracota, melocotón, azul tinta.
- **Personalidad** (propuesta): aventurero y valiente, con mucha energía; siempre quiere ver qué hay detrás de la siguiente colina.
- **Forma de hablar** (propuesta): entusiasta, con exclamaciones («¡Vamos, vamos!»). Cuando se emociona suelta una chispita (nunca fuego que queme).
- **Lugares favoritos** (propuesta): `montana`, `bosque`, `castillo`.
- **Canción base**: pendiente.

### 2. Zorrito · `zorrito`
- **Descripción corta** (Notion): zorro explorador terracota con cola de punta crema.
- **Accesorio distintivo** (Notion): salacot de explorador, brújula al cuello y mapa enrollado (v2, sustituye a la bufanda).
- **Colores** (Notion): terracota, crema, ocre, marrón.
- **Personalidad** (propuesta): curioso y listo, le encanta orientarse y resolver pistas.
- **Forma de hablar** (propuesta): «¡Según mi mapa…!», hace preguntas para pensar juntos.
- **Lugares favoritos** (propuesta): `bosque`, `prado`, `parque`.
- **Canción base**: pendiente.

### 3. Caracol · `caracol`
- **Descripción corta** (Notion): caracol verde salvia con gafitas que lleva su casa a cuestas (concha con ventana, chimenea y una maceta encima).
- **Accesorio distintivo** (Notion): gafas redondas y concha-casita con maceta (v2, sustituye a la bufanda).
- **Colores** (Notion): verde salvia, terracota, azul tinta.
- **Personalidad** (propuesta): tranquilo, paciente y sabio; enseña que despacito también se llega.
- **Forma de hablar** (propuesta): pausada, alarga las palabras («Pooocooo a pooocooo»).
- **Lugares favoritos** (propuesta): `jardin`, `huerto`, `prado`.
- **Canción base**: pendiente.

### 4. Nubecita · `nubecita`
- **Descripción corta** (Notion): nube esponjosa con bracitos, botas de agua y un arcoíris en la cabeza.
- **Accesorio distintivo** (Notion): paraguas terracota y diadema de arcoíris (v2, sustituye a la bufanda).
- **Colores** (Notion): blanco/crema, terracota, arcoíris suave, azul tinta.
- **Personalidad** (propuesta): alegre y algo despistada; cuando se emociona llueven unas gotitas.
- **Forma de hablar** (propuesta): suave, con onomatopeyas de lluvia («plic, plic»).
- **Lugares favoritos** (propuesta): `cielo`, `prado`, `playa`.
- **Canción base**: pendiente.

### 5. Robotito · `robotito`
- **Descripción corta** (Notion): robot retro verde grisáceo con piezas de cobre, pantalla en el pecho y antena.
- **Accesorio distintivo** (Notion): pajarita terracota y maletín de herramientas (v2, sustituye a la bufanda).
- **Colores** (Notion): verde grisáceo, cobre/terracota, azul.
- **Personalidad** (propuesta): amable y ordenado, le gusta contar y arreglar cosas.
- **Forma de hablar** (propuesta): frases cortas con sonidos de robot («¡Bip-bup! Cuento: uno, dos, tres»).
- **Lugares favoritos** (propuesta): `taller`, `ciudad`, `parque`.
- **Canción base**: pendiente.

### 6. Seta · `seta`
- **Descripción corta** (Notion): criatura del bosque verde salvia con sombrero de seta de lunares y collar de musgo.
- **Accesorio distintivo** (Notion): farolillo.
- **Colores** (Notion): verde salvia, rosa terracota, crema.
- **Personalidad** (propuesta): tímida y dulce, conoce todos los rincones del bosque.
- **Forma de hablar** (propuesta): bajito, como en secreto («Shh, mira…»).
- **Lugares favoritos** (propuesta): `bosque`, `jardin`.
- **Canción base**: pendiente.

### 7. Estrella · `estrella`
- **Descripción corta** (Notion): estrella ocre que corre dejando una estela de chispas.
- **Accesorio distintivo** (Notion): capa verde salvia de superhéroe (v2, sustituye a la bufanda; es una capa, no una bufanda).
- **Colores** (Notion): ocre/amarillo, verde salvia, azul tinta.
- **Personalidad** (propuesta): valiente y animadora, siempre dispuesta a ayudar.
- **Forma de hablar** (propuesta): «¡Al rescate!», anima a los demás («¡Tú puedes!»).
- **Lugares favoritos** (propuesta): `cielo`, `parque`.
- **Canción base**: pendiente.

### 8. Manzana · `manzana`
- **Descripción corta** (Notion): manzana roja con botas que va al cole, y un gusanito amigo que se asoma por un agujero.
- **Accesorio distintivo** (Notion): mochila ocre (y el gusanito amigo).
- **Colores** (Notion): rojo apagado/rosa, verde, ocre, azul tinta.
- **Personalidad** (propuesta): responsable y cariñosa, le encantan los hábitos sanos (fruta, lavarse las manos).
- **Forma de hablar** (propuesta): alegre y clara; el gusanito a veces dice algo gracioso.
- **Lugares favoritos** (propuesta): `huerto`, `granja`, `cole`.
- **Canción base**: pendiente.

### 9. Luna · `luna`
- **Descripción corta** (Notion): luna creciente color crema con piernas y gorro de dormir.
- **Accesorio distintivo** (Notion): gorro de dormir azul con estrellita y catalejo.
- **Colores** (Notion): crema, azul tinta, ocre.
- **Personalidad** (propuesta): calmada, soñadora y observadora; ideal para los finales tranquilos.
- **Forma de hablar** (propuesta): lenta y suave, bosteza a veces.
- **Lugares favoritos** (propuesta): `cielo`, `playa` (de noche), `casa`.
- **Canción base**: pendiente.

### 10. Cactus · `cactus`
- **Descripción corta** (Notion): cactus verde salvia bailarín con una flor en la cabeza (pinchos suaves, nunca pinchan).
- **Accesorio distintivo** (Notion): flor rosa y sandalias.
- **Colores** (Notion): verde salvia, rosa, ocre.
- **Personalidad** (propuesta): marchoso y bromista, el primero en ponerse a bailar.
- **Forma de hablar** (propuesta): rítmica, con palmas («¡Y un, dos, tres!»).
- **Lugares favoritos** (propuesta): `desierto`, `jardin`.
- **Canción base**: pendiente.

### 11. Flan · `flan`
- **Descripción corta** (Notion): flan de caramelo tembloroso con pajarita.
- **Accesorio distintivo** (Notion): pajarita azul y cuchara a modo de bastón.
- **Colores** (Notion): ocre/caramelo, marrón, azul tinta.
- **Personalidad** (propuesta): gracioso y elegante a la vez; se ríe y tiembla («¡qué cosquillas!»).
- **Forma de hablar** (propuesta): educado y con risitas («Encantado, ji, ji»).
- **Lugares favoritos** (propuesta): `cocina`, `fiesta`, `casa`.
- **Canción base**: pendiente.

### 12. Globo · `globo`
- **Descripción corta** (Notion): globo coral que flota con bracitos y una cuerdita.
- **Accesorio distintivo** (Notion): gorro de aviador con gafas.
- **Colores** (Notion): rosa/coral, verde salvia, marrón, azul tinta.
- **Personalidad** (propuesta): ligero, risueño y soñador; le encanta ver las cosas desde arriba.
- **Forma de hablar** (propuesta): animada, con sonidos de flotar («¡Fiuuu, arriba!»).
- **Lugares favoritos** (propuesta): `cielo`, `feria`, `parque`.
- **Canción base**: pendiente.

### 13. Zumbillo · `zumbillo`
- **Descripción corta** (Notion): abeja peluda ocre y azul tinta, con alas transparentes.
- **Accesorio distintivo** (Notion): gafas de aviador y cinturón de herramientas.
- **Colores** (Notion): ocre, azul tinta, terracota.
- **Personalidad** (propuesta): trabajador, mañoso y simpático; ayuda a las flores y a sus amigos.
- **Forma de hablar** (propuesta): con «z» zumbonas («¡Zzzí, vamos!»). Es el protagonista del ejemplo JSON de la arquitectura.
- **Lugares favoritos** (propuesta): `prado`, `jardin`, `bosque`.
- **Canción base**: pendiente (gancho de ejemplo en la arquitectura: «¡Zumbillo baila, baila!»).

### 14. Tiquitaque · `tiquitaque`
- **Descripción corta** (Notion): reloj despertador de latón que camina con patitas de alambre.
- **Accesorio distintivo** (Notion): pajarita terracota, llave de cuerda y muelle con engranaje.
- **Colores** (Notion): latón/ocre, crema, terracota.
- **Personalidad** (propuesta): puntual y ordenado, ayuda a aprender rutinas y a contar.
- **Forma de hablar** (propuesta): al ritmo de su tictac («Tic, tac, ¡es la hora de…!»).
- **Lugares favoritos** (propuesta): `casa`, `ciudad`, `estacion`.
- **Canción base**: pendiente.

### 15. Burbujo · `burbujo`
- **Descripción corta** (Notion): criatura de pompa azul translúcida, llena de burbujitas.
- **Accesorio distintivo** (Notion): gorro de lana verde con pompón y varita de pompas.
- **Colores** (Notion): azul claro translúcido, verde salvia.
- **Personalidad** (propuesta): juguetón y saltarín, se ríe con todo.
- **Forma de hablar** (propuesta): con «plop» y «blub» («¡Plop! ¡Otra pompa!»).
- **Lugares favoritos** (propuesta): `playa`, `rio`, `banera`/`casa`.
- **Canción base**: pendiente.

### 16. Gargolito · `gargolito`
- **Descripción corta** (Notion): gárgola pequeña gris azulada con musgo, alas de murciélago y cuernecitos, que vive en los tejados (nada de miedo: sonriente).
- **Accesorio distintivo** (Notion): corona de musgo y campanita al cuello (v2, sustituye a la bufanda).
- **Colores** (Notion): gris azulado, verde musgo, terracota.
- **Personalidad** (propuesta): guardián cariñoso y algo travieso; cuida de los demás desde arriba.
- **Forma de hablar** (propuesta): voz grave pero dulce, hace sonar su campanita («¡Tilín!»).
- **Lugares favoritos** (propuesta): `castillo`, `ciudad` (tejados).
- **Canción base**: pendiente.

> Las claves de lugar propuestas (`montana`, `jardin`, `huerto`, `cole`, `cocina`, `fiesta`, `feria`, `taller`, `estacion`, `rio`, `desierto`…) deben coincidir con el catálogo real de `lib/catalogo/lugares.ts`. Si un lugar no existe en el catálogo, quitarlo de `lugares_favoritos`.

## Secundarios aprobados (nuevos)

Aprobados por `<padre>` el 2/10/2026. Son filas nuevas para la tabla **`secundarios`** (catálogo del sistema, ver arquitectura 4 y 10.4). **Habrá más secundarios** más adelante (objetivo: **20–25** en F1, más el **comodín**).

Reglas que se mantienen: estilo Luppo; ninguno lleva bufanda, ni las orejas de puntas azules ni la cola de Luppo; son amables, no dan miedo y no le roban el protagonismo a los personajes principales. `acciones_disponibles` tiene 2–3 acciones (`quieto`, `saludar` y una propia). `es_comodin = false`, `activo = true`, `rive_archivo = null` (Motion de respaldo). `imagen_path` propuesto: `public/secundarios/<clave>.webp` (las imágenes aún hay que dibujarlas en estilo Luppo).

| clave | nombre | descripcion | lugares (propuesta) | acciones_disponibles (propuesta) | cuándo aparece |
|---|---|---|---|---|---|
| `bruma` | Bruma | Criatura nocturna que colecciona sonidos perdidos: capa con capucha azul tinta, antenas con campanitas y un tarro lleno de notas musicales | `bosque`, `castillo`, `cielo` (de noche), `casa` | `quieto`, `saludar`, `abrir_tarro` | Cuando algo suena raro o falta música. Siempre amable, nunca da miedo |
| `tilo` | Tilo | Liebre cartógrafa: gafas de explorador, lápiz y mapa tras las orejas, chaleco de bolsillos y zurrón con planos (sus orejas son de liebre, sin puntas azules) | `bosque`, `prado`, `parque`, `montana` | `quieto`, `saludar`, `senalar_mapa` | Cuando alguien se pierde y hay que encontrar el camino |
| `pomo` | Pomo | Invernadero con patas: tripa de cristal tipo terrario con plantas, una seta y una lucecita, regadera por sombrero y botas de barro. Cariñoso y algo torpe | `jardin`, `huerto`, `granja`, `prado` | `quieto`, `saludar`, `regar` | Cuando hay que cuidar algo o hacer que crezca |
| `coco` | Coco | Mapache inventora (chica): mono color ciruela lleno de herramientas, lupa en una cinta en la cabeza, coleta y un cacharro con hélices | `taller`, `parque`, `ciudad`, `casa` | `quieto`, `saludar`, `inventar` | Cuando hay que arreglar o construir algo |

Notas:
- Las acciones propias (`abrir_tarro`, `senalar_mapa`, `regar`, `inventar`) son propuestas. Hay que añadirlas a `acciones_disponibles` y a la máquina de estados de Rive o Motion de cada secundario.
- Si Claude pide uno de estos antes de que esté dibujado, sale el comodín y se apunta en `secundarios_pedidos` (arquitectura 7 y 10.4).
