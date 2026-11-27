import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Base en memoria: los esquemas consultan el catálogo de departamentos con getDb().
  test: { environment: 'node', env: { DATABASE_PATH: ':memory:' } },
});
