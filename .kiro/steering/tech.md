---
title: Technology & Build
inclusion: always
---

# Technology & Build

## Runtime & Language

- Node.js 22 LTS (pinned in `.nvmrc`)
- TypeScript 5 (strict mode) — ES Modules throughout
- npm 10+ with workspaces (single `npm install` at root)

## Backend (`server/`)

| Concern | Tool |
|---------|------|
| Framework | Express 4 |
| ORM | Prisma 5 (SQLite) |
| Dev runner | `tsx` (hot reload via `node --import tsx`) |
| Env vars | `dotenv` |

## Frontend (`client/`)

| Concern | Tool |
|---------|------|
| UI | React 18 |
| Bundler | Vite 5 |
| Styling | Tailwind CSS 3 + PostCSS + Autoprefixer |

## Testing

| Layer | Tool |
|-------|------|
| Unit / Component | Vitest 1 + Testing Library (React + jsdom) |
| E2E | Playwright |
| Coverage | @vitest/coverage-v8 |

## Code Quality

| Concern | Tool |
|---------|------|
| Linting | ESLint 9 flat config + typescript-eslint + react-hooks + react-refresh + prettier integration |
| Formatting | Prettier (semi, single quotes, trailing commas ES5, 100 char width, 2-space indent) |

## Common Commands

```bash
# Development (frontend :5173, backend :3001, API proxy on /api/*)
npm run dev

# Run all unit/component tests
npm test

# Single workspace test
npm run test --workspace=server
npm run test --workspace=client

# Single file test
npm run test --workspace=server -- tests/file.test.ts

# E2E tests (Playwright)
npm run test:e2e

# Lint & format
npm run lint
npm run format:check

# Type-check per workspace
npx tsc --noEmit --project server/tsconfig.json
npx tsc --noEmit --project client/tsconfig.json

# Full build (type-check + compile)
npm run build

# Database (after schema.prisma changes)
npm run db:generate --workspace=server
npm run db:migrate --workspace=server
cd server && npx prisma db seed  # Re-seed development data

# Validate docs/ structure & EARS compliance
node .kiro/skills/validate-docs/scripts/validate-docs.mjs
```

## Key Configuration Files

- `tsconfig.json` — shared strict base
- `eslint.config.mjs` — flat ESLint config
- `.prettierrc.json` / `.prettierignore` — Prettier settings
- `client/vite.config.ts` — Vite dev server + API proxy
- `client/tailwind.config.js` — Tailwind content paths
- `server/prisma/schema.prisma` — database schema
