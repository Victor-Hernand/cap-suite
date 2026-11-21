# Centro de Políticas y Páginas de Departamento — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar a CAP Suite la biblioteca de políticas, la ficha de política, una página por cada uno de los 17 departamentos y su mantenimiento desde `/admin`, sin login de colaboradores.

**Architecture:** Tablas nuevas en SQLite (esquema en `src/lib/db.ts`, consultas en dos módulos nuevos). La política se edita en una página propia con un editor Vue que envía un solo formulario; el contenido de departamento reutiliza `CollectionManager`. Las páginas públicas son Astro SSR; solo la biblioteca usa una isla Vue para filtrar en cliente.

**Tech Stack:** Astro 5 SSR (adapter Node), Vue 3 `<script setup lang="ts">`, better-sqlite3, Tailwind 4, zod (`astro/zod`), vitest. Sin dependencias nuevas.

**Spec:** `docs/superpowers/specs/2026-11-21-policy-center-design.md`

## Global Constraints

- Sin dependencias nuevas. No tocar `src/middleware.ts`.
- Código, nombres de archivo e identificadores en inglés; textos de interfaz en español.
- Sin comentarios obvios, sin código muerto ni imports sin usar; funciones de ~40 líneas como máximo.
- Vue: Composition API con `<script setup lang="ts">`, props tipadas con defaults.
- Estilos: tokens y clases existentes de la suite (`src/styles/global.css`, `src/components/admin/formStyles.ts`). No copiar colores del mockup.
- Cada pantalla cubre estados vacío y error, no solo el caso feliz.
- Clasificación solo `public` e `internal`. Confidencial y Restringida no existen en esta versión.
- Una política en `draft` no aparece en ninguna superficie pública: biblioteca, ficha por URL (404), página de departamento, contadores, búsqueda ⌘K.
- Fechas guardadas `YYYY-MM-DD`, mostradas `dd/mm/aaaa`. Versión con formato `v<mayor>.<menor>` (regex `^v\d+\.\d+$`).
- **No hacer commits ni push.** Leonardo los pide cuando quiera. Cada tarea termina con sus pruebas en verde, sin commit.
- Reutilizar antes de crear: `FormField`, `FileDrop`, `formStyles`, `useActionForm`, `useTableView`, `SectionHeader`, `ContactCard`, ayudantes de `formSchemas.ts`.

## Review Focus

1. **Borrador filtrado por una vía lateral** (búsqueda ⌘K, contador de departamento, URL directa): debe ser invisible en todas. Pruebas en Tareas 2 y 6.
2. **URL de anexo o enlace que no es http(s)** (`javascript:…`): el servidor la rechaza; nunca llega a un `href`. Prueba en Tarea 3.
3. **Ruta de archivo de anexo inventada en el formulario** (apuntar a un archivo de otra política o fuera de `policies/`): el servidor solo acepta rutas que la política ya tenía. Prueba en Tarea 3.
4. **Renombrar una política**: el slug no cambia, los enlaces compartidos siguen vivos; dos políticas con el mismo título reciben slugs distintos. Prueba en Tarea 2.
5. **Filtro por query string con valor desconocido** (`/politicas?departamento=no-existe`): se ignora ese filtro y la biblioteca carga normal. Prueba en Tarea 5.

## File Structure

| Archivo | Responsabilidad |
|---|---|
| `src/data/departments.ts` (modificar) | Catálogo de 17 departamentos con slug y mapa de nombres antiguos |
| `src/data/policies.ts` (crear) | Listas cerradas: tipos, clasificaciones, estados, tipos de anexo |
| `src/lib/db.ts` (modificar) | Tablas nuevas, `foreign_keys`, migración de contactos, `moveRow` acotado |
| `src/lib/policies.ts` (crear) | Consultas y reglas de políticas |
| `src/lib/departmentContent.ts` (crear) | CRUD de procesos, formatos, enlaces y avisos |
| `src/lib/policyFilter.ts` (crear) | Filtro puro de la biblioteca y lectura de query string |
| `src/lib/dates.ts` (crear) | `formatDate` |
| `src/lib/fieldRules.ts`, `src/actions/formSchemas.ts`, `src/actions/index.ts` (modificar) | Límites, esquemas y actions nuevas |
| `src/components/PolicyLibrary.vue`, `PolicyBadges.astro` (crear) | Biblioteca y badges |
| `src/pages/politicas/index.astro`, `[slug].astro` (crear) | Biblioteca y ficha |
| `src/pages/departamentos/index.astro`, `[slug].astro` (crear) | Índice y página de departamento |
| `src/components/admin/PolicyEditor.vue`, `RepeatableList.vue`, `PublishVersionDialog.vue`, `PolicyTable.vue` (crear) | Editor y tabla admin |
| `src/pages/admin/politicas/index.astro`, `nueva.astro`, `[id].astro` (crear) | Admin de políticas |
| `src/pages/admin/departamentos/index.astro`, `[slug].astro` (crear) | Admin de departamentos |
| `src/components/admin/CollectionManager.vue`, `FormField.vue`, `types.ts`, `useActionForm.ts` (modificar) | Props `fixedValues` y `sortable`, campo fecha, `onSuccess` |

---

### Task 1: Catálogo de 17 departamentos y migración de contactos

**Files:**
- Modify: `src/data/departments.ts`, `src/lib/db.ts`, `src/actions/formSchemas.ts`, `src/pages/admin/contactos.astro`, `scripts/seed-data.ts`
- Test: `tests/departments.test.ts`

