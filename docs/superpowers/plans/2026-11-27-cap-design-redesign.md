# Rediseño con el CAP design system — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que el portal público y el admin de CAP Suite usen la línea gráfica de Grupo CAP: marco de vidrio, tokens `cap-*`, recetario y modo oscuro, sin perder funcionalidad.

**Architecture:** El design system 3.8.0 ya está instalado en `src/design/` (marca `cap`). El marco se porta a componentes Astro (`src/components/shell/`) desde `src/design/shell/reference/app.html`, como indica `SHELL_SPEC.md › Portar a Astro`. Ambos layouts (`Layout.astro` público y `AdminLayout.astro`) lo usan con distinta navegación. Las islas Vue usan los componentes de `src/design/vue/` (CapButton, CapSegmented, CapConfirmDialog, CapSkeleton, CapAlert). Las clases compartidas viven en `src/lib/capClasses.ts`, copiadas tal cual del recetario.

**Tech Stack:** Astro 5 (SSR, `ClientRouter`), Vue 3 islas, Tailwind 4 con `@config` y el preset `cap`, Vitest, Playwright para capturas.

**Spec:** El pedido del usuario («rediseña este sistema en base a la línea gráfica de CAP»), las decisiones tomadas en la conversación (marco en todo, acceso sin foto, rama `feat/cap-design-redesign`) y `src/design/DESIGN_GUIDE.md` + `src/design/shell/SHELL_SPEC.md`, que son la fuente de verdad visual.

## Global Constraints

- Ningún hex, `rgba(`, `backdrop-filter`, `z-index` ni `text-[Npx]` a mano en `src/` fuera de `src/design/`; colores solo con clases `cap-*` o `var(--cap-*)`.
- Nombre de la empresa siempre desde `company` (`src/design/company.js`); nunca «Grupo CAP» ni «Grupo Empresarial CAP» escrito a mano. Excepción: los datos de la base (nombres de empresas filiales).
- Botones: `cap-button cap-button--primary|secondary|danger` (o `CapButton` en Vue). Un primario por pantalla.
- Tablas, badges, campos, modales, vacíos, esqueletos y avisos: clases exactas del «Recetario» de `DESIGN_GUIDE.md`.
- Íconos solo `mdi-*`; sin emojis; sin mayúsculas espaciadas (`uppercase tracking-*`); nada por debajo de `text-xs`.
- Movimiento solo con `duration-cap-*`, `ease-cap*`, `animate-cap-*`; se elimina `.page-enter`, `.lift`, `.blob`, `.ambient-strip`.
- Cada pantalla con sus estados: vacío, sin resultados, cargando (>120 ms), error, parcial, según aplique.
- Modo oscuro obligatorio: alias de rol (`bg-cap-card`, `border-cap-divider`…) o par `dark:` en clases físicas.
- Un solo buscador por pantalla: el global del header (búsqueda en varias secciones). Las listas no llevan buscador de texto propio.
- Comentarios, textos de interfaz en español; identificadores en inglés.

## Review Focus

1. **Navegación con `ClientRouter`**: al cambiar de página el marco (colapsar, tema, popovers, ⌘K, toasts) sigue funcionando y no duplica listeners → `initShell` se rearma en `astro:page-load` con la limpieza previa (Task 2, verificación manual + test de `isActiveHref`).
2. **Tema sin parpadeo**: recargar en oscuro no muestra un destello claro → el script de tema va inline en `<head>` de ambos layouts (Task 1).
3. **Móvil < 1024 px**: el sidebar se oculta, aparecen topbar, tabbar con 4 destinos + «Más», y las tablas del admin pasan a tarjetas de lista móvil → capturas a 390 px en Task 8.
4. **Acceso sin JavaScript / error de contraseña**: el login del admin es solo contraseña (`ADMIN_PASSWORD`); con error muestra el aviso en línea y el campo marcado, nunca un toast (Task 6).
5. **Búsqueda global sin resultados o con teclado**: flechas, Enter y Esc funcionan; «Sin resultados para "x"» se muestra (Task 3, tests de `searchItems`).

---

## Estructura de archivos

