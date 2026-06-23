---
name: validate-docs
description: >
  Validate the structure and EARS compliance of all specification documents in docs/.
  Use this skill when the user asks to validate docs, check spec compliance, verify
  EARS format, audit documentation structure, or lint specification files. Also use
  when the user mentions "validate specs", "check docs format", "EARS compliance",
  or "doc structure check".
---

# Validate Documentation Structure & EARS Compliance

This skill runs a validation script against all specification documents in `docs/` to verify
they conform to the project's required templates and EARS (Easy Approach to Requirements Syntax) format.

## What It Validates

The script checks five document types, each against its specific template:

| Document | Template Checks |
|----------|-----------------|
| `requirements.md` | EARS pattern classification, keyword compliance, vague language detection, combined behaviour detection, testability check, REQ-XXX numbering, functional area grouping |
| `test-cases.md` | GIVEN/WHEN/THEN structure, TC-XXX numbering, traceability section |
| `api-spec.md` | METHOD PATH headings, Request body/Success response/Error responses/Example sections |
| `ui-spec.md` | Screen sections with Purpose/Layout/Data displayed/Interactions/States |
| `architecture.md` | Components/Data Model/Integrations/Key Decisions sections |

### EARS Pattern Classification

Each requirement is classified into one of six EARS patterns:

| Pattern | Keyword | Use When |
|---------|---------|----------|
| **Ubiquitous** | `The system shall [action].` | Requirement always applies |
| **Event-driven** | `When [trigger], the system shall [action].` | Something happens that triggers behaviour |
| **State-driven** | `While [state], the system shall [behaviour].` | Behaviour depends on system state |
| **Optional** | `Where [condition], the system shall [action].` | Feature may or may not be present |
| **Unwanted** | `If [condition], then the system shall [action].` | Handling error/edge cases |
| **Complex** | `While [state], when [trigger], the system shall [action].` | Combines state + event |

### Quality Tips Enforced

- **One requirement per statement** — detects multiple "shall" in a single REQ (WARN)
- **No vague language** — flags words like "quickly", "user-friendly", "robust", "seamless", "modern", "efficient" (FAIL)
- **Testability** — flags hedging language like "may", "might", "could", "if appropriate" (WARN)
- **Specific quantities** — all requirements must be concrete and measurable

## How to Run

Execute the validation script from the project root:

```bash
node .kiro/skills/validate-docs/scripts/validate-docs.mjs
```

The script exits with code 0 if all checks pass, or code 1 if any violations are found.

## Output Format

The script outputs a structured report:

```
=== Documentation Validation Report ===

--- requirements.md ---
[PASS] Has EARS patterns reference section
[PASS] All requirements use REQ-XXX format (found 61)
[FAIL] REQ-042: Missing EARS keyword (When/While/Where/If/The system shall)
       Line: "REQ-042: Assign priority P1 and recommendation..."
       Fix: Prefix with an EARS keyword, e.g., "Where both R1 and R2 are true, the system shall..."

--- test-cases.md ---
[PASS] All test cases use TC-XXX format (found 21)
[PASS] All test cases have GIVEN/WHEN/THEN structure
...

=== Summary ===
requirements.md: 12 checks, 11 passed, 1 failed
test-cases.md:   8 checks, 8 passed, 0 failed
api-spec.md:     10 checks, 10 passed, 0 failed
ui-spec.md:      8 checks, 8 passed, 0 failed
architecture.md: 6 checks, 6 passed, 0 failed

Overall: 44 checks, 43 passed, 1 failed
```

## Interpreting Results

- **PASS** — The check succeeded. The document conforms to the template for that rule.
- **FAIL** — A violation was found. The output includes the specific line or section and a suggested fix.
- **WARN** — A soft recommendation (not a hard failure). The structure is acceptable but could be improved.

## When to Re-Run

Run this skill:
- After editing any document in `docs/`
- Before committing changes to specification files
- When adding new requirements, test cases, or API endpoints
- As part of a pre-PR documentation review
