# CAP Suite — Panel de administración y rediseño "Cabina · Plata fría"

Fecha: 2026-08-21
Estado: aprobado en diseño, pendiente de plan de implementación

## 1. Objetivo

Dos entregas en un mismo proyecto:

1. **Panel admin**: una sección `/admin` protegida por contraseña desde la que Leonardo puede crear, editar y eliminar aplicaciones, recursos/documentos, contactos y empresas, incluyendo subida de archivos (logos y documentos), con los cambios visibles al instante en el portal.
2. **Rediseño visual**: todo el portal migra a la dirección "Cabina · Plata fría" (A2), elegida entre mockups: estética premium-ejecutiva clara inspirada en el HMI de un vehículo de lujo, con neutros gris-azulados y los seis colores de las empresas del grupo como único color.

## 2. Decisiones tomadas (con Leonardo)

| Tema | Decisión |
|---|---|
| Hosting | VPS propio con Node |
| Arquitectura | Astro SSR (adapter Node) + SQLite; sin servicios externos |
| Acceso admin | Un solo administrador, contraseña en variable de entorno, sesión por cookie |
| Alcance CRUD | Aplicaciones, recursos, contactos y empresas |
| Archivos | Subida de logos y documentos al disco del servidor |
| Dirección visual | A2 "Cabina · Plata fría" (clara); rechazadas: dashboard genérico, editorial, industrial, y las variantes oscuras |
| Categorías de apps | Fijas en código; el admin elige de la lista |

## 3. Arquitectura técnica

### 3.1 Modo servidor

- `astro.config.mjs` pasa a `output: 'server'` con `@astrojs/node` (modo `standalone`).
- Todas las páginas se renderizan por request leyendo de SQLite: un cambio en el admin se ve al instante.
- El proceso se corre en el VPS con pm2/systemd (fuera del alcance de este repo; se documentan las variables de entorno).

### 3.2 Base de datos

- SQLite vía `better-sqlite3`. Archivo en `DATABASE_PATH` (default `data/cap-suite.db`, gitignored).
- Módulo `src/lib/db.ts`: abre la conexión, crea las tablas si no existen y expone funciones de consulta/mutación tipadas. Ningún componente toca SQL directamente fuera de este módulo.

Tablas:

```sql
companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  segment TEXT NOT NULL,
  description TEXT NOT NULL,
  slogan TEXT NOT NULL,
  color TEXT NOT NULL,            -- hex
  url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
)

apps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT NOT NULL,         -- una de las categorías fijas
  company_label TEXT,             -- texto libre con sugerencias desde companies
  logo_path TEXT,                 -- ruta bajo uploads/ o URL externa
  featured INTEGER NOT NULL DEFAULT 0,
  badge TEXT,                     -- 'nuevo' | NULL
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
)

resources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL,             -- 'manual' | 'template' | 'folder' | 'link'
  url TEXT,                       -- enlace externo…
  file_path TEXT,                 -- …o archivo subido (exactamente uno de los dos)
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
)

contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  department TEXT NOT NULL,
  company TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  extension TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
)
```

Notas:

- `apps.company_label` es texto (hoy hay apps de "Grupo CAP", que no es una de las seis empresas). El color del LED se resuelve buscando una empresa cuyo `name` coincida; si no hay match, se usa el neutro tinta.
- Las categorías (`erp`, `microsoft365`, `portals`, `tools`, `talent`, `marketing`) y sus estilos viven en `src/data/categories.ts` como hasta ahora.

### 3.3 Migración de datos

- Los arrays actuales de `src/data/{apps,resources,contacts,companies}.ts` se mueven a `scripts/seed-data.ts`; en `src/data/` solo quedan `types.ts` y `categories.ts`.
- Script `scripts/seed.ts` (`npm run seed`): inserta `seed-data.ts` en SQLite y copia los logos de `public/logos/` a `uploads/logos/`. Idempotente: si una tabla ya tiene filas, la salta.

### 3.4 Subida y servido de archivos

- Directorio `UPLOADS_DIR` (default `uploads/`, gitignored) con subcarpetas `logos/` y `docs/`.
- Nombres saneados: slug del nombre original + sufijo aleatorio corto, extensión en lista blanca.
- Límites: logos PNG/SVG/JPG/WebP máx. 2 MB; documentos PDF/Office máx. 20 MB.
- Ruta `src/pages/files/[...path].ts`: sirve archivos por streaming con content-type correcto, rechaza rutas fuera de `UPLOADS_DIR` (guard contra path traversal).
- `public/` queda solo para assets de build (favicon, logos estáticos existentes se migran a `uploads/logos/` vía seed).
- Al eliminar o reemplazar un registro con archivo subido, el archivo huérfano se borra del disco.

### 3.5 Autenticación y sesión

- Variables: `ADMIN_PASSWORD` (obligatoria) y `SESSION_SECRET` (obligatoria); el servidor no arranca sin ellas.
- Login en `/admin/login`: formulario de contraseña; comparación en tiempo constante.
- Sesión: cookie `cap_admin_session` HttpOnly + SameSite=Lax + Secure (en producción), valor `expiración.firma` con HMAC-SHA256 sobre `SESSION_SECRET`. Vigencia 7 días. Logout la borra.
- `src/middleware.ts`: toda ruta `/admin/*` (excepto `/admin/login`) y toda action de mutación exige sesión válida; sin sesión redirige a `/admin/login`.
- Sin límite de intentos sofisticado: un pequeño retraso fijo (~500 ms) en login fallido basta para este contexto interno.

