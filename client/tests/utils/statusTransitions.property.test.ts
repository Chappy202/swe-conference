import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  VALID_TRANSITIONS,
  getAvailableActions,
  isTerminalStatus,
} from '../../src/utils/statusTransitions';
import type { Status } from '../../src/types/dispute';

const STATUSES: Status[] = ['Reported', 'UnderInvestigation', 'Escalated', 'Resolved', 'Referred'];
const TERMINAL_STATUSES: Status[] = ['Resolved', 'Referred'];

/**
 * Property 1: Action Button Accuracy
 * For any valid status, getAvailableActions returns entries matching VALID_TRANSITIONS[status]
 * exactly — no extra entries, no missing entries, with identical label and testId per entry.
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4
 */
describe('Property 1: Action Button Accuracy', () => {
  it('should return actions matching VALID_TRANSITIONS exactly for any status', () => {
    fc.assert(
      fc.property(fc.constantFrom(...STATUSES), (status) => {
        const actions = getAvailableActions(status);
        const expected = VALID_TRANSITIONS[status];

        // Same number of buttons — no extras, none missing.
        expect(actions).toHaveLength(expected.length);

        // Each entry corresponds exactly (label, testId, targetStatus, style, opensModal).
        actions.forEach((action, index) => {
          expect(action).toEqual(expected[index]);
        });

        // Sets of labels and testIds match exactly.
        expect(actions.map((a) => a.label)).toEqual(expected.map((a) => a.label));
        expect(actions.map((a) => a.testId)).toEqual(expected.map((a) => a.testId));
      })
    );
  });
});

/**
 * Property 2: Terminal State Immutability
 * For any dispute in a terminal status (Resolved or Referred), getAvailableActions returns an
 * empty array (the page renders zero action buttons as a consequence).
 * Validates: Requirements 7.4, 10.1, 10.2
 */
describe('Property 2: Terminal State Immutability', () => {
  it('should return zero actions for any terminal status', () => {
    fc.assert(
      fc.property(fc.constantFrom(...TERMINAL_STATUSES), (status) => {
        expect(isTerminalStatus(status)).toBe(true);
        expect(getAvailableActions(status)).toHaveLength(0);
      })
    );
  });

  it('should classify exactly the terminal statuses as terminal', () => {
    fc.assert(
      fc.property(fc.constantFrom(...STATUSES), (status) => {
        const terminal = isTerminalStatus(status);
        expect(terminal).toBe(TERMINAL_STATUSES.includes(status));
        // A status is terminal iff it has no available actions.
        expect(getAvailableActions(status).length === 0).toBe(terminal);
      })
    );
  });
});
