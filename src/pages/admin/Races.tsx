import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import { Edit, Trash2, Loader } from 'lucide-react';
import { confirmDialog } from '../../utils/confirmDialog';
import { AddButton, SaveButton, CancelButton } from '../../components/ui/admin-buttons';

const API_URL = 'http://localhost:8000/race/';

interface Race {
  idRace?: number;
  nameRace: string;
}

const RacesManagement = () => {
  const [races, setRaces] = useState<Race[]>([]);
  const [newRace, setNewRace] = useState<Race>({ nameRace: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<Race | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const isEditModalOpen = editingId !== null && editingData !== null;

  useEffect(() => {
    if (!isEditModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') handleCancelEdit(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isEditModalOpen]);

  const fetchRaces = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al obtener razas');
      const data: Race[] = await res.json();
      setRaces(data.sort((a, b) => (b.idRace ?? 0) - (a.idRace ?? 0)));
    } catch {
      toast.error('No se pudo cargar razas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRaces();
  }, []);

  const createRace = async () => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRace),
      });
      if (!res.ok) throw new Error('Error al crear raza');
      toast.success('Raza creada!');
      setNewRace({ nameRace: '' });
      fetchRaces();
    } catch {
      toast.error('No se pudo crear raza.');
    }
  };

  const updateRace = async (id: number) => {
    if (!editingData) return;
    try {
      const res = await fetch(`${API_URL}${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingData),
      });
      if (!res.ok) throw new Error('Error al actualizar raza');
      toast.success('Raza actualizada!');
      setEditingId(null);
      setEditingData(null);
      fetchRaces();
    } catch {
      toast.error('No se pudo actualizar raza.');
    }
  };

  const deleteRace = async (id: number) => {
    const confirmed = await confirmDialog({
      title: '¿Eliminar raza?',
      description: 'Esta acción eliminará la raza de caballos permanentemente.',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
    });
    if (!confirmed) return;
    try {
      const res = await fetch(`${API_URL}${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar raza');
      toast.success('Raza eliminada!');
      fetchRaces();
    } catch {
      toast.error('No se pudo eliminar raza.');
    }
  };

  const handleEditClick = (race: Race) => {
    setEditingId(race.idRace!);
    setEditingData({ ...race });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingData(null);
  };

  return (
    <div className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
      <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">Gestión de Razas</h1>
      <div className="bg-white/5 p-6 rounded-2xl mb-8 text-[#F8F4E3]">
        <h2 className="text-xl font-semibold mb-4 text-teal-400">
          Agregar Nueva Raza
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-end">
          <div className="md:col-span-3">
            <label className="block mb-1">Nombre de la Raza</label>
            <input
              type="text"
              name="nameRace"
              placeholder="Nombre de la raza"
              value={newRace.nameRace}
              onChange={e => setNewRace({ nameRace: e.target.value })}
              className="w-full placeholder-gray-400"
            />
          </div>
          <div className="md:col-span-1 flex justify-center">
            <AddButton onClick={createRace} />
          </div>
        </div>
      </div>
      <div className="bg-white/5 p-6 rounded-2xl mb-8 text-[#F8F4E3]">
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            <Loader size={24} className="animate-spin" />Cargando razas...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {races.map(race => (
              <div
                key={race.idRace}
                className="rounded-2xl border border-slate-800/60 bg-gradient-to-br from-purple-500/10 via-slate-900/60 to-slate-900/90 shadow-lg shadow-black/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-purple-500/20"
              >
                <div className="flex flex-col items-center gap-2 py-5">
                  <span className="h-4 w-4 rounded-full bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.6)]" />
                  <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    Raza
                  </span>
                </div>

                <div className="px-6 pb-6 space-y-4 text-sm text-slate-200">
                  <div className="text-center space-y-1">
                    <h3 className="text-lg font-semibold text-purple-300">{race.nameRace}</h3>
                  </div>

                  <div className="flex items-center justify-center gap-6 border-t border-slate-800 pt-6 pb-2">
                    <button
                      onClick={() => handleEditClick(race)}
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
                      onClick={() => deleteRace(race.idRace!)}
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
                  <h3 className="text-2xl font-bold text-[#F8F4E3]">Editar Raza</h3>
                  <p className="text-sm text-slate-400">Actualiza los datos.</p>
                </div>
                <button onClick={handleCancelEdit} className="rounded-lg border border-slate-500 px-3 py-1.5 text-slate-300 hover:bg-slate-800">
                  Cerrar
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block mb-1">Nombre de la Raza</label>
                  <input
                    type="text"
                    value={editingData.nameRace}
                    onChange={e => setEditingData({ ...editingData, nameRace: e.target.value })}
                    className="w-full p-2 rounded-md bg-gray-700"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-700 pt-4">
                <CancelButton onClick={handleCancelEdit} />
                <SaveButton onClick={() => updateRace(editingId)} children="Guardar cambios" />
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
};
export default RacesManagement;
