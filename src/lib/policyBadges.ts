import { statusBadgeClass } from '../design/statuses.js';

export type StatusTone = 'ok' | 'error' | 'warning' | 'info' | 'neutral';

const toneByPolicyId: Record<string, StatusTone> = {
  active: 'ok',
  'under-review': 'warning',
  draft: 'info',
};

export function policyBadgeTone(id: string): StatusTone {
  return toneByPolicyId[id] ?? 'neutral';
}

export function policyBadgeClass(id: string): string {
  return statusBadgeClass(policyBadgeTone(id));
}
