// Clases del badge por estado semántico (ok, error, warning, info, neutral).
// Uso en Vue: import { statusBadgeClass } from '@/../design/statuses.js';
//             <span :class="statusBadgeClass('ok')"><span class="h-1.5 w-1.5 rounded-full bg-current" />Pagado</span>
// Los estados del dominio (pending, approved, void…) se mapean a uno de estos cinco en el proyecto.
const BADGE_BASE = 'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium';

export const STATUS_CLASSES = {
    ok: 'bg-cap-status-ok/10 text-cap-status-ok dark:bg-cap-status-dark-ok/15 dark:text-cap-status-dark-ok',
    error: 'bg-cap-status-error/10 text-cap-status-error dark:bg-cap-status-dark-error/15 dark:text-cap-status-dark-error',
    warning: 'bg-cap-status-warning/10 text-cap-status-warning dark:bg-cap-status-dark-warning/15 dark:text-cap-status-dark-warning',
    info: 'bg-cap-status-info/10 text-cap-status-info dark:bg-cap-status-dark-info/15 dark:text-cap-status-dark-info',
    neutral: 'bg-cap-status-neutral/10 text-cap-status-neutral dark:bg-cap-status-dark-neutral/15 dark:text-cap-status-dark-neutral',
};

export function statusBadgeClass(status) {
    return `${BADGE_BASE} ${STATUS_CLASSES[status] ?? STATUS_CLASSES.neutral}`;
}