**Interfaces:**
- Produces (`src/data/departments.ts`):
  - `interface Department { slug: string; name: string }`
  - `departments: readonly Department[]` — 17 entradas, en el orden del spec §5, con estos slugs: `gerencia-administrativa`, `gerencia-operativa`, `talento-humano`, `legal`, `contabilidad-general`, `finanzas-y-tesoreria`, `compras-e-importaciones`, `comercial-e-inteligencia-de-negocios`, `marketing-y-desarrollo-digital`, `mejora-continua-y-automatizacion`, `tecnologia-y-desarrollo`, `cadena-de-suministro`, `servicios-generales`, `proyectos-e-infraestructura`, `flota-vehicular`, `soporte-tecnico-y-activos-fijos`, `auditoria-y-control-interno`
  - `departmentNames: [string, ...string[]]`
  - `findDepartmentBySlug(slug: string): Department | undefined`
  - `findDepartmentByName(name: string): Department | undefined`
  - `LEGACY_DEPARTMENT_NAMES: Record<string, string>` — las 14 filas de la tabla del spec §5.1
- Produces (`src/lib/db.ts`): `migrateContactDepartments(db: Db): void`, llamada desde `openDb` después de `migrateSingleManual`.

- [ ] **Step 1: Escribir las pruebas que fallan** en `tests/departments.test.ts`

```ts
test('el catálogo tiene 17 departamentos con slugs únicos', () => {
  expect(departments).toHaveLength(17);
  expect(new Set(departments.map((department) => department.slug)).size).toBe(17);
  expect(findDepartmentBySlug('compras-e-importaciones')?.name).toBe('Compras e Importaciones');
  expect(findDepartmentBySlug('no-existe')).toBeUndefined();
});

test('cada nombre antiguo apunta a un departamento del catálogo', () => {
  expect(Object.keys(LEGACY_DEPARTMENT_NAMES)).toHaveLength(14);
  for (const target of Object.values(LEGACY_DEPARTMENT_NAMES)) {
    expect(findDepartmentByName(target)).toBeDefined();
  }
});

test('migrateContactDepartments renombra y es idempotente', () => {
  const db = openDb(':memory:');
  db.prepare(`INSERT INTO contacts (name, role, department, company, phone, email)
    VALUES ('Ana', 'Jefa', 'Compras', 'CAP', '+504 9999-9999', 'ana@cap.hn'),
           ('Luis', 'Asesor', 'Departamento Fantasma', 'CAP', '+504 9999-9998', 'luis@cap.hn')`).run();
  migrateContactDepartments(db);
  migrateContactDepartments(db);
  const byEmail = Object.fromEntries(listContacts(db).map((contact) => [contact.email, contact.department]));
  expect(byEmail['ana@cap.hn']).toBe('Compras e Importaciones');
  expect(byEmail['luis@cap.hn']).toBe('Departamento Fantasma');
});
```

- [ ] **Step 2:** `npx vitest run tests/departments.test.ts` → FALLA (exportaciones inexistentes).
- [ ] **Step 3:** Reescribir `src/data/departments.ts` con las exportaciones de Interfaces. Conservar el comentario que explica por qué la lista es cerrada.
- [ ] **Step 4:** Implementar `migrateContactDepartments` en `db.ts`: un `UPDATE contacts SET department = ? WHERE department = ?` por cada entrada de `LEGACY_DEPARTMENT_NAMES`, dentro de una transacción.
- [ ] **Step 5:** Cambiar los dos consumidores (`formSchemas.ts` → `listEnum(departmentNames, …)`; `admin/contactos.astro` → opciones desde `departments`) y los `department:` de `scripts/seed-data.ts` a nombres nuevos según el mapa.
- [ ] **Step 6:** `npm test && npm run check` → todo en verde.

---

### Task 2: Capa de datos de políticas

**Files:**
- Create: `src/data/policies.ts`, `src/lib/policies.ts`
- Modify: `src/lib/db.ts` (SCHEMA, `foreign_keys`, exportar `nextSortOrder`, `counts`)
- Test: `tests/policies.test.ts`

**Interfaces:**
- Consumes: `departmentNames` (Tarea 1), `slugify`, `nextSortOrder`.
- Produces (`src/data/policies.ts`), cada lista como `{ id, label }[]`:
  - `policyTypes`: `policy` Política · `procedure` Procedimiento · `instruction` Instructivo · `guideline` Lineamiento · `infographic` Infografía
  - `policyClassifications`: `public` Pública · `internal` Interna
  - `policyStatuses`: `draft` Borrador · `active` Vigente · `under-review` En revisión · `obsolete` Obsoleta
  - `attachmentKinds`: `file` Archivo · `link` Enlace · `video` Video
  - tipos `PolicyType`, `PolicyClassification`, `PolicyStatus`, `AttachmentKind`
  - `labelOf(list, id): string`
- Produces (`src/lib/db.ts`): tablas `policies`, `policy_guidelines`, `policy_attachments`, `policy_versions` con las columnas del spec §6; las tres hijas con `policy_id INTEGER NOT NULL REFERENCES policies(id) ON DELETE CASCADE`. `openDb` ejecuta `db.pragma('foreign_keys = ON')`. `counts()` agrega `policies` (todas, incluidos borradores).
- Produces (`src/lib/policies.ts`):

