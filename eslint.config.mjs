import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/node_modules/**',
      '**/playwright-report/**',
      '**/test-results/**',
      // Kiro skill tooling scripts run in their own runtimes (Reveal.js,
      // standalone Node CLIs) and are not part of the application source.
      '.kiro/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // Treat underscore-prefixed identifiers as intentionally unused (matches tsconfig).
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    // Frontend: browser + React component code.
    files: ['client/src/**/*.{ts,tsx}', 'client/tests/**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    // Backend, e2e specs, and tooling/config files run in Node.
    files: [
      'server/**/*.ts',
      'client/e2e/**/*.ts',
      'scripts/**/*.{js,mjs,cjs}',
      '**/*.config.{js,ts,mjs,cjs}',
      'eslint.config.mjs',
    ],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  prettier
);
