# Guía de diseño CAP

Cómo debe verse cualquier sistema interno hecho con el design system CAP, con la marca CAP o con
Moniteck (manual de marca 2026). Es la referencia para programadores y para los agentes de IA que
generen interfaz. Los valores viven en `tokens.json`; nunca se escriben hex a mano en una pantalla.

## En una frase

Marco de vidrio claro (ahumado en oscuro) sobre un lienzo neutro, tarjetas claras, Inter y Poppins, y la escala de la marca instalada como acento; los valores están en `PALETTE.md`.

## Paleta

`cap` es el nombre del design system, no del color. Los nombres `red`, `wine` y `taupe` de clases, variables y tokens son los **papeles** de la escala de marca (acento, profundo, neutro cálido); en Moniteck valen verde, verde profundo y salvia.

Dos formas de nombrar cada color, para dos usos:

- **Alias de rol** (`cap-page`, `cap-card`, `cap-card-2`, `cap-divider`, `cap-head`,
  `cap-input-line`, `cap-text-soft`, `cap-table-head`): cambian solos con el tema. No llevan `dark:`
  ni admiten `/opacidad`. Son la opción por defecto.
- **Colores físicos** (`cap-paper`, `cap-raised`, `cap-line`, `cap-brand`, `cap-red-*`,
  `cap-status-*`…): valor fijo; admiten `/opacidad` y necesitan su par `dark:`. Solo cuando haga
  falta opacidad o un valor que no cambie.

Dos formas de escribir `cap-*`: las **piezas del marco** (sidebar, header, tabbar, hoja «Más»,
notificaciones, toasts, confirmación, acceso) se hacen con los componentes del stack y su CSS plano
`.cap-*` de `shell.css`; el **contenido de la página** (tarjetas, tablas, formularios, botones) se
escribe con las clases de Tailwind `cap-*` del recetario.

Los valores de la marca instalada están en `PALETTE.md` de la carpeta `design/` del proyecto (generado; no se edita).

| Uso | Clase Tailwind | Variable CSS |
|---|---|---|
| Respaldo sólido de piezas con texto claro, PDF; ya no es el botón primario (no cambia de tema) | `bg-cap-chrome` | `--cap-chrome` |
| Superficie del marco: respaldo sin vidrio, bordes de avatar | `bg-cap-frame` | `--cap-frame` |
| Texto sobre el marco | `text-cap-frame-ink` | `--cap-frame-ink` |
| Texto secundario sobre el marco | `text-cap-frame-ink-soft` | `--cap-frame-ink-soft` |
| Riel o barra más oscura dentro del marco | `bg-cap-rail` | `--cap-rail` |
| Barra de título de panel, PDF (la cabecera de tabla es `bg-cap-table-head`); en oscuro, con `border-b border-cap-divider` si no se funde con la tarjeta | `bg-cap-head` | `--cap-head` |
| Cabecera de tabla (fondo / texto / línea) | `bg-cap-table-head text-cap-table-head-ink border-cap-table-head-line` | `--cap-table-head`, `--cap-table-head-ink`, `--cap-table-head-line` |
| Fondo de página (lienzo) | `bg-cap-page` | `--cap-page` |
| Tarjetas, paneles, modales | `bg-cap-card` | `--cap-card` |
| Superficie secundaria: chips, hover de fila, esqueletos, solo lectura | `bg-cap-card-2` | `--cap-card-2` |
| Divisores y bordes decorativos | `border-cap-divider` | `--cap-divider` |
| Borde de inputs y controles | `border-cap-input-line` | `--cap-input-line` |
| Texto secundario sobre tarjeta | `text-cap-text-soft` | `--cap-text-soft` |
| Texto sobre `bg-cap-chrome` o `bg-cap-head` sólidos (barras de título de panel); el marco ya no los usa | `text-cap-on-chrome` | `--cap-on-chrome` |
| Texto secundario sobre esas mismas superficies sólidas | `text-cap-on-chrome-soft` | `--cap-on-chrome-soft` |
| Gris de marca (acentos menores sobre el marco) | `text-cap-brand-gray` | `--cap-gray` |
| Neutro cálido (`taupe`): series neutras, avatar sin foto | `bg-cap-taupe` | `--cap-taupe` |
| Color de marca (`cap-brand`) como **texto, ícono o borde**: enlaces de tabla, filo del ítem activo | `text-cap-brand dark:text-cap-brand-soft` | `--cap-brand` |
| Color de marca (`cap-brand`) como **relleno**: botón flotante, logo del marco (el destructivo y los contadores urgentes usan `status-error`, ver «Estados») | `bg-cap-brand text-white hover:bg-cap-brand-hover` | `--cap-red` |

**Escala de marca** (el `600` es el color de marca; todos son físicos y llevan su par `dark:`):

| Paso | Clase | Uso |
|---|---|---|
| profundo (`cap-wine`, `red-800`) | `bg-cap-red-800` | fin del degradado de la tarjeta destacada (texto blanco), serie principal de gráficas en claro |
| color de marca (`cap-brand`, `red-600`) | `bg-cap-red-600` | acento, filo del ítem activo, botón flotante |
| medio (`red-400`) | `bg-cap-red-400` | series secundarias de gráficas |
| `cap-red-200` | `bg-cap-red-200` | series de fondo, chips de ícono |
| `cap-red-100` | `border-cap-red-100` | borde de la tarjeta anidada principal |
| tinte (`cap-red-50`) | `bg-cap-red-50` | fondo de la tarjeta anidada principal |

**Vidrio**: `--cap-glass-bg` (claro al 0.72 en claro, ahumado al 0.78 en oscuro),
`--cap-glass-blur`, `--cap-glass-border` y `--cap-glass-highlight`, cada uno por tema. Se aplica con
la clase `cap-glass` de `shell.css`, nunca con `rgba(` a mano. La opacidad la fija el contraste: el
peor caso es `card` y `page` detrás, y lo esencial del marco va en `--cap-frame-ink`, verificado
además sobre profundo (`cap-wine`); `npm run contrast` lo verifica. El tooltip del riel va invertido
respecto del marco (`--cap-glass-tooltip-bg|ink|hover`).

**Degradados**: `bg-cap-gradient-featured` (`--cap-gradient-featured`, radial del color de marca al
profundo) para la tarjeta destacada y `bg-cap-gradient-primary` (`--cap-gradient-primary`, lineal a
135° del color de marca al profundo) para el botón primario. Son los únicos degradados permitidos
fuera de los manchones del lienzo.

Texto: `text-gray-900 dark:text-gray-100`; secundario `text-cap-text-soft`; deshabilitado por
opacidad, no por color. Las escalas `gray`, `slate` y `zinc` están unificadas en la neutra para que
nada tiña de azul el modo oscuro.

Todos los pares de la tabla cumplen WCAG AA (4.5:1 texto, 3:1 controles), en las dos marcas; las
cifras de contraste están en `PALETTE.md`. Nunca `dark:bg-cap-brand-soft` con texto blanco: el
suave (`cap-brand-soft`) es solo para texto.

### Estados

Una sola escala semántica para badges, chips, avisos y gráficas; mismo significado en los dos temas
y en las dos marcas. Patrón de clases: `{text|bg|border}-cap-status-{estado}` en claro y
`dark:{…}-cap-status-dark-{estado}` en oscuro. Para tintes y rellenos sin `dark:` están los alias de
rol `bg-cap-status-{estado}-tint`, `text-cap-status-{estado}-ink` y `bg-cap-status-{estado}-solid`
(`ok`, `info`, `warning`, `error`).

| Estado | Uso | Variable |
|---|---|---|
| `ok` | completado, pagado, activo | `--cap-status-ok` |
| `error` | anulado, vencido, rechazado, fallo, destructivo | `--cap-status-error` |
| `warning` | pendiente, por vencer, requiere atención | `--cap-status-warning` |
| `info` | en proceso, informativo | `--cap-status-info` |
| `neutral` | borrador, inactivo, archivado | `--cap-status-neutral` |

Un badge es texto del color del estado sobre el mismo color al 10 % (15 % en oscuro), con un punto
`bg-current` a la izquierda; las clases exactas salen de `statuses.js`
(`statusBadgeClass('ok')`), nunca se escriben a mano. Los estados del dominio (`pending`,
`approved`, `void`…) se mapean a uno de estos cinco en un archivo de constantes del proyecto.
Todos los pares texto/tinte cumplen ≥ 4.5:1 sobre tarjeta. Un chip de color sólido solo en claro
con texto blanco; en oscuro, el texto sobre un sólido de estado es `text-gray-900`.

### Reglas de color

- **Botones del sistema en píldora**, de 44 px de alto: son la clase `.cap-button` del marco. Los
  controles de formulario no: son `rounded-cap-control`.
- **Primario** con el degradado de marca (`bg-cap-gradient-primary`) en los dos temas:
  `cap-button--primary`. Uno visible por pantalla o formulario: si la lista está vacía, el del estado vacío reemplaza al de la barra de acciones.
- **Secundario** con contorno: `cap-button--secondary`. El hover oscurece el fondo, nunca pasa a
  error (`status-error`): ese color en un botón significa destructivo. Exportar PDF/Excel, filtros, «Cancelar» y acciones
  de menú son secundarias.
- **Terciario / solo ícono**: sin borde, `text-gray-600 hover:bg-cap-card-2 dark:text-gray-400`,
  36 × 36 px con `aria-label`.
- **Destructivo**: `cap-button--danger`, con contorno de error (`status-error`) y fondo de tarjeta. El
  relleno de error (`cap-button--danger-solid`) solo existe en el botón de aceptar del diálogo de confirmación, que ya
  lo pone `CapConfirmDialog` / `<x-cap.confirm-dialog>`.
- **Enlaces**: en tablas, color de marca (`cap-brand`) sin subrayado (`text-cap-brand dark:text-cap-brand-soft
  hover:underline`). En texto corrido, avisos y pies: color del texto con subrayado
  (`underline underline-offset-2 decoration-gray-400 hover:decoration-current`). Enlaces externos
  con `mdi-open-in-new` 16 px. El color de marca no es color de enlace genérico; la única excepción son los
  enlaces de la pantalla de acceso, que ya trae el componente.
- **Foco visible** en todo elemento interactivo, con `focus-visible` (el clic con ratón no muestra
  anillo): `focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
  focus-visible:ring-cap-chrome focus-visible:ring-offset-cap-card dark:focus-visible:ring-gray-100`.
  En inputs el foco es borde y anillo de 1 px: `focus:border-cap-chrome focus:ring-1
  focus:ring-cap-chrome dark:focus:border-gray-100 dark:focus:ring-gray-100`. Nunca azul ni el
  color de marca como anillo.
