import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import CreateDisputePage from '../../src/pages/CreateDispute';
import { Customer } from '../../src/types/dispute';

const mockCustomers: Customer[] = [
  { id: 1, name: 'Jane Doe', contactReference: 'REF-001', accountIdentifier: 'ACC-123' },
  { id: 2, name: 'John Smith', contactReference: 'REF-002', accountIdentifier: 'ACC-456' },
];

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

/** Stub fetch so GET /api/customers resolves and POST /api/disputes returns the given response. */
function stubFetch(postResponse: { ok: boolean; body: unknown }): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn((url: string, options?: RequestInit) => {
    if (url === '/api/customers') {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockCustomers),
      } as Response);
    }
    if (url === '/api/disputes' && options?.method === 'POST') {
      return Promise.resolve({
        ok: postResponse.ok,
        status: postResponse.ok ? 201 : 400,
        json: () => Promise.resolve(postResponse.body),
      } as Response);
    }
    return Promise.reject(new Error(`Unexpected fetch: ${url}`));
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function renderPage(): { unmount: () => void } {
  return render(
    <MemoryRouter initialEntries={['/disputes/new']}>
      <CreateDisputePage />
    </MemoryRouter>
  );
}

async function fillFirstTransaction(): Promise<void> {
  fireEvent.change(screen.getByTestId('transaction-amount-0'), { target: { value: '4500' } });
  fireEvent.change(screen.getByTestId('transaction-merchant-0'), { target: { value: 'Store A' } });
  fireEvent.change(screen.getByTestId('transaction-timestamp-0'), {
    target: { value: '2024-01-15T10:30' },
  });
  fireEvent.change(screen.getByTestId('transaction-payment-type-0'), {
    target: { value: 'ApplePay' },
  });
}

async function selectFirstCustomer(): Promise<void> {
  await waitFor(() => {
    expect(screen.getByTestId('customer-select')).not.toBeDisabled();
  });
  fireEvent.change(screen.getByTestId('customer-select'), { target: { value: '1' } });
}

