import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CustomerInfoCard } from '../../src/components/CustomerInfoCard';

describe('CustomerInfoCard', () => {
  const customer = {
    name: 'John Doe',
    contactReference: 'REF-12345',
    accountIdentifier: 'ACC-67890',
  };

  it('renders within a container with data-testid="customer-info-card"', () => {
    render(<CustomerInfoCard customer={customer} />);
    expect(screen.getByTestId('customer-info-card')).toBeInTheDocument();
  });

  it('displays the customer name', () => {
    render(<CustomerInfoCard customer={customer} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('displays the contact reference', () => {
    render(<CustomerInfoCard customer={customer} />);
    expect(screen.getByText('REF-12345')).toBeInTheDocument();
  });

  it('displays the account identifier', () => {
    render(<CustomerInfoCard customer={customer} />);
    expect(screen.getByText('ACC-67890')).toBeInTheDocument();
  });
});
