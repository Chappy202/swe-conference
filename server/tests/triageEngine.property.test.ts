import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { evaluateTriage } from '../src/services/triageEngine.js';

const MIN_DATE = new Date('2020-01-01').getTime();
const MAX_DATE = new Date('2025-01-01').getTime();

function arbitraryISODate() {
  return fc.integer({ min: MIN_DATE, max: MAX_DATE }).map((t) => new Date(t).toISOString());
}

function arbitraryTransaction(dateRaisedMs: number) {
  return fc.record({
    id: fc.nat(),
    amount: fc.integer({ min: 1, max: 50000 }),
    merchant: fc.string({ minLength: 1, maxLength: 10 }),
    timestamp: fc.integer({ min: MIN_DATE, max: dateRaisedMs }).map((t) => new Date(t).toISOString()),
    paymentType: fc.constantFrom('Card' as const, 'ApplePay' as const, 'EFT' as const),
  });
}

function arbitraryInputs() {
  return arbitraryISODate().chain((dateRaised) => {
    const ms = new Date(dateRaised).getTime();
    return fc.tuple(
      fc.constant(dateRaised),
      fc.array(arbitraryTransaction(ms), { minLength: 1, maxLength: 5 }),
    );
  });
}

describe('TriageEngine Property Tests', () => {
  const fixedDate = '2024-03-15T10:00:00.000Z';
  const fixedDateMs = new Date(fixedDate).getTime();

  it('Property 1: Determinism - same inputs produce same outputs', () => {
    fc.assert(
      fc.property(arbitraryInputs(), ([dateRaised, transactions]) => {
        const r1 = evaluateTriage(dateRaised, transactions);
        const r2 = evaluateTriage(dateRaised, transactions);
        expect(r1.priority).toBe(r2.priority);
        expect(r1.recommendation).toBe(r2.recommendation);
        expect(r1.inputs).toEqual(r2.inputs);
        expect(r1.rules).toEqual(r2.rules);
      }),
    );
  });

  it('Property 2: Rule Trace Completeness - always 2 rules with correct shape', () => {
    fc.assert(
      fc.property(arbitraryInputs(), ([dateRaised, transactions]) => {
        const result = evaluateTriage(dateRaised, transactions);
        expect(result.rules).toHaveLength(2);
        const r1 = result.rules.find((r) => r.rule === 'R1');
        const r2 = result.rules.find((r) => r.rule === 'R2');
        expect(r1).toBeDefined();
        expect(r2).toBeDefined();
        expect(typeof r1!.condition).toBe('string');
        expect(typeof r1!.detail).toBe('string');
        expect(typeof r1!.result).toBe('boolean');
        expect(typeof r2!.condition).toBe('string');
        expect(typeof r2!.detail).toBe('string');
        expect(typeof r2!.result).toBe('boolean');
      }),
    );
  });

  it('Property 3: Decision Matrix Exhaustiveness - R1/R2 maps to exactly one priority/recommendation', () => {
    fc.assert(
      fc.property(arbitraryInputs(), ([dateRaised, transactions]) => {
        const result = evaluateTriage(dateRaised, transactions);
        const r1 = result.rules.find((r) => r.rule === 'R1')!.result;
        const r2 = result.rules.find((r) => r.rule === 'R2')!.result;

        if (r1 && r2) {
          expect(result.priority).toBe('P1');
          expect(result.recommendation).toBe('Immediate Fraud Freeze + P1 High Priority Escalation');
        } else if (r2) {
          expect(result.priority).toBe('P1');
          expect(result.recommendation).toBe('P1 High Priority Escalation');
        } else if (r1) {
          expect(result.priority).toBe('P2');
          expect(result.recommendation).toBe('Immediate Fraud Freeze');
        } else {
          expect(result.priority).toBe('Standard');
          expect(result.recommendation).toBe('Standard Investigation');
        }
      }),
    );
  });

  it('Property 4: Age Monotonicity - if R1 fires, adding younger transaction still fires R1', () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryTransaction(fixedDateMs), { minLength: 1, maxLength: 5 }),
        arbitraryTransaction(fixedDateMs),
        (transactions, extra) => {
          const result = evaluateTriage(fixedDate, transactions);
          const r1 = result.rules.find((r) => r.rule === 'R1')!.result;
          if (!r1) return;

          // Make extra younger than the youngest existing
          const youngestTs = transactions.reduce((max, t) => t.timestamp > max ? t.timestamp : max, transactions[0].timestamp);
          extra.timestamp = new Date(Math.max(new Date(youngestTs).getTime(), new Date(extra.timestamp).getTime())).toISOString();
          const result2 = evaluateTriage(fixedDate, [...transactions, extra]);
          expect(result2.rules.find((r) => r.rule === 'R1')!.result).toBe(true);
        },
      ),
    );
  });

  it('Property 5: Amount Monotonicity - if R2 fires, adding positive amount still fires R2', () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryTransaction(fixedDateMs), { minLength: 1, maxLength: 5 }),
        arbitraryTransaction(fixedDateMs),
        (transactions, extra) => {
          const result = evaluateTriage(fixedDate, transactions);
          const r2 = result.rules.find((r) => r.rule === 'R2')!.result;
          if (!r2) return;

          extra.amount = Math.abs(extra.amount) + 1;
          const result2 = evaluateTriage(fixedDate, [...transactions, extra]);
          expect(result2.rules.find((r) => r.rule === 'R2')!.result).toBe(true);
        },
      ),
    );
  });

  it('Property 6: Total Amount Consistency - inputs.totalAmount equals sum of amounts', () => {
    fc.assert(
      fc.property(arbitraryInputs(), ([dateRaised, transactions]) => {
        const result = evaluateTriage(dateRaised, transactions);
        const expectedTotal = transactions.reduce((sum, t) => sum + t.amount, 0);
        expect(result.inputs.totalAmount).toBeCloseTo(expectedTotal, 5);
      }),
    );
  });
});
