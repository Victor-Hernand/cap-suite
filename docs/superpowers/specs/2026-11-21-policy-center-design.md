# CAP Suite — Centro de Políticas y Páginas de Departamento (v1, sin login)

Fecha: 2026-11-21
Estado: pendiente de aprobación de Leonardo
Origen: ficha REQ-2026-001 v1.3 (Sindy Castro, Gerencia General / Mejora Continua) y mockup `mockup_suite_politicas.html`

## 1. Intención

Hoy las políticas del grupo viven como archivos sueltos (Word, PNG) en OneDrive. No hay un lugar único para consultar qué política está vigente ni qué aplica a cada departamento. Esta entrega le da a CAP Suite una sección «Políticas» y una página por departamento para que cualquier colaborador las consulte, y a Mejora Continua un lugar para publicarlas desde el panel admin.

Es la primera versión y **no tiene login de colaboradores**. Leonardo decidió (2026-11-21) construir solo la parte de consulta; después se evalúa si vale la pena agregar identidad para lecturas, preguntas, reportes y supervisión.

## 2. Objetivos, no-objetivos y anti-objetivos

**Objetivos**

- Biblioteca de políticas filtrable (RF-03).
- Ficha de política con lineamientos, anexos múltiples y control de cambios.
- Página por cada uno de los 17 departamentos con seis bloques (RF-07).
- Alta y edición de políticas y del contenido de departamento desde `/admin` (RF-01, RF-02 simplificado).
- Un solo catálogo de departamentos para políticas y contactos.

**No-objetivos (quedan para una versión con identidad)**

- Marcar como leída, % de lectura (RF-04).
- Preguntas y reportes de incumplimiento (RF-05, RF-06).
- Pantalla de supervisión (RF-08) y avisos in-app o por correo (RN-11).
- Clasificaciones Confidencial y Restringida (RN-12).
- Paso de aprobación separado y suplente de aprobador (RN-10).
- Migración masiva de políticas, exportar reportes (ya excluidos en la ficha).

**Anti-objetivos**

- Que una política marcada como Confidencial o Restringida quede legible en un portal sin login. Por eso esas dos opciones no existen en el formulario de esta versión.
- Cambiar el aspecto de la suite. El mockup define contenido y estructura; los estilos son los de la suite («Cabina · Plata fría», tokens de `src/styles/global.css`), no los colores del mockup.
- Transformar la sección Recursos: se conserva tal cual.

## 3. Restricciones

- Stack existente: Astro 5 SSR (adapter Node), SQLite con `better-sqlite3`, islas Vue 3 con `<script setup>`, Tailwind 4. Sin dependencias nuevas.
- Todo el SQL vive en `src/lib/db.ts`; el esquema se crea con `CREATE TABLE IF NOT EXISTS` y las migraciones son funciones idempotentes llamadas desde `openDb` (patrón de `migrateSingleManual`).
- Un solo administrador con contraseña compartida. Las mutaciones son Astro actions protegidas por el middleware actual; no se toca `src/middleware.ts`.
- La suite está abierta en internet. Todas las páginas ya llevan `noindex` desde `Layout.astro`. Una política «Interna» la puede leer quien tenga la dirección, igual que hoy el directorio de contactos. Leonardo lo sabe y lo acepta para esta versión.
- Convenciones del proyecto: código y nombres en inglés, textos de interfaz en español, sin comentarios obvios, funciones cortas, estados vacío/carga/error en cada pantalla.

## 4. Enfoques considerados

1. **Editor propio para políticas + `CollectionManager` para lo demás (elegido).** La política tiene partes repetibles (lineamientos, anexos, control de cambios) que no caben en el modal plano de `CollectionManager`; lleva una página de edición propia. Procesos, formatos, enlaces y avisos de departamento son filas simples y reutilizan `CollectionManager`.
2. **Extender `CollectionManager` con campos repetibles.** Un solo patrón, pero complica un componente que usan cinco pantallas para servir a una.
3. **Todo plano.** Lineamientos en un cuadro de texto y anexos como colección aparte. Más barato, pero la ficha pierde la estructura del mockup y el alta de una política queda repartida en tres pantallas.

Leonardo delegó la elección técnica; se va con la 1.

## 5. Catálogo de departamentos

`src/data/departments.ts` pasa de 14 nombres a los 17 de la ficha, cada uno con `slug` y `name`. Lista fija en código (DT-04).

