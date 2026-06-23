import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RuleTraceSection } from '../../src/components/RuleTraceSection';
import { RuleTrace } from '../../src/types/dispute';

const mockRuleTrace: RuleTrace = {
  evaluatedAt: '2024-01-15T10:30:00.000Z',
  inputs: {
    youngestTransactionAge: '12 hours',
    totalAmount: 16500,
  },
  rules: [
    {
      rule: 'Transaction Age Rule',
      condition: 'Youngest transaction < 48 hours',
      result: true,
      detail: 'Transaction is 12 hours old',
    },
    {
      rule: 'Amount Threshold Rule',
      condition: 'Total amount > R10,000',
      result: true,
      detail: 'Total amount is R16,500',
    },
    {
      rule: 'Combined Rule',
      condition: 'Both age and amount conditions met',
      result: false,
      detail: 'Not applicable',
    },
  ],
  recommendation: 'Immediate Fraud Freeze + P1 Escalation',
  priority: 'P1',
};

describe('RuleTraceSection', () => {
  describe('when rendered', () => {
    it('should render a section with data-testid="rule-trace-section"', () => {
      render(<RuleTraceSection ruleTrace={mockRuleTrace} />);
      expect(screen.getByTestId('rule-trace-section')).toBeInTheDocument();
    });

    it('should render a toggle button with data-testid="rule-trace-toggle"', () => {
      render(<RuleTraceSection ruleTrace={mockRuleTrace} />);
      expect(screen.getByTestId('rule-trace-toggle')).toBeInTheDocument();
    });

    it('should start collapsed by default', () => {
      render(<RuleTraceSection ruleTrace={mockRuleTrace} />);
      expect(screen.queryByText('Immediate Fraud Freeze + P1 Escalation')).not.toBeInTheDocument();
    });
  });

  describe('when toggle is clicked', () => {
    it('should expand to show rule trace details', () => {
      render(<RuleTraceSection ruleTrace={mockRuleTrace} />);
      fireEvent.click(screen.getByTestId('rule-trace-toggle'));
      expect(screen.getByText('Immediate Fraud Freeze + P1 Escalation')).toBeInTheDocument();
    });

    it('should collapse when clicked again', () => {
      render(<RuleTraceSection ruleTrace={mockRuleTrace} />);
      const toggle = screen.getByTestId('rule-trace-toggle');
      fireEvent.click(toggle);
      expect(screen.getByText('Immediate Fraud Freeze + P1 Escalation')).toBeInTheDocument();
      fireEvent.click(toggle);
      expect(
        screen.queryByText('Immediate Fraud Freeze + P1 Escalation')
      ).not.toBeInTheDocument();
    });
  });

  describe('when expanded', () => {
    it('should show the evaluation timestamp', () => {
      render(<RuleTraceSection ruleTrace={mockRuleTrace} />);
      fireEvent.click(screen.getByTestId('rule-trace-toggle'));
      expect(screen.getByText(/2024-01-15/)).toBeInTheDocument();
    });

    it('should show input values', () => {
      render(<RuleTraceSection ruleTrace={mockRuleTrace} />);
      fireEvent.click(screen.getByTestId('rule-trace-toggle'));
      expect(screen.getByText(/12 hours/)).toBeInTheDocument();
      expect(screen.getByText(/16500/)).toBeInTheDocument();
    });

    it('should show each rule with its condition and result', () => {
      render(<RuleTraceSection ruleTrace={mockRuleTrace} />);
      fireEvent.click(screen.getByTestId('rule-trace-toggle'));
      expect(screen.getByText('Transaction Age Rule')).toBeInTheDocument();
      expect(screen.getByText('Youngest transaction < 48 hours')).toBeInTheDocument();
      expect(screen.getByText('Amount Threshold Rule')).toBeInTheDocument();
      expect(screen.getByText('Total amount > R10,000')).toBeInTheDocument();
      expect(screen.getByText('Combined Rule')).toBeInTheDocument();
    });

    it('should show pass/fail indicators for each rule', () => {
      render(<RuleTraceSection ruleTrace={mockRuleTrace} />);
      fireEvent.click(screen.getByTestId('rule-trace-toggle'));
      const passIndicators = screen.getAllByText('✓');
      const failIndicators = screen.getAllByText('✗');
      expect(passIndicators).toHaveLength(2);
      expect(failIndicators).toHaveLength(1);
    });

    it('should show the final recommendation', () => {
      render(<RuleTraceSection ruleTrace={mockRuleTrace} />);
      fireEvent.click(screen.getByTestId('rule-trace-toggle'));
      expect(screen.getByText('Immediate Fraud Freeze + P1 Escalation')).toBeInTheDocument();
    });
  });
});
