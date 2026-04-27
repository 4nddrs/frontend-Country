import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import { Edit, Trash2, Loader } from 'lucide-react';
import { AddButton, AdminSection, SaveButton, CancelButton } from '../../components/ui/admin-buttons';
import { confirmDialog } from '../../utils/confirmDialog';

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
  const [editingData, setEditingData] = useState<TaskCategory | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const isEditModalOpen = editingId !== null && editingData !== null;

  useEffect(() => {
    if (!isEditModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') handleCancelEdit(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isEditModalOpen]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al obtener categorías');
      const data = await res.json();
      setCategories([...data].sort((a: TaskCategory, b: TaskCategory) => (b.idTaskCategory ?? 0) - (a.idTaskCategory ?? 0)));
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

  const updateCategory = async (id: number) => {
    if (!editingData) return;
    try {
      const res = await fetch(`${API_URL}${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingData),
      });
      if (!res.ok) throw new Error('Error al actualizar categoría');
      toast.success('Categoría actualizada!');
      setEditingId(null);
      setEditingData(null);
      fetchCategories();
    } catch {
      toast.error('No se pudo actualizar categoría.');
    }
  };

  const deleteCategory = async (id: number) => {
    const confirmed = await confirmDialog({
      title: '¿Eliminar categoría?',
      description: 'Esta acción eliminará la categoría de tareas permanentemente.',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
    });
    if (!confirmed) return;
    try {
      const res = await fetch(`${API_URL}${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar categoría');
      toast.success('Categoría eliminada!');
      fetchCategories();
    } catch {
      toast.error('No se pudo eliminar categoría.');
    }
  };

  const handleEditClick = (category: TaskCategory) => {
    setEditingId(category.idTaskCategory!);
    setEditingData({ ...category });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingData(null);
  };

  return (
    <div className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
      <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">Gestión de Categorías de Tareas</h1>

      <AdminSection>
        <h2 className="text-xl font-semibold mb-4 text-teal-400">Agregar Nueva Categoría</h2>
        <div className="flex gap-4 flex-wrap items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="block mb-1 text-sm text-slate-300">Nombre de la categoría</label>
            <input
              type="text"
              name="categoryName"
              placeholder="Ej: Alimentación..."
              value={newCategory.categoryName}
              onChange={e => setNewCategory({ ...newCategory, categoryName: e.target.value })}
              className="select-field w-full placeholder-gray-400"
            />
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="block mb-1 text-sm text-slate-300">Descripción</label>
            <input
              type="text"
              name="description"
              placeholder="Ej: Tareas relacionadas con la alimentación..."
              value={newCategory.description}
              onChange={e => setNewCategory({ ...newCategory, description: e.target.value })}
              className="select-field w-full placeholder-gray-400"
            />
          </div>
          <AddButton onClick={createCategory} />
        </div>
      </AdminSection>
      <AdminSection>
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
                      onClick={() => handleEditClick(category)}
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
              </div>
            ))}
          </div>
        )}

        {editingId !== null && editingData && createPortal(
          <div
            className="fixed inset-0 lg:left-80 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={handleCancelEdit}
          >
            <div
              className="w-full max-w-2xl max-h-[95vh] overflow-y-auto rounded-2xl border border-[#167C79]/60 bg-[#0f172a] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.6)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-[#F8F4E3]">Editar Categoría</h3>
                  <p className="text-sm text-slate-400">Actualiza los datos.</p>
                </div>
                <button onClick={handleCancelEdit} className="rounded-lg border border-slate-500 px-3 py-1.5 text-slate-300 hover:bg-slate-800">
                  Cerrar
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block mb-1">Nombre de la Categoría</label>
                  <input
                    type="text"
                    value={editingData.categoryName}
                    onChange={e => setEditingData({ ...editingData, categoryName: e.target.value })}
                    className="w-full p-2 rounded-md bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block mb-1">Descripción</label>
                  <input
                    type="text"
                    value={editingData.description || ''}
                    onChange={e => setEditingData({ ...editingData, description: e.target.value })}
                    className="w-full p-2 rounded-md bg-gray-700"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-700 pt-4">
                <CancelButton onClick={handleCancelEdit} />
                <SaveButton onClick={() => updateCategory(editingId)} children="Guardar cambios" />
              </div>
            </div>
          </div>,
          document.body
        )}
      </AdminSection>
    </div>
  );
};

export default TaskCategoriesManagement;
