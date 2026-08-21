import { expect, test } from 'vitest';
import {
  createSessionToken,
  verifySessionToken,
  constantTimeEquals,
  SESSION_DURATION_MS,
} from '../src/lib/session';

const SECRET = 'test-secret';

test('token válido pasa verificación', () => {
  const token = createSessionToken(SECRET, 1000);
  expect(verifySessionToken(token, SECRET, 2000)).toBe(true);
});

test('token expirado falla', () => {
  const token = createSessionToken(SECRET, 1000);
  expect(verifySessionToken(token, SECRET, 1000 + SESSION_DURATION_MS + 1)).toBe(false);
});

test('firma alterada falla', () => {
  const token = createSessionToken(SECRET, 1000);
  const [exp] = token.split('.');
  expect(verifySessionToken(`${exp}.deadbeef`, SECRET)).toBe(false);
});

test('secreto distinto falla', () => {
  const token = createSessionToken(SECRET, 1000);
  expect(verifySessionToken(token, 'otro-secreto', 2000)).toBe(false);
});

test('token vacío o malformado falla', () => {
  expect(verifySessionToken(undefined, SECRET)).toBe(false);
  expect(verifySessionToken('', SECRET)).toBe(false);
  expect(verifySessionToken('no-tiene-punto', SECRET)).toBe(false);
});

test('constantTimeEquals compara strings', () => {
  expect(constantTimeEquals('abc', 'abc')).toBe(true);
  expect(constantTimeEquals('abc', 'abd')).toBe(false);
  expect(constantTimeEquals('abc', 'abcd')).toBe(false);
});
