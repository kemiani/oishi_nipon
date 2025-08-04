import React, { useState, useEffect } from 'react';
import type { Product, Category } from '../../types';

interface Props {
  categories: Category[];
  product: Product | null;
  onSaved: () => void;
  onCancel: () => void;
}

// Este form puede ser mejorado, lo dejo simple para el ejemplo
export default function ProductForm({ categories, product, onSaved, onCancel }: Props) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    image_url: '',
  });

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        image_url: product.image_url || '',
      });
    } else {
      setForm({ name: '', description: '', price: 0, category: '', image_url: '' });
    }
  }, [product]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Acá deberías hacer el create/update llamando a tu helper
    // Ejemplo:
    // await supabaseHelpers.createOrUpdateProduct(form);
    onSaved();
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" value={form.name} onChange={handleChange} placeholder="Nombre" />
      <textarea name="description" value={form.description} onChange={handleChange} placeholder="Descripción" />
      <input name="price" value={form.price} onChange={handleChange} type="number" placeholder="Precio" />
      <select name="category" value={form.category} onChange={handleChange}>
        <option value="">Selecciona categoría</option>
        {categories.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <input name="image_url" value={form.image_url} onChange={handleChange} placeholder="URL de imagen" />
      <button type="submit">{product ? 'Actualizar' : 'Crear'}</button>
      {product && <button type="button" onClick={onCancel}>Cancelar</button>}
    </form>
  );
}
