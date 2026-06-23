import { describe, it, expect } from 'vitest';
import { validateStatusTransition } from '../src/services/statusTransitions.js';

type DisputeStatus = 'Reported' | 'UnderInvestigation' | 'Escalated' | 'Resolved' | 'Referred';
type ResolutionOutcome = 'Refunded' | 'Declined' | 'ChargebackInitiated';

interface TransitionRequest {
  currentStatus: DisputeStatus;
  targetStatus: DisputeStatus;
  resolutionOutcome?: ResolutionOutcome;
}

describe('StatusTransitions', () => {
  describe('valid transitions', () => {
    describe('TC-007: Reported → UnderInvestigation', () => {
      it('should allow transition from Reported to UnderInvestigation', () => {
        const request: TransitionRequest = {
          currentStatus: 'Reported',
          targetStatus: 'UnderInvestigation',
        };

        const result = validateStatusTransition(request);

        expect(result.valid).toBe(true);
        expect(result.errorCode).toBeUndefined();
        expect(result.errorMessage).toBeUndefined();
      });
    });

    describe('TC-008: UnderInvestigation → Resolved with outcome', () => {
      it('should allow transition with resolutionOutcome "Refunded"', () => {
        const request: TransitionRequest = {
          currentStatus: 'UnderInvestigation',
          targetStatus: 'Resolved',
          resolutionOutcome: 'Refunded',
        };

        const result = validateStatusTransition(request);

        expect(result.valid).toBe(true);
        expect(result.errorCode).toBeUndefined();
        expect(result.errorMessage).toBeUndefined();
      });
    });

    describe('when transitioning UnderInvestigation → Escalated', () => {
      it('should allow the transition', () => {
        const request: TransitionRequest = {
          currentStatus: 'UnderInvestigation',
          targetStatus: 'Escalated',
        };

        const result = validateStatusTransition(request);

        expect(result.valid).toBe(true);
        expect(result.errorCode).toBeUndefined();
      });
    });

    describe('when transitioning UnderInvestigation → Referred', () => {
      it('should allow the transition', () => {
        const request: TransitionRequest = {
          currentStatus: 'UnderInvestigation',
          targetStatus: 'Referred',
        };

        const result = validateStatusTransition(request);

        expect(result.valid).toBe(true);
        expect(result.errorCode).toBeUndefined();
      });
    });

    describe('when transitioning Escalated → Resolved with outcome', () => {
      it('should allow resolution with "Declined" outcome', () => {
        const request: TransitionRequest = {
          currentStatus: 'Escalated',
          targetStatus: 'Resolved',
          resolutionOutcome: 'Declined',
        };

        const result = validateStatusTransition(request);

        expect(result.valid).toBe(true);
        expect(result.errorCode).toBeUndefined();
      });

      it('should allow resolution with "ChargebackInitiated" outcome', () => {
        const request: TransitionRequest = {
          currentStatus: 'Escalated',
          targetStatus: 'Resolved',
          resolutionOutcome: 'ChargebackInitiated',
        };

        const result = validateStatusTransition(request);

        expect(result.valid).toBe(true);
        expect(result.errorCode).toBeUndefined();
      });
    });
  });

  describe('invalid transitions', () => {
    describe('TC-009: Reported → Resolved (skips steps)', () => {
      it('should reject transition that skips required steps', () => {
        const request: TransitionRequest = {
          currentStatus: 'Reported',
          targetStatus: 'Resolved',
          resolutionOutcome: 'Refunded',
        };

        const result = validateStatusTransition(request);

        expect(result.valid).toBe(false);
        expect(result.errorCode).toBe('INVALID_STATUS_TRANSITION');
        expect(result.errorMessage).toBeDefined();
        expect(result.errorMessage).toContain('Reported');
        expect(result.errorMessage).toContain('Resolved');
      });
    });

    describe('TC-010: UnderInvestigation → Resolved without outcome', () => {
      it('should reject resolution without resolutionOutcome', () => {
        const request: TransitionRequest = {
          currentStatus: 'UnderInvestigation',
          targetStatus: 'Resolved',
        };

        const result = validateStatusTransition(request);

        expect(result.valid).toBe(false);
        expect(result.errorCode).toBe('MISSING_RESOLUTION_OUTCOME');
        expect(result.errorMessage).toBeDefined();
      });
    });

    describe('TC-011: Resolved → any state (terminal)', () => {
      it('should reject any transition from Resolved', () => {
        const targetStatuses: DisputeStatus[] = [
          'Reported',
          'UnderInvestigation',
          'Escalated',
          'Referred',
        ];

        for (const targetStatus of targetStatuses) {
          const request: TransitionRequest = {
            currentStatus: 'Resolved',
            targetStatus,
          };

          const result = validateStatusTransition(request);

          expect(result.valid).toBe(false);
          expect(result.errorCode).toBe('INVALID_STATUS_TRANSITION');
          expect(result.errorMessage).toBeDefined();
        }
      });
    });

    describe('when transitioning from Referred (terminal state)', () => {
      it('should reject any transition from Referred', () => {
        const targetStatuses: DisputeStatus[] = [
          'Reported',
          'UnderInvestigation',
          'Escalated',
        ];

        for (const targetStatus of targetStatuses) {
          const request: TransitionRequest = {
            currentStatus: 'Referred',
            targetStatus,
          };

          const result = validateStatusTransition(request);

          expect(result.valid).toBe(false);
          expect(result.errorCode).toBe('INVALID_STATUS_TRANSITION');
          expect(result.errorMessage).toBeDefined();
        }
      });

      it('should reject Referred → Resolved without outcome with MISSING_RESOLUTION_OUTCOME', () => {
        const request: TransitionRequest = {
          currentStatus: 'Referred',
          targetStatus: 'Resolved',
        };

        const result = validateStatusTransition(request);

        expect(result.valid).toBe(false);
        expect(result.errorCode).toBe('MISSING_RESOLUTION_OUTCOME');
        expect(result.errorMessage).toBeDefined();
      });

      it('should reject Referred → Resolved with outcome with INVALID_STATUS_TRANSITION', () => {
        const request: TransitionRequest = {
          currentStatus: 'Referred',
          targetStatus: 'Resolved',
          resolutionOutcome: 'Refunded',
        };

        const result = validateStatusTransition(request);

        expect(result.valid).toBe(false);
        expect(result.errorCode).toBe('INVALID_STATUS_TRANSITION');
        expect(result.errorMessage).toBeDefined();
      });
    });

    describe('when transitioning Reported → Escalated (skips investigation)', () => {
      it('should reject the invalid transition', () => {
        const request: TransitionRequest = {
          currentStatus: 'Reported',
          targetStatus: 'Escalated',
        };

        const result = validateStatusTransition(request);

        expect(result.valid).toBe(false);
        expect(result.errorCode).toBe('INVALID_STATUS_TRANSITION');
      });
    });

    describe('when transitioning Escalated → UnderInvestigation (backward)', () => {
      it('should reject backward transitions', () => {
        const request: TransitionRequest = {
          currentStatus: 'Escalated',
          targetStatus: 'UnderInvestigation',
        };

        const result = validateStatusTransition(request);

        expect(result.valid).toBe(false);
        expect(result.errorCode).toBe('INVALID_STATUS_TRANSITION');
      });
    });

    describe('when Escalated → Resolved without outcome', () => {
      it('should reject resolution without resolutionOutcome', () => {
        const request: TransitionRequest = {
          currentStatus: 'Escalated',
          targetStatus: 'Resolved',
        };

        const result = validateStatusTransition(request);

        expect(result.valid).toBe(false);
        expect(result.errorCode).toBe('MISSING_RESOLUTION_OUTCOME');
        expect(result.errorMessage).toBeDefined();
      });
    });
  });
});
