// src/app/page.tsx - Oishi Nipon Premium Experience
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useCartStore } from '../store/cartStore';
import type { Product, Category, RestaurantSettings } from '../types';

// Componente de Loading Premium
const PremiumLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-black">
    <div className="text-center">
      <div className="loading-spinner mb-6"></div>
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-gradient-red">Oishi Nipon</h3>
        <p className="text-gray-400 text-sm">Preparando una experiencia excepcional...</p>
      </div>
    </div>
  </div>
);

// Componente de Error Premium
const PremiumError = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="min-h-screen flex items-center justify-center bg-black px-4">
    <div className="text-center max-w-md">
      <div className="w-20 h-20 bg-accent-red-light rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="text-2xl">⚠️</span>
      </div>
      <h2 className="text-2xl font-bold text-red-400 mb-4">Algo salió mal</h2>
      <p className="text-gray-400 mb-6">{error}</p>
      <button 
        onClick={onRetry}
        className="btn-primary"
      >
        Reintentar
      </button>
    </div>
  </div>
);

// Componente de Header Premium
const PremiumHeader = ({ settings, cartCount }: { settings: RestaurantSettings | null; cartCount: number }) => (
  <header className="glass-card border-0 border-b border-border-primary bg-black/80 backdrop-blur-md sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-20">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-accent-red to-accent-red-dark rounded-xl flex items-center justify-center text-2xl">
            🍣
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gradient-red">
              {settings?.name || 'Oishi Nipon'}
            </h1>
            {settings?.address && (
              <p className="text-sm text-gray-400">{settings.address}</p>
            )}
          </div>
        </div>
        
        <Link 
          href="/cart"
          className="cart-button relative"
        >
          <span className="text-lg">🛒</span>
          <span className="font-medium">Carrito</span>
          {cartCount > 0 && (
            <span className="cart-badge">
              {cartCount}
            </span>
          )}
        </Link>
      </div>
    </div>
  </header>
);

// Componente de Hero Section
const HeroSection = ({ settings }: { settings: RestaurantSettings | null }) => (
  <section className="hero-section py-16 lg:py-24">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <div className="animate-slide-in-up">
        <h2 className="text-4xl lg:text-6xl font-bold mb-6">
          <span className="text-gradient-red">Auténtica</span>{' '}
          <span className="text-white">experiencia</span>{' '}
          <span className="text-gradient-gold">japonesa</span>
        </h2>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed">
          Sumérgete en los sabores más exquisitos del Japón. 
          Cada pieza es una obra de arte culinaria, preparada</p>
          </div>
          </div>
          </section>);