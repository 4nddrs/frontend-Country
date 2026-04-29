import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import { Edit, Trash2, Loader } from 'lucide-react';
import { confirmDialog } from '../../utils/confirmDialog';
import { AddButton, AdminSection, SaveButton, CancelButton } from '../../components/ui/admin-buttons';

const API_URL = 'https://api.countryclub.doc-ia.cloud/nutritional-plans/';

interface NutritionalPlan {
  idNutritionalPlan?: number;
  name: string;
  assignmentDate: string;
  endDate: string;
  state: string;
  description?: string;
}

const computeState = (assignmentDate: string, endDate: string): string => {
  if (!assignmentDate || !endDate) return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'VENCIDO';
  if (diffDays <= 7) return 'POR VENCER';
  return 'ACTIVO';
};

const STATE_CONFIG: Record<string, { dot: string; text: string; bg: string; glow: string; pulse: boolean }> = {
  ACTIVO: {
    dot: 'bg-emerald-400',
    text: 'text-emerald-300',
    bg: 'bg-emerald-950/60 border border-emerald-500/30',
    glow: 'shadow-[0_0_12px_rgba(16,185,129,0.25)]',
    pulse: true,
  },  
  'POR VENCER': {
    dot: 'bg-amber-400',
    text: 'text-amber-300',
    bg: 'bg-amber-950/60 border border-amber-500/30',
    glow: 'shadow-[0_0_12px_rgba(245,158,11,0.25)]',
    pulse: false,
  },
  VENCIDO: {
    dot: 'bg-rose-400',
    text: 'text-rose-300',
    bg: 'bg-rose-950/60 border border-rose-500/30',
    glow: 'shadow-[0_0_12px_rgba(244,63,94,0.25)]',
    pulse: false,
  },
};

