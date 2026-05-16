import { describe, it, expect } from 'vitest';
import { formatPrice } from '../../utils/formatPrice';

describe('formatPrice', () => {
  it('formate un entier en euros français', () => {
    const result = formatPrice(10);
    expect(result).toContain('10');
    expect(result).toContain('€');
  });

  it('formate un décimal avec deux chiffres après la virgule', () => {
    const result = formatPrice(49.99);
    expect(result).toContain('49');
    expect(result).toContain('99');
    expect(result).toContain('€');
  });

  it('formate zéro correctement', () => {
    const result = formatPrice(0);
    expect(result).toContain('0');
    expect(result).toContain('€');
  });

  it('formate un grand montant avec séparateur de milliers', () => {
    const result = formatPrice(1200);
    // format fr-FR : "1 200,00 €"
    expect(result).toContain('1');
    expect(result).toContain('200');
    expect(result).toContain('€');
  });
});