- El color de marca (`cap-brand`) **nunca** es fondo de cabeceras, barras de título ni superficies grandes. La única
  superficie grande en color es la tarjeta destacada con degradado (`bg-cap-gradient-featured`), una por fila de
  tarjetas de cifra. El azul solo existe como `info`. Sin degradados salvo `bg-cap-gradient-*` y los manchones del lienzo
  detrás del marco (los pone `shell.css`); sin sombras de color fuera de los tokens
  `--cap-shadow-*`; sin otros colores de acento.
- **Logos de terceros** (proveedores de acceso, bancos) van con sus colores oficiales, desde
  `logos/` de esta carpeta. Es la única excepción a la paleta: un logo ajeno no se recolorea ni se
  pone en monocromo, y sus colores no salen del logo.

## Empresa e identidad

Cada instalación pertenece a una empresa; las dos que usan el paquete son empresas distintas, no
divisiones de una misma, y elegir `--brand` elige esa empresa, no solo la paleta. Sus textos viven en
`tokens.json › company`:

| Clave | Qué es | Dónde sale |
|---|---|---|
| `name` | Nombre de la empresa | Sidebar (`owner`), correos, PDF, pies, «Acerca de», remitentes |
| `shortName` | Nombre corto | Espacios angostos |
| `mark` | Letra del logo | `.cap-shell-logo` del sidebar, header y acceso |
| `loginSubtitle` | Subtítulo del acceso | `.cap-login__subtitle` |
| `loginOwner` | Propietario en la tarjeta de la frase del acceso | `.cap-login__quote-owner` |
| `attribution` | Frase de atribución | Pies y páginas «Acerca de» |

Cómo se lee por stack: en Vue, `import { company } from '@/design/company.js'` y `company.name`; en
PHP y Blade, `config('design.company.name')` (y `config('design.company.loginOwner')`, etc.); en
React y Astro, el `tokens.json` instalado. Los componentes `CapSidebar`, `CapHeader`, `CapLogin` y
sus Blade ya toman estos textos por defecto; solo se pasan `owner`, `mark` y `subtitle` para
sobrescribirlos.

**Nunca se escribe el nombre de una empresa a mano**, con la misma fuerza que la regla del hex:
todo texto sale de `company`. En el sistema de una empresa no existe la otra; un
nombre de la otra empresa en una pantalla, un correo o un PDF es un error de marca.

## Tipografía

- **Inter** para todo el texto (`font-sans`). Es la fuente de interfaz; el manual pide Montserrat
  para textos impresos, pero en pantalla Inter se lee mejor en tablas y cifras.
- **Poppins**, la corporativa del manual, para títulos, cifras destacadas y cabeceras de tabla
  (`font-display`). Los `h1`–`h6` ya la llevan con `tokens.css`.
- Carga: `https://fonts.bunny.net/css?family=` + `fonts.webfont` de `tokens.json`.

Escala cerrada; no se usan tamaños intermedios ni `text-[…px]`:

| Nivel | Clases | Uso |
|---|---|---|
| Título de página | lo pone el header del marco (Poppins 600, 17 px) | uno por pantalla |
| Título de sección o modal | `font-display text-lg font-semibold` (18/28) | tarjetas, modales |
| Subtítulo | `font-display text-base font-semibold` (16/24) | grupos dentro de una tarjeta |
| Texto | `text-sm` (14/20) | cuerpo, celdas, inputs, botones |
| Texto denso | `text-cap-dense` (13/18) | tablas en densidad compacta |
| Etiqueta | `text-xs font-medium` (12/16) | labels, cabecera de tabla, badges, metadatos, migas |
| Cifra destacada | `font-display text-3xl font-semibold tabular-nums` (30/36) | tarjetas KPI |

Nada por debajo de `text-xs`. Sin mayúsculas forzadas con espaciado amplio; sentence case. Sin
monoespaciada salvo códigos. Las cifras en tablas van en Inter con `tabular-nums` y alineadas a la
derecha; Poppins solo para la cifra grande de una tarjeta, donde no hay alineación vertical.

## Cifras, moneda y fechas

- Moneda: `Intl.NumberFormat('es-HN', { style: 'currency', currency: 'HNL' })` → «L 12,345.67».
  Siempre dos decimales, miles con coma, decimal con punto. Dólares «US$ 1,234.00». Negativos con
  signo menos («-L 1,234.00»), nunca paréntesis ni error (`status-error`), salvo que el valor sea un estado (vencido).
  En tablas el símbolo puede ir solo en la cabecera («Total (L)») y las celdas solo cifra.
- Cantidades sin decimales innecesarios («12», «12.5»); porcentajes con un decimal y espacio
  («12.5 %»). Códigos, años, RTN, números de factura y teléfonos **sin** separador de miles.
- Fechas: `dd/mm/yyyy` en tablas y formularios («05/03/2026»); «5 mar 2026» en texto corrido y
  tarjetas; hora «2:05 p. m.». Fechas relativas («hace 3 min») solo en notificaciones. Rangos con
  guion y espacios: «01/03/2026 – 31/03/2026».
- Celdas sin valor: «—», nunca «0», «null» ni en blanco.

## Estructura de página

El marco (sidebar, header, tabbar, hoja «Más», notificaciones, toasts, confirmación y acceso) lo
define `shell/SHELL_SPEC.md` y se hace **siempre** con el componente del stack (`<x-cap.*>` en
Blade, `design/vue/Cap*.vue` en Vue) o, en React y Astro, siguiendo esa especificación. Esta
sección solo resume las medidas; si algo difiere, manda la especificación.

- **Marco flotante de vidrio claro (ahumado en oscuro)** sobre el lienzo `bg-cap-page`:
  sidebar y header son piezas sueltas, con 12 px de aire entre sí y con los bordes de la ventana, y radio de 24 px. El contenido pasa
  por debajo del header al desplazarse. **Hace scroll la ventana**, nunca un contenedor interno
  (el header es `position: sticky; top: 12px`).
- **Sidebar**: panel de 236 px o riel de íconos de 66 px, con un botón redondo en el borde para
  colapsar; el estado se recuerda y la preferencia guardada manda. Riel por defecto en todo
  escritorio; se asoma con el cursor y la flecha lo fija. Ítem de 38 px; el activo es una píldora de vidrio con filo del color de marca (`cap-brand`) de 3 px a la izquierda, no un
  bloque de color. Etiquetas de grupo en minúscula normal.
- **Header** de 64 px: título con migas · navegación de secciones (opcional, de 2 a 5, prop
  `sections`, píldoras) · buscador · acciones · campana · avatar. Con secciones y menos de 1280 px
  el buscador se contrae a la lupa. Las acciones de la página (primario, secundario) van en la primera fila del contenido (receta
  «Barra de acciones de la página»), no en el header. Las secciones son navegación entre
  vistas hermanas del mismo módulo; los filtros de una lista usan el segmentado.
- **Búsqueda**: un solo buscador por pantalla. Lo normal es el de la lista, junto al segmentado. El
  slot `search` del header es solo para sistemas que buscan en varios módulos; entonces las listas
  no llevan buscador de texto propio. Convive con las secciones; sigue habiendo un solo buscador.
  Sin slot `search`, apaga también la lupa móvil con `topbarSearch` / `topbar-search` en `false`.
- **Módulos**: en un ERP con varios módulos, la pantalla de entrada es la **portada de módulos**
  (saludo, «Continuar» y grupos de tarjetas; receta «Portada de módulos») y en ella la marca del
  sidebar lleva el nombre del sistema («ERP»). Para cambiar de módulo desde cualquier pantalla, el
  **conmutador** del header: la prop `modules` del layout pinta el botón de cuadrícula antes de la
  campana y su popover; en móvil, la hoja «Más» lista los módulos al principio. Dentro de un módulo,
  el sidebar muestra solo sus accesos: `systemName` es el nombre del módulo («Cobranza»), el dueño
  sigue debajo, el primer ítem es «Inicio» con `icon: 'view-grid'` y `href` a la portada, y las
  migas empiezan por el módulo («Cobranza › Tablero»). Nunca un menú de módulos en el sidebar.
- **Móvil (por debajo de `lg`, 1024 px)**: no es un escritorio encogido. Barra superior de vidrio de
  52 px (la navegación de secciones es una fila de píldoras sticky bajo la topbar), tabbar de vidrio
  abajo de 64 px con hasta 4 destinos más «Más» (hoja con el menú completo), listados como tarjetas (receta «Tarjeta de lista móvil») y botón flotante del color de marca (`cap-brand`) de 52 px opcional
  para crear. El contenido lleva relleno para no quedar tapado por las barras.
- **Pantallas**: escritorio primero (uso principal 1366–1920 px), mínimo 360 px. Puntos de quiebre
  de Tailwind: `sm` 640, `md` 768, `lg` 1024, `xl` 1280.
- **Contenido**: el margen lo pone el marco (`.cap-shell__content`); no agregues otro alrededor de
  la página. Envuelve cada página en `flex flex-col gap-6` para los 24 px entre secciones. `max-w-7xl` para formularios y lectura, ancho completo para tablas y tableros.
- **Espaciado** en múltiplos de 4 px: 4 ícono–texto, 8 chips y celdas compactas, 12 celdas y entre
  campos de una fila, 16 relleno de tarjeta en celular y entre campos, 20 relleno de tarjeta, 24
  relleno de modal y entre tarjetas y secciones, 32 entre bloques de formulario. Nunca 6, 10, 14 ni
  18 (los 12 px del aire del marco son múltiplo de 4). Esta escala rige para lo que escribes: las
  medidas internas del marco son las de `shell/SHELL_SPEC.md` y no se copian al contenido, y las
  recetas se copian tal cual aunque traigan `gap-1.5` o `py-2.5`.
- **Radios**: `rounded-md` (6) chips y badges; `rounded-cap-control` (14) inputs, selects, menús y
  popovers; `rounded-cap-card` (20) tarjetas; `rounded-cap-shell` (24) marco y modales;
  `rounded-cap-sheet` (28) hoja «Más» y paneles del acceso. Los botones del sistema son
  `rounded-full` (píldora), igual que avatares y el punto del badge.
