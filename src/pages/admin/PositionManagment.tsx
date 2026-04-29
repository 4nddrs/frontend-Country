import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import { Edit, Trash2, Loader } from 'lucide-react';
import { AddButton, AdminSection, SaveButton, CancelButton } from '../../components/ui/admin-buttons';
import { confirmDialog } from '../../utils/confirmDialog';

const API_URL = 'https://api.countryclub.doc-ia.cloud/employee_positions/';

interface Position {
  idPositionEmployee?: number;
  namePosition: string;
}

const PositionManagement = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [newPosition, setNewPosition] = useState<Position>({ namePosition: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<Position | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const isEditModalOpen = editingId !== null && editingData !== null;

  useEffect(() => {
    if (!isEditModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') handleCancelEdit(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isEditModalOpen]);

  const fetchPositions = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al obtener posiciones');
      const data = await res.json();
      setPositions([...data].sort((a: Position, b: Position) => (b.idPositionEmployee ?? 0) - (a.idPositionEmployee ?? 0)));
    } catch (err) {
      toast.error('No se pudo cargar posiciones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPositions(); }, []);

  const createPosition = async () => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPosition),
      });
      if (!res.ok) throw new Error('Error al crear posición');
      toast.success('Posición creada!');
      setNewPosition({ namePosition: '' });
      fetchPositions();
    } catch {
      toast.error('No se pudo crear posición.');
    }
  };

  const updatePosition = async (id: number) => {
    if (!editingData) return;
    try {
      const res = await fetch(`${API_URL}${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingData),
      });
      if (!res.ok) throw new Error('Error al actualizar posición');
      toast.success('Posición actualizada!');
      setEditingId(null);
      setEditingData(null);
      fetchPositions();
    } catch {
      toast.error('No se pudo actualizar posición.');
    }
  };

  const deletePosition = async (id: number) => {
    const confirmed = await confirmDialog({
      title: '¿Eliminar posición?',
      description: 'Esta acción eliminará la posición de empleado permanentemente.',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
    });
    if (!confirmed) return;
    try {
      const res = await fetch(`${API_URL}${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar posición');
      toast.success('Posición eliminada!');
      fetchPositions();
    } catch {
      toast.error('No se pudo eliminar posición.');
    }
  };

  const handleEditClick = (pos: Position) => {
    setEditingId(pos.idPositionEmployee!);
    setEditingData({ ...pos });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingData(null);
  };

  return (
    <div className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
      <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">Gestión de Posiciones</h1>
      <AdminSection>
        <h2 className="text-xl font-semibold mb-4 text-teal-400">Agregar Nueva Posición</h2>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block mb-1 text-sm text-slate-300">Nombre de la posición <span className="text-slate-500 font-normal"></span></label>
            <input
              type="text"
              name="namePosition"
              placeholder="Ej: Caballerizo...."
              value={newPosition.namePosition}
              onChange={e => setNewPosition({ namePosition: e.target.value })}
              className="select-field w-full placeholder-gray-400"
            />
          </div>
          <AddButton onClick={createPosition} />
        </div>
      </AdminSection>
      <AdminSection>
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            <Loader size={24} className="animate-spin" />Cargando posiciones...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {positions.map(pos => (
              <div
                key={pos.idPositionEmployee}
                className="rounded-2xl border border-slate-800/60 bg-gradient-to-br from-teal-500/10 via-slate-900/60 to-slate-900/90 shadow-lg shadow-black/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-teal-500/20"
              >
                <div className="flex flex-col items-center gap-2 py-5">
                  <span className="h-4 w-4 rounded-full bg-teal-500 shadow-[0_0_12px_rgba(20,184,166,0.6)]" />
                  <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    Posición
                  </span>
                </div>

                <div className="px-6 pb-6 space-y-4 text-sm text-slate-200">
                  <div className="text-center space-y-1">
                    <h3 className="text-lg font-semibold text-teal-300">{pos.namePosition}</h3>
                  </div>

                  <div className="flex items-center justify-center gap-6 border-t border-slate-800 pt-6 pb-2">
                    <button
                      onClick={() => handleEditClick(pos)}
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
                      onClick={() => deletePosition(pos.idPositionEmployee!)}
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
                  <h3 className="text-2xl font-bold text-[#F8F4E3]">Editar Posición</h3>
                  <p className="text-sm text-slate-400">Actualiza los datos.</p>
                </div>
                <button onClick={handleCancelEdit} className="rounded-lg border border-slate-500 px-3 py-1.5 text-slate-300 hover:bg-slate-800">
                  Cerrar
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block mb-1">Nombre de la Posición</label>
                  <input
                    type="text"
                    value={editingData.namePosition}
                    onChange={e => setEditingData({ ...editingData, namePosition: e.target.value })}
                    className="w-full p-2 rounded-md bg-gray-700"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-700 pt-4">
                <CancelButton onClick={handleCancelEdit} />
                <SaveButton onClick={() => updatePosition(editingId)} children="Guardar cambios" />
              </div>
            </div>
          </div>,
          document.body
        )}
      </AdminSection>
    </div>
  );
};
export default PositionManagement;
