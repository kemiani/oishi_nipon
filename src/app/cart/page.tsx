// src/app/cart/page.tsx – Improved cart page
//
// Este componente muestra el carrito de compras.  Usa una jerarquía
// simplificada y botones claros para reducir la carga cognitiva:contentReference[oaicite:14]{index=14}
// y dirigir al usuario hacia la finalización del pedido:contentReference[oaicite:15]{index=15}.

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '../../store/cartStore';
import { formatPrice } from '../../lib/utils';

/**
 * Placeholder que se muestra cuando el carrito está vacío.
 * Invita al usuario a volver al menú con un mensaje amigable.
 */
const EmptyCart = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="text-center max-w-sm space-y-6">
        <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-red-500 to-yellow-400 flex items-center justify-center">
          <span className="text-6xl">🛒</span>
        </div>
        <h2 className="text-3xl font-bold">Tu carrito está vacío</h2>
        <p className="text-gray-400 leading-relaxed">
          Descubre nuestros exquisitos platos japoneses y comienza tu experiencia culinaria.
        </p>
        <Link href="/" className="btn-primary inline-flex items-center gap-2">
          <span className="text-lg">🍣</span>
          <span>Explorar Menú</span>
        </Link>
      </div>
    </div>
  );
};

/**
 * Página principal del carrito.  Obtiene los datos del store,
 * calcula los totales y renderiza los productos con sus controles.
 */
export default function CartPage() {
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    getSubtotal,
    getTotalItems,
  } = useCartStore();
  const [isClearing, setIsClearing] = useState(false);

  // Memoiza el cálculo de totales para evitar renders innecesarios.
  const totals = useMemo(() => {
    const subtotal = getSubtotal();
    const itemCount = getTotalItems();
    const deliveryCost = 0; // Se calculará en el checkout.
    return {
      subtotal,
      itemCount,
      deliveryCost,
      total: subtotal + deliveryCost,
    };
  }, [getSubtotal, getTotalItems]);

  /** Vacía el carrito con una pequeña pausa para dar feedback. */
  const handleClearCart = async () => {
    setIsClearing(true);
    await new Promise((resolve) => setTimeout(resolve, 300));
    clearCart();
    setIsClearing(false);
  };

  // Si no hay productos, muestra el placeholder.
  if (items.length === 0) {
    return <EmptyCart />;
  }

  return (
    <div className="cart-page">
      {/* Cabecera sticky con navegación al menú */}
      <header className="cart-header">
        <Link
          href="/"
          className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors"
        >
          <span className="text-xl">←</span>
          <span className="font-medium">Seguir comprando</span>
        </Link>
        <h1 className="text-xl font-bold">Carrito ({totals.itemCount})</h1>
      </header>

      {/* Contenido principal: lista de items y resumen */}
      <main className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lista de productos */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Tu pedido</h2>
            <button
              onClick={handleClearCart}
              disabled={isClearing}
              className="text-red-400 hover:text-red-300 text-sm font-medium disabled:opacity-50"
            >
              {isClearing ? 'Limpiando…' : 'Vaciar carrito'}
            </button>
          </div>
          {items.map((item) => (
            <div key={item.id} className="cart-item">
              {/* Imagen del producto */}
              <div className="image">
                {item.product.image_url ? (
                  <Image 
                    src={item.product.image_url} 
                    alt={item.product.name}
                    width={100}
                    height={100}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full">🍣</div>
                )}
              </div>
              {/* Detalles: nombre, descripción, variaciones, controles */}
              <div className="details">
                <h3>{item.product.name}</h3>
                {item.product.description && <p>{item.product.description}</p>}
                {item.selected_variations.length > 0 && (
                  <div className="variations">
                    {item.selected_variations.map((variation: any, index: number) => (
                      <span key={index}>
                        <span>{variation.name}</span>
                        {variation.price_change > 0 && (
                          <span> (+{formatPrice(variation.price_change)})</span>
                        )}
                      </span>
                    ))}
                  </div>
                )}
                {/* Controles de cantidad */}
                <div className="quantity-controls mt-auto">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    −
                  </button>
                  <span className="px-2 font-medium">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                    +
                  </button>
                </div>
                {/* Eliminar */}
                <button onClick={() => removeItem(item.id)} className="remove">
                  Eliminar
                </button>
              </div>
              {/* Columna de precios */}
              <div className="pricing">
                <div className="subtotal">{formatPrice(item.subtotal)}</div>
                <div className="unit">
                  {formatPrice(item.product.price)} × {item.quantity}
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Resumen del pedido */}
        <div className="lg:col-span-1">
          <div className="cart-summary">
            <h3>Resumen del pedido</h3>
            <div className="row">
              <span>Subtotal ({totals.itemCount})</span>
              <span>{formatPrice(totals.subtotal)}</span>
            </div>
            <div className="row">
              <span>Costo de envío</span>
              <span className="text-accent-gold">A calcular</span>
            </div>
            <div className="total">
              <span className="label">Total estimado</span>
              <span className="amount">{formatPrice(totals.total)}</span>
            </div>
            <Link href="/checkout" className="checkout-btn mt-4">
              Finalizar Pedido 🚀
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}