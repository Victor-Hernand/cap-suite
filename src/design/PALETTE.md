# Paleta Grupo CAP

Marca instalada: **Grupo CAP** (`brandId: cap`) · Empresa: Grupo CAP. Para cambiarla: `install.sh --brand <id>`. Generado desde `tokens.json` con `npm run tokens`; no editar a mano.

## Papeles

| Uso | Clase Tailwind | Variable CSS | Claro | Oscuro |
|---|---|---|---|---|
| Respaldo sólido de piezas con texto claro, PDF; no es el botón primario | `bg-cap-chrome` | `--cap-chrome` | `#1E1B1A` | igual |
| Superficie del marco: respaldo sin vidrio, bordes de avatar | `bg-cap-frame` | `--cap-frame` | `#FFFDFB` | `#1E1B1A` |
| Texto sobre el marco | `text-cap-frame-ink` | `--cap-frame-ink` | `#1E1B1A` | `#FFFFFF` |
| Texto secundario sobre el marco | `text-cap-frame-ink-soft` | `--cap-frame-ink-soft` | `#695F58` | `#D2CAC3` |
| Riel o barra más oscura dentro del marco | `bg-cap-rail` | `--cap-rail` | `#171717` | igual |
| Barra de título de panel, PDF (la cabecera de tabla es `bg-cap-table-head`) | `bg-cap-head` | `--cap-head` | `#1E1B1A` | `#2B2B2B` |
| Fondo de página (lienzo) | `bg-cap-page` | `--cap-page` | `#F1EDE9` | `#151312` |
| Tarjetas, paneles, modales | `bg-cap-card` | `--cap-card` | `#FFFDFB` | `#211D1C` |
| Superficie secundaria: chips, hover de fila, esqueletos, solo lectura | `bg-cap-card-2` | `--cap-card-2` | `#F1EDE9` | `#2B2624` |
| Divisores y bordes decorativos | `border-cap-divider` | `--cap-divider` | `#E6DFD8` | `#3A3431` |
| Borde de inputs y controles | `border-cap-input-line` | `--cap-input-line` | `#8C8985` | `#808080` |
| Texto secundario sobre tarjeta | `text-cap-text-soft` | `--cap-text-soft` | `#695F58` | `#A89C91` |
| Texto sobre `bg-cap-chrome` o `bg-cap-head` sólidos | `text-cap-on-chrome` | `--cap-on-chrome` | `#E9E4E0` | igual |
| Texto secundario sobre esas mismas superficies sólidas | `text-cap-on-chrome-soft` | `--cap-on-chrome-soft` | `#D2CAC3` | igual |
| Gris de marca (acentos menores sobre el marco) | `text-cap-brand-gray` | `--cap-gray` | `#B2B2B2` | igual |
| Topo: series neutras, avatar sin foto | `bg-cap-taupe` | `--cap-taupe` | `#A89C91` | igual |
| Color de marca como **texto, ícono o borde**: enlaces de tabla, filo del ítem activo, punto de la sección activa | `text-cap-brand dark:text-cap-brand-soft` | `--cap-brand` | `#B12530` | `#E8707A` |
| Color de marca como **relleno**: botón flotante, logo del marco (el destructivo y los contadores urgentes usan `status-error`, ver «Estados») | `bg-cap-brand text-white hover:bg-cap-brand-hover` | `--cap-red` | `#B12530` | igual |
| Cabecera de tabla (fondo / texto / línea) | `bg-cap-table-head text-cap-table-head-ink border-cap-table-head-line` | `--cap-table-head*` | `#F1EDE9` / `#1E1B1A` / `#E6DFD8` | `#2B2624` / `#E9E4E0` / `#3A3431` |

## Escala de marca

Los nombres `red-*`, `wine` y `--cap-red` son los papeles de la escala de marca (acento, profundo); en cada marca valen su propio color.