Gerencia Administrativa · Gerencia Operativa · Talento Humano · Legal · Contabilidad General · Finanzas y Tesorería · Compras e Importaciones · Comercial e Inteligencia de Negocios · Marketing y Desarrollo Digital · Mejora Continua y Automatización · Tecnología y Desarrollo · Cadena de Suministro B2B y B2C · Servicios Generales · Proyectos e Infraestructura · Flota Vehicular · Soporte Técnico y Activos Fijos · Auditoría y Control Interno

Las tablas guardan el **nombre** del departamento como texto (igual que `contacts.department` hoy); el slug solo se usa en direcciones.

### 5.1 Reubicación de contactos (decisión de Leonardo: unificar)

Migración idempotente en `openDb` que renombra el departamento de los contactos existentes:

| Departamento actual | Pasa a | Nota |
|---|---|---|
| Gerencia | Gerencia Administrativa | Dudoso: la Gerencia General no está entre los 17 |
| Administración | Gerencia Administrativa | |
| Auditoría | Auditoría y Control Interno | |
| Contabilidad | Contabilidad General | |
| Finanzas | Finanzas y Tesorería | |
| Créditos y Cobros | Finanzas y Tesorería | Dudoso |
| Compras | Compras e Importaciones | |
| Logística | Cadena de Suministro B2B y B2C | |
| Bodega | Cadena de Suministro B2B y B2C | Dudoso |
| Operaciones | Gerencia Operativa | Dudoso |
| Ventas | Comercial e Inteligencia de Negocios | |
| Mercadeo | Marketing y Desarrollo Digital | |
| Recursos Humanos | Talento Humano | |
| Tecnología | Tecnología y Desarrollo | |

Los dudosos se corrigen después contacto por contacto desde `/admin/contactos`. `scripts/seed-data.ts` se actualiza a los nombres nuevos.

## 6. Modelo de datos

Cuatro tablas para políticas y cuatro para contenido de departamento. Todas con `id`, `sort_order` donde aplique, `created_at`, `updated_at`.

```
policies
  slug UNIQUE, title, department, type, classification, status,
  summary, objective, scope, indicators (opcional),
  related_documents (texto libre, opcional),
  owner, approver,
  version, effective_date, next_review_date,
  official_file_path

policy_guidelines     policy_id, title, body, sort_order
policy_attachments    policy_id, kind (file|link|video), label, url, file_path, sort_order
policy_versions       policy_id, version, date, author, reason

department_processes  department, name, steps (un paso por línea), sort_order
department_formats    department, name, url, file_path, sort_order
department_links      department, label, url, sort_order
department_notices    department, date, body, kind (warning|info), sort_order
```

Listas cerradas (en `src/data/`):

- **Tipo:** Política, Procedimiento, Instructivo, Lineamiento, Infografía.
- **Clasificación:** Pública, Interna.
- **Estado:** Borrador, Vigente, En revisión, Obsoleta.

Fechas guardadas como `YYYY-MM-DD` y mostradas como `dd/mm/aaaa`. Borrar una política borra sus hijos y sus archivos del disco.

Decisiones propias (no pedidas por Leonardo):

- Una fila por política con bitácora de versiones, no una fila por versión. Sin lecturas por versión no hace falta más; si llega el login, las lecturas se pueden atar a `(policy_id, version)`.
- «Documentos relacionados» es texto libre, no enlaces entre políticas.
- «Supervisado por: Mejora Continua y Automatización» es texto fijo en la ficha.

## 7. Archivos

Nuevo tipo de subida `policies` en `UPLOAD_RULES` (resuelve PEN-01 y PEN-03): público, 20 MB, extensiones PDF, Office (`.doc .docx .xls .xlsx .ppt .pptx`) e imagen (`.png .jpg .jpeg .webp`) porque las infografías oficiales son PNG. Lo usan el documento oficial, los anexos de tipo archivo y los formatos de departamento. Se sirven por la ruta `/files` existente.

Enlaces y videos se guardan como URL (`https://…`); el video se abre en pestaña nueva, no se incrusta.

Los archivos de una política en Borrador quedan técnicamente alcanzables si alguien adivina el nombre (lleva sufijo aleatorio). Se acepta.

## 8. Reglas de estado y versión

