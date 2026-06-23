---
title: API Contract & Route Conventions
inclusion: fileMatch
fileMatchPattern: "server/src/routes/**"
---

# API Contract & Route Conventions

When working on API routes, follow the OpenAPI specification as the source of truth for request/response shapes, status codes, and error formats.

## Key Conventions

- Route handlers are thin: validate input, call service, return response.
- Business logic belongs in `server/src/services/`, not in route handlers.
- Use `next(error)` for all error propagation — never swallow errors.
- Use the `AppError` pattern from `server/src/middleware/errorHandler.ts`.
- Define TypeScript types for request/response shapes FIRST, then implement.

## Error Response Format

All errors follow a consistent envelope:

```json
{
  "error": {
    "code": "MACHINE_READABLE_CODE",
    "message": "Human-readable description.",
    "status": 400,
    "timestamp": "ISO 8601"
  }
}
```

## Valid Error Codes

- `DISPUTE_NOT_FOUND` (404)
- `INVALID_STATUS_TRANSITION` (400)
- `MISSING_RESOLUTION_OUTCOME` (400)
- `DISPUTE_IN_TERMINAL_STATE` (400)
- `VALIDATION_ERROR` (400)

## Full API Specification

#[[file:docs/openapi.yaml]]
