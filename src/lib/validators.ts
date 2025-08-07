// 1. Crear archivo: src/lib/validators.ts
export const validators = {
  // Sanitizar strings contra XSS
  sanitizeString: (str: string): string => {
    return str
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .trim();
  },

  // Validar y sanitizar phone
  sanitizePhone: (phone: string): string => {
    return phone.replace(/[^0-9+\-\s]/g, '');
  },

    // Validar precio
    validatePrice: (price: number): boolean => {
        return price > 0 && price < 1000000 && Number.isFinite(price);
    },

    // Validar UUID
    isValidUUID: (uuid: string): boolean => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    },

    // Sanitizar HTML (para descriptions)
    sanitizeHTML: (html: string): string => {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    }
    };