// src/store/cartStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product, SelectedVariation } from '@/types';

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  
  // Actions
  addItem: (product: Product, selectedVariations: SelectedVariation[], quantity?: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  
  // Computed values
  getTotalItems: () => number;
  getSubtotal: () => number;
  getTotal: (deliveryCost?: number) => number;
}

const calculateItemSubtotal = (product: Product, selectedVariations: SelectedVariation[], quantity: number): number => {
  const basePrice = product.price;
  const variationsTotal = selectedVariations.reduce((sum, variation) => sum + variation.price_change, 0);
  return (basePrice + variationsTotal) * quantity;
};

const generateCartItemId = (product: Product, selectedVariations: SelectedVariation[]): string => {
  const variationsKey = selectedVariations
    .map(v => `${v.variation_id}-${v.selected_option || ''}`)
    .sort()
    .join('|');
  return `${product.id}-${variationsKey}`;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product: Product, selectedVariations: SelectedVariation[], quantity = 1) => {
        const itemId = generateCartItemId(product, selectedVariations);
        const subtotal = calculateItemSubtotal(product, selectedVariations, quantity);
        
        set((state) => {
          const existingItemIndex = state.items.findIndex(item => item.id === itemId);
          
          if (existingItemIndex >= 0) {
            // Si el item ya existe, actualizar cantidad
            const updatedItems = [...state.items];
            const existingItem = updatedItems[existingItemIndex];
            const newQuantity = existingItem.quantity + quantity;
            
            updatedItems[existingItemIndex] = {
              ...existingItem,
              quantity: newQuantity,
              subtotal: calculateItemSubtotal(product, selectedVariations, newQuantity)
            };
            
            return { items: updatedItems };
          } else {
            // Si es un nuevo item, agregarlo
            const newItem: CartItem = {
              id: itemId,
              product,
              quantity,
              selected_variations: selectedVariations,
              subtotal
            };
            
            return { items: [...state.items, newItem] };
          }
        });
      },

      removeItem: (itemId: string) => {
        set((state) => ({
          items: state.items.filter(item => item.id !== itemId)
        }));
      },

      updateQuantity: (itemId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }

        set((state) => ({
          items: state.items.map(item => {
            if (item.id === itemId) {
              return {
                ...item,
                quantity,
                subtotal: calculateItemSubtotal(item.product, item.selected_variations, quantity)
              };
            }
            return item;
          })
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      toggleCart: () => {
        set((state) => ({ isOpen: !state.isOpen }));
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce((total, item) => total + item.subtotal, 0);
      },

      getTotal: (deliveryCost = 0) => {
        return get().getSubtotal() + deliveryCost;
      }
    }),
    {
      name: 'oishi-nipon-cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
);