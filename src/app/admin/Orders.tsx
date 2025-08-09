import { useEffect, useMemo, useState } from 'react';
import { supabaseHelpers } from '@/lib/supabase';
import type { Order } from '../../types';

type SortCol = 'id'|'created_at'|'total'|'status';
type SortDir = 'asc'|'desc';
type AriaSort = React.AriaAttributes['aria-sort'];

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [loading, setLoading] = useState(false);
  const [sortCol, setSortCol] = useState<SortCol>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const fetchOrders = async (pageArg = page) => {
    setLoading(true);
    const offset = pageArg * pageSize;
    const { data } = await supabaseHelpers.getOrders(pageSize, offset);
    setOrders(data || []);
    setLoading(false);
  };

  useEffect(()=>{ fetchOrders(0); setPage(0); }, [pageSize]);

  const toggleSort = (col: SortCol) => {
    if (col === sortCol) setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const ariaSort = (col: SortCol): AriaSort => {
    if (col !== sortCol) return 'none';
    return sortDir === 'asc' ? 'ascending' : 'descending';
  };

  const sortedOrders = useMemo(() => {
    const arr = [...orders];
    arr.sort((a,b) => {
      let va:any = a[sortCol as keyof Order];
      let vb:any = b[sortCol as keyof Order];
      if (sortCol === 'created_at') { va = +new Date(a.created_at as any); vb = +new Date(b.created_at as any); }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [orders, sortCol, sortDir]);

  const handleToggle = async (order: Order) => {
    const newStatus = order.status === 'delivered' ? 'pending' : 'delivered';
    // optimistic
    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: newStatus } : o));
    await supabaseHelpers.updateOrderStatus(order.id, newStatus);
    fetchOrders();
  };

  const fmtMoney = (n: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n || 0);

  return (
    <section className="glass-card p-6">
      <h2 className="section-title mb-4">Pedidos recientes</h2>

      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-gray-400">Página {page+1}</div>
        <div className="flex items-center gap-2">
          <label className="tiny-label">Filas</label>
          <select className="select-premium" value={pageSize} onChange={e => setPageSize(Number(e.target.value))}>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="skeleton h-6" />
          <div className="skeleton h-6" />
          <div className="skeleton h-6" />
        </div>
      ) : orders.length === 0 ? (
        <p className="text-gray-400">No hay pedidos registrados.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th
                  className="sortable"
                  aria-sort={ariaSort('id')}
                  onClick={()=>toggleSort('id')}
                >
                  #ID <span className="arrow">▲</span>
                </th>
                <th
                  className="sortable"
                  aria-sort={ariaSort('created_at')}
                  onClick={()=>toggleSort('created_at')}
                >
                  Fecha <span className="arrow">▲</span>
                </th>
                <th
                  className="sortable"
                  aria-sort={ariaSort('total')}
                  onClick={()=>toggleSort('total')}
                >
                  Total <span className="arrow">▲</span>
                </th>
                <th
                  className="sortable"
                  aria-sort={ariaSort('status')}
                  onClick={()=>toggleSort('status')}
                >
                  Estado <span className="arrow">▲</span>
                </th>
                <th />
              </tr>
            </thead>
            <tbody>
              {sortedOrders.map(o => (
                <tr key={o.id}>
                  <td>{o.id}</td>
                  <td>{new Date(o.created_at).toLocaleString('es-AR')}</td>
                  <td className="cell-right">{fmtMoney(Number(o.total))}</td>
                  <td className="capitalize">{o.status}</td>
                  <td className="cell-right">
                    <button
                      onClick={() => handleToggle(o)}
                      className="btn-secondary btn-sm">
                      {o.status === 'delivered' ? '↺ Pendiente' : '✓ Entregado'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 flex items-center justify-between">
            <div className="pagination">
              <button className="page" onClick={()=>{ const p = Math.max(0, page-1); setPage(p); fetchOrders(p); }} disabled={page===0}>‹</button>
              <div className="page" aria-current="page">{page+1}</div>
              <button className="page" onClick={()=>{ const p = page+1; setPage(p); fetchOrders(p); }}>›</button>
            </div>
            <button className="btn-secondary btn-sm" onClick={()=>fetchOrders(page)}>Refrescar</button>
          </div>
        </div>
      )}
    </section>
  );
}