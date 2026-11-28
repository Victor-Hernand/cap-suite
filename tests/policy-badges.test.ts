import { expect, test } from 'vitest';
import { policyBadgeClass, policyBadgeTone } from '../src/lib/policyBadges';

test('maps each policy status to its semantic tone', () => {
  expect(policyBadgeTone('active')).toBe('ok');
  expect(policyBadgeTone('under-review')).toBe('warning');
  expect(policyBadgeTone('draft')).toBe('info');
  expect(policyBadgeTone('obsolete')).toBe('neutral');
});

test('keeps types and classifications neutral', () => {
  expect(policyBadgeTone('policy')).toBe('neutral');
  expect(policyBadgeTone('internal')).toBe('neutral');
  expect(policyBadgeTone('public')).toBe('neutral');
});

test('falls back to neutral for unknown ids', () => {
  expect(policyBadgeTone('unknown-id')).toBe('neutral');
});

test('builds the badge class from the tone', () => {
  expect(policyBadgeClass('active')).toContain('text-cap-status-ok');
  expect(policyBadgeClass('unknown-id')).toContain('text-cap-status-neutral');
});
