declare module '*/design/statuses.js' {
  export function statusBadgeClass(status: string): string;
}

interface CapToastOptions {
  status: 'ok' | 'info' | 'warning' | 'error' | 'neutral';
  title: string;
  detail?: string;
  action?: { label: string; onSelect: () => void };
}

interface Window {
  capToast: (options: CapToastOptions) => unknown;
}
