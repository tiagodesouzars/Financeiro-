import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatDateBR,
  formatShortDateBR,
  getCurrentMonthKey,
  getTodayDateString,
  getMonthNamePT,
  formatMonthYearPT,
  parseCurrencyInput,
} from '../formatters';

describe('Formatters Utility Suite', () => {
  it('correctly formats Brazilian Real currency', () => {
    const formatted = formatCurrency(1250.5);
    expect(formatted).toContain('1.250,50');
    expect(formatted).toContain('R$');
  });

  it('handles negative and zero currency amounts', () => {
    expect(formatCurrency(0)).toContain('0,00');
    const negative = formatCurrency(-50.25);
    expect(negative).toContain('50,25');
  });

  it('converts ISO YYYY-MM-DD to DD/MM/YYYY', () => {
    expect(formatDateBR('2026-09-24')).toBe('24/09/2026');
    expect(formatShortDateBR('2026-09-24')).toBe('24/09');
  });

  it('returns valid current month key in YYYY-MM format', () => {
    const monthKey = getCurrentMonthKey();
    expect(monthKey).toMatch(/^\d{4}-\d{2}$/);
  });

  it('returns valid today date string in YYYY-MM-DD format', () => {
    const today = getTodayDateString();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('translates month index to Portuguese correctly', () => {
    expect(getMonthNamePT(0)).toBe('Janeiro');
    expect(getMonthNamePT(8)).toBe('Setembro');
    expect(getMonthNamePT(11)).toBe('Dezembro');
  });

  it('formats YYYY-MM to readable month and year in Portuguese', () => {
    expect(formatMonthYearPT('2026-09')).toBe('Setembro de 2026');
  });

  it('parses formatted currency input string to float', () => {
    expect(parseCurrencyInput('1.500,50')).toBe(1500.5);
    expect(parseCurrencyInput('R$ 250,00')).toBe(250);
  });
});
