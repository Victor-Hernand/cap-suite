import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE = 'cap_admin_session';
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

export function createSessionToken(secret: string, nowMs = Date.now()): string {
  const expiresAt = nowMs + SESSION_DURATION_MS;
  return `${expiresAt}.${sign(String(expiresAt), secret)}`;
}

export function verifySessionToken(
  token: string | undefined,
  secret: string,
  nowMs = Date.now(),
): boolean {
  if (!token) return false;
  const separator = token.indexOf('.');
  if (separator <= 0) return false;
  const expiresAtRaw = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  if (!constantTimeEquals(signature, sign(expiresAtRaw, secret))) return false;
  const expiresAt = Number(expiresAtRaw);
  return Number.isFinite(expiresAt) && expiresAt > nowMs;
}

export function constantTimeEquals(a: string, b: string): boolean {
  const hashA = createHash('sha256').update(a).digest();
  const hashB = createHash('sha256').update(b).digest();
  return a.length === b.length && timingSafeEqual(hashA, hashB);
}
