interface Props {
  activeTab: string;
  setTab: (t: any) => void;
  signOut: () => void;
}
export default function Sidebar({activeTab, setTab, signOut}:Props) {
  const tabs = [
    { key: 'products', label: '🍣 Productos' },
    { key: 'categories', label: '🗂️ Categorías' },
    { key: 'orders', label: '📦 Pedidos' },
    { key: 'reports', label: '📈 Reportes' },
  ];
  return (
    <aside className="w-full sm:w-48 lg:w-60 bg-[#0a0a0a]/70 border-r p-4 sticky top-0 h-screen">
      <h1 className="text-xl font-bold text-center mb-6">Oishi Admin</h1>
      {tabs.map(t => (
        <button key={t.key} onClick={()=>setTab(t.key)}
          className={`btn-tab w-full mb-2 ${activeTab===t.key?'btn-tab-active':''}`}>{t.label}
        </button>
      ))}
      <button onClick={signOut} className="btn-secondary w-full mt-8">Cerrar sesión</button>
    </aside>
  );
}
