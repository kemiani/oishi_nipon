// ========================================
// src/app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseHelpers } from '../../../lib/supabase';
import {
  generateWhatsAppMessage,
  generateWhatsAppUrl,
  normalizePhoneForWhatsApp,
} from '../../../lib/utils';
import type { OrderForm, CartItem, Order } from '../../../types';

/* ───────────────────────────────────────── GET ───────────────────────────────────────── */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit  = parseInt(searchParams.get('limit')  ?? '50', 10);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);
    const status = searchParams.get('status');

    const { data, error } = await supabaseHelpers.getOrders(limit, offset);
    if (error) {
      return NextResponse.json({ error: 'Error al obtener pedidos' }, { status: 500 });
    }

    // Filtrado opcional por estado
    const filteredData = status && status !== 'all'
      ? (data ?? []).filter(order => order.status === status)
      : data ?? [];

    return NextResponse.json({ data: filteredData });
  } catch (err) {
    console.error('Error en GET /api/orders:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

/* ───────────────────────────────────────── POST ───────────────────────────────────────── */
export async function POST(request: NextRequest) {
  try {
    /* ---------- 1. Parseo y validaciones básicas ---------- */
    const { orderForm, cartItems }: { orderForm: OrderForm; cartItems: CartItem[] } =
      await request.json();

    if (!orderForm.customer_name || !orderForm.customer_phone) {
      return NextResponse.json({ error: 'Faltan datos del cliente' }, { status: 400 });
    }
    if (!cartItems?.length) {
      return NextResponse.json({ error: 'El carrito está vacío' }, { status: 400 });
    }
    if (orderForm.delivery_type === 'delivery' && !orderForm.delivery_address) {
      return NextResponse.json({ error: 'Falta la dirección de entrega' }, { status: 400 });
    }

    /* ---------- 2. Cálculos de precios ---------- */
    const subtotal = cartItems.reduce((sum, { subtotal }) => sum + subtotal, 0);
    const { data: settings } = await supabaseHelpers.getRestaurantSettings();

    const deliveryCost =
      orderForm.delivery_type === 'delivery' && !settings?.is_delivery_free
        ? settings?.delivery_cost ?? 0
        : 0;

    const total = subtotal + deliveryCost;

    /* ---------- 3. Construcción segura de orderData ---------- */
    const orderData: Omit<Order, 'id' | 'created_at' | 'updated_at'> = {
      customer_name: orderForm.customer_name.trim(),
      customer_phone: normalizePhoneForWhatsApp(orderForm.customer_phone),
      delivery_type: orderForm.delivery_type,
      delivery_address:
        orderForm.delivery_type === 'delivery'
          ? orderForm.delivery_address?.trim() // string | undefined
          : undefined,
      payment_method: orderForm.payment_method,
      items: JSON.stringify(cartItems),
      subtotal,
      delivery_cost: deliveryCost,
      total,
      status: 'pending',
      notes: orderForm.notes?.trim() || undefined, // string | undefined
    };

    /* ---------- 4. Inserción en Supabase ---------- */
    const { data: order, error: orderError } = await supabaseHelpers.createOrder(orderData);
    if (orderError) {
      console.error('Error al crear pedido:', orderError);
      return NextResponse.json({ error: 'Error al crear el pedido' }, { status: 500 });
    }

    /* ---------- 5. Generación de links de WhatsApp ---------- */
    const orderViewUrl   = `${process.env.NEXT_PUBLIC_BASE_URL}/order-view/${order.id}`;
    const whatsappMsg    = generateWhatsAppMessage(
      orderForm.customer_name,
      cartItems,
      total,
      orderForm.delivery_type,
      orderForm.delivery_address,
      orderViewUrl,
    );
    const whatsappUrl    = generateWhatsAppUrl(
      settings?.whatsapp_number || settings?.phone || '',
      whatsappMsg,
    );

    /* ---------- 6. Respuesta ---------- */
    return NextResponse.json(
      { data: { order, whatsapp_url: whatsappUrl, order_view_url: orderViewUrl } },
      { status: 201 },
    );
  } catch (err) {
    console.error('Error en POST /api/orders:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
