# Marco flotante de vidrio: especificación agnóstica

Qué hay que construir en cualquier framework (Vue, Blade, React, Astro, HTML plano) para que todos los sistemas de la empresa tengan el mismo marco. El **CSS es único** (`design/shell.css`, que importa `design/shell/css/*.css`); lo que cambia por stack es solo cómo se genera el HTML y cómo se enlaza el comportamiento.

Fuentes de verdad, en este orden:

1. HTML de referencia: `design/shell/reference/app.html` (marco) y `design/shell/reference/login.html` (acceso). No se copia aquí: se abre y se replica su estructura y sus clases tal cual.
2. Comportamiento: `design/shell.js` (`initShell`) y `design/shell/js/*.js`.
3. Implementaciones: `design/vue/*.vue` y `design/blade/components/cap/*.blade.php`.

Reglas que no se negocian: solo tokens `var(--cap-*)` (ningún color literal), íconos MDI, capas con `z-cap-*`, textos en español, nada por debajo de 12 px, etiquetas de grupo en minúscula normal. **Hace scroll la ventana**, nunca un contenedor interno.

## Anatomía

### Puntos de quiebre

| Ancho | Marco | Sidebar por defecto |
|---|---|---|
| `< 1024px` | Móvil: topbar + tabbar + hoja «Más» + FAB. Sidebar y header de escritorio ocultos | no aplica |
| `>= 1024px` | Escritorio | riel colapsado (66 px); la preferencia guardada manda |

El valor por defecto lo calcula `defaultCollapsed(viewportWidth)` en `collapse.js`; una preferencia guardada manda sobre el defecto.

### Piezas

| Pieza | Clase raíz | Medidas y comportamiento |
|---|---|---|
| Lienzo | `.cap-shell` / `.cap-shell__main` / `.cap-shell__content` | Aire de 12px entre piezas y con la ventana. Manchones radiales solo detrás del marco |
| Sidebar | `.cap-shell-sidebar` (con `data-cap-sidebar`) | `position: sticky; top: 12px`, alto `100dvh - 24px`, radio de marco. 236px expandido; 66px con `data-collapsed="true"`. Orden: marca, buscador, navegación, espacio flexible, interruptor de modo oscuro, usuario |
| Botón de colapso | `.cap-shell-sidebar__collapse` (`data-cap-collapse`) | Círculo de 26px sobre el borde. `aria-expanded` y `aria-label` cambian entre «Contraer menú» y «Expandir menú» |
| Ítem | `.cap-shell-sidebar__item` | 38px de alto, ícono MDI. Activo: `aria-current="page"` (píldora y filo rojo de 3px). Contador en píldora; `--urgent` en rojo sólido |
| Rama con hijos | `details.cap-shell-sidebar__branch` | `summary` + `.cap-shell-sidebar__children`; hijos con `.cap-shell-sidebar__child` y cuadradito de color |
| Riel | mismo sidebar con `data-collapsed="true"` | Solo íconos. El contador pasa a punto. Con cursor o teclado se asoma: `bindSidebarPeek` pone `data-peek="open"` y el panel flota a 236 px sin mover el contenido ni cambiar la preferencia. Clic en la flecha lo deja fijo, Esc lo cierra. Con pantalla táctil (`any-pointer: coarse`) sigue el tooltip de vidrio a la derecha, y las ramas abren sus hijos al derecho. Allí la lista **no** hace scroll, porque recortaría tooltips y submenús: en pantallas muy bajas, expandir el panel |
| Header | `.cap-shell-header.cap-glass` | 64px, `position: sticky; top: 12px`. Migas, título (`h1`), buscador (máx. 320px), acciones, campana, avatar |
| Navegación de secciones | `.cap-shell-header__nav` (`data-cap-pill-nav`) | 38 px, dentro del header tras el título; de 2 a 5 ítems `a.cap-shell-header__nav-item`, activo con `aria-current="page"`; todos en `--cap-frame-ink` (al activo lo distinguen la píldora y el punto rojo); píldora `span.cap-shell-header__nav-pill` (`data-cap-pill`) animada por `pill-nav.js`. Bajo 1024 px la misma pieza con `--mobile` es una fila sticky bajo la topbar. Con secciones y menos de 1280 px el buscador se contrae a la lupa y se despliega al enfocarse |
| Topbar móvil | `.cap-shell-topbar` | `position: fixed`, 52px. Sin `backHref`: logo y nombre del sistema. Con `backHref`: flecha «Volver» y título. Después, lupa (ocultable), acciones propias y campana. Siempre hay un `h1` con el título: `.cap-shell-topbar__title` si se ve, `.cap-shell-topbar__hidden-title` (oculto visualmente) si no. El `h1` del header y el de la topbar nunca se muestran al mismo ancho |
| Tabbar | `.cap-shell-tabbar` | `position: fixed`, 64px, abajo. **Máximo 4 destinos + «Más»**; los extra se ocultan por CSS y viven en la hoja |
| Hoja «Más» | `.cap-shell-sheet#cap-more-sheet` | Menú completo desde abajo. Estado en `data-open="true|false"`. El vidrio va en `__panel`, no en la raíz |
| FAB | `.cap-shell-fab` | 52px, rojo CAP, solo móvil, 88px sobre el borde inferior. Es un `button` (Vue) o un `a` (Blade, `fab-href`) |
| Notificaciones | `.cap-notifications#cap-notifications` | Vidrio, 360px, `position: fixed` (en móvil ocupa el ancho). **Hermano del header**, no hijo: un `backdrop-filter` dentro de otro no ve el contenido. Se muestra y oculta con `hidden` |
| Conmutador de módulos | `.cap-module-switcher.cap-glass#cap-modules` | Fijo, 86 px arriba y 118 px a la derecha (a la izquierda del panel de notificaciones), 372 px, capa dropdown, relleno 14 px, radio de marco. Cabecera «Módulos» con «Ver todos» opcional y cuadrícula `.cap-module-switcher__grid` de 3 columnas con `a.cap-module-switcher__item` (baldosa `.cap-module-tile` de 40 px y nombre); el actual lleva `aria-current="true"` y la píldora activa del marco. Lo abre el botón `mdi-apps` del header, antes de la campana. **Hermano del header**, como las notificaciones. No existe bajo 1024 px: los módulos van al principio de la hoja «Más» |
| Barra de selección | `.cap-selection-bar.cap-glass` | Fija, centrada abajo a 72 px, 52 px, capa dropdown; conteo y hasta tres acciones; solo en escritorio; la app la monta cuando hay selección |
| Tablero kanban | `.cap-kanban` (con `data-cap-kanban`) | Columnas de vidrio de 300 px con 16 px entre ellas y `overflow-x: auto`; cada `.cap-kanban__column` lleva cabecera (punto de estado según `data-tone`, título, contador, límite WIP opcional y acciones), lista `.cap-kanban__list` y «Agregar tarjeta» opcional. Tarjetas `.cap-kanban-card` sólidas con borde y `--cap-shadow-card`; `--blocked` lleva filo izquierdo de error. Bajo 1024 px una columna a la vez, elegida con el segmentado `.cap-kanban__picker`. Detalle en `DESIGN_GUIDE.md › Recetario` |
| Toasts | `.cap-toaster` | `position: fixed`, abajo a la derecha, 380px. Vidrio |
| Confirmación | `.cap-dialog` | Modal sólido (no vidrio). Raíz con `hidden`; panel `.cap-dialog__panel` |
| Aviso en línea | `.cap-alert` | Sólido. `role="alert"` si es `error`, `role="status"` en el resto |
| Acceso | `.cap-login` | Foto a la izquierda, tarjeta de vidrio blanco (`.cap-glass--light`, la única tarjeta en vidrio) a la derecha. Ver «Acceso» |

