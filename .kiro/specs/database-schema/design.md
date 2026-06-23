# Design Document — Database Schema

## Overview

This design covers the foundational data access layer for the Dispute Triage System. It defines the Prisma 5 schema models (Customer, Dispute, Transaction) with SQLite as the backing store, and a comprehensive seed script that populates development data exercising all triage rule combinations.

This feature sits in the **Data Access Layer** (bottom tier) of the 4-tier architecture and supports all other features by providing the relational data model and initial dataset.

## Architecture

### Layer Placement

```
┌──────────────────────────────────────────────────┐
│  Presentation Layer (React)                      │
├──────────────────────────────────────────────────┤
│  Application / API Surface (Express routes)      │
├──────────────────────────────────────────────────┤
│  Domain Layer (Triage engine, state guard)        │
├──────────────────────────────────────────────────┤
│  Data Access Layer  ◄── THIS FEATURE             │
│  - Prisma ORM schema (models, relations)         │
│  - SQLite database file                          │
│  - Seed script (dev data)                        │
└──────────────────────────────────────────────────┘
```

The schema defines the storage contracts. Upper layers interact with the database exclusively through Prisma Client — never raw SQL.

### File Structure

```
server/
├── prisma/
│   ├── schema.prisma    # Model definitions, relations, provider config
│   └── seed.ts          # Idempotent seed script (TypeScript via tsx)
├── package.json         # prisma.seed configuration
└── .env                 # DATABASE_URL=file:./dev.db
```

## Components and Interfaces

### 1. Prisma Schema (`server/prisma/schema.prisma`)

The schema replaces the placeholder `User` model with three domain entities.

#### Provider Configuration

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

- SQLite chosen for zero-config local development (no running database server).
- `DATABASE_URL` read from environment (`.env` file contains `file:./dev.db`).
- Prisma Client JS generator enables typed query building.

#### Customer Model

```prisma
model Customer {
  id                Int       @id @default(autoincrement())
  name              String
  contactReference  String
  accountIdentifier String
  createdAt         DateTime  @default(now())
  disputes          Dispute[]
}
```

- Pre-seeded entity. No CRUD operations from the UI.
- One-to-many relation: a customer can have multiple disputes.

#### Dispute Model

```prisma
model Dispute {
  id                Int           @id @default(autoincrement())
  customerId        Int
  customer          Customer      @relation(fields: [customerId], references: [id])
  status            String        // Reported | UnderInvestigation | Escalated | Resolved | Referred
  category          String        // Always "Unauthorised/Fraudulent Charge"
  totalAmount       Float         // Sum of linked transaction amounts (ZAR)
  dateRaised        DateTime      // Reference point for age calculations
  priority          String        // P1 | P2 | Standard
  recommendation    String        // Triage recommendation text
  ruleTrace         String        // JSON-serialized RuleTrace object
  resolutionOutcome String?       // Refunded | Declined | ChargebackInitiated (nullable)
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  transactions      Transaction[]
}
```

- `status`, `priority`, `resolutionOutcome`, and `category` stored as strings (SQLite has no native enum support).
- `totalAmount` is a derived value — always kept in sync with the sum of transaction amounts.
- `ruleTrace` stores the structured trace as a JSON string. The API layer parses it before responding to the client.
- `resolutionOutcome` is nullable — only populated when status transitions to `Resolved`.
- `@updatedAt` automatically tracks modification time.

#### Transaction Model

```prisma
model Transaction {
  id          Int      @id @default(autoincrement())
  disputeId   Int
  dispute     Dispute  @relation(fields: [disputeId], references: [id])
  amount      Float    // Individual transaction amount (ZAR)
  merchant    String   // Merchant name
  timestamp   DateTime // When the transaction occurred
  paymentType String   // Card | ApplePay | EFT
  createdAt   DateTime @default(now())
}
```

- Belongs to exactly one dispute (many-to-one).
- `paymentType` stored as string to avoid SQLite enum limitation.
- `timestamp` is the original transaction time used for age calculations.

### 2. Seed Script (`server/prisma/seed.ts`)

#### Design Decisions

