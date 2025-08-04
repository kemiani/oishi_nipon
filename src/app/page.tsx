// src/app/page.tsx – Home page with product listing and filtering
//
// This component renders the main shopping interface for Oishi Nipon.  A
// sticky navigation bar, category filter and responsive product grid
// provide convenient browsing【648140313359357†L73-L84】.  Adding an item to the
// cart triggers a toast notification and updates the cart badge.  A
// fixed checkout bar summarises the order and leads to the cart.

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '../store/cartStore';
import { formatPrice } from '../lib/utils';
import { Product } from '@/types';

// Predefined categories.  Keeping the list short reduces
// choice overload and helps users find what they need faster【63139696847701†L68-L71】.
const categories = [
  { id: 'all', label: 'Todo', icon: '🍣' },
  { id: 'sushi', label: 'Sushi', icon: '🍣' },
  { id: 'rolls', label: 'Rolls', icon: '🥢' },
  { id: 'bebidas', label: 'Bebidas', icon: '🍶' },
];

// Example product catalogue.  In a real application this data would
// come from your backend.  High quality photos and concise copy
// convey the value of each dish quickly【648140313359357†L127-L140】.
const products = [
  {
    id: 'p1',
    name: 'Nigiri de salmón',
    description: 'Delicioso nigiri con salmón fresco.',
    category: 'sushi',
    price: 4500,
    image_url:
      'https://images.unsplash.com/photo-1603886866603-1203ad715c26?auto=format&fit=crop&w=600&q=60',
  },
  {
    id: 'p2',
    name: 'Uramaki vegetal',
    description: 'Roll relleno de pepino, aguacate y mango.',
    category: 'rolls',
    price: 3800,
    image_url:
      'https://images.unsplash.com/photo-1580810737274-6cc0b2f7c802?auto=format&fit=crop&w=600&q=60',
  },
  {
    id: 'p3',
    name: 'California roll',
    description: 'Cangrejo, aguacate y tobiko. Un clásico imperdible.',
    category: 'rolls',
    price: 4200,
    image_url:
      'https://images.unsplash.com/photo-1581091215367-634fb6d30e5a?auto=format&fit=crop&w=600&q=60',
  },
  {
    id: 'p4',
    name: 'Sashimi variado',
    description: 'Selección de cortes de pescado y mariscos.',
    category: 'sushi',
    price: 5600,
    image_url:
      'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=600&q=60',
  },
  {
    id: 'p5',
    name: 'Sake junmai',
    description: 'Auténtico sake japonés para acompañar tu sushi.',
    category: 'bebidas',
    price: 3000,
    image_url:
      'https://images.unsplash.com/photo-1577312976531-78a3af10299e?auto=format&fit=crop&w=600&q=60',
  },
  {
    id: 'p6',
    name: 'Cerveza japonesa',
    description: 'Cerveza suave y refrescante de origen nipón.',
    category: 'bebidas',
    price: 2800,
    image_url:
      'https://images.unsplash.com/photo-1551022370-597a0891f9f7?auto=format&fit=crop&w=600&q=60',
  },
];

export default function HomePage() {
  const { addItem, getTotalItems, getSubtotal } = useCartStore();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showToast, setShowToast] = useState(false);

  // Filter products by the currently selected category.  The
  // computation is memoised to avoid recalculating on every render.
  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'all') return products;
    return products.filter((p) => p.category === selectedCategory);
  }, [selectedCategory]);

  /**
   * Adds a product to the cart and shows a short toast.  The cart
   * store should handle merging quantities for existing products.
   */
  const handleAddToCart = (product: typeof products[0]) => {
    // Convertir el producto del ejemplo al formato esperado por el store
    const productForCart: Product = {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      image_url: product.image_url,
      is_available: true,
      variations: []
    };
    
    addItem(productForCart, [], 1);
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
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              <span className="icon">{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Product grid */}
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
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-4xl">
                  🍣
                </div>
              )}
            </div>
            <div className="product-content">
              <h3 className="product-title">{product.name}</h3>
              <p className="product-description">{product.description}</p>
              <div className="product-meta">
                <span className="price">{formatPrice(product.price)}</span>
                <button
                  className="add-btn"
                  onClick={() => handleAddToCart(product)}
                >
                  Agregar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

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