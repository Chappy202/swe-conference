/**
 * Format a number as ZAR currency.
 * Whole numbers render without decimals: R16,500
 * Fractional amounts render with two decimal places: R1,234.56
 * Uses comma as thousands separator and dot as decimal separator.
 */
export function formatZAR(amount: number): string {
  const isWholeNumber = Number.isInteger(amount);
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: isWholeNumber ? 0 : 2,
    maximumFractionDigits: isWholeNumber ? 0 : 2,
  });
  return `R${formatted}`;
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * Format an ISO date string as "DD MMM YYYY HH:mm".
 * Uses UTC to ensure deterministic output regardless of timezone.
 */
export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = MONTHS[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  return `${day} ${month} ${year} ${hours}:${minutes}`;
}
