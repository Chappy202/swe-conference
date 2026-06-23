import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { AppHeader } from '../../src/components/AppHeader';

function renderHeader() {
  return render(
    <MemoryRouter>
      <AppHeader />
    </MemoryRouter>
  );
}

describe('AppHeader', () => {
  it('renders the header landmark with the brand height and navy background', () => {
    renderHeader();
    const header = screen.getByTestId('app-header');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('h-16');
    expect(header).toHaveClass('bg-[#003366]');
  });

  it('shows the product name', () => {
    renderHeader();
    expect(screen.getByText('Dispute Triage')).toBeInTheDocument();
  });

  it('links the brand back to the dashboard', () => {
    renderHeader();
    expect(screen.getByTestId('app-header-brand')).toHaveAttribute('href', '/');
  });
});
