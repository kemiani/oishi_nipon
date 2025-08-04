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
        <div className="mt-6 space-y-2">
          <p>Total de pedidos: <span className="font-bold text-accent-gold">{stats.count}</span></p>
          <p>Ingresos: <span className="font-bold text-accent-gold">${stats.total}</span></p>
        </div>
      )}
    </section>
  );
}
