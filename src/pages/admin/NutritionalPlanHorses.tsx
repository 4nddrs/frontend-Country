import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import { Edit, Trash2, Loader } from 'lucide-react';
import { AddButton, AdminSection, SaveButton, CancelButton } from '../../components/ui/admin-buttons';
import { confirmDialog } from '../../utils/confirmDialog';
import { isDateNotPast } from '../../utils/validation';

const API_URL = 'https://api.countryclub.doc-ia.cloud/nutritional-plan-horses/';

interface NutritionalPlanHorse {
  idNutritionalPlan_horse?: number;
  assignmentDate: string;
  fk_idNutritionalPlan: number;
  fk_idHorse: number;
}

const NutritionalPlanHorsesManagement = () => {
  const [assignments, setAssignments] = useState<NutritionalPlanHorse[]>([]);
  const [newAssignment, setNewAssignment] = useState<NutritionalPlanHorse>({
    assignmentDate: '',
    fk_idNutritionalPlan: 1,
    fk_idHorse: 1,
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<NutritionalPlanHorse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [nutritionalPlans, setNutritionalPlans] = useState<any[]>([]);
  const [horses, setHorses] = useState<any[]>([]);

  const isEditModalOpen = editingId !== null && editingData !== null;

  useEffect(() => {
    if (!isEditModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') handleCancelEdit(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isEditModalOpen]);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al obtener asignaciones');
      const data = await res.json();
      setAssignments(data);
    } catch {
      toast.error('No se pudo cargar asignaciones.');
    } finally {
      setLoading(false);
    }
  };

  const fetchNutritionalPlans = async () => {
    try {
      const res = await fetch("https://api.countryclub.doc-ia.cloud/nutritional-plans/");
      if (!res.ok) throw new Error("Error al obtener planes nutricionales");
      const data = await res.json();
      setNutritionalPlans(data);
    } catch {
      // Silenciar error de carga
    }
  };

  const fetchHorses = async () => {
    try {
      const res = await fetch("https://api.countryclub.doc-ia.cloud/horses/");
      if (!res.ok) throw new Error("Error al obtener caballos");
      const data = await res.json();
      setHorses(data);
    } catch {
      // Silenciar error de carga
    }
  };

  useEffect(() => {
    fetchAssignments();
    fetchNutritionalPlans();
    fetchHorses();
  }, []);

  const createAssignment = async () => {
    if (!newAssignment.assignmentDate || !newAssignment.fk_idNutritionalPlan || !newAssignment.fk_idHorse) {
      toast.error('Fecha, plan nutricional y caballo son obligatorios.');
      return;
    }
    if (!isDateNotPast(newAssignment.assignmentDate)) {
      toast.error('La fecha de asignación no puede ser anterior a hoy.');
      return;
    }
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAssignment),
      });
      if (!res.ok) throw new Error('Error al crear asignación');
      toast.success('Asignación creada!');
      setNewAssignment({ assignmentDate: '', fk_idNutritionalPlan: 1, fk_idHorse: 1 });
      fetchAssignments();
    } catch {
      toast.error('No se pudo crear asignación.');
    }
  };

  const updateAssignment = async (id: number) => {
    if (!editingData) return;
    if (!editingData.assignmentDate || !editingData.fk_idNutritionalPlan || !editingData.fk_idHorse) {
      toast.error('Fecha, plan nutricional y caballo son obligatorios.');
      return;
    }
    if (!isDateNotPast(editingData.assignmentDate)) {
      toast.error('La fecha de asignación no puede ser anterior a hoy.');
      return;
    }
    try {
      const res = await fetch(`${API_URL}${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingData),
      });
      if (!res.ok) throw new Error('Error al actualizar asignación');
      toast.success('Asignación actualizada!');
      setEditingId(null);
      setEditingData(null);
      fetchAssignments();
    } catch {
      toast.error('No se pudo actualizar asignación.');
    }
  };

  const deleteAssignment = async (id: number) => {
    const confirmed = await confirmDialog({
      title: '¿Eliminar asignación?',
      description: 'Esta acción eliminará la asignación del plan nutricional al caballo.',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
    });
    if (!confirmed) return;
    try {
      const res = await fetch(`${API_URL}${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar asignación');
      toast.success('Asignación eliminada!');
      fetchAssignments();
    } catch {
      toast.error('No se pudo eliminar asignación.');
    }
  };

  const handleEditClick = (assign: NutritionalPlanHorse) => {
    setEditingId(assign.idNutritionalPlan_horse!);
    setEditingData({
      ...assign,
      assignmentDate: assign.assignmentDate?.slice(0, 10) || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingData(null);
  };

  return (
    <div className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
      <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">Gestión de Asignaciones de Planes Nutricionales a Caballos</h1>

      <AdminSection>
        <h2 className="text-xl font-semibold mb-4 text-[#bdab62]">Agregar Nueva Asignación</h2>
        <div className="flex gap-4 flex-wrap">
          <input
            type="date"
            name="assignmentDate"
            value={newAssignment.assignmentDate}
            onChange={e => setNewAssignment({ ...newAssignment, assignmentDate: e.target.value })}
            className="select-field flex-1 placeholder-gray-400"
          />
          <select
            name="fk_idNutritionalPlan"
            value={newAssignment.fk_idNutritionalPlan || ""}
            onChange={e => setNewAssignment({ ...newAssignment, fk_idNutritionalPlan: Number(e.target.value) })}
            className="select-field flex-1"
          >
            <option value="">-- Selecciona un plan nutricional --</option>
            {nutritionalPlans.map(plan => (
              <option key={plan.idNutritionalPlan} value={plan.idNutritionalPlan}>{plan.name}</option>
            ))}
          </select>
          <select
            name="fk_idHorse"
            value={newAssignment.fk_idHorse || ""}
            onChange={e => setNewAssignment({ ...newAssignment, fk_idHorse: Number(e.target.value) })}
            className="select-field flex-1"
          >
            <option value="">-- Selecciona un caballo --</option>
            {horses.map(horse => (
              <option key={horse.idHorse} value={horse.idHorse}>{horse.horseName}</option>
            ))}
          </select>
          <AddButton onClick={createAssignment} />
        </div>
      </AdminSection>

      <AdminSection>
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            <Loader size={24} className="animate-spin" />Cargando asignaciones...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignments.map(assign => (
              <div key={assign.idNutritionalPlan_horse} className="rounded-2xl border border-slate-800/60 bg-gradient-to-br from-emerald-500/10 via-slate-900/60 to-slate-900/90 shadow-lg shadow-black/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-emerald-500/20">
                <div className="flex flex-col items-center gap-2 py-5">
                  <span className="h-4 w-4 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]" />
                  <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Asignación</span>
                </div>

                <div className="px-6 pb-6 space-y-4 text-sm text-slate-200">
                  <div className="text-center space-y-1">
                    <h3 className="text-lg font-semibold text-emerald-300">
                      {nutritionalPlans.find(p => p.idNutritionalPlan === assign.fk_idNutritionalPlan)?.name || `Plan #${assign.fk_idNutritionalPlan}`}
                    </h3>
                    <p className="text-slate-400">
                      Caballo: <span className="font-medium text-slate-200">{horses.find(h => h.idHorse === assign.fk_idHorse)?.horseName || `#${assign.fk_idHorse}`}</span>
                    </p>
                    <p className="text-slate-400">
                      Fecha: <span className="font-medium text-slate-200">{assign.assignmentDate?.slice(0, 10)}</span>
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-6 border-t border-slate-800 pt-6 pb-2">
                    <button
                      onClick={() => handleEditClick(assign)}
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
                      onClick={() => deleteAssignment(assign.idNutritionalPlan_horse!)}
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
              className="w-full max-w-lg max-h-[95vh] overflow-y-auto rounded-2xl border border-[#167C79]/60 bg-[#0f172a] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.6)]"
              onClick={e => e.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-[#F8F4E3]">Editar Asignación</h3>
                  <p className="text-sm text-slate-400">Actualiza los datos.</p>
                </div>
                <button onClick={handleCancelEdit} className="rounded-lg border border-slate-500 px-3 py-1.5 text-slate-300 hover:bg-slate-800">
                  Cerrar
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block mb-1 text-sm font-medium">Fecha de Asignación</label>
                  <input
                    type="date"
                    value={editingData!.assignmentDate}
                    onChange={e => setEditingData({ ...editingData!, assignmentDate: e.target.value })}
                    className="w-full p-2 rounded-md bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Plan Nutricional</label>
                  <select
                    value={editingData!.fk_idNutritionalPlan}
                    onChange={e => setEditingData({ ...editingData!, fk_idNutritionalPlan: Number(e.target.value) })}
                    className="w-full p-2 rounded-md bg-gray-700"
                  >
                    <option value="">-- Selecciona un plan --</option>
                    {nutritionalPlans.map(plan => (
                      <option key={plan.idNutritionalPlan} value={plan.idNutritionalPlan}>{plan.name}</option>
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
                    <option value="">-- Selecciona un caballo --</option>
                    {horses.map(horse => (
                      <option key={horse.idHorse} value={horse.idHorse}>{horse.horseName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-700 pt-4">
                <CancelButton onClick={handleCancelEdit} />
                <SaveButton onClick={() => updateAssignment(editingId!)} children="Guardar cambios" />
              </div>
            </div>
          </div>,
          document.body
        )}
      </AdminSection>
    </div>
  );
};

export default NutritionalPlanHorsesManagement;
