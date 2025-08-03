// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper functions para operaciones comunes
export const supabaseHelpers = {
  // Productos
  async getProducts() {
    return await supabase
      .from('products')
      .select('*, variations:product_variations(*)')
      .eq('is_available', true)
      .order('name');
  },

  async getProductById(id: string) {
    return await supabase
      .from('products')
      .select('*, variations:product_variations(*)')
      .eq('id', id)
      .single();
  },

  async createProduct(product: any) {
    return await supabase
      .from('products')
      .insert([product])
      .select()
      .single();
  },

  async updateProduct(id: string, updates: any) {
    return await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
  },

  async deleteProduct(id: string) {
    return await supabase
      .from('products')
      .delete()
      .eq('id', id);
  },

  // Categorías
  async getCategories() {
    return await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order');
  },

  async createCategory(category: any) {
    return await supabase
      .from('categories')
      .insert([category])
      .select()
      .single();
  },

  // Pedidos
  async createOrder(order: any) {
    return await supabase
      .from('orders')
      .insert([order])
      .select()
      .single();
  },

  async getOrders(limit = 50, offset = 0) {
    return await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
  },

  async getOrderById(id: string) {
    return await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();
  },

  async updateOrderStatus(id: string, status: string) {
    return await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
  },

  // Configuración del restaurante
  async getRestaurantSettings() {
    return await supabase
      .from('restaurant_settings')
      .select('*')
      .single();
  },

  async updateRestaurantSettings(settings: any) {
    return await supabase
      .from('restaurant_settings')
      .upsert([settings])
      .select()
      .single();
  },

  // Analytics
  async getOrderStats(startDate?: string, endDate?: string) {
    let query = supabase
      .from('orders')
      .select('*');
    
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    return await query;
  }
};