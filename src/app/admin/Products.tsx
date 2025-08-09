import { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabaseHelpers } from '@/lib/supabase';
import type { Product, Category } from '../../types';
import ProductForm from './ProductForm';

/**
 * Vista del tab Productos (lista + form).
 */
export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product|null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  useEffect(() => { fetchAll(); }, []);
  
  const fetchAll = async () => {
    const [{data: products}, {data: categories}] = await Promise.all([
      supabaseHelpers.getProducts(),
      supabaseHelpers.getCategories(),
    ]);
    setProducts(products||[]);
    setCategories(categories||[]);
  };

  const handleEdit = (p: Product) => setEditingProduct(p);
  const handleCancel = () => setEditingProduct(null);
  const handleSaved = () => { setEditingProduct(null); fetchAll(); };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar producto?')) return;
    await supabaseHelpers.deleteProduct(id);
    fetchAll();
  };

  const handleImageError = (productId: string) => {
    setImageErrors(prev => ({ ...prev, [productId]: true }));
  };

  return (
    <div>
      <ProductForm
        categories={categories}
        product={editingProduct}
        onSaved={handleSaved}
        onCancel={handleCancel}
      />
      <section className="mt-8">
        <h2 className="mb-4 text-xl font-bold">Productos</h2>
        <div className="space-y-3">
          {products.map(p => (
            <div key={p.id} className="flex items-center gap-4 glass-card p-4">
              <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-900">
                {p.image_url && !imageErrors[p.id] ? (
                  <Image 
                    src={p.image_url}
                    alt={p.name}
                    fill
                    className="object-cover"
                    sizes="80px"
                    onError={() => handleImageError(p.id)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">
                    🍣
                  </div>
                )}
              </div>
              <div className="flex-1">
                <strong className="text-white">{p.name}</strong>
                <div className="text-sm text-gray-400">{p.description}</div>
                <div className="text-accent-gold font-semibold">${p.price}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(p)} className="btn-secondary btn-sm">
                  Editar
                </button>
                <button onClick={() => handleDelete(p.id)} className="btn-danger btn-sm">
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}