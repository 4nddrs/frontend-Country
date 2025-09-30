import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Save, Trash2, Loader, X } from 'lucide-react';

const API_URL = 'https://backend-country-nnxe.onrender.com/task-categories/';

interface TaskCategory {
  idTaskCategory?: number;
  categoryName: string;
  description?: string;
}

const TaskCategoriesManagement = () => {
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [newCategory, setNewCategory] = useState<TaskCategory>({ categoryName: '', description: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al obtener categorías');
      const data = await res.json();
      setCategories(data);
    } catch {
      toast.error('No se pudo cargar categorías.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const createCategory = async () => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategory),
      });
      if (!res.ok) throw new Error('Error al crear categoría');
      toast.success('Categoría creada!');
      setNewCategory({ categoryName: '', description: '' });
      fetchCategories();
    } catch {
      toast.error('No se pudo crear categoría.');
    }
  };

  const updateCategory = async (id: number, updatedCategory: TaskCategory) => {
    try {
      const res = await fetch(`${API_URL}${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCategory),
      });
      if (!res.ok) throw new Error('Error al actualizar categoría');
      toast.success('Categoría actualizada!');
      setEditingId(null);
      fetchCategories();
    } catch {
      toast.error('No se pudo actualizar categoría.');
    }
  };

  const deleteCategory = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar categoría');
      toast.success('Categoría eliminada!');
      fetchCategories();
    } catch {
      toast.error('No se pudo eliminar categoría.');
    }
  };

  return (
    <div className="p-6 bg-slate-950 min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-6 text-center text-teal-400">Gestión de Categorías de Tareas</h1>
      <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4 text-teal-400">Agregar Nueva Categoría</h2>
        <div className="flex gap-4 flex-wrap">
          <input
            type="text"
            name="categoryName"
            placeholder="Nombre de la categoría"
            value={newCategory.categoryName}
            onChange={e => setNewCategory({ ...newCategory, categoryName: e.target.value })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          <input
            type="text"
            name="description"
            placeholder="Descripción"
            value={newCategory.description}
            onChange={e => setNewCategory({ ...newCategory, description: e.target.value })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          <button onClick={createCategory} className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-md font-semibold flex items-center gap-2">
            <Plus size={20} /> Agregar
          </button>
        </div>
      </div>
      <div className="bg-gray-800 p-6 rounded-lg shadow-md">
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            <Loader size={24} className="animate-spin" />Cargando categorías...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map(category => (
              <div key={category.idTaskCategory} className="bg-gray-700 p-4 rounded-md shadow-lg flex flex-col justify-between">
                {editingId === category.idTaskCategory ? (
                  <>
                    <input
                      type="text"
                      defaultValue={category.categoryName}
                      onChange={e => setNewCategory({ ...newCategory, categoryName: e.target.value })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="text"
                      defaultValue={category.description}
                      onChange={e => setNewCategory({ ...newCategory, description: e.target.value })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => updateCategory(category.idTaskCategory!, {
                          categoryName: newCategory.categoryName || category.categoryName,
                          description: newCategory.description || category.description,
                        })}
                        className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md flex items-center gap-1"
                      >
                        <Save size={16} /> Guardar
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded-md flex items-center gap-1"
                      >
                        <X size={16} /> Cancelar
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold">{category.categoryName}</h3>
                    <p>{category.description}</p>
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => { setEditingId(category.idTaskCategory!); setNewCategory(category); }}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white p-2 rounded-md flex items-center gap-1"
                      >
                        <Edit size={16} /> Editar
                      </button>
                      <button
                        onClick={() => deleteCategory(category.idTaskCategory!)}
                        className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-md flex items-center gap-1"
                      >
                        <Trash2 size={16} /> Eliminar
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCategoriesManagement;