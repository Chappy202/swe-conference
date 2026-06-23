import { describe, it, expect } from 'vitest';
import { formatZAR, formatDateTime } from '../../src/utils/formatters';

describe('formatZAR', () => {
  it('should format whole numbers with R prefix and thousands separator', () => {
    expect(formatZAR(16500)).toBe('R16,500');
  });

  it('should format large amounts with multiple thousands separators', () => {
    expect(formatZAR(1000000)).toBe('R1,000,000');
  });

  it('should format amounts less than 1000 without separator', () => {
    expect(formatZAR(500)).toBe('R500');
  });

  it('should format zero as R0', () => {
    expect(formatZAR(0)).toBe('R0');
  });

  it('should format decimal amounts with two decimal places', () => {
    expect(formatZAR(1234.56)).toBe('R1,234.56');
  });

  it('should format whole numbers without decimals', () => {
    expect(formatZAR(10000)).toBe('R10,000');
  });
});

describe('formatDateTime', () => {
  it('should format ISO date as DD MMM YYYY HH:mm', () => {
    expect(formatDateTime('2024-06-01T10:00:00.000Z')).toBe('01 Jun 2024 10:00');
  });

  it('should pad single-digit day with leading zero', () => {
    expect(formatDateTime('2024-01-05T08:30:00.000Z')).toBe('05 Jan 2024 08:30');
  });

  it('should handle midnight correctly', () => {
    expect(formatDateTime('2024-12-25T00:00:00.000Z')).toBe('25 Dec 2024 00:00');
  });

  it('should handle end of day', () => {
    expect(formatDateTime('2024-03-15T23:59:00.000Z')).toBe('15 Mar 2024 23:59');
  });
});
