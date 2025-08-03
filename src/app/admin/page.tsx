// src/app/admin/page.tsx – Panel de administración de Oishi Nipon
//
// Este componente implementa un panel de administración básico para
// gestionar productos, categorías y pedidos.  Se apoya en las
// funciones de supabase definidas en `lib/supabase.ts` y utiliza
// los mismos estilos “glass” y colores que el resto de la aplicación.
//
// El panel consta de cuatro pestañas principales:
//   1. Productos – lista, creación, edición y eliminación de productos.
//   2. Categorías – lista y creación de categorías para filtrar productos.
//   3. Pedidos – vista de pedidos recientes con opción de marcar como
//      entregado o pendiente.
//   4. Reportes – resumen de ventas en un rango de fechas.
//
// Cada sección se aloja dentro de un contenedor “glass‑card” y las
// interacciones son asincrónicas; se actualizan los listados al
// completar una acción.  El objetivo es ofrecer una interfaz intuitiva
// sin depender de librerías externas, aprovechando los componentes
// existentes y la API de Supabase.

'use client';

import { useState, useEffect } from 'react';
import { supabaseHelpers } from '../../lib/supabase';
import { formatPrice } from '../../lib/utils';
import type { Product, Category, Order } from '../../types';

// Tipo de pestañas para mayor claridad
type AdminTab = 'products' | 'categories' | 'orders' | 'reports';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('products');

  // Estados para los datos
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Estados para formularios
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: 0,
    category_id: '',
    image_url: '',
  });
  const [newCategoryName, setNewCategoryName] = useState('');
  const [reportRange, setReportRange] = useState({ start: '', end: '' });
  const [reportStats, setReportStats] = useState<{ total: number; count: number } | null>(null);

  // Cargar datos iniciales
  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchOrders();
  }, []);

  /**
   * Obtiene productos disponibles a través de Supabase.
   */
  const fetchProducts = async () => {
    const { data, error } = await supabaseHelpers.getProducts();
    if (!error && data) {
      setProducts(data);
    }
  };

  /**
   * Obtiene categorías activas a través de Supabase.
   */
  const fetchCategories = async () => {
    const { data, error } = await supabaseHelpers.getCategories();
    if (!error && data) {
      setCategories(data);
    }
  };

  /**
   * Obtiene pedidos recientes a través de Supabase.  Se limita a los
   * últimos 50 pedidos para no sobrecargar la interfaz.
   */
  const fetchOrders = async () => {
    const { data, error } = await supabaseHelpers.getOrders(50, 0);
    if (!error && data) {
      setOrders(data);
    }
  };

  /**
   * Crea un nuevo producto en la base de datos y refresca la lista.
   */
  const handleCreateProduct = async () => {
    if (!newProduct.name || !newProduct.category_id || newProduct.price <= 0) {
      alert('Completa nombre, categoría y precio');
      return;
    }
    const { error } = await supabaseHelpers.createProduct({
      name: newProduct.name.trim(),
      description: newProduct.description.trim(),
      price: newProduct.price,
      category_id: newProduct.category_id,
      image_url: newProduct.image_url.trim(),
      is_available: true,
    });
    if (error) {
      alert('Error al crear el producto');
      return;
    }
    // Limpiar formulario y recargar
    setNewProduct({ name: '', description: '', price: 0, category_id: '', image_url: '' });
    fetchProducts();
  };

  /**
   * Elimina un producto dado su ID y refresca la lista.
   */
  const handleDeleteProduct = async (id: string) => {
    if (!confirm('¿Eliminar este producto?')) return;
    const { error } = await supabaseHelpers.deleteProduct(id);
    if (!error) fetchProducts();
  };

  /**
   * Crea una nueva categoría y refresca la lista.
   */
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    const { error } = await supabaseHelpers.createCategory({
      name: newCategoryName.trim(),
      is_active: true,
      display_order: categories.length + 1,
    });
    if (error) {
      alert('Error al crear la categoría');
    } else {
      setNewCategoryName('');
      fetchCategories();
    }
  };

  /**
   * Actualiza el estado de un pedido (pendiente/entregado) y refresca.
   */
  const handleToggleOrderStatus = async (order: Order) => {
    const newStatus = order.status === 'delivered' ? 'pending' : 'delivered';
    const { error } = await supabaseHelpers.updateOrderStatus(order.id, newStatus);
    if (!error) fetchOrders();
  };

  /**
   * Genera un reporte de ventas para el rango indicado y calcula total y
   * cantidad de pedidos.  Utiliza la función `getOrderStats`.
   */
  const handleGenerateReport = async () => {
    const { start, end } = reportRange;
    if (!start || !end) {
      alert('Selecciona rango de fechas');
      return;
    }
    const { data, error } = await supabaseHelpers.getOrderStats(start, end);
    if (error || !data) {
      alert('Error al obtener estadísticas');
      return;
    }
    // Calcular totales
    const count = data.length;
    const total = data.reduce((acc: number, order: any) => acc + (order.total || 0), 0);
    setReportStats({ total, count });
  };

  /**
   * Renderiza la lista de productos y el formulario de creación.
   */
  const renderProductsTab = () => (
    <div className="space-y-8">
      <div className="glass-card p-6">
        <h2 className="text-xl font-bold mb-4">Productos</h2>
        {products.length === 0 ? (
          <p className="text-gray-400">No hay productos disponibles.</p>
        ) : (
          <ul className="space-y-4">
            {products.map((p) => (
              <li key={p.id} className="flex items-center justify-between border-b border-border-primary pb-3">
                <div>
                  <p className="font-semibold text-white">{p.name}</p>
                  <p className="text-gray-400 text-sm">{p.description}</p>
                  <p className="text-accent-gold text-sm">{formatPrice(p.price)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => handleDeleteProduct(p.id)} className="btn-secondary btn-sm">
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="glass-card p-6">
        <h3 className="text-lg font-bold mb-4">Agregar producto</h3>
        <div className="space-y-4">
          <input
            className="input-premium w-full"
            type="text"
            placeholder="Nombre"
            value={newProduct.name}
            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
          />
          <textarea
            className="input-premium w-full"
            placeholder="Descripción"
            value={newProduct.description}
            onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
          />
          <input
            className="input-premium w-full"
            type="number"
            placeholder="Precio"
            value={newProduct.price}
            onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
          />
          <select
            className="input-premium w-full"
            value={newProduct.category_id}
            onChange={(e) => setNewProduct({ ...newProduct, category_id: e.target.value })}
          >
            <option value="">Selecciona categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input
            className="input-premium w-full"
            type="text"
            placeholder="URL de la imagen"
            value={newProduct.image_url}
            onChange={(e) => setNewProduct({ ...newProduct, image_url: e.target.value })}
          />
          <button onClick={handleCreateProduct} className="btn-primary">
            Crear producto
          </button>
        </div>
      </div>
    </div>
  );

  /**
   * Renderiza la pestaña de categorías con listado y formulario.
   */
  const renderCategoriesTab = () => (
    <div className="space-y-8">
      <div className="glass-card p-6">
        <h2 className="text-xl font-bold mb-4">Categorías</h2>
        {categories.length === 0 ? (
          <p className="text-gray-400">No hay categorías registradas.</p>
        ) : (
          <ul className="space-y-2">
            {categories.map((c) => (
              <li key={c.id} className="flex items-center justify-between border-b border-border-primary pb-2">
                <p className="font-medium text-white">{c.name}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="glass-card p-6">
        <h3 className="text-lg font-bold mb-4">Agregar categoría</h3>
        <div className="flex gap-4">
          <input
            className="input-premium flex-1"
            type="text"
            placeholder="Nombre de la categoría"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
          />
          <button onClick={handleCreateCategory} className="btn-primary">
            Añadir
          </button>
        </div>
      </div>
    </div>
  );

  /**
   * Renderiza la pestaña de pedidos con listado y acciones de estado.
   */
  const renderOrdersTab = () => (
    <div className="space-y-8">
      <div className="glass-card p-6">
        <h2 className="text-xl font-bold mb-4">Pedidos recientes</h2>
        {orders.length === 0 ? (
          <p className="text-gray-400">No hay pedidos registrados.</p>
        ) : (
          <ul className="space-y-4">
            {orders.map((order) => (
              <li key={order.id} className="flex items-center justify-between border-b border-border-primary pb-3">
                <div>
                  <p className="font-semibold text-white">Pedido #{order.id}</p>
                  <p className="text-gray-400 text-sm">{new Date(order.created_at).toLocaleString()}</p>
                  <p className="text-accent-gold text-sm">Total: {formatPrice(order.total)}</p>
                  <p className="text-gray-400 text-sm">Estado: {order.status}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => handleToggleOrderStatus(order)} className="btn-secondary btn-sm">
                    {order.status === 'delivered' ? 'Marcar pendiente' : 'Marcar entregado'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  /**
   * Renderiza la pestaña de reportes con selección de fechas y resumen.
   */
  const renderReportsTab = () => (
    <div className="space-y-8">
      <div className="glass-card p-6">
        <h2 className="text-xl font-bold mb-4">Reporte de ventas</h2>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col">
            <label className="text-sm text-gray-300 mb-1">Desde</label>
            <input
              type="date"
              className="input-premium"
              value={reportRange.start}
              onChange={(e) => setReportRange({ ...reportRange, start: e.target.value })}
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-300 mb-1">Hasta</label>
            <input
              type="date"
              className="input-premium"
              value={reportRange.end}
              onChange={(e) => setReportRange({ ...reportRange, end: e.target.value })}
            />
          </div>
          <button onClick={handleGenerateReport} className="btn-primary">
            Generar reporte
          </button>
        </div>
        {reportStats && (
          <div className="mt-6">
            <p className="text-white">
              Total de pedidos: <span className="text-accent-gold font-bold">{reportStats.count}</span>
            </p>
            <p className="text-white">
              Ingresos totales: <span className="text-accent-gold font-bold">{formatPrice(reportStats.total)}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black py-8 px-4">
      <h1 className="text-3xl font-bold text-white mb-8 text-center">Panel de administración</h1>
      {/* Navegación de pestañas */}
      <div className="flex justify-center gap-4 mb-8 flex-wrap">
        <button
          onClick={() => setActiveTab('products')}
          className={`btn-secondary ${activeTab === 'products' ? 'bg-accent-red text-white' : ''}`}
        >
          Productos
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`btn-secondary ${activeTab === 'categories' ? 'bg-accent-red text-white' : ''}`}
        >
          Categorías
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`btn-secondary ${activeTab === 'orders' ? 'bg-accent-red text-white' : ''}`}
        >
          Pedidos
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`btn-secondary ${activeTab === 'reports' ? 'bg-accent-red text-white' : ''}`}
        >
          Reportes
        </button>
      </div>

      {/* Contenido según la pestaña activa */}
      {activeTab === 'products' && renderProductsTab()}
      {activeTab === 'categories' && renderCategoriesTab()}
      {activeTab === 'orders' && renderOrdersTab()}
      {activeTab === 'reports' && renderReportsTab()}
    </div>
  );
}