Capas: header 30, sidebar 40, notificaciones y conmutador de módulos 50, hoja «Más» 60, confirmación 70, toasts 80 (`--cap-z-*`).

### Datos que consume el marco

- `menu`: grupos `{ label, items[] }`. Ítem: `{ label, icon, href, active?, count?, urgent?, children? }`. `icon` va sin el prefijo `mdi-`. Con ítem activo y un ícono `-outline`, se usa la variante rellena. Hijo: `{ label, href, active?, swatch? }` con `swatch` en `wine`, `red`, `red-400` o `taupe`.
- `aria-label` de un ítem con contador: «Facturas, 12 pendientes», «Cobranza, 3 urgentes» (singular sin «s» con `count === 1`).
- `user`: `{ name, email, avatarUrl? }`. Sin foto, el avatar muestra las iniciales de las dos primeras palabras.
- `notifications`: `{ id, title, detail?, time, group, unread, alert?, icon, href? }`. Con `href`, el ítem es un enlace. La campana dice «Notificaciones, N sin leer» y muestra el punto si N > 0.
- `breadcrumbs`: `{ label, href? }`. Sin `href`, es texto.
- `sections`: `{ label, href, active? }`. Con menos de 2 no se muestra la navegación.
- Toast (`showToast`): `{ status, title, detail?, action? }` con `status` en `ok`, `info`, `warning`, `error` o `neutral` y `action` como `{ label, onSelect }`.

## Estado

| Estado | Dónde vive | Persistencia |
|---|---|---|
| Sidebar colapsado | Layout (o `data-collapsed` en el DOM) | `localStorage['cap-shell:sidebar-collapsed']` = `'true'`/`'false'`. Con `try/catch`: si falla, no hay preferencia y se usa el defecto por ancho |
| Modo oscuro | clase `dark` en `<html>` | `localStorage['theme']` = `'dark'`/`'light'`. `toggleTheme()` la alterna |
| Hoja «Más» abierta | Layout | No |
| Notificaciones abiertas | Layout / `hidden` del panel | No |
| Conmutador de módulos abierto | Layout / `hidden` del panel | No |
| Módulo fijado | La app (escucha `pin` o `cap:module-pin`) | La decide la app |
| Toasts | Cola global (`createToastQueue`) | No |
| Confirmación abierta | La app (Vue) o `hidden` del diálogo | No |

Cambiar el ancho de ventana **no** vuelve a evaluar el defecto: solo se aplica al montar.

## Comportamiento

### Teclado

| Tecla | Efecto |
|---|---|
| `Tab` / `Shift+Tab` | En hoja «Más» y confirmación el foco queda atrapado (`trapFocus`) y cicla |
| `Escape` | Cierra hoja, notificaciones (devuelve el foco a la campana), conmutador de módulos (devuelve el foco a su botón) y confirmación |
| `⌘K` / `Ctrl K` | Enfoca el buscador del header (`bindCommandK`) y hace `preventDefault` |

El header de escritorio, y con él el buscador, se oculta bajo 1024px: **⌘K no aplica en móvil**.

Al cerrar hoja o confirmación el foco vuelve al elemento que lo tenía antes de abrir.

### Notificaciones (popover)

Se abre con la campana (`aria-controls="cap-notifications"`, `aria-expanded`). Se cierra con clic fuera, con `Escape` o volviendo a pulsar la campana. Hay dos campanas (header y topbar) que controlan el mismo panel; clic en una no se interpreta como «fuera» para la otra.

«Todas» / «No leídas» filtran en el navegador: se ocultan los ítems sin `data-unread="true"` y los grupos que quedan vacíos, y si no queda ninguno se muestra `data-cap-notification-empty`.

### Conmutador de módulos