| Archivo | Responsabilidad |
|---|---|
| `src/components/shell/ThemeHead.astro` (nuevo) | Script de tema sin parpadeo, fuentes Inter + Poppins, metas. Lo usan los tres layouts. |
| `src/components/shell/AppShell.astro` (nuevo) | Marco completo: sidebar, header, nav móvil, tabbar, hoja «Más», toaster, confirmación; ciclo `initShell`. |
| `src/components/shell/ShellSidebar.astro`, `ShellHeader.astro`, `ShellTabBar.astro`, `ShellMoreSheet.astro` (nuevos) | Piezas del marco portadas de `reference/app.html`. |
| `src/data/navigation.ts` (nuevo) | `publicNavigation`, `buildAdminNavigation(totals)`, `isActiveHref()`, `mobileDestinations()`. |
| `src/lib/capClasses.ts` (nuevo) | Clases del recetario reutilizadas (tarjeta, tabla, campo, vacío, aviso). Reemplaza `publicStyles.ts` y `formStyles.ts`. |
| `src/lib/policyBadges.ts` (nuevo) | `policyBadgeTone(id)` → `'ok' | 'warning' | 'neutral' | 'info'`. Sustituye `badgeClassOf`. |
| `src/components/HeaderSearch.vue` (nuevo) | Buscador global en el slot `search` del header; reemplaza `CommandPalette.vue`. |
| `src/components/shell/AdminLogin.astro` (nuevo) | Pantalla de acceso portada de `reference/login.html`. |
| `src/layouts/Layout.astro`, `src/layouts/AdminLayout.astro` | Pasan a usar `AppShell`. |
| `src/styles/global.css` | Queda con los imports del design system y la capa base mínima. |
| Se eliminan | `Nav.astro`, `Footer.astro`, `TickRuler.astro`, `CommandPalette.vue`, `publicStyles.ts`, `formStyles.ts` |

---

### Task 1: Base: cabecera compartida, clases del recetario y badges

**Files:**
- Create: `src/components/shell/ThemeHead.astro`, `src/lib/capClasses.ts`, `src/lib/policyBadges.ts`
- Modify: `src/data/policies.ts` (quitar `badgeClassOf`, `neutralBadgeClass`, `BADGE_BASE`), `src/styles/global.css`, `package.json` (quitar `@fontsource/ibm-plex-mono`)
- Test: `tests/policy-badges.test.ts`

**Interfaces:**
- Produces: `ThemeHead` (props `title: string`); `policyBadgeTone(id: string): StatusTone` y `policyBadgeClass(id: string): string` (= `statusBadgeClass(policyBadgeTone(id))`); en `capClasses.ts`: `cardClass`, `tableClass`, `tableHeadClass`, `tableCellClass`, `fieldLabelClass`, `fieldInputClass`, `fieldSelectClass`, `fieldTextareaClass`, `fieldErrorClass`, `fieldHelpClass`, `emptyStateClass`, `iconButtonClass` — valores copiados del Recetario (Tarjeta / panel, Tabla, Campo de formulario, Selector y área de texto, Estado vacío, Botón de ícono).

- [ ] **Step 1: Test** `tests/policy-badges.test.ts`: `policyBadgeTone('active') === 'ok'`, `'under-review' → 'warning'`, `'draft' → 'info'`, `'obsolete' → 'neutral'`, tipos y clasificaciones (`'policy'`, `'internal'`) → `'neutral'`, id desconocido → `'neutral'`; `policyBadgeClass('active')` contiene `text-cap-status-ok`.
- [ ] **Step 2:** `npx vitest run tests/policy-badges.test.ts` → FAIL (módulo inexistente).
- [ ] **Step 3:** Implementar `policyBadges.ts` (importa `statusBadgeClass` de `../design/statuses.js`). Actualizar los usos de `badgeClassOf` (`PolicyBadges.astro`, `PolicyLibrary.vue`, admin) a `policyBadgeClass`, con el punto `h-1.5 w-1.5 rounded-full bg-current` del recetario solo en el estado.
- [ ] **Step 4:** `ThemeHead.astro`: mover el bloque que el instalador puso en `AdminLayout.astro` (script de tema + fuentes bunny) + `meta charset/viewport/robots` + `<title>`. `global.css`: quitar imports de IBM Plex Mono e Inter fontsource (las fuentes llegan por `ThemeHead`), `color-scheme: light`, `.admin-select`, el foco y la selección propios (el design system los trae; verificar en `tokens.css`). El `@theme` viejo (`base`, `ink`, `edge`…) se mantiene hasta Task 7.
- [ ] **Step 5:** `npm test && npm run check` → PASS.
- [ ] **Step 6:** Commit `feat: add CAP recipe classes and policy badge tones`.

