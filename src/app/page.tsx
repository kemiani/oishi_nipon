'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '../store/cartStore';
import { formatPrice } from '../lib/utils';
import { Product, Category } from '@/types';
import { supabaseHelpers } from '../lib/supabase';

export default function HomePage() {
  const { addItem, getTotalItems, getSubtotal } = useCartStore();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showToast, setShowToast] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar productos y categorías desde Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [{ data: productsData }, { data: categoriesData }] = await Promise.all([
          supabaseHelpers.getProducts(),
          supabaseHelpers.getCategories(),
        ]);
        
        // Solo mostrar productos disponibles
        const availableProducts = (productsData || []).filter(p => p.is_available);
        setProducts(availableProducts);
        setCategories(categoriesData || []);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Crear categorías dinámicas basadas en los productos disponibles
  const dynamicCategories = useMemo(() => {
    const baseCategories = [{ id: 'all', name: 'Todo', display_order: 0 }];
    
    // Agregar solo categorías que tienen productos
    const categoriesWithProducts = categories.filter(category => 
      products.some(product => product.category === category.id)
    );
    
    return [...baseCategories, ...categoriesWithProducts];
  }, [categories, products]);

  // Obtener el nombre de la categoría
  const getCategoryName = (categoryId: string) => {
    if (categoryId === 'all') return 'Todo';
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Sin categoría';
  };

  // Filter products by the currently selected category.  The
  // computation is memoised to avoid recalculating on every render.
  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'all') return products;
    return products.filter((p) => p.category === selectedCategory);
  }, [selectedCategory, products]);

  /**
   * Adds a product to the cart and shows a short toast.  The cart
   * store should handle merging quantities for existing products.
   */
  const handleAddToCart = (product: Product) => {
    addItem(product, [], 1);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Navigation */}
      <header className="oishi-navbar">
        <div className="oishi-brand">
          <span className="text-gradient-red">Oishi</span>
          <span>Nipon</span>
        </div>
        <Link href="/cart" className="cart-button relative">
          🛒
          {getTotalItems() > 0 && (
            <span className="cart-badge">{getTotalItems()}</span>
          )}
        </Link>
      </header>

      {/* Category filter */}
      <div className="category-filter-row">
        <div className="category-filter">
          {dynamicCategories.map((cat) => (
            <button
              key={cat.id}
              className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              <span className="icon">🍣</span>
              <span>{getCategoryName(cat.id)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Product grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="loading-spinner"></div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">
            {selectedCategory === 'all' 
              ? 'No hay productos disponibles' 
              : `No hay productos en la categoría "${getCategoryName(selectedCategory)}"`
            }
          </p>
        </div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map((product) => (
            <div key={product.id} className="product-card">
              <div className="product-image">
                {product.image_url ? (
                  <Image 
                    src={product.image_url} 
                    alt={product.name}
                    width={600}
                    height={400}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.parentElement?.querySelector('.fallback-icon') as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className={`fallback-icon flex items-center justify-center w-full h-full text-4xl ${product.image_url ? 'hidden' : ''}`}>
                  🍣
                </div>
              </div>
              <div className="product-content">
                <h3 className="product-title">{product.name}</h3>
                <p className="product-description">{product.description}</p>
                <div className="product-meta">
                  <span className="price">{formatPrice(product.price)}</span>
                  <button
                    className="add-btn"
                    onClick={() => handleAddToCart(product)}
                    disabled={!product.is_available || product.stock <= 0}
                  >
                    {product.stock <= 0 ? 'Agotado' : 'Agregar'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Barra de checkout fija */}
      {getTotalItems() > 0 && (
        <div className="checkout-bar">
          <div className="checkout-inner">
            <span className="checkout-total">
              {getTotalItems()} producto{getTotalItems() > 1 ? 's' : ''} |{' '}
              {formatPrice(getSubtotal())}
            </span>
            <div className="checkout-actions">
              <Link href="/cart" className="checkout-btn">
                Ver carrito
              </Link>
              <Link href="/checkout" className="checkout-btn">
                Finalizar
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {showToast && <div className="toast-added">Producto agregado al carrito</div>}
    </div>
  );
}
