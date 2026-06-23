import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { formatZAR, formatDateTime } from '../src/utils/formatters';

/**
 * Property 3: Currency Formatting
 * For any non-negative number, formatZAR output starts with "R", uses comma as the
 * thousands separator, and represents the same numeric value (whole ZAR portion).
 */
describe('Property 3: Currency Formatting', () => {
  it('should always start with R and represent the input value for any non-negative amount', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1_000_000_000 }), (amount) => {
        const result = formatZAR(amount);
        expect(result.startsWith('R')).toBe(true);
        // Stripping the R prefix and comma separators yields the original integer.
        const numericPart = result.slice(1).replace(/,/g, '');
        expect(Number(numericPart)).toBe(amount);
      })
    );
  });

  it('should group integer digits in threes with commas', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1000, max: 1_000_000_000 }), (amount) => {
        const result = formatZAR(amount);
        const integerDigits = result.slice(1); // drop "R"
        // Every comma-separated group after the first must be exactly 3 digits.
        const groups = integerDigits.split(',');
        for (let i = 1; i < groups.length; i += 1) {
          expect(groups[i]).toMatch(/^\d{3}$/);
        }
      })
    );
  });
});

/**
 * Property 4: Date Formatting
 * For any valid ISO 8601 date string, formatDateTime output matches DD MMM YYYY HH:mm.
 */
describe('Property 4: Date Formatting', () => {
  const PATTERN = /^\d{2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4} \d{2}:\d{2}$/;

  it('should match the DD MMM YYYY HH:mm pattern for any valid date', () => {
    fc.assert(
      fc.property(
        fc.date({
          min: new Date('1970-01-01T00:00:00.000Z'),
          max: new Date('2999-12-31T23:59:00.000Z'),
        }),
        (date) => {
          const result = formatDateTime(date.toISOString());
          expect(result).toMatch(PATTERN);
        }
      )
    );
  });
});
