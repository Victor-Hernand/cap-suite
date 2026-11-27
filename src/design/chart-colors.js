// Paleta de gráficas desde tokens.json. Uso: import { chartColors } from '@/../design/chart-colors.js';
// Recalcular al cambiar de tema (las gráficas en canvas no leen variables CSS).
import tokens from './tokens.json';

const darkModeActive = () => document.documentElement.classList.contains('dark') || document.body.classList.contains('dark');

export function chartColors(isDark = darkModeActive()) {
    const { brand, chrome, dark, status } = tokens;
    const blush = brand.redScale['200'];

    return {
        // Orden fijo validado para daltonismo: se toma desde series[0], sin saltarse colores. Máximo cuatro.
        series: isDark
            ? [brand.redSoft, blush, brand.red, brand.wine]
            : [brand.red, chrome.surface, brand.taupe, blush],
        status: status[isDark ? 'dark' : 'light'],
        text: isDark ? dark.textSoft : chrome.textSoft,
        grid: isDark ? dark.divider : chrome.paperLine,
    };
}
