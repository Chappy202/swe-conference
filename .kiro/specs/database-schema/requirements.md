# Requirements Document

## Introduction

Set up the foundational database schema for the Dispute Triage System using Prisma 5 with SQLite. This feature replaces the placeholder User model with the domain entities (Customer, Dispute, Transaction) and provides a comprehensive seed script that exercises all triage rule combinations defined in the product requirements.

## Glossary

- **Schema**: The Prisma 5 schema file (`server/prisma/schema.prisma`) defining database models, relations, and provider configuration.
- **Seed_Script**: A TypeScript script (`server/prisma/seed.ts`) that populates the database with initial data for development and testing.
- **Customer**: A pre-seeded entity representing a banking customer who may raise disputes.
- **Dispute**: A case entity representing a customer's claim of unauthorised or fraudulent charges, tracking status, priority, and triage results.
- **Transaction**: A financial transaction record linked to a Dispute, representing an individual charge the customer is disputing.
- **Triage_Rule**: A deterministic condition evaluated against dispute data to derive priority and recommendation. Two rules exist: age rule (transaction < 48 hours) and amount rule (total > R10,000).
- **Rule_Trace**: A JSON-serialized string recording which triage rules fired and the data that triggered them.
- **Priority**: A derived label (P1, P2, Standard) assigned by triage rules, stored as a string.
- **Status**: The lifecycle state of a Dispute (Reported, UnderInvestigation, Escalated, Resolved, Referred), stored as a string.
- **Payment_Type**: The method of payment for a transaction (Card, ApplePay, EFT), stored as a string.
- **Resolution_Outcome**: The final outcome when a dispute is resolved (Refunded, Declined, ChargebackInitiated), stored as a nullable string.

## Requirements

### Requirement 1: Schema Provider Configuration

**User Story:** As a developer, I want the Prisma schema configured for SQLite with auto-generated client, so that the prototype database works without external infrastructure.

#### Acceptance Criteria

1. THE Schema SHALL use `sqlite` as the datasource provider.
2. THE Schema SHALL reference the `DATABASE_URL` environment variable for the database connection string.
3. THE Schema SHALL configure the `prisma-client-js` generator.

### Requirement 2: Remove Placeholder Model

**User Story:** As a developer, I want the placeholder User model removed, so that the schema reflects only domain entities.

#### Acceptance Criteria

1. THE Schema SHALL NOT contain a User model.
2. WHEN the migration is applied, THE Schema SHALL contain only Customer, Dispute, and Transaction models.

### Requirement 3: Customer Model Definition

**User Story:** As a developer, I want a Customer model defined, so that pre-seeded customer data can be stored and referenced by disputes.

#### Acceptance Criteria

1. THE Schema SHALL define a Customer model with an `id` field of type Int, serving as the primary key with autoincrement.
2. THE Schema SHALL define a Customer model with a `name` field of type String storing the customer full name.
3. THE Schema SHALL define a Customer model with a `contactReference` field of type String storing a phone number or email address.
4. THE Schema SHALL define a Customer model with an `accountIdentifier` field of type String storing a bank account number or card reference.
5. THE Schema SHALL define a Customer model with a `createdAt` field of type DateTime defaulting to the current timestamp.
6. THE Schema SHALL define a one-to-many relation from Customer to Dispute.

### Requirement 4: Dispute Model Definition

**User Story:** As a developer, I want a Dispute model defined, so that dispute cases can be stored with all required fields for triage, status tracking, and resolution.

#### Acceptance Criteria

1. THE Schema SHALL define a Dispute model with an `id` field of type Int, serving as the primary key with autoincrement.
2. THE Schema SHALL define a Dispute model with a `customerId` field as a required foreign key referencing Customer.
3. THE Schema SHALL define a Dispute model with a `status` field of type String storing one of: Reported, UnderInvestigation, Escalated, Resolved, Referred.
4. THE Schema SHALL define a Dispute model with a `category` field of type String storing the dispute category.
5. THE Schema SHALL define a Dispute model with a `totalAmount` field of type Float storing the sum of linked transaction amounts in ZAR.
6. THE Schema SHALL define a Dispute model with a `dateRaised` field of type DateTime recording when the dispute was created.
7. THE Schema SHALL define a Dispute model with a `priority` field of type String storing one of: P1, P2, Standard.
8. THE Schema SHALL define a Dispute model with a `recommendation` field of type String storing the triage recommendation text.
9. THE Schema SHALL define a Dispute model with a `ruleTrace` field of type String storing a JSON-serialized trace of which rules fired.
10. THE Schema SHALL define a Dispute model with a `resolutionOutcome` field of type String that is nullable, storing one of: Refunded, Declined, ChargebackInitiated.
11. THE Schema SHALL define a Dispute model with a `createdAt` field of type DateTime defaulting to the current timestamp.
12. THE Schema SHALL define a Dispute model with an `updatedAt` field of type DateTime that updates automatically on modification.
13. THE Schema SHALL define a one-to-many relation from Dispute to Transaction.