| Decision | Rationale |
|----------|-----------|
| Relative timestamps (`Date.now() - offset`) | Keeps 48-hour rule exercisable across demo sessions |
| Idempotent (deletes before insert) | Safe to re-run without duplicates |
| Delete order: Transaction → Dispute → Customer | Respects foreign key constraints |
| Covers all 4 triage combinations | Exercises every path through the rule matrix |
| South African names | Matches the ZAR currency context |

#### Execution Flow

```
1. Clear existing data (Transaction → Dispute → Customer)
2. Create 3-5 Customer records
3. Create Case A dispute: Both rules fire (< 48h + > R10,000 → P1)
4. Create Case B dispute: Amount only (>= 48h + > R10,000 → P1)
5. Create Case C dispute: Age only (< 48h + <= R10,000 → P2)
6. Create Case D dispute: Neither rule (>= 48h + <= R10,000 → Standard)
7. Create Case E dispute: Multi-transaction anchor story
```

#### Timestamp Strategy

```typescript
const NOW = Date.now();
const HOUR = 60 * 60 * 1000;

// Case A/C: Transaction within 48 hours
const recentTimestamp = new Date(NOW - 24 * HOUR);

// Case B/D: Transaction older than 48 hours
const oldTimestamp = new Date(NOW - 72 * HOUR);

// dateRaised relative to NOW
const dateRaised = new Date(NOW - 1 * HOUR);
```

Each dispute's `dateRaised` is calculated relative to `Date.now()` at seed time, and transaction timestamps are offset to produce the desired age relationship (`dateRaised - transaction.timestamp`).

#### Rule Trace Template

Each seeded dispute includes a pre-computed `ruleTrace` JSON string matching the structure:

```typescript
interface RuleTrace {
  evaluatedAt: string;       // ISO 8601 timestamp
  inputs: {
    youngestTransactionAge: string;  // e.g., "24 hours"
    totalAmount: number;             // e.g., 16500
  };
  rules: Array<{
    rule: string;            // "R1" or "R2"
    condition: string;       // Human-readable condition
    result: boolean;         // Whether the rule fired
    detail: string;          // Specific data point
  }>;
  recommendation: string;    // Full recommendation text
  priority: string;          // "P1" | "P2" | "Standard"
}
```

#### Recommendation Matrix (used in seed)

| Priority | Recommendation Text |
|----------|-------------------|
| P1 (both rules) | "Immediate Fraud Freeze + P1 High Priority Escalation" |
| P1 (amount only) | "P1 High Priority Escalation" |
| P2 (age only) | "Immediate Fraud Freeze" |
| Standard | "Standard Investigation" |

### 3. Package Configuration (`server/package.json`)

The seed script is registered in `server/package.json`:

```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

This allows running via `npx prisma db seed` from the server directory.

## Data Models

```
Customer (1) ───── (0..*) Dispute (1) ───── (1..*) Transaction
```

- A Customer has zero or more Disputes.
- A Dispute has one or more Transactions.
- Cascading behavior is handled at the application layer (seed script deletion order).

### 4. Prisma Client Generated Types

After running `npm run db:generate --workspace=server`, Prisma generates typed interfaces:

```typescript
// Auto-generated by Prisma — consumed by service layer
import { PrismaClient, Customer, Dispute, Transaction } from '@prisma/client';
```

Upper layers use these types for type-safe queries. No raw SQL anywhere in the codebase.

### 5. Seed Script Interface

```typescript
// server/prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  // 1. Clear data (respecting FK order)
  await prisma.transaction.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.customer.deleteMany();

  // 2. Seed customers
  // 3. Seed disputes with transactions (nested create)
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

## Error Handling

| Scenario | Handling |
|----------|----------|
| Missing `DATABASE_URL` | Prisma throws at client instantiation with a clear error message |
| Schema migration conflict | `npx prisma migrate dev` prompts for resolution |
| Foreign key violation during seed | Deletion order (Transaction → Dispute → Customer) prevents FK errors |
| Seed script failure | Exits with code 1 and logs error to stderr |
| Duplicate seed run | Idempotent — clears all data first, produces consistent state |

## Constraints and Invariants

