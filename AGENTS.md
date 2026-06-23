# AGENTS.md

> A README for AI agents. This file provides persistent, project-specific operational guidance for any AI coding assistant working in this repository.

## Context Sources

This project uses Kiro steering files (`.kiro/steering/`) as the source of truth for technology, structure, and product context. Consult them in this order:

1. `.kiro/steering/product.md` — Product domain, business rules, data model, UI expectations
2. `.kiro/steering/tech.md` — Technology stack, build tools, common commands
3. `.kiro/steering/structure.md` — File/folder layout and conventions
4. `.kiro/steering/api-routes.md` — API contract and OpenAPI spec (loaded contextually)
5. `.kiro/steering/database.md` — Prisma schema and DB conventions (loaded contextually)
6. `DESIGN.md` — Design system tokens and visual identity (Standard Bank branding)
7. `docs/ui-spec.md` — UI/UX screen specifications and component hierarchy
8. `docs/` — Additional specs, architecture decisions, API docs

This file (`AGENTS.md`) covers methodology, engineering principles, and patterns that apply regardless of which area you're working in.

## Development Methodology: Strict TDD

This project follows **strict Test-Driven Development** (red-green-refactor). Every implementation task follows this exact sequence:

### The TDD Cycle

```
1. RED    — Write a failing test that describes the desired behavior
2. GREEN  — Write the minimum implementation to make the test pass
3. REFACTOR — Clean up while keeping tests green
```

### Rules

- **No production code without a failing test first.** If there is no test demanding the code, the code does not get written.
- **One behavior per test.** Each `it()` block tests exactly one thing.
- **BDD-style descriptions.** Use `describe` for the unit under test, `it` for the behavior in plain English.
- **Tests are the specification.** They document what the system does — not what might happen.

### BDD Test Style (Vitest)

```typescript
describe('FeatureName', () => {
  describe('when [precondition]', () => {
    it('should [expected behavior]', () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

### Playwright E2E Style (one user flow per feature)

```typescript
test.describe('Feature: [Name]', () => {
  test('[User can accomplish goal]', async ({ page }) => {
    // One complete user journey per test
    // Use data-testid attributes for selectors
    // Assert visible outcomes, not implementation details
  });
});
```

## Mandatory Agent Workflow

Every task — whether a bug fix, new feature, or refactor — MUST follow these steps:

### Step 1: Think (before writing any code)

Before implementation, verify:
- [ ] What is the goal? Restate it in your own words.
- [ ] Does this align with the steering docs (`.kiro/steering/`)?
- [ ] Does this align with domain documentation (`docs/` folder)?
- [ ] Are there existing patterns in the codebase to follow?
- [ ] What is the minimal scope? (YAGNI — do not add speculative features)

### Step 2: Test First (RED phase)

- Write the failing test(s) that describe the new behavior.
- Run the test to confirm it fails for the right reason.
- If the expected behavior is unclear, **STOP and ask for clarity** — do not guess.

### Step 3: Implement (GREEN phase)

- Write the minimum code to make the test pass.
- Do not add code that is not demanded by a test.
- Run the test to confirm it passes.

### Step 4: Refactor

- Clean up duplication, improve naming, extract reusable pieces.
- Run all related tests to confirm nothing broke.

### Step 5: Validate (after implementation)

Before declaring a task complete, verify:
- [ ] All new code is covered by tests.
- [ ] No assumptions or guesswork slipped in — every decision traces to a requirement, a test, or a documented pattern.
- [ ] Types are explicit (no `any`, no implicit returns).
- [ ] The implementation follows the engineering principles below.
- [ ] Linting passes (`npm run lint`).
- [ ] Type-checking passes (`npx tsc --noEmit`).

## When to Pause and Ask

**Do not guess. Do not hallucinate. Do not assume.**

Stop and ask the user for clarity when:
- The acceptance criteria are ambiguous or incomplete.
- A business rule is not documented in `docs/` or steering files.
- You are unsure which architectural pattern to follow.
- A dependency or library decision is needed that is not already in `package.json`.
- The task requires modifying a shared interface or contract (types, API routes, DB schema).
- You cannot write a meaningful test because the expected behavior is unclear.

When pausing, reference the specific gap: cite the document, section, or file where you expected to find the answer but didn't.

## Engineering Principles

### YAGNI (You Aren't Gonna Need It)

- Implement only what is required by the current task and its tests.
- No speculative abstractions, no "future-proofing" without a concrete requirement.
- If it's not tested, it's not needed.

### Readability

- Code is read far more often than it is written. Optimize for clarity.
- Prefer explicit over clever. Name things for what they do, not how they work.
- Keep functions short and focused (single responsibility).
- Use meaningful variable names — no abbreviations unless domain-standard.

### Reusability

- Extract shared logic into well-typed utility functions or hooks.
- Server: reusable middleware, service classes, typed route handlers.
- Client: reusable components with props interfaces, custom hooks for shared state logic.
- Never duplicate logic across workspaces — if shared, consider a shared types file or move to common utilities.

### Maintainability

- Minimize coupling between modules. Depend on interfaces, not implementations.
- Keep side effects at the edges (route handlers, event listeners). Core logic should be pure and testable.
- Every public function/component should have a clear contract (input types, output types, errors thrown).

### Testability

- Design code so it can be tested in isolation.
- Use dependency injection where possible (pass dependencies as parameters).
- Avoid global state. Avoid singletons unless explicitly required.
- Side-effectful code (DB calls, HTTP requests) belongs in thin adapter layers that are easy to mock.

## Type Documentation

- All functions must have explicit parameter types and return types.
- All component props must have a named interface (not inline types).
- Prefer `interface` for object shapes, `type` for unions/intersections/utilities.
- Export types that are part of a module's public contract.
- Use JSDoc comments for complex business logic explaining *why*, not *what*.

```typescript
/** Props for the DisputeCard component. */
interface DisputeCardProps {
  /** The dispute summary to display. */
  dispute: DisputeSummary;
  /** Called when the user selects this dispute for detail view. */
  onSelect: (disputeId: number) => void;
}
```

## OpenAPI Specification

When building API endpoints:
- Define the API contract (request/response shapes) as TypeScript types FIRST.
- Write tests against those types BEFORE implementing the route handler.
- The OpenAPI spec in `docs/openapi.yaml` is the source of truth for API consumers. Keep it in sync with implementation.
- Use descriptive operation IDs, request/response examples, and error schemas.

## Code Style

These are enforced by tooling — follow them without overriding:

| Rule | Value |
|------|-------|
| Semicolons | Yes |
| Quotes | Single |
| Trailing commas | ES5 |
| Print width | 100 characters |
| Tab width | 2 spaces |
| Unused vars | Error (prefix with `_` to intentionally ignore) |

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Files (components) | PascalCase | `DisputeCard.tsx` |
| Files (utilities) | camelCase | `triageEngine.ts` |
| Files (tests) | match source + `.test` | `triageEngine.test.ts` |
| Interfaces/Types | PascalCase | `DisputeDetail`, `RuleTrace` |
| Functions/variables | camelCase | `evaluateTriage`, `isTerminalState` |
| Constants | UPPER_SNAKE_CASE | `AMOUNT_THRESHOLD`, `AGE_THRESHOLD_HOURS` |
| CSS classes | Tailwind utilities | No custom class names unless extracted via `@apply` |

### Import Order

1. Node built-ins / framework (`react`, `express`)
2. Third-party libraries (`@prisma/client`, `cors`)
3. Internal absolute paths / aliases
4. Relative imports (parent, then sibling, then child)

## Component Patterns (Client)

```typescript
// Reusable, typed, testable
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