Es el mismo popover que las notificaciones, sin atributos nuevos: el botón `button.cap-shell-header__icon-button[aria-label="Cambiar de módulo"]` con `aria-controls="cap-modules"`, `aria-expanded` y `data-cap-popover-trigger` (en `.cap-shell-header__actions`, antes de la campana) lo abre y lo cierra; `Escape` y el clic fuera lo cierran y el foco vuelve al botón. En Vue, `CapHeader` usa una segunda instancia de `usePopover('cap-modules')`. Exclusión mutua: abrir uno cierra el otro (en HTML y Blade porque el clic en un disparador es «fuera» para el otro panel; en Vue, `usePopover` deja abierto un solo panel a la vez). Solo se pinta si el layout recibe en `modules` algún módulo con acceso; cada uno es `{ id, name, icon, href, current?, granted? }` y `current` pone `aria-current="true"` en su ítem. Los bloqueados (`granted` falsy) no se listan, ni aquí ni en la hoja «Más»: el layout los quita antes de pasar la lista al header y a la hoja, así que se puede pasar la misma lista que a la portada. «Ver todos» enlaza a `modulesHref` y no se pinta sin él. En Vue, `CapModuleSwitcher` emite `navigate` al hacer clic en cualquiera de sus enlaces y `CapHeader` cierra el panel (con Inertia o vue-router el layout no se vuelve a montar). Bajo 1024 px el panel no se muestra (no hay header) y la hoja «Más» lista los mismos módulos.

La portada de módulos (`CapModuleGrid` / `x-cap.module-grid`) no es parte del marco, pero su estrella sí tiene comportamiento: en Blade y HTML, `module-pin.js` (`bindModulePin(button)` y `bindModuleRequest(button)`, cada uno devuelve el liberador y no enlaza dos veces el mismo botón; los enlaza `initShell` en `[data-cap-module-pin]` y `[data-cap-module-request]`) alterna la estrella (`aria-pressed` e ícono; su `aria-label` «Fijar <nombre del módulo>» no cambia) sin seguir el enlace de la tarjeta y despacha `cap:module-pin` con `{ id, pinned }` o `cap:module-request` con `{ id }`, con `bubbles` desde el botón. La app los escucha (en `document` o en un contenedor) y guarda; el paquete no persiste nada. En Vue el botón no lleva el atributo: `CapModuleGrid` guarda el estado de las estrellas (lo vuelve a tomar de `pinned` cuando cambia `modules`) y emite `pin` y `request`.

### Hoja «Más»

La abre «Más» en la tabbar. Se cierra con `Escape`, clic en el fondo (`data-cap-sheet-backdrop`) o arrastrando el asa (`data-cap-sheet-handle`) **más de 80px** hacia abajo. En Vue también se cierra al navegar (clic en un enlace dentro de la hoja, módulos incluidos). Si el layout recibe `modules`, la hoja empieza con la etiqueta «Módulos» (`p.cap-shell-sidebar__group-label`) y la cuadrícula `nav.cap-module-switcher__grid[aria-label="Módulos"]` (3 columnas, los mismos ítems del conmutador); después viene el menú.

### Toasts

- Estados: `ok`, `info`, `warning`, `error`, `neutral`.
- Todos se cierran solos: `ok` e `info` a los **5 s**; `warning`, `error` y `neutral` a los **8 s**. Siempre con barra de progreso (su duración sale de `--cap-toast-duration`, que el toaster fija en cada toast) y **pausa al pasar el cursor o enfocar** (el tiempo restante se conserva). Lo que debe quedarse en pantalla no es un toast: es un aviso en línea.
- **Máximo 3**; al llegar el cuarto se descarta el más antiguo. El más nuevo queda **abajo**.
- Movimiento (`toast-motion.js`): el toast nuevo lleva `.cap-toast--entering` hasta que termina `cap-toast-in` (opacidad y 8 px desde la derecha, `base`). El que se cierra (sola, con la × o por el máximo) se fija en su sitio con `pinInPlace` (`position: absolute` dentro del toaster) y lleva `.cap-toast--leaving` hasta que termina `cap-toast-out` (solo opacidad, `fast`); recién entonces sale del DOM. Los que quedan se deslizan a su lugar nuevo con `.cap-toast--moving` (FLIP, `base`). `toasts.js` lo hace con `playEnter`, `playExit`, `captureTops` y `slideFromPreviousTops`; `CapToaster` con `TransitionGroup` y las mismas clases.
- `role="alert"` para `error`; `role="status"` para el resto. Botón de cierre con `aria-label="Cerrar notificación"`.
- Opciones: `{ status, title, detail?, action?: { label, onSelect } }`. La acción ejecuta `onSelect` y cierra el toast.
- Toast «de servidor»: un hijo `[data-cap-toast]` con `data-status`, `data-title`, `data-detail` dentro de `[data-cap-toaster]` se convierte en toast al montar y el nodo se elimina (Blade lo usa con `session('cap_toast')`).

### Confirmación

- «Cancelar» a la **izquierda**, acción a la derecha. **Foco inicial en «Cancelar»**.
- `Escape`, `×` y «Cancelar» cancelan. **Clic fuera no cierra.**
- Con casilla de reconocimiento (`data-cap-confirm-ack`) el botón de aceptar queda deshabilitado hasta marcarla; se desmarca al reabrir.
- Al aceptar el botón recibe `aria-busy="true"`. En la versión vanilla se emite `cap:confirm` (`CustomEvent` con `detail.id`); no hay cierre automático, lo decide la app.
- Vocabulario: «Anular» / «Eliminar» según el caso, nunca «Aceptar».

### Tablero kanban

`bindKanban(board, { onMove } = {})` de `kanban.js` (lo llama `initShell` en cada `[data-cap-kanban]`) devuelve `{ moveCard(cardId, columnId, index = Infinity), refresh(), findCard(cardId), destroy() }`; `findCard` devuelve el `[data-cap-kanban-card]` con ese id o `null`. Enlazar dos veces el mismo tablero devuelve los mismos controles.

