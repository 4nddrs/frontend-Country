import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import { Edit, Trash2, Loader } from 'lucide-react';
import { confirmDialog } from '../../utils/confirmDialog';
import { AddButton, AdminSection, SaveButton, CancelButton } from '../../components/ui/admin-buttons';

const API_URL = 'http://localhost:8000/application_procedures/';

interface ApplicationProcedure {
  idApplicationProcedure?: number;
  executionDate: string;
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
  const [editingData, setEditingData] = useState<ApplicationProcedure | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [scheduledProcedures, setScheduledProcedures] = useState<any[]>([]);
  const [horses, setHorses] = useState<any[]>([]);

  const isEditModalOpen = editingId !== null && editingData !== null;

  useEffect(() => {
    if (!isEditModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') handleCancelEdit(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isEditModalOpen]);

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
      const list: ApplicationProcedure[] = Array.isArray(data) ? data : [];
      list.sort((a, b) => (b.idApplicationProcedure ?? 0) - (a.idApplicationProcedure ?? 0));
      setProcedures(list);
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
      setNewProcedure({ executionDate: '', observations: '', fk_idScheduledProcedure: 1, fk_idHorse: 1 });
      fetchProcedures();
    } catch {
      toast.error('No se pudo crear procedimiento.');
    }
  };

  const updateProcedure = async (id: number) => {
    if (!editingData) return;
    try {
      const res = await fetch(`${API_URL}${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingData),
      });
      if (!res.ok) throw new Error('Error al actualizar procedimiento');
      toast.success('Procedimiento actualizado!');
      setEditingId(null);
      setEditingData(null);
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

  const handleEditClick = (proc: ApplicationProcedure) => {
    setEditingId(proc.idApplicationProcedure!);
    setEditingData({
      ...proc,
      executionDate: proc.executionDate?.slice(0, 10) || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingData(null);
  };

  return (
    <div className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
      <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">Ejecución de Procedimientos Sanitarios</h1>

      <AdminSection>
        <h2 className="text-xl font-semibold mb-4 text-teal-400">Agregar Nueva Aplicación</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex flex-col">
            <label className="block mb-1">Fecha de ejecución</label>
            <input
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
              name="fk_idScheduledProcedure"
              value={newProcedure.fk_idScheduledProcedure}
              onChange={e => setNewProcedure({ ...newProcedure, fk_idScheduledProcedure: Number(e.target.value) })}
              className="w-full"
            >
              <option value="">-- Selecciona procedimiento programado --</option>
              {scheduledProcedures.map(proc => (
                <option key={proc.idScheduledProcedure} value={proc.idScheduledProcedure}>{proc.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="block mb-1">Caballo</label>
            <select
              name="fk_idHorse"
              value={newProcedure.fk_idHorse}
              onChange={e => setNewProcedure({ ...newProcedure, fk_idHorse: Number(e.target.value) })}
              className="w-full"
            >
              <option value="">-- Selecciona caballo --</option>
              {horses.map(horse => (
                <option key={horse.idHorse} value={horse.idHorse}>{horse.horseName}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end justify-end col-span-1 md:col-span-2 lg:col-span-3">
            <AddButton onClick={createProcedure} className="px-16 justify-center" />
          </div>
        </div>
      </AdminSection>

      <AdminSection>
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            <Loader size={24} className="animate-spin" />Cargando aplicaciones...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {procedures.map(proc => (
              <div key={proc.idApplicationProcedure} className="rounded-2xl border border-slate-800/60 bg-gradient-to-br from-pink-500/10 via-slate-900/60 to-slate-900/90 shadow-lg shadow-black/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-pink-500/20">
                <div className="flex flex-col items-center gap-2 py-5">
                  <span className="h-4 w-4 rounded-full bg-pink-500 shadow-[0_0_12px_rgba(236,72,153,0.6)]" />
                  <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Aplicación</span>
                </div>

                <div className="px-6 pb-6 space-y-4 text-sm text-slate-200">
                  <div className="text-center space-y-1">
                    <h3 className="text-lg font-semibold text-pink-300">{horses.find(h => h.idHorse === proc.fk_idHorse)?.horseName || proc.fk_idHorse}</h3>
                  </div>

                  <div className="space-y-2 text-center">
                    <p><span className="font-medium text-slate-400">Procedimiento:</span> {scheduledProcedures.find(s => s.idScheduledProcedure === proc.fk_idScheduledProcedure)?.name || proc.fk_idScheduledProcedure}</p>
                    <p><span className="font-medium text-slate-400">Caballo:</span> {horses.find(h => h.idHorse === proc.fk_idHorse)?.horseName || proc.fk_idHorse}</p>
                    <p><span className="font-medium text-slate-400">Observaciones:</span> {proc.observations}</p>
                  </div>

                  <div className="flex items-center justify-center gap-6 border-t border-slate-800 pt-6 pb-2">
                    <button
                      onClick={() => handleEditClick(proc)}
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
              </div>
            ))}
          </div>
        )}

        {isEditModalOpen && createPortal(
          <div
            className="fixed inset-0 lg:left-80 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={handleCancelEdit}
          >
            <div
              className="w-full max-w-2xl max-h-[95vh] overflow-y-auto rounded-2xl border border-[#167C79]/60 bg-[#0f172a] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.6)]"
              onClick={e => e.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-[#F8F4E3]">Editar Procedimiento Aplicado</h3>
                  <p className="text-sm text-slate-400">Actualiza los datos.</p>
                </div>
                <button onClick={handleCancelEdit} className="rounded-lg border border-slate-500 px-3 py-1.5 text-slate-300 hover:bg-slate-800">
                  Cerrar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium">Fecha de ejecución</label>
                  <input
                    type="date"
                    value={editingData!.executionDate}
                    onChange={e => setEditingData({ ...editingData!, executionDate: e.target.value })}
                    className="w-full p-2 rounded-md bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Observaciones</label>
                  <input
                    type="text"
                    value={editingData!.observations || ''}
                    onChange={e => setEditingData({ ...editingData!, observations: e.target.value })}
                    className="w-full p-2 rounded-md bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Procedimiento programado</label>
                  <select
                    value={editingData!.fk_idScheduledProcedure}
                    onChange={e => setEditingData({ ...editingData!, fk_idScheduledProcedure: Number(e.target.value) })}
                    className="w-full p-2 rounded-md bg-gray-700"
                  >
                    <option value="">-- Selecciona procedimiento --</option>
                    {scheduledProcedures.map(proc => (
                      <option key={proc.idScheduledProcedure} value={proc.idScheduledProcedure}>{proc.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Caballo</label>
                  <select
                    value={editingData!.fk_idHorse}
                    onChange={e => setEditingData({ ...editingData!, fk_idHorse: Number(e.target.value) })}
                    className="w-full p-2 rounded-md bg-gray-700"
                  >
                    <option value="">-- Selecciona caballo --</option>
                    {horses.map(horse => (
                      <option key={horse.idHorse} value={horse.idHorse}>{horse.horseName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-700 pt-4">
                <CancelButton onClick={handleCancelEdit} />
                <SaveButton onClick={() => updateProcedure(editingId!)} children="Guardar cambios" />
              </div>
            </div>
          </div>,
          document.body
        )}
      </AdminSection>
    </div>
  );
};

export default ApplicationProceduresManagement;