### Task 2: Marco (shell) portado a Astro

**Files:**
- Create: `src/data/navigation.ts`, `src/components/shell/{AppShell,ShellSidebar,ShellHeader,ShellTabBar,ShellMoreSheet}.astro`
- Modify: `src/layouts/Layout.astro`, `src/layouts/AdminLayout.astro`
- Delete: `src/components/Nav.astro`, `src/components/Footer.astro`
- Test: `tests/navigation.test.ts`

**Interfaces:**
- Produces:
  - `type NavItem = { label: string; href: string; icon: string; count?: number }` (icon = nombre mdi sin prefijo, p. ej. `'view-dashboard-outline'`); `type NavGroup = { label: string; items: NavItem[] }`.
  - `publicNavigation: NavGroup[]`: grupo «Portal» con Inicio `/` (`home-outline`), Aplicaciones `/apps` (`apps`), Recursos `/recursos` (`folder-outline`), Políticas `/politicas` (`file-document-outline`), Departamentos `/departamentos` (`office-building-outline`); grupo «Directorio» con Contactos `/contactos` (`account-box-outline`), Empresas `/empresas` (`domain`).
  - `buildAdminNavigation(totals: Counts): NavGroup[]`: «Panel» `/admin`; «Contenido» con Aplicaciones, Recursos, Políticas, Departamentos, Manuales (con `count`); «Directorio» con Contactos, Empresas (con `count`).
  - `isActiveHref(pathname: string, href: string): boolean`: `/` y `/admin` solo exactos; el resto también por prefijo (`/politicas/x` activa `/politicas`); ignora barra final.
  - `mobileDestinations(groups: NavGroup[]): NavItem[]`: los 4 primeros ítems en orden.
  - `AppShell` props: `title: string`, `crumbs?: string[]`, `systemName: string`, `navigation: NavGroup[]`, `user?: { name: string; caption: string; logoutAction: string } | null`, `portalLink?: { label: string; href: string } | null`; slots: default, `search`.
- Consumes: `company` de `src/design/company.js`.

- [ ] **Step 1: Test** `tests/navigation.test.ts`: `isActiveHref('/', '/')` true, `isActiveHref('/apps', '/')` false, `isActiveHref('/politicas/codigo-etica', '/politicas')` true, `isActiveHref('/admin/apps', '/admin')` false, `isActiveHref('/apps/', '/apps')` true; `mobileDestinations(publicNavigation)` devuelve los hrefs `['/', '/apps', '/recursos', '/politicas']`; `buildAdminNavigation({ apps: 3, … })` pone `count: 3` en Aplicaciones y ningún `count` en Panel.
- [ ] **Step 2:** `npx vitest run tests/navigation.test.ts` → FAIL.
- [ ] **Step 3:** Implementar `navigation.ts`; mover `siteConfig.nav` a `publicNavigation` y dejar en `site.ts` solo lo que siga usándose (o borrarlo si nada lo usa).
- [ ] **Step 4:** Portar el marcado de `reference/app.html` (líneas 88–207 y la tabbar/hoja «Más»/toaster/confirmación del resto del archivo) a los componentes de shell. Reglas: ítem activo con `aria-current="page"` e ícono relleno (`mdi-x` en vez de `mdi-x-outline`); marca del sidebar con `company.mark`, `systemName` y `company.name` debajo; sin campana ni conmutador de módulos (el portal no tiene notificaciones ni módulos); el bloque de usuario solo si `user` (admin: «Administrador», formulario POST a `/admin/logout`); en el público, `portalLink` = «Administración» → `/admin` en el pie del sidebar. Botón de tema `data-cap-theme-toggle` en ambos.
- [ ] **Step 5:** En `AppShell.astro`, un `<script>` que importe `initShell` de `../../design/shell.js` y `showToast` de `../../design/shell/js/toasts.js`, asigne `window.capToast`, y en `astro:page-load` llame a la limpieza anterior antes de `initShell()` (paso 4 de «Portar a Astro»). Quitar el `<script>` de `shell-auto.js` que puso el instalador en `AdminLayout.astro`.
- [ ] **Step 6:** `Layout.astro`: `ThemeHead` + `ClientRouter` + `<body class="bg-cap-page">` + `AppShell` con `publicNavigation`, `systemName="Portal"`, slot `search` vacío por ahora. `AdminLayout.astro`: igual con `buildAdminNavigation(counts(db))`, `systemName="Administración"`, `user`. La prop `active` de `AdminLayout` desaparece (se deriva de `Astro.url.pathname`); actualizar sus usos. El contenido de cada página se envuelve en `flex flex-col gap-6`; el título de página pasa al header (`title`), así que se quitan los `h1` y `SectionHeader` duplicados en Tasks 4–5.
- [ ] **Step 7:** `npm test && npm run check && npm run build` → PASS. `npm run dev`, abrir `/` y `/admin`: colapsar sidebar, cambiar tema, navegar con el router y comprobar que todo sigue respondiendo.
- [ ] **Step 8:** Commit `feat: port the CAP shell to Astro for portal and admin`.

