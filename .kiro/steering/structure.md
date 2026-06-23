---
title: Project Structure
inclusion: always
---

# Project Structure

Monorepo with two npm workspaces: `server/` (Express API) and `client/` (React SPA).

```
├── package.json              # Root: workspaces, shared scripts, dev tooling
├── tsconfig.json             # Shared strict TypeScript base
├── eslint.config.mjs         # Flat ESLint config (TS + React + Prettier)
├── .prettierrc.json          # Formatting rules
├── AGENTS.md                 # AI agent operational guidance
├── DESIGN.md                 # Design system tokens & guidelines (Google design.md spec)
├── docs/                     # Domain documentation & use-case briefs
│   ├── use-cases.md
│   ├── requirements.md      # Full functional requirements & data model
│   ├── architecture.md      # System architecture, tier design, key decisions
│   ├── ui-spec.md           # UI/UX screen specifications & component hierarchy
│   ├── api-spec.md          # REST API specification (human-readable)
│   └── openapi.yaml         # OpenAPI 3.0.3 swagger specification
├── .kiro/steering/           # Kiro steering files (always + fileMatch context)
│   ├── product.md           # Product domain, rules, data model (always)
│   ├── tech.md              # Stack, commands, config (always)
│   ├── structure.md         # This file — project layout (always)
│   ├── api-routes.md        # OpenAPI contract (fileMatch: routes)
│   └── database.md          # Prisma conventions (fileMatch: prisma)
├── .kiro/hooks/              # Agent hooks (automated actions on events)
├── .kiro/skills/             # Kiro skills (validate-docs, etc.)
│
├── server/                   # Express backend workspace
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   ├── prisma/
│   │   ├── schema.prisma    # SQLite database schema
│   │   └── seed.ts          # Idempotent dev data seed script (tsx)
│   ├── src/
│   │   ├── index.ts         # App entry — middleware, routes, server start
│   │   ├── routes/          # Express route modules (thin handlers)
│   │   │   └── api.ts       # /api/* routes
│   │   ├── services/        # Business logic (pure functions, testable)
│   │   └── middleware/      # Error handler, shared middleware
│   │       └── errorHandler.ts
│   └── tests/               # Vitest unit tests (mirrors src/ structure)
│
├── client/                   # React + Vite frontend workspace
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts       # Dev server (:5173), /api proxy to :3001
│   ├── vitest.config.ts
│   ├── tailwind.config.js
│   ├── index.html            # Vite HTML entry
│   ├── src/
│   │   ├── main.tsx          # React mount point
│   │   ├── App.tsx           # Root component
│   │   ├── index.css         # Tailwind directives
│   │   ├── components/       # Reusable UI components (PascalCase files)
│   │   ├── pages/            # Route-level page components
│   │   └── hooks/            # Custom React hooks
│   ├── tests/                # Vitest + Testing Library component tests
│   │   └── setup.ts         # Test setup (jsdom, matchers)
│   └── e2e/                  # Playwright end-to-end specs
│       └── sample.spec.ts
```

## Conventions

- **Route handlers** are thin — validate input, call service, return response. Business logic belongs in `server/src/services/`.
- **Components** use `data-testid` attributes for Playwright selectors.
- **Test files** mirror their source file name with `.test.ts(x)` suffix.
- **Shared types** live alongside the module that owns them; cross-workspace types go in a shared location if needed.
- The Vite dev server proxies `/api/*` to Express so the frontend uses relative paths for API calls.
- Directories like `services/`, `components/`, `pages/`, and `hooks/` are created as needed during implementation — they define the target layout.
