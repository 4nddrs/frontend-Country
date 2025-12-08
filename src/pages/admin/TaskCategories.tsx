import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Save, Trash2, Loader, X } from 'lucide-react';

const API_URL = 'http://localhost:8000/task-categories/';

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
    <div  className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
      <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">Gestión de Categorías de Tareas</h1>
      
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.5)] text-[#F8F4E3]">
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
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.5)] text-[#F8F4E3]">
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            <Loader size={24} className="animate-spin" />Cargando categorías...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map(category => (
                <div 
                  key={category.idTaskCategory}
                  className="rounded-2xl border border-slate-800/60 bg-gradient-to-br from-orange-500/10 via-slate-900/60 to-slate-900/90 shadow-lg shadow-black/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-orange-500/20"
                >
                  {editingId === category.idTaskCategory ? (
                    <div className="p-6">
                      <input
                        type="text"
                        defaultValue={category.categoryName}
                        onChange={e => setNewCategory({ ...newCategory, categoryName: e.target.value })}
                        className="w-full p-2 rounded-md bg-gray-600 text-white mb-2"
                      />
                      <input
                        type="text"
                        defaultValue={category.description}
                        onChange={e => setNewCategory({ ...newCategory, description: e.target.value })}
                        className="w-full p-2 rounded-md bg-gray-600 text-white mb-2"
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
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col items-center gap-2 py-5">
                        <span className="h-4 w-4 rounded-full bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.6)]" />
                        <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
                          Categoría
                        </span>
                      </div>

                      <div className="px-6 pb-6 space-y-4 text-sm text-slate-200">
                        <div className="text-center space-y-1">
                          <h3 className="text-lg font-semibold text-orange-300">{category.categoryName}</h3>
                        </div>

                        {category.description && category.description.trim().length > 0 && (
                          <div className="rounded-xl border border-slate-800/80 bg-slate-900/70 p-4 text-xs leading-relaxed">
                            <ul className="space-y-1">
                              <li><strong>Descripción:</strong> {category.description}</li>
                            </ul>
                          </div>
                        )}

                        <div className="flex items-center justify-center gap-6 border-t border-slate-800 pt-6 pb-2">
                          <button
                            onClick={() => { setEditingId(category.idTaskCategory!); setNewCategory(category); }}
                            className="relative flex items-center justify-center w-15 h-15 rounded-[20px]
                                        bg-gradient-to-b from-[#1A1C1E] to-[#0E0F10]
                                        shadow-[8px_8px_16px_rgba(0,0,0,0.85),-5px_-5px_12px_rgba(255,255,255,0.06)]
                                        hover:scale-[1.1]
                                        active:shadow-[inset_5px_5px_12px_rgba(0,0,0,0.9),inset_-4px_-4px_10px_rgba(255,255,255,0.05)]
                                        transition-all duration-300 ease-in-out"
                          >
                            <Edit size={28} className="text-[#E8C967] drop-shadow-[0_0_10px_rgba(255,215,100,0.85)] transition-transform duration-300 hover:rotate-3" />
                          </button>
                          <button
                            onClick={() => deleteCategory(category.idTaskCategory!)}
                            className="relative flex items-center justify-center w-15 h-15 rounded-[20px]
                                      bg-gradient-to-b from-[#1A1C1E] to-[#0E0F10]
                                      shadow-[8px_8px_16px_rgba(0,0,0,0.85),-5px_-5px_12px_rgba(255,255,255,0.06)]
                                      hover:scale-[1.1]
                                      active:shadow-[inset_5px_5px_12px_rgba(0,0,0,0.9),inset_-4px_-4px_10px_rgba(255,255,255,0.05)]
                                      transition-all duration-300 ease-in-out"
                          >
                            <Trash2 size={28} className="text-[#E86B6B] drop-shadow-[0_0_12px_rgba(255,80,80,0.9)] transition-transform duration-300 hover:-rotate-3" />
                          </button>
                        </div>
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