### Task 3: Buscador global en el header

**Files:**
- Create: `src/components/HeaderSearch.vue`
- Modify: `src/layouts/Layout.astro`, `src/components/shell/ShellHeader.astro` (la lupa móvil y el campo solo se pintan si `Astro.slots.has('search')`; el admin no lleva búsqueda), `src/lib/search.ts`
- Delete: `src/components/CommandPalette.vue`
- Test: `tests/search.test.ts`

**Interfaces:**
- Consumes: `buildSearchItems(db): SearchItem[]` (existente).
- Produces: `filterSearchItems(items: SearchItem[], query: string, limit = 8): SearchItem[]` en `src/lib/search.ts` (la lógica que hoy vive en el `computed` de `CommandPalette.vue`); `HeaderSearch` props `items: SearchItem[]`.

- [ ] **Step 1: Test** en `tests/search.test.ts`: con query vacía devuelve los 8 primeros; filtra sin distinguir mayúsculas por `name`, `description` y `section`; con query sin coincidencias devuelve `[]`; respeta `limit`.
- [ ] **Step 2:** `npx vitest run tests/search.test.ts` → FAIL.
- [ ] **Step 3:** Implementar `filterSearchItems`. `HeaderSearch.vue` (`<script setup lang="ts">`, props tipadas con default `[]`): marcado `cap-shell-header__search` de la referencia con `id="cap-global-search"` y `data-cap-search` (⌘K lo enfoca `initShell`); al escribir abre un listbox debajo (nivel 1: `bg-cap-card border border-cap-divider rounded-cap-control shadow-md z-cap-dropdown`, oscuro `dark:bg-cap-card-2`), flechas/Enter/Esc, `role="combobox"`/`aria-activedescendant`, sección a la derecha en `text-xs text-cap-text-soft`, «Sin resultados para "x"» como estado vacío. Montar con `client:load` en el slot `search` del header público. La lupa móvil abre el mismo campo.
- [ ] **Step 4:** `npm test && npm run check` → PASS; probar ⌘K, flechas, Enter y Esc en `/`.
- [ ] **Step 5:** Commit `feat: move global search into the CAP header`.

### Task 4: Páginas públicas

**Files:**
- Modify: `src/pages/{index,apps,recursos,contactos,empresas,404}.astro`, `src/pages/politicas/{index,[slug]}.astro`, `src/pages/departamentos/{index,[slug]}.astro`, `src/components/{AppCard,CompanyCard,ContactCard,ResourceCard,PolicyBadges,SectionHeader}.astro`, `src/components/PolicyLibrary.vue`
- Delete: `src/components/TickRuler.astro`, `src/lib/publicStyles.ts`

**Interfaces:**
- Consumes: `capClasses.ts`, `policyBadgeClass` (Task 1), `AppShell` con `title`/`crumbs` (Task 2).

