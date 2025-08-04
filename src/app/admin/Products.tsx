import { useState, useEffect } from 'react';
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

  return (
    <div>
      <ProductForm
        categories={categories}
        product={editingProduct}
        onSaved={handleSaved}
        onCancel={handleCancel}
      />
      <section className="mt-8">
        <h2 className="mb-4">Productos</h2>
        <ul>
          {products.map(p=>(
            <li key={p.id} className="flex items-center gap-4 border-b py-2">
              <img src={p.image_url||'https://placehold.co/80x80'} alt="" className="w-20 h-20 rounded" />
              <div className="flex-1">
                <strong>{p.name}</strong>
                <div>{p.description}</div>
                <div>${p.price}</div>
              </div>
              <button onClick={()=>handleEdit(p)} className="btn-secondary">Editar</button>
              <button onClick={()=>handleDelete(p.id)} className="btn-danger">Eliminar</button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