- **Elevación**: cuatro niveles; en oscuro la sombra no se ve, así que cada nivel sube de superficie.

  | Nivel | Qué | Claro | Oscuro |
  |---|---|---|---|
  | 0 | tarjetas, tablas, inputs | `border-cap-divider`, sin sombra | igual, superficie `cap-card` |
  | 1 | dropdown, menú `⋮`, popover | `border-cap-divider shadow-md` | superficie `cap-card-2` |
  | 2 | modal, cajón lateral | `shadow-xl` sobre el overlay | superficie `cap-card-2`, mismo overlay |
  | Vidrio | marco, notificaciones, conmutador de módulos, toasts, tooltips, hoja «Más» | `cap-glass`: tinte translúcido, difuminado y borde de luz | tinte más denso |

- **Capas** fijas: `z-cap-header` 30, `z-cap-sidebar` 40, `z-cap-dropdown` 50, `z-cap-drawer` 60,
  `z-cap-modal` 70, `z-cap-toast` 80. Ningún otro `z-index`.
- **Área de interacción** mínima 40 × 40 px en celular y 32 × 32 px en escritorio, con 8 px entre
  objetivos. Un ícono de 20 px siempre vive dentro de un botón de 36 px o más.

## Regla del vidrio

**Vidrio para lo que flota sobre la app** (claro con texto oscuro en claro, ahumado en oscuro): el marco, los paneles de
notificaciones y del conmutador de módulos, los toasts, los tooltips, la barra de selección, la hoja «Más» y las etiquetas sobre fotos. **Superficie sólida para lo que se lee o se
decide con calma**: tarjetas de contenido, modales, avisos en línea e inputs. Dos excepciones: la
tarjeta del formulario de acceso, en vidrio blanco, y las columnas del tablero kanban, en el vidrio
del marco con las tarjetas sólidas dentro.

- El vidrio se escribe con `cap-glass` (o `cap-glass--light` el blanco del acceso) y las variables
  `--cap-glass-*`; nunca con `rgba(` ni `backdrop-filter` a mano.
- Sin `backdrop-filter`, o con `prefers-reduced-transparency: reduce`, el marco pasa a `--cap-frame`
  sólido y el acceso a `--cap-card`. `shell.css` ya lo resuelve; no lo repitas.
- Nunca vidrio sobre vidrio, ni sobre una tarjeta de contenido que el usuario deba leer.

## Pantalla de acceso

Iniciar sesión y recuperar contraseña comparten una misma pantalla. Es la única sin marco de
navegación. Se hace **siempre** con `<x-cap.login>` o `CapLogin` (React y Astro: `SHELL_SPEC.md`).

- **Escritorio (`lg` en adelante)**: lienzo con 12 px de relleno y manchones más intensos que
  en la app. Dos paneles del mismo alto y radio 28 px, separados 12 px. A la izquierda (~52 %) una
  **foto de faena** a sangre con velo oscuro inferior, una etiqueta de vidrio del marco arriba (logo y
  nombre del sistema) y, abajo, una tarjeta de vidrio del marco con una frase de qué hace el sistema
  y el `loginOwner` de la empresa instalada. A la derecha, la **tarjeta de vidrio blanco** con el formulario
  centrado (~380 px) y el botón de tema arriba a la derecha. Es la única tarjeta de vidrio.
- **Foto**: la provee cada sistema, de su propia área (acería, mina, puerto…), con `photoUrl`. El
  paquete no trae ninguna. Sin foto, el panel izquierdo usa el fondo del marco con manchones en profundo (`cap-wine`) y
  en color de marca (`cap-brand`).
- **Formulario abierto por defecto**: título «Ingresa a {sistema}» y subtítulo; Correo y Contraseña
  con la etiqueta arriba (campos sólidos de 46 px, radio 14, ver contraseña); «Mantener la sesión» y
  «¿Olvidaste tu contraseña?» en una fila; el botón «Ingresar» es el primario, con el degradado de
  marca, en píldora de ancho completo;
  divisor «o continúa con»; **Microsoft y Google lado a lado** abajo (solo los proveedores
  configurados; con uno, ancho completo); y la ayuda «¿Problemas para entrar?» con el correo de
  la mesa de ayuda. Los logos de terceros van a color, desde `logos/`.
- **Estados**: ingresando (botón con spinner y bloqueado), error de credenciales (aviso en línea con
  tinte de error (`status-error`) arriba del formulario y el campo marcado) y recuperar contraseña (mismo panel, aviso
  de éxito (`status-ok`) «Te enviamos el enlace» y «Volver a ingresar»). Nunca toasts en esta pantalla.
- **Celular (por debajo de `lg`)**: la foto ocupa el tercio superior con la etiqueta de marca y el
  botón de tema en vidrio del marco (claro en claro, ahumado en oscuro); la tarjeta de vidrio blanco sube sobre la foto hasta abajo.
- **En oscuro** la tarjeta pasa a vidrio oscuro, como el marco, con campos `cap-card`.

## Componentes

**Tablas**: cabecera `bg-cap-table-head text-cap-table-head-ink border-b border-cap-table-head-line`, Poppins
`text-xs font-semibold`, alineada igual que su columna; la casilla y el ícono de orden dentro de la cabecera usan `border-current` / `text-current`; `bg-cap-head` queda para barras de título
de panel y PDF. Dos densidades: **normal**, filas de 44 px con `px-3 py-2.5` (listados), y **compacta**, 36 px con `px-2 py-1.5 text-cap-dense` (reportes, detalle de
documentos, nómina). Alineación por tipo de dato: texto e identificadores a la izquierda; cifras,
montos y porcentajes a la derecha con `tabular-nums`; fechas a la izquierda con ancho fijo;
badges a la izquierda; columna de acciones a la derecha, sin título, 48 px, con un menú `⋮`
secundario. Enlace de la fila en color de marca (`cap-brand`). Cabecera fija en tablas de más de 20 filas: los
`th` llevan `lg:sticky lg:top-cap-below-header z-cap-header` y el contenedor de la receta `isolate`,
para que la cabecera quede debajo del header flotante y encima de las filas. Hover de fila `hover:bg-cap-card-2`; fila seleccionada con filo izquierdo de 3 px del color de marca y
el mismo fondo. Sin filas alternas. Textos largos en una línea con `truncate` y `title`; nunca
crece la altura de fila. Paginación: 25 por defecto, opciones 25/50/100, contador «1–25 de 1,240»
a la izquierda. Orden: `mdi-arrow-up`/`mdi-arrow-down` 16 px solo en la columna activa.
Por debajo de `lg` los listados pasan a tarjetas (receta «Tarjeta de lista móvil»). Solo las tablas
que no tienen sentido como tarjeta (reportes, nómina) mantienen la tabla, con `overflow-x-auto` y la
primera columna `sticky left-0`; nunca ocultar columnas sin aviso.

Selección múltiple: al marcar filas aparece `.cap-selection-bar` (vidrio, fija, centrada abajo, a
72 px del borde inferior; conteo y hasta tres acciones: `cap-button--secondary` y
`cap-button--danger`); solo en escritorio.

**Formularios**: etiqueta `text-xs font-semibold` encima del campo; input de 40 px, `rounded-cap-control`, fondo
`bg-cap-card`, borde `border-cap-input-line`, foco en borde y anillo negros. Placeholder
`placeholder:text-gray-500 dark:placeholder:text-gray-400`; es un ejemplo, nunca sustituye a la
etiqueta. Ayuda y error debajo en `text-xs`, el error en `status-error` y el input con
`border-cap-status-error`. Disposición: una columna por debajo de `md`, dos desde `md`
(`grid-cols-2 gap-x-6 gap-y-4`), nunca más de tres. Anchos fijos por tipo: fecha 160 px, monto
160 px (texto a la derecha, prefijo «L» dentro del campo), código/RTN 200 px, porcentaje 112 px;
texto libre a columna completa. Obligatorio: asterisco `text-cap-brand` tras la etiqueta y
`aria-required`; si casi todos lo son, se quita el asterisco, se deja `aria-required` y solo los
opcionales llevan «(opcional)». Solo lectura: sin
borde, fondo `cap-card-2`, texto normal. Contraseñas: botón de ícono dentro del campo para verla
(`mdi-eye-outline` / `mdi-eye-off-outline`, `aria-label` «Mostrar contraseña» / «Ocultar
contraseña»). Un ícono `-outline` a la izquierda del campo (`pl-10`) solo en pantallas de pocos
campos. Al enviar con errores: scroll y foco en el primer campo
con error; resumen arriba solo si hay más de tres. El primario se deshabilita y muestra
su spinner mientras envía (`aria-busy="true"`); nunca doble envío. Botones al pie, a la derecha:
«Cancelar» secundario y el primario con el verbo («Guardar cambios», no «Enviar»).

**Modales**: superficie sólida (no vidrio), `rounded-cap-shell`, cabecera con título `text-lg` y
cierre `×`, cuerpo con 24 px, acciones al pie a la derecha, sobre un overlay oscuro con
difuminado suave. `role="dialog" aria-modal="true" aria-labelledby`; foco atrapado dentro, foco
inicial en el primer campo (o en «Cancelar» si es destructivo), `Esc` cierra y el foco vuelve al
elemento que lo abrió. Un modal no abre otro modal; usar un paso dentro del mismo. Por debajo de
`md` ocupa toda la pantalla con las acciones fijas al pie.

**Confirmaciones y acciones destructivas**: toda acción que anule, elimine, cierre un período o
mueva dinero pide confirmación con `<x-cap.confirm-dialog>` o `CapConfirmDialog`, nunca con un modal
armado a mano. Es una tarjeta sólida de ~440 px, radio 24 y relleno 24, con ícono de 48 px en
círculo de tinte del estado (el de error, `status-error`, si es destructivo). Título con verbo y objeto («¿Anular la
factura 001-0001234?»), cuerpo con la consecuencia en una frase («Se generará una nota de crédito
y la cuenta por cobrar quedará cancelada. No se puede deshacer.»). «Cancelar» (secundario en
píldora) a la izquierda del destructivo, que repite el verbo («Anular factura»); nunca «Sí/No»,
«Aceptar» ni «OK». Foco inicial en «Cancelar»; `Esc` y `×` cancelan; clic fuera **no** cierra. Si
es irreversible y masivo, el botón destructivo queda deshabilitado hasta marcar una casilla (o escribir
el número de documento). Al confirmar: botón con spinner, toast de resultado y la fila cambia de
estado sin recargar. Vocabulario: los documentos fiscales se **anulan**; «Eliminar» solo para
registros sin efecto contable.