### Requirement 5: Transaction Model Definition

**User Story:** As a developer, I want a Transaction model defined, so that individual disputed charges can be recorded and linked to their parent dispute.

#### Acceptance Criteria

1. THE Schema SHALL define a Transaction model with an `id` field of type Int, serving as the primary key with autoincrement.
2. THE Schema SHALL define a Transaction model with a `disputeId` field as a required foreign key referencing Dispute.
3. THE Schema SHALL define a Transaction model with an `amount` field of type Float storing the transaction amount in ZAR.
4. THE Schema SHALL define a Transaction model with a `merchant` field of type String storing the merchant name.
5. THE Schema SHALL define a Transaction model with a `timestamp` field of type DateTime recording when the transaction occurred.
6. THE Schema SHALL define a Transaction model with a `paymentType` field of type String storing one of: Card, ApplePay, EFT.
7. THE Schema SHALL define a Transaction model with a `createdAt` field of type DateTime defaulting to the current timestamp.

### Requirement 6: Seed Script — Customer Data

**User Story:** As a developer, I want pre-seeded customers with South African names, so that the prototype has realistic test data.

#### Acceptance Criteria

1. THE Seed_Script SHALL create between 3 and 5 Customer records.
2. THE Seed_Script SHALL use South African names for Customer name fields.
3. THE Seed_Script SHALL populate contactReference and accountIdentifier fields with realistic placeholder values for each Customer.

### Requirement 7: Seed Script — Triage Rule Coverage

**User Story:** As a developer, I want seed data covering all triage rule combinations, so that every priority path can be demonstrated and tested.

#### Acceptance Criteria

1. THE Seed_Script SHALL create a dispute (Case A) where at least one transaction timestamp is less than 48 hours before dateRaised AND the total amount exceeds R10,000, resulting in P1 priority.
2. THE Seed_Script SHALL create a dispute (Case B) where all transaction timestamps are 48 hours or more before dateRaised AND the total amount exceeds R10,000, resulting in P1 priority.
3. THE Seed_Script SHALL create a dispute (Case C) where at least one transaction timestamp is less than 48 hours before dateRaised AND the total amount is R10,000 or less, resulting in P2 priority.
4. THE Seed_Script SHALL create a dispute (Case D) where all transaction timestamps are 48 hours or more before dateRaised AND the total amount is R10,000 or less, resulting in Standard priority.
5. THE Seed_Script SHALL create a dispute (Case E) with multiple transactions from a single fraud event, representing the anchor user story.

### Requirement 8: Seed Script — Timestamps and Statuses

**User Story:** As a developer, I want seed data with relative timestamps and varied statuses, so that the data remains valid over time and exercises multiple lifecycle states.

#### Acceptance Criteria

1. THE Seed_Script SHALL use relative timestamps calculated from the current execution time using offsets, rather than hardcoded absolute dates.
2. THE Seed_Script SHALL create disputes with varied status values across the seeded records, including at least Reported, UnderInvestigation, and Resolved.
3. WHEN a seeded dispute has status Resolved, THE Seed_Script SHALL assign a resolutionOutcome value.

### Requirement 9: Seed Script — Data Integrity

**User Story:** As a developer, I want the seed script to produce consistent, valid data, so that the application functions correctly with seeded records.

#### Acceptance Criteria

1. THE Seed_Script SHALL set each dispute totalAmount equal to the sum of its linked transaction amounts.
2. THE Seed_Script SHALL set the category field to "Unauthorised/Fraudulent Charge" for all seeded disputes.
3. THE Seed_Script SHALL populate the ruleTrace field with a valid JSON string for each seeded dispute.
4. THE Seed_Script SHALL populate the recommendation field with the appropriate triage recommendation text matching the derived priority for each seeded dispute.
5. THE Seed_Script SHALL be idempotent by clearing existing data before inserting seed records.
