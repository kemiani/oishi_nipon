// src/app/admin/ProductForm.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import type { Product, Category, ProductInsert } from '../../types';
import { supabase } from '../../lib/supabase';
import { supabaseHelpers } from '../../lib/supabase';

interface Props {
  categories: Category[];
  product: Product | null;
  onSaved: () => void;
  onCancel: () => void;
}

export default function ProductForm({
  categories,
  product,
  onSaved,
  onCancel,
}: Props) {
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
    if (!product) return;
    setForm({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      image_url: product.image_url || '',
      stock: product.stock ?? 1,
    });
    setImagePreview(product.image_url || null);
  }, [product]);

  useEffect(() => {
    if (!imageFile) return;
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = event.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  async function uploadImage(file: File): Promise<string | null> {
    setLoading(true);
    setUploadError('');

    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Imagen muy grande (máx 2 MB)');
      setLoading(false);
      return null;
    }

    try {
      const ext = file.name.split('.').pop();
      const filePath = `products/${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, { upsert: false });

      if (!error) {
        const { data } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);
        setLoading(false);
        return data.publicUrl;
      }

      console.warn('Storage falló, usando base64:', error);
      setUploadError('Usando almacenamiento alternativo');

      return await new Promise(resolve => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setLoading(false);
          resolve(reader.result as string);
        };
        reader.readAsDataURL(file);
      });
    } catch {
      setUploadError('Error al procesar imagen');
      setLoading(false);
      return null;
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.name || !form.category || form.price <= 0) {
      alert('Completa nombre, categoría y precio');
      return;
    }

    let imageUrl = form.image_url.trim();

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

    const { error } = product
      ? await supabaseHelpers.updateProduct(product.id, payload)
      : await supabaseHelpers.createProduct(payload);

    if (error) {
      alert('Error al guardar');
      return;
    }

    onSaved();
    setImageFile(null);
    setUploadError('');
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card p-6 max-w-xl mb-10">
      <h3 className="text-2xl font-bold mb-6 text-white">
        {product ? 'Editar producto' : 'Nuevo producto'}
      </h3>

      <div className="space-y-4">
        <div>
          <label className="tiny-label">Nombre *</label>
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
          <label className="tiny-label">Descripción</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Descripción del producto"
            className="textarea-premium w-full resize-none"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="tiny-label">Precio *</label>
            <input
              name="price"
              type="number"
              min={0}
              step={100}
              value={form.price}
              onChange={handleChange}
              className="input-premium w-full"
              required
            />
          </div>

          <div>
            <label className="tiny-label">Stock</label>
            <input
              name="stock"
              type="number"
              min={1}
              value={form.stock}
              onChange={handleChange}
              className="input-premium w-full"
            />
          </div>
        </div>

        <div>
          <label className="tiny-label">Categoría *</label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="select-premium w-full"
            required
          >
            <option value="">Selecciona categoría</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="tiny-label">Imagen</label>

          <div className="space-y-3">
            <input
              name="image_url"
              value={form.image_url}
              onChange={handleChange}
              placeholder="URL de imagen (opcional)"
              className="input-premium w-full"
            />

            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={ev => setImageFile(ev.currentTarget.files?.[0] || null)}
                className="input-premium w-full"
              />
              {uploadError && (
                <p className="text-xs text-yellow-400 mt-1">{uploadError}</p>
              )}
            </div>
          </div>
        </div>

        {imagePreview && (
          <div className="p-4 bg-black/50 rounded-lg">
            <p className="text-sm text-gray-400 mb-2">Vista previa:</p>
            <Image
              src={imagePreview}
              alt="preview"
              width={128}
              height={128}
              unoptimized
              className="w-32 h-32 object-cover rounded-lg border border-border-primary"
            />
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-6">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary flex-1 justify-center"
        >
          {loading ? 'Guardando…' : (product ? 'Actualizar' : 'Crear producto')}
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