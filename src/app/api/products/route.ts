
// ========================================
// src/app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseHelpers } from '../../../lib/supabase';
import type { CreateProductForm } from '../../../types';

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

    // Filtrar por categoría si se especifica
    if (category && category !== 'all') {
      filteredData = filteredData.filter(product => product.category === category);
    }

    // Filtrar por disponibilidad si se especifica
    if (available === 'true') {
      filteredData = filteredData.filter(product => product.is_available);
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

export async function POST(request: NextRequest) {
  try {
    const body: CreateProductForm = await request.json();

    // Validaciones básicas
    if (!body.name || !body.price || !body.category) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    if (body.price <= 0) {
      return NextResponse.json(
        { error: 'El precio debe ser mayor a 0' },
        { status: 400 }
      );
    }

    // Crear el producto
    const productData = {
      name: body.name.trim(),
      description: body.description?.trim() || '',
      price: body.price,
      category: body.category,
      image_url: body.image_url?.trim() || null,
      stock: body.stock || null,
      is_available: true,
    };

    const { data: product, error: productError } = await supabaseHelpers.createProduct(productData);

    if (productError) {
      console.error('Error al crear producto:', productError);
      return NextResponse.json(
        { error: 'Error al crear el producto' },
        { status: 500 }
      );
    }

    // Si hay variaciones, crearlas
    if (body.variations && body.variations.length > 0) {
      const { data: variations, error: variationsError } = await supabase
        .from('product_variations')
        .insert(
          body.variations.map(variation => ({
            product_id: product.id,
            name: variation.name.trim(),
            type: variation.type,
            price_change: variation.price_change || 0,
            is_required: variation.is_required || false,
            options: variation.options || null,
          }))
        );

      if (variationsError) {
        console.error('Error al crear variaciones:', variationsError);
        // No fallar completamente, solo log del error
      }
    }

    // Obtener el producto completo con sus variaciones
    const { data: fullProduct, error: fetchError } = await supabaseHelpers.getProductById(product.id);

    if (fetchError) {
      return NextResponse.json({ data: product });
    }

    return NextResponse.json({ data: fullProduct }, { status: 201 });
  } catch (error) {
    console.error('Error en POST /api/products:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}