**Notificaciones y toasts**: son vidrio y vienen con el marco (`<x-cap.notifications>`,
`<x-cap.toaster>` y `window.capToast(...)` en Blade; `CapNotifications`, `CapToaster` y
`useToasts()` en Vue). El panel de notificaciones es un popover de vidrio del marco bajo la campana
(~360 px, radio 24): título y «Marcar todo como leído», filtros Todas / No leídas, grupos «Hoy» y
«Ayer», punto de error (`status-error`) en lo no leído y «Ver todas» al pie. El toast es una píldora de vidrio del marco
(~380 px, radio 20) con ícono en círculo del color del estado, título, detalle, acción opcional
(«Deshacer»), cierre `×` y una barra de tiempo restante. En la
esquina inferior derecha en escritorio y arriba a ancho completo en celular. Todos se cierran solos:
éxito e info a los 5 s; aviso, error y neutro a los 8 s (pausa al pasar el cursor o enfocar). Máximo 3
apilados, el más nuevo abajo. `role="status" aria-live="polite"` para éxito/info, `role="alert"` para error. Un toast
confirma el resultado de una acción; **no** sustituye la validación en línea ni el estado de error
de una pantalla. Para lo que condiciona la pantalla («Este período ya está cerrado») va un **aviso
en línea**, sólido con el tinte del estado, sin cierre automático (`<x-cap.alert>`, `CapAlert` o,
en React y Astro, receta «Aviso en línea»). Nunca un toast con fondo de color sólido.

**Navegación**: el sidebar, la barra superior, la tabbar y la hoja «Más» **son componentes del
marco** (`<x-cap.sidebar>`, `CapSidebar`…): se usan, no se arman con clases de Tailwind. El ítem
activo es una píldora de vidrio con filo del color de marca (`cap-brand`) de 3 px, el resto `text-cap-frame-ink-soft`. Íconos
de 20 px antes del texto. Las secciones del módulo van en el header (`sections`, de 2 a 5): píldoras
con `aria-current="page"` en la activa, todas en `text-cap-frame-ink` (la activa se distingue
por la píldora y el punto), y una fila sticky bajo la topbar en móvil. En React y Astro se sigue `shell/SHELL_SPEC.md`.

**Íconos**: solo Material Design Icons (`mdi-*`). Tres tamaños: 16 px (`text-base`) en badges,
chips y celdas; 20 px (`text-xl`) en botones, menú e inputs; 40 px en estados vacíos. Variante
`-outline` por defecto; la rellena solo para el ítem activo del menú y para estados
(`mdi-check-circle`, `mdi-alert-circle`). El ícono hereda el color del texto. Botón de solo ícono
con `aria-label` y tooltip; ícono decorativo junto a texto con `aria-hidden="true"`. Un ícono
nunca es el único portador de significado. Sin emojis ni otro set.

**Tableros y tarjetas de datos**: cifra `font-display text-3xl font-semibold tabular-nums`, etiqueta
`text-xs` en `text-cap-text-soft` y una flecha `mdi-arrow-top-right` (↗) en un círculo arriba a la
derecha cuando la tarjeta lleva a un detalle. Tres variantes de la tarjeta de cifra (receta «Tarjeta
de cifra»): **normal** (`cap-card`), **destacada** con degradado (`bg-cap-gradient-featured`, ícono en círculo blanco con el ícono en profundo (`cap-wine`), variación en chip blanco translúcido, texto blanco) y
**de alerta** con el tinte de error (`bg-cap-status-error-tint`, borde `border-cap-status-error-tint-border`). La destacada es la única
tarjeta de color sólido permitida: **una por fila** de tarjetas de cifra y para lo principal, nunca
para decorar. Los contadores de estado van en mosaico, los filtros como segmentado y, en celular, los
listados como tarjetas (recetas más abajo).

**Botones**: primario con degradado de marca (uno por pantalla), secundario de contorno neutro,
destructivo con contorno de error (`status-error`), y `cap-button--danger-solid` solo en el botón de aceptar de la
confirmación. Detalle en «Reglas de color».

**Segmentado**: para elegir entre 2 y 5 opciones excluyentes (filtro de estado, vista, periodo). Se
hace con `CapSegmented` o `<x-cap.segmented>`; la opción activa es una píldora en profundo (`cap-wine`) con texto blanco
que se desliza de una opción a otra. Con más de 5 opciones, `<select>`.

**Tablero kanban**: para trabajo que avanza por etapas y se gestiona a mano (cobranza, mantenciones,
pipeline de ventas, tickets); si solo se consulta o se filtra, va tabla. Se hace con `CapKanban` o
`<x-cap.kanban>`: columnas de vidrio del marco de 300 px con las tarjetas dentro, cada una con borde
y sombra. El color de la columna es estado, no identidad: un punto en neutro, `info`, `ok`,
`warning` o `error` según la etapa (por contactar neutro, en gestión `info`, promesa `ok`, escalado
`error`). En la tarjeta, el punto de prioridad va en error si es alta, en advertencia si es media y
neutro si es normal; el vencimiento es el badge (error «Vencida 14 d», advertencia «Vence en 3 d»,
neutro con la fecha, `ok` para promesas) y la tarjeta bloqueada lleva el filo izquierdo de error.
Arrastrar nunca es la única forma: teclado y «Mover a…» en el menú ⋮, que la app arma con las
columnas. En celular se ve una columna a la vez, elegida con el segmentado de arriba del tablero.

**Módulos**: la portada de módulos se arma con `CapModuleGrid` o `<x-cap.module-grid>` (grupos de
tarjetas bajas, tantas columnas de 236 px como quepan: en un monitor ancho cada grupo es una sola
fila y la portada entera cabe sin scroll) y `CapModuleRecent` o `<x-cap.module-recent>` («Continuar»,
una sola fila que se desplaza; la lista la llena la app); el saludo es HTML de la receta y va en una
línea (eyebrow, nombre y pista corta: «Tienes acceso a 9 módulos»). Cada tarjeta lleva la baldosa en
el tinte de marca a la izquierda, nombre y descripción de una línea (el texto completo queda en el
`title`) a la derecha, y al pie el contador de trabajo pendiente, el último uso y la flecha. A lo sumo una tarjeta destacada por grupo (baldosa con
`bg-cap-gradient-primary`), la fijada o la más usada, lo decide la app. El contador va en el tinte de
marca si es trabajo normal («3 por aprobar») y en el tinte de estado si es error («6 vencidas») o
advertencia («2 bajo mínimo»); error es error en cualquier marca. La estrella fija el módulo: en Vue
emite `pin` y en Blade despacha `cap:module-pin`; la app lo guarda. Un módulo sin acceso se muestra
igual, punteado (`cap-module-card--locked`), con candado, «Sin acceso» y «Solicitar acceso», nunca
se esconde. Cargando, `CapSkeleton variant="stats"`; sin módulos, el estado vacío. El conmutador
(`cap-module-switcher`) es un popover de vidrio del marco como el de notificaciones, con los módulos
en tres columnas y el actual en la píldora activa; viene con el layout.

**Gráficas**: colores con `chartColors()` de `chart-colors.js` (en claro color de marca (`cap-brand`),
negro, neutro cálido (`cap-taupe`) y `cap-red-200`; en oscuro suave (`cap-brand-soft`), `cap-red-200`,
color de marca y profundo (`cap-wine`)). El orden está validado para daltonismo: usa
`series` desde el primero y sin saltarte colores, y a cada dato le toca siempre el mismo color.
`status.*` para series con significado de estado. Toda gráfica de dos o más series lleva leyenda; la
tercera y la cuarta tienen poco contraste con la tarjeta, así que además llevan etiquetas visibles o
una tabla. Recalcular al cambiar de tema. Máximo cuatro series; si hay más, agrupar en «Otros» o
dividir. Rejilla en `grid`,
ejes y etiquetas en `text` a 12 px con `tabular-nums`, tooltips de gráfica sólidos con elevación 1. Relleno de área
plano al 12 %, sin degradados ni 3D.

**Estados transversales**: deshabilitado `opacity-50 cursor-not-allowed pointer-events-none`
sobre el mismo diseño, con tooltip del motivo cuando no sea obvio; nunca ocultar el control.
Seleccionado (fila, tarjeta): `bg-cap-card-2` más filo o borde de 2 px en color de marca
(`cap-brand`); nunca fondo de color.

## Recetario

Clases exactas para lo más común. Copiar tal cual; cambiar solo texto, íconos y el estado.

**Botones** (`CapButton` en Vue y `<x-cap.button>` en Blade, con `variant` `primary`, `secondary`, `danger` o `danger-solid`, `href`, `icon` y `loading`; en React y Astro, estas clases)
```html
<button type="button" class="cap-button cap-button--primary">Guardar cambios</button>
<button type="button" class="cap-button cap-button--secondary">Cancelar</button>
<button type="button" class="cap-button cap-button--danger">Anular factura</button>
<button type="button" class="cap-button cap-button--danger-solid">Anular factura</button>
```
`cap-button--danger-solid` solo va en el botón de aceptar de la confirmación, que ya lo pone el componente; en cualquier otro lugar, `cap-button--danger`.
Mientras envía: `disabled aria-busy="true"`; el spinner lo pone la clase.

**Botón de ícono** (36 × 36 px, con `aria-label` y `title`)
```html
<button type="button" aria-label="Cerrar" title="Cerrar" class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-cap-text-soft transition-colors duration-cap-fast ease-cap hover:bg-cap-card-2 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-cap-chrome focus-visible:ring-offset-2 focus-visible:ring-offset-cap-card dark:hover:text-gray-100 dark:focus-visible:ring-gray-100"><i class="mdi mdi-close text-xl leading-none" aria-hidden="true"></i></button>
```
Sobre una superficie oscura sólida: `text-cap-on-chrome-soft hover:text-white focus-visible:ring-white focus-visible:ring-offset-cap-chrome` (los botones del header ya vienen en el componente).

**Tarjeta / panel**
```html
<section class="rounded-cap-card border border-cap-divider bg-cap-card p-5">…</section>
```

