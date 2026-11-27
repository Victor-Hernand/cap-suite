// Clases del Recetario del design system (src/design/DESIGN_GUIDE.md), copiadas tal cual.
export const cardClass = 'rounded-cap-card border border-cap-divider bg-cap-card p-5';

export const tableClass = 'w-full border-separate border-spacing-0 text-sm text-gray-900 dark:text-gray-100';

export const tableHeadClass =
  'bg-cap-table-head px-3 py-2.5 text-left font-display text-xs font-semibold text-cap-table-head-ink border-b border-cap-table-head-line';

export const tableCellClass = 'h-11 border-t border-cap-divider px-3';

export const fieldLabelClass = 'mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300';

export const fieldInputClass =
  'block h-10 w-full rounded-cap-control border border-cap-input-line bg-cap-card px-3 text-sm text-gray-900 placeholder:text-gray-500 transition-colors duration-cap-fast ease-cap focus:border-cap-chrome focus:outline-none focus:ring-1 focus:ring-cap-chrome disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-100 dark:placeholder:text-gray-400 dark:focus:border-gray-100 dark:focus:ring-gray-100';

export const fieldSelectClass = `${fieldInputClass} dark:[color-scheme:dark]`;

export const fieldTextareaClass = fieldInputClass.replace('h-10', 'py-2');

export const fieldErrorClass = 'mt-1 text-xs text-cap-status-error dark:text-cap-status-dark-error';

export const fieldHelpClass = 'mt-1 text-xs text-cap-text-soft';

export const emptyStateClass =
  'flex flex-col items-center justify-center rounded-cap-card border border-dashed border-cap-divider px-6 py-12 text-center';

export const iconButtonClass =
  'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-cap-text-soft transition-colors duration-cap-fast ease-cap hover:bg-cap-card-2 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-cap-chrome focus-visible:ring-offset-2 focus-visible:ring-offset-cap-card dark:hover:text-gray-100 dark:focus-visible:ring-gray-100';