- [ ] **Step 1: Inicio** (`index.astro`): receta «Portada de módulos» (saludo + grupos de tarjetas): aplicaciones destacadas como tarjetas de módulo (`CapModuleCard` no aplica en Astro: copiar el HTML de la receta), luego accesos a Recursos, Políticas y Departamentos. Sin hero con manchones ni `TickRuler`.
- [ ] **Step 2: Aplicaciones / Recursos**: filtro por categoría o tipo con el segmentado (`cap-segmented`, de 2 a 5 opciones; si hay más de 5, selector). Tarjetas `cardClass`, logo en `rounded-cap-control`, badge con `statusBadgeClass('neutral')`. Estado vacío de la receta.
- [ ] **Step 3: Contactos**: tabla del recetario desde `lg` (enlace del nombre en `text-cap-brand dark:text-cap-brand-soft`), tarjeta de lista móvil por debajo; avatar sin foto `bg-cap-taupe`.
- [ ] **Step 4: Empresas**: tarjetas con logo/imagen; el color de la empresa solo como muestra de 10 px (`cap-shell-sidebar__child-swatch` de la referencia) con `style` desde el dato, no como fondo.
- [ ] **Step 5: Políticas**: `PolicyLibrary.vue` sin campo de texto (el buscador global ya cubre políticas): estado con `CapSegmented` (Todas, Vigente, En revisión, Obsoleta), tipo/departamento/clasificación con selector del recetario; grupos por departamento en tarjetas; badges con `policyBadgeClass`; estados vacío y sin resultados con «Limpiar filtros» (secundario). Ajustar `policyFilter.ts`/tests si el filtro de texto se elimina. Ficha (`[slug].astro`): receta «Datos de un registro» + «Historial» para el control de cambios; descargar el documento oficial = único primario.
- [ ] **Step 6: Departamentos**: índice en tarjetas con conteos `tabular-nums`; detalle con secciones (procesos, formatos, enlaces, avisos) como tarjetas; avisos con el aviso en línea del recetario.
- [ ] **Step 7: 404**: receta «Página de error» dentro del marco.
- [ ] **Step 8:** `npm test && npm run check && npm run build` → PASS. `grep -rnE "#[0-9a-fA-F]{3,6}\b|rgba\(|text-\[[0-9]+px\]|uppercase|tracking-\[|font-mono" src/pages src/components --include=*.astro --include=*.vue` (excluyendo `admin/`) → sin resultados.
- [ ] **Step 9:** Commit `feat: redesign public portal pages with CAP recipes`.

### Task 5: Admin: tablas, formularios, modales y confirmaciones

**Files:**
- Modify: `src/pages/admin/**/*.astro` (salvo `login.astro`), `src/components/admin/*.vue`
- Delete: `src/components/admin/formStyles.ts`, `src/components/admin/DeleteRowButton.vue` (si queda sin uso)

**Interfaces:**
- Consumes: `capClasses.ts` (Task 1), `CapButton`, `CapConfirmDialog`, `CapSkeleton`, `CapAlert`, `CapSegmented` de `src/design/vue/`; `window.capToast` (Task 2).

- [ ] **Step 1: Panel** (`admin/index.astro`): fila de tarjetas de cifra (una destacada `bg-cap-gradient-featured`, el resto normales, `data-cap-count`), con flecha ↗ porque llevan al listado.
- [ ] **Step 2: Listados** (`CollectionManager.vue`, `PolicyTable.vue`, `SortableHeader.vue`, `TablePager.vue`): «Barra de acciones de la página» con el primario «Nueva …»; tabla del recetario con `cap-stagger-rows`; paginación del recetario; menú `⋮` de fila (`usePopover`) con Editar y Eliminar; tarjeta de lista móvil por debajo de `lg`.
- [ ] **Step 3: Eliminar**: `CapConfirmDialog` con verbo y objeto («Eliminar la aplicación "X"»), «Cancelar» a la izquierda con foco inicial, aceptar `danger-solid`. Sustituye `DeleteRowButton` y el `confirmingDelete` en línea de `PolicyEditor.vue`. Tras éxito, `window.capToast` con el resultado.
- [ ] **Step 4: Formularios** (`FormModal.vue`, `FormField.vue`, `RepeatableList.vue`, `FileDrop.vue`, `RequiredMark.vue`): receta «Modal» y «Campo de formulario»; error de campo con `cap-field--error`; error general con `CapAlert status="error"`; botón enviar con `loading` mientras guarda.
- [ ] **Step 5: Editor de políticas** (`PolicyEditor.vue` y secciones, `PublishVersionDialog.vue`): bloques de formulario en tarjetas con 32 px entre bloques, `max-w-7xl`; «Publicar versión» = único primario; versiones con la receta «Historial».
- [ ] **Step 6: Departamentos y Manuales** (`admin/departamentos/*`, `admin/manual*`, `PdfViewer.vue`, `StoredFileLink.vue`): mismas recetas; el visor PDF en tarjeta con esqueleto mientras carga.
- [ ] **Step 7:** `npm test && npm run check && npm run build` → PASS; el grep de Task 4 sobre `src/pages/admin` y `src/components/admin` → sin resultados.
- [ ] **Step 8:** Commit `feat: redesign admin screens with CAP recipes`.

