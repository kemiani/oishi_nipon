// src/lib/utils.ts

/**
 * Formatear precio a moneda argentina
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

/**
 * Formatear fecha y hora
 */
export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-AR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

/**
 * Formatear solo fecha
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-AR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

/**
 * Formatear solo hora
 */
export const formatTime = (timeString: string): string => {
  return timeString.substring(0, 5); // "HH:MM"
};

/**
 * Validar número de teléfono argentino
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  // Acepta formatos: +549XXXXXXXXX, 549XXXXXXXXX, 9XXXXXXXXX, XXXXXXXXX
  const phoneRegex = /^(\+?549?)?[0-9]{8,10}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
};

/**
 * Normalizar número de teléfono para WhatsApp
 */
export const normalizePhoneForWhatsApp = (phone: string): string => {
  // Remover espacios, guiones y paréntesis
  let normalized = phone.replace(/[\s\-\(\)]/g, '');
  
  // Si empieza con +54, mantenerlo
  if (normalized.startsWith('+54')) {
    return normalized;
  }
  
  // Si empieza con 54, agregar +
  if (normalized.startsWith('54')) {
    return `+${normalized}`;
  }
  
  // Si empieza con 9, agregar +54
  if (normalized.startsWith('9')) {
    return `+54${normalized}`;
  }
  
  // Si es un número local, agregar +549
  if (normalized.length >= 8) {
    return `+549${normalized}`;
  }
  
  return normalized;
}