**Tabla**
```html
<div class="isolate rounded-cap-card border border-cap-divider bg-cap-card">
  <table class="w-full border-separate border-spacing-0 text-sm text-gray-900 dark:text-gray-100">
    <thead>
      <tr>
        <th class="rounded-tl-cap-card bg-cap-table-head px-3 py-2.5 text-left font-display text-xs font-semibold text-cap-table-head-ink border-b border-cap-table-head-line">Factura</th>
        <th class="rounded-tr-cap-card bg-cap-table-head px-3 py-2.5 text-right font-display text-xs font-semibold text-cap-table-head-ink border-b border-cap-table-head-line">Total (L)</th>
      </tr>
    </thead>
    <tbody class="[&>tr:last-child>td:first-child]:rounded-bl-cap-card [&>tr:last-child>td:last-child]:rounded-br-cap-card">
      <tr class="transition-colors duration-cap-fast ease-cap hover:bg-cap-card-2">
        <td class="h-11 border-t border-cap-divider px-3"><a href="#" class="font-medium text-cap-brand hover:underline dark:text-cap-brand-soft">F-000123</a></td>
        <td class="h-11 border-t border-cap-divider px-3 text-right tabular-nums">1,250.00</td>
      </tr>
    </tbody>
  </table>
</div>
```
La casilla y el ícono de orden dentro de la cabecera usan `border-current` / `text-current`.
`tbody class="cap-stagger-rows"` es opcional: escalona las primeras 8 filas, solo en el primer montaje. Al ordenar, filtrar o paginar se quita la clase.

**Badge de estado** (`statusBadgeClass('ok' | 'error' | 'warning' | 'info' | 'neutral')`)
```html
<span :class="statusBadgeClass('ok')"><span class="h-1.5 w-1.5 rounded-full bg-current"></span>Pagado</span>
```

**Campo de formulario** (etiqueta, input, ayuda, error)
```html
<label for="name" class="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">Nombre <span class="text-cap-brand dark:text-cap-brand-soft">*</span></label>
<input id="name" aria-required="true" class="block h-10 w-full rounded-cap-control border border-cap-input-line bg-cap-card px-3 text-sm text-gray-900 placeholder:text-gray-500 transition-colors duration-cap-fast ease-cap focus:border-cap-chrome focus:outline-none focus:ring-1 focus:ring-cap-chrome disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-100 dark:placeholder:text-gray-400 dark:focus:border-gray-100 dark:focus:ring-gray-100">
<p class="mt-1 text-xs text-cap-text-soft">Como aparece en el RTN.</p>
<p class="mt-1 text-xs text-cap-status-error dark:text-cap-status-dark-error">El nombre es obligatorio.</p>
```
Con error, el input cambia `border-cap-input-line` y las clases `focus:` de color por
`border-cap-status-error focus:border-cap-status-error focus:ring-cap-status-error`. Si el proyecto usa `@tailwindcss/forms`, estas clases anulan su
anillo azul.

**Campo con ícono y ver contraseña** (el input es el del campo de formulario con `pl-10` y, si hay botón, `pr-10`; la pantalla de acceso ya lo trae en su componente)
```html
<div class="relative">
  <i class="mdi mdi-lock-outline pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xl leading-none text-cap-text-soft" aria-hidden="true"></i>
  <input id="password" type="password" class="[campo de formulario] pl-10 pr-10">
  <button type="button" aria-label="Mostrar contraseña" title="Mostrar contraseña" class="[botón de ícono] absolute right-0.5 top-1/2 -translate-y-1/2"><i class="mdi mdi-eye-outline text-xl leading-none" aria-hidden="true"></i></button>
</div>
```
Al mostrarla, el input pasa a `type="text"`, el ícono a `mdi-eye-off-outline` y el `aria-label` a «Ocultar contraseña».

**Modal** (formularios y contenido; las confirmaciones usan el componente)
```html
<div class="fixed inset-0 z-cap-modal bg-cap-chrome/35 backdrop-blur-sm animate-cap-fade-in"></div>
<div role="dialog" aria-modal="true" aria-labelledby="modal-title" class="fixed inset-x-4 top-[10vh] z-cap-modal mx-auto w-full max-w-lg animate-cap-rise-in rounded-cap-shell border border-cap-divider bg-cap-card shadow-xl">
  <header class="flex items-center justify-between border-b border-cap-divider px-6 py-4">
    <h2 id="modal-title" class="font-display text-lg font-semibold text-gray-900 dark:text-gray-100">Anular factura</h2>
    <button aria-label="Cerrar" class="rounded-full p-1 text-cap-text-soft transition-colors duration-cap-fast ease-cap hover:bg-cap-card-2 hover:text-gray-900 dark:hover:text-gray-100"><i class="mdi mdi-close text-xl" aria-hidden="true"></i></button>
  </header>
  <div class="p-6 text-sm text-gray-700 dark:text-gray-300">…</div>
  <footer class="flex justify-end gap-2 border-t border-cap-divider px-6 py-4">[secundario] [primario o destructivo]</footer>
</div>
```

**Estado vacío**
```html
<div class="flex flex-col items-center justify-center rounded-cap-card border border-dashed border-cap-divider px-6 py-12 text-center">
  <i class="mdi mdi-inbox-outline text-cap-icon text-gray-400" aria-hidden="true"></i>
  <p class="mt-3 font-display text-base font-semibold text-gray-900 dark:text-gray-100">Aún no hay facturas</p>
  <p class="mt-1 text-sm text-cap-text-soft">Crea la primera para empezar a cobrar.</p>
  <div class="mt-4">[botón primario]</div>
</div>
```

**Esqueleto de carga** (`CapSkeleton` o `<x-cap.skeleton>`; `variant`: `table`, `stats`, `line` o `kanban`)
```html
<x-cap.skeleton variant="stats" />
<x-cap.skeleton variant="table" :rows="6" />
<x-cap.skeleton variant="kanban" />
<span class="cap-skeleton w-40"></span>
```
Toda carga que pase de 120 ms muestra esqueleto con la forma del contenido, en lugar de una pantalla
en blanco o un spinner. Por debajo de 120 ms no se muestra, para que no parpadee. La cabecera del esqueleto de tabla usa `var(--cap-table-head)`, como la cabecera de tabla.

**Aviso en línea** (`status`: `ok`, `info`, `warning` o `error`; en Blade y Vue es el componente)
```html
<div role="alert" class="cap-alert cap-alert--error">
  <i class="cap-alert__icon mdi mdi-alert-circle-outline" aria-hidden="true"></i>
  <div><strong class="cap-alert__title">Este período ya está cerrado</strong><span class="cap-alert__detail">Abre uno nuevo para registrar facturas.</span></div>
</div>
```
Para `ok`, `info` y `warning`, `role="status"` y los íconos `check-circle-outline`, `information-outline` y `alert-outline`.

**Tarjeta de cifra** normal, destacada y de alerta (una destacada por fila; la flecha ↗ solo si la tarjeta lleva a un detalle)
```html
<a href="#" class="block rounded-cap-card border border-cap-divider bg-cap-card p-5 transition-transform duration-cap-fast ease-cap hover:-translate-y-0.5">
  <div class="flex items-start justify-between">
    <p class="text-xs font-medium text-cap-text-soft">Cobrado este mes</p>
    <span class="flex h-8 w-8 items-center justify-center rounded-full bg-cap-card-2 text-cap-text-soft" aria-hidden="true"><i class="mdi mdi-arrow-top-right text-base leading-none"></i></span>
  </div>
  <p class="mt-3 font-display text-3xl font-semibold tabular-nums text-gray-900 dark:text-gray-100">L 48,300.00</p>
</a>
```
Destacada (degradado): cambiar el contenedor por `rounded-cap-card bg-cap-gradient-featured p-5 text-white`, la etiqueta por `text-cap-red-200` y el círculo de la flecha por `bg-white text-cap-red-800`, con la variación en un chip `bg-white/15`.
Alerta (tinte de error, `status-error`): `rounded-cap-card border border-cap-status-error-tint-border bg-cap-status-error-tint p-5`, la cifra y la etiqueta con su ícono `mdi-alert-circle-outline` en `text-cap-status-error-ink` (alias de rol, sin `dark:`).

**Barra de acciones de la página** (primera fila del contenido; el título ya está en el header)
```html
<div class="flex flex-wrap items-center justify-between gap-3">
  <p class="text-sm text-cap-text-soft">Facturas emitidas este período</p>
  <div class="flex items-center gap-2">[secundario] [primario]</div>
</div>
```

**Selector y área de texto** (para más de 5 opciones; de 2 a 5 va el segmentado; mismas clases del input del campo de formulario, con la flecha nativa)
```html
<select id="status" class="[input del campo de formulario] dark:[color-scheme:dark]">…</select>
<textarea id="notes" rows="4" class="[input del campo de formulario, cambiando h-10 por py-2]"></textarea>
```
Los campos de fecha también llevan `dark:[color-scheme:dark]`, para que su ícono se vea en oscuro.

**Paginación** (debajo de la tabla)
```html
<nav aria-label="Paginación" class="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-cap-text-soft">
  <p class="tabular-nums">1–25 de 1,240</p>
  <div class="flex items-center gap-2">
    <label class="flex items-center gap-2">Por página <select class="[selector, cambiando w-full por w-20]">…</select></label>
    <button type="button" aria-label="Página anterior" title="Página anterior" class="[botón de ícono]"><i class="mdi mdi-chevron-left text-xl leading-none" aria-hidden="true"></i></button>
    <button type="button" aria-label="Página siguiente" title="Página siguiente" class="[botón de ícono]"><i class="mdi mdi-chevron-right text-xl leading-none" aria-hidden="true"></i></button>
  </div>
</nav>
```

**Menú `⋮` de fila** (en Vue, `usePopover(id)` de `design/vue/composables/` cierra con `Esc` y clic fuera)
```html
<div class="relative">
  <button type="button" aria-label="Acciones de F-000123" title="Acciones" aria-haspopup="menu" aria-expanded="false" class="[botón de ícono]"><i class="mdi mdi-dots-vertical text-xl leading-none" aria-hidden="true"></i></button>
  <div role="menu" class="absolute right-0 top-full z-cap-dropdown mt-1 w-48 rounded-cap-control border border-cap-divider bg-cap-card py-1 shadow-md dark:bg-cap-card-2">
    <a role="menuitem" href="#" class="flex h-10 items-center gap-2 px-3 text-sm text-gray-800 transition-colors duration-cap-fast ease-cap hover:bg-cap-card-2 dark:text-gray-100 dark:hover:bg-cap-card"><i class="mdi mdi-eye-outline text-xl leading-none" aria-hidden="true"></i>Ver detalle</a>
    <button role="menuitem" type="button" class="flex h-10 w-full items-center gap-2 px-3 text-sm text-cap-status-error-ink transition-colors duration-cap-fast ease-cap hover:bg-cap-card-2 dark:hover:bg-cap-card"><i class="mdi mdi-cancel text-xl leading-none" aria-hidden="true"></i>Anular factura</button>
  </div>
</div>
```

