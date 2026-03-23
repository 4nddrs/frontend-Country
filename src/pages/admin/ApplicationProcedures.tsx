import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Save, Trash2, Loader, X } from 'lucide-react';
import { confirmDialog } from '../../utils/confirmDialog';

const API_URL = 'http://localhost:8000/application_procedures/';

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
      const res = await fetch("http://localhost:8000/scheduled_procedures/");
      if (!res.ok) throw new Error("Error al obtener procedimientos programados");
      const data = await res.json();
      setScheduledProcedures(data);
    } catch {
      // Silenciar error de carga
    }
  };

  const fetchHorses = async () => {
    try {
      const res = await fetch("http://localhost:8000/horses/");
      if (!res.ok) throw new Error("Error al obtener caballos");
      const data = await res.json();
      setHorses(data);
    } catch {
      // Silenciar error de carga
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
    const confirmed = await confirmDialog({
      title: '¿Eliminar procedimiento?',
      description: 'Esta acción eliminará el procedimiento de aplicación permanentemente.',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
    });
    if (!confirmed) return;
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
              className="w-full"
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
              className="w-full"
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
              className="w-full"
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
              className="w-full"
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
              <div key={proc.idApplicationProcedure} className="rounded-2xl border border-slate-800/60 bg-gradient-to-br from-pink-500/10 via-slate-900/60 to-slate-900/90 shadow-lg shadow-black/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-pink-500/20">
                {editingId === proc.idApplicationProcedure ? (
                  <>
                    <input
                      type="date"
                      defaultValue={proc.executionDate?.slice(0, 10)}
                      onChange={e => setNewProcedure({ ...newProcedure, executionDate: e.target.value })}
                      className="select-field mb-2"
                    />
                    <input
                      type="text"
                      defaultValue={proc.observations}
                      onChange={e => setNewProcedure({ ...newProcedure, observations: e.target.value })}
                      className="select-field mb-2"
                    />
                    <select
                      value={newProcedure.fk_idScheduledProcedure}
                      onChange={e => setNewProcedure({ ...newProcedure, fk_idScheduledProcedure: Number(e.target.value) })}
                      className="select-field mb-2"
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
                      className="select-field mb-2"
                    >
                      {horses.map(horse => (
                        <option key={horse.idHorse} value={horse.idHorse}>
                          {horse.horseName}
                        </option>
                      ))}
                    </select>
                    <div className="flex justify-center gap-3 px-6 pb-4">
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
                        className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-md flex items-center gap-1"
                      >
                        <X size={16} /> Cancelar
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col items-center gap-2 py-5">
                      <span className="h-4 w-4 rounded-full bg-pink-500 shadow-[0_0_12px_rgba(236,72,153,0.6)]" />
                      <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
                        Aplicación
                      </span>
                    </div>

                    <div className="px-6 pb-6 space-y-4 text-sm text-slate-200">
                      <div className="text-center space-y-1">
                        <h3 className="text-lg font-semibold text-pink-300">{proc.executionDate?.slice(0, 10)}</h3>
                      </div>

                      <div className="space-y-2 text-center">
                        <p><span className="font-medium text-slate-400">Procedimiento:</span> {scheduledProcedures.find(s => s.idScheduledProcedure === proc.fk_idScheduledProcedure)?.name || proc.fk_idScheduledProcedure}</p>
                        <p><span className="font-medium text-slate-400">Caballo:</span> {horses.find(h => h.idHorse === proc.fk_idHorse)?.horseName || proc.fk_idHorse}</p>
                        <p><span className="font-medium text-slate-400">Observaciones:</span> {proc.observations}</p>
                      </div>

                      <div className="flex items-center justify-center gap-6 border-t border-slate-800 pt-6 pb-2">
                        <button
                          onClick={() => { setEditingId(proc.idApplicationProcedure!); setNewProcedure(proc); }}
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
                          onClick={() => deleteProcedure(proc.idApplicationProcedure!)}
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

export default ApplicationProceduresManagement;