### 3.6 Mutaciones

- Astro Actions (`src/actions/index.ts`) con validación `astro:schema` para cada operación CRUD y para uploads (FormData).
- Errores de validación regresan al formulario con mensajes en español, sin perder lo tecleado.

## 4. Panel admin — UI

Estructura (según mockup aprobado):

- **Layout propio** (`src/layouts/AdminLayout.astro`): barra lateral oscura (#15181D) con las cuatro colecciones y sus conteos, badge dorado "ADMIN", franja espectral de los 6 colores, enlaces "Ver el portal" y "Cerrar sesión".
- **Dashboard `/admin`**: conteos por colección y últimos elementos editados.
- **Listados** (`/admin/apps`, `/admin/recursos`, `/admin/contactos`, `/admin/empresas`): tabla con filtro por texto, columnas clave, toggle rápido de "destacada" (apps), acciones Editar / Eliminar y flechas subir/bajar para ajustar `sort_order`. Eliminar pide confirmación. Estado vacío con invitación a crear el primer elemento.
- **Formularios** de alta/edición en modal (isla Vue con `<script setup>`): campos según la tabla, dropdowns para categoría y empresa (empresa con texto libre + sugerencias), dropzone de archivos con estados de subida y error.
- Todo el flujo debe cubrir estados vacío/carga/error, no solo el happy path.

## 5. Rediseño "Cabina · Plata fría"

### 5.1 Tokens (`src/styles/global.css`)

```css
--color-base:        #EEF0F3;  /* fondo general, con radial sutil a blanco arriba */
--color-surface:     #FFFFFF;  /* tarjetas y paneles */
--color-edge:        #DFE3E9;
--color-edge-strong: #C3C8D1;
--color-ink:         #15181D;  /* texto principal y botones primarios */
--color-body:        #4A5160;
--color-muted:       #7D838E;
--color-admin-gold:  #D4A843;  /* solo badge ADMIN */
```

- Sin acento de marca propio en el portal: **el color lo ponen las seis empresas** (valores en la tabla `companies`).
- Tipografía: **Manrope** (300–800, texto y display) + **IBM Plex Mono** (metadatos, etiquetas con tracking amplio), self-hosted vía `@fontsource` — nada de CDNs en la red interna.

### 5.2 Elementos firma (presentes en todo el sitio)

1. **Línea de luz ambiental**: filete de 2px bajo la nav con gradiente de los 6 colores de empresa (leídos de la BD) y glow suave.
2. **LED de empresa**: punto de color con glow en cada tarjeta de app, según su empresa.
3. **Paleta de comandos ⌘K**: la búsqueda global vive en un modal invocable con ⌘K/Ctrl+K desde cualquier página (evolución de `SearchFilter.vue`); también un campo visible en el inicio.
4. **Regla de ticks**: divisor de ticks finos con los conteos (sistemas, recursos, contactos, empresas) salidos de la BD.

### 5.3 Páginas

- **Inicio**: deja de ser landing de marketing y se vuelve lanzador — saludo por hora del día ("Buenos días/tardes/noches" + fecha · Tegucigalpa, sin nombre propio), búsqueda al centro, apps destacadas como paneles, accesos a recursos recientes y directorio, regla de ticks al pie. Desaparecen blobs, emojis como iconos y la barra de stats tipo template.
- **Aplicaciones / Recursos / Contactos / Empresas**: mismas funciones actuales con la piel nueva; tarjetas blancas con borde `edge` y sombra suave, etiquetas mono en mayúsculas con tracking.
- **Nav y footer**: wordmark "CAP SUITE" con tracking .32em, línea ambiental, footer sobrio.
- Animación: la carga del inicio "enciende" en secuencia sutil (nav → línea de luz → contenido), respetando `prefers-reduced-motion`. Nada de efectos dispersos.

## 6. Manejo de errores

- Middleware y actions: sin sesión → redirect a login; validación fallida → mensajes por campo en español.
- Uploads: tipo o tamaño inválido → error inline en la dropzone; fallo de disco → mensaje claro sin perder el resto del formulario.
- `/files/*`: 404 para rutas inexistentes o fuera del directorio.
- Páginas públicas con BD vacía: estados vacíos diseñados (no páginas rotas).

## 7. Verificación

- **Vitest**: capa `db.ts` (CRUD + resolución de color de empresa), firma/verificación de sesión, saneo de nombres de archivo y guard de path traversal.
- `astro check` y `astro build` sin errores.
- Prueba manual del flujo completo: login → crear app con logo → verla al instante en el portal → editar → eliminar (verifica borrado del archivo).

## 8. Fuera de alcance

- Cuentas para colaboradores o roles múltiples (un solo admin).
- Categorías de apps editables desde el admin.
- Modo oscuro (el portal es claro por diseño).
- Notificaciones, auditoría de cambios, papelera/versionado.

## 9. Variables de entorno

| Variable | Uso | Default |
|---|---|---|
| `ADMIN_PASSWORD` | contraseña del admin | — (obligatoria) |
| `SESSION_SECRET` | firma HMAC de la cookie | — (obligatoria) |
| `DATABASE_PATH` | archivo SQLite | `data/cap-suite.db` |
| `UPLOADS_DIR` | carpeta de archivos subidos | `uploads` |
| `HOST` / `PORT` | bind del servidor Node | `0.0.0.0` / `4321` |
