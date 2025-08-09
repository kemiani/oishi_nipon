// src/app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseHelpers } from '../../../lib/supabase';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import {
  generateWhatsAppMessage,
  generateWhatsAppUrl,
  normalizePhoneForWhatsApp,
} from '../../../lib/utils';
import { validators } from '../../../lib/validators';
import type { OrderForm, CartItem, Order } from '../../../types';

// Helper para verificar auth
async function getSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll().map(({ name, value }) => ({ name, value })),
        setAll: () => {}
      }
    }
  );
}

// Rate limiting simple en memoria
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(ip);
  
  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + 60000 }); // 1 minuto
    return true;
  }
  
  if (limit.count >= 10) { // Max 10 requests por minuto
    return false;
  }
  
  limit.count++;
  return true;
}

// GET - Solo admin puede ver pedidos
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar rol admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '50', 10));
    const offset = Math.max(0, parseInt(searchParams.get('offset') ?? '0', 10));
    const status = searchParams.get('status');

    const { data, error } = await supabaseHelpers.getOrders(limit, offset);
    
    if (error) {
      return NextResponse.json({ error: 'Error al obtener pedidos' }, { status: 500 });
    }

    // Filtrado opcional por estado
    let filteredData = data ?? [];
    if (status && ['pending', 'confirmed', 'preparing', 'delivered', 'cancelled'].includes(status)) {
      filteredData = filteredData.filter(order => order.status === status);
    }

    return NextResponse.json({ data: filteredData });
  } catch (err) {
    console.error('Error en GET /api/orders:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST - Crear pedido (público pero con rate limiting)
export async function POST(request: NextRequest) {
  try {
    // Rate limiting por IP
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intenta en un minuto.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { orderForm, cartItems }: { orderForm: OrderForm; cartItems: CartItem[] } = body;

    // Validaciones básicas
    if (!orderForm || !cartItems) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    // Validar nombre
    if (!orderForm.customer_name || orderForm.customer_name.length < 2 || orderForm.customer_name.length > 100) {
      return NextResponse.json({ error: 'Nombre inválido (2-100 caracteres)' }, { status: 400 });
    }

    // Validar teléfono
    if (!orderForm.customer_phone || orderForm.customer_phone.length < 8 || orderForm.customer_phone.length > 20) {
      return NextResponse.json({ error: 'Teléfono inválido' }, { status: 400 });
    }

    // Validar carrito
    if (!Array.isArray(cartItems) || cartItems.length === 0 || cartItems.length > 50) {
      return NextResponse.json({ error: 'Carrito inválido (1-50 items)' }, { status: 400 });
    }

    // Validar tipo de entrega
    if (!['delivery', 'pickup'].includes(orderForm.delivery_type)) {
      return NextResponse.json({ error: 'Tipo de entrega inválido' }, { status: 400 });
    }

    // Validar dirección si es delivery
    if (orderForm.delivery_type === 'delivery') {
      if (!orderForm.delivery_address || orderForm.delivery_address.length < 5 || orderForm.delivery_address.length > 200) {
        return NextResponse.json({ error: 'Dirección inválida (5-200 caracteres)' }, { status: 400 });
      }
    }

    // Validar método de pago
    if (!['cash', 'transfer'].includes(orderForm.payment_method)) {
      return NextResponse.json({ error: 'Método de pago inválido' }, { status: 400 });
    }

    // Validar items del carrito y calcular totales
    let subtotal = 0;
    for (const item of cartItems) {
      if (!item.product?.id || !validators.isValidUUID(item.product.id)) {
        return NextResponse.json({ error: 'Producto inválido en el carrito' }, { status: 400 });
      }
      
      if (!item.quantity || item.quantity < 1 || item.quantity > 99) {
        return NextResponse.json({ error: 'Cantidad inválida (1-99)' }, { status: 400 });
      }

      if (!item.subtotal || item.subtotal < 0 || item.subtotal > 999999) {
        return NextResponse.json({ error: 'Subtotal inválido' }, { status: 400 });
      }

      subtotal += item.subtotal;
    }

    // Verificar que el subtotal sea razonable
    if (subtotal < 1 || subtotal > 999999) {
      return NextResponse.json({ error: 'Total del pedido fuera de rango' }, { status: 400 });
    }

    // Obtener configuración del restaurante
    const { data: settings } = await supabaseHelpers.getRestaurantSettings();

    const deliveryCost = orderForm.delivery_type === 'delivery' && !settings?.is_delivery_free
      ? settings?.delivery_cost ?? 0
      : 0;

    const total = subtotal + deliveryCost;

    // Sanitizar datos
    const orderData: Omit<Order, 'id' | 'created_at' | 'updated_at'> = {
      customer_name: validators.sanitizeString(orderForm.customer_name).slice(0, 100),
      customer_phone: validators.sanitizePhone(orderForm.customer_phone).slice(0, 20),
      delivery_type: orderForm.delivery_type,
      delivery_address: orderForm.delivery_type === 'delivery'
        ? validators.sanitizeString(orderForm.delivery_address || '').slice(0, 200)
        : undefined,
      payment_method: orderForm.payment_method,
      items: JSON.stringify(cartItems.map(item => ({
        product_id: item.product.id,
        product_name: validators.sanitizeString(item.product.name),
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
        variations: item.selected_variations || []
      }))),
      subtotal,
      delivery_cost: deliveryCost,
      total,
      status: 'pending',
      notes: orderForm.notes ? validators.sanitizeString(orderForm.notes).slice(0, 500) : undefined,
    };

    // Crear pedido
    const { data: order, error: orderError } = await supabaseHelpers.createOrder(orderData);
    
    if (orderError || !order) {
      console.error('Error al crear pedido:', orderError);
      return NextResponse.json({ error: 'Error al crear el pedido' }, { status: 500 });
    }

    // Generar links de WhatsApp
    const orderViewUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://oishinipon.com'}/order-view/${order.id}`;
    const whatsappMsg = generateWhatsAppMessage(
      orderForm.customer_name,
      cartItems,
      total,
      orderForm.delivery_type,
      orderForm.delivery_address,
      orderViewUrl
    );
    const whatsappUrl = generateWhatsAppUrl(
      settings?.whatsapp_number || settings?.phone || '',
      whatsappMsg
    );

    return NextResponse.json(
      { 
        data: { 
          order: {
            id: order.id,
            status: order.status,
            total: order.total,
            created_at: order.created_at
          },
          whatsapp_url: whatsappUrl,
          order_view_url: orderViewUrl
        }
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('Error en POST /api/orders:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PUT - Actualizar estado del pedido (solo admin)
export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticación y admin
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');
    
    if (!orderId || !validators.isValidUUID(orderId)) {
      return NextResponse.json({ error: 'ID de pedido inválido' }, { status: 400 });
    }

    const body = await request.json();
    const validStatuses = ['pending', 'confirmed', 'preparing', 'delivered', 'cancelled'];
    
    if (!body.status || !validStatuses.includes(body.status)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
    }

    const { data, error } = await supabaseHelpers.updateOrderStatus(orderId, body.status);

    if (error) {
      return NextResponse.json({ error: 'Error al actualizar pedido' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error en PUT /api/orders:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}