import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Save, Trash2, Loader, X } from 'lucide-react';

const API_URL = 'http://localhost:8000/vaccines/';

interface Vaccine {
  idVaccine?: number;
  vaccineName: string;
  vaccineType: string;
}

const VaccinesManagement = () => {
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [newVaccine, setNewVaccine] = useState<Vaccine>({
    vaccineName: '',
    vaccineType: '',
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchVaccines = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al obtener vacunas');
      const data = await res.json();
      setVaccines(data);
    } catch {
      toast.error('No se pudo cargar vacunas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVaccines();
  }, []);

  const createVaccine = async () => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVaccine),
      });
      if (!res.ok) throw new Error('Error al crear vacuna');
      toast.success('Vacuna creada!');
      setNewVaccine({ vaccineName: '', vaccineType: '' });
      fetchVaccines();
    } catch {
      toast.error('No se pudo crear vacuna.');
    }
  };

  const updateVaccine = async (id: number, updatedVaccine: Vaccine) => {
    try {
      const res = await fetch(`${API_URL}${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedVaccine),
      });
      if (!res.ok) throw new Error('Error al actualizar vacuna');
      toast.success('Vacuna actualizada!');
      setEditingId(null);
      fetchVaccines();
    } catch {
      toast.error('No se pudo actualizar vacuna.');
    }
  };

  const deleteVaccine = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar vacuna');
      toast.success('Vacuna eliminada!');
      fetchVaccines();
    } catch {
      toast.error('No se pudo eliminar vacuna.');
    }
  };

  return (
    <div className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
      <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">Gestión de Vacunas</h1>
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.5)] text-[#F8F4E3]">
        <h2 className="text-xl font-semibold mb-4">Agregar Nueva Vacuna</h2>
        <div className="flex gap-4">
          <input
            type="text"
            name="vaccineName"
            placeholder="Nombre de la vacuna"
            value={newVaccine.vaccineName}
            onChange={e => setNewVaccine({ ...newVaccine, vaccineName: e.target.value })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          <input
            type="text"
            name="vaccineType"
            placeholder="Tipo de vacuna"
            value={newVaccine.vaccineType}
            onChange={e => setNewVaccine({ ...newVaccine, vaccineType: e.target.value })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          <button onClick={createVaccine} className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-md font-semibold flex items-center gap-2">
            <Plus size={20} /> Agregar
          </button>
        </div>
      </div>
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.5)] text-[#F8F4E3]">
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            <Loader size={24} className="animate-spin" />Cargando vacunas...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vaccines.map(vaccine => (
              <div
                key={vaccine.idVaccine}
                className="rounded-2xl border border-slate-800/60 bg-gradient-to-br from-emerald-500/10 via-slate-900/60 to-slate-900/90 shadow-lg shadow-black/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-emerald-500/20"
              >
                {editingId === vaccine.idVaccine ? (
                  <div className="p-6">
                    <div>
                      <label className="block mb-1 text-sm font-medium">Nombre de la vacuna</label>
                      <input
                        type="text"
                        defaultValue={vaccine.vaccineName}
                        onChange={e => setNewVaccine({ ...newVaccine, vaccineName: e.target.value })}
                        className="w-full p-2 rounded-md bg-gray-600 text-white mb-2"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium">Tipo</label>
                      <input
                        type="text"
                        defaultValue={vaccine.vaccineType}
                        onChange={e => setNewVaccine({ ...newVaccine, vaccineType: e.target.value })}
                        className="w-full p-2 rounded-md bg-gray-600 text-white mb-2"
                      />
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => updateVaccine(vaccine.idVaccine!, {
                          vaccineName: newVaccine.vaccineName || vaccine.vaccineName,
                          vaccineType: newVaccine.vaccineType || vaccine.vaccineType,
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
                      <span className="h-4 w-4 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]" />
                      <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
                        Vacuna
                      </span>
                    </div>

                    <div className="px-6 pb-6 space-y-4 text-sm text-slate-200">
                      <div className="text-center space-y-1">
                        <h3 className="text-lg font-semibold text-emerald-300">{vaccine.vaccineName}</h3>
                      </div>

                      <div className="rounded-xl border border-slate-800/80 bg-slate-900/70 p-4 text-xs leading-relaxed">
                        <ul className="space-y-1">
                          <li><strong>Tipo:</strong> {vaccine.vaccineType}</li>
                        </ul>
                      </div>

                      <div className="flex items-center justify-center gap-6 border-t border-slate-800 pt-6 pb-2">
                        <button
                          onClick={() => { setEditingId(vaccine.idVaccine!); setNewVaccine(vaccine); }}
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
                          onClick={() => deleteVaccine(vaccine.idVaccine!)}
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

export default VaccinesManagement;