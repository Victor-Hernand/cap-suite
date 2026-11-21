# Manuales de usuario

Esta carpeta guarda el guion de cada manual de usuario del sistema. El manual y sus capturas se envían como borrador a CAP Gestión, un reviewer los lee allí y, al mergear a `main`, el borrador se publica a nombre del programador.

## Empresa

La empresa que presenta cada manual sale de `tokens.json › company`. En un proyecto sin design system no hay `tokens.json`: la empresa sale de la línea `Empresa:` de esta sección, que `/cap-manual` llena la primera vez.

Empresa: Grupo Empresarial CAP

## Flujo del programador

1. Termina el módulo en su rama y corre `/cap-manual`.
2. El skill genera `guion.json`, captura, escribe `manual.md`, valida, envía el borrador a CAP Gestión con tu token personal, hace push y abre el PR con el enlace al borrador. El repositorio solo recibe `guion.json`.
3. El check del PR confirma con CAP Gestión que existe el borrador. Un reviewer lee el manual en CAP Gestión.
4. Al mergear, el workflow avisa a CAP Gestión y el borrador pasa a publicado a tu nombre, en la semana del merge. Aparece en Entregas; mientras tanto estuvo en «En camino».

Los manuales ya versionados con `manual.md` y `capturas/` en la versión 3.4 quedan como están.

## Cuándo es obligatorio

El PR declara su tipo en la línea `Tipo:` de la plantilla y, si es módulo o sistema, el enlace al borrador en `Manual:`.

| Tipo | ¿Lleva manual? |
|---|---|
| módulo | Sí |
| sistema | Sí |
| fix | No |
| mejora | No |

Si el PR es de módulo o sistema y CAP Gestión no tiene el borrador de la rama, el check falla.

Cerrar un PR sin mergear descarta los borradores de su rama. Si lo reabres, vuelve a correr `draft.mjs` (con `--pr <url>`) antes de que el check lo pida.

## Estructura

```
docs/manuales/
  README.md
  <slug>/
    guion.json       pasos para regenerar las capturas (único archivo versionado)
    manual.md        frontmatter + Markdown (fuera de git)
    capturas/        01-listado.png, 02-formulario.png (fuera de git)
```

`manual.md` y `capturas/` quedan fuera del repositorio por `.gitignore` (`docs/manuales/*/manual.md`, `docs/manuales/*/capturas/`); viajan a CAP Gestión con `draft.mjs`.

- `<slug>` usa minúsculas, números y guiones simples (`viaticos`, `ordenes-de-compra`).
- Las imágenes se referencian como `capturas/<archivo>`; nombres en minúsculas con extensión png, jpg, jpeg o webp.
- Límites: `manual.md` hasta 1 MB, cada imagen hasta 2 MB, máximo 40 imágenes.

## Frontmatter de `manual.md`

```yaml
---
title: Viáticos
system: FastBI
type: module
tworks: https://tworks.example.com/tasks/1234
---
```

- `title` y `system` son obligatorios.
- `type` es `module` o `system`.
- `tworks` es una URL o ID de tarea; es opcional.

Valores canónicos de `system` (se agrupan por igualdad exacta):

- FastBI
- FastBI Recruit
- Blessing ERP
- CARL
- Tworks
- CAP Gestión
- CAP Suite

## Cómo generar un manual

La vía recomendada es el skill `/cap-manual` de Claude Code: detecta lo que cambió en tu rama, propone el guion, toma las capturas, escribe el manual desde la plantilla, lo valida y envía el borrador.

Para hacerlo a mano, parte de `manual-modulo.md` o `manual-sistema.md`, que viven en el paquete (`manuals/templates/` de cap-design-system, disponibles para el agente mediante el plugin cap-design de Claude Code y el skill `/cap-manual`; el instalador no los copia al proyecto), escribe `guion.json` y corre:

```bash
node scripts/cap-manual/capture.mjs docs/manuales/<slug>
node scripts/cap-manual/validate.mjs docs/manuales/<slug>
node scripts/cap-manual/draft.mjs docs/manuales/<slug>
```

`capture.mjs` guarda `capturas/<nombre>.png` y al final imprime la lista de capturas con su descripción, lista para pegar en el manual. `draft.mjs` envía el manual y las capturas a CAP Gestión e imprime el enlace al borrador; con `--pr <url>` asocia el borrador a un PR ya abierto. Vuelve a correrlo cada vez que cambies el manual: reemplaza el borrador de la rama.

### Token del programador

`draft.mjs` necesita dos variables en tu shell, nunca en archivos del repositorio:

| Variable | Contenido |
|---|---|
| `CAP_GESTION_URL` | URL base de CAP Gestión |
| `CAP_GESTION_TOKEN` | Tu token personal, que te entrega un administrador desde CAP Gestión |

Si CAP Gestión responde 401, tu usuario está desactivado o el token fue revocado: pide uno nuevo a un administrador.

### Secrets del repositorio para CI

`publish.mjs` lo ejecutan los workflows `cap-manual check` y `cap-manual publish`. Cada repositorio necesita estos dos secrets de GitHub Actions:

| Secret | Contenido |
|---|---|
| `CAP_GESTION_URL` | URL base de CAP Gestión |
| `CAP_GESTION_TOKEN` | Token Bearer con permiso para publicar entregas |

Un PR que viene de un fork no recibe los secrets y el check falla con un aviso que lo explica.

### Variables de entorno de `capture.mjs`

| Variable | Uso |
|---|---|
| `CAP_MANUAL_USER` | Usuario con el que se inicia sesión |
| `CAP_MANUAL_PASSWORD` | Contraseña de ese usuario |
| `CAP_MANUAL_BASE_URL` | Opcional; reemplaza `baseUrl` de `guion.json` |

En una SPA el login no provoca una navegación: si la primera captura todavía muestra la pantalla de acceso, agrega un paso `wait` después del login. Usuario y contraseña nunca van en `guion.json`. Usa un usuario de pruebas con datos ficticios.

### Cómo levantar la app antes de capturar

| Stack | Comando |
|---|---|
| Laravel | `php artisan serve` o Sail (`./vendor/bin/sail up -d`) |
| React, Astro o Vue con Vite | `npm run dev` |

Apunta `baseUrl` o `CAP_MANUAL_BASE_URL` a la URL que muestre el comando.

### Playwright

Las capturas usan Playwright, que se instala una sola vez por proyecto:

```bash
npm install --save-dev playwright && npx playwright install chromium
```

Solo `capture.mjs` lo necesita; `validate.mjs`, `draft.mjs` y `publish.mjs` no.
