import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Badge from '../../components/ui/Badge';

describe('Badge', () => {
  it('affiche le texte passé en children', () => {
    render(<Badge>Nouveau</Badge>);
    expect(screen.getByText('Nouveau')).toBeInTheDocument();
  });

  it('applique la variante accent par défaut', () => {
    const { container } = render(<Badge>Test</Badge>);
    expect(container.firstChild.className).toContain('accent');
  });

  it('applique la variante success', () => {
    const { container } = render(<Badge variant="success">En stock</Badge>);
    expect(container.firstChild.className).toContain('success');
  });

  it('applique la variante error', () => {
    const { container } = render(<Badge variant="error">Rupture</Badge>);
    expect(container.firstChild.className).toContain('error');
  });

  it('rend un élément span', () => {
    render(<Badge>Test</Badge>);
    expect(screen.getByText('Test').tagName).toBe('SPAN');
  });
});