### Task 6: Pantalla de acceso del admin

**Files:**
- Create: `src/components/shell/AdminLogin.astro`
- Modify: `src/pages/admin/login.astro`

**Interfaces:**
- Consumes: `ThemeHead` (Task 1); la acción/POST de login existente sin cambios.

- [ ] **Step 1:** Portar `reference/login.html` sin foto (panel izquierdo con fondo del marco y manchones, como indica la guía): etiqueta con `company.mark` y «CAP Suite · Administración»; frase «Administra las aplicaciones, políticas y directorio del portal.» y `company.loginOwner`. Formulario: título «Ingresa a la administración», subtítulo `company.loginSubtitle`, solo el campo Contraseña con ver contraseña (no hay correo, «Mantener la sesión», recuperar ni proveedores: el admin usa `ADMIN_PASSWORD`), primario «Ingresar» con `data-cap-login-form="Ingresando…"`, botón de tema. Error de credenciales: `cap-alert cap-alert--error` arriba y `cap-field--error` en el campo; nunca toast.
- [ ] **Step 2:** `npm run check && npm run build` → PASS; probar contraseña incorrecta (aviso visible) y correcta (redirige a `/admin`) con `npm run dev`.
- [ ] **Step 3:** Commit `feat: CAP sign-in screen for the admin`.

### Task 7: Limpieza de tokens viejos

**Files:**
- Modify: `src/styles/global.css`, cualquier archivo que aún use `bg-base`, `bg-surface`, `text-ink`, `text-body`, `text-muted`, `border-edge`, `admin-gold`

- [ ] **Step 1:** `grep -rnE "\b(bg|text|border|from|to)-(base|surface|edge|edge-strong|ink|ink-solid|body|muted|admin-gold)\b" src --include=*.astro --include=*.vue --include=*.ts` → migrar cada resultado al alias `cap-*` equivalente (`base`→`cap-page`, `surface`→`cap-card`, `edge`→`cap-divider`, `edge-strong`→`cap-input-line`, `ink`→`text-gray-900 dark:text-white` o el alias de la guía, `body`/`muted`→`cap-text-soft`).
- [ ] **Step 2:** Borrar el `@theme` viejo, `.ambient-strip`, `.page-enter` y la capa base duplicada de `global.css`.
- [ ] **Step 3:** El grep del Step 1 → sin resultados; `npm test && npm run check && npm run build` → PASS.
- [ ] **Step 4:** Commit `refactor: drop legacy theme tokens`.

### Task 8: Verificación visual, revisión, `/simplify` y manual

- [ ] **Step 1:** Script de capturas en el scratchpad (Playwright, `npm run build` + `node dist/server/entry.mjs`): cada ruta pública y de admin en 1440 px claro, 1440 px oscuro (`localStorage.theme='dark'`) y 390 px. Revisar contra «Antes de terminar una pantalla» de `DESIGN_GUIDE.md` y corregir.
- [ ] **Step 2:** Revisión de la rama completa (`superpowers:requesting-code-review`) y aplicar hallazgos reales.
- [ ] **Step 3:** `/simplify` sobre el diff completo; presentar hallazgos y aplicarlos.
- [ ] **Step 4:** Actualizar `docs/manuales/<slug>/guion.json` si cambian textos o pasos (p. ej. el filtro de texto de políticas), regenerar capturas y enviar el borrador con la skill `cap-manual`.
- [ ] **Step 5:** `npm test && npm run check && npm run build` → PASS. Commit `docs: refresh manual for the CAP redesign`.
