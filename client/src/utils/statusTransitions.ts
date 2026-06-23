import { Status } from '../types/dispute';

export interface ActionConfig {
  label: string;
  targetStatus: Status;
  testId: string;
  style: 'primary' | 'amber' | 'green' | 'grey';
  opensModal?: boolean;
}

export const VALID_TRANSITIONS: Record<Status, ActionConfig[]> = {
  Reported: [
    {
      label: 'Begin Investigation',
      targetStatus: 'UnderInvestigation',
      testId: 'action-investigate',
      style: 'primary',
    },
  ],
  UnderInvestigation: [
    { label: 'Escalate', targetStatus: 'Escalated', testId: 'action-escalate', style: 'amber' },
    {
      label: 'Resolve',
      targetStatus: 'Resolved',
      testId: 'action-resolve',
      style: 'green',
      opensModal: true,
    },
    { label: 'Refer', targetStatus: 'Referred', testId: 'action-refer', style: 'grey' },
  ],
  Escalated: [
    {
      label: 'Resolve',
      targetStatus: 'Resolved',
      testId: 'action-resolve',
      style: 'green',
      opensModal: true,
    },
  ],
  Resolved: [],
  Referred: [],
};

const TERMINAL_STATUSES: Status[] = ['Resolved', 'Referred'];

export function isTerminalStatus(status: Status): boolean {
  return TERMINAL_STATUSES.includes(status);
}

export function getAvailableActions(status: Status): ActionConfig[] {
  return VALID_TRANSITIONS[status] ?? [];
}
