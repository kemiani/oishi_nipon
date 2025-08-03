/* ------------------------------------------
 * Zustand store para el carrito
 * ------------------------------------------ */
import { create } from 'zustand';
import type { Product, Variation } from '../types';

/* Helpers */
const calcPrice = (p: Product, vars: Variation[]) =>
  vars.reduce((acc, v) => acc + (v.price_change ?? 0), p.price);

export interface CartItem {
  id: string;
  product: Product;
  selected_variations: Variation[];
  price: number;
  quantity: number;
  subtotal: number;
}

interface CartState {
  items: CartItem[];

  addItem: (p: Product, v: Variation[], q?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, q: number) => void;
  clearCart: () => void;

  getTotalItems: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  /* -------- acciones -------- */
  addItem: (product, variations, quantity = 1) =>
    set((state) => {
      const price = calcPrice(product, variations);

      // mismo producto + mismas variaciones → agrupar
      const found = state.items.find(
        (it) =>
          it.product.id === product.id &&
          JSON.stringify(it.selected_variations) === JSON.stringify(variations)
      );

      if (found) {
        return {
          items: state.items.map((it) =>
            it === found
              ? {
                  ...it,
                  quantity: it.quantity + quantity,
                  subtotal: (it.quantity + quantity) * it.price,
                }
              : it
          ),
        };
      }

      const newItem: CartItem = {
        id: crypto.randomUUID(),
        product,
        selected_variations: variations,
        price,
        quantity,
        subtotal: price * quantity,
      };

      return { items: [...state.items, newItem] };
    }),

  removeItem: (id) =>
    set((s) => ({ items: s.items.filter((it) => it.id !== id) })),

  updateQuantity: (id, quantity) =>
    set((s) => ({
      items: s.items.map((it) =>
        it.id === id ? { ...it, quantity, subtotal: it.price * quantity } : it
      ),
    })),

  clearCart: () => set({ items: [] }),

  /* -------- selectores -------- */
  getTotalItems: () => get().items.reduce((acc, it) => acc + it.quantity, 0),
  getSubtotal: () => get().items.reduce((acc, it) => acc + it.subtotal, 0),
}));