| Tecla (foco en una tarjeta) | Efecto |
|---|---|
| `Espacio` / `Enter` | Toma la tarjeta (`data-dragging="true"`); con una tomada, la suelta |
| `↑` / `↓` | Mueve la tarjeta tomada una posición dentro de su columna |
| `←` / `→` | Pasa la tarjeta tomada al final de la columna vecina |
| `Escape` | La devuelve a su posición original, sin evento |

- Las flechas y `Escape` solo se consumen con una tarjeta tomada. Si el foco sale del tablero con una tarjeta tomada, equivale a `Escape` y el foco se queda donde el usuario lo llevó.
- Con puntero es arrastrar y soltar nativo (HTML5): la lista bajo la tarjeta lleva `data-over="true"` y la tarjeta se inserta antes de aquella sobre la que se suelta, o al final. En móvil no hay arrastre entre columnas: teclado o «Mover a…».
- **Evento**: cada movimiento que cambia columna o posición despacha en el tablero `cap:kanban-move` (`CustomEvent` con `bubbles`) con `detail = { cardId, from, fromIndex, to, index }` (`from`/`to` son ids de columna; `fromIndex` e `index`, las posiciones de origen y final desde 0) y llama a `onMove(detail)` si existe. Si la app no pudo guardar, devuelve la tarjeta con `moveCard(cardId, from, fromIndex)`: los movimientos por API no despachan evento.
- **En Vue** el vdom manda: `CapKanban` devuelve el nodo a su origen antes de emitir `move`. La app actualiza `cards` al recibir `move`; para rechazar, no lo actualices: el tablero vuelve solo. Tras el render, el foco vuelve a la tarjeta movida.
- Una tarjeta cuyo `column` no coincide con ninguna columna no se renderiza (Vue y Blade).
- **Anuncios** en `.cap-kanban__live` (`aria-live="polite"`; el módulo lo crea si falta): «<folio> tomada. Flechas para mover, Espacio para soltar, Escape para cancelar», «<folio> movida a <columna>, posición n de total» y «<folio> devuelta a <columna>». El folio es el texto de `.cap-kanban-card__top` sin el menú.
- `refresh()` recuenta `[data-cap-kanban-count]` y el límite WIP (`.cap-kanban__wip` y `data-full`); corre tras cada movimiento y la app lo llama si inserta tarjetas por su cuenta. `destroy()` quita los listeners.
- **Selector móvil**: el `[data-cap-kanban-picker]` se busca en el contenedor del tablero (`board.parentElement`); su `cap:segmented-change` pone `data-active="true"` en la columna con ese id. Al enlazar se activa la del botón con `aria-pressed="true"` o la primera. Mover una tarjeta a otra columna con las flechas activa esa columna en el selector y la tarjeta conserva el foco.
- El menú ⋮ de la tarjeta lo arma la app (menú de fila) e incluye «Mover a…» con las columnas.

### Acceso

- La **foto la define cada sistema** (`photoUrl` → `--cap-login-photo`); el paquete no trae ninguna. `login.html` usa una de ejemplo.
- Logos de Microsoft y Google: `design/logos/*.svg`. En Laravel se publican en `/cap/logos` (`logos-path`).
- Modos `login` y recuperación. Con `alert`, un `cap-alert` arriba del formulario; si es `error`, el campo de contraseña se marca con `cap-field--error`.
- Revelar contraseña con `data-cap-password-toggle` (`aria-controls` apunta al input; alterna `aria-label` y el ícono).
- Estado «ingresando»: en Vue, prop `loading`. En Blade y HTML, `data-cap-login-form="Ingresando…"` en el formulario: al enviar, el botón queda con `disabled`, `aria-busy="true"` y ese texto (evita el doble envío). Se restaura si el navegador vuelve atrás desde su caché.

## Accesibilidad

| Pieza | Contrato |
|---|---|
| Sidebar | `nav[aria-label="Menú principal"]`; activo con `aria-current="page"`; íconos `aria-hidden="true"` |
| Colapso | `aria-expanded` + `aria-label` dinámico |
| Campana | `aria-label` con conteo, `aria-expanded`, `aria-controls="cap-notifications"` |
| Notificaciones | `section[aria-label="Notificaciones"]` |
| Conmutador de módulos | Botón con `aria-label="Cambiar de módulo"`, `aria-expanded` y `aria-controls="cap-modules"`; panel `section[aria-label="Cambiar de módulo"]`; módulo actual con `aria-current="true"` |
| Migas | `nav[aria-label="Migas de pan"]`; separadores `aria-hidden` |
| Tabbar | `nav[aria-label="Destinos principales"]`; «Más» con `aria-expanded` y `aria-controls="cap-more-sheet"` |
| Hoja | `role="dialog"`, `aria-modal="true"`, `aria-label="Menú completo"` |
| Confirmación | `role="alertdialog"`, `aria-modal="true"`, `aria-labelledby` y `aria-describedby` |
| Toasts | `role="status"` / `role="alert"` (ver arriba) |
| Avisos | `role="alert"` (error) / `role="status"` |
| Tooltips del riel | `aria-hidden="true"`; el nombre accesible lo da el `aria-label` del ítem |
| Foco | Anillo visible en todos los controles; tooltips también con `:focus-visible` |

Contraste AA: texto 4.5:1 y controles 3:1, en claro y oscuro, incluido el vidrio claro con `card` o `page` detrás; lo esencial del marco va en `--cap-frame-ink` y se verifica también sobre vino. Se verifica con `scripts/contrast.mjs`.

## Respaldos

| Condición | Resultado |
|---|---|
| Sin `backdrop-filter` (`@supports not`) | Superficies sólidas: `--cap-frame` en el marco, `--cap-card` en el acceso |
| `prefers-reduced-transparency: reduce` | Igual que arriba |
| `prefers-reduced-motion: reduce` | Sin transición de ancho del sidebar, sin transición de la hoja «Más», sin la barra de progreso animada de los toasts, sin barrido de esqueletos ni entrada de vistas. El riel se sigue asomando, al instante |
| `localStorage` bloqueado | Preferencias no persisten; el marco sigue funcionando |

