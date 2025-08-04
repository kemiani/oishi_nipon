import { useState, useEffect } from 'react';
import { supabaseHelpers } from '@/lib/supabase';
import type { Order } from '../../types';

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  useEffect(()=>{ fetchOrders(); }, []);
  const fetchOrders = async () => {
    const { data } = await supabaseHelpers.getOrders(50,0);
    setOrders(data||[]);
  };
  const handleToggle = async (order: Order) => {
    const newStatus = order.status === 'delivered' ? 'pending' : 'delivered';
    await supabaseHelpers.updateOrderStatus(order.id, newStatus);
    fetchOrders();
  };

  return (
    <section className="glass-card p-6">
      <h2 className="section-title mb-4">Pedidos recientes</h2>
      {orders.length === 0 ? (
        <p>No hay pedidos registrados.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b">
                <th className="py-2 pr-4">#ID</th>
                <th className="py-2 pr-4">Fecha</th>
                <th className="py-2 pr-4">Total</th>
                <th className="py-2">Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} className="border-b last:border-none">
                  <td className="py-2 pr-4">{o.id}</td>
                  <td className="py-2 pr-4">{new Date(o.created_at).toLocaleString()}</td>
                  <td className="py-2 pr-4">${o.total}</td>
                  <td className="py-2 capitalize">{o.status}</td>
                  <td className="py-2 text-right">
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
        </div>
      )}
    </section>
  );
}
