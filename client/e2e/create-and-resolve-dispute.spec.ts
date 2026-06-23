import { test, expect } from '@playwright/test';

/**
 * Generates an ISO datetime-local string for a recent timestamp.
 * Used for transaction timestamp inputs (format: YYYY-MM-DDTHH:mm).
 */
function recentTimestamp(hoursAgo: number): string {
  const date = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
  return date.toISOString().slice(0, 16);
}

test.describe('Feature: Create and Resolve High-Value Fraud Dispute', () => {
  test('Ops user creates a high-value fraud dispute with multiple Apple Pay transactions and resolves it with a refund', async ({
    page,
  }) => {
    // ─── Phase 1: Dashboard loads ───────────────────────────────────────────────
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'All Disputes' })).toBeVisible();
    await expect(page.getByTestId('new-dispute-button')).toBeVisible();

    // ─── Phase 2: Navigate to create form ───────────────────────────────────────
    await page.getByTestId('new-dispute-button').click();
    await expect(page.getByRole('heading', { name: 'Create New Dispute' })).toBeVisible();

    // ─── Phase 3: Select customer ───────────────────────────────────────────────
    const customerSelect = page.getByTestId('customer-select');
    await expect(customerSelect).toBeVisible();
    // Select the first available customer option
    const options = customerSelect.locator('option');
    await expect(options).not.toHaveCount(0);
    await customerSelect.selectOption({ index: 1 });

    // ─── Phase 4: Enter first transaction ───────────────────────────────────────
    await page.getByTestId('transaction-amount-0').fill('4500');
    await page.getByTestId('transaction-merchant-0').fill('Sportscene Sandton City');
    await page.getByTestId('transaction-timestamp-0').fill(recentTimestamp(2));
    await page.getByTestId('transaction-payment-type-0').selectOption('ApplePay');

    // ─── Phase 5: Add second transaction ────────────────────────────────────────
    await page.getByTestId('add-transaction-button').click();
    await page.getByTestId('transaction-amount-1').fill('7200');
    await page.getByTestId('transaction-merchant-1').fill('iStore Gateway Mall');
    await page.getByTestId('transaction-timestamp-1').fill(recentTimestamp(3));
    await page.getByTestId('transaction-payment-type-1').selectOption('ApplePay');

    // ─── Phase 6: Add third transaction ─────────────────────────────────────────
    await page.getByTestId('add-transaction-button').click();
    await page.getByTestId('transaction-amount-2').fill('4800');
    await page.getByTestId('transaction-merchant-2').fill('Clicks Rosebank');
    await page.getByTestId('transaction-timestamp-2').fill(recentTimestamp(4));
    await page.getByTestId('transaction-payment-type-2').selectOption('ApplePay');

    // ─── Phase 7: Submit dispute ────────────────────────────────────────────────
    await page.getByTestId('submit-dispute-button').click();
    await page.waitForURL(/\/disputes\/\d+/);

    // ─── Phase 8: Verify detail page — initial state ────────────────────────────
    const disputeTitle = page.getByTestId('dispute-title');
    await expect(disputeTitle).toBeVisible();
    await expect(disputeTitle).toContainText('Dispute #');

    await expect(page.getByText('Reported')).toBeVisible();
    await expect(page.getByText('P1')).toBeVisible();

    const triageRecommendation = page.getByTestId('triage-recommendation');
    await expect(triageRecommendation).toContainText(
      'Immediate Fraud Freeze + P1 High Priority Escalation',
    );

    const transactionsTable = page.getByTestId('transactions-table');
    await expect(transactionsTable).toBeVisible();
    await expect(transactionsTable.locator('tbody tr')).toHaveCount(3);

    await expect(page.getByTestId('customer-info-card')).toBeVisible();
    await expect(page.getByTestId('action-investigate')).toBeVisible();

    // ─── Phase 9: Progress to Under Investigation ───────────────────────────────
    await page.getByTestId('action-investigate').click();

    await expect(page.getByText('Under Investigation')).toBeVisible();
    await expect(page.getByTestId('action-escalate')).toBeVisible();
    await expect(page.getByTestId('action-resolve')).toBeVisible();
    await expect(page.getByTestId('action-refer')).toBeVisible();
    await expect(page.getByTestId('action-investigate')).not.toBeVisible();

    // ─── Phase 10: Resolve with Refund ──────────────────────────────────────────
    await page.getByTestId('action-resolve').click();

    const resolutionModal = page.getByTestId('resolution-modal');
    await expect(resolutionModal).toBeVisible();

    await page.getByTestId('outcome-refunded').check();
    await page.getByTestId('modal-confirm').click();

    // ─── Phase 11: Modal dismisses and redirects back to the dashboard ──────────
    await expect(resolutionModal).not.toBeVisible();
    await page.waitForURL('**/');
    await expect(page.getByRole('heading', { name: 'All Disputes' })).toBeVisible();

    // The dispute now appears on the dashboard in its Resolved terminal state.
    await expect(page.getByTestId('disputes-table')).toBeVisible();
    await expect(page.getByText('Resolved').first()).toBeVisible();
  });
});
