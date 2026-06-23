---
title: Database Schema & Prisma Conventions
inclusion: fileMatch
fileMatchPattern: "server/prisma/**"
---

# Database Schema & Prisma Conventions

When working on the database schema or Prisma-related code, follow these conventions.

## Commands After Schema Changes

```bash
npm run db:generate --workspace=server   # Regenerate Prisma client types
npm run db:migrate --workspace=server    # Create + apply migration
```

Always run both after modifying `schema.prisma`.

## Data Model (Domain Context)

- **Customer** — Pre-seeded. Name, contact reference, account identifier.
- **Dispute** — Status lifecycle (Reported → Under Investigation → Escalated/Resolved/Referred). Holds category, total amount (ZAR), date raised, rule trace JSON, priority, resolution outcome.
- **Transaction** — Belongs to one Dispute. Amount (ZAR), merchant, timestamp, payment type (Card/ApplePay/EFT).

One dispute covers multiple transactions from a single fraud event. The dispute `totalAmount` is the sum of its transactions.

## Conventions

- Use SQLite as the provider (prototype — no production DB).
- All monetary values stored as integers or floats in ZAR.
- Timestamps use ISO 8601 / `DateTime` type.
- Rule trace stored as JSON string (serialized `RuleTrace` object).
- Enum-like fields (Status, Priority, PaymentType, ResolutionOutcome) stored as strings.

## Seed Data Requirements

Seed the database with enough disputes and transactions to exercise:
- A case that triggers Immediate Fraud Freeze (< 48 hours).
- A case that triggers P1 High Priority Escalation (> R10,000).
- A case that triggers both conditions.
- A case that triggers neither (Standard Investigation).
- At least one dispute with multiple transactions from a single event.

## Current Schema

#[[file:server/prisma/schema.prisma]]
