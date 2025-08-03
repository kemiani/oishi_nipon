/* ------------------------------------------
 * Tipos globales de la aplicación
 * ------------------------------------------ */

export interface Category {
  id: string;
  name: string;
  display_order?: number;
  is_active: boolean;
}

export interface VariationOption {
  label: string;
  price_change?: number;            // Δ de precio si corresponde
}

export interface Variation {
  id?: string;
  product_id?: string;
  name: string;
  type: 'single' | 'multi';         // selección única o múltiple
  price_change: number;
  is_required: boolean;
  options?: VariationOption[];
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;                 // ← ID de la categoría (no categoryId)
  image_url?: string | null;
  is_available: boolean;
  variations?: Variation[];
}

export interface CartItem {
  id: string;
  product: Product;
  selected_variations: Variation[];
  price: number;                    // precio base + variaciones
  quantity: number;
  subtotal: number;
}

export interface RestaurantSettings {
  is_delivery_free: boolean;
  delivery_cost: number;
  /* otras flags que vengan de la BD */
}

export interface OrderForm {
  customer_name: string;
  customer_phone: string;
  delivery_type: 'delivery' | 'pickup';
  delivery_address?: string;
  payment_method: 'cash' | 'transfer';
  notes?: string;
}
