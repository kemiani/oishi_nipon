import { useState, useEffect } from 'react';
import { supabaseHelpers } from '@/lib/supabase';
import type { Category } from '../../types';

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { 
    fetchCategories(); 
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabaseHelpers.getCategories();
    setCategories(data || []);
  };

  const handleCreate = async () => {
    const trimmedName = newCategory.trim();
    
    // Validaciones
    if (!trimmedName) {
      setError('El nombre es requerido');
      return;
    }
    
    if (trimmedName.length < 2) {
      setError('El nombre debe tener al menos 2 caracteres');
      return;
    }

    if (trimmedName.length > 100) {
      setError('El nombre no puede exceder 100 caracteres');
      return;
    }

    // Verificar duplicados localmente
    if (categories.some(c => c.name.toLowerCase() === trimmedName.toLowerCase())) {
      setError('Ya existe una categoría con ese nombre');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await supabaseHelpers.createCategory({
        name: trimmedName,
        is_active: true,
        display_order: categories.length + 1
      });

      if (error) {
        setError('Error al crear la categoría');
        console.error(error);
      } else {
        setNewCategory('');
        await fetchCategories();
      }
    } catch (err) {
      setError('Error inesperado');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="glass-card p-6">
      <h2 className="section-title">Categorías</h2>
      
      {categories.length === 0 ? (
        <p className="text-gray-400 mb-6">No hay categorías activas.</p>
      ) : (
        <div className="mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map(c => (
              <div key={c.id} className="glass-card p-3 flex items-center justify-between">
                <span className="text-white font-medium">{c.name}</span>
                <span className="text-xs text-gray-400">Orden: {c.display_order}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">
            {error}
          </div>
        )}
        
        <div className="flex gap-3">
          <input 
            className="input-premium flex-1"
            placeholder="Nueva categoría (ej: Entrantes, Bebidas)"
            value={newCategory}
            onChange={e => {
              setNewCategory(e.target.value);
              setError('');
            }}
            onKeyPress={e => e.key === 'Enter' && handleCreate()}
            maxLength={100}
            disabled={loading}
          />
          <button 
            onClick={handleCreate} 
            className="btn-primary"
            disabled={loading || !newCategory.trim()}
          >
            {loading ? 'Creando...' : 'Añadir'}
          </button>
        </div>
        
        <p className="text-xs text-gray-500">
          {newCategory.length}/100 caracteres
        </p>
      </div>
    </section>
  );
}