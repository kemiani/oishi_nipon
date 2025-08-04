import { useState, useEffect } from 'react';
import { supabaseHelpers } from '@/lib/supabase';
import type { Category } from '../../types';

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState('');
  useEffect(() => { fetchCategories(); }, []);
  const fetchCategories = async () => {
    const { data } = await supabaseHelpers.getCategories();
    setCategories(data||[]);
  };
  const handleCreate = async () => {
    if (!newCategory.trim()) return;
    const { error } = await supabaseHelpers.createCategory({
      name: newCategory.trim(),
      is_active: true,
      display_order: categories.length + 1,
      created_at: '',
      updated_at: ''
    });
    if (!error) {
      setNewCategory('');
      fetchCategories();
    }
  };

  return (
    <section className="glass-card p-6">
      <h2 className="section-title">Categorías</h2>
      {categories.length === 0 ? (
        <p>No hay categorías.</p>
      ) : (
        <ul className="list-disc list-inside space-y-1 text-gray-200 mb-6">
          {categories.map(c => <li key={c.id}>{c.name}</li>)}
        </ul>
      )}
      <div className="flex gap-3 mt-4">
        <input className="input-premium flex-1"
          placeholder="Nueva categoría"
          value={newCategory}
          onChange={e => setNewCategory(e.target.value)} />
        <button onClick={handleCreate} className="btn-primary">Añadir</button>
      </div>
    </section>
  );
}
