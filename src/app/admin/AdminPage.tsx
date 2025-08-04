'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import Products from './Products';
import Categories from './Categories';
import Orders from './Orders';
import Reports from './Reports';
import { useAuth } from '@/hooks/useAuth';

/**
 * Lógica principal del panel de admin.
 * Define pestañas y renderiza la vista correspondiente.........
 */
export default function AdminPage() {
  const { user, loading, signOut } = useAuth(true);
  const [tab, setTab] = useState<'products'|'categories'|'orders'|'reports'>('products');

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="loader" />
    </div>
  );

  return (
    <div className="flex min-h-screen bg-black text-white">
      <Sidebar activeTab={tab} setTab={setTab} signOut={signOut} />
      <main className="flex-1 p-6 md:p-10 space-y-10 overflow-y-auto">
        {tab === 'products' && <Products />}
        {tab === 'categories' && <Categories />}
        {tab === 'orders' && <Orders />}
        {tab === 'reports' && <Reports />}
      </main>
    </div>
  );
}