const StateBadge = ({ state }: { state: string }) => {
  const cfg = STATE_CONFIG[state];
  if (!cfg) return <span className="text-slate-500 text-xs">—</span>;
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold tracking-widest uppercase ${cfg.bg} ${cfg.glow} ${cfg.text}`}>
      <span className="relative flex h-2 w-2 shrink-0">
        {cfg.pulse && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-70 ${cfg.dot}`} />
        )}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${cfg.dot}`} />
      </span>
      {state}
    </span>
  );
};

const NutritionalPlansManagement = () => {
  const [plans, setPlans] = useState<NutritionalPlan[]>([]);
  const [newPlan, setNewPlan] = useState<NutritionalPlan>({
    name: '',
    assignmentDate: '',
    endDate: '',
    state: '',
    description: '',
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<NutritionalPlan | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const isEditModalOpen = editingId !== null && editingData !== null;

  useEffect(() => {
    if (!isEditModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') handleCancelEdit(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isEditModalOpen]);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al obtener planes nutricionales');
      const data: NutritionalPlan[] = await res.json();
      setPlans(data.sort((a, b) => (b.idNutritionalPlan ?? 0) - (a.idNutritionalPlan ?? 0)));
    } catch {
      toast.error('No se pudo cargar planes nutricionales.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const createPlan = async () => {
    const planToCreate = {
      ...newPlan,
      state: computeState(newPlan.assignmentDate, newPlan.endDate),
    };
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planToCreate),
      });
      if (!res.ok) throw new Error('Error al crear plan');
      toast.success('Plan creado!');
      setNewPlan({ name: '', assignmentDate: '', endDate: '', state: '', description: '' });
      fetchPlans();
    } catch {
      toast.error('No se pudo crear plan.');
    }
  };

  const updatePlan = async (id: number) => {
    if (!editingData) return;
    const planToUpdate = {
      ...editingData,
      state: computeState(editingData.assignmentDate, editingData.endDate),
    };
    try {
      const res = await fetch(`${API_URL}${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planToUpdate),
      });
      if (!res.ok) throw new Error('Error al actualizar plan');
      toast.success('Plan actualizado!');
      setEditingId(null);
      setEditingData(null);
      fetchPlans();
    } catch {
      toast.error('No se pudo actualizar plan.');
    }
  };

  const deletePlan = async (id: number) => {
    const confirmed = await confirmDialog({
      title: '¿Eliminar plan nutricional?',
      description: 'Esta acción eliminará el plan nutricional permanentemente.',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
    });
    if (!confirmed) return;
    try {
      const res = await fetch(`${API_URL}${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar plan');
      toast.success('Plan eliminado!');
      fetchPlans();
    } catch {
      toast.error('No se pudo eliminar plan.');
    }
  };

  const handleEditClick = (plan: NutritionalPlan) => {
    setEditingId(plan.idNutritionalPlan!);
    setEditingData({ ...plan, assignmentDate: plan.assignmentDate?.slice(0, 10) || '', endDate: plan.endDate?.slice(0, 10) || '' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingData(null);
  };

  return (
    <div className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
      <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">Gestión de Planes Nutricionales</h1>

      <AdminSection>
        <h2 className="text-xl font-semibold mb-4 text-teal-400">Agregar Nuevo Plan Nutricional</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block mb-1">Nombre del Plan</label>
            <input type="text" name="name" value={newPlan.name}
              onChange={e => setNewPlan({ ...newPlan, name: e.target.value })} className="w-full" />
          </div>
          <div>
            <label className="block mb-1">Fecha de Asignación</label>
            <input type="date" name="assignmentDate" value={newPlan.assignmentDate}
              onChange={e => setNewPlan({ ...newPlan, assignmentDate: e.target.value })} className="w-full" />
          </div>
          <div>
            <label className="block mb-1">Fecha de Finalización</label>
            <input type="date" name="endDate" value={newPlan.endDate}
              onChange={e => setNewPlan({ ...newPlan, endDate: e.target.value })} className="w-full" />
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <label className="block mb-1">Descripción</label>
            <input type="text" name="description" value={newPlan.description}
              onChange={e => setNewPlan({ ...newPlan, description: e.target.value })} className="w-full" />
          </div>
        </div>
        <div className="mt-6 text-right">
          <AddButton onClick={createPlan} />
        </div>
      </AdminSection>

      <AdminSection>
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            <Loader size={24} className="animate-spin" />Cargando planes...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map(plan => (
              <div
                key={plan.idNutritionalPlan}
                className="rounded-2xl border border-slate-800/60 bg-gradient-to-br from-blue-500/10 via-slate-900/60 to-slate-900/90 shadow-lg shadow-black/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-blue-500/20"
              >
                <div className="flex flex-col items-center gap-2 py-5">
                  <span className="h-4 w-4 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.6)]" />
                  <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Planes</span>
                </div>

                <div className="px-6 pb-6 space-y-4 text-sm text-slate-200">
                  <div className="text-center space-y-1">
                    <h3 className="text-lg font-semibold text-blue-300">{plan.name}</h3>
                  </div>

                  <div className="rounded-xl border border-slate-800/80 bg-slate-900/70 p-4 text-xs leading-relaxed">
                    <ul className="space-y-1">
                      <li><strong>Fin:</strong> {plan.endDate?.slice(0, 10)}</li>
                      <li className="flex items-center gap-2"><strong>Estado:</strong> <StateBadge state={computeState(plan.assignmentDate, plan.endDate)} /></li>
                      <li><strong>Descripción:</strong> {plan.description || 'Sin descripción'}</li>
                    </ul>
                  </div>

                  <div className="flex items-center justify-center gap-6 border-t border-slate-800 pt-6 pb-2">
                    <button
                      onClick={() => handleEditClick(plan)}
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
                      onClick={() => deletePlan(plan.idNutritionalPlan!)}
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
                  <h3 className="text-2xl font-bold text-[#F8F4E3]">Editar Plan Nutricional</h3>
                  <p className="text-sm text-slate-400">Actualiza los datos.</p>
                </div>
                <button onClick={handleCancelEdit} className="rounded-lg border border-slate-500 px-3 py-1.5 text-slate-300 hover:bg-slate-800">
                  Cerrar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block mb-1">Nombre del Plan</label>
                  <input type="text" value={editingData.name}
                    onChange={e => setEditingData({ ...editingData, name: e.target.value })}
                    className="w-full p-2 rounded-md bg-gray-700" />
                </div>
                <div>
                  <label className="block mb-1">Fecha de Asignación</label>
                  <input type="date" value={editingData.assignmentDate}
                    onChange={e => setEditingData({ ...editingData, assignmentDate: e.target.value })}
                    className="w-full p-2 rounded-md bg-gray-700" />
                </div>
                <div>
                  <label className="block mb-1">Fecha de Finalización</label>
                  <input type="date" value={editingData.endDate}
                    onChange={e => setEditingData({ ...editingData, endDate: e.target.value })}
                    className="w-full p-2 rounded-md bg-gray-700" />
                </div>
                <div className="md:col-span-2">
                  <label className="block mb-1">Descripción</label>
                  <input type="text" value={editingData.description || ''}
                    onChange={e => setEditingData({ ...editingData, description: e.target.value })}
                    className="w-full p-2 rounded-md bg-gray-700" />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-700 pt-4">
                <CancelButton onClick={handleCancelEdit} />
                <SaveButton onClick={() => updatePlan(editingId)} children="Guardar cambios" />
              </div>
            </div>
          </div>,
          document.body
        )}
      </AdminSection>
    </div>
  );
};

export default NutritionalPlansManagement;
