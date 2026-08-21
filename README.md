# CAP Suite

Portal interno de Grupo Empresarial CAP. Astro SSR + SQLite.

## Desarrollo

```bash
npm install
npm run seed        # primera vez: migra los datos iniciales a SQLite
ADMIN_PASSWORD=... SESSION_SECRET=... npm run dev
```

## Producción

```bash
SITE_URL=https://portal.tudominio.hn npm run build
ADMIN_PASSWORD=... SESSION_SECRET=... node dist/server/entry.mjs
```

Requisitos del despliegue real:

- **`SITE_URL` se lee en `astro.config.mjs`, es decir, en tiempo de build**: debe estar seteada al correr `npm run build`, no solo al arrancar el servidor. Debe ser el origen público (esquema + host, sin trailing slash) con el que los usuarios acceden al sitio, p. ej. `https://portal.grupocap.hn`. Astro usa este valor para armar `security.allowedDomains` y así validar el encabezado `Host`/`X-Forwarded-Host` de cada request; si no coincide, Astro asume `localhost` y rechaza con 403 cualquier POST real (login, alta/edición en `/admin`) por el chequeo de origen (protección CSRF). No desactivar `checkOrigin`: eso reabriría el bypass de autenticación vía form-fallback.
- **Requiere `@astrojs/node` ≥ 9.5.5** (fijado en `package.json`): versiones anteriores del adaptador standalone ignoran `security.allowedDomains` al construir el request (no validan `Host`/`X-Forwarded-Host`), por lo que el origen siempre se resuelve a `localhost` y el chequeo de origen rechaza cualquier request real sin importar cómo se configure `SITE_URL`.
- **El reverse proxy (nginx, Caddy, etc.) debe reenviar `Host`, `X-Forwarded-Host` y `X-Forwarded-Proto`** hacia el proceso Node. Sin esos encabezados el servidor no puede reconstruir el origen real de la request.
- **La cookie de sesión solo lleva el flag `Secure` cuando corre el build de producción** (`node dist/server/entry.mjs`, con `NODE_ENV=production` implícito por el build de Astro). No usar `astro dev` como despliegue real: en modo dev la cookie no es `Secure` y el servidor no es apto para producción.

| Variable | Uso | Default |
|---|---|---|
| `ADMIN_PASSWORD` | contraseña del panel `/admin` | — (obligatoria) |
| `SESSION_SECRET` | firma de la cookie de sesión | — (obligatoria) |
| `SITE_URL` | origen público del sitio (ver arriba) | `http://localhost:4321` |
| `DATABASE_PATH` | archivo SQLite | `data/cap-suite.db` |
| `UPLOADS_DIR` | archivos subidos | `uploads` |
| `HOST` / `PORT` | bind del servidor | `0.0.0.0` / `4321` |

El panel de administración vive en `/admin`. `data/` y `uploads/` deben respaldarse.
