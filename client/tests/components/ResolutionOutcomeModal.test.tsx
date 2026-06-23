import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResolutionOutcomeModal } from '../../src/components/ResolutionOutcomeModal';

describe('ResolutionOutcomeModal', () => {
  const defaultProps = {
    isOpen: true,
    disputeId: 42,
    onClose: vi.fn(),
    onResolved: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response)
      )
    );
  });

  describe('when isOpen is false', () => {
    it('should not render modal content', () => {
      render(<ResolutionOutcomeModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByTestId('resolution-modal')).not.toBeInTheDocument();
    });
  });

  describe('when isOpen is true', () => {
    it('should render the modal with data-testid="resolution-modal"', () => {
      render(<ResolutionOutcomeModal {...defaultProps} />);
      expect(screen.getByTestId('resolution-modal')).toBeInTheDocument();
    });

    it('should render a semi-transparent overlay', () => {
      render(<ResolutionOutcomeModal {...defaultProps} />);
      expect(screen.getByTestId('resolution-modal-overlay')).toBeInTheDocument();
    });

    it('should render a close button', () => {
      render(<ResolutionOutcomeModal {...defaultProps} />);
      expect(screen.getByTestId('modal-close')).toBeInTheDocument();
    });

    it('should render a cancel button', () => {
      render(<ResolutionOutcomeModal {...defaultProps} />);
      expect(screen.getByTestId('modal-cancel')).toBeInTheDocument();
    });

    it('should render a confirm button', () => {
      render(<ResolutionOutcomeModal {...defaultProps} />);
      expect(screen.getByTestId('modal-confirm')).toBeInTheDocument();
    });

    it('should render three radio options with correct test IDs', () => {
      render(<ResolutionOutcomeModal {...defaultProps} />);
      expect(screen.getByTestId('outcome-refunded')).toBeInTheDocument();
      expect(screen.getByTestId('outcome-declined')).toBeInTheDocument();
      expect(screen.getByTestId('outcome-chargeback')).toBeInTheDocument();
    });

    it('should display radio option labels: Refunded, Declined, Chargeback Initiated', () => {
      render(<ResolutionOutcomeModal {...defaultProps} />);
      expect(screen.getByText('Refunded')).toBeInTheDocument();
      expect(screen.getByText('Declined')).toBeInTheDocument();
      expect(screen.getByText('Chargeback Initiated')).toBeInTheDocument();
    });
  });

  describe('when no radio option is selected', () => {
    it('should have the confirm button disabled', () => {
      render(<ResolutionOutcomeModal {...defaultProps} />);
      expect(screen.getByTestId('modal-confirm')).toBeDisabled();
    });
  });

  describe('when a radio option is selected', () => {
    it('should enable the confirm button', () => {
      render(<ResolutionOutcomeModal {...defaultProps} />);
      fireEvent.click(screen.getByTestId('outcome-refunded'));
      expect(screen.getByTestId('modal-confirm')).toBeEnabled();
    });
  });

  describe('when confirm is clicked after selecting an outcome', () => {
    it('should send PATCH with { status: "Resolved", resolutionOutcome: "Refunded" }', async () => {
      render(<ResolutionOutcomeModal {...defaultProps} />);
      fireEvent.click(screen.getByTestId('outcome-refunded'));
      fireEvent.click(screen.getByTestId('modal-confirm'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/disputes/42/status', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Resolved', resolutionOutcome: 'Refunded' }),
        });
      });
    });

    it('should send PATCH with { status: "Resolved", resolutionOutcome: "Declined" }', async () => {
      render(<ResolutionOutcomeModal {...defaultProps} />);
      fireEvent.click(screen.getByTestId('outcome-declined'));
      fireEvent.click(screen.getByTestId('modal-confirm'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/disputes/42/status', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Resolved', resolutionOutcome: 'Declined' }),
        });
      });
    });

    it('should send PATCH with { status: "Resolved", resolutionOutcome: "ChargebackInitiated" }', async () => {
      render(<ResolutionOutcomeModal {...defaultProps} />);
      fireEvent.click(screen.getByTestId('outcome-chargeback'));
      fireEvent.click(screen.getByTestId('modal-confirm'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/disputes/42/status', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'Resolved',
            resolutionOutcome: 'ChargebackInitiated',
          }),
        });
      });
    });

    it('should close the modal and call onResolved on success', async () => {
      const onClose = vi.fn();
      const onResolved = vi.fn();
      render(
        <ResolutionOutcomeModal
          {...defaultProps}
          onClose={onClose}
          onResolved={onResolved}
        />
      );
      fireEvent.click(screen.getByTestId('outcome-refunded'));
      fireEvent.click(screen.getByTestId('modal-confirm'));

      await waitFor(() => {
        expect(onResolved).toHaveBeenCalled();
      });
    });
  });

  describe('when dismiss actions are used', () => {
    it('should close modal on cancel click without API call', () => {
      const onClose = vi.fn();
      render(<ResolutionOutcomeModal {...defaultProps} onClose={onClose} />);
      fireEvent.click(screen.getByTestId('modal-cancel'));

      expect(onClose).toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should close modal on close button click without API call', () => {
      const onClose = vi.fn();
      render(<ResolutionOutcomeModal {...defaultProps} onClose={onClose} />);
      fireEvent.click(screen.getByTestId('modal-close'));

      expect(onClose).toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should close modal on overlay click without API call', () => {
      const onClose = vi.fn();
      render(<ResolutionOutcomeModal {...defaultProps} onClose={onClose} />);
      fireEvent.click(screen.getByTestId('resolution-modal-overlay'));

      expect(onClose).toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('when submission is in progress', () => {
    it('should show spinner with text "Resolving..." on confirm button', async () => {
      vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));

      render(<ResolutionOutcomeModal {...defaultProps} />);
      fireEvent.click(screen.getByTestId('outcome-refunded'));
      fireEvent.click(screen.getByTestId('modal-confirm'));

      await waitFor(() => {
        expect(screen.getByTestId('modal-confirm')).toHaveTextContent('Resolving...');
      });
    });

    it('should disable radio options and cancel button during submission', async () => {
      vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));

      render(<ResolutionOutcomeModal {...defaultProps} />);
      fireEvent.click(screen.getByTestId('outcome-refunded'));
      fireEvent.click(screen.getByTestId('modal-confirm'));

      await waitFor(() => {
        expect(screen.getByTestId('outcome-refunded')).toBeDisabled();
        expect(screen.getByTestId('outcome-declined')).toBeDisabled();
        expect(screen.getByTestId('outcome-chargeback')).toBeDisabled();
        expect(screen.getByTestId('modal-cancel')).toBeDisabled();
      });
    });
  });

  describe('when submission fails', () => {
    it('should show inline error message and keep modal open', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(() =>
          Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ error: 'SOMETHING_WENT_WRONG' }),
          } as unknown as Response)
        )
      );

      render(<ResolutionOutcomeModal {...defaultProps} />);
      fireEvent.click(screen.getByTestId('outcome-refunded'));
      fireEvent.click(screen.getByTestId('modal-confirm'));

      await waitFor(() => {
        expect(
          screen.getByText('Failed to resolve dispute. Please try again.')
        ).toBeInTheDocument();
      });

      // Modal should still be open
      expect(screen.getByTestId('resolution-modal')).toBeInTheDocument();
    });
  });
});