- **Borrador:** invisible en todo el portal público (biblioteca, ficha por URL directa → 404, página de departamento, contadores, búsqueda ⌘K). CA-01.
- **Vigente, En revisión, Obsoleta:** visibles. La biblioteca muestra por defecto Vigente y En revisión; Obsoleta aparece al elegirla en el filtro de estado.
- Para salir de Borrador se exigen los campos obligatorios, documento oficial y fecha de vigencia. Si falta alguno, el servidor rechaza nombrando el campo (RN-03, CA-02).
- Obligatorios siempre: título, departamento, tipo, clasificación (CA-02).
- El editor tiene dos acciones:
  - **Guardar:** guarda el contenido sin cambiar versión ni fecha de vigencia. Disponible en cualquier estado.
  - **Publicar versión:** diálogo que pide versión (`v<mayor>.<menor>`), fecha de vigencia, autor y motivo. Valida lo exigido para salir de Borrador, actualiza `version` y `effective_date`, deja la política en **Vigente** y agrega una línea a `policy_versions`. Es la única forma de sacar una política de Borrador (primera publicación) y la forma de publicar versiones posteriores.
- `version` y `effective_date` no son campos sueltos del formulario: solo los escribe «Publicar versión». En Borrador están vacíos.
- La primera versión puede llevar cualquier número (por ejemplo v2.1): las políticas ya tienen historia fuera de la suite.
- El campo «estado» del formulario solo ofrece los cambios que no son publicar: entre Vigente, En revisión y Obsoleta, y volver a Borrador para despublicar. Borrador → publicado por «Guardar» se rechaza en el servidor.
- **Historial previo:** las líneas del control de cambios se pueden agregar, editar y quitar a mano, con fechas pasadas, para cargar la historia anterior de una política (el ejemplo del mockup trae v1.0, v2.0 y v2.1). Es una lista editable más del editor; «Publicar versión» solo agrega una línea nueva.
- RN-02 («una Vigente no se edita») se relaja a propósito: sin lecturas por versión, bloquear la edición solo estorba. Decisión propia.

### 8.1 Criterios de la ficha en esta versión

La ficha REQ-2026-001 v1.3 no está en el repositorio; este documento es la fuente para construir. De sus criterios de aceptación aplican CA-01, CA-02, CA-05 y CA-10 (descritos arriba) y CA-04 (un visitante sin sesión no puede modificar nada: ya lo cubre el middleware actual, que protege `/admin` y todas las actions). CA-03 queda reducido a «Publicar versión» sin paso de aprobación. CA-06 a CA-09 y CA-11 a CA-14 dependen de identidad y quedan fuera.

## 9. Pantallas públicas

Navegación superior (`siteConfig.nav`): Inicio · Aplicaciones · Recursos · **Políticas** · **Departamentos** · Contactos · Empresas.

### 9.1 `/politicas` — Biblioteca

Encabezado «Centro de Políticas y Lineamientos» y texto guía. Barra de filtros: búsqueda por título, departamento, tipo, clasificación, estado. Tarjetas en cuadrícula de 3 columnas (1 en móvil).

```
┌──────────────────────────────────────┐
│ GERENCIA ADMINISTRATIVA              │
│ Políticas de Reuniones Virtuales…    │
│ [Política] [Interna] [Vigente]       │
│ v2.1 · 02/06/2026                    │
└──────────────────────────────────────┘
```

- Isla Vue con filtrado en cliente; los filtros se reflejan en la query string para que `/politicas?departamento=<slug>` abra ya filtrado.
- Sin resultados con filtros: «Sin resultados» y botón para limpiar (CA-05). Sin políticas publicadas: «Aún no hay políticas publicadas».
- No hay botón «+ Nueva política» en la parte pública; el alta es en admin.
- No se muestran lectura ni número de preguntas.

### 9.2 `/politicas/[slug]` — Ficha

Dos columnas (una en móvil), como el mockup.

- **Principal:** badges (tipo, estado, clasificación, versión · fecha), título, departamento y responsable, Resumen, Objetivo, Ámbito de aplicación, Lineamientos (bloques numerados con título y texto), Anexos (etiqueta de tipo + nombre; archivo descarga, enlace/video abre en pestaña nueva) y botón «Descargar oficial».
- Si el documento oficial es una imagen (infografía), se muestra dentro de la ficha además del botón de descarga.
- **Lateral:** departamento (enlace a su página), clasificación, vigencia desde, próxima revisión, responsable, aprobador, supervisado por, documentos relacionados, control de cambios (más reciente primero), indicadores.
- Las secciones opcionales vacías no se pintan. Política Obsoleta: aviso visible al inicio de la ficha.
- Slug inexistente o Borrador: 404.

