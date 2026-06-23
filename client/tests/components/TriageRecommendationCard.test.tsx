import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  TriageRecommendationCard,
} from '../../src/components/TriageRecommendationCard';

describe('TriageRecommendationCard', () => {
  describe('when rendering recommendation text', () => {
    it('should render recommendation text in bold', () => {
      render(
        <TriageRecommendationCard
          recommendation="Immediate Fraud Freeze + P1 Escalation"
          priority="P1"
        />
      );

      const text = screen.getByText('Immediate Fraud Freeze + P1 Escalation');
      expect(text).toBeInTheDocument();
      expect(text).toHaveClass('font-bold');
    });

    it('should render within data-testid="triage-recommendation"', () => {
      render(
        <TriageRecommendationCard
          recommendation="Standard Investigation"
          priority="Standard"
        />
      );

      const container = screen.getByTestId('triage-recommendation');
      expect(container).toBeInTheDocument();
    });
  });

  describe('when priority is P1', () => {
    it('should apply a 4px red left border', () => {
      render(
        <TriageRecommendationCard
          recommendation="Immediate Fraud Freeze + P1 Escalation"
          priority="P1"
        />
      );

      const container = screen.getByTestId('triage-recommendation');
      expect(container).toHaveClass('border-l-4');
      expect(container).toHaveClass('border-l-red-600');
    });
  });

  describe('when priority is P2', () => {
    it('should apply a 4px amber left border', () => {
      render(
        <TriageRecommendationCard
          recommendation="Immediate Fraud Freeze"
          priority="P2"
        />
      );

      const container = screen.getByTestId('triage-recommendation');
      expect(container).toHaveClass('border-l-4');
      expect(container).toHaveClass('border-l-amber-500');
    });
  });

  describe('when priority is Standard', () => {
    it('should apply a 4px grey left border', () => {
      render(
        <TriageRecommendationCard
          recommendation="Standard Investigation"
          priority="Standard"
        />
      );

      const container = screen.getByTestId('triage-recommendation');
      expect(container).toHaveClass('border-l-4');
      expect(container).toHaveClass('border-l-gray-400');
    });
  });
});
