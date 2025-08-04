import { useState, useEffect } from 'react';
import type { Product, Category, ProductInsert } from '../../types';
import { supabase } from '../../lib/supabase';
import { supabaseHelpers } from '../../lib/supabase';

interface Props {
  categories: Category[];
  product: Product | null;   // null = nuevo, objeto = editar
  onSaved: () => void;
  onCancel: () => void;
}

/**
 * Formulario modular para crear o editar productos.
 * 100% funcional para integración con Supabase Storage y DB.
 */
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

  // Cuando cambia el producto a editar, pre-llenar el form
  useEffect(() => {
    if (product) {
      setForm({
        name:        product.name,
        description: product.description,
        price:       product.price,
        category:    product.category,
        image_url:   product.image_url || '',
        stock:       product.stock ?? 1,
      });
      setImagePreview(product.image_url || null);
    } else {
      setForm({ name: '', description: '', price: 0, category: '', image_url: '', stock: 1 });
      setImagePreview(null);
    }
    setImageFile(null);
  }, [product]);

  // Preview de imagen local si se elige archivo
  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImagePreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [imageFile]);

  // Manejar cambios de input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  // Subida de imagen a Supabase Storage
  async function uploadImage(file: File): Promise<string | null> {
    try {
      setLoading(true);
      const ext = file.name.split('.').pop();
      const filePath = `products/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from('product-images')
        .upload(filePath, file, { upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (e) {
      alert('Error subiendo imagen');
      return null;
    } finally {
      setLoading(false);
    }
  }

  // Crear o editar producto
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.category || form.price <= 0) {
      alert('Completa nombre, categoría y precio');
      return;
    }

    let imageUrl = form.image_url.trim();
    if (!imageUrl && imageFile) {
      const up = await uploadImage(imageFile);
      if (up) imageUrl = up;
    }

    // Payload con el tipo ProductInsert
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
    if (!error) onSaved();
    else alert('Error al guardar');
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card p-6 max-w-xl mb-10">
      <h3 className="mb-4">{product ? 'Editar producto' : 'Nuevo producto'}</h3>
      <input
        name="name"
        value={form.name}
        onChange={handleChange}
        placeholder="Nombre"
        className="input-premium mb-2"
        required
      />
      <textarea
        name="description"
        value={form.description}
        onChange={handleChange}
        placeholder="Descripción"
        className="input-premium mb-2"
      />
      <input
        name="price"
        value={form.price}
        onChange={handleChange}
        type="number"
        min={0}
        placeholder="Precio"
        className="input-premium mb-2"
        required
      />
      <select
        name="category"
        value={form.category}
        onChange={handleChange}
        className="input-premium mb-2"
        required
      >
        <option value="">Selecciona categoría</option>
        {categories.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <input
        name="stock"
        value={form.stock}
        onChange={handleChange}
        type="number"
        min={1}
        placeholder="Stock"
        className="input-premium mb-2"
      />
      {/* Imagen: URL directa o archivo */}
      <div className="flex flex-col sm:flex-row gap-2 mb-2">
        <input
          name="image_url"
          value={form.image_url}
          onChange={handleChange}
          placeholder="URL imagen"
          className="input-premium flex-1"
        />
        <input
          type="file"
          accept="image/*"
          onChange={e => setImageFile(e.target.files?.[0] || null)}
          className="input-premium flex-1"
        />
      </div>
      {imagePreview && (
        <div className="mb-2">
          <img src={imagePreview} alt="preview" className="w-24 h-24 object-cover rounded border" />
          <button
            type="button"
            onClick={() => { setImageFile(null); setForm(f => ({ ...f, image_url: '' })); setImagePreview(null); }}
            className="btn-secondary btn-sm"
          >
            Quitar imagen
          </button>
        </div>
      )}
      <div className="flex gap-2">
        <button className="btn-primary flex-1" type="submit" disabled={loading}>
          {loading ? 'Guardando...' : (product ? 'Actualizar' : 'Crear')}
        </button>
        {product && (
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
