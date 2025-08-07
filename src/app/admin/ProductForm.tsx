import { useState, useEffect } from 'react';
import type { Product, Category, ProductInsert } from '../../types';
import { supabase } from '../../lib/supabase';
import { supabaseHelpers } from '../../lib/supabase';

interface Props {
  categories: Category[];
  product: Product | null;
  onSaved: () => void;
  onCancel: () => void;
}

export default function ProductForm({ categories, product, onSaved, onCancel }: Props) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    image_url: '',
    stock: 1,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        image_url: product.image_url || '',
        stock: product.stock ?? 1,
      });
      setImagePreview(product.image_url || null);
    }
  }, [product]);

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImagePreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [imageFile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  // Intenta subir a Storage, si falla usa base64
  async function uploadImage(file: File): Promise<string | null> {
    setLoading(true);
    setUploadError('');
    
    // Validar tamaño (max 2MB para base64)
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Imagen muy grande (máx 2MB)');
      setLoading(false);
      return null;
    }

    try {
      // Intento 1: Supabase Storage
      const ext = file.name.split('.').pop();
      const filePath = `products/${crypto.randomUUID()}.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, { upsert: false });
      
      if (!uploadError) {
        const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
        setLoading(false);
        return data.publicUrl;
      }
      
      // Intento 2: Base64 como fallback
      console.warn('Storage falló, usando base64:', uploadError);
      setUploadError('Usando almacenamiento alternativo');
      
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          setLoading(false);
          resolve(base64);
        };
        reader.readAsDataURL(file);
      });
      
    } catch (e) {
      setUploadError('Error al procesar imagen');
      setLoading(false);
      return null;
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.category || form.price <= 0) {
      alert('Completa nombre, categoría y precio');
      return;
    }

    let imageUrl = form.image_url.trim();
    
    // Si hay archivo nuevo, subirlo
    if (imageFile) {
      const uploaded = await uploadImage(imageFile);
      if (uploaded) imageUrl = uploaded;
    }

    const payload: ProductInsert = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      category: form.category,
      image_url: imageUrl || null,
      is_available: true,
      stock: form.stock || 1,
    };

    let error;
    if (product) {
      ({ error } = await supabaseHelpers.updateProduct(product.id, payload));
    } else {
      ({ error } = await supabaseHelpers.createProduct(payload));
    }
    
    if (!error) {
      onSaved();
      setImageFile(null);
      setUploadError('');
    } else {
      alert('Error al guardar');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card p-6 max-w-xl mb-10">
      <h3 className="text-2xl font-bold mb-6 text-white">
        {product ? 'Editar producto' : 'Nuevo producto'}
      </h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Nombre *
          </label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Ej: Nigiri de salmón"
            className="input-premium w-full"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Descripción
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Descripción del producto"
            className="input-premium w-full resize-none"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Precio *
            </label>
            <input
              name="price"
              value={form.price}
              onChange={handleChange}
              type="number"
              min={0}
              step={100}
              placeholder="0"
              className="input-premium w-full"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Stock
            </label>
            <input
              name="stock"
              value={form.stock}
              onChange={handleChange}
              type="number"
              min={1}
              placeholder="1"
              className="input-premium w-full"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Categoría *
          </label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="input-premium w-full"
            required
          >
            <option value="">Selecciona categoría</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Imagen
          </label>
          
          <div className="space-y-3">
            {/* URL directa */}
            <input
              name="image_url"
              value={form.image_url}
              onChange={handleChange}
              placeholder="URL de imagen (opcional)"
              className="input-premium w-full"
            />
            
            {/* Upload de archivo *****/}
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={event => setImageFile(event.target.files?.[0] || null)}
                className="input-premium w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent-red file:text-white hover:file:bg-accent-red-hover"
              />
              {uploadError && (
                <p className="text-xs text-yellow-400 mt-1">{uploadError}</p>
              )}
            </div>
          </div>
        </div>

        {/* Preview */}
        {imagePreview && (
          <div className="p-4 bg-black/50 rounded-lg">
            <p className="text-sm text-gray-400 mb-2">Vista previa:</p>
            <img 
              src={imagePreview} 
              alt="preview" 
              className="w-32 h-32 object-cover rounded-lg border border-border-primary"
            />
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-6">
        <button 
          className="btn-primary flex-1 justify-center" 
          type="submit" 
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Guardando...
            </>
          ) : (
            product ? 'Actualizar' : 'Crear producto'
          )}
        </button>
        
        {product && (
          <button 
            type="button" 
            onClick={onCancel} 
            className="btn-secondary"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}