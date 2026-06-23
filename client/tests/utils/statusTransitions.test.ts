import { describe, it, expect } from 'vitest';
import {
  VALID_TRANSITIONS,
  isTerminalStatus,
  getAvailableActions,
} from '../../src/utils/statusTransitions';
import { Status } from '../../src/types/dispute';

describe('statusTransitions', () => {
  describe('VALID_TRANSITIONS', () => {
    it('should define transitions for all 5 status values', () => {
      const statuses: Status[] = [
        'Reported',
        'UnderInvestigation',
        'Escalated',
        'Resolved',
        'Referred',
      ];
      for (const status of statuses) {
        expect(VALID_TRANSITIONS).toHaveProperty(status);
      }
    });

    it('should have exactly one action for Reported status', () => {
      const actions = VALID_TRANSITIONS['Reported'];
      expect(actions).toHaveLength(1);
      expect(actions[0]).toEqual({
        label: 'Begin Investigation',
        targetStatus: 'UnderInvestigation',
        testId: 'action-investigate',
        style: 'primary',
      });
    });

    it('should have three actions for UnderInvestigation status', () => {
      const actions = VALID_TRANSITIONS['UnderInvestigation'];
      expect(actions).toHaveLength(3);
      expect(actions[0]).toEqual({
        label: 'Escalate',
        targetStatus: 'Escalated',
        testId: 'action-escalate',
        style: 'amber',
      });
      expect(actions[1]).toEqual({
        label: 'Resolve',
        targetStatus: 'Resolved',
        testId: 'action-resolve',
        style: 'green',
        opensModal: true,
      });
      expect(actions[2]).toEqual({
        label: 'Refer',
        targetStatus: 'Referred',
        testId: 'action-refer',
        style: 'grey',
      });
    });

    it('should have one action for Escalated status', () => {
      const actions = VALID_TRANSITIONS['Escalated'];
      expect(actions).toHaveLength(1);
      expect(actions[0]).toEqual({
        label: 'Resolve',
        targetStatus: 'Resolved',
        testId: 'action-resolve',
        style: 'green',
        opensModal: true,
      });
    });

    it('should have no actions for Resolved status', () => {
      expect(VALID_TRANSITIONS['Resolved']).toEqual([]);
    });

    it('should have no actions for Referred status', () => {
      expect(VALID_TRANSITIONS['Referred']).toEqual([]);
    });
  });

  describe('isTerminalStatus', () => {
    it('should return true for Resolved', () => {
      expect(isTerminalStatus('Resolved')).toBe(true);
    });

    it('should return true for Referred', () => {
      expect(isTerminalStatus('Referred')).toBe(true);
    });

    it('should return false for Reported', () => {
      expect(isTerminalStatus('Reported')).toBe(false);
    });

    it('should return false for UnderInvestigation', () => {
      expect(isTerminalStatus('UnderInvestigation')).toBe(false);
    });

    it('should return false for Escalated', () => {
      expect(isTerminalStatus('Escalated')).toBe(false);
    });
  });

  describe('getAvailableActions', () => {
    it('should return actions matching VALID_TRANSITIONS for Reported', () => {
      const actions = getAvailableActions('Reported');
      expect(actions).toEqual(VALID_TRANSITIONS['Reported']);
    });

    it('should return actions matching VALID_TRANSITIONS for UnderInvestigation', () => {
      const actions = getAvailableActions('UnderInvestigation');
      expect(actions).toEqual(VALID_TRANSITIONS['UnderInvestigation']);
    });

    it('should return actions matching VALID_TRANSITIONS for Escalated', () => {
      const actions = getAvailableActions('Escalated');
      expect(actions).toEqual(VALID_TRANSITIONS['Escalated']);
    });

    it('should return an empty array for Resolved', () => {
      const actions = getAvailableActions('Resolved');
      expect(actions).toEqual([]);
    });

    it('should return an empty array for Referred', () => {
      const actions = getAvailableActions('Referred');
      expect(actions).toEqual([]);
    });
  });
});
