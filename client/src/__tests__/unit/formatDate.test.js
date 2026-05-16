import { describe, it, expect } from 'vitest';
import { formatDate } from '../../utils/formatDate';

describe('formatDate', () => {
  it('formate une date ISO en français', () => {
    const result = formatDate('2024-03-15');
    expect(result).toContain('2024');
    expect(result).toContain('15');
  });

  it('inclut le mois en toutes lettres', () => {
    const result = formatDate('2024-03-15');
    expect(result).toMatch(/mars/i);
  });

  it('formate janvier correctement', () => {
    const result = formatDate('2024-01-01');
    expect(result).toMatch(/janvier/i);
  });

  it('formate décembre correctement', () => {
    const result = formatDate('2024-12-31');
    expect(result).toMatch(/décembre/i);
    expect(result).toContain('31');
  });

  it('retourne une chaîne non vide pour une date valide', () => {
    const result = formatDate('2023-06-20');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});
