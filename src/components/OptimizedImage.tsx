// src/components/OptimizedImage.tsx
import Image from 'next/image';
import { useState } from 'react';

interface Props {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

export function OptimizedImage({ src, alt, width = 600, height = 400, className, priority }: Props) {
  const [error, setError] = useState(false);
  
  // Cloudinary optimization (si usas Cloudinary)
  const optimizedSrc = src.includes('cloudinary') 
    ? src.replace('/upload/', '/upload/f_auto,q_auto,w_600/')
    : src;
  
  if (error || !src) {
    return (
      <div className={`flex items-center justify-center bg-gray-900 ${className}`}>
        <span className="text-4xl">🍣</span>
      </div>
    );
  }
  
  return (
    <Image
      src={optimizedSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={() => setError(true)}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
      priority={priority}
      loading={priority ? 'eager' : 'lazy'}
    />
  );
}