**Datos de un registro** (detalle: etiqueta encima del valor, dos columnas desde `md`)
```html
<dl class="grid gap-x-6 gap-y-4 md:grid-cols-2">
  <div>
    <dt class="text-xs font-medium text-cap-text-soft">Cliente</dt>
    <dd class="mt-1 text-sm text-gray-900 dark:text-gray-100">Cliente de ejemplo</dd>
  </div>
</dl>
```

**Historial** (lo más reciente arriba, dentro de una tarjeta)
```html
<ol class="space-y-4">
  <li class="flex gap-3">
    <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cap-card-2 text-cap-text-soft" aria-hidden="true"><i class="mdi mdi-file-document-outline text-base leading-none"></i></span>
    <div class="min-w-0">
      <p class="text-sm font-medium text-gray-900 dark:text-gray-100">Factura creada</p>
      <p class="text-xs text-cap-text-soft">Ana Muñoz, 5 mar 2026, 8:15 a. m.</p>
    </div>
  </li>
</ol>
```

**Página de error** (dentro del marco si hay sesión; sin marco, sobre `bg-cap-page`, si no la hay)
```html
<main class="flex min-h-screen items-center justify-center bg-cap-page p-6">
  <div class="max-w-md text-center">
    <i class="mdi mdi-compass-off-outline text-cap-icon text-gray-400" aria-hidden="true"></i>
    <h1 class="mt-3 font-display text-2xl font-semibold text-gray-900 dark:text-gray-100">No encontramos esta página</h1>
    <p class="mt-1 text-sm text-cap-text-soft">Puede que el enlace esté mal escrito o que el registro ya no exista.</p>
    <div class="mt-4">[botón primario «Volver al inicio»]</div>
  </div>
</main>
```
El título dice qué pasó y el texto cómo seguir; el código (403, 404, 409, 500) va en el texto solo si ayuda a soporte.

**Tarjeta de lista móvil** (ícono, título, monto y badge; reemplaza a la fila de tabla por debajo de `lg`; para filtrar, el segmentado)
```html
<a href="#" class="flex min-h-16 items-center gap-3 rounded-cap-card border border-cap-divider bg-cap-card p-4">
  <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-cap-control bg-cap-red-200 text-cap-red-800 dark:bg-cap-red-600/20 dark:text-cap-brand-soft" aria-hidden="true"><i class="mdi mdi-file-document-outline text-xl leading-none"></i></span>
  <span class="min-w-0 flex-1">
    <span class="block truncate text-sm font-semibold text-gray-900 dark:text-gray-100">F-000123 · Cliente de ejemplo</span>
    <span class="block text-xs text-cap-text-soft">5 mar 2026</span>
  </span>
  <span class="flex shrink-0 flex-col items-end gap-1">
    <span class="text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-100">L 1,250.00</span>
    <span :class="statusBadgeClass('ok')"><span class="h-1.5 w-1.5 rounded-full bg-current"></span>Pagado</span>
  </span>
</a>
```

**Segmentado** (de 2 a 5 opciones excluyentes; reemplaza a los chips de filtro y al selector corto)
```vue
<CapSegmented v-model="status" label="Filtrar por estado" :items="[{ label: 'Todas', value: 'all', count: 24 }, { label: 'Vencidas', value: 'overdue', count: 3 }]" />
```
```blade
<x-cap.segmented :items="$statusItems" :value="$status" label="Filtrar por estado" />
```
Con `href` en cada ítem es navegación (`linkComponent` y `linkProp` para Inertia o vue-router); sin él, cada botón dispara `cap:segmented-change` con `detail.value`. En React y Astro, el marcado de referencia está en `design/shell/reference/app.html`.

**Tablero kanban** (`CapKanban` o `<x-cap.kanban>`; en Blade la app escucha `cap:kanban-move`)
```vue
<CapKanban :columns="stages" :cards="invoices" label="Tablero de cobranza" @move="saveMove" @card-menu="openCardMenu" />
```
```blade
<x-cap.kanban :columns="$stages" :cards="$invoices" label="Tablero de cobranza" />
```
```html
<div class="cap-segmented cap-kanban__picker" role="group" aria-label="Etapa" data-cap-pill-nav data-cap-kanban-picker>
  <span class="cap-segmented__pill" aria-hidden="true" data-cap-pill></span>
  <button class="cap-segmented__item" type="button" value="por-contactar" aria-pressed="true">Por contactar</button>
  <button class="cap-segmented__item" type="button" value="cerrado" aria-pressed="false">Cerrado</button>
</div>
<section class="cap-kanban" aria-label="Tablero de cobranza" data-cap-kanban>
  <div class="cap-kanban__column" data-cap-kanban-column="por-contactar" data-tone="neutral">
    <header class="cap-kanban__head">
      <span class="cap-kanban__dot" aria-hidden="true"></span>
      <h3 class="cap-kanban__title">Por contactar</h3>
      <span class="cap-kanban__count" data-cap-kanban-count>2</span>
      <button class="cap-kanban__action" type="button" aria-label="Agregar en Por contactar"><i class="mdi mdi-plus" aria-hidden="true"></i></button>
      <button class="cap-kanban__action" type="button" aria-label="Opciones de la columna"><i class="mdi mdi-dots-horizontal" aria-hidden="true"></i></button>
    </header>
    <div class="cap-kanban__list" data-cap-kanban-list>
      <article class="cap-kanban-card" data-cap-kanban-card="F-10232" tabindex="0" draggable="true">
        <div class="cap-kanban-card__top"><span class="cap-kanban-card__priority" role="img" aria-label="Prioridad alta" data-level="high"></span><span>F-10232</span><button class="cap-kanban-card__menu" type="button" aria-label="Más acciones"><i class="mdi mdi-dots-vertical" aria-hidden="true"></i></button></div>
        <p class="cap-kanban-card__title">Puerto Talca · 3 facturas sin respuesta</p>
        <div class="cap-kanban-card__row"><span class="cap-kanban-card__amount">L 4.2 M</span><span class="cap-kanban-card__badge" data-status="error"><i class="mdi mdi-clock-alert-outline" aria-hidden="true"></i>Vencida 14 d</span></div>
        <div class="cap-kanban-card__foot"><span class="cap-kanban-card__avatars"><span class="cap-kanban-card__avatar" title="Ana Muñoz">AM</span></span><span class="cap-kanban-card__tag">Retail</span><span class="cap-kanban-card__meta"><i class="mdi mdi-comment-outline" aria-hidden="true"></i>2</span></div>
      </article>
      <article class="cap-kanban-card cap-kanban-card--blocked" data-cap-kanban-card="F-10188" tabindex="0" draggable="true">
        <div class="cap-kanban-card__top"><span class="cap-kanban-card__priority" role="img" aria-label="Prioridad media" data-level="medium"></span><span>F-10188</span><button class="cap-kanban-card__menu" type="button" aria-label="Más acciones"><i class="mdi mdi-dots-vertical" aria-hidden="true"></i></button></div>
        <p class="cap-kanban-card__title">Comercial Andina · Espera respuesta de legal</p>
        <div class="cap-kanban-card__row"><span class="cap-kanban-card__amount">L 1.8 M</span><span class="cap-kanban-card__badge" data-status="warning"><i class="mdi mdi-clock-outline" aria-hidden="true"></i>Vence en 3 d</span></div>
      </article>
    </div>
    <button class="cap-kanban__add" type="button">Agregar tarjeta</button>
  </div>
  <div class="cap-kanban__column" data-cap-kanban-column="cerrado" data-tone="ok">
    <header class="cap-kanban__head">
      <span class="cap-kanban__dot" aria-hidden="true"></span>
      <h3 class="cap-kanban__title">Cerrado</h3>
      <span class="cap-kanban__count" data-cap-kanban-count>0</span>
      <button class="cap-kanban__action" type="button" aria-label="Opciones de la columna"><i class="mdi mdi-dots-horizontal" aria-hidden="true"></i></button>
    </header>
    <div class="cap-kanban__list" data-cap-kanban-list>
      <div class="cap-kanban__empty"><i class="mdi mdi-tray-arrow-down" aria-hidden="true"></i><p>Aún no se cierra ninguna gestión.</p><p>Arrastra una tarjeta aquí cuando se pague.</p></div>
    </div>
  </div>
  <p class="cap-kanban__live" aria-live="polite"></p>
</section>
```
El segmentado va antes del tablero y en el mismo contenedor; solo se ve por debajo de `lg`. Cada movimiento despacha `cap:kanban-move` en el tablero con `detail = { cardId, from, fromIndex, to, index }`; si la app no pudo guardar, devuelve la tarjeta con `moveCard(cardId, from, fromIndex)` de `bindKanban`, que no vuelve a despachar. En Vue, la app actualiza `cards` al recibir `move`; para rechazar, no lo actualices: el tablero vuelve solo. Una columna con `data-wip-limit="5"` y un `<span class="cap-kanban__wip"></span>` en la cabecera muestra el límite de trabajo en curso; nunca impide soltar. El menú ⋮ de la tarjeta es el menú de fila e incluye «Mover a…» con las columnas. En React y Astro, el marcado completo está en `design/shell/reference/kanban.html`.