## Atributos `data-cap-*` y módulos

`initShell(root = document)` recorre `root`, enlaza cada atributo y devuelve **una función de limpieza**. `design/shell-auto.js` la invoca al cargar y expone `window.capToast`.

| Atributo | Módulo | Qué hace |
|---|---|---|
| `data-cap-sidebar` | `collapse.js` | Aplica el estado inicial (`resolveCollapsed`) y enlaza el colapso |
| `data-cap-collapse` | `collapse.js` | Botón dentro del sidebar que alterna y guarda |
| `data-cap-search` | `command-k.js` | Input que recibe el foco con ⌘K / Ctrl K |
| `data-cap-sheet-trigger` | `sheet.js` | Botón que abre la hoja; `aria-controls` apunta a su id |
| `data-cap-sheet-backdrop` | `sheet.js` | Fondo que cierra la hoja |
| `data-cap-sheet-handle` | `sheet.js` | Asa de arrastre |
| `data-cap-popover-trigger` | `popover.js` | Botón que abre el panel de `aria-controls` |
| `data-cap-toaster` | `toasts.js` | Contenedor de toasts; el último montado es el activo para `showToast` |
| `data-cap-toast` | `toasts.js` | Toast inicial servido por el servidor (ver «Toasts») |
| `data-cap-confirm` | `confirm.js` | Raíz del diálogo de confirmación (necesita `id`) |
| `data-cap-confirm-open` | `confirm.js` | Disparador; su valor es el `id` del diálogo |
| `data-cap-confirm-accept` | `confirm.js` | Botón de aceptar |
| `data-cap-confirm-cancel` | `confirm.js` | Botón «Cancelar» (foco inicial) |
| `data-cap-confirm-close` | `confirm.js` | Botón `×` |
| `data-cap-confirm-ack` | `confirm.js` | Casilla de reconocimiento |
| `data-cap-theme-toggle` | `theme.js` | Alterna la clase `dark` y guarda `theme` |
| `data-cap-password-toggle` | `password.js` | Revela u oculta la contraseña |
| `data-cap-notifications` | `notification-filter.js` | Panel cuyos ítems se filtran |
| `data-cap-notification-filter` | `notification-filter.js` | Botón de filtro: `all` o `unread` |
| `data-cap-notification-empty` | `notification-filter.js` | Mensaje oculto para «No leídas» sin resultados |
| `data-cap-login-form` | `login-form.js` | Formulario de acceso; su valor es el texto del botón mientras envía |
| `data-cap-pill-nav` | `pill-nav.js` | Contenedor de píldora elástica (navegación de secciones y segmentado); los ítems son sus hijos directos `a`/`button`. La píldora sigue los cambios de `aria-current`/`aria-pressed` y también los ítems que la app reemplaza. Al enlazarse marca el contenedor con `data-cap-pill-bound="true"` (se quita en `destroy`): los componentes Vue enlazan su propia píldora e `initShell` se salta un contenedor ya enlazado (`bindPillNav` devuelve una API sin efecto) |
| `data-cap-pill-bound` | `pill-nav.js` | Lo pone `bindPillNav` en el contenedor enlazado; no se escribe en el marcado |
| `data-cap-count` | `count-up.js` | Cifra que cuenta de 0 hasta su valor (`Number`) en 900 ms, una sola vez; `data-cap-format` = `currency-compact \| integer \| percent` (sin valor o desconocido: `integer`). El texto del marcado es el valor final, por si no hay JS. En Vue, deja la interpolación `{{ }}` como único hijo del elemento y pon el valor numérico en `:data-cap-count`; el módulo escribe en ese mismo nodo de texto, así que las actualizaciones posteriores de Vue muestran el valor nuevo sin volver a animar. |
| `data-cap-format` | `count-up.js` | Formato de la cifra de `data-cap-count` (misma fila) |
| `data-cap-pill` | `pill-nav.js` | La píldora, decorativa (`aria-hidden="true"`); se recorta con `clip-path` sobre el ítem activo |
| `data-cap-kanban` | `kanban.js` | Raíz del tablero kanban: enlaza arrastre con puntero, teclado (Espacio/Enter toma y suelta, flechas mueven, Escape cancela), contadores y anuncios; despacha `cap:kanban-move` con `{ cardId, from, fromIndex, to, index }` |
| `data-cap-kanban-bound` | `kanban.js` | Lo pone `bindKanban` en el tablero enlazado (se quita en `destroy`); un segundo `bindKanban` devuelve los mismos controles sin duplicar listeners. No se escribe en el marcado |
| `data-cap-kanban-column` | `kanban.js` | Columna; su valor es el id que viaja en `from`/`to`. Con `data-wip-limit` el módulo llena `.cap-kanban__wip` y marca `data-full`; `data-active="true"` la muestra en móvil |
| `data-cap-kanban-list` | `kanban.js` | Lista de tarjetas de la columna y zona de soltado; lleva `data-over="true"` mientras una tarjeta pasa por encima |
| `data-cap-kanban-card` | `kanban.js` | Tarjeta movible (`tabindex="0"`, `draggable="true"`); su valor es el `cardId`. Lleva `data-dragging="true"` mientras está tomada |
| `data-cap-kanban-count` | `kanban.js` | Contador de tarjetas de la columna; lo reescribe `refresh()` |
| `data-cap-kanban-picker` | `kanban.js` | Segmentado móvil hermano del tablero; sus botones llevan `value="<id de columna>"` y su `cap:segmented-change` activa esa columna |
| `data-cap-module-pin` | `module-pin.js` | Botón de estrella de una tarjeta de módulo (`.cap-module-card__pin`); su valor es el id del módulo. Al hacer clic no sigue el enlace de la tarjeta: alterna `aria-pressed` y el ícono (`mdi-star` / `mdi-star-outline`) y despacha `cap:module-pin` (con `bubbles`) con `{ id, pinned }`. El `aria-label` es fijo («Fijar <nombre del módulo>»): solo cambia `aria-pressed`. En Vue el botón no lleva el atributo: el componente maneja el clic |
| `data-cap-module-bound` | `module-pin.js` | Lo ponen `bindModulePin` y `bindModuleRequest` en el botón enlazado (se quita con el liberador); un segundo enlace devuelve un liberador sin efecto y no duplica el listener. No se escribe en el marcado |
| `data-cap-module-request` | `module-pin.js` | Botón «Solicitar acceso» de una tarjeta sin acceso (`button.cap-module-card__request`); su valor es el id del módulo. Al hacer clic despacha `cap:module-request` (con `bubbles`) con `{ id }` sin seguir ningún enlace |

