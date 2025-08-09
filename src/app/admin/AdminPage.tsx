'use client';

import { useEffect, useRef, useState } from 'react';
import Sidebar from './Sidebar';
import Products from './Products';
import Categories from './Categories';
import Orders from './Orders';
import Reports from './Reports';
import { useAuth } from '@/hooks/useAuth';

export default function AdminPage() {
  const { loading, signOut } = useAuth(true);
  const [tab, setTab] = useState<'products'|'categories'|'orders'|'reports'>('products');
  const searchRef = useRef<HTMLInputElement>(null);

  // Ctrl/Cmd + K → enfocar buscador
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isK = e.key.toLowerCase() === 'k';
      if ((e.ctrlKey || e.metaKey) && isK) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center admin">
        <div className="loader" />
      </div>
    );
  }

  return (
    <div className="admin min-h-screen flex">
      <Sidebar activeTab={tab} setTab={setTab} signOut={signOut} />

      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar__inner container-admin">
            <div className="topbar__brand">Oishi Admin</div>

            <div className="search" role="search">
              <span className="icon-left" aria-hidden>🔎</span>
              <input
                ref={searchRef}
                placeholder="Buscar productos, pedidos… (Ctrl K)"
                aria-label="Buscar en admin"
              />
              <span className="kbd">Ctrl K</span>
            </div>

            <div className="topbar__spacer" />

            <div className="topbar__actions">
              <button className="btn btn-secondary" onClick={() => setTab('products')}>
                + Nuevo
              </button>
              <button className="btn btn-icon" data-tip="Notificaciones" aria-label="Notificaciones">
                🔔
              </button>
            </div>
          </div>
        </header>

        {/* Contenido */}
        <main className="flex-1 p-6 md:p-10 space-y-10 overflow-y-auto">
          {tab === 'products' && <Products />}
          {tab === 'categories' && <Categories />}
          {tab === 'orders' && <Orders />}
          {tab === 'reports' && <Reports />}
        </main>
      </div>

      {/* Contenedor de toasts */}
      <div id="toasts" className="toasts" />
    </div>
  );
}