**Portada de módulos** (`CapModuleGrid` y `CapModuleRecent`, o `<x-cap.module-grid>` y `<x-cap.module-recent>`; el saludo es este HTML)
```vue
<CapModuleRecent :items="recentAccesses" />
<CapModuleGrid :modules="modules" @pin="savePinned" @request="requestAccess" />
```
```blade
<x-cap.module-recent :items="$recentAccesses" />
<x-cap.module-grid :modules="$modules" />
```
```html
<div class="cap-module-home">
  <small class="cap-module-home__eyebrow">Buenos días,</small>
  <h2 class="cap-module-home__name">Ana</h2>
  <p class="cap-module-home__hint">Tienes acceso a 9 módulos.</p>
</div>
<nav class="cap-module-recent" aria-label="Continuar donde quedaste">
  <span class="cap-module-recent__label">Continuar</span>
  <a class="cap-module-recent__link" href="/cobranza/tablero"><i class="mdi mdi-cash-multiple" aria-hidden="true"></i>Cobranza <small>› Tablero</small></a>
</nav>
<section class="cap-module-group" aria-labelledby="cap-module-group-1">
  <div class="cap-module-group__head">
    <h3 id="cap-module-group-1" class="cap-module-group__title">Finanzas</h3>
    <span class="cap-module-group__count">3 módulos</span>
  </div>
  <div class="cap-module-grid">
    <a class="cap-module-card cap-module-card--featured" href="/tesoreria" aria-labelledby="cap-module-tesoreria-name">
      <div class="cap-module-card__top">
        <span class="cap-module-tile"><i class="mdi mdi-bank-outline" aria-hidden="true"></i></span>
        <button class="cap-module-card__pin" type="button" aria-label="Fijar Tesorería" aria-pressed="true" data-cap-module-pin="tesoreria"><i class="mdi mdi-star" aria-hidden="true"></i></button>
      </div>
      <div>
        <h4 class="cap-module-card__name" id="cap-module-tesoreria-name">Tesorería</h4>
        <p class="cap-module-card__desc" title="Bancos, conciliación y flujo de caja.">Bancos, conciliación y flujo de caja.</p>
      </div>
      <div class="cap-module-card__foot"><span class="cap-module-card__count">1 conciliación</span><span>Hoy, 08:12</span><i class="cap-module-card__arrow mdi mdi-arrow-right" aria-hidden="true"></i></div>
    </a>
    <a class="cap-module-card" href="/contabilidad" aria-labelledby="cap-module-contabilidad-name">
      <div class="cap-module-card__top">
        <span class="cap-module-tile"><i class="mdi mdi-book-open-variant" aria-hidden="true"></i></span>
        <button class="cap-module-card__pin" type="button" aria-label="Fijar Contabilidad" aria-pressed="false" data-cap-module-pin="contabilidad"><i class="mdi mdi-star-outline" aria-hidden="true"></i></button>
      </div>
      <div>
        <h4 class="cap-module-card__name" id="cap-module-contabilidad-name">Contabilidad</h4>
        <p class="cap-module-card__desc" title="Asientos, centros de costo y cierre mensual.">Asientos, centros de costo y cierre mensual.</p>
      </div>
      <div class="cap-module-card__foot"><span class="cap-module-card__count" data-status="error">4 asientos descuadrados</span><span>Ayer</span><i class="cap-module-card__arrow mdi mdi-arrow-right" aria-hidden="true"></i></div>
    </a>
    <div class="cap-module-card cap-module-card--locked" role="group" aria-label="Nómina, sin acceso">
      <div class="cap-module-card__top">
        <span class="cap-module-tile"><i class="mdi mdi-lock-outline" aria-hidden="true"></i></span>
      </div>
      <div>
        <h4 class="cap-module-card__name">Nómina</h4>
        <p class="cap-module-card__desc" title="Liquidaciones, planillas y beneficios.">Liquidaciones, planillas y beneficios.</p>
      </div>
      <div class="cap-module-card__foot"><span>Sin acceso</span><button class="cap-module-card__request" type="button" data-cap-module-request="nomina">Solicitar acceso</button></div>
    </div>
  </div>
</section>
```
Cada módulo es `{ id, name, description, icon, href, group, pending?: { label, status? }, lastUsed?, pinned?, featured?, granted?, requestHref? }`; `icon` va sin `mdi-`, `pending.status` es `brand` (por defecto), `error` o `warning`, y `lastUsed` llega ya formateado. Los grupos salen de `group` en orden de aparición y cada uno se rotula con su `h3` (`id="cap-module-group-<índice>"`, desde 0). La estrella no navega: en Vue el componente alterna su estado y emite `pin` con `{ id, pinned }`; en Blade y HTML `shell-auto.js` lo alterna y despacha `cap:module-pin` con `detail = { id, pinned }` desde el botón (burbujea, la app escucha en `document` y guarda). «Solicitar acceso» es un enlace si el módulo trae `requestHref`; si no, un botón que emite `request` con `{ id }` o despacha `cap:module-request`. `CapModuleRecent` no pinta nada con la lista vacía. Con Inertia o vue-router, `linkComponent` y `linkProp` en ambos. En React y Astro, el marcado completo está en `design/shell/reference/modules.html`.

**Conmutador de módulos** (la prop `modules` del layout; el panel solo, para quien no use el layout)
```vue
<CapAppLayout title="Tablero" system-name="Cobranza" :modules="modules" modules-href="/">…</CapAppLayout>
```
```blade
<x-cap.app-layout title="Tablero" system-name="Cobranza" :modules="$modules" modules-href="/">…</x-cap.app-layout>
```
```html
<!-- en .cap-shell-header__actions, antes de la campana -->
<button class="cap-shell-header__icon-button" type="button" aria-label="Cambiar de módulo" aria-expanded="false" aria-controls="cap-modules" data-cap-popover-trigger><i class="mdi mdi-apps" aria-hidden="true"></i></button>
<!-- hermano del header dentro de .cap-shell, como el panel de notificaciones -->
<section class="cap-module-switcher cap-glass" id="cap-modules" aria-label="Cambiar de módulo" hidden>
  <div class="cap-module-switcher__head">
    <span>Módulos</span>
    <a class="cap-module-switcher__all" href="/">Ver todos</a>
  </div>
  <div class="cap-module-switcher__grid">
    <a class="cap-module-switcher__item" href="/cobranza" aria-current="true"><span class="cap-module-tile"><i class="mdi mdi-cash-multiple" aria-hidden="true"></i></span>Cobranza</a>
    <a class="cap-module-switcher__item" href="/ventas"><span class="cap-module-tile"><i class="mdi mdi-cart-outline" aria-hidden="true"></i></span>Ventas</a>
  </div>
</section>
```
Cada módulo del conmutador es `{ id, name, icon, href, current? }` y `current` marca el módulo en el que estás; el layout quita los bloqueados (`granted` falsy) antes de pasarlos al header y a la hoja «Más», así que sirve la misma lista de la portada. `modulesHref` / `modules-href` es el «Ver todos» (normalmente la portada); vacío, no se pinta. Sin `modules` el header queda igual que antes. Abre y cierra como el panel de notificaciones (clic, `Esc`, clic fuera) y nunca están los dos abiertos. En móvil el panel no existe: la hoja «Más» lista los módulos bajo «Módulos». Fuera del layout, `CapModuleSwitcher` o `<x-cap.module-switcher :modules all-href>` pintan el panel con la lista tal cual: pásales solo los módulos con acceso.

**Tarjetas anidadas** (la única tarjeta dentro de tarjeta permitida)
```html
<section class="rounded-cap-card border border-cap-divider bg-cap-card p-5">
  <div class="flex flex-col gap-3">
    <div class="rounded-cap-control bg-cap-red-50 border border-cap-red-100 dark:bg-cap-red-600/15 dark:border-cap-brand-soft/30 p-3">…la principal…</div>
    <div class="rounded-cap-control bg-cap-card-2 p-3">…</div>
    <div class="rounded-cap-control bg-cap-card-2 p-3">…</div>
  </div>
</section>
```
Las secundarias son `rounded-cap-control bg-cap-card-2 p-3`; la principal, `bg-cap-red-50` con su borde. Nunca más de un nivel de anidado.

**Barra de selección** (aparece al marcar filas; vidrio, fija abajo y centrada; solo en escritorio)
```html
<div class="cap-selection-bar cap-glass" role="region" aria-label="Facturas seleccionadas" hidden>
  <span class="cap-selection-bar__count" aria-live="polite"></span>
  <button class="cap-button cap-button--secondary" type="button">Exportar</button>
  <button class="cap-button cap-button--danger" type="button">Anular</button>
</div>
```
Se muestra al quitar `hidden` y el conteo se escribe en `.cap-selection-bar__count`. Hasta tres acciones.

**Cifra que cuenta** (la cifra sube de 0 al valor al montar la pantalla)
```html
<p class="font-display text-3xl font-semibold tabular-nums" data-cap-count="248300000" data-cap-format="currency-compact">L 248.3 M</p>
```
`data-cap-format` es `currency-compact`, `integer` o `percent`; el texto interno es el valor final, para quien no tiene JavaScript. `initShell` la anima; en Vue, `bindCountUp(el)` de `shell/js/count-up.js` en `onMounted`. En Vue, deja la interpolación `{{ }}` como único hijo del elemento y pon el valor numérico en `:data-cap-count`; el módulo escribe en ese mismo nodo de texto, así que las actualizaciones posteriores de Vue muestran el valor nuevo sin volver a animar.

**Contadores de estado en mosaico** (2 columnas en celular, 4 desde `md`; cada baldosa filtra la lista)
```html
<div class="grid grid-cols-2 gap-3 md:grid-cols-4">
  <a href="#" class="rounded-cap-card border border-cap-divider bg-cap-card p-4 transition-transform duration-cap-fast ease-cap hover:-translate-y-0.5">
    <p class="font-display text-3xl font-semibold tabular-nums text-gray-900 dark:text-gray-100">12</p>
    <p class="mt-1 flex items-center gap-1.5 text-xs text-cap-text-soft"><span class="h-1.5 w-1.5 rounded-full bg-cap-status-warning dark:bg-cap-status-dark-warning" aria-hidden="true"></span>Pendientes</p>
  </a>
</div>
```

## Movimiento

El movimiento muestra qué cambió y da continuidad entre pantallas; nunca decora. Tokens en `tokens.json` (`motion`): clases
`duration-cap-fast|base|slow` y `ease-cap|cap-enter|cap-exit`, animaciones `animate-cap-fade-in`,
`animate-cap-rise-in` y `animate-cap-pulse` (atenuar algo que espera; para cargar, `.cap-skeleton`); variables `--cap-duration-*` y `--cap-ease-*` en CSS.

| Token | Valor | Para qué |
|---|---|---|
| `fast` | 120 ms | hover, foco, cambios de color, menús pequeños, salidas |
| `base` | 180 ms | aparecer: modales, dropdowns, toasts, chips |
| `slow` | 260 ms | desplazamientos grandes: cajones laterales, paneles que se expanden |
| `ease-cap` | `cubic-bezier(0.2, 0, 0, 1)` | transiciones de estado (color, borde, ancho) |
| `ease-cap-enter` | `cubic-bezier(0, 0, 0.2, 1)` | lo que entra: desacelera al llegar |
| `ease-cap-exit` | `cubic-bezier(0.4, 0, 1, 1)` | lo que sale: acelera al irse |

Reglas:

- Solo `duration-cap-*`, `ease-cap*` y `animate-cap-*`. Nunca `duration-300`, `duration-[…]`,
  `animate-pulse`, `animate-bounce` ni otra animación de Tailwind.
- Solo se animan `opacity`, `transform`, `color`, `background-color`, `border-color`,
  `grid-template-rows` (acordeones) y, en barras de progreso, `width`. Nunca `height`,
  `max-height`, `margin`, `box-shadow` ni `filter`. Única excepción: el ancho del sidebar, que ya
  resuelve el marco.