Módulos sin atributo: `count-up.js` exporta `formatCount(value, format)`, `collapse.js` exporta también `bindSidebarPeek(sidebar)`, que devuelve el liberador y que cada port debe llamar al montar el sidebar. `storage.js` (`readItem`/`writeItem` y la clave del riel), `on-escape.js` (`onEscape(document, handler)` devuelve el liberador), `popover.js` exporta también `belongsToPanel`, `sheet.js` exporta `createDragToClose`, `focus-trap.js` (`trapFocus(container, initialFocus)` devuelve el liberador), `toast-queue.js` (`createToastQueue`, sin DOM), `toast-motion.js` (clases y funciones del movimiento de toasts, ver «Toasts»), `motion.js` (`prefersReducedMotion`, `power3Out`, `power3InOut`; `pill-nav.js` reexporta las dos curvas).

### Lo que la app debe cablear

El marco no adivina estas piezas:

- **`data-cap-search`** va en el input de búsqueda **de la app**, entregado por el slot `search`, en Blade y HTML. En Vue no hace falta: `CapHeader` enlaza ⌘K al input del slot. El slot es solo para búsqueda global (ver «Búsqueda» en `DESIGN_GUIDE.md`).
- **«Marcar todo como leído»**: Vue emite `mark-all-read`; Blade envía un formulario POST a `mark-read-action` y sin esa prop no muestra el botón; en HTML, React y Astro la app define el `action` del formulario. Los **filtros** ya funcionan solos (`data-cap-notifications`).
- **«Cerrar sesión»** (botón del usuario en sidebar y hoja): Vue emite `logout`; Blade envía un formulario POST con `@csrf` a `logout-action`, o a `route('logout')` si existe, o a `/logout`; en HTML, React y Astro la app define el `action` del formulario.
- **Lupa de la topbar**: Vue emite `search`; Blade y HTML enlazan a `search-href` (defecto `#`, sin destino real hasta que la app lo defina). Si el sistema no tiene búsqueda móvil, se oculta con `topbarSearch` / `topbar-search` en `false`.
- **`data-cap-confirm-open`**: el disparador lo pone la app donde corresponda; `confirm.js` solo escucha el clic en el documento.
- **`cap:confirm`** (vanilla): la app lo escucha y decide qué hacer y cuándo cerrar.
- **Enlace activo y tipo de enlace** (`a`, `Link` de Inertia, `<Link>` de Next, etc.): los decide la app. Con `RouterLink`, además, `linkProp="to"`.

## Props: Vue y Blade

`CapAppLayout` (`design/vue/CapAppLayout.vue` y `design/blade/components/cap/app-layout.blade.php`).

| Concepto | Vue (prop / evento / slot) | Blade (prop / slot) |
|---|---|---|
| Nombre del sistema | `systemName` (requerida) | `system-name` |
| Menú | `menu` (requerida) | `menu` |
| Pestañas móviles | `tabs` (máx. 4 visibles) | `tabs` (máx. 4) |
| Usuario | `user` (requerida) | `user` |
| Título | `title` (requerida) | `title` |
| Migas | `breadcrumbs` | `breadcrumbs` |
| Secciones | `sections` | `sections` |
| Notificaciones | `notifications` | `notifications` |
| Componente de enlace | `linkComponent` (defecto `'a'`) | no existe: siempre `<a href>` |
| Prop del destino del enlace | `linkProp` (defecto `'href'`; `'to'` para vue-router) | no existe |
| Volver (topbar) | `backHref` (vacía = logo y nombre del sistema) | `back-href` |
| Lupa (topbar) | `topbarSearch` (defecto `true`) y evento `search` | `topbar-search` (defecto `true`) y `search-href` (defecto `#`) |
| Acciones de la topbar | slot `topbar-actions` | slot `topbarActions` (`<x-slot:topbar-actions>`) |
| Etiqueta del FAB | `fabLabel` (vacía = sin FAB) | `fab-label` (vacía = sin FAB) |
| Destino del FAB | evento `fab` | `fab-href` (defecto `#`) |
| «Ver todas» | `notificationsHref`; sin él, botón que emite `view-all` | `notifications-href`; sin él, no hay enlace |
| Conmutador de módulos | `modules` (vacío = sin disparador, sin panel y sin módulos en «Más») | `:modules` |
| «Ver todos» del conmutador | `modulesHref`; sin él, no hay enlace | `modules-href`; sin él, no hay enlace |
| Identidad de la empresa | `owner`, `mark` (sidebar, header, layout) y `subtitle`, `owner`, `mark` (acceso); defectos `company.name`, `company.mark`, `company.loginSubtitle` y `company.loginOwner` de `design/company.js` | `owner`, `mark`, `subtitle`; defectos `config('design.company.name')`, `config('design.company.mark')`, `config('design.company.loginSubtitle')` y `config('design.company.loginOwner')` |
| Marcar leído | evento `mark-all-read` | `mark-read-action` (POST con `@csrf`; vacía = sin botón) |
| Clic en notificación | evento `notification` (recibe el `id`); con `href` también navega | `href` en cada notificación |
| Cerrar sesión | evento `logout` | `logout-action` (defecto `route('logout')` si existe, si no `/logout`) |
| Buscador | slot `search` | slot `search` |
| Acciones del header | slot `header-actions` | slot `header-actions` |
| Contenido | slot por defecto | `$slot` |
| Ítem activo | `active` en cada ítem | `active`, o se deduce de `route` con `request()->routeIs()` |

