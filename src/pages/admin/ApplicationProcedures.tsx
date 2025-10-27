import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Save, Trash2, Loader, X } from 'lucide-react';

const API_URL = 'https://backend-country-nnxe.onrender.com/application_procedures/';

interface ApplicationProcedure {
  idApplicationProcedure?: number;
  executionDate: string; // ISO date string (YYYY-MM-DD)
  observations?: string;
  fk_idScheduledProcedure: number;
  fk_idHorse: number;
  created_at?: string;
}

const ApplicationProceduresManagement = () => {
  const [procedures, setProcedures] = useState<ApplicationProcedure[]>([]);
  const [newProcedure, setNewProcedure] = useState<ApplicationProcedure>({
    executionDate: '',
    observations: '',
    fk_idScheduledProcedure: 1,
    fk_idHorse: 1,
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // For selects
  const [scheduledProcedures, setScheduledProcedures] = useState<any[]>([]);
  const [horses, setHorses] = useState<any[]>([]);

  const fetchScheduledProcedures = async () => {
    try {
      const res = await fetch("https://backend-country-nnxe.onrender.com/scheduled_procedures/");
      if (!res.ok) throw new Error("Error al obtener procedimientos programados");
      const data = await res.json();
      setScheduledProcedures(data);
    } catch {
      toast.error("No se pudieron cargar procedimientos programados");
    }
  };

  const fetchHorses = async () => {
    try {
      const res = await fetch("https://backend-country-nnxe.onrender.com/horses/");
      if (!res.ok) throw new Error("Error al obtener caballos");
      const data = await res.json();
      setHorses(data);
    } catch {
      toast.error("No se pudieron cargar caballos");
    }
  };

  const fetchProcedures = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al obtener procedimientos');
      const data = await res.json();
      setProcedures(data);
    } catch {
      toast.error('No se pudo cargar procedimientos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcedures();
    fetchScheduledProcedures();
    fetchHorses();
  }, []);

  const createProcedure = async () => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProcedure),
      });
      if (!res.ok) throw new Error('Error al crear procedimiento');
      toast.success('Procedimiento creado!');
      setNewProcedure({
        executionDate: '',
        observations: '',
        fk_idScheduledProcedure: 1,
        fk_idHorse: 1,
      });
      fetchProcedures();
    } catch {
      toast.error('No se pudo crear procedimiento.');
    }
  };

  const updateProcedure = async (id: number, updatedProcedure: ApplicationProcedure) => {
    try {
      const res = await fetch(`${API_URL}${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProcedure),
      });
      if (!res.ok) throw new Error('Error al actualizar procedimiento');
      toast.success('Procedimiento actualizado!');
      setEditingId(null);
      fetchProcedures();
    } catch {
      toast.error('No se pudo actualizar procedimiento.');
    }
  };

  const deleteProcedure = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar procedimiento');
      toast.success('Procedimiento eliminado!');
      fetchProcedures();
    } catch {
      toast.error('No se pudo eliminar procedimiento.');
    }
  };

  return (
    <div  className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
      <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">Ejecución de Procedimientos Sanitarios</h1>
      
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.5)] text-[#F8F4E3]">
        <h2 className="text-xl font-semibold mb-4 text-teal-400">Agregar Nueva Aplicación</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex flex-col">
            <label className="block mb-1">Fecha de ejecución</label>
            <input
              id="executionDate-input"
              type="date"
              name="executionDate"
              value={newProcedure.executionDate}
              onChange={e => setNewProcedure({ ...newProcedure, executionDate: e.target.value })}
              className="w-full p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
            />
          </div>

          <div className="flex flex-col">
            <label className="block mb-1">Observaciones</label>
            <input
              id="observations-input"
              type="text"
              name="observations"
              value={newProcedure.observations}
              onChange={e => setNewProcedure({ ...newProcedure, observations: e.target.value })}
              className="w-full p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
              placeholder="Ej: El caballo reaccionó bien"
            />
          </div>


          <div className="flex flex-col">
            <label className="block mb-1">Procedimiento programado</label>
            <select
              id="scheduledProcedure-select"
              name="fk_idScheduledProcedure"
              value={newProcedure.fk_idScheduledProcedure}
              onChange={e => setNewProcedure({ ...newProcedure, fk_idScheduledProcedure: Number(e.target.value) })}
              className="w-full p-2 rounded-md bg-gray-700 text-white"
            >
              <option value="">-- Selecciona procedimiento programado --</option>
              {scheduledProcedures.map(proc => (
                <option key={proc.idScheduledProcedure} value={proc.idScheduledProcedure}>
                  {proc.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label htmlFor="horse-select" className="block mb-1">Caballo</label>
            <select
              id="horse-select"
              name="fk_idHorse"
              value={newProcedure.fk_idHorse}
              onChange={e => setNewProcedure({ ...newProcedure, fk_idHorse: Number(e.target.value) })}
              className="w-full p-2 rounded-md bg-gray-700 text-white"
            >
              <option value="">-- Selecciona caballo --</option>
              {horses.map(horse => (
                <option key={horse.idHorse} value={horse.idHorse}>
                  {horse.horseName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end justify-end col-span-1 md:col-span-2 lg:col-span-1">
            <button onClick={createProcedure} className="w-full p-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-semibold flex items-center justify-center gap-2">
              <Plus size={20} /> Agregar
            </button>
          </div>
        </div>
      </div>
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.5)] text-[#F8F4E3]">
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            <Loader size={24} className="animate-spin" />Cargando aplicaciones...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {procedures.map(proc => (
              <div key={proc.idApplicationProcedure} className="bg-gray-700 p-4 rounded-md shadow-lg flex flex-col justify-between">
                {editingId === proc.idApplicationProcedure ? (
                  <>
                    <input
                      type="date"
                      defaultValue={proc.executionDate?.slice(0, 10)}
                      onChange={e => setNewProcedure({ ...newProcedure, executionDate: e.target.value })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="text"
                      defaultValue={proc.observations}
                      onChange={e => setNewProcedure({ ...newProcedure, observations: e.target.value })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <select
                      value={newProcedure.fk_idScheduledProcedure}
                      onChange={e => setNewProcedure({ ...newProcedure, fk_idScheduledProcedure: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    >
                      {scheduledProcedures.map(proc2 => (
                        <option key={proc2.idScheduledProcedure} value={proc2.idScheduledProcedure}>
                          {proc2.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={newProcedure.fk_idHorse}
                      onChange={e => setNewProcedure({ ...newProcedure, fk_idHorse: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    >
                      {horses.map(horse => (
                        <option key={horse.idHorse} value={horse.idHorse}>
                          {horse.horseName}
                        </option>
                      ))}
                    </select>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => updateProcedure(proc.idApplicationProcedure!, {
                          executionDate: newProcedure.executionDate || proc.executionDate,
                          observations: newProcedure.observations || proc.observations,
                          fk_idScheduledProcedure: newProcedure.fk_idScheduledProcedure || proc.fk_idScheduledProcedure,
                          fk_idHorse: newProcedure.fk_idHorse || proc.fk_idHorse,
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
                    <h3 className="text-lg font-semibold">Fecha ejecución: {proc.executionDate?.slice(0, 10)}</h3>
                    <p>Procedimiento: {scheduledProcedures.find(s => s.idScheduledProcedure === proc.fk_idScheduledProcedure)?.name || proc.fk_idScheduledProcedure}</p>
                    <p>Caballo: {horses.find(h => h.idHorse === proc.fk_idHorse)?.horseName || proc.fk_idHorse}</p>
                    <p>Observaciones: {proc.observations}</p>
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => { setEditingId(proc.idApplicationProcedure!); setNewProcedure(proc); }}
                        className="relative flex items-center justify-center w-15 h-15 rounded-[20px]
                                  bg-gradient-to-b from-[#1A1C1E] to-[#0E0F10]
                                  shadow-[8px_8px_16px_rgba(0,0,0,0.8),-5px_-5px_12px_rgba(255,255,255,0.07)]
                                  hover:scale-[1.08] active:shadow-[inset_5px_5px_12px_rgba(0,0,0,0.85),inset_-4px_-4px_10px_rgba(255,255,255,0.05)]
                                  transition-all duration-300 ease-in-out
                                  before:absolute before:inset-0 before:rounded-[20px]
                                  before:bg-gradient-to-b before:from-white/10 before:to-transparent before:opacity-25"
                      >
                        <Edit size={28} className="text-[#E8C967] drop-shadow-[0_0_6px_rgba(255,215,100,0.85)]" />
                      </button>
                      <button
                        onClick={() => deleteProcedure(proc.idApplicationProcedure!)}
                        className="relative flex items-center justify-center w-15 h-15 rounded-[20px]
                                  bg-gradient-to-b from-[#1A1C1E] to-[#0E0F10]
                                  shadow-[8px_8px_16px_rgba(0,0,0,0.8),-5px_-5px_12px_rgba(255,255,255,0.07)]
                                  hover:scale-[1.08] active:shadow-[inset_5px_5px_12px_rgba(0,0,0,0.85),inset_-4px_-4px_10px_rgba(255,255,255,0.05)]
                                  transition-all duration-300 ease-in-out
                                  before:absolute before:inset-0 before:rounded-[20px]
                                  before:bg-gradient-to-b before:from-white/10 before:to-transparent before:opacity-25"
                      >
                        <Trash2 size={28} className="text-[#E86B6B] drop-shadow-[0_0_7px_rgba(255,80,80,0.9)]" />
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

export default ApplicationProceduresManagement;