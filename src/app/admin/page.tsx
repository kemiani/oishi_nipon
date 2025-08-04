// src/app/admin/page.tsx – Panel de administración de Oishi Nipon

'use client';

import { useState, useEffect } from 'react';
import { supabase, supabaseHelpers } from '../../lib/supabase';
import { formatPrice } from '../../lib/utils';
import { useAuth } from '@/hooks/useAuth';
import type { Product, Category, Order } from '../../types';

// Tipo de pestañas para mayor claridad
type AdminTab = 'products' | 'categories' | 'orders' | 'reports';

interface NewProductForm {
  name: string;
  description: string;
  price: number;
  category_id: string;
  image_url: string;
}

interface ReportStats {
  total: number;
  count: number;
}

interface ReportRange {
  start: string;
  end: string;
}

export default function AdminPage() {
  const { user, loading, signOut } = useAuth(true);
  const [activeTab, setActiveTab] = useState<AdminTab>('products');

  // Estados para los datos
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Estados para formularios
  const [newProduct, setNewProduct] = useState<NewProductForm>({
    name: '',
    description: '',
    price: 0,
    category_id: '',
    image_url: '',
  });
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [reportRange, setReportRange] = useState<ReportRange>({ start: '', end: '' });
  const [reportStats, setReportStats] = useState<ReportStats | null>(null);

  // Cargar datos iniciales
  useEffect(() => {
    if (user && !loading) {
      fetchProducts();
      fetchCategories();
      fetchOrders();
    }
  }, [user, loading]);

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
   * Obtiene pedidos recientes a través de Supabase.
   */
  const fetchOrders = async () => {
    const { data, error } = await supabaseHelpers.getOrders(50, 0);
    if (!error && data) {
      setOrders(data);
    }
  };

  /**
   * Sube una imagen a Supabase Storage
   */
  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setUploadingImage(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error al subir imagen:', error);
      alert('Error al subir la imagen');
      return null;
    } finally {
      setUploadingImage(false);
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

    let imageUrl = newProduct.image_url;

    // Si hay un archivo de imagen, subirlo primero
    if (imageFile) {
      const uploadedUrl = await uploadImage(imageFile);
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      }
    }

    const { error } = await supabaseHelpers.createProduct({
      name: newProduct.name.trim(),
      description: newProduct.description.trim(),
      price: newProduct.price,
      category: newProduct.category_id,
      image_url: imageUrl.trim(),
      is_available: true,
    });
    if (error) {
      alert('Error al crear el producto');
      return;
    }
    // Limpiar formulario y recargar
    setNewProduct({ name: '', description: '', price: 0, category_id: '', image_url: '' });
    setImageFile(null);
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
   * Prepara un producto para edición
   */
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      description: product.description || '',
      price: product.price,
      category_id: product.category,
      image_url: product.image_url || '',
    });
    setImageFile(null);
  };

  /**
   * Actualiza un producto existente
   */
  const handleUpdateProduct = async () => {
    if (!editingProduct) return;
    
    if (!newProduct.name || !newProduct.category_id || newProduct.price <= 0) {
      alert('Completa nombre, categoría y precio');
      return;
    }

    let imageUrl = newProduct.image_url;

    // Si hay un archivo de imagen nuevo, subirlo primero
    if (imageFile) {
      const uploadedUrl = await uploadImage(imageFile);
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      }
    }
    
    const { error } = await supabaseHelpers.updateProduct(editingProduct.id, {
      name: newProduct.name.trim(),
      description: newProduct.description.trim(),
      price: newProduct.price,
      category: newProduct.category_id,
      image_url: imageUrl.trim(),
    });
    
    if (error) {
      alert('Error al actualizar el producto');
      return;
    }
    
    // Limpiar formulario y recargar
    setNewProduct({ name: '', description: '', price: 0, category_id: '', image_url: '' });
    setEditingProduct(null);
    setImageFile(null);
    fetchProducts();
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
   * cantidad de pedidos.
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
    const total = data.reduce((acc: number, order: Order) => acc + (order.total || 0), 0);
    setReportStats({ total, count });
  };

  const handleProductFormChange = (field: keyof NewProductForm, value: string | number) => {
    setNewProduct(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageFile(e.target.files?.[0] || null);
  };

  const handleReportRangeChange = (field: keyof ReportRange, value: string) => {
    setReportRange(prev => ({ ...prev, [field]: value }));
  };

  // Mostrar loading mientras se verifica autenticación
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

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
                  <button onClick={() => handleEditProduct(p)} className="btn-secondary btn-sm">
                    Editar
                  </button>
                  <button onClick={() => handleDeleteProduct(p.id)} className="btn-secondary btn-sm text-red-400 border-red-400 hover:bg-red-400/10">
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="glass-card p-6">
        <h3 className="text-lg font-bold mb-4">
          {editingProduct ? 'Editar producto' : 'Agregar producto'}
        </h3>
        <div className="space-y-4">
          <input
            className="input-premium w-full"
            type="text"
            placeholder="Nombre"
            value={newProduct.name}
            onChange={(e) => handleProductFormChange('name', e.target.value)}
          />
          <textarea
            className="input-premium w-full"
            placeholder="Descripción"
            value={newProduct.description}
            onChange={(e) => handleProductFormChange('description', e.target.value)}
          />
          <input
            className="input-premium w-full"
            type="number"
            placeholder="Precio"
            value={newProduct.price}
            onChange={(e) => handleProductFormChange('price', Number(e.target.value))}
          />
          <select
            className="input-premium w-full"
            value={newProduct.category_id}
            onChange={(e) => handleProductFormChange('category_id', e.target.value)}
          >
            <option value="">Selecciona categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Imagen del producto</label>
            <input
              className="input-premium w-full"
              type="text"
              placeholder="URL de la imagen"
              value={newProduct.image_url}
              onChange={(e) => handleProductFormChange('image_url', e.target.value)}
            />
            <div className="text-center text-gray-400 text-sm">- o -</div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="input-premium w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent-red file:text-white hover:file:bg-accent-red-hover"
            />
            {imageFile && (
              <p className="text-sm text-gray-400">Archivo seleccionado: {imageFile.name}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button 
              onClick={editingProduct ? handleUpdateProduct : handleCreateProduct} 
              className="btn-primary flex-1"
              disabled={uploadingImage}
            >
              {uploadingImage ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Subiendo imagen...
                </>
              ) : (
                editingProduct ? 'Actualizar producto' : 'Crear producto'
              )}
            </button>
            {editingProduct && (
              <button 
                onClick={() => {
                  setEditingProduct(null);
                  setNewProduct({ name: '', description: '', price: 0, category_id: '', image_url: '' });
                  setImageFile(null);
                }}
                className="btn-secondary"
              >
                Cancelar
              </button>
            )}
          </div>
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
              onChange={(e) => handleReportRangeChange('start', e.target.value)}
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-300 mb-1">Hasta</label>
            <input
              type="date"
              className="input-premium"
              value={reportRange.end}
              onChange={(e) => handleReportRangeChange('end', e.target.value)}
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
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Panel de administración</h1>
          <button
            onClick={signOut}
            className="btn-secondary text-sm"
          >
            Cerrar sesión
          </button>
        </div>
        
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
    </div>
  );
}