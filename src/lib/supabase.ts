// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import type { 
  Product, 
  Category, 
  Order, 
  RestaurantSettings,
} from '../types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Tipos específicos para las respuestas de la base de datos
interface DatabaseProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

interface DatabaseCategory {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

interface DatabaseOrder {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_type: 'delivery' | 'pickup';
  delivery_address: string | null;
  payment_method: 'cash' | 'transfer';
  items: string;
  subtotal: number;
  delivery_cost: number;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'delivered' | 'cancelled';
  notes: string | null;
  created_at: string;
  updated_at: string | null;
}

interface ProductVariation {
  id: string;
  product_id: string;
  name: string;
  type: 'single' | 'multi';
  price_change: number;
  is_required: boolean;
  options: Record<string, unknown> | null;
}

// Helper functions para operaciones comunes
export const supabaseHelpers = {
  // Productos
  async getProducts() {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        variations:product_variations(*)
      `)
      .eq('is_available', true)
      .order('name');

    if (error) {
      return { data: null, error };
    }

    // Transformar los datos al formato esperado
    const products: Product[] = (data as (DatabaseProduct & { variations: ProductVariation[] })[])?.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description || undefined,
      price: item.price,
      category: item.category,
      image_url: item.image_url,
      is_available: item.is_available,
      variations: item.variations?.map(v => ({
        id: v.id,
        product_id: v.product_id,
        name: v.name,
        type: v.type,
        price_change: v.price_change,
        is_required: v.is_required,
        options: v.options ? JSON.parse(JSON.stringify(v.options)) : []
      })) || []
    })) || [];

    return { data: products, error: null };
  },

  async getProductById(id: string) {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        variations:product_variations(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      return { data: null, error };
    }

    const dbProduct = data as DatabaseProduct & { variations: ProductVariation[] };
    
    const product: Product = {
      id: dbProduct.id,
      name: dbProduct.name,
      description: dbProduct.description || undefined,
      price: dbProduct.price,
      category: dbProduct.category,
      image_url: dbProduct.image_url,
      is_available: dbProduct.is_available,
      variations: dbProduct.variations?.map(v => ({
        id: v.id,
        product_id: v.product_id,
        name: v.name,
        type: v.type,
        price_change: v.price_change,
        is_required: v.is_required,
        options: v.options ? JSON.parse(JSON.stringify(v.options)) : []
      })) || []
    };

    return { data: product, error: null };
  },

  async createProduct(productData: Omit<Product, 'id' | 'variations'>) {
    const { data, error } = await supabase
      .from('products')
      .insert([{
        name: productData.name,
        description: productData.description || null,
        price: productData.price,
        category: productData.category,
        image_url: productData.image_url || null,
        is_available: productData.is_available
      }])
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    const dbProduct = data as DatabaseProduct;
    const product: Product = {
      id: dbProduct.id,
      name: dbProduct.name,
      description: dbProduct.description || undefined,
      price: dbProduct.price,
      category: dbProduct.category,
      image_url: dbProduct.image_url,
      is_available: dbProduct.is_available,
      variations: []
    };

    return { data: product, error: null };
  },

  async updateProduct(id: string, updates: Partial<Omit<Product, 'id' | 'variations'>>) {
    const { data, error } = await supabase
      .from('products')
      .update({
        name: updates.name,
        description: updates.description || null,
        price: updates.price,
        category: updates.category,
        image_url: updates.image_url || null,
        is_available: updates.is_available
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    const dbProduct = data as DatabaseProduct;
    const product: Product = {
      id: dbProduct.id,
      name: dbProduct.name,
      description: dbProduct.description || undefined,
      price: dbProduct.price,
      category: dbProduct.category,
      image_url: dbProduct.image_url,
      is_available: dbProduct.is_available,
      variations: []
    };

    return { data: product, error: null };
  },

  async deleteProduct(id: string) {
    return await supabase
      .from('products')
      .delete()
      .eq('id', id);
  },

  // Categorías
  async getCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (error) {
      return { data: null, error };
    }

    const categories: Category[] = (data as DatabaseCategory[])?.map(item => ({
      id: item.id,
      name: item.name,
      display_order: item.display_order,
      is_active: item.is_active
    })) || [];

    return { data: categories, error: null };
  },

  async createCategory(categoryData: Omit<Category, 'id'>) {
    const { data, error } = await supabase
      .from('categories')
      .insert([{
        name: categoryData.name,
        display_order: categoryData.display_order || 0,
        is_active: categoryData.is_active
      }])
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    const dbCategory = data as DatabaseCategory;
    const category: Category = {
      id: dbCategory.id,
      name: dbCategory.name,
      display_order: dbCategory.display_order,
      is_active: dbCategory.is_active
    };

    return { data: category, error: null };
  },

  // Pedidos - CORREGIDO para manejar undefined/null correctamente
  async createOrder(orderData: Omit<Order, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('orders')
      .insert([{
        customer_name: orderData.customer_name,
        customer_phone: orderData.customer_phone,
        delivery_type: orderData.delivery_type,
        delivery_address: orderData.delivery_address || null, // Convertir undefined a null para la DB
        payment_method: orderData.payment_method,
        items: orderData.items,
        subtotal: orderData.subtotal,
        delivery_cost: orderData.delivery_cost,
        total: orderData.total,
        status: orderData.status,
        notes: orderData.notes || null // Convertir undefined a null para la DB
      }])
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    const dbOrder = data as DatabaseOrder;
    const order: Order = {
      id: dbOrder.id,
      customer_name: dbOrder.customer_name,
      customer_phone: dbOrder.customer_phone,
      delivery_type: dbOrder.delivery_type,
      delivery_address: dbOrder.delivery_address || undefined, // Convertir null a undefined para el tipo
      payment_method: dbOrder.payment_method,
      items: dbOrder.items,
      subtotal: dbOrder.subtotal,
      delivery_cost: dbOrder.delivery_cost,
      total: dbOrder.total,
      status: dbOrder.status,
      notes: dbOrder.notes || undefined, // Convertir null a undefined para el tipo
      created_at: dbOrder.created_at,
      updated_at: dbOrder.updated_at || undefined
    };

    return { data: order, error: null };
  },

  async getOrders(limit = 50, offset = 0) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return { data: null, error };
    }

    const orders: Order[] = (data as DatabaseOrder[])?.map(item => ({
      id: item.id,
      customer_name: item.customer_name,
      customer_phone: item.customer_phone,
      delivery_type: item.delivery_type,
      delivery_address: item.delivery_address || undefined,
      payment_method: item.payment_method,
      items: item.items,
      subtotal: item.subtotal,
      delivery_cost: item.delivery_cost,
      total: item.total,
      status: item.status,
      notes: item.notes || undefined,
      created_at: item.created_at,
      updated_at: item.updated_at || undefined
    })) || [];

    return { data: orders, error: null };
  },

  async getOrderById(id: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return { data: null, error };
    }

    const dbOrder = data as DatabaseOrder;
    const order: Order = {
      id: dbOrder.id,
      customer_name: dbOrder.customer_name,
      customer_phone: dbOrder.customer_phone,
      delivery_type: dbOrder.delivery_type,
      delivery_address: dbOrder.delivery_address || undefined,
      payment_method: dbOrder.payment_method,
      items: dbOrder.items,
      subtotal: dbOrder.subtotal,
      delivery_cost: dbOrder.delivery_cost,
      total: dbOrder.total,
      status: dbOrder.status,
      notes: dbOrder.notes || undefined,
      created_at: dbOrder.created_at,
      updated_at: dbOrder.updated_at || undefined
    };

    return { data: order, error: null };
  },

  async updateOrderStatus(id: string, status: Order['status']) {
    const { data, error } = await supabase
      .from('orders')
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    const dbOrder = data as DatabaseOrder;
    const order: Order = {
      id: dbOrder.id,
      customer_name: dbOrder.customer_name,
      customer_phone: dbOrder.customer_phone,
      delivery_type: dbOrder.delivery_type,
      delivery_address: dbOrder.delivery_address || undefined,
      payment_method: dbOrder.payment_method,
      items: dbOrder.items,
      subtotal: dbOrder.subtotal,
      delivery_cost: dbOrder.delivery_cost,
      total: dbOrder.total,
      status: dbOrder.status,
      notes: dbOrder.notes || undefined,
      created_at: dbOrder.created_at,
      updated_at: dbOrder.updated_at || undefined
    };

    return { data: order, error: null };
  },

  // Configuración del restaurante
  async getRestaurantSettings() {
    const { data, error } = await supabase
      .from('restaurant_settings')
      .select('*')
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: data as RestaurantSettings, error: null };
  },

  async updateRestaurantSettings(settings: Partial<RestaurantSettings>) {
    const { data, error } = await supabase
      .from('restaurant_settings')
      .upsert([settings])
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: data as RestaurantSettings, error: null };
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

    const { data, error } = await query;

    if (error) {
      return { data: null, error };
    }

    const orders: Order[] = (data as DatabaseOrder[])?.map(item => ({
      id: item.id,
      customer_name: item.customer_name,
      customer_phone: item.customer_phone,
      delivery_type: item.delivery_type,
      delivery_address: item.delivery_address || undefined,
      payment_method: item.payment_method,
      items: item.items,
      subtotal: item.subtotal,
      delivery_cost: item.delivery_cost,
      total: item.total,
      status: item.status,
      notes: item.notes || undefined,
      created_at: item.created_at,
      updated_at: item.updated_at || undefined
    })) || [];

    return { data: orders, error: null };
  }
};