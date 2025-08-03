// src/app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseHelpers } from '@/lib/supabase';
import { generateWhatsAppMessage, generateWhatsAppUrl, normalizePhoneForWhatsApp } from '@/lib/utils';
import type { OrderForm, CartItem } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');

    let { data, error } = await supabaseHelpers.getOrders(limit, offset);

    if (error) {
      return NextResponse.json(
        { error: 'Error al obtener pedidos' },
        { status: 500 }
      );
    }

    // Filtrar por status si se especifica
    if (status && status !== 'all') {
      data = data?.filter(order => order.status === status) || [];
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error('Error en GET /api/orders:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderForm, cartItems }: { orderForm: OrderForm; cartItems: CartItem[] } = body;

    // Validaciones básicas
    if (!orderForm.customer_name || !orderForm.customer_phone) {
      return NextResponse.json(
        { error: 'Faltan datos del cliente' },
        { status: 400 }
      );
    }

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json(
        { error: 'El carrito está vacío' },
        { status: 400 }
      );
    }

    if (orderForm.delivery_type === 'delivery' && !orderForm.delivery_address) {
      return NextResponse.json(
        { error: 'Falta la dirección de entrega' },
        { status: 400 }
      );
    }

    // Calcular totales
    const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
    
    // Obtener configuración del restaurante para costo de envío
    const { data: settings } = await supabaseHelpers.getRestaurantSettings();
    const deliveryCost = orderForm.delivery_type === 'delivery' && !settings?.is_delivery_free 
      ? settings?.delivery_cost || 0 
      : 0;
    
    const total = subtotal + deliveryCost;

    // Crear el pedido
    const orderData = {
      customer_name: orderForm.customer_name.trim(),
      customer_phone: normalizePhoneForWhatsApp(orderForm.customer_phone),
      delivery_type: orderForm.delivery_type,
      delivery_address: orderForm.delivery_address?.trim() || null,
      payment_method: orderForm.payment_method,
      items: JSON.stringify(cartItems),
      subtotal,
      delivery_cost: deliveryCost,
      total,
      status: 'pending',
      notes: orderForm.notes?.trim() || null,
    };

    const { data: order, error: orderError } = await supabaseHelpers.createOrder(orderData);

    if (orderError) {
      console.error('Error al crear pedido:', orderError);
      return NextResponse.json(
        { error: 'Error al crear el pedido' },
        { status: 500 }
      );
    }

    // Generar URL del pedido para el dueño
    const orderViewUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/order-view/${order.id}`;

    // Generar mensaje de WhatsApp
    const whatsappMessage = generateWhatsAppMessage(
      orderForm.customer_name,
      cartItems,
      total,
      orderForm.delivery_type,
      orderForm.delivery_address,
      orderViewUrl
    );

    // Generar URL de WhatsApp
    const whatsappUrl = generateWhatsAppUrl(
      settings?.whatsapp_number || settings?.phone || '',
      whatsappMessage
    );

    return NextResponse.json({
      data: {
        order,
        whatsapp_url: whatsappUrl,
        order_view_url: orderViewUrl
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error en POST /api/orders:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}