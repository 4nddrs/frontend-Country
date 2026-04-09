import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Save, Trash2, Loader, X } from 'lucide-react';
import { confirmDialog } from '../../utils/confirmDialog';

const API_URL = 'http://localhost:8000/race/';

interface Race {
  idRace?: number;
  nameRace: string;
}

const RacesManagement = () => {
  const [races, setRaces] = useState<Race[]>([]);
  const [newRace, setNewRace] = useState<Race>({ nameRace: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchRaces = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al obtener razas');
      const data = await res.json();
      setRaces(data);
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

  const updateRace = async (id: number, updatedRace: Race) => {
    try {
      const res = await fetch(`${API_URL}${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRace),
      });
      if (!res.ok) throw new Error('Error al actualizar raza');
      toast.success('Raza actualizada!');
      setEditingId(null);
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

  return (
    <div  className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
      <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">Gestión de Razas</h1>
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.5)] text-[#F8F4E3]">
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

        <div className="md:col-span-1">
          <button onClick={createRace} className="group relative w-full">
            <div className="relative z-10 inline-flex w-full h-11 items-center justify-center overflow-hidden rounded-md border border-emerald-500 bg-emerald-600 px-4 font-medium text-white transition-all duration-300 group-hover:-translate-x-6 group-hover:-translate-y-6 group-active:translate-x-0 group-active:translate-y-0 gap-2">
              <Plus size={15} /> Agregar
            </div>
            <div className="absolute inset-0 z-0 h-full w-full rounded-md bg-emerald-700 transition-all duration-300 group-hover:-translate-x-6 group-hover:-translate-y-6 group-hover:[box-shadow:8px_8px_rgba(5,150,105,0.8),16px_16px_rgba(52,211,153,0.5),24px_24px_rgba(110,231,183,0.25)] group-active:translate-x-0 group-active:translate-y-0 group-active:shadow-none" />          
          </button>
        </div>
      </div>
    </div>
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.5)] text-[#F8F4E3]">
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
                {editingId === race.idRace ? (
                  <div className="p-6">
                    <input
                      type="text"
                      defaultValue={race.nameRace}
                      onChange={e => setNewRace({ nameRace: e.target.value })}
                      className="select-field px-4 py-2 rounded-md border border-gray-600 focus:border-blue-500 focus:outline-none w-full"
                    />
                    <div className="flex justify-center gap-3 px-6 pb-4 mt-3">
                      <button
                        onClick={() => updateRace(race.idRace!, { nameRace: newRace.nameRace || race.nameRace })}
                        className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md flex items-center gap-1"
                      >
                        <Save size={16} /> Guardar
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-md flex items-center gap-1"
                      >
                        <X size={16} /> Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
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
                          onClick={() => { setEditingId(race.idRace!); setNewRace(race); }}
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
export default RacesManagement;