describe('CreateDisputePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockReset();
    stubFetch({ ok: true, body: { id: 77 } });
  });

  describe('initial render', () => {
    it('should render the page title and back link', () => {
      renderPage();
      expect(screen.getByRole('heading', { name: 'Create New Dispute' })).toBeInTheDocument();
      expect(screen.getByTestId('back-to-dashboard')).toBeInTheDocument();
    });

    it('should render exactly one transaction group initially', () => {
      renderPage();
      expect(screen.getByTestId('transaction-amount-0')).toBeInTheDocument();
      expect(screen.queryByTestId('transaction-amount-1')).not.toBeInTheDocument();
    });

    it('should hide the remove button while only one group exists', () => {
      renderPage();
      expect(screen.queryByTestId('remove-transaction-0')).not.toBeInTheDocument();
    });

    it('should disable the submit button initially', () => {
      renderPage();
      expect(screen.getByTestId('submit-dispute-button')).toBeDisabled();
    });

    it('should fetch and render customer options', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Jane Doe — ACC-123' })).toBeInTheDocument();
      });
    });
  });

  describe('add transaction', () => {
    it('should append a new transaction group when add is clicked', () => {
      renderPage();
      fireEvent.click(screen.getByTestId('add-transaction-button'));
      expect(screen.getByTestId('transaction-amount-1')).toBeInTheDocument();
    });

    it('should show remove buttons once more than one group exists', () => {
      renderPage();
      fireEvent.click(screen.getByTestId('add-transaction-button'));
      expect(screen.getByTestId('remove-transaction-0')).toBeInTheDocument();
      expect(screen.getByTestId('remove-transaction-1')).toBeInTheDocument();
    });
  });

  describe('remove transaction', () => {
    it('should remove the group at the given index', () => {
      renderPage();
      fireEvent.click(screen.getByTestId('add-transaction-button'));
      fireEvent.click(screen.getByTestId('remove-transaction-1'));
      expect(screen.queryByTestId('transaction-amount-1')).not.toBeInTheDocument();
    });
  });

  describe('submit enablement', () => {
    it('should enable submit when a customer is selected and the transaction is valid', async () => {
      renderPage();
      await selectFirstCustomer();
      await fillFirstTransaction();
      expect(screen.getByTestId('submit-dispute-button')).not.toBeDisabled();
    });

    it('should keep submit disabled when no customer is selected', async () => {
      renderPage();
      await fillFirstTransaction();
      expect(screen.getByTestId('submit-dispute-button')).toBeDisabled();
    });
  });

  describe('blur validation', () => {
    it('should show an inline error and red border on blur of an invalid field', async () => {
      renderPage();
      fireEvent.blur(screen.getByTestId('transaction-amount-0'));
      await waitFor(() => {
        expect(screen.getByText('Amount must be greater than zero')).toBeInTheDocument();
      });
      expect(screen.getByTestId('transaction-amount-0').className).toContain('border-red-500');
    });
  });

  describe('submission', () => {
    it('should POST customerId, dateRaised, totalAmount and transactions', async () => {
      const fetchMock = stubFetch({ ok: true, body: { id: 77 } });
      renderPage();
      await selectFirstCustomer();
      await fillFirstTransaction();
      fireEvent.click(screen.getByTestId('submit-dispute-button'));

      await waitFor(() => {
        const postCall = fetchMock.mock.calls.find(
          ([url, opts]) => url === '/api/disputes' && opts?.method === 'POST'
        );
        expect(postCall).toBeDefined();
        const body = JSON.parse((postCall![1] as RequestInit).body as string);
        expect(body.customerId).toBe(1);
        expect(body.totalAmount).toBe(4500);
        expect(typeof body.dateRaised).toBe('string');
        expect(body.transactions).toEqual([
          {
            amount: 4500,
            merchant: 'Store A',
            timestamp: '2024-01-15T10:30',
            paymentType: 'ApplePay',
          },
        ]);
      });
    });

    it('should navigate to /disputes/:id on success', async () => {
      stubFetch({ ok: true, body: { id: 77 } });
      renderPage();
      await selectFirstCustomer();
      await fillFirstTransaction();
      fireEvent.click(screen.getByTestId('submit-dispute-button'));
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/disputes/77');
      });
    });

    it('should show a dismissible error alert on failure', async () => {
      stubFetch({ ok: false, body: { error: 'Customer not found' } });
      renderPage();
      await selectFirstCustomer();
      await fillFirstTransaction();
      fireEvent.click(screen.getByTestId('submit-dispute-button'));

      await waitFor(() => {
        expect(screen.getByTestId('submit-error')).toHaveTextContent(
          'Failed to create dispute: Customer not found. Please try again.'
        );
      });
      fireEvent.click(within(screen.getByTestId('submit-error')).getByRole('button'));
      expect(screen.queryByTestId('submit-error')).not.toBeInTheDocument();
    });

    it('should show a submit loading indicator while in flight', async () => {
      const fetchMock = vi.fn((url: string, options?: RequestInit) => {
        if (url === '/api/customers') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(mockCustomers),
          } as Response);
        }
        if (url === '/api/disputes' && options?.method === 'POST') {
          return new Promise(() => {}); // never resolves
        }
        return Promise.reject(new Error('unexpected'));
      });
      vi.stubGlobal('fetch', fetchMock);

      renderPage();
      await selectFirstCustomer();
      await fillFirstTransaction();
      fireEvent.click(screen.getByTestId('submit-dispute-button'));

      await waitFor(() => {
        expect(screen.getByTestId('submit-loading')).toBeInTheDocument();
        expect(screen.getByTestId('submit-dispute-button')).toHaveTextContent('Submitting...');
      });
    });
  });

  // ─── Property-based tests ──────────────────────────────────────────────────

  // Task 5.3 — Property 3: adding a transaction grows the list
  describe('Property 3: adding a transaction grows the list', () => {
    it('should result in N + 1 groups after clicking add on N groups', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 6 }), (extraClicks) => {
          const { unmount } = renderPage();
          for (let i = 0; i < extraClicks; i++) {
            fireEvent.click(screen.getByTestId('add-transaction-button'));
          }
          const before = screen.getAllByTestId(/^transaction-amount-\d+$/).length;
          fireEvent.click(screen.getByTestId('add-transaction-button'));
          const after = screen.getAllByTestId(/^transaction-amount-\d+$/).length;
          expect(after).toBe(before + 1);
          unmount();
        }),
        { numRuns: 10 }
      );
    });
  });

  // Task 5.4 — Property 4: transaction count minimum invariant
  describe('Property 4: transaction count minimum invariant', () => {
    it('should never drop below one group and toggle the remove button correctly', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 6 }), (adds) => {
          const { unmount } = renderPage();
          for (let i = 0; i < adds; i++) {
            fireEvent.click(screen.getByTestId('add-transaction-button'));
          }
          let count = adds + 1;
          // Remove until only one remains.
          while (count > 1) {
            const before = screen.getAllByTestId(/^transaction-amount-\d+$/).length;
            expect(screen.getByTestId(`remove-transaction-${before - 1}`)).toBeInTheDocument();
            fireEvent.click(screen.getByTestId(`remove-transaction-${before - 1}`));
            const after = screen.getAllByTestId(/^transaction-amount-\d+$/).length;
            expect(after).toBe(before - 1);
            count = after;
          }
          // One group: count is 1 and remove button hidden.
          expect(screen.getAllByTestId(/^transaction-amount-\d+$/).length).toBe(1);
          expect(screen.queryByTestId('remove-transaction-0')).not.toBeInTheDocument();
          unmount();
        }),
        { numRuns: 8 }
      );
    });
  });

  // Task 5.5 — Property 5: submit enabled iff form valid
  describe('Property 5: submit enabled iff form valid', () => {
    it('should enable submit exactly when a customer is selected and all fields are valid', async () => {
      await fc.assert(
        fc.asyncProperty(fc.boolean(), fc.boolean(), async (selectCustomer, fillTransaction) => {
          stubFetch({ ok: true, body: { id: 1 } });
          const { unmount } = render(
            <MemoryRouter initialEntries={['/disputes/new']}>
              <CreateDisputePage />
            </MemoryRouter>
          );
          await waitFor(() => {
            expect(screen.getAllByTestId('customer-select')[0]).not.toBeDisabled();
          });
          if (selectCustomer) {
            fireEvent.change(screen.getAllByTestId('customer-select')[0], {
              target: { value: '1' },
            });
          }
          if (fillTransaction) {
            fireEvent.change(screen.getAllByTestId('transaction-amount-0')[0], {
              target: { value: '100' },
            });
            fireEvent.change(screen.getAllByTestId('transaction-merchant-0')[0], {
              target: { value: 'Store' },
            });
            fireEvent.change(screen.getAllByTestId('transaction-timestamp-0')[0], {
              target: { value: '2024-01-15T10:30' },
            });
            fireEvent.change(screen.getAllByTestId('transaction-payment-type-0')[0], {
              target: { value: 'Card' },
            });
          }
          const expectedEnabled = selectCustomer && fillTransaction;
          const submit = screen.getAllByTestId('submit-dispute-button')[0];
          expect(!(submit as HTMLButtonElement).disabled).toBe(expectedEnabled);
          unmount();
        }),
        { numRuns: 4 }
      );
    });
  });

  // Task 5.6 — Property 7: blur triggers validation feedback
  describe('Property 7: blur triggers validation feedback', () => {
    it('should show red border and error text for any empty required field on blur', () => {
      const fields: Array<{ testId: string; error: string }> = [
        { testId: 'transaction-amount-0', error: 'Amount must be greater than zero' },
        { testId: 'transaction-merchant-0', error: 'Merchant name is required' },
        { testId: 'transaction-timestamp-0', error: 'Transaction date is required' },
        { testId: 'transaction-payment-type-0', error: 'Please select a payment type' },
      ];
      fc.assert(
        fc.property(fc.constantFrom(...fields), (field) => {
          const { unmount } = renderPage();
          fireEvent.blur(screen.getByTestId(field.testId));
          expect(screen.getByText(field.error)).toBeInTheDocument();
          expect(screen.getByTestId(field.testId).className).toContain('border-red-500');
          unmount();
        }),
        { numRuns: 4 }
      );
    });
  });

  // Task 5.7 — Property 8: submission payload shape correctness
  // Task 5.8 — Property 9: total amount equals sum
  describe('Property 8 & 9: submission payload shape and total', () => {
    it('should build a payload whose totalAmount equals the sum of transaction amounts', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.integer({ min: 1, max: 100000 }), { minLength: 1, maxLength: 4 }),
          async (amounts) => {
            const fetchMock = stubFetch({ ok: true, body: { id: 5 } });
            const { unmount } = render(
              <MemoryRouter initialEntries={['/disputes/new']}>
                <CreateDisputePage />
              </MemoryRouter>
            );
            await waitFor(() => {
              expect(screen.getAllByTestId('customer-select')[0]).not.toBeDisabled();
            });
            fireEvent.change(screen.getAllByTestId('customer-select')[0], {
              target: { value: '2' },
            });
            for (let i = 0; i < amounts.length; i++) {
              if (i > 0) {
                fireEvent.click(screen.getAllByTestId('add-transaction-button')[0]);
              }
              fireEvent.change(screen.getAllByTestId(`transaction-amount-${i}`)[0], {
                target: { value: String(amounts[i]) },
              });
              fireEvent.change(screen.getAllByTestId(`transaction-merchant-${i}`)[0], {
                target: { value: `Store ${i}` },
              });
              fireEvent.change(screen.getAllByTestId(`transaction-timestamp-${i}`)[0], {
                target: { value: '2024-01-15T10:30' },
              });
              fireEvent.change(screen.getAllByTestId(`transaction-payment-type-${i}`)[0], {
                target: { value: 'Card' },
              });
            }
            fireEvent.click(screen.getAllByTestId('submit-dispute-button')[0]);

            await waitFor(() => {
              const postCall = fetchMock.mock.calls.find(
                ([url, opts]) => url === '/api/disputes' && opts?.method === 'POST'
              );
              expect(postCall).toBeDefined();
            });
            const postCall = fetchMock.mock.calls.find(
              ([url, opts]) => url === '/api/disputes' && opts?.method === 'POST'
            )!;
            const body = JSON.parse((postCall[1] as RequestInit).body as string);
            const expectedTotal = amounts.reduce((a, b) => a + b, 0);
            expect(body.customerId).toBe(2);
            expect(body.totalAmount).toBe(expectedTotal);
            expect(body.transactions).toHaveLength(amounts.length);
            body.transactions.forEach((t: { amount: number; merchant: string }, i: number) => {
              expect(typeof t.amount).toBe('number');
              expect(t.amount).toBe(amounts[i]);
              expect(typeof t.merchant).toBe('string');
            });
            expect(typeof body.dateRaised).toBe('string');
            expect(Number.isNaN(Date.parse(body.dateRaised))).toBe(false);
            unmount();
          }
        ),
        { numRuns: 5 }
      );
    });
  });

  // Task 5.9 — Property 10: success redirects to created dispute
  describe('Property 10: success redirects to created dispute', () => {
    it('should navigate to /disputes/N for any returned id N', async () => {
      await fc.assert(
        fc.asyncProperty(fc.integer({ min: 1, max: 999999 }), async (id) => {
          mockNavigate.mockReset();
          stubFetch({ ok: true, body: { id } });
          const { unmount } = render(
            <MemoryRouter initialEntries={['/disputes/new']}>
              <CreateDisputePage />
            </MemoryRouter>
          );
          await waitFor(() => {
            expect(screen.getAllByTestId('customer-select')[0]).not.toBeDisabled();
          });
          fireEvent.change(screen.getAllByTestId('customer-select')[0], { target: { value: '1' } });
          fireEvent.change(screen.getAllByTestId('transaction-amount-0')[0], {
            target: { value: '100' },
          });
          fireEvent.change(screen.getAllByTestId('transaction-merchant-0')[0], {
            target: { value: 'Store' },
          });
          fireEvent.change(screen.getAllByTestId('transaction-timestamp-0')[0], {
            target: { value: '2024-01-15T10:30' },
          });
          fireEvent.change(screen.getAllByTestId('transaction-payment-type-0')[0], {
            target: { value: 'Card' },
          });
          fireEvent.click(screen.getAllByTestId('submit-dispute-button')[0]);
          await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith(`/disputes/${id}`);
          });
          unmount();
        }),
        { numRuns: 5 }
      );
    });
  });

  // Task 5.10 — Property 11: error message propagation
  describe('Property 11: error message propagation', () => {
    it('should display "Failed to create dispute: {msg}. Please try again." for any error message', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
          async (msg) => {
            stubFetch({ ok: false, body: { error: msg } });
            const { unmount } = render(
              <MemoryRouter initialEntries={['/disputes/new']}>
                <CreateDisputePage />
              </MemoryRouter>
            );
            await waitFor(() => {
              expect(screen.getAllByTestId('customer-select')[0]).not.toBeDisabled();
            });
            fireEvent.change(screen.getAllByTestId('customer-select')[0], {
              target: { value: '1' },
            });
            fireEvent.change(screen.getAllByTestId('transaction-amount-0')[0], {
              target: { value: '100' },
            });
            fireEvent.change(screen.getAllByTestId('transaction-merchant-0')[0], {
              target: { value: 'Store' },
            });
            fireEvent.change(screen.getAllByTestId('transaction-timestamp-0')[0], {
              target: { value: '2024-01-15T10:30' },
            });
            fireEvent.change(screen.getAllByTestId('transaction-payment-type-0')[0], {
              target: { value: 'Card' },
            });
            fireEvent.click(screen.getAllByTestId('submit-dispute-button')[0]);
            await waitFor(() => {
              expect(screen.getAllByTestId('submit-error')[0]).toHaveTextContent(
                `Failed to create dispute: ${msg}. Please try again.`
              );
            });
            unmount();
          }
        ),
        { numRuns: 5 }
      );
    });
  });
});