Otros componentes:

| Componente | Vue | Blade |
|---|---|---|
| Confirmación | `CapConfirmDialog`: `open`, `title`, `message`, `confirmLabel`, `icon`, `acknowledgeLabel`, `loading`; eventos `confirm`, `cancel` | `x-cap.confirm-dialog`: `id`, `title`, `message`, `confirm-label`, `icon`, `acknowledge-label`, `action`, `method`. Envía un **formulario real** (`@csrf` y `@method`). Se abre con `data-cap-confirm-open="{id}"` |
| Acceso | `CapLogin`: `systemName`, `tagline`, `owner`, `mark`, `subtitle`, `photoUrl`, `providers`, `helpEmail`, `mode`, `alert`, `loading`; eventos `submit`, `provider`, `recover`, `back`, `forgot` | `x-cap.login`: `system-name`, `tagline`, `owner`, `mark`, `subtitle`, `photo-url`, `providers`, `help-email`, `mode`, `alert`, `logos-path` (defecto `/cap/logos`), `recover-url` (defecto `route('password.request')` si existe, si no `/forgot-password`). Envía formularios reales con rutas Laravel si existen |
| Aviso | `CapAlert`: `status`, `title`, `detail`, `icon` | `x-cap.alert`: `status`, `title`, `detail`, `icon` |
| Botón | `CapButton`: `variant`, `type`, `href`, `icon`, `disabled`, `loading`, `linkComponent`, `linkProp` | `x-cap.button`: `variant`, `type`, `href`, `icon`, `loading` |
| Segmentado | `CapSegmented`: `items` (`{ label, value?, href?, count? }`), `modelValue` (`v-model`), `label`, `linkComponent`, `linkProp` | `x-cap.segmented`: `items`, `value`, `label`; los botones despachan `cap:segmented-change` con `detail.value` |
| Tablero kanban | `CapKanban`: `columns` (requerida; `{ id, title, tone?, wipLimit?, emptyTitle?, emptyHint?, addLabel? }`), `cards` (requerida; `{ id, column, code, title, priority?, amount?, badge?, assignees?, tag?, meta?, blocked? }`), `label` (defecto `'Tablero'`), `pickerLabel` (defecto `'Etapa'`); eventos `move` (`{ cardId, from, fromIndex, to, index }`; la app actualiza `cards` y, para rechazar, no lo hace), `add`, `column-menu` (id de columna), `card-menu` (id de tarjeta); slot `card` (`{ card }`) para el cuerpo de la tarjeta | `x-cap.kanban`: `columns`, `cards`, `label`, `picker-label`; sin slot. La app escucha `cap:kanban-move` en el tablero y arma los menús |
| Portada de módulos | `CapModuleGrid`: `modules` (requerida; `{ id, name, description, icon, href, group, pending?: { label, status? }, lastUsed?, pinned?, featured?, granted?, requestHref? }`; `status` `brand`, `error` o `warning`; `granted` falsy (false o 0) = sin acceso, sin la clave = con acceso), `groupCountLabel` (función; defecto «1 módulo» / «n módulos»), `linkComponent` (defecto `'a'`), `linkProp` (defecto `'href'`); eventos `pin` (`{ id, pinned }`; la estrella no navega y el componente guarda su estado) y `request` (`{ id }`, «Solicitar acceso» sin `requestHref`) | `x-cap.module-grid`: `modules`. La estrella lleva `data-cap-module-pin` y despacha `cap:module-pin`; «Solicitar acceso» sin `requestHref` lleva `data-cap-module-request` y despacha `cap:module-request`. La app los escucha y guarda |
| «Continuar» | `CapModuleRecent`: `items` (requerida; `{ module, label, href, icon }`), `label` (defecto `'Continuar'`), `linkComponent`, `linkProp`; con `items` vacío no pinta nada | `x-cap.module-recent`: `items`, `label` (defecto `'Continuar'`) |
| Conmutador de módulos | `CapModuleSwitcher`: `modules` (requerida; `{ id, name, icon, href, current? }`; lista lo que recibe: el layout ya quitó los bloqueados), `allHref` (defecto `''`, sin enlace «Ver todos»), `hidden` (defecto `false`), `linkComponent`, `linkProp`; lo usa `CapHeader` cuando el layout recibe `modules` | `x-cap.module-switcher`: `modules`, `all-href`; lo usa `x-cap.header` y se pinta con `hidden` |
| Navegación de secciones | `CapSectionNav`: `sections`, `mobile`, `linkComponent`, `linkProp`; la usa `CapHeader` (escritorio y fila móvil) y enlaza su píldora con `usePillNav` | `x-cap.section-nav`: `sections`, `mobile`; la usa `x-cap.header` |
| Toasts | `useToasts()` y `<CapToaster/>` (ya incluido en el layout) | `<x-cap.toaster/>` + `window.capToast(...)` + flash `session('cap_toast')` |

Notas de implementación:

- **Vue**: el estado de toasts es de **módulo** (una sola cola por aplicación). Con SSR (Nuxt) ese estado se comparte entre peticiones: no encolar toasts durante el render del servidor, solo en el cliente.
- **Vue y Blade**: el header solo muestra el buscador y su atajo ⌘K si el layout recibe el slot `search`.
- **Vue**: el panel de notificaciones se cierra al abrir una notificación o «Ver todas», aunque el layout persista entre páginas. Al portar a React, haz lo mismo.
- **Blade**: requiere cargar `shell-auto.js` (o `initShell`) para el comportamiento; el HTML se sirve completo desde el servidor. Única excepción a «sin `<script>`»: `sidebar.blade.php` trae un script en línea que aplica el estado del riel antes de pintar, para que no parpadee. Con una CSP sin `unsafe-inline` ese script no corre y `shell-auto.js` aplica el estado después, con el parpadeo.
- **Vue**: requiere Vue 3.5 o superior (`useId`).

