import { describe, expect, it } from 'vitest';
import { storePendingToast, takePendingToast } from '../src/lib/pendingToast';

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
    removeItem: (key: string) => void values.delete(key),
  };
}

describe('pendingToast', () => {
  it('devuelve el toast guardado una sola vez', () => {
    const storage = memoryStorage();
    storePendingToast(storage, { status: 'ok', title: 'Aplicación creada', detail: 'Correo' });

    expect(takePendingToast(storage)).toEqual({ status: 'ok', title: 'Aplicación creada', detail: 'Correo' });
    expect(takePendingToast(storage)).toBeNull();
  });

  it('sin toast guardado devuelve null', () => {
    expect(takePendingToast(memoryStorage())).toBeNull();
  });

  it('descarta lo que no es un toast válido', () => {
    const storage = memoryStorage();
    storage.setItem('cap-suite:pending-toast', '{"status":"fiesta","title":"x"}');
    expect(takePendingToast(storage)).toBeNull();

    storage.setItem('cap-suite:pending-toast', 'no es json');
    expect(takePendingToast(storage)).toBeNull();
  });
});
