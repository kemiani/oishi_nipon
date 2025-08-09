// src/app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseHelpers } from '../../../lib/supabase';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
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

// GET - Público (para el menú)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const available = searchParams.get('available');

    const { data, error } = await supabaseHelpers.getProducts();

    if (error) {
      return NextResponse.json(
        { error: 'Error al obtener productos' },
        { status: 500 }
      );
    }

    let filteredData = data || [];

    // Filtrar por categoría
    if (category && category !== 'all') {
      // Validar UUID para prevenir inyección
      if (!validators.isValidUUID(category)) {
        return NextResponse.json(
          { error: 'Categoría inválida' },
          { status: 400 }
        );
      }
      filteredData = filteredData.filter(product => product.category === category);
    }

    // Filtrar por disponibilidad
    if (available === 'true') {
      filteredData = filteredData.filter(product => product.is_available && product.stock > 0);
    }

    return NextResponse.json({ data: filteredData });
  } catch (error) {
    console.error('Error en GET /api/products:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Requiere admin
export async function POST(request: NextRequest) {
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

    // Validaciones
    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json(
        { error: 'Nombre requerido' },
        { status: 400 }
      );
    }

    if (!body.category || !validators.isValidUUID(body.category)) {
      return NextResponse.json(
        { error: 'Categoría inválida' },
        { status: 400 }
      );
    }

    if (!validators.validatePrice(body.price)) {
      return NextResponse.json(
        { error: 'Precio inválido (debe ser entre 1 y 999999)' },
        { status: 400 }
      );
    }

    // Sanitización
    const productData = {
      name: validators.sanitizeString(body.name).slice(0, 100),
      description: body.description ? validators.sanitizeString(body.description).slice(0, 500) : '',
      price: Number(body.price),
      category: body.category,
      image_url: body.image_url ? validators.sanitizeString(body.image_url).slice(0, 500) : null,
      stock: Math.max(0, Math.min(9999, Number(body.stock) || 1)),
      is_available: Boolean(body.is_available)
    };

    const { data: product, error } = await supabaseHelpers.createProduct(productData);

    if (error) {
      console.error('Error al crear producto:', error);
      return NextResponse.json(
        { error: 'Error al crear el producto' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: product }, { status: 201 });
  } catch (error) {
    console.error('Error en POST /api/products:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar producto (requiere admin)
export async function PUT(request: NextRequest) {
  try {
    // Verificar auth y admin
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
    const productId = searchParams.get('id');

    if (!productId || !validators.isValidUUID(productId)) {
      return NextResponse.json({ error: 'ID de producto inválido' }, { status: 400 });
    }

    const body = await request.json();

    // Validaciones similares a POST
    const updates = {
      name: validators.sanitizeString(body.name).slice(0, 100),
      description: body.description ? validators.sanitizeString(body.description).slice(0, 500) : '',
      price: Number(body.price),
      category: body.category,
      image_url: body.image_url ? validators.sanitizeString(body.image_url).slice(0, 500) : null,
      stock: Math.max(0, Math.min(9999, Number(body.stock) || 1)),
      is_available: Boolean(body.is_available)
    };

    const { data, error } = await supabaseHelpers.updateProduct(productId, updates);

    if (error) {
      return NextResponse.json({ error: 'Error al actualizar producto' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error en PUT /api/products:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE - Eliminar producto (requiere admin)
export async function DELETE(request: NextRequest) {
  try {
    // Verificar auth y admin
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
    const productId = searchParams.get('id');

    if (!productId || !validators.isValidUUID(productId)) {
      return NextResponse.json({ error: 'ID de producto inválido' }, { status: 400 });
    }

    const { error } = await supabaseHelpers.deleteProduct(productId);

    if (error) {
      return NextResponse.json({ error: 'Error al eliminar producto' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en DELETE /api/products:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}