```ts
export interface PolicyGuideline { title: string; body: string }
export interface PolicyAttachment { kind: AttachmentKind; label: string; url: string | null; filePath: string | null }
export interface PolicyVersion { version: string; date: string; author: string; reason: string }

export interface PolicyContentInput {
  title: string; department: string; type: PolicyType; classification: PolicyClassification;
  status: PolicyStatus;
  summary: string | null; objective: string | null; scope: string | null;
  indicators: string | null; relatedDocuments: string | null;
  owner: string | null; approver: string | null; nextReviewDate: string | null;
  officialFilePath: string | null;
  guidelines: PolicyGuideline[]; attachments: PolicyAttachment[]; versions: PolicyVersion[];
}

export interface PolicyRow extends Omit<PolicyContentInput, 'guidelines' | 'attachments' | 'versions'> {
  id: number; slug: string; version: string | null; effectiveDate: string | null;
}
export interface PolicyDetail extends PolicyRow {
  guidelines: PolicyGuideline[]; attachments: PolicyAttachment[]; versions: PolicyVersion[];
}
export interface PublishInput { version: string; effectiveDate: string; author: string; reason: string }

export class PolicyRuleError extends Error {}

export function listPolicies(db: Db): PolicyRow[];                    // todas, por título
export function listVisiblePolicies(db: Db): PolicyRow[];             // status != 'draft'
export function getPolicy(db: Db, id: number): PolicyDetail | null;
export function getVisiblePolicyBySlug(db: Db, slug: string): PolicyDetail | null;
export function createPolicy(db: Db, input: PolicyContentInput): PolicyDetail;   // siempre nace 'draft'
export function updatePolicy(db: Db, id: number, input: PolicyContentInput): PolicyDetail | null;
export function publishPolicyVersion(db: Db, id: number, input: PublishInput): PolicyDetail | null;
export function deletePolicy(db: Db, id: number): PolicyDetail | null;
export function policyFilePaths(policy: PolicyDetail): string[];      // oficial + anexos de archivo
export function countVisiblePoliciesByDepartment(db: Db): Map<string, number>;
```

Reglas que las firmas no fijan:
- El slug se genera del título al crear (único con sufijo `-2`, `-3`… como `createCompany`) y **no cambia** en `updatePolicy`.
- `updatePolicy` reemplaza por completo lineamientos, anexos y versiones, respetando el orden recibido. `versions` se devuelven ordenadas por `date DESC, id DESC`.
- `updatePolicy` lanza `PolicyRuleError('Usa «Publicar versión» para publicar un borrador.')` si la política está en `draft` y `input.status` no lo es.
- `publishPolicyVersion` lanza `PolicyRuleError('Sube el documento oficial antes de publicar.')` si `officialFilePath` es null. Si pasa: fija `version`, `effective_date`, `status = 'active'` y agrega una línea a `policy_versions`.

- [ ] **Step 1: Escribir las pruebas que fallan** en `tests/policies.test.ts`, con un ayudante `draftInput(overrides)` que devuelve un `PolicyContentInput` mínimo (`title: 'Reuniones virtuales'`, `department: 'Gerencia Administrativa'`, `type: 'policy'`, `classification: 'internal'`, `status: 'draft'`, resto null o `[]`):

```ts
test('una política nueva nace en borrador y no es visible', () => {
  const db = openDb(':memory:');
  const policy = createPolicy(db, draftInput({ status: 'active' }));
  expect(policy.status).toBe('draft');
  expect(listVisiblePolicies(db)).toHaveLength(0);
  expect(getVisiblePolicyBySlug(db, policy.slug)).toBeNull();
  expect(countVisiblePoliciesByDepartment(db).get('Gerencia Administrativa')).toBeUndefined();
});

test('no se publica sin documento oficial', () => {
  const db = openDb(':memory:');
  const policy = createPolicy(db, draftInput());
  const publish = { version: 'v2.1', effectiveDate: '2026-06-02', author: 'Moisés', reason: 'Carga inicial' };
  expect(() => publishPolicyVersion(db, policy.id, publish)).toThrow(PolicyRuleError);
});

test('publicar deja la política vigente y registra la versión', () => {
  const db = openDb(':memory:');
  const policy = createPolicy(db, draftInput({ officialFilePath: 'policies/reuniones-ab12.docx' }));
  const published = publishPolicyVersion(db, policy.id,
    { version: 'v2.1', effectiveDate: '2026-06-02', author: 'Moisés', reason: 'Carga inicial' })!;
  expect(published).toMatchObject({ status: 'active', version: 'v2.1', effectiveDate: '2026-06-02' });
  expect(published.versions).toEqual([{ version: 'v2.1', date: '2026-06-02', author: 'Moisés', reason: 'Carga inicial' }]);
  expect(countVisiblePoliciesByDepartment(db).get('Gerencia Administrativa')).toBe(1);
});

test('guardar no puede sacar un borrador a público', () => {
  const db = openDb(':memory:');
  const policy = createPolicy(db, draftInput());
  expect(() => updatePolicy(db, policy.id, draftInput({ status: 'active' }))).toThrow(PolicyRuleError);
});

test('renombrar conserva el slug y los títulos repetidos no chocan', () => {
  const db = openDb(':memory:');
  const first = createPolicy(db, draftInput());
  const second = createPolicy(db, draftInput());
  expect(second.slug).not.toBe(first.slug);
  expect(updatePolicy(db, first.id, draftInput({ title: 'Otro título' }))!.slug).toBe(first.slug);
});

test('updatePolicy reemplaza hijos y admite historial con fechas pasadas', () => {
  const db = openDb(':memory:');
  const policy = createPolicy(db, draftInput());
  const updated = updatePolicy(db, policy.id, draftInput({
    guidelines: [{ title: 'Grabación obligatoria', body: 'Toda reunión se graba.' }],
    attachments: [{ kind: 'link', label: 'SharePoint', url: 'https://cap.sharepoint.com/x', filePath: null }],
    versions: [
      { version: 'v1.0', date: '2025-07-20', author: 'G. Administrativa', reason: 'Primera emisión' },
      { version: 'v2.0', date: '2026-01-15', author: 'Moisés', reason: 'Revisión anual' },
    ],
  }))!;
  expect(updated.guidelines).toHaveLength(1);
  expect(updated.versions.map((entry) => entry.version)).toEqual(['v2.0', 'v1.0']);
  expect(updatePolicy(db, policy.id, draftInput())!.guidelines).toHaveLength(0);
});

test('borrar una política borra sus hijos y devuelve sus archivos', () => {
  const db = openDb(':memory:');
  const policy = createPolicy(db, draftInput({
    officialFilePath: 'policies/oficial-aa11.pdf',
    attachments: [{ kind: 'file', label: 'Matriz', url: null, filePath: 'policies/matriz-bb22.pdf' }],
  }));
  const deleted = deletePolicy(db, policy.id)!;
  expect(policyFilePaths(deleted)).toEqual(['policies/oficial-aa11.pdf', 'policies/matriz-bb22.pdf']);
  const remaining = db.prepare('SELECT COUNT(*) AS total FROM policy_attachments').get() as { total: number };
  expect(remaining.total).toBe(0);
});
```

