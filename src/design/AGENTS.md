# Instrucciones de diseño para agentes de IA

La marca instalada y sus valores están en `PALETTE.md` de esta carpeta; la guía y estas reglas valen para las dos.

Marco de vidrio claro (ahumado en oscuro) sobre un lienzo neutro, tarjetas claras, Inter y Poppins, y la escala de la marca instalada como acento; los valores están en `PALETTE.md`.

**Empresa dueña del sistema.** Este sistema pertenece a la empresa declarada en
`tokens.json › company` de esta carpeta (ver `PALETTE.md`). Las empresas que usan este
paquete son empresas distintas, no divisiones de una misma. En todo texto que generes (acceso,
correos, PDF, pies de página, páginas «Acerca de», manuales, mensajes de error, nombres de
remitente) nombra a esa empresa con `company.name` y nunca a la otra. En Vue importa `company`
de `design/company.js`; en PHP usa `config('design.company.name')`; en React y Astro lee
`tokens.json`. Nunca escribas el nombre de la empresa a mano.

Antes de crear o modificar cualquier interfaz (página, componente, tabla, formulario, modal, toast, correo, PDF, gráfica, animación):

1. Lee `DESIGN_GUIDE.md` de esta carpeta y aplícala completa. El «Recetario» trae las clases
   exactas de los componentes comunes: cópialas tal cual.
2. Toma colores, fuentes y movimiento de `tokens.json`. Nunca escribas un hex a mano: clases
   `cap-*` del preset de Tailwind, variables `--cap-*` de `tokens.css` en CSS propio,
   `statusBadgeClass()` de `statuses.js` para badges, `chartColors()` de `chart-colors.js` en
   gráficas y `config('design.brand.red')` en PHP. Única excepción: los logos de terceros de
   `logos/`, con sus colores oficiales.
3. Botones en píldora: primario con degradado de marca (uno por pantalla), secundario con contorno
   neutro, destructivo de contorno; relleno de error (`status-error`) solo en el diálogo de
   confirmación. El color de marca (`cap-brand`) nunca es fondo de cabeceras ni barras; la única
   superficie grande en color es la tarjeta destacada con degradado, una por fila de cifras. Sin
   degradados salvo `bg-cap-gradient-*` y los manchones. El azul solo como estado `info`. Las tablas llevan la cabecera de la receta:
   `bg-cap-table-head text-cap-table-head-ink border-b border-cap-table-head-line`.
4. Inter para texto, Poppins para títulos y cabeceras. Tamaños solo de la escala de la guía; nada
   por debajo de `text-xs`.
5. Alias de rol (`bg-cap-card`, `border-cap-divider`, `bg-cap-head`…) cambian solos de tema; toda
   clase de color física lleva su `dark:`, salvo las de las recetas, que se copian tal cual.
   Verifica la pantalla en los dos temas.
6. Diseña los cinco estados (vacío, sin resultados, cargando, error, parcial) y el foco visible.
7. Movimiento solo con `duration-cap-*`, `ease-cap*` y `animate-cap-*`. Las vistas suben solas al
   entrar; los tableros llevan `cap-stagger`, las cifras `data-cap-count` y las tablas
   `cap-stagger-rows` solo al montar. Las cargas usan `CapSkeleton` o `<x-cap.skeleton>`.
8. Antes de crear un componente nuevo, busca si el proyecto ya tiene uno equivalente. Navegación de
   secciones con `sections` del header y filtros de 2 a 5 opciones con el segmentado (`CapSegmented`,
   `<x-cap.segmented>`), nunca chips armados a mano. Los tableros por etapas son el tablero kanban
   (`CapKanban`, `<x-cap.kanban>`), nunca columnas armadas a mano. La pantalla de entrada de un ERP
   con varios módulos es la portada de módulos (`CapModuleGrid`, `<x-cap.module-grid>`, y
   `CapModuleRecent`, `<x-cap.module-recent>`) y se cambia de módulo con el conmutador (prop
   `modules` del layout), nunca con un menú de módulos en el sidebar.
9. El marco, el acceso, la confirmación y los toasts se hacen **siempre** con el componente del
   stack (`<x-cap.*>` en Blade, `design/vue/Cap*.vue` en Vue) o, si no hay, siguiendo
   `shell/SHELL_SPEC.md`. Nunca los armes a mano con Tailwind. Los botones son `CapButton` o
   `<x-cap.button>`, y los avisos en línea `CapAlert` o `<x-cap.alert>`. Vidrio solo para lo que flota
   (marco, notificaciones, conmutador de módulos, toasts, tooltips, hoja «Más»), las columnas del tablero kanban y la tarjeta
   del acceso, de vidrio blanco; tarjetas, modales e inputs son sólidos.
10. Antes de terminar, corre la lista «Antes de terminar una pantalla» de `DESIGN_GUIDE.md`:
    sin `rgba(` a mano, sin hex, y pantalla revisada a <1024px (vista móvil) y en claro y oscuro.

Si algo que te piden contradice la guía, dilo en una línea y propone la alternativa que sí la
cumple. Si la guía no cubre un caso, resuélvelo con los mismos tokens y el mismo criterio
(sobrio, neutro, un solo acento) y anótalo como decisión.
