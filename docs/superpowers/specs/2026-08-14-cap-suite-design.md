# CAP Suite — Diseño

**Fecha:** 2026-08-14
**Estado:** Aprobado por Leonardo

## Propósito

Portal unificado interno de Grupo Empresarial CAP: un solo enlace donde los
empleados encuentran los accesos a todos los sistemas de la empresa (ERP,
Microsoft 365, portales internos), materiales compartidos, directorio de
contactos y una sección sobre las empresas del grupo.

## Alcance y decisiones

- **Proyecto nuevo separado** de `cap-web` (el sitio público del grupo sigue aparte).
- **Audiencia interna, sin login**: página abierta, quien tenga el enlace la ve.
  Si a futuro se requiere autenticación (p. ej. Microsoft 365), se agregará como
  capa extra (protección a nivel de hosting o isla de auth), sin rehacer el sitio.
- **Landing + subpáginas** (no one-page): escala mejor al crecer el catálogo.
- **Datos de ejemplo editables** centralizados en archivos de datos; las 6
  empresas del grupo son reales (tomadas de `cap-web/src/data/siteContent.js`):
  Inversiones S&M, Distribuidora Mansiago, Auto Repuestos Blessing,
  Tecnicentro DIDASA, Japan HN, CAP Logistics.
- **Identidad propia moderna** tipo portal/dashboard, no el branding formal de
  `cap-web`.
- **Solo español.**

## Stack

- Astro 5 (sitio estático), Tailwind CSS 4, integración `@astrojs/vue` para una
  única isla interactiva. Mismo patrón que `moniteck-web`.
- Ubicación: `/Users/leonardo/Projects/cap-suite`.
- Dev server en `:4321` (default de Astro, puerto libre respecto a los demás
  proyectos).

## Páginas

| Ruta | Contenido |
|---|---|
| `/` | Landing: hero con buscador global, accesos destacados (`featured`), bloques resumen de cada sección con enlace |
| `/apps` | Catálogo completo de sistemas agrupado por categoría, con buscador y filtro |
| `/recursos` | Materiales: manuales, plantillas, carpetas SharePoint/Drive, agrupados por tipo |
| `/contactos` | Directorio por departamento/empresa: nombre, cargo, teléfono, correo, extensión |
| `/empresas` | Intro corporativa breve + tarjeta por cada una de las 6 empresas |

## Modelo de datos (`src/data/`)

Un archivo por dominio, tipado en TypeScript. Editar contenido = editar objetos
en estos archivos, nada más.

- `apps.ts` — `{ id, name, description, url, category, icon, featured, company? }`
  - Categorías iniciales: ERP y finanzas, Microsoft 365, portales internos, herramientas.
- `resources.ts` — `{ name, description, url, type }` (manual, plantilla, carpeta, enlace)
- `contacts.ts` — `{ name, role, department, company, phone, email, extension? }`
- `companies.ts` — `{ name, description, sector, url?, logo? }`
- `site.ts` — nombre del portal, textos de la landing, enlaces del footer.

## Componentes

- **Shell:** `Layout.astro` (estructura + SEO básico), `Nav.astro`, `Footer.astro`.
- **Tarjetas:** `AppCard.astro`, `ResourceCard.astro`, `ContactCard.astro`,
  `CompanyCard.astro`, y `SectionHeader.astro`.
- **Única isla Vue:** `SearchFilter.vue` — buscador que filtra tarjetas en
  cliente. En la landing busca sobre todo el catálogo; en `/apps` filtra por
  categoría y texto. Composition API con `<script setup>`, props tipadas,
  recibe los datos desde Astro. Todo lo demás es HTML estático.

## Look & feel

- Portal moderno con tokens de color en Tailwind: base azul profundo con acento
  ámbar/eléctrico (ajustable en un solo lugar).
- Tarjetas con hover marcado (casi todo es clickeable).
- Iconos por sistema: SVG inline cuando exista; fallback a inicial con color por
  categoría.
- Estados cuidados: búsqueda sin resultados con mensaje claro, responsive
  desktop y móvil.

### Animaciones y transiciones (requisito)

La página debe sentirse moderna y fluida, con animación en todo lo que aporte:

- Entradas por scroll (reveal) de secciones y tarjetas, con stagger.
- Microinteracciones en hover: elevación/escala de tarjetas, transiciones de
  color en enlaces y botones.
- Transiciones entre páginas con View Transitions de Astro.
- Animación sutil en el hero de la landing (gradiente/elementos decorativos).
- Filtrado del buscador con transiciones (aparición/desaparición animada de
  tarjetas).
- Respetar `prefers-reduced-motion`: las animaciones se desactivan o reducen.
- Implementación con CSS + IntersectionObserver ligero; sin librerías pesadas
  de animación salvo que algo lo justifique.

## Verificación

- `npm run build` sin errores.
- Revisión visual en dev de las 5 páginas, desktop y móvil.
- Sin tests unitarios por ahora: sitio de contenido; la única lógica
  (filtrado en `SearchFilter.vue`) se mantiene simple y verificable a ojo.
- **Revisión UX/UI final:** al terminar la implementación, un agente experto en
  UX/UI revisa la página completa y entrega comentarios y mejoras propuestas;
  los hallazgos se presentan a Leonardo antes de aplicarlos.

## Fuera de alcance (por ahora)

- Autenticación / personalización por usuario.
- Panel admin o base de datos para gestionar enlaces.
- Versión en inglés.
