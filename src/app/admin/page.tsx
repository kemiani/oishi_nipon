// ──────────────────────────────────────────────────────────────
// Panel de administración – Oishi Nipon
// Se ha mejorado la carga y vista previa de imágenes, así como la
// presentación visual de la lista de productos y el formulario de
// creación/edición. Esta versión mantiene la lógica de autenticación
// intacta pero ofrece un panel más amigable y eficiente para el usuario.
// ──────────────────────────────────────────────────────────────

'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase, supabaseHelpers } from '../../lib/supabase';
import { formatPrice } from '../../lib/utils';
import { useAuth } from '@/hooks/useAuth';
import type { Product, Category, Order } from '../../types';
import styles from './admin.module.css';

/* ═════════ Tipos ─════════ */
type AdminTab = 'products' | 'categories' | 'orders' | 'reports';

interface NewProductForm {
  name: string;
  description: string;
  price: number;
  category_id: string; // solo para el formulario
  image_url: string;
}

interface ReportStats { total: number; count: number; }
interface ReportRange { start: string; end: string; }

/* ═════════ Componente principal ─════════ */
export default function AdminPage() {
  /* ─── Auth ─── */
  const { user, loading, signOut } = useAuth(true);

  /* ─── Pestaña activa ─── */
  const [activeTab, setActiveTab] = useState<AdminTab>('products');

  /* ─── Datos ─── */
  const [products,   setProducts]   = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders,     setOrders]     = useState<Order[]>([]);

  /* ─── Formularios ─── */
  const [newProduct, setNewProduct] = useState<NewProductForm>({
    name: '', description: '', price: 0, category_id: '', image_url: '',
  });
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [imageFile, setImageFile]           = useState<File | null>(null);
  const [imagePreview, setImagePreview]     = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [newCategoryName, setNewCategoryName] = useState('');
  const [reportRange, setReportRange]         = useState<ReportRange>({ start: '', end: '' });
  const [reportStats, setReportStats]         = useState<ReportStats | null>(null);

  /* ═════════ Cargar datos al montar ═════════ */
  useEffect(() => {
    if (user && !loading) {
      fetchProducts(); fetchCategories(); fetchOrders();
    }
  }, [user, loading]);

  const fetchProducts   = async () => { const { data } = await supabaseHelpers.getProducts();   if (data) setProducts(data); };
  const fetchCategories = async () => { const { data } = await supabaseHelpers.getCategories(); if (data) setCategories(data); };
  const fetchOrders     = async () => { const { data } = await supabaseHelpers.getOrders(50,0); if (data) setOrders(data); };

  /* ═════════ Upload imagen a Storage ═════════ */
  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setUploadingImage(true);
      const ext      = file.name.split('.').pop();
      const filePath = `products/${crypto.randomUUID()}.${ext}`;
      // Incluimos contentType y upsert para mejorar compatibilidad con Supabase
      const { error: uploadError } = await supabase.storage.from('product-images')
        .upload(filePath, file, { contentType: file.type || 'image/*', upsert: false });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
      showToast('Imagen subida ✅');
      return data.publicUrl;
    } catch (e) {
      console.error(e);
      alert('Error al subir la imagen');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  /* ═════════ CRUD Productos ═════════ */
  const startEdit = (p: Product) => {
    setEditingProduct(p);
    setNewProduct({
      name:        p.name,
      description: p.description || '',
      price:       p.price,
      category_id: p.category,   // mapea a id para el <select>
      image_url:   p.image_url || '',
    });
    setImageFile(null);
  };

  const resetProductForm = () => {
    setNewProduct({ name:'', description:'', price:0, category_id:'', image_url:'' });
    setEditingProduct(null);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleCreateOrUpdate = async () => {
    /* Validación mínima */
    if (!newProduct.name || !newProduct.category_id || newProduct.price <= 0) {
      return alert('Completa nombre, categoría y precio');
    }

    /* Determinar imagen: si existe URL usarla, de lo contrario subir archivo */
    let imageUrl = newProduct.image_url.trim();
    if (!imageUrl && imageFile) {
      const up = await uploadImage(imageFile);
      if (up) imageUrl = up;
    }

    /* Payload compatible con Omit<Product, 'id' | 'variations'> */
    const payload = {
      name:        newProduct.name.trim(),
      description: newProduct.description.trim(),
      price:       newProduct.price,
      category:    newProduct.category_id,   // ✔️ campo correcto
      image_url:   imageUrl || null,
      is_available: true,
    };

    let error;
    if (editingProduct) {
      ({ error } = await supabaseHelpers.updateProduct(editingProduct.id, payload));
      if (!error) showToast('Producto actualizado ✏️');
    } else {
      ({ error } = await supabaseHelpers.createProduct(payload));
      if (!error) showToast('Producto creado 🎉');
    }
    if (!error) { resetProductForm(); fetchProducts(); }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('¿Eliminar este producto?')) return;
    const { error } = await supabaseHelpers.deleteProduct(id);
    if (!error) { showToast('Producto eliminado 🗑️'); fetchProducts(); }
  };

  /* ═════════ Categorías ═════════ */
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    const { error } = await supabaseHelpers.createCategory({
      name: newCategoryName.trim(),
      is_active: true,
      display_order: categories.length + 1,
    });
    if (!error) { showToast('Categoría creada ✚'); setNewCategoryName(''); fetchCategories(); }
  };

  /* ═════════ Pedidos ═════════ */
  const handleToggleOrderStatus = async (order: Order) => {
    const newStatus = order.status === 'delivered' ? 'pending' : 'delivered';
    const { error } = await supabaseHelpers.updateOrderStatus(order.id, newStatus);
    if (!error) fetchOrders();
  };

  /* ═════════ Reportes ═════════ */
  const handleGenerateReport = async () => {
    const { start, end } = reportRange;
    if (!start || !end) return alert('Selecciona rango');
    const { data, error } = await supabaseHelpers.getOrderStats(start, end);
    if (error || !data) return alert('Error al obtener stats');
    const total = data.reduce((acc:number,o:Order) => acc + (o.total || 0), 0);
    setReportStats({ total, count: data.length });
  };

  /* ═════════ Vista previa de imagen ═════════ */
  useEffect(() => {
    // Actualiza la vista previa cuando cambia la URL o el archivo
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImagePreview(url);
      return () => URL.revokeObjectURL(url);
    } else if (newProduct.image_url.trim()) {
      setImagePreview(newProduct.image_url.trim());
    } else {
      setImagePreview(null);
    }
  }, [imageFile, newProduct.image_url]);

  /* ═════════ Sub-componentes de pestañas ═════════ */

  /* Productos */
  const ProductsTab = () => {
    // Mapa rápido para mostrar nombre de categoría a partir de su id
    const categoryMap = useMemo(() => {
      const map: Record<string, string> = {};
      categories.forEach(c => { map[c.id] = c.name; });
      return map;
    }, [categories]);

    // Placeholder para productos sin imagen
    const placeholderImg = 'https://placehold.co/80x80?text=Sin+imagen';

    return (
      <div className={styles.container}>
        <div className={styles.productsWrapper}>
          {/* Formulario */}
          <section className={`${styles.formCard}`}>
            <h3 className="section-subtitle mb-4">
              {editingProduct ? 'Editar producto' : 'Agregar producto'}
            </h3>
            {/* Usamos un formulario para evitar envíos accidentales y mantener el scroll */}
            <form onSubmit={(e) => { e.preventDefault(); handleCreateOrUpdate(); }} className="grid md:grid-cols-1 gap-4">
              <input className="input-premium" placeholder="Nombre"
                value={newProduct.name}
                onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} />

              <select className="input-premium"
                value={newProduct.category_id}
                onChange={e => setNewProduct({ ...newProduct, category_id: e.target.value })}>
                <option value="">Selecciona categoría</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>

              <textarea className="input-premium" rows={2} placeholder="Descripción"
                value={newProduct.description}
                onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} />

              <input type="number" className="input-premium"
                placeholder="Precio"
                value={newProduct.price}
                onChange={e => setNewProduct({ ...newProduct, price: +e.target.value })} />

              {/* Inputs de imagen: URL y archivo */}
              <div className="flex flex-col sm:flex-row gap-4">
                <input className="input-premium flex-1" placeholder="URL de la imagen"
                  value={newProduct.image_url}
                  onChange={e => setNewProduct({ ...newProduct, image_url: e.target.value })} />
                <input type="file" accept="image/*" className="input-premium file:cursor-pointer flex-1"
                  onChange={e => setImageFile(e.target.files?.[0] || null)} />
              </div>

              {/* Vista previa de la imagen seleccionada o URL ingresada */}
              {imagePreview && (
                <div className={styles.previewContainer}>
                  <img src={imagePreview} alt="Vista previa" className={styles.previewImage} />
                  <div className={styles.previewInfo}>
                    <p className="text-sm">Vista previa</p>
                    <button type="button"
                      onClick={() => {
                        setImageFile(null);
                        setNewProduct({ ...newProduct, image_url: '' });
                      }}
                      className="btn-secondary btn-sm w-max">Quitar imagen
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  disabled={uploadingImage}
                  className="btn-primary flex-1"
                  type="submit">
                  {uploadingImage ? 'Subiendo…' : (editingProduct ? 'Actualizar' : 'Crear')}
                </button>

                {editingProduct && (
                  <button type="button" onClick={resetProductForm} className="btn-secondary">Cancelar</button>
                )}
              </div>
            </form>
          </section>

          {/* Lista */}
          <section className={`${styles.listCard}`}>
            <h2 className="section-title mb-4">Productos</h2>
            {products.length === 0 ? (
              <p className="empty-msg">No hay productos.</p>
            ) : (
              <ul>
                {products.map(p => (
                  <li key={p.id} className={styles.productItem}>
                    <img
                      src={p.image_url || placeholderImg}
                      alt={p.name}
                      className={styles.productImage}
                    />
                    <div className={styles.productDetails}>
                      <p className="font-semibold leading-tight">{p.name}</p>
                      {p.description && <p className="text-sm text-gray-400 mt-1">{p.description}</p>}
                      <p className="text-xs text-gray-500 mt-1">{categoryMap[p.category] || ''}</p>
                      <p className="text-accent-gold text-sm mt-1">{formatPrice(p.price)}</p>
                    </div>
                    <div className={styles.actions}>
                      <button onClick={() => startEdit(p)}            className={styles.iconButton} title="Editar">✏️</button>
                      <button onClick={() => handleDeleteProduct(p.id)} className={styles.iconButton} title="Eliminar">🗑️</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    );
  };

  /* Categorías */
  const CategoriesTab = () => (
    <div className="space-y-8">
      <section className="glass-card p-6">
        <h2 className="section-title">Categorías</h2>
        {categories.length === 0 ? (
          <p className="empty-msg">No hay categorías.</p>
        ) : (
          <ul className="list-disc list-inside space-y-1 text-gray-200">
            {categories.map(c => <li key={c.id}>{c.name}</li>)}
          </ul>
        )}
      </section>

      <section className="glass-card p-6">
        <h3 className="section-subtitle">Agregar categoría</h3>
        <div className="flex gap-3">
          <input className="input-premium flex-1"
            placeholder="Nombre"
            value={newCategoryName}
            onChange={e => setNewCategoryName(e.target.value)} />
          <button onClick={handleCreateCategory} className="btn-primary">Añadir</button>
        </div>
      </section>
    </div>
  );

  /* Pedidos */
  const OrdersTab = () => (
    <section className="glass-card p-6">
      <h2 className="section-title mb-4">Pedidos recientes</h2>
      {orders.length === 0 ? (
        <p className="empty-msg">No hay pedidos registrados.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-border-primary">
                <th className="py-2 pr-4">#ID</th>
                <th className="py-2 pr-4">Fecha</th>
                <th className="py-2 pr-4">Total</th>
                <th className="py-2">Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} className="border-b border-border-primary last:border-none">
                  <td className="py-2 pr-4">{o.id}</td>
                  <td className="py-2 pr-4">{new Date(o.created_at).toLocaleString()}</td>
                  <td className="py-2 pr-4">{formatPrice(o.total)}</td>
                  <td className="py-2 capitalize">{o.status}</td>
                  <td className="py-2 text-right">
                    <button
                      onClick={() => handleToggleOrderStatus(o)}
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

  /* Reportes */
  const ReportsTab = () => (
    <section className="glass-card p-6 max-w-xl">
      <h2 className="section-title">Reporte de ventas</h2>

      <div className="flex flex-wrap gap-4 mt-4">
        <div className="flex flex-col">
          <label className="tiny-label">Desde</label>
          <input type="date" className="input-premium"
            value={reportRange.start}
            onChange={e => setReportRange({ ...reportRange, start: e.target.value })} />
        </div>
        <div className="flex flex-col">
          <label className="tiny-label">Hasta</label>
          <input type="date" className="input-premium"
            value={reportRange.end}
            onChange={e => setReportRange({ ...reportRange, end: e.target.value })} />
        </div>

        <button onClick={handleGenerateReport} className="btn-primary h-max self-end">Generar</button>
      </div>

      {reportStats && (
        <div className="mt-6 space-y-2">
          <p>Total de pedidos: <span className="font-bold text-accent-gold">{reportStats.count}</span></p>
          <p>Ingresos: <span className="font-bold text-accent-gold">{formatPrice(reportStats.total)}</span></p>
        </div>
      )}
    </section>
  );

  /* ═════════ Render principal ═════════ */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="loader" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar */}
      <aside className="w-full sm:w-48 lg:w-60 bg-[#0a0a0a]/70 backdrop-blur-md border-r border-border-primary p-4 space-y-4 sticky top-0 h-screen">
        <h1 className="text-xl font-bold text-center">Oishi Admin</h1>

        {(['products','categories','orders','reports'] as AdminTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`btn-tab ${activeTab === tab ? 'btn-tab-active' : ''}`}
          >
            {tab==='products'&&'🍣 '} {tab==='categories'&&'🗂️ '}
            {tab==='orders'&&'📦 '}   {tab==='reports'&&'📈 '}
            {tab.charAt(0).toUpperCase()+tab.slice(1)}
          </button>
        ))}

        <button onClick={signOut} className="btn-secondary w-full mt-8">Cerrar sesión</button>
      </aside>

      {/* Contenido */}
      <main className="flex-1 p-6 md:p-10 space-y-10 overflow-y-auto">
        {activeTab === 'products'   && <ProductsTab />}
        {activeTab === 'categories' && <CategoriesTab />}
        {activeTab === 'orders'     && <OrdersTab />}
        {activeTab === 'reports'    && <ReportsTab />}
      </main>
    </div>
  );
}

/* ═════════ Utilidad de “toast” simple ═════════ */
function showToast(msg: string) { alert(msg); }

/* Fin del archivo */
