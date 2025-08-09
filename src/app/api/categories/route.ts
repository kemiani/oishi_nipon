// src/app/api/categories/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseHelpers } from '../../../lib/supabase';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Crear cliente Supabase para verificar auth
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

export async function GET() {
  try {
    const { data, error } = await supabaseHelpers.getCategories();

    if (error) {
      return NextResponse.json(
        { error: 'Error al obtener categorías' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error('Error en GET /api/categories:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación y rol admin
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

    // Validación y sanitización
    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      );
    }

    const sanitizedName = body.name.trim().slice(0, 100);
    if (sanitizedName.length < 2) {
      return NextResponse.json(
        { error: 'El nombre debe tener al menos 2 caracteres' },
        { status: 400 }
      );
    }

    const categoryData = {
      name: sanitizedName,
      display_order: Number(body.display_order) || 0,
      is_active: body.is_active !== false
    };

    const { data, error } = await supabaseHelpers.createCategory(categoryData);

    if (error) {
      console.error('Error al crear categoría:', error);
      return NextResponse.json(
        { error: 'Error al crear la categoría' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error en POST /api/categories:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}