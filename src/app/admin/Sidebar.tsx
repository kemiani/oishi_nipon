'use client';
import { useEffect, useState } from 'react';

interface Props {
  activeTab: string;
  setTab: (t: any) => void;
  signOut: () => void;
}

type Tab = { key: string; label: string; icon: string };

export default function Sidebar({activeTab, setTab, signOut}:Props) {
  const tabs: Tab[] = [
    { key: 'products', label: 'Productos',  icon: '🍣' },
    { key: 'categories', label: 'Categorías', icon: '🗂️' },
    { key: 'orders', label: 'Pedidos', icon: '📦' },
    { key: 'reports', label: 'Reportes', icon: '📈' },
  ];

  const [collapsed, setCollapsed] = useState<boolean>(false);

  // persistir preferencia
  useEffect(() => {
    const saved = localStorage.getItem('admin.sidebar.collapsed');
    if (saved) setCollapsed(saved === '1');
  }, []);
  useEffect(() => {
    localStorage.setItem('admin.sidebar.collapsed', collapsed ? '1' : '0');
  }, [collapsed]);

  return (
    <aside
      className={`admin-sidebar border-r p-3 sm:p-4 sticky top-0 h-screen flex flex-col gap-2
      ${collapsed ? 'w-16' : 'w-56'}`}
      aria-label="Barra lateral de navegación"
    >
      {/* Brand + toggle */}
      <div className="flex items-center justify-between mb-2">
        <button
          className="btn-tab !px-0 text-center w-full"
          onClick={() => setTab('products')}
          data-tip={collapsed ? 'Oishi Admin' : undefined}
          aria-label="Inicio"
        >
          <span className="text-xl">{collapsed ? '🍣' : 'Oishi Admin'}</span>
        </button>
        <button
          className="btn-icon hidden sm:inline-grid"
          onClick={() => setCollapsed(v=>!v)}
          data-tip={collapsed ? 'Expandir' : 'Colapsar'}
          aria-label="Alternar tamaño del menú"
        >
          {collapsed ? '⟩' : '⟨'}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-1" role="navigation">
        {tabs.map(t => {
          const active = activeTab === t.key;
          const btnBase = `btn-tab ${active ? 'btn-tab-active' : ''}`;
          return (
            <button
              key={t.key}
              onClick={()=>setTab(t.key)}
              className={`${btnBase} ${collapsed ? 'px-0 text-xl h-10 flex items-center justify-center' : ''}`}
              data-tip={collapsed ? t.label : undefined}
              aria-current={active ? 'page' : undefined}
            >
              {collapsed ? t.icon : (<span className="flex items-center gap-2"><span>{t.icon}</span>{t.label}</span>)}
            </button>
          );
        })}
      </nav>

      {/* Footer actions */}
      <div className="mt-auto pt-2 border-t border-border-primary">
        <button
          onClick={signOut}
          className={collapsed ? 'btn-icon w-full' : 'btn-secondary w-full'}
          data-tip={collapsed ? 'Cerrar sesión' : undefined}
          aria-label="Cerrar sesión"
        >
          {collapsed ? '⎋' : 'Cerrar sesión'}
        </button>
      </div>
    </aside>
  );
}