- [ ] **Step 2:** `npx vitest run tests/policies.test.ts` → FALLA.
- [ ] **Step 3:** Crear `src/data/policies.ts`.
- [ ] **Step 4:** Agregar tablas, `foreign_keys = ON`, exportar `nextSortOrder` y extender `counts` en `db.ts`.
- [ ] **Step 5:** Implementar `src/lib/policies.ts`. Escrituras con hijos dentro de `db.transaction`.
- [ ] **Step 6:** `npm test` → verde (incluidas las pruebas existentes: `foreign_keys` no debe romper ninguna).

---

### Task 3: Validación, subida y actions de políticas

**Files:**
- Modify: `src/lib/fieldRules.ts`, `src/components/admin/types.ts`, `src/actions/formSchemas.ts`, `src/actions/index.ts`, `src/lib/policies.ts`
- Test: `tests/policy-validation.test.ts`, `tests/uploads.test.ts`

**Interfaces:**
- Consumes: todo lo de Tarea 2.
- Produces (`fieldRules.ts`):
  - `UploadKind` gana `'policies'`: `maxBytes` 20 MB, `isPublic: true`, `description: 'PDF, Office o imagen'`, extensiones `.pdf .doc .docx .xls .xlsx .ppt .pptx .png .jpg .jpeg .webp`
  - `FIELD_MAX` gana `policyTitle: 160`, `longText: 2000`, `guidelineBody: 1500`
  - `VERSION_PATTERN = /^v\d+\.\d+$/`
  - `isIsoDate(value: string): boolean` — formato `YYYY-MM-DD` y fecha real (rechaza `2026-02-30`)
- Produces (`types.ts`): `FILE_FIELD_UPLOAD_KIND` gana `'file-policy': 'policies'`.
- Produces (`formSchemas.ts`): `policyFormFields`, `policyPublishFields`. Las tres listas viajan como texto JSON en un campo cada una y se validan con zod tras `JSON.parse`:
  - escalares: `title` (obligatorio, `policyTitle`), `department` (`listEnum(departmentNames)`), `type`, `classification`, `status` (listas cerradas), `summary`, `objective`, `scope`, `indicators`, `relatedDocuments` (opcionales, `longText`), `owner`, `approver` (opcionales, `shortText`), `nextReviewDate` (opcional, `isIsoDate`)
  - `officialFile: z.instanceof(File).optional()`
  - `attachmentFiles: z.array(z.instanceof(File)).optional()`
  - `guidelines`: `{ title (obligatorio, name), body (obligatorio, guidelineBody) }[]`
  - `attachments`: `{ kind, label (obligatorio, name), url?, filePath?, fileIndex? }[]`; `link` y `video` exigen `url` con `isHttpUrl`; `file` exige `filePath` o `fileIndex`
  - `versions`: `{ version (VERSION_PATTERN), date (isIsoDate), author (obligatorio, shortText), reason (obligatorio, description) }[]`
  - `policyPublishFields`: `id`, `version`, `effectiveDate`, `author`, `reason` con las mismas reglas
  - Mensajes en español que nombran el elemento: «Lineamiento 2: el título es obligatorio.», «Anexo 1: escribe una dirección web completa, que empiece con https://», «La versión debe tener el formato v2.1.»
- Produces (`policies.ts`): `unknownAttachmentPaths(submittedPaths: string[], existing: PolicyDetail | null): string[]` — rutas enviadas que no están en `policyFilePaths(existing)`.
- Produces (`actions/index.ts`), grupo `policies`:
  - `save` (`accept: 'form'`, `id` opcional) → devuelve `{ id: number }`
  - `publish` (`accept: 'form'`, `policyPublishFields`) → `{ id: number }`
  - `remove` (`idInput`) → `{ ok: true }`

Comportamiento de `save` que el esquema no fija:
1. Si `unknownAttachmentPaths` devuelve algo → `BAD_REQUEST` «Un anexo apunta a un archivo que no pertenece a esta política.»
2. Cada anexo con `fileIndex` valida y guarda `attachmentFiles[fileIndex]` con `storeUpload(file, 'policies')`.
3. `officialFile` nuevo se guarda; si no viene, se conserva el anterior.
4. Tras `createPolicy`/`updatePolicy`, se borran del disco las rutas que estaban en la política anterior y ya no están en la nueva (`policyFilePaths` antes y después).
5. `PolicyRuleError` se traduce a `ActionError({ code: 'BAD_REQUEST', message })`. Lo mismo en `publish`.

`remove` borra la política y luego cada ruta de `policyFilePaths`.

- [ ] **Step 1: Escribir las pruebas que fallan** en `tests/policy-validation.test.ts` (mismo estilo que `tests/form-validation.test.ts`: `z.object(policyFormFields).safeParse(...)`), con un ayudante `validForm(overrides)`:

