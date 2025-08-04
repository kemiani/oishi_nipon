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
  price_change?: number;
}

export interface Variation {
  id?: string;
  product_id?: string;
  name: string;
  type: 'single' | 'multi';
  price_change: number;
  is_required: boolean;
  options?: VariationOption[];
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  image_url?: string | null;
  is_available: boolean;
  variations?: Variation[];
}

export interface CartItem {
  id: string;
  product: Product;
  selected_variations: Variation[];
  price: number;
  quantity: number;
  subtotal: number;
}

interface DaySchedule {
  is_open: boolean;
  open_time?: string;
  close_time?: string;
}

export interface RestaurantSettings {
  id?: string;
  name: string;
  phone: string;
  whatsapp_number: string;
  address: string;
  is_delivery_free: boolean;
  delivery_cost: number;
  opening_hours: {
    monday: DaySchedule;
    tuesday: DaySchedule;
    wednesday: DaySchedule;
    thursday: DaySchedule;
    friday: DaySchedule;
    saturday: DaySchedule;
    sunday: DaySchedule;
  };
  is_open: boolean;
  social_media?: Record<string, string>;
}

export interface OrderForm {
  customer_name: string;
  customer_phone: string;
  delivery_type: 'delivery' | 'pickup';
  delivery_address?: string;
  payment_method: 'cash' | 'transfer';
  notes?: string;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_type: 'delivery' | 'pickup';
  delivery_address?: string;
  payment_method: 'cash' | 'transfer';
  items: string;
  subtotal: number;
  delivery_cost: number;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'delivered' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface CreateProductForm {
  name: string;
  description?: string;
  price: number;
  category: string;
  category_id?: string;
  image_url?: string;
  stock?: number;
  is_available?: boolean;
  variations?: Variation[];
}