### 9.3 `/departamentos` y `/departamentos/[slug]`

Índice: cuadrícula con los 17 departamentos y cuántas políticas visibles tiene cada uno.

Página de departamento, como el mockup:

- Encabezado con nombre, frase fija («Todo lo que necesitas para trabajar con {nombre}: políticas, procesos, formatos, equipo, sistemas y avisos.») y contadores: Políticas, Procesos, Formatos, Personas.
- Columna principal: Políticas del departamento (con «Ver todas →» a la biblioteca filtrada), Procesos y flujos (nombre + pasos como píldoras con flechas), Formatos y plantillas (descarga o enlace).
- Columna lateral: Equipo (contactos de ese departamento, con foto o iniciales), Enlaces rápidos, Avisos (fecha + texto, estilo según `kind`, más reciente primero).
- Cada bloque vacío muestra su propio mensaje («Aún no hay formatos», etc.) y los demás cargan normal (CA-10).

### 9.4 Cambios en pantallas existentes

- `/contactos`: el encabezado de cada grupo enlaza a la página del departamento.
- Búsqueda ⌘K (`buildSearchItems`): se agregan políticas visibles (sección «Políticas») y departamentos (sección «Departamentos»).
- El inicio no cambia.

## 10. Panel admin

Nuevas entradas en la barra lateral: **Políticas** y **Departamentos**, con sus contadores.

### 10.1 `/admin/politicas`

Tabla con título, departamento, tipo, estado y versión; filtro de texto y orden como las demás tablas; botón «Nueva política»; eliminar con confirmación.

### 10.2 `/admin/politicas/nueva` y `/admin/politicas/[id]`

Página completa (no modal) con un editor Vue:

- Datos generales: título, departamento, tipo, clasificación, estado, responsable, aprobador, próxima revisión.
- Contenido: resumen, objetivo, ámbito de aplicación, documentos relacionados, indicadores.
- Documento oficial (subida, usa `FileDrop`).
- Lineamientos: lista para agregar, quitar y reordenar (título + texto).
- Anexos: lista para agregar, quitar y reordenar; cada uno elige tipo (archivo, enlace, video) y lleva nombre (RN-05).
- Control de cambios: lista editable (versión, fecha, autor, motivo) para cargar historial previo, más el botón «Publicar versión» (sección 8).
- Errores por campo junto al campo y mensaje general arriba, igual que `useActionForm`. Estado de envío en el botón.

Se reutilizan `FormField`, `FileDrop`, `formStyles` y `useActionForm`.

### 10.3 `/admin/departamentos` y `/admin/departamentos/[slug]`

Índice con los 17 departamentos y sus conteos. Cada departamento tiene una página con cuatro tablas `CollectionManager` (Procesos, Formatos, Enlaces, Avisos) ya acotadas a ese departamento. El equipo se administra en `/admin/contactos`.

## 11. Validación y pruebas

- Esquemas zod en `src/actions/formSchemas.ts` con los ayudantes existentes (`requiredText`, `optionalUrl`, `listEnum`); límites nuevos en `FIELD_MAX` (título 160, textos largos 2000, texto de lineamiento 1500).
- Pruebas con vitest sobre `db.ts` y validación: borradores invisibles en los listados públicos, rechazo al publicar sin documento o sin fecha, bitácora de versiones, borrado en cascada, migración de departamentos de contactos (idempotente), conteos por departamento.
- Verificación final: `npm test`, `npm run check` y recorrido manual de las cuatro pantallas públicas y el editor.

## 12. Lo que queda al constructor

- Nombres exactos de componentes, funciones y actions, y cómo partir `db.ts` si crece demasiado.
- Cómo acotar `CollectionManager` a un departamento (prop nueva o valor oculto) y cómo extender su tipo `Collection`.
- Si el editor guarda todo en una sola action o por secciones.
- Maquetación fina con los tokens de la suite.
- Sembrar como ejemplo la política real «Reuniones Virtuales con Gerencia Administrativa» (contenido en el mockup) en `scripts/seed-data.ts`.
