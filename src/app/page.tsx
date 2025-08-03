// src/app/page.tsx – Home page with product listing and filtering
//
// Este componente muestra la interfaz principal de compras.  Incluye
// una barra de navegación sticky, un filtro de categorías y un grid
// responsivo de productos:contentReference[oaicite:11]{index=11}.  Al agregar un producto al
// carrito se muestra un toast y se actualiza la insignia del carrito.
// Una barra fija de checkout resume la orden y enlaza al carrito.

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useCartStore } from '../store/cartStore';
import { formatPrice } from '../lib/utils';

// Categorías predefinidas.  Una lista corta reduce la
// sobrecarga de elección y ayuda al usuario a encontrar rápido lo que busca:contentReference[oaicite:12]{index=12}.
const categories = [
  { id: 'all', label: 'Todo', icon: '🍣' },
  { id: 'sushi', label: 'Sushi', icon: '🍣' },
  { id: 'rolls', label: 'Rolls', icon: '🥢' },
  { id: 'bebidas', label: 'Bebidas', icon: '🍶' },
];

// Catálogo de productos de ejemplo.  En una aplicación real vendría del backend.
// Fotos de calidad y textos concisos comunican el valor rápidamente:contentReference[oaicite:13]{index=13}.
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

  // Filtra los productos por categoría usando memoización.
  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'all') return products;
    return products.filter((p) => p.category === selectedCategory);
  }, [selectedCategory]);

  /**
   * Añade un producto al carrito y muestra un toast temporal.  El store
   * debería encargarse de incrementar la cantidad si el producto ya existe.
   */
  const handleAddToCart = (product: typeof products[0]) => {
    // Se ignora el tipado del store en este snippet; adapta según tu implementación.
    // @ts-ignore
    addItem({ product, quantity: 1, selected_variations: [] });
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Navegación */}
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

      {/* Filtro de categorías */}
      <div className="category-filter-row">
        <div className="category-filter">
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`category-btn ${
                selectedCategory === cat.id ? 'active' : ''
              }`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              <span className="icon">{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid de productos */}
      <div className="products-grid">
        {filteredProducts.map((product) => (
          <div key={product.id} className="product-card">
            <div className="product-image">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} />
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
            <Link href="/cart" className="checkout-btn">
              Ver carrito
            </Link>
          </div>
        </div>
      )}

      {/* Toast de producto agregado */}
      {showToast && (
        <div className="toast-added">Producto agregado al carrito</div>
      )}
    </div>
  );
}
