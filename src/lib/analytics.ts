// src/lib/analytics.ts
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string,
      config?: any
    ) => void;
    dataLayer: any[];
  }
}

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID || '';

// Inicializar GA
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    });
  }
};

// Eventos personalizados
export const trackEvent = (action: string, params?: any) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, params);
  }
};

// Eventos de e-commerce
export const analytics = {
  // Vista de producto
  viewItem: (product: any) => {
    trackEvent('view_item', {
      currency: 'ARS',
      value: product.price,
      items: [{
        item_id: product.id,
        item_name: product.name,
        item_category: product.category,
        price: product.price,
        quantity: 1
      }]
    });
  },

  // Agregar al carrito
  addToCart: (product: any, quantity: number = 1) => {
    trackEvent('add_to_cart', {
      currency: 'ARS',
      value: product.price * quantity,
      items: [{
        item_id: product.id,
        item_name: product.name,
        item_category: product.category,
        price: product.price,
        quantity: quantity
      }]
    });
  },

  // Remover del carrito
  removeFromCart: (product: any, quantity: number = 1) => {
    trackEvent('remove_from_cart', {
      currency: 'ARS',
      value: product.price * quantity,
      items: [{
        item_id: product.id,
        item_name: product.name,
        item_category: product.category,
        price: product.price,
        quantity: quantity
      }]
    });
  },

  // Inicio de checkout
  beginCheckout: (items: any[], total: number) => {
    trackEvent('begin_checkout', {
      currency: 'ARS',
      value: total,
      items: items.map(item => ({
        item_id: item.product.id,
        item_name: item.product.name,
        item_category: item.product.category,
        price: item.price,
        quantity: item.quantity
      }))
    });
  },

  // Compra completada
  purchase: (orderId: string, items: any[], total: number) => {
    trackEvent('purchase', {
      transaction_id: orderId,
      currency: 'ARS',
      value: total,
      tax: 0,
      shipping: 0,
      items: items.map(item => ({
        item_id: item.product.id,
        item_name: item.product.name,
        item_category: item.product.category,
        price: item.price,
        quantity: item.quantity
      }))
    });
  },

  // Búsqueda
  search: (searchTerm: string) => {
    trackEvent('search', {
      search_term: searchTerm
    });
  },

  // Share
  share: (method: string, contentType: string, itemId: string) => {
    trackEvent('share', {
      method: method,
      content_type: contentType,
      item_id: itemId
    });
  }
};
