'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabaseHelpers } from '@/lib/supabase';
import type { Product, Category } from '../../types';
import ProductForm from './ProductForm';

export default function Products() {
  // state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string>('');

  // load data
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const [{ data: productsRes, error: pErr }, { data: categoriesRes, error: cErr }] =
          await Promise.all([supabaseHelpers.getProducts(), supabaseHelpers.getCategories()]);
        if (!mounted) return;
        if (pErr || cErr) {
          setError('No se pudo cargar datos');
          setProducts([]);
          setCategories([]);
        } else {
          setProducts(productsRes || []);
          setCategories(categoriesRes || []);
        }
      } catch {
        if (mounted) {
          setError('Error inesperado al obtener datos');
          setProducts([]);
          setCategories([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const refresh = async () => {
    try {
      setRefreshing(true);
      setError('');
      const [{ data: productsRes, error: pErr }, { data: categoriesRes, error: cErr }] =
        await Promise.all([supabaseHelpers.getProducts(), supabaseHelpers.getCategories()]);
      if (pErr || cErr) {
        setError('No se pudo actualizar la lista');
        return;
      }
      setProducts(productsRes || []);
      setCategories(categoriesRes || []);
    } catch {
      setError('Error inesperado al refrescar');
    } finally {
      setRefreshing(false);
    }
  };

  const handleEdit = (p: Product) => setEditingProduct(p);
  const handleCancel = () => setEditingProduct(null);
  const handleSaved = async () => {
    setEditingProduct(null);
    await refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar producto?')) return;
    await supabaseHelpers.deleteProduct(id);
    await refresh();
  };

  const handleImageError = (productId: string) => {
    setImageErrors(prev => ({ ...prev, [productId]: true }));
  };

  return (
    <div className="space-y-8">
      {/* Formulario crear/editar */}
      <ProductForm
        categories={categories}
        product={editingProduct}
        onSaved={handleSaved}
        onCancel={handleCancel}
      />

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Productos</h2>
        <button
          onClick={refresh}
          className="btn-secondary btn-sm"
          disabled={refreshing || loading}
          aria-busy={refreshing}
        >
          {refreshing ? 'Actualizando…' : 'Refrescar'}
        </button>
      </div>

      {/* Estados */}
      {loading && (
        <div className="glass-card p-4 text-gray-300">Cargando productos…</div>
      )}
      {error && !loading && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">
          {error}
        </div>
      )}
      {!loading && !error && products.length === 0 && (
        <div className="glass-card p-4 text-gray-400">No hay productos.</div>
      )}

      {/* Lista */}
      {!loading && !error && products.length > 0 && (
        <section className="space-y-3">
          {products.map(p => (
            <div key={p.id} className="flex items-center gap-4 glass-card p-4">
              <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-900 shrink-0">
                {p.image_url && !imageErrors[p.id] ? (
                  <Image
                    src={p.image_url}
                    alt={p.name}
                    width={80}
                    height={80}
                    className="h-20 w-20 object-cover pointer-events-none"
                    sizes="80px"
                    onError={() => handleImageError(p.id)}
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl select-none">
                    🍣
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <strong className="text-white truncate">{p.name}</strong>
                  {!p.is_available && (
                    <span className="ml-1 rounded bg-gray-700/60 px-2 py-0.5 text-xs text-gray-300">
                      no disponible
                    </span>
                  )}
                </div>
                {p.description && (
                  <div className="text-sm text-gray-400 line-clamp-2">{p.description}</div>
                )}
                <div className="text-accent-gold font-semibold mt-1">${p.price}</div>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => handleEdit(p)} className="btn-secondary btn-sm">
                  Editar
                </button>
                <button onClick={() => handleDelete(p.id)} className="btn-danger btn-sm">
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
