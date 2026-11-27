import { describe, expect, it } from 'vitest';
import { fieldInputClass, fieldSelectClass, withFieldError } from '../src/lib/capClasses';

describe('withFieldError', () => {
  it('sin error deja la clase del campo intacta', () => {
    expect(withFieldError(fieldInputClass, false)).toBe(fieldInputClass);
  });

  it('con error cambia el borde y el foco al color de error', () => {
    const classes = withFieldError(fieldSelectClass, true).split(' ');

    for (const expected of [
      'border-cap-status-error',
      'dark:border-cap-status-dark-error',
      'focus:border-cap-status-error',
      'focus:ring-cap-status-error',
      'dark:focus:border-cap-status-dark-error',
      'dark:focus:ring-cap-status-dark-error',
    ]) {
      expect(classes).toContain(expected);
    }
    for (const replaced of [
      'border-cap-input-line',
      'focus:border-cap-chrome',
      'focus:ring-cap-chrome',
      'dark:focus:border-gray-100',
      'dark:focus:ring-gray-100',
    ]) {
      expect(classes).not.toContain(replaced);
    }
  });
});