- La salida es un escalón más corta que la entrada: entra `base`, sale `fast`; entra `slow`, sale
  `base`.
- Desplazamientos pequeños: 8 px al aparecer, 2 px al levantar una baldosa. Sin rebotes ni escalas
  mayores a 2 %.
- Cada vista que entra a `.cap-shell__content` sube sola con `shell.css`; no hay que agregar clases.
- Para escalonar un tablero, pon `cap-stagger` en su contenedor: cada bloque hijo entra 30 ms después
  del anterior. Va en tableros; en tablas, `cap-stagger-rows` en el `tbody`: solo el primer montaje y solo las primeras 8 filas; al ordenar, filtrar o paginar se quita la clase. Nada se anima al hacer scroll.
- Si esqueleto y contenido comparten elemento raíz, dales `key` distinta para que el contenido se
  monte de nuevo y haga su entrada.
- `tokens.css` anula transiciones y animaciones para quien pide `prefers-reduced-motion`. Nunca
  comunicar algo solo con movimiento: todo cambio tiene también un estado visible estático.

Patrones por componente:

| Componente | Entrada | Salida | Interacción |
|---|---|---|---|
| Botones, enlaces, filas, ítems de menú | — | — | `transition-colors duration-cap-fast ease-cap` |
| Baldosas y tarjetas clicables | — | — | `transition-transform duration-cap-fast ease-cap hover:-translate-y-0.5` |
| Modal | overlay `animate-cap-fade-in`, panel `animate-cap-rise-in` | `opacity-0`, `fast`, `ease-cap-exit` | — |
| Dropdown, menú `⋮`, combobox | `opacity-0 scale-[0.98] origin-top` → normal, `fast`, `ease-cap-enter` | `opacity-0`, `fast` | — |
| Sidebar en riel | hover o foco con teclado: flota a 236 px sobre el contenido, `slow`, `ease-cap` | `base`, tras 240 ms de gracia | el clic en la flecha lo deja fijo |
| Cajón lateral, panel colapsable | `translate-x`, `slow`, `ease-cap-enter` | `translate-x`, `base`, `ease-cap-exit` | — |
| Acordeón, sección colapsable vertical | `grid-rows-[0fr]` → `grid-rows-[1fr]`, `transition-[grid-template-rows] duration-cap-base ease-cap` | igual, `fast`, `ease-cap-exit` | — |
| Toast | `opacity-0 translate-x-2` → normal, `base`, `ease-cap-enter` | `opacity-0`, `fast`, en su sitio | los demás se deslizan a su lugar, `base`, `ease-cap`; lo resuelve el toaster |
| Listas y tableros (insertar, mover) | `animate-cap-rise-in` en el ítem nuevo | `opacity-0 -translate-y-2`, `fast` | `TransitionGroup` con `move-class="transition-transform duration-cap-base ease-cap"`; el que sale va `absolute` |
| Tabla al ordenar, filtrar o paginar | ninguna; las filas se reemplazan al instante, atenuadas con `opacity-50` mientras carga | — | — |
| Barra de progreso, medidor | — | — | `transition-[width] duration-cap-slow ease-cap` |
| Esqueleto de carga | `.cap-skeleton`, barrido de 1.4 s | el contenido lo reemplaza con su entrada | — |
| Cambio de tema claro/oscuro | ninguno (instantáneo) | — | — |
| Navegación de secciones, segmentado | píldora elástica: el borde delantero llega en 360 ms y el trasero lo alcanza en 550 ms (`pill-nav.js`) | — | sin animar al montar, al cambiar el ancho y con `prefers-reduced-motion` |
| Navegación entre páginas | entrada automática en `.cap-shell__content`, `slow`, `ease-cap-enter` | — | — |

Piezas del tablero (`motion.css` y `count-up.js`; `initShell` las enlaza):

| Pieza | Cómo | Duración |
|---|---|---|
| Cifra | `data-cap-count` con `data-cap-format` | 900 ms |
| Barras | `cap-grow`, `--cap-stagger-index` por barra | 700 ms, 60 ms entre barras |
| Anillo | `cap-ring` con `--cap-ring-1` y `--cap-ring-2` | 1 s |
| Trazo de línea | `cap-draw`, con `pathLength="1"` en el trazo | 1.1 s |
| Barra de selección | `.cap-selection-bar` | entra `base`, sale `fast` |

Vue: usar `<Transition>` y `<TransitionGroup>` con clases de Tailwind:

```vue
<Transition
  enter-active-class="transition duration-cap-base ease-cap-enter"
  enter-from-class="opacity-0 translate-y-2"
  leave-active-class="transition duration-cap-fast ease-cap-exit"
  leave-to-class="opacity-0"
>
  <div v-if="open" class="…">…</div>
</Transition>
```

## Los cinco estados de una pantalla

- **Vacío (sin datos aún)**: la receta de estado vacío: ícono `-outline` de 40 px en gris, título,
  una línea de explicación y el botón primario que crea el primer registro.
- **Sin resultados (hay filtro o búsqueda)**: mismo bloque sin borde punteado, texto «Ningún
  registro coincide con los filtros» y acción secundaria «Limpiar filtros». Nunca el botón de crear.
- **Cargando**: `CapSkeleton` o `<x-cap.skeleton>` con la forma del contenido, mostrado solo si la
  carga supera 120 ms para evitar parpadeo; nunca un spinner a pantalla completa. Al recargar una tabla ya
  cargada, atenuar el contenido (`opacity-50`) en vez de reemplazarlo por esqueleto.
- **Error**: qué pasó y cómo seguir, en `status-error`, con botón secundario «Reintentar» y, si
  aplica, el código o id para soporte. «Ocurrió un error» no basta; sin disculpas.
- **Parcial**: si una sección falla y el resto no, la sección muestra su error en línea; la página
  no se cae completa.

## Modo oscuro obligatorio

Tailwind en `darkMode: 'class'`. La clase `dark` va en `<html>`, la pone un script en el `<head>`
(antes de cualquier CSS, para que no parpadee) y la preferencia se guarda en `localStorage.theme`
(`'light'` | `'dark'`); la del sistema solo decide la primera vez. No usar `prefers-color-scheme`
en CSS.

```blade
<script>
    const theme = localStorage.theme ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', theme === 'dark');
</script>
```

Toggle: `document.documentElement.classList.toggle('dark', isDark); localStorage.theme = isDark ?
'dark' : 'light';`. El cambio es instantáneo, sin transición. Las gráficas leen el tema con
`document.documentElement.classList.contains('dark')` y recalculan `chartColors()`.

Toda clase de color física lleva su variante `dark:`; los alias de rol y las variables `--cap-*`
cambian solos. Verificar las dos variantes antes de dar por terminada una pantalla.

## PDF y correos

- Cabeceras de tabla y barra de título en `config('design.chrome.surface')` con texto blanco; el
  color de marca (`config('design.brand.red')`) solo en el nombre de la empresa y los totales a destacar; los
  sellos de estado (ANULADA, VENCIDA) con `config('design.status.light.error')`. Nunca el hex en el blade.
- PDF (wkhtmltopdf): Inter y Poppins instaladas en el servidor; si no, `Helvetica, Arial,
  sans-serif`. Fondo blanco, sin modo oscuro, tablas con borde `config('design.chrome.paperLine')`,
  cifras a la derecha, fechas `dd/mm/yyyy`.
- Correos: fondo `config('design.chrome.paper')`, tarjeta blanca de 600 px, un solo botón primario
  sólido en `config('design.chrome.surface')` (el degradado no llega a los clientes de correo); estilos inline (los clientes de correo no cargan Tailwind).

## Antes de terminar una pantalla

Esta es la lista final; `AGENTS.md` remite aquí.

1. Sin hex, `rgb(`, `rgba(`, `backdrop-filter` propio, `text-[…px]`, `duration-[`, `duration-300` ni
   `animate-pulse` en lo que escribiste.
2. Toda clase de color física lleva su `dark:`, salvo alias de rol, pares de `statuses.js` y las
   clases de las recetas, que se copian tal cual.
3. El marco, el acceso, la confirmación y los toasts son el componente del stack; los botones,
   `CapButton` o `<x-cap.button>`.
4. Están los cinco estados y hay un solo botón primario visible.
5. Las tablas llevan la cabecera de la receta (`bg-cap-table-head text-cap-table-head-ink border-b border-cap-table-head-line`) y cifras a la derecha con `tabular-nums`.
6. Foco visible en todo lo interactivo; modales con `role="dialog"`.
7. Revisada en claro, en oscuro y a <1024px (vista móvil).
8. Ningún nombre de empresa escrito a mano; todos salen de `company`.

## Lo que no se hace

- Hex a mano: ni el color de marca, ni los grises del marco, ni los estados. Ni `rgb(` ni `text-[…px]`.
- Grises azulados o `bg-slate-*` fuera del preset.
- Cabeceras, barras o superficies del color de marca (`cap-brand`); el color de marca como enlace
  genérico; el suave (`cap-brand-soft`) como fondo con texto blanco. Tarjetas de color sólido que no sean la destacada con degradado (una por fila de cifras).
- Degradados fuera de `bg-cap-gradient-*` y de los manchones del lienzo detrás del marco; sombras de color fuera de los
  tokens `--cap-shadow-*`; bordes de neón, emojis como íconos, otro set de íconos.
- Rearmar el marco (sidebar, header, tabbar, hoja «Más», confirmación, toasts, acceso) a mano con
  Tailwind o con `rgba(` y `backdrop-filter` propios: se usa el componente del stack o
  `shell/SHELL_SPEC.md`.
- Chips de filtro armados a mano: usar el segmentado.
- Relleno de error (`status-error`) como botón fuera del diálogo de confirmación.
- Vidrio en tarjetas de contenido, modales, avisos en línea o inputs (la tarjeta del acceso es la
  única excepción).
- Logos de terceros recoloreados o en monocromo.
- Etiquetas en mayúsculas con espaciado, monoespaciada para texto, tamaños menores a `text-xs`.
- `duration-*`, `animate-pulse` o `animate-bounce` de Tailwind; animaciones por sección, efectos
  al hacer scroll, rebotes, parallax, spinners sueltos donde cabe un esqueleto.
- Botones «Sí/No», «Aceptar» u «OK» en confirmaciones; foco inicial en el botón destructivo.
- Otra fuente, otro color de acción, otro `z-index`.
