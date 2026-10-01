// El color del texto y del placeholder de los controles viene de la capa base (global.css).
export const inputClass =
  'w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm focus:border-ink focus:outline-none';

export const textareaClass = `${inputClass} resize-y`;

// Flecha propia y color-scheme light en .admin-select (global.css): el desplegable
// nativo no hereda el tema oscuro del sistema y todos los select se ven iguales.
export const selectClass = `${inputClass} admin-select cursor-pointer pr-9`;

export const labelClass = 'mb-1 block text-[10px] font-bold tracking-wider text-body';

export const fieldErrorClass = 'mt-1 text-xs text-red-700';

export const alertErrorClass = 'rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700';

export const pagerButtonClass =
  'rounded-lg border border-edge px-3 py-1 font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-40';
