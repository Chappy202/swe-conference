# Candidate use cases — starting briefs

These are **priming briefs**, not specs. Pick one at the start of Day 1, then run `/start-spec-pack` — the interview skills turn the brief into the real, validated spec pack (`requirements.md`, `test-cases.md`, `api-spec.md`, `ui-spec.md`, `architecture.md`). Treat the sketches below as *something to react to and refine*, not as decisions already made. The default steering (`product.md`) is written for Use Case 2.

---

## Use Case 2 — Squad Assembly (recommended default)

**Journey.** A delivery lead captures a delivery need (required skills, urgency, expected duration); the system returns a ranked shortlist of internal candidates with a transparent, rule-based reason for each rank; the lead selects a squad.

**Why it's a good lab target.** One clean journey, obvious rules, a satisfying explainable-ranking payoff, and it fits the locked stack with mock data.

**Starting sketch to react to (the team owns the final numbers).**
- *Entities:* Employee (role, business unit, availability band, current allocation %), Skill, EmployeeSkill (proficiency), WorkRequest (required skills + weights, urgency, duration). Candidate score is **derived**, never stored.
- *A possible scoring rubric:* skill match (say 0–50) + availability (0–30 from a band) + role alignment (0 or 20) − workload penalty (capped). Tie-break by total, then skill match, then name. **This is a strawman — the requirements interview should pin down the real weights and bands with the Feature Analyst.**
- *Seed:* one business unit, ~20–40 people chosen to exercise the rules (strong/partial/no match; free vs busy).

---

## Use Case 1 — Dispute Triage

**Journey.** A banking ops user captures a customer payment dispute (payment type, issue category, amount, transaction status, age); the system returns a recommended next action — Resolve, Investigate, Escalate, or Refer — with a transparent rule trace.

**Starting sketch to react to.**
- *Entities:* Customer, Transaction, Dispute (payment type, category, amount, status, age, derived recommendation).
- *A possible rule set:* e.g. high amount → Escalate; suspected fraud category → Refer; clear duplicate within window → Resolve; otherwise → Investigate. **Strawman only — the team defines the real thresholds and precedence.**
- *Seed:* a small set of payment types and disputes that trigger each outcome at least once.

**If you pick Use Case 1:** before Day 2, update `.kiro/steering/product.md` so its journey, constraints, and NOT-in-scope describe Dispute Triage (the structure is identical — swap the domain specifics). Everything else in the harness is use-case-agnostic.
