
// ========================================
// src/app/api/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseHelpers } from '../../../lib/supabase';
import { normalizePhoneForWhatsApp } from '../../../lib/utils';
import type { RestaurantSettings } from '../../../types';

export async function GET() {
  try {
    const { data, error } = await supabaseHelpers.getRestaurantSettings();

    if (error) {
      return NextResponse.json(
        { error: 'Error al obtener configuración' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error en GET /api/settings:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Validaciones básicas
    if (!body.name || !body.phone || !body.whatsapp_number || !body.address) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Normalizar números de teléfono
    const normalizedPhone = normalizePhoneForWhatsApp(body.phone);
    const normalizedWhatsApp = normalizePhoneForWhatsApp(body.whatsapp_number);

    // Validar horarios de atención
    if (!body.opening_hours || typeof body.opening_hours !== 'object') {
      return NextResponse.json(
        { error: 'Horarios de atención inválidos' },
        { status: 400 }
      );
    }

    const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    for (const day of daysOfWeek) {
      const schedule = body.opening_hours[day];
      if (!schedule || typeof schedule.is_open !== 'boolean') {
        return NextResponse.json(
          { error: `Horario inválido para ${day}` },
          { status: 400 }
        );
      }

      if (schedule.is_open && (!schedule.open_time || !schedule.close_time)) {
        return NextResponse.json(
          { error: `Faltan horarios para ${day}` },
          { status: 400 }
        );
      }
    }

    const settingsData = {
      name: body.name.trim(),
      phone: normalizedPhone,
      whatsapp_number: normalizedWhatsApp,
      address: body.address.trim(),
      delivery_cost: parseFloat(body.delivery_cost) || 0,
      is_delivery_free: Boolean(body.is_delivery_free),
      opening_hours: body.opening_hours,
      is_open: Boolean(body.is_open),
      social_media: body.social_media || {},
    };

    const { data, error } = await supabaseHelpers.updateRestaurantSettings(settingsData);

    if (error) {
      console.error('Error al actualizar configuración:', error);
      return NextResponse.json(
        { error: 'Error al actualizar la configuración' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error en PUT /api/settings:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}