| Paso | Clase | Valor |
|---|---|---|
| red-50 | `bg-cap-red-50` | `#FBEDEE` |
| red-100 | `bg-cap-red-100` | `#F3DADD` |
| red-200 | `bg-cap-red-200` | `#F2D3D6` |
| red-400 | `bg-cap-red-400` | `#DB7F87` |
| red-600 | `bg-cap-red-600` | `#B12530` |
| red-800 | `bg-cap-red-800` | `#6E1219` |
| wine | `bg-cap-wine` | `#6E1219` |
| brand-soft | `text-cap-brand-soft` | `#E8707A` |

## Estados

| Estado | Texto claro | Texto oscuro | Tinte claro | Tinte oscuro | Sólido |
|---|---|---|---|---|---|
| `ok` | `#276B2B` | `#81C784` | `#E7F4EC` | `rgba(129,199,132,.14)` | `#3FA35B` |
| `error` | `#B12530` | `#E8707A` | `#FBEDEE` | `rgba(177,37,48,.16)` | `#B12530` |
| `warning` | `#A85300` | `#FFA726` | `#FCF1DC` | `rgba(255,167,38,.14)` | `#A85300` |
| `info` | `#1565C0` | `#64B5F6` | `#E3EEF9` | `rgba(100,181,246,.14)` | `#1565C0` |
| `neutral` | `#616161` | `#9E9E9E` | — | — | — |

## Vidrio y degradados

- `--cap-glass-bg` claro: `rgba(255,253,251, 0.72)`
- `--cap-glass-bg` oscuro: `rgba(20,18,17, 0.78)`
- `--cap-gradient-featured`: `radial-gradient(90% 120% at 15% 0%, #B12530 0%, #8A1C25 45%, #5A0E14 100%)`
- `--cap-gradient-primary`: `linear-gradient(135deg, #B12530 0%, #6E1219 100%)`

## Contraste medido

| Par | Relación | Mínimo |
|---|---|---|
| frameInkSoft on light glass over card | 6.13:1 | 4.5:1 |
| frameInkSoft on light glass over paper | 5.91:1 | 4.5:1 |
| frameInk on light glass over card | 16.87:1 | 4.5:1 |
| frameInk on light glass over paper | 16.29:1 | 4.5:1 |
| frameInk on light glass over wine | 9.53:1 | 4.5:1 |
| dark frameInkSoft on dark glass over dark card | 11.32:1 | 4.5:1 |
| dark frameInk on dark glass over dark card | 18.33:1 | 4.5:1 |
| tooltip ink on tooltip (light) | 13.56:1 | 4.5:1 |
| tooltip ink on tooltip (dark) | 15.06:1 | 4.5:1 |
| white on gradient featured start | 6.61:1 | 4.5:1 |
| white on gradient primary start | 6.61:1 | 4.5:1 |
| statusInk.ok on light glass over card | 6.43:1 | 4.5:1 |
| statusInk.info on light glass over card | 8.38:1 | 4.5:1 |
| statusInk.warning on light glass over card | 7.09:1 | 4.5:1 |
| statusInk.error on light glass over card | 6.51:1 | 4.5:1 |
| textSoft on card | 6.13:1 | 4.5:1 |
| textSoft on paper | 5.34:1 | 4.5:1 |
| brand on tint | 5.81:1 | 4.5:1 |
| tableHead ink on tableHead bg (light) | 14.70:1 | 4.5:1 |
| tableHead ink on tableHead bg (dark) | 11.84:1 | 4.5:1 |
| white on wine | 11.91:1 | 4.5:1 |
| surface on card | 16.87:1 | 4.5:1 |
| dark.textSoft on dark.card | 6.23:1 | 4.5:1 |
| redSoft on dark.card | 5.59:1 | 4.5:1 |
| textSoft on login glass | 4.77:1 | 4.5:1 |
| inputLine on card | 3.43:1 | 3:1 |