## Portar a React

Los textos de identidad (nombre de la empresa en el sidebar, letra del logo, subtítulo y propietario del acceso) no se escriben en el componente: salen de `tokens.json › company` del proyecto (`name`, `mark`, `loginSubtitle`, `loginOwner`), igual que los defaults de las props `owner`, `mark` y `subtitle` en Vue.

Estrategia: componentes propios que renderizan **las mismas clases y atributos** de `reference/app.html`; el comportamiento se importa de `design/shell/js/` tal cual dentro de hooks. **No reimplementar reglas** (tiempos de toast, atrapar foco, clave de storage, defectos por ancho).

| Pieza | Componente |
|---|---|
| Layout | `CapAppLayout` (lienzo, sidebar, header, tabbar, hoja, FAB, toaster) |
| Sidebar | `CapSidebar`, `CapSidebarItem` (hijos con `details`) |
| Header | `CapHeader` (incluye topbar móvil) |
| Notificaciones | `CapNotifications` |
| Conmutador de módulos | `CapModuleSwitcher` (si hay `modules`) |
| Tabbar y hoja | `CapTabBar`, `CapMoreSheet` |
| Toasts | `CapToaster` + función `showToast` |
| Confirmación | `CapConfirmDialog` |
| Acceso | `CapLogin` |

Estado que vive en el **layout**: `collapsed` (inicializado con `resolveCollapsed(window.innerWidth)` dentro de `useEffect`, no durante el render), `moreOpen` (hoja), `notificationsOpen`, y la lista de toasts.

Módulos a importar sin copiar:

- `collapse.js` y `storage.js`: `resolveCollapsed`, `writeCollapsed`. Al alternar, guardar con `writeCollapsed`.
- `toast-queue.js`: una sola cola a nivel de módulo, suscrita con `useSyncExternalStore` o `useEffect` + `useState`; `pause` y `resume` en `onMouseEnter`/`onMouseLeave` y `onFocus`/`onBlur`.
- `toast-motion.js`: el toast que sale de la cola se sigue renderizando hasta que `playExit` llama a `done` (tras `pinInPlace`); `playEnter` en el ref al montar; `captureTops` antes de aplicar la lista nueva y `slideFromPreviousTops` en `useLayoutEffect`.
- `focus-trap.js`: dentro de `useEffect` cuando la hoja o el diálogo se abren; **devolver el liberador** como limpieza.
- `theme.js`: `onClick={toggleTheme}`.
- `command-k.js`: `useEffect(() => bindCommandK(inputRef.current), [])`; la función ya devuelve su limpieza.

Patrón:

```jsx
useEffect(() => {
  if (!open) return undefined;
  return trapFocus(panelRef.current, cancelRef.current);
}, [open]);
```

Para `Escape` y clic fuera, usar los mismos criterios de `sheet.js` / `popover.js` / `confirm.js` (ver «Comportamiento»); o, si el marco es estático, llamar `initShell()` en un `useEffect` del layout y usar su función de limpieza (con `React.StrictMode`, que monta dos veces, la limpieza es obligatoria).

Reglas de React: `className`, `htmlFor`, `aria-*` en kebab-case, `hidden` booleano; `data-collapsed={String(collapsed)}`. **El enlace activo y el tipo de enlace los decide la app** (como en Vue): el componente recibe `active` y un `linkComponent`/`as`. Para la navegación de secciones: `useEffect(() => bindPillNav(navRef.current).destroy, [])`; el ítem activo lo decide la app con `aria-current="page"` y la píldora lo sigue sola. El segmentado usa el marcado de `reference/app.html` (`.cap-segmented` con `data-cap-pill-nav`) y el mismo `bindPillNav`; los botones llevan `aria-pressed`. Si el framework es dueño de la selección (estado controlado, como `CapSegmented.vue`), pasa `bindPillNav(el, { manageSelection: false })`: el módulo no escribe `aria-pressed` ni emite `cap:segmented-change`, solo pinta la píldora y sigue los atributos. Los eventos `logout`, `mark-all-read`, `view-all`, `notification`, `search` y `fab` son callbacks (`onLogout`, etc.).

## Portar a Astro

Los textos de identidad (nombre de la empresa, letra del logo, subtítulo y propietario del acceso) salen de `tokens.json › company` del proyecto, no se copian de `reference/*.html`, que son textos de ejemplo.

1. Copiar el HTML de `design/shell/reference/app.html` a `src/components/cap/*.astro` (Sidebar, Header, TabBar, MoreSheet, Notifications, Toaster) y convertir lo repetido en props.
2. Cargar el CSS (`design/shell.css`) y, **una sola vez en el layout**:

```astro
<script>import '../../design/shell-auto.js'</script>
```

   `shell-auto.js` ejecuta `initShell()` y expone `window.capToast`. Astro empaqueta el script una vez por página aunque haya varios componentes.
3. Ítem activo con `Astro.url.pathname`: `aria-current={Astro.url.pathname === item.href ? 'page' : undefined}`, y la variante rellena del ícono cuando está activo.
4. Con View Transitions (`<ClientRouter />`) el DOM se reemplaza: volver a llamar `initShell()` en `astro:page-load` y guardar la función de limpieza para la página siguiente.
5. La navegación de secciones ya viene en el marcado de referencia y `initShell` enlaza `data-cap-pill-nav`.
6. El resto es HTML estático: las piezas «que la app debe cablear» (búsqueda con `id="cap-global-search"`, `data-cap-confirm-open`, cierre de sesión, «Marcar todo como leído») se hacen con formularios, enlaces o un script propio.