```ts
test('acepta una ficha mínima', () => {
  expect(parse(validForm()).success).toBe(true);
});

test('rechaza la ficha sin título nombrando el campo', () => {
  const result = parse(validForm({ title: '   ' }));
  expect(result.success).toBe(false);
  expect(messagesOf(result)).toContain('El título es obligatorio.');
});

test('no existen las clasificaciones confidencial ni restringida', () => {
  expect(parse(validForm({ classification: 'confidential' })).success).toBe(false);
  expect(parse(validForm({ classification: 'restricted' })).success).toBe(false);
});

test('rechaza un anexo con dirección que no es http', () => {
  const attachments = JSON.stringify([{ kind: 'link', label: 'Malo', url: 'javascript:alert(1)' }]);
  expect(parse(validForm({ attachments })).success).toBe(false);
});

test('rechaza JSON inválido en las listas sin lanzar', () => {
  expect(parse(validForm({ guidelines: '{no es json' })).success).toBe(false);
});

test('rechaza versión y fecha mal formadas', () => {
  const badVersion = JSON.stringify([{ version: '2.1', date: '2026-06-02', author: 'M', reason: 'x' }]);
  const badDate = JSON.stringify([{ version: 'v2.1', date: '2026-02-30', author: 'M', reason: 'x' }]);
  expect(parse(validForm({ versions: badVersion })).success).toBe(false);
  expect(parse(validForm({ versions: badDate })).success).toBe(false);
});

test('unknownAttachmentPaths solo acepta archivos que la política ya tenía', () => {
  const db = openDb(':memory:');
  const policy = createPolicy(db, draftInput({ officialFilePath: 'policies/oficial-aa11.pdf' }));
  expect(unknownAttachmentPaths(['policies/oficial-aa11.pdf'], policy)).toEqual([]);
  expect(unknownAttachmentPaths(['manual/secreto.pdf'], policy)).toEqual(['manual/secreto.pdf']);
  expect(unknownAttachmentPaths(['policies/otro.pdf'], null)).toEqual(['policies/otro.pdf']);
});
```

Y en `tests/uploads.test.ts`:

```ts
test('policies acepta imágenes y Office, rechaza ejecutables', () => {
  expect(validateUpload(new File(['x'], 'infografia.png'), 'policies')).toBeNull();
  expect(validateUpload(new File(['x'], 'politica.docx'), 'policies')).toBeNull();
  expect(validateUpload(new File(['x'], 'virus.exe'), 'policies')).not.toBeNull();
});
```

- [ ] **Step 2:** `npx vitest run tests/policy-validation.test.ts tests/uploads.test.ts` → FALLA.
- [ ] **Step 3:** Extender `fieldRules.ts` y `types.ts`.
- [ ] **Step 4:** Escribir `policyFormFields` y `policyPublishFields`. Un ayudante `jsonList(itemSchema, itemLabel)` para las tres listas (parse seguro + mensaje con número de elemento).
- [ ] **Step 5:** Implementar `unknownAttachmentPaths` y el grupo `policies` en `actions/index.ts`. Extraer la resolución de archivos a funciones propias para que cada handler quede corto.
- [ ] **Step 6:** `npm test && npm run check` → verde.

---

### Task 4: Contenido de departamento (datos y actions)

**Files:**
- Create: `src/lib/departmentContent.ts`
- Modify: `src/lib/db.ts`, `src/actions/formSchemas.ts`, `src/actions/index.ts`, `src/components/admin/types.ts`
- Test: `tests/department-content.test.ts`

**Interfaces:**
- Produces (`db.ts`):
  - Tablas `department_processes (department, name, steps, sort_order)`, `department_formats (department, name, url, file_path, sort_order)`, `department_links (department, label, url, sort_order)`, `department_notices (department, date, body, kind)`
  - `SORTABLE_TABLES` gana `department_processes`, `department_formats`, `department_links`
  - `UNIQUE_COLUMN` pasa a cubrir solo las cinco tablas que ya tenía; `hasDuplicate` y `assertUnique` se tipan con `keyof typeof UNIQUE_COLUMN`
  - `moveRow(db, table, id, direction, scopeColumn?: 'department')`: con `scopeColumn`, el vecino se busca solo entre filas con el mismo valor que la fila movida
- Produces (`departmentContent.ts`), con `Row` = `Input` + `id`:
  - `ProcessInput { department; name; steps: string }` — `steps` un paso por línea; `splitSteps(steps: string): string[]` quita vacíos
  - `FormatInput { department; name; url: string | null; filePath: string | null }`
  - `LinkInput { department; label; url }`
  - `NoticeInput { department; date; body; kind: 'warning' | 'info' }`
  - Para cada una: `list<X>(db, department)`, `get<X>(db, id)`, `create<X>(db, input)`, `update<X>(db, id, input)`, `delete<X>(db, id)` con X en `Processes|Formats|Links|Notices` (singular en get/create/update/delete)
  - Orden: `sort_order, id` salvo avisos: `date DESC, id DESC`
  - `countDepartmentContent(db, department): { processes: number; formats: number }`
- Produces (`formSchemas.ts`): `processFormFields`, `formatFormFields`, `linkFormFields`, `noticeFormFields`. Todas con `department: listEnum(departmentNames)`. Formato: `url` opcional + `file` opcional. Aviso: `date` con `isIsoDate`, `kind` lista cerrada.
- Produces (`actions/index.ts`): grupos `departmentProcesses`, `departmentFormats`, `departmentLinks` con `create/update/remove/move` (move con `scopeColumn: 'department'`), y `departmentNotices` con `create/update/remove`. Formatos reutiliza `resolveResourceSource` (subida tipo `docs`; desviación menor del spec §7, que decía `policies`: los formatos son PDF/Office y `docs` ya cubre eso) y borra el archivo al eliminar.
- Produces (`types.ts`): `Collection` gana los cuatro nombres de grupo.

- [ ] **Step 1: Escribir las pruebas que fallan**