1. **Referential Integrity**: Every `Dispute.customerId` references a valid Customer. Every `Transaction.disputeId` references a valid Dispute.
2. **Amount Consistency**: `Dispute.totalAmount` must equal `SUM(transactions.amount)` for all linked transactions.
3. **Category Fixed**: All disputes have `category = "Unauthorised/Fraudulent Charge"`.
4. **Resolution Coupling**: `resolutionOutcome` is non-null if and only if `status = "Resolved"`.
5. **Valid Enum Values**: Status, Priority, PaymentType, and ResolutionOutcome fields must contain only their defined string values.

## Testing Strategy

### Unit Tests (Vitest)

- **Seed data validation**: Verify that after running the seed script, all database records satisfy the schema constraints and invariants (referential integrity, amount consistency, valid enum values).
- **Rule trace structure**: Validate that each seeded dispute's `ruleTrace` field deserializes into the expected `RuleTrace` interface shape with all required keys.
- **Recommendation matrix mapping**: Test that each priority/rule combination maps to the correct recommendation text.
- **Timestamp strategy**: Verify that seed-generated timestamps produce the intended age relationships relative to `dateRaised`.

### Property-Based Tests (Vitest + fast-check)

- **Total amount integrity** (Property 1): For any seeded dispute, assert `totalAmount === sum(transactions.amount)`.
- **Category consistency** (Property 2): For any seeded dispute, assert `category === "Unauthorised/Fraudulent Charge"`.
- **Rule trace validity** (Property 3): For any seeded dispute, assert `JSON.parse(ruleTrace)` contains all required keys.
- **Priority-recommendation alignment** (Property 4): For any generated priority + rule combination, assert the recommendation matches the triage matrix.
- **Resolution outcome completeness** (Property 5): For any dispute with `status === "Resolved"`, assert `resolutionOutcome` is one of the valid values.
- **Triage rule coverage** (Property 6): After seeding, assert the dataset contains at least one dispute per triage rule combination.

### Integration Tests

- **Migration lifecycle**: Run `prisma migrate dev` on a fresh database and verify all models are created without errors.
- **Seed idempotency**: Run the seed script twice consecutively and confirm the database contains the same number of records (no duplicates).
- **Foreign key enforcement**: Attempt to create a dispute with an invalid `customerId` and confirm the operation is rejected.

### Test Execution

```bash
# Run server-side unit and property tests
npm run test --workspace=server

# Run a specific test file
npm run test --workspace=server -- tests/seedValidation.test.ts

# Run with coverage
npm run test --workspace=server -- --coverage
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Total Amount Integrity

For any seeded dispute, the `totalAmount` field shall equal the arithmetic sum of all linked transaction `amount` values.

**Validates: Requirements 9.1**

### Property 2: Category Consistency

For any seeded dispute, the `category` field shall equal the string `"Unauthorised/Fraudulent Charge"`.

**Validates: Requirements 9.2**

### Property 3: Rule Trace Validity

For any seeded dispute, the `ruleTrace` field shall be a valid JSON string that parses without error into an object containing `evaluatedAt`, `inputs`, `rules`, `recommendation`, and `priority` keys.

**Validates: Requirements 9.3**

### Property 4: Priority-Recommendation Alignment

For any seeded dispute, the `recommendation` field shall match the expected recommendation text from the triage matrix given the dispute's `priority` value: P1 with age rule → "Immediate Fraud Freeze + P1 High Priority Escalation", P1 without age rule → "P1 High Priority Escalation", P2 → "Immediate Fraud Freeze", Standard → "Standard Investigation".

**Validates: Requirements 9.4, 7.1, 7.2, 7.3, 7.4**

### Property 5: Resolution Outcome Completeness

For any seeded dispute with `status` equal to `"Resolved"`, the `resolutionOutcome` field shall be non-null and contain one of: "Refunded", "Declined", "ChargebackInitiated".

**Validates: Requirements 8.3**

### Property 6: Triage Rule Coverage

For any execution of the seed script, the resulting dataset shall contain at least one dispute for each of the four triage rule combinations: (age fires + amount fires), (age doesn't fire + amount fires), (age fires + amount doesn't fire), (neither fires) — verified by checking transaction timestamps relative to `dateRaised` and total amounts against the R10,000 threshold.

**Validates: Requirements 7.1, 7.2, 7.3, 7.4**
