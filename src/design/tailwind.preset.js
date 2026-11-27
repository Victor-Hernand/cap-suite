// Preset de Tailwind con la identidad de la marca instalada. En tailwind.config.js del proyecto:
//   import cap from './resources/design/tailwind.preset.js';
//   export default { presets: [cap], content: [...] };
import colors from 'tailwindcss/colors';
import defaultTheme from 'tailwindcss/defaultTheme';
import tokens from './tokens.json' with { type: 'json' };

const { brand, chrome, fonts, status, statusSurface, motion, radius, gradients } = tokens;

// Un alias por cada variable --cap-status-<estado>-<rol> que emite tokens.css; los roles con tema
// (tint, tint-border, ink) definen los mismos estados en claro y oscuro, así que basta leer el claro.
const statusNamesByRole = {
    solid: Object.keys(statusSurface.solid),
    'solid-hover': Object.keys(statusSurface.solidHover),
    tint: Object.keys(statusSurface.tint.light),
    'tint-border': Object.keys(statusSurface.tintBorder.light),
    ink: Object.keys(statusSurface.ink.light),
};
const statusRoleColors = Object.fromEntries(
    Object.entries(statusNamesByRole).flatMap(([role, statusNames]) => statusNames.map((statusName) => {
        const alias = `status-${statusName}-${role}`;
        return [alias, `var(--cap-${alias})`];
    })),
);

/** @type {Partial<import('tailwindcss').Config>} */
export default {
    // Modo oscuro por clase `dark` (en <html> o <body>), nunca por preferencia del sistema.
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: [fonts.text, ...defaultTheme.fontFamily.sans],
                display: [fonts.display, ...defaultTheme.fontFamily.sans],
            },
            colors: {
                // Los grises de Tailwind (gray, slate, zinc) son fríos y tiñen de azul el modo
                // oscuro al lado del marco oscuro cálido; los tres se unifican en la escala neutra.
                gray: colors.neutral,
                slate: colors.neutral,
                zinc: colors.neutral,
                cap: {
                    brand: brand.red,
                    'brand-hover': brand.redHover,
                    'brand-soft': brand.redSoft,
                    'brand-gray': brand.gray,
                    wine: brand.wine,
                    taupe: brand.taupe,
                    'red-50': brand.redScale['50'],
                    'red-100': brand.redScale['100'],
                    'red-200': brand.redScale['200'],
                    'red-400': brand.redScale['400'],
                    'red-600': brand.redScale['600'],
                    'red-800': brand.redScale['800'],
                    chrome: chrome.surface,
                    rail: chrome.rail,
                    raised: chrome.raised,
                    line: chrome.line,
                    canvas: chrome.canvas,
                    paper: chrome.paper,
                    'paper-line': chrome.paperLine,
                    'on-chrome': chrome.onChrome,
                    'on-chrome-soft': chrome.onChromeSoft,
                    // Alias de rol: cambian solos con el tema vía tokens.css (no admiten `/opacidad`).
                    page: 'var(--cap-page)',
                    card: 'var(--cap-card)',
                    'card-2': 'var(--cap-card-2)',
                    divider: 'var(--cap-divider)',
                    head: 'var(--cap-head)',
                    frame: 'var(--cap-frame)',
                    'frame-ink': 'var(--cap-frame-ink)',
                    'frame-ink-soft': 'var(--cap-frame-ink-soft)',
                    'input-line': 'var(--cap-input-line)',
                    'text-soft': 'var(--cap-text-soft)',
                    'table-head': 'var(--cap-table-head)',
                    'table-head-ink': 'var(--cap-table-head-ink)',
                    'table-head-line': 'var(--cap-table-head-line)',
                    ...statusRoleColors,
                    status: status.light,
                    'status-dark': status.dark,
                },
            },
            backgroundImage: {
                'cap-gradient-featured': gradients.featured,
                'cap-gradient-primary': gradients.primary,
            },
            borderRadius: {
                'cap-control': radius.control,
                'cap-card': radius.card,
                'cap-shell': radius.shell,
                'cap-sheet': radius.sheet,
            },
            fontSize: {
                // Tablas en densidad compacta: 13/18. Único tamaño fuera de la escala de Tailwind.
                'cap-dense': ['13px', '18px'],
                // Ícono de estado vacío.
                'cap-icon': ['40px', '1'],
            },
            inset: {
                // Debajo del header flotante: 12 de aire + 64 de header + 12.
                'cap-below-header': '88px',
            },
            zIndex: {
                'cap-header': '30',
                'cap-sidebar': '40',
                'cap-dropdown': '50',
                'cap-drawer': '60',
                'cap-modal': '70',
                'cap-toast': '80',
            },
            // Movimiento: `duration-cap-base ease-cap` en transiciones; `animate-cap-rise-in` al montar.
            transitionDuration: {
                'cap-fast': motion.duration.fast,
                'cap-base': motion.duration.base,
                'cap-slow': motion.duration.slow,
            },
            transitionTimingFunction: {
                cap: motion.easing.standard,
                'cap-enter': motion.easing.enter,
                'cap-exit': motion.easing.exit,
            },
            keyframes: {
                'cap-fade-in': { from: { opacity: '0' } },
                'cap-rise-in': { from: { opacity: '0', transform: 'translateY(8px)' } },
                'cap-pulse': { '50%': { opacity: '0.45' } },
            },
            animation: {
                'cap-fade-in': `cap-fade-in ${motion.duration.base} ${motion.easing.enter} both`,
                'cap-rise-in': `cap-rise-in ${motion.duration.base} ${motion.easing.enter} both`,
                'cap-pulse': 'cap-pulse 1.6s ease-in-out infinite',
            },
        },
    },
};
