import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['dotenv/config'],
    include: ['tests/**/*.test.ts'],
    // Integration tests share a single SQLite database. Run test files
    // serially in one fork so global table-state assertions (e.g. seed.test.ts)
    // never observe another file's in-flight records.
    fileParallelism: false,
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/'],
    },
  },
});
