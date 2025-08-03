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
};

/**
 * Generar mensaje de WhatsApp para pedido
 */
export const generateWhatsAppMessage = (
  customerName: string,
  items: Array<{product: {name: string}, quantity: number, selected_variations: Array<{name: string}>}>,
  total: number,
  deliveryType: 'delivery' | 'pickup',
  address?: string,
  orderUrl?: string
): string => {
  const itemsText = items.map(item => {
    const variations = item.selected_variations.length > 0 
      ? ` (${item.selected_variations.map(v => v.name).join(', ')})`
      : '';
    return `• ${item.quantity}x ${item.product.name}${variations}`;
  }).join('\n');

  const deliveryText = deliveryType === 'delivery' 
    ? `📍 *Dirección:* ${address}\n` 
    : '🏪 *Retiro en local*\n';

  const orderUrlText = orderUrl 
    ? `\n🔗 *Ver pedido completo:* ${orderUrl}` 
    : '';

  return `🍣 *NUEVO PEDIDO*

👤 *Cliente:* ${customerName}
${deliveryText}
📋 *Productos:*
${itemsText}

💰 *Total: ${formatPrice(total)}*${orderUrlText}`;
};

/**
 * Generar URL de WhatsApp
 */
export const generateWhatsAppUrl = (phone: string, message: string): string => {
  const normalizedPhone = normalizePhoneForWhatsApp(phone);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${normalizedPhone.replace('+', '')}?text=${encodedMessage}`;
};

/**
 * Validar email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Capitalizar primera letra de cada palabra
 */
export const capitalizeWords = (str: string): string => {
  return str.replace(/\w\S*/g, (txt) =>
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

/**
 * Generar ID único
 */
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

/**
 * Calcular tiempo estimado de preparación
 */
export const calculatePreparationTime = (itemCount: number): number => {
  // Base: 15 minutos + 3 minutos por item adicional
  const baseTime = 15;
  const timePerItem = 3;
  return baseTime + (itemCount * timePerItem);
};

/**
 * Verificar si el restaurante está abierto
 */
export const isRestaurantOpen = (openingHours: any): boolean => {
  const now = new Date();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = dayNames[now.getDay()];
  
  const todaySchedule = openingHours[currentDay];
  
  if (!todaySchedule?.is_open) {
    return false;
  }

  const currentTime = now.getHours() * 60 + now.getMinutes();
  const openTime = parseTimeToMinutes(todaySchedule.open_time);
  const closeTime = parseTimeToMinutes(todaySchedule.close_time);

  // Manejar horarios que cruzan medianoche
  if (closeTime < openTime) {
    return currentTime >= openTime || currentTime <= closeTime;
  }

  return currentTime >= openTime && currentTime <= closeTime;
};

/**
 * Convertir tiempo "HH:MM" a minutos
 */
const parseTimeToMinutes = (timeString: string): number => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Obtener el próximo horario de apertura
 */
export const getNextOpeningTime = (openingHours: any): string => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = new Date().getDay();
  
  for (let i = 1; i <= 7; i++) {
    const dayIndex = (today + i) % 7;
    const dayName = days[dayIndex];
    const schedule = openingHours[dayName];
    
    if (schedule?.is_open) {
      const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      return `${dayNames[dayIndex]} a las ${schedule.open_time}`;
    }
  }
  
  return 'Horario no disponible';
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Slugify string para URLs
 */
export const slugify = (str: string): string => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};