```ts
test('el contenido se lista por departamento', () => {
  const db = openDb(':memory:');
  createLink(db, { department: 'Legal', label: 'Contratos', url: 'https://cap.hn/contratos' });
  createLink(db, { department: 'Talento Humano', label: 'Planilla', url: 'https://cap.hn/planilla' });
  expect(listLinks(db, 'Legal').map((link) => link.label)).toEqual(['Contratos']);
  expect(listLinks(db, 'Flota Vehicular')).toEqual([]);
});

test('mover un enlace solo intercambia con vecinos de su departamento', () => {
  const db = openDb(':memory:');
  const first = createLink(db, { department: 'Legal', label: 'A', url: 'https://cap.hn/a' });
  createLink(db, { department: 'Talento Humano', label: 'X', url: 'https://cap.hn/x' });
  const second = createLink(db, { department: 'Legal', label: 'B', url: 'https://cap.hn/b' });
  moveRow(db, 'department_links', second.id, 'up', 'department');
  expect(listLinks(db, 'Legal').map((link) => link.id)).toEqual([second.id, first.id]);
  expect(listLinks(db, 'Talento Humano')).toHaveLength(1);
});

test('los avisos salen del más reciente al más antiguo', () => {
  const db = openDb(':memory:');
  createNotice(db, { department: 'Legal', date: '2026-11-05', body: 'Viejo', kind: 'info' });
  createNotice(db, { department: 'Legal', date: '2026-11-11', body: 'Nuevo', kind: 'warning' });
  expect(listNotices(db, 'Legal').map((notice) => notice.body)).toEqual(['Nuevo', 'Viejo']);
});

test('splitSteps ignora líneas vacías', () => {
  expect(splitSteps('Solicitante\n\n Jefe de área \nGerencia\n')).toEqual(['Solicitante', 'Jefe de área', 'Gerencia']);
});
```

- [ ] **Step 2:** `npx vitest run tests/department-content.test.ts` → FALLA.
- [ ] **Step 3:** Tablas y cambios de `moveRow` / `UNIQUE_COLUMN` en `db.ts`.
- [ ] **Step 4:** Implementar `departmentContent.ts`. Las cuatro colecciones comparten forma: escribir el CRUD una vez sobre una descripción de tabla (nombre + columnas) en lugar de cuatro copias.
- [ ] **Step 5:** Esquemas, actions y tipo `Collection`.
- [ ] **Step 6:** `npm test && npm run check` → verde.

---

### Task 5: Biblioteca y ficha públicas

**Files:**
- Create: `src/lib/dates.ts`, `src/lib/policyFilter.ts`, `src/components/PolicyBadges.astro`, `src/components/PolicyLibrary.vue`, `src/pages/politicas/index.astro`, `src/pages/politicas/[slug].astro`
- Modify: `src/data/site.ts`
- Test: `tests/policy-filter.test.ts`

**Interfaces:**
- Consumes: `listVisiblePolicies`, `getVisiblePolicyBySlug` (Tarea 2); `departments` (Tarea 1).
- Produces (`dates.ts`): `formatDate(isoDate: string | null): string` — `'2026-06-02'` → `'02/06/2026'`; null → `''`.
- Produces (`policyFilter.ts`):

```ts
export interface PolicyCard {
  slug: string; title: string; department: string;
  type: PolicyType; classification: PolicyClassification; status: PolicyStatus;
  version: string | null; effectiveDate: string | null;
}
export interface PolicyFilters {
  text: string; department: string; type: string; classification: string; status: string;
}
export const EMPTY_FILTERS: PolicyFilters;
export function filterPolicies(policies: PolicyCard[], filters: PolicyFilters): PolicyCard[];
export function filtersFromQuery(params: URLSearchParams): PolicyFilters;
export function filtersToQuery(filters: PolicyFilters): string;
```

  Reglas: `text` compara con el título sin distinguir mayúsculas ni acentos. `status` vacío significa «Vigente y En revisión» (las obsoletas solo salen eligiendo `obsolete`). Parámetros de query: `q`, `departamento` (slug), `tipo`, `clasificacion`, `estado`. `filtersFromQuery` descarta cualquier valor que no esté en su catálogo.
- Produces (`site.ts`): `nav` queda Inicio · Aplicaciones · Recursos · Políticas (`/politicas`) · Departamentos (`/departamentos`) · Contactos · Empresas.
- `PolicyBadges.astro`: props `type`, `status`, `classification`, `version?`, `effectiveDate?`; pinta los badges con clases de la suite. `PolicyLibrary.vue` usa las mismas clases desde un mapa compartido en `src/data/policies.ts` (`badgeClassOf`), para no duplicarlas.

- [ ] **Step 1: Escribir las pruebas que fallan** con un arreglo `sample` de 4 tarjetas (una `procedure` de Compras e Importaciones vigente, una `policy` de Compras vigente, una `policy` de Legal `under-review`, una `policy` de Legal `obsolete` titulada «Política de información»):

```ts
test('combina departamento y tipo', () => {
  const result = filterPolicies(sample, { ...EMPTY_FILTERS, department: 'Compras e Importaciones', type: 'procedure' });
  expect(result).toHaveLength(1);
});

test('sin filtro de estado oculta las obsoletas', () => {
  expect(filterPolicies(sample, EMPTY_FILTERS)).toHaveLength(3);
  expect(filterPolicies(sample, { ...EMPTY_FILTERS, status: 'obsolete' })).toHaveLength(1);
});

test('la búsqueda ignora mayúsculas y acentos', () => {
  expect(filterPolicies(sample, { ...EMPTY_FILTERS, status: 'obsolete', text: 'INFORMACION' })).toHaveLength(1);
});

test('la query string con valores desconocidos se ignora', () => {
  const filters = filtersFromQuery(new URLSearchParams('departamento=no-existe&tipo=xyz&estado=draft'));
  expect(filters).toEqual(EMPTY_FILTERS);
});

test('la query string válida se traduce a filtros y vuelve igual', () => {
  const filters = filtersFromQuery(new URLSearchParams('departamento=legal&tipo=policy'));
  expect(filters.department).toBe('Legal');
  expect(filtersToQuery(filters)).toBe('departamento=legal&tipo=policy');
});

test('formatDate muestra dd/mm/aaaa', () => {
  expect(formatDate('2026-06-02')).toBe('02/06/2026');
  expect(formatDate(null)).toBe('');
});
```

