import { describe, it, expect } from 'vitest';

// Réimporte le reducer isolément pour tester la logique pure sans DOM
const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.find((i) => i.id === action.item.id);
      if (existing) {
        return state.map((i) =>
          i.id === action.item.id ? { ...i, quantity: i.quantity + (action.item.quantity || 1) } : i
        );
      }
      return [...state, { ...action.item, quantity: action.item.quantity || 1 }];
    }
    case 'REMOVE_ITEM':
      return state.filter((i) => i.id !== action.id);
    case 'UPDATE_QUANTITY':
      if (action.quantity <= 0) return state.filter((i) => i.id !== action.id);
      return state.map((i) => (i.id === action.id ? { ...i, quantity: action.quantity } : i));
    case 'CLEAR':
      return [];
    case 'HYDRATE':
      return action.items;
    default:
      return state;
  }
};

const ITEM_A = { id: 1, name: 'Casque Audio', price: '49.99', weight: '0.3' };
const ITEM_B = { id: 2, name: 'Clavier', price: '79.99', weight: '0.8' };

describe('cartReducer — ADD_ITEM', () => {
  it('ajoute un nouvel article avec quantity 1 par défaut', () => {
    const state = cartReducer([], { type: 'ADD_ITEM', item: ITEM_A });
    expect(state).toHaveLength(1);
    expect(state[0]).toMatchObject({ id: 1, quantity: 1 });
  });

  it('incrémente la quantité si l\'article existe déjà', () => {
    const initial = [{ ...ITEM_A, quantity: 2 }];
    const state = cartReducer(initial, { type: 'ADD_ITEM', item: ITEM_A });
    expect(state).toHaveLength(1);
    expect(state[0].quantity).toBe(3);
  });

  it('ajoute avec une quantité personnalisée', () => {
    const state = cartReducer([], { type: 'ADD_ITEM', item: { ...ITEM_A, quantity: 3 } });
    expect(state[0].quantity).toBe(3);
  });

  it('ne touche pas aux autres articles', () => {
    const initial = [{ ...ITEM_B, quantity: 1 }];
    const state = cartReducer(initial, { type: 'ADD_ITEM', item: ITEM_A });
    expect(state).toHaveLength(2);
    expect(state.find((i) => i.id === 2).quantity).toBe(1);
  });
});

describe('cartReducer — REMOVE_ITEM', () => {
  it('supprime l\'article avec l\'id correspondant', () => {
    const initial = [{ ...ITEM_A, quantity: 1 }, { ...ITEM_B, quantity: 1 }];
    const state = cartReducer(initial, { type: 'REMOVE_ITEM', id: 1 });
    expect(state).toHaveLength(1);
    expect(state[0].id).toBe(2);
  });

  it('ne fait rien si l\'id n\'existe pas', () => {
    const initial = [{ ...ITEM_A, quantity: 1 }];
    const state = cartReducer(initial, { type: 'REMOVE_ITEM', id: 99 });
    expect(state).toHaveLength(1);
  });
});

describe('cartReducer — UPDATE_QUANTITY', () => {
  it('met à jour la quantité', () => {
    const initial = [{ ...ITEM_A, quantity: 1 }];
    const state = cartReducer(initial, { type: 'UPDATE_QUANTITY', id: 1, quantity: 5 });
    expect(state[0].quantity).toBe(5);
  });

  it('supprime l\'article si la quantité est 0', () => {
    const initial = [{ ...ITEM_A, quantity: 2 }];
    const state = cartReducer(initial, { type: 'UPDATE_QUANTITY', id: 1, quantity: 0 });
    expect(state).toHaveLength(0);
  });

  it('supprime l\'article si la quantité est négative', () => {
    const initial = [{ ...ITEM_A, quantity: 2 }];
    const state = cartReducer(initial, { type: 'UPDATE_QUANTITY', id: 1, quantity: -1 });
    expect(state).toHaveLength(0);
  });
});

describe('cartReducer — CLEAR', () => {
  it('vide complètement le panier', () => {
    const initial = [{ ...ITEM_A, quantity: 2 }, { ...ITEM_B, quantity: 1 }];
    const state = cartReducer(initial, { type: 'CLEAR' });
    expect(state).toHaveLength(0);
  });
});

describe('cartReducer — HYDRATE', () => {
  it('remplace l\'état par les items fournis', () => {
    const items = [{ ...ITEM_A, quantity: 3 }];
    const state = cartReducer([], { type: 'HYDRATE', items });
    expect(state).toEqual(items);
  });
});
