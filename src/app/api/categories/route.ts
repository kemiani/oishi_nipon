// src/app/api/categories/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseHelpers } from '../../../lib/supabase';

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
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      );
    }

    const categoryData = {
      name: body.name.trim(),
      display_order: body.display_order || 0,
      is_active: body.is_active !== undefined ? body.is_active : true,
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