- [ ] **Step 2:** `npx vitest run tests/policy-filter.test.ts` → FALLA.
- [ ] **Step 3:** Implementar `dates.ts` y `policyFilter.ts`. → pruebas en verde.
- [ ] **Step 4:** `PolicyBadges.astro` y `PolicyLibrary.vue` (props: `policies: PolicyCard[]`). La isla lee los filtros iniciales de `window.location.search`, actualiza la URL con `history.replaceState` al cambiar, y muestra: cuadrícula de tarjetas (spec §9.1), «Sin resultados» con botón «Limpiar filtros», o «Aún no hay políticas publicadas» si `policies` está vacío.
- [ ] **Step 5:** `src/pages/politicas/index.astro`: `SectionHeader` (eyebrow «Políticas», título «Centro de Políticas y Lineamientos»), texto guía y la isla con `client:load`.
- [ ] **Step 6:** `src/pages/politicas/[slug].astro` según spec §9.2. `getVisiblePolicyBySlug` null → `return new Response(null, { status: 404 })`. Imagen oficial incrustada si la extensión es `.png .jpg .jpeg .webp`. Anexos de archivo con `href="/files/<filePath>"`; enlaces y videos con `target="_blank" rel="noopener"`. Secciones opcionales vacías no se pintan. Aviso arriba si `status === 'obsolete'`.
- [ ] **Step 7:** Agregar las dos entradas a `siteConfig.nav`.
- [ ] **Step 8:** `npm test && npm run check` → verde.

---

### Task 6: Páginas de departamento, contactos y búsqueda

**Files:**
- Create: `src/pages/departamentos/index.astro`, `src/pages/departamentos/[slug].astro`
- Modify: `src/pages/contactos.astro`, `src/lib/search.ts`, `src/lib/db.ts`
- Test: `tests/search.test.ts`, `tests/db-collections.test.ts`

**Interfaces:**
- Consumes: Tareas 1, 2, 4 y `filtersToQuery` (Tarea 5).
- Produces (`db.ts`): `listContactsByDepartment(db: Db, department: string): ContactRow[]`.
- `buildSearchItems` agrega políticas visibles (`id: policy-<id>`, `url: /politicas/<slug>`, `description: '<tipo> · <departamento>'`, `section: 'Políticas'`) y los 17 departamentos (`id: department-<slug>`, `url: /departamentos/<slug>`, `section: 'Departamentos'`).

- [ ] **Step 1: Escribir las pruebas que fallan**

```ts
// tests/search.test.ts
test('la búsqueda incluye políticas visibles y departamentos, nunca borradores', () => {
  const db = openDb(':memory:');
  createPolicy(db, draftInput({ title: 'Borrador secreto' }));
  const visible = createPolicy(db, draftInput({ title: 'Política pública', officialFilePath: 'policies/a.pdf' }));
  publishPolicyVersion(db, visible.id, { version: 'v1.0', effectiveDate: '2026-01-01', author: 'MC', reason: 'Alta' });
  const items = buildSearchItems(db);
  expect(items.filter((item) => item.section === 'Políticas').map((item) => item.name)).toEqual(['Política pública']);
  expect(items.filter((item) => item.section === 'Departamentos')).toHaveLength(17);
});

// tests/db-collections.test.ts
test('listContactsByDepartment devuelve solo ese departamento', () => { /* dos contactos en deptos distintos → 1 */ });
```

- [ ] **Step 2:** `npx vitest run tests/search.test.ts tests/db-collections.test.ts` → FALLA.
- [ ] **Step 3:** Implementar `listContactsByDepartment` y extender `buildSearchItems`. → verde.
- [ ] **Step 4:** `departamentos/index.astro`: cuadrícula de 17 tarjetas con nombre y «N políticas» (`countVisiblePoliciesByDepartment`; 0 se muestra como «Sin políticas aún»).
- [ ] **Step 5:** `departamentos/[slug].astro` según spec §9.3. Slug desconocido → 404. Mensajes de bloque vacío: «Aún no hay políticas», «Aún no hay procesos», «Aún no hay formatos», «Aún no hay personas en el directorio», «Aún no hay enlaces», «Sin avisos». «Ver todas →» apunta a `/politicas?` + `filtersToQuery({ ...EMPTY_FILTERS, department })`. Equipo con `ContactCard`. Pasos con `splitSteps`.
- [ ] **Step 6:** En `contactos.astro`, el encabezado de grupo enlaza a `/departamentos/<slug>` cuando `findDepartmentByName` lo encuentra; si no (nombre fuera de catálogo), queda como texto.
- [ ] **Step 7:** `npm test && npm run check` → verde.

---

### Task 7: Admin de políticas

**Files:**
- Create: `src/components/admin/PolicyTable.vue`, `PolicyEditor.vue`, `RepeatableList.vue`, `PublishVersionDialog.vue`, `src/pages/admin/politicas/index.astro`, `nueva.astro`, `[id].astro`
- Modify: `src/layouts/AdminLayout.astro`, `src/components/admin/useActionForm.ts`

**Interfaces:**
- Consumes: actions `policies.save/publish/remove` (Tarea 3), `getPolicy`, `listPolicies`, listas de `src/data/policies.ts`, `departments`.
- Produces (`useActionForm.ts`): `runAction(call, fields = [], onSuccess?: (data: unknown) => void)` y `submit(fields, formData, call, onSuccess?)`. Sin `onSuccess` se comporta como hoy (recarga).
- `AdminLayout`: `active` gana `'politicas' | 'departamentos'`; `navItems` gana Políticas (`/admin/politicas`, contador `totals.policies`) y Departamentos (`/admin/departamentos`, sin contador), entre Recursos y Contactos.
- `RepeatableList.vue`: genérico sobre el tipo de elemento. Props `items` (v-model), `addLabel: string`, `emptyText: string`, `createItem: () => T`. Slot por elemento con `{ item, index }`. Botones subir, bajar y quitar por elemento.
- `PolicyEditor.vue`: prop `policy: PolicyDetail | null`. Secciones del spec §10.2. Al enviar arma un `FormData` con los escalares, `guidelines`/`attachments`/`versions` como JSON, `officialFile` y los archivos nuevos de anexos en `attachmentFiles` (cada anexo nuevo lleva su `fileIndex`). Tras `save` navega a `/admin/politicas/<id>` (vía `onSuccess`).
- `PublishVersionDialog.vue`: props `policyId: number`, `currentVersion: string | null`; llama a `policies.publish` y recarga.

