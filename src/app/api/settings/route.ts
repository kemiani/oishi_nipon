// src/app/api/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseHelpers } from '../../../lib/supabase';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { normalizePhoneForWhatsApp } from '../../../lib/utils';
import { validators } from '../../../lib/validators';

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

// GET - Público (para mostrar info del restaurante)
export async function GET() {
  try {
    const { data, error } = await supabaseHelpers.getRestaurantSettings();

    if (error) {
      return NextResponse.json(
        { error: 'Error al obtener configuración' },
        { status: 500 }
      );
    }

    // Retornar solo información pública
    const publicSettings = data ? {
      name: data.name,
      phone: data.phone,
      address: data.address,
      is_delivery_free: data.is_delivery_free,
      delivery_cost: data.delivery_cost,
      opening_hours: data.opening_hours,
      is_open: data.is_open,
      social_media: data.social_media
    } : null;

    return NextResponse.json({ data: publicSettings });
  } catch (error) {
    console.error('Error en GET /api/settings:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Solo admin puede actualizar
export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticación
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar rol admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Permisos insuficientes' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validaciones básicas
    if (!body.name || typeof body.name !== 'string' || body.name.length < 2 || body.name.length > 100) {
      return NextResponse.json(
        { error: 'Nombre inválido (2-100 caracteres)' },
        { status: 400 }
      );
    }

    if (!body.phone || body.phone.length < 8 || body.phone.length > 20) {
      return NextResponse.json(
        { error: 'Teléfono inválido' },
        { status: 400 }
      );
    }

    if (!body.whatsapp_number || body.whatsapp_number.length < 8 || body.whatsapp_number.length > 20) {
      return NextResponse.json(
        { error: 'WhatsApp inválido' },
        { status: 400 }
      );
    }

    if (!body.address || body.address.length < 5 || body.address.length > 200) {
      return NextResponse.json(
        { error: 'Dirección inválida (5-200 caracteres)' },
        { status: 400 }
      );
    }

    // Validar costo de delivery
    const deliveryCost = parseFloat(body.delivery_cost);
    if (isNaN(deliveryCost) || deliveryCost < 0 || deliveryCost > 99999) {
      return NextResponse.json(
        { error: 'Costo de delivery inválido' },
        { status: 400 }
      );
    }

    // Validar horarios de atención
    if (!body.opening_hours || typeof body.opening_hours !== 'object') {
      return NextResponse.json(
        { error: 'Horarios de atención inválidos' },
        { status: 400 }
      );
    }

    const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

    for (const day of daysOfWeek) {
      const schedule = body.opening_hours[day];
      
      if (!schedule || typeof schedule.is_open !== 'boolean') {
        return NextResponse.json(
          { error: `Horario inválido para ${day}` },
          { status: 400 }
        );
      }

      if (schedule.is_open) {
        if (!schedule.open_time || !schedule.close_time) {
          return NextResponse.json(
            { error: `Faltan horarios para ${day}` },
            { status: 400 }
          );
        }

        if (!timeRegex.test(schedule.open_time) || !timeRegex.test(schedule.close_time)) {
          return NextResponse.json(
            { error: `Formato de hora inválido para ${day} (use HH:MM)` },
            { status: 400 }
          );
        }
      }
    }

    // Sanitizar y normalizar datos
    const settingsData = {
      name: validators.sanitizeString(body.name).slice(0, 100),
      phone: validators.sanitizePhone(body.phone).slice(0, 20),
      whatsapp_number: validators.sanitizePhone(body.whatsapp_number).slice(0, 20),
      address: validators.sanitizeString(body.address).slice(0, 200),
      delivery_cost: deliveryCost,
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