import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DisputeSummaryCard } from '../../src/components/DisputeSummaryCard';

describe('DisputeSummaryCard', () => {
  const defaultProps = {
    status: 'Reported' as const,
    priority: 'P1' as const,
    category: 'Unauthorised/Fraudulent Charge',
    totalAmount: 16500,
    dateRaised: '2024-06-01T10:00:00.000Z',
  };

  it('should render within data-testid="dispute-summary-card"', () => {
    render(<DisputeSummaryCard {...defaultProps} />);
    expect(screen.getByTestId('dispute-summary-card')).toBeInTheDocument();
  });

  it('should render status badge with status text', () => {
    render(<DisputeSummaryCard {...defaultProps} status="UnderInvestigation" />);
    expect(screen.getByText('Under Investigation')).toBeInTheDocument();
  });

  it('should render status badge with correct colour for Reported', () => {
    render(<DisputeSummaryCard {...defaultProps} status="Reported" />);
    const badge = screen.getByText('Reported');
    expect(badge).toHaveClass('bg-indigo-100', 'text-indigo-700');
  });

  it('should render status badge with correct colour for Escalated', () => {
    render(<DisputeSummaryCard {...defaultProps} status="Escalated" />);
    const badge = screen.getByText('Escalated');
    expect(badge).toHaveClass('bg-red-100', 'text-red-700');
  });

  it('should render status badge with correct colour for Resolved', () => {
    render(<DisputeSummaryCard {...defaultProps} status="Resolved" />);
    const badge = screen.getByText('Resolved');
    expect(badge).toHaveClass('bg-green-100', 'text-green-700');
  });

  describe('priority badge colours', () => {
    it('should render P1 priority badge with red colour', () => {
      render(<DisputeSummaryCard {...defaultProps} priority="P1" />);
      const badge = screen.getByText('P1');
      expect(badge).toHaveClass('bg-red-100', 'text-red-700');
    });

    it('should render P2 priority badge with amber colour', () => {
      render(<DisputeSummaryCard {...defaultProps} priority="P2" />);
      const badge = screen.getByText('P2');
      expect(badge).toHaveClass('bg-amber-100', 'text-amber-700');
    });

    it('should render Standard priority badge with grey colour', () => {
      render(<DisputeSummaryCard {...defaultProps} priority="Standard" />);
      const badge = screen.getByText('Standard');
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-700');
    });
  });

  it('should render the category', () => {
    render(<DisputeSummaryCard {...defaultProps} />);
    expect(screen.getByText('Unauthorised/Fraudulent Charge')).toBeInTheDocument();
  });

  it('should render total amount formatted as ZAR', () => {
    render(<DisputeSummaryCard {...defaultProps} totalAmount={16500} />);
    expect(screen.getByText('R16,500')).toBeInTheDocument();
  });

  it('should render date formatted as DD MMM YYYY HH:mm', () => {
    render(<DisputeSummaryCard {...defaultProps} dateRaised="2024-06-01T10:00:00.000Z" />);
    expect(screen.getByText('01 Jun 2024 10:00')).toBeInTheDocument();
  });
});
