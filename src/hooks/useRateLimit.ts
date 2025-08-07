import { useState, useCallback } from "react";

// src/hooks/useRateLimit.ts
export function useRateLimit(key: string, maxRequests = 10, windowMs = 60000) {
  const [requests, setRequests] = useState<number[]>([]);
  
  const checkLimit = useCallback(() => {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Filtrar requests fuera de la ventana
    const recentRequests = requests.filter(time => time > windowStart);
    
    if (recentRequests.length >= maxRequests) {
      return false; // Límite excedido
    }
    
    setRequests([...recentRequests, now]);
    return true;
  }, [requests, maxRequests, windowMs]);
  
  return { checkLimit };
}