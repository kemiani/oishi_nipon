import { useState, useEffect } from 'react';
import { supabaseHelpers } from '../../lib/supabase';
import type { Product, Category } from '../../types'; // ← Usa tipos correctos
import styles from './admin.module.css';
import ProductForm from './ProductForm';

// ¡CUIDADO! Asegurate de crear el archivo ProductForm.tsx

export default function AdminProducts() {
  // Usa tipos
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabaseHelpers.getProducts();
    setProducts(data || []);
  };

  const fetchCategories = async () => {
    const { data } = await supabaseHelpers.getCategories();
    setCategories(data || []);
  };

  const handleEdit = (product: Product) => setEditProduct(product);
  const handleCancel = () => setEditProduct(null);

  return (
    <div className={styles.adminWrapper}>
      {/* Asegurate de tener este componente y que reciba bien los props */}
      <ProductForm
        categories={categories}
        product={editProduct}
        onSaved={() => { setEditProduct(null); fetchProducts(); }}
        onCancel={handleCancel}
      />

      <section className={styles.listCard}>
        <h2>Productos</h2>
        {products.length === 0 ? (
          <p>No hay productos.</p>
        ) : (
          <ul>
            {products.map(p => (
              <li key={p.id} className={styles.productItem}>
                <img src={p.image_url || 'https://placehold.co/80x80'} alt="" />
                <div>
                  <strong>{p.name}</strong>
                  <div>{p.description}</div>
                  <div>${p.price}</div>
                </div>
                <div>
                  <button onClick={() => handleEdit(p)}>✏️</button>
                  {/* Aquí agrega el delete */}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
