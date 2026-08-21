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
npm run build
ADMIN_PASSWORD=... SESSION_SECRET=... node dist/server/entry.mjs
```

| Variable | Uso | Default |
|---|---|---|
| `ADMIN_PASSWORD` | contraseña del panel `/admin` | — (obligatoria) |
| `SESSION_SECRET` | firma de la cookie de sesión | — (obligatoria) |
| `DATABASE_PATH` | archivo SQLite | `data/cap-suite.db` |
| `UPLOADS_DIR` | archivos subidos | `uploads` |
| `HOST` / `PORT` | bind del servidor | `0.0.0.0` / `4321` |

El panel de administración vive en `/admin`. `data/` y `uploads/` deben respaldarse.
