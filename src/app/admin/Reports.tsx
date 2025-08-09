import { useState } from 'react';
import { supabaseHelpers } from '@/lib/supabase';
import type { Order } from '../../types';

export default function Reports() {
  const [range, setRange] = useState({ start: '', end: '' });
  const [stats, setStats] = useState<{ total: number, count: number } | null>(null);

  const handleGenerate = async () => {
    if (!range.start || !range.end) return alert('Selecciona rango');
    const { data, error } = await supabaseHelpers.getOrderStats(range.start, range.end);
    if (error || !data) return alert('Error al obtener stats');
    const total = data.reduce((acc:number,o:Order) => acc + (o.total || 0), 0);
    setStats({ total, count: data.length });
  };

  const fmtMoney = (n: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n || 0);

  return (
    <section className="glass-card p-6 max-w-xl">
      <h2 className="section-title">Reporte de ventas</h2>
      <div className="flex flex-wrap gap-4 mt-4">
        <div className="flex flex-col">
          <label className="tiny-label">Desde</label>
          <input type="date" className="input-premium"
            value={range.start}
            onChange={e => setRange({ ...range, start: e.target.value })} />
        </div>
        <div className="flex flex-col">
          <label className="tiny-label">Hasta</label>
          <input type="date" className="input-premium"
            value={range.end}
            onChange={e => setRange({ ...range, end: e.target.value })} />
        </div>
        <button onClick={handleGenerate} className="btn-primary h-max self-end">Generar</button>
      </div>
      {stats && (
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="glass-card p-4">
            <p className="tiny-label">Total de pedidos</p>
            <p className="text-2xl font-bold">{stats.count}</p>
          </div>
          <div className="glass-card p-4">
            <p className="tiny-label">Ingresos</p>
            <p className="text-2xl font-bold text-accent-gold">{fmtMoney(stats.total)}</p>
          </div>
        </div>
      )}
    </section>
  );
}