import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { validateStatusTransition, isTerminalState, getValidTransitions } from '../src/services/statusTransitions';
import type { DisputeStatus, ResolutionOutcome, TransitionRequest } from '../src/services/statusTransitions';

const ALL_STATUSES: DisputeStatus[] = ['Reported', 'UnderInvestigation', 'Escalated', 'Resolved', 'Referred'];
const ALL_OUTCOMES: ResolutionOutcome[] = ['Refunded', 'Declined', 'ChargebackInitiated'];

const arbitraryDisputeStatus = fc.constantFrom(...ALL_STATUSES);
const arbitraryResolutionOutcome = fc.constantFrom(...ALL_OUTCOMES);

describe('StatusTransitions Property Tests', () => {
  it('Property 1: Reflexivity Forbidden - no status transitions to itself', () => {
    fc.assert(
      fc.property(arbitraryDisputeStatus, (s) => {
        const result = validateStatusTransition({ currentStatus: s, targetStatus: s });
        expect(result.valid).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('Property 2: No Backward Transitions - if A->B valid, B->A is invalid', () => {
    fc.assert(
      fc.property(arbitraryDisputeStatus, arbitraryDisputeStatus, arbitraryResolutionOutcome, (a, b, outcome) => {
        const forward = validateStatusTransition({ currentStatus: a, targetStatus: b, resolutionOutcome: b === 'Resolved' ? outcome : undefined });
        if (forward.valid) {
          const reverse = validateStatusTransition({ currentStatus: b, targetStatus: a });
          expect(reverse.valid).toBe(false);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('Property 3: Terminal Completeness - terminal states reject all, non-terminal have valid transitions', () => {
    fc.assert(
      fc.property(arbitraryDisputeStatus, arbitraryDisputeStatus, (s, t) => {
        if (isTerminalState(s)) {
          const result = validateStatusTransition({ currentStatus: s, targetStatus: t });
          expect(result.valid).toBe(false);
          // Resolution outcome guard fires before FSM lookup per design
          if (t === 'Resolved') {
            expect(result.errorCode).toBe('MISSING_RESOLUTION_OUTCOME');
          } else {
            expect(result.errorCode).toBe('INVALID_STATUS_TRANSITION');
          }
        }
      }),
      { numRuns: 100 }
    );

    for (const s of ALL_STATUSES) {
      if (!isTerminalState(s)) {
        expect(getValidTransitions(s).length).toBeGreaterThan(0);
      }
    }
  });

  it('Property 4: Invalid Transition Error Content - errorMessage contains both statuses', () => {
    fc.assert(
      fc.property(arbitraryDisputeStatus, arbitraryDisputeStatus, (current, target) => {
        const result = validateStatusTransition({ currentStatus: current, targetStatus: target, resolutionOutcome: target === 'Resolved' ? 'Refunded' : undefined });
        if (!result.valid && result.errorCode === 'INVALID_STATUS_TRANSITION') {
          expect(result.errorMessage).toBeDefined();
          expect(result.errorMessage).toContain(current);
          expect(result.errorMessage).toContain(target);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('Property 5: Resolution Outcome Guard - Resolved without outcome is MISSING_RESOLUTION_OUTCOME', () => {
    const statusesThatCanResolve = fc.constantFrom(
      'UnderInvestigation' as DisputeStatus,
      'Escalated' as DisputeStatus
    );
    fc.assert(
      fc.property(statusesThatCanResolve, (s) => {
        const result = validateStatusTransition({ currentStatus: s, targetStatus: 'Resolved' });
        expect(result.valid).toBe(false);
        expect(result.errorCode).toBe('MISSING_RESOLUTION_OUTCOME');
        expect(result.errorMessage).toBeDefined();
      }),
      { numRuns: 100 }
    );
  });

  it('Property 6: Outcome Does Not Override FSM - outcome cannot make invalid transition valid', () => {
    fc.assert(
      fc.property(arbitraryDisputeStatus, arbitraryDisputeStatus, arbitraryResolutionOutcome, (current, target, outcome) => {
        const allowed = getValidTransitions(current);
        if (!allowed.includes(target)) {
          const result = validateStatusTransition({ currentStatus: current, targetStatus: target, resolutionOutcome: outcome });
          expect(result.valid).toBe(false);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('Property 7: Determinism - same input always produces same output', () => {
    fc.assert(
      fc.property(arbitraryDisputeStatus, arbitraryDisputeStatus, fc.option(arbitraryResolutionOutcome), (current, target, outcome) => {
        const request: TransitionRequest = { currentStatus: current, targetStatus: target, resolutionOutcome: outcome ?? undefined };
        const r1 = validateStatusTransition(request);
        const r2 = validateStatusTransition(request);
        expect(r1).toEqual(r2);
      }),
      { numRuns: 100 }
    );
  });
});
