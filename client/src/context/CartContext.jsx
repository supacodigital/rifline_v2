import { createContext, useContext, useReducer, useEffect, useState } from 'react';

const CartContext = createContext(null);

const STORAGE_KEY = 'rifline_cart';

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

export const CartProvider = ({ children }) => {
  const [items, dispatch] = useReducer(cartReducer, []);
  const [hydrated, setHydrated] = useState(false);

  // Hydratation depuis localStorage au montage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        dispatch({ type: 'HYDRATE', items: JSON.parse(stored) });
      }
    } catch {
      // localStorage corrompu, on ignore
    } finally {
      setHydrated(true);
    }
  }, []);

  // Synchronisation vers localStorage — uniquement après hydratation
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = (item) => dispatch({ type: 'ADD_ITEM', item });
  const removeItem = (id) => dispatch({ type: 'REMOVE_ITEM', id });
  const updateQuantity = (id, quantity) => dispatch({ type: 'UPDATE_QUANTITY', id, quantity });
  const clearCart = () => dispatch({ type: 'CLEAR' });

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0);
  const totalWeight = items.reduce((sum, i) => sum + parseFloat(i.weight || 0) * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, hydrated, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice, totalWeight }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart doit être utilisé dans CartProvider');
  return ctx;
};
