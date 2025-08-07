// src/hooks/useProducts.ts
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useProducts(category?: string) {
  const { data, error, mutate } = useSWR(
    `/api/products${category ? `?category=${category}` : ''}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // Cache 1 minuto
    }
  );
  
  return {
    products: data?.data || [],
    isLoading: !error && !data,
    isError: error,
    mutate
  };
}