Reglas de interfaz:
- El select de estado ofrece: en `draft`, solo «Borrador» (deshabilitado, con la nota «Para publicar usa el botón Publicar versión»); publicada: Vigente, En revisión, Obsoleta, Borrador.
- «Publicar versión» solo se habilita con la política ya guardada (existe `id`) y sin cambios pendientes; si hay cambios sin guardar, el botón dice «Guarda los cambios antes de publicar».
- «Eliminar política» pide confirmación en línea (mismo patrón de dos pasos que `CollectionManager`) y vuelve a `/admin/politicas`.
- Errores por campo junto al campo; errores de listas y de reglas en el aviso general de arriba (`alertErrorClass`). Botón de guardar con estado «Guardando…».
- `PolicyTable.vue`: columnas Título, Departamento, Tipo, Estado, Versión; filtro y orden con `useTableView`; cada fila enlaza a `/admin/politicas/<id>`; estado vacío «Aún no hay políticas. Crea la primera con el botón «Nueva política».»

- [ ] **Step 1:** Extender `useActionForm` con `onSuccess` y `AdminLayout` con las dos entradas.
- [ ] **Step 2:** `RepeatableList.vue`.
- [ ] **Step 3:** `PolicyEditor.vue`, partido en secciones para que ningún bloque de script pase de ~40 líneas por función. Si el archivo supera ~250 líneas, extraer las secciones de anexos y de control de cambios a componentes propios.
- [ ] **Step 4:** `PublishVersionDialog.vue` (reutiliza la estructura de `FormModal`).
- [ ] **Step 5:** `PolicyTable.vue` y las tres páginas. `[id].astro` con id inexistente → `Astro.redirect('/admin/politicas')`.
- [ ] **Step 6:** `npm run check` → sin errores.
- [ ] **Step 7: Verificación en el navegador** (`npm run dev`, sesión de admin): crear política con dos lineamientos, un anexo de archivo, uno de enlace y dos líneas de historial; guardar; publicar `v2.1`; comprobar que aparece en `/politicas` y su ficha; quitar el anexo de archivo, guardar y comprobar que el archivo desapareció de `uploads/policies/`; pasar a Borrador y comprobar el 404 en la ficha; eliminar.

---

### Task 8: Admin de departamentos

**Files:**
- Create: `src/pages/admin/departamentos/index.astro`, `src/pages/admin/departamentos/[slug].astro`
- Modify: `src/components/admin/CollectionManager.vue`, `src/components/admin/FormField.vue`, `src/components/admin/types.ts`

**Interfaces:**
- Consumes: actions y listados de Tarea 4.
- Produces (`CollectionManager.vue`), con `withDefaults`:
  - `fixedValues?: Record<string, string>` (default `() => ({})`): se agregan al `FormData` en crear y editar
  - `sortable?: boolean` (default `true`): en `false` no se pintan los controles de mover
- Produces (`types.ts`): `Field.kind` gana `'date'`; `FormField` lo pinta como `<input type="date">`.

- [ ] **Step 1:** Props nuevas en `CollectionManager` y campo fecha en `FormField`.
- [ ] **Step 2:** `admin/departamentos/index.astro`: lista de los 17 con conteo de procesos, formatos, enlaces y avisos, cada uno enlazado a su página.
- [ ] **Step 3:** `admin/departamentos/[slug].astro`: cuatro secciones con título y un `CollectionManager` cada una, todas con `fixedValues={{ department: department.name }}`. Campos: Procesos (`name`, `steps` textarea con pista «Un paso por línea»); Formatos (`name`, `url`, `file` tipo `file-doc`); Enlaces (`label`, `url`); Avisos (`date`, `body` textarea, `kind` select «Aviso»/«Informativo», `sortable={false}`). Slug desconocido → redirect al índice. Nota al final: «El equipo se administra en Contactos» con enlace.
- [ ] **Step 4:** `npm run check` → sin errores. Comprobar que las cinco pantallas admin existentes siguen funcionando igual (props nuevas con default).
- [ ] **Step 5: Verificación en el navegador:** en Compras e Importaciones crear un proceso de tres pasos, un formato con archivo, dos enlaces (reordenarlos) y un aviso; ver `/departamentos/compras-e-importaciones`; comprobar en `/departamentos/legal` los seis mensajes de bloque vacío.

---

### Task 9: Datos de ejemplo y verificación final

**Files:**
- Modify: `scripts/seed-data.ts`, `scripts/seed.ts`, `README.md`

- [ ] **Step 1:** Sembrar la política «Políticas de Reuniones Virtuales con Gerencia Administrativa» con el contenido del mockup (resumen, objetivo, ámbito, tres lineamientos, anexos de tipo enlace y video, historial v1.0 20/07/2025, v2.0 15/01/2026, v2.1 02/06/2026). Sin documento oficial no se puede publicar: se siembra en Borrador y el README lo dice.
- [ ] **Step 2:** README: sección corta «Políticas y departamentos» (rutas públicas, rutas admin, tipo de subida `policies`, qué quedó fuera por no haber login).
- [ ] **Step 3:** `npm test && npm run check && npm run build` → los tres en verde.
- [ ] **Step 4:** Recorrido completo en el navegador de las cuatro pantallas públicas y las dos secciones admin, en ancho de escritorio y de móvil; buscar una política y un departamento con ⌘K.
- [ ] **Step 5:** Revisión final de la rama y después pasada `/simplify` sobre el diff completo (regla global de Leonardo); presentar hallazgos y aplicarlos. Volver a correr el Step 3.
