import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../../components/ui/Button';

describe('Button', () => {
  it('affiche le texte passé en children', () => {
    render(<Button>Ajouter au panier</Button>);
    expect(screen.getByText('Ajouter au panier')).toBeInTheDocument();
  });

  it('appelle onClick au clic', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Cliquer</Button>);
    fireEvent.click(screen.getByText('Cliquer'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('ne déclenche pas onClick si disabled', () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Désactivé</Button>);
    fireEvent.click(screen.getByText('Désactivé'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applique la variante primary par défaut', () => {
    const { container } = render(<Button>Valider</Button>);
    expect(container.firstChild.className).toContain('primary');
  });

  it('applique la variante ghost', () => {
    const { container } = render(<Button variant="ghost">Annuler</Button>);
    expect(container.firstChild.className).toContain('ghost');
  });

  it('applique fullWidth quand prop fournie', () => {
    const { container } = render(<Button fullWidth>Pleine largeur</Button>);
    expect(container.firstChild.className).toContain('full');
  });

  it('a l\'attribut type="submit" quand spécifié', () => {
    render(<Button type="submit">Envoyer</Button>);
    expect(screen.getByText('Envoyer').type).toBe('submit');
  });
});
