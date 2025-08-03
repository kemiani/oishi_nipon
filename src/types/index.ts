// src/types/index.ts

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url?: string;
  is_available: boolean;
  stock?: number;
  variations?: ProductVariation[];
  created_at: string;
  updated_at: string;
}

export interface ProductVariation {
  id: string;
  name: string; // ej: "Salsa extra", "Sin cebolla"
  type: 'addon' | 'removal' | 'option'; // agregar, quitar, opción
  price_change: number; // puede ser positivo (addon) o 0 (removal/option)
  is_required: boolean;
  options?: string[]; // para tipo 'option', ej: ["Pequeño", "Mediano", "Grande"]
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  selected_variations: SelectedVariation[];
  subtotal: number;
}

export interface SelectedVariation {
  variation_id: string;
  name: string;
  selected_option?: string; // para variaciones tipo 'option'
  price_change: number;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_type: 'delivery' | 'pickup';
  delivery_address?: string;
  payment_method: 'cash' | 'transfer';
  items: CartItem[];
  subtotal: number;
  delivery_cost: number;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface RestaurantSettings {
  id: string;
  name: string;
  phone: string;
  whatsapp_number: string;
  address: string;
  delivery_cost: number;
  is_delivery_free: boolean;
  opening_hours: OpeningHours;
  is_open: boolean;
  social_media: SocialMedia;
  created_at: string;
  updated_at: string;
}

export interface OpeningHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface DaySchedule {
  is_open: boolean;
  open_time?: string; // "09:00"
  close_time?: string; // "22:00"
}

export interface SocialMedia {
  instagram?: string;
  facebook?: string;
  website?: string;
}

export interface Category {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
}

// Tipos para formularios
export interface CreateProductForm {
  name: string;
  description: string;
  price: number;
  category: string;
  image_url?: string;
  stock?: number;
  variations?: Omit<ProductVariation, 'id'>[];
}

export interface OrderForm {
  customer_name: string;
  customer_phone: string;
  delivery_type: 'delivery' | 'pickup';
  delivery_address?: string;
  payment_method: 'cash' | 'transfer';
  notes?: string;
}

// Tipos para API responses
export interface ApiResponse<T> {
  data: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Tipos para analytics
export interface OrderStats {
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
  popular_products: Array<{
    product_id: string;
    product_name: string;
    order_count: number;
    revenue: number;
  }>;
  orders_by_day: Array<{
    date: string;
    count: number;
    revenue: number;
  }>;
  delivery_vs_pickup: {
    delivery: number;
    pickup: number;
  };
}

// Tipos para WhatsApp
export interface WhatsAppMessage {
  phone: string;
  message: string;
  order_url: string;
}