import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import { CartProvider, useCart } from '../../context/CartContext';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const ITEM = { id: 1, name: 'Casque Audio', price: '49.99', weight: '0.3' };
const ITEM_B = { id: 2, name: 'Clavier', price: '79.99', weight: '0.8' };

// Composant utilitaire pour lire le contexte dans les tests
let cartRef = {};
const CartConsumer = () => {
  const cart = useCart();
  cartRef = cart;
  return null;
};

const renderCart = () => {
  render(
    <CartProvider>
      <CartConsumer />
    </CartProvider>
  );
};

beforeEach(() => {
  localStorageMock.clear();
  cartRef = {};
});

describe('CartContext — addItem', () => {
  it('ajoute un article au panier', async () => {
    renderCart();
    await act(async () => { cartRef.addItem(ITEM); });
    expect(cartRef.items).toHaveLength(1);
    expect(cartRef.items[0]).toMatchObject({ id: 1, quantity: 1 });
  });

  it('incrémente la quantité si l\'article est déjà présent', async () => {
    renderCart();
    await act(async () => { cartRef.addItem(ITEM); });
    await act(async () => { cartRef.addItem(ITEM); });
    expect(cartRef.items).toHaveLength(1);
    expect(cartRef.items[0].quantity).toBe(2);
  });
});

describe('CartContext — removeItem', () => {
  it('supprime un article du panier', async () => {
    renderCart();
    await act(async () => { cartRef.addItem(ITEM); });
    await act(async () => { cartRef.removeItem(1); });
    expect(cartRef.items).toHaveLength(0);
  });
});

describe('CartContext — updateQuantity', () => {
  it('met à jour la quantité d\'un article', async () => {
    renderCart();
    await act(async () => { cartRef.addItem(ITEM); });
    await act(async () => { cartRef.updateQuantity(1, 5); });
    expect(cartRef.items[0].quantity).toBe(5);
  });

  it('supprime l\'article si quantité passe à 0', async () => {
    renderCart();
    await act(async () => { cartRef.addItem(ITEM); });
    await act(async () => { cartRef.updateQuantity(1, 0); });
    expect(cartRef.items).toHaveLength(0);
  });
});

describe('CartContext — clearCart', () => {
  it('vide le panier', async () => {
    renderCart();
    await act(async () => { cartRef.addItem(ITEM); cartRef.addItem(ITEM_B); });
    await act(async () => { cartRef.clearCart(); });
    expect(cartRef.items).toHaveLength(0);
  });
});

describe('CartContext — totalItems et totalPrice', () => {
  it('calcule le nombre total d\'articles', async () => {
    renderCart();
    await act(async () => { cartRef.addItem({ ...ITEM, quantity: 2 }); });
    await act(async () => { cartRef.addItem(ITEM_B); });
    expect(cartRef.totalItems).toBe(3);
  });

  it('calcule le prix total', async () => {
    renderCart();
    await act(async () => { cartRef.addItem({ ...ITEM, quantity: 2 }); });
    // 2 × 49.99 = 99.98
    expect(cartRef.totalPrice).toBeCloseTo(99.98, 2);
  });
});

describe('CartContext — persistance localStorage', () => {
  it('sauvegarde le panier dans localStorage', async () => {
    renderCart();
    await act(async () => { cartRef.addItem(ITEM); });
    const stored = JSON.parse(localStorageMock.getItem('rifline_cart'));
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe(1);
  });
});
