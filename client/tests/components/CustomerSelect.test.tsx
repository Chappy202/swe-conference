import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';
import { CustomerSelect } from '../../src/components/CustomerSelect';
import { Customer } from '../../src/types/dispute';

const customers: Customer[] = [
  { id: 1, name: 'Jane Doe', contactReference: 'REF-001', accountIdentifier: 'ACC-123' },
  { id: 2, name: 'John Smith', contactReference: 'REF-002', accountIdentifier: 'ACC-456' },
];

const defaultProps = {
  customers,
  isLoading: false,
  error: null,
  selectedCustomerId: null,
  onChange: vi.fn(),
  validationError: null,
};

describe('CustomerSelect', () => {
  describe('rendering', () => {
    it('should render a select with the customer-select test id', () => {
      render(<CustomerSelect {...defaultProps} />);
      expect(screen.getByTestId('customer-select')).toBeInTheDocument();
    });

    it('should render the placeholder option "Select a customer"', () => {
      render(<CustomerSelect {...defaultProps} />);
      expect(screen.getByRole('option', { name: 'Select a customer' })).toBeInTheDocument();
    });

    it('should render an option per customer in "{name} — {accountIdentifier}" format', () => {
      render(<CustomerSelect {...defaultProps} />);
      expect(screen.getByRole('option', { name: 'Jane Doe — ACC-123' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'John Smith — ACC-456' })).toBeInTheDocument();
    });
  });

  describe('when loading', () => {
    it('should show a loading indicator and a disabled "Loading customers..." option', () => {
      render(<CustomerSelect {...defaultProps} isLoading={true} customers={[]} />);
      expect(screen.getByTestId('customer-loading')).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Loading customers...' })).toBeInTheDocument();
    });
  });

  describe('when there is a fetch error', () => {
    it('should show an inline alert with the customer-error test id', () => {
      render(
        <CustomerSelect
          {...defaultProps}
          error="Failed to load customers. Please refresh the page."
        />
      );
      const alert = screen.getByTestId('customer-error');
      expect(alert).toHaveTextContent('Failed to load customers. Please refresh the page.');
    });
  });

  describe('when there is a validation error', () => {
    it('should display the validation error text', () => {
      render(<CustomerSelect {...defaultProps} validationError="Please select a customer" />);
      expect(screen.getByText('Please select a customer')).toBeInTheDocument();
    });
  });

  describe('when a customer is selected', () => {
    it('should call onChange with the numeric customer id', () => {
      const onChange = vi.fn();
      render(<CustomerSelect {...defaultProps} onChange={onChange} />);
      fireEvent.change(screen.getByTestId('customer-select'), { target: { value: '2' } });
      expect(onChange).toHaveBeenCalledWith(2);
    });

    it('should call onChange with null when the placeholder is reselected', () => {
      const onChange = vi.fn();
      render(<CustomerSelect {...defaultProps} selectedCustomerId={1} onChange={onChange} />);
      fireEvent.change(screen.getByTestId('customer-select'), { target: { value: '' } });
      expect(onChange).toHaveBeenCalledWith(null);
    });
  });

  // Task 3.3 — Property 1: Customer dropdown format consistency
  describe('Property 1: customer dropdown format consistency', () => {
    it('should render each option text as exactly "{name} — {accountIdentifier}"', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
          fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
          (name, accountIdentifier) => {
            const customer: Customer = {
              id: 99,
              name,
              contactReference: 'REF',
              accountIdentifier,
            };
            const { unmount, container } = render(
              <CustomerSelect {...defaultProps} customers={[customer]} />
            );
            const select = within(container).getByTestId('customer-select');
            // The customer option is the one whose value matches the id.
            const customerOption = within(select)
              .getAllByRole('option')
              .find((o) => (o as HTMLOptionElement).value === '99') as HTMLOptionElement;
            expect(customerOption.textContent).toBe(`${name} — ${accountIdentifier}`);
            unmount();
          }
        )
      );
    });
  });
});