function Button({ label, onClick, variant = 'primary', disabled = false }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={variant === 'primary' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'}
      data-testid={`button-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {label}
    </button>
  );
}
```

- Always include `data-testid` for Playwright selectors.
- Keep components presentational where possible — push logic into hooks.
- Props interface is always a named export above the component.

## Route Handler Patterns (Server)

```typescript
// Thin handler — delegates to service layer
apiRouter.get('/resource/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await resourceService.getById(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});
```

- Handlers are thin: validate input, call service, return response.
- Business logic lives in service modules (pure functions where possible).
- Use the `AppError` interface from `middleware/errorHandler.ts` for typed errors.
- Always call `next(error)` — never swallow errors silently.

## Permissions

### Allowed without prompting
- Reading any source file
- Running lint, type-check, or tests on specific files
- Writing test files (part of TDD cycle)
- Writing implementation code that makes a failing test pass
- Refactoring code while tests remain green

### Require user confirmation
- Adding new dependencies (`npm install`)
- Modifying `package.json` scripts
- Changing database schema (`schema.prisma`)
- Deleting files or directories
- Modifying shared TypeScript config (`tsconfig.json`)
- Running full E2E test suite
- Git operations (`commit`, `push`)

## Good Examples (follow these patterns)

- Error handling: `server/src/middleware/errorHandler.ts`
- Route structure: `server/src/routes/api.ts`
- Component with data-testid: `client/src/App.tsx`
- Component test with Testing Library: `client/tests/App.test.tsx`
- E2E test (user flow): `client/e2e/sample.spec.ts`
- Test setup with mocking: `client/tests/setup.ts`

## Avoid

- `any` types — always provide explicit types
- Inline styles — use Tailwind utilities
- Business logic in route handlers — extract to services
- Tests that test implementation details — test behavior and outcomes
- Speculative code that isn't demanded by a test
- Hardcoded values — use constants or environment variables
- Mutating shared state — prefer immutable patterns
