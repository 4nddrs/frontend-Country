import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import { Edit, Trash2, Loader } from 'lucide-react';
import { AddButton, AdminSection, SaveButton, CancelButton } from '../../components/ui/admin-buttons';
import { confirmDialog } from '../../utils/confirmDialog';
import { isDateNotPast, validateMaxLength } from '../../utils/validation';

const API_URL = 'https://api.countryclub.doc-ia.cloud/vaccination_plan_application/';
const BASE_URL = 'https://api.countryclub.doc-ia.cloud';

interface VaccinationPlanApplication {
  idVaccinationPlanApplication?: number;
  applicationDate: string;
  observation?: string;
  fk_idVaccinationPlan: number;
  fk_idHorse: number;
  fk_idEmployee: number;
  created_at?: string;
}

interface VaccinationPlan {
  idVaccinationPlan: number;
  planName: string;
}

interface Horse {
  idHorse: number;
  horseName: string;
}

interface Employee {
  idEmployee: number;
  name: string;
  fullName: string;
}

const VaccinationPlanApplicationManagement = () => {
  const [applications, setApplications] = useState<VaccinationPlanApplication[]>([]);
  const [newApplication, setNewApplication] = useState<Omit<VaccinationPlanApplication, 'idVaccinationPlanApplication'>>({
    applicationDate: '',
    observation: '',
    fk_idVaccinationPlan: 1,
    fk_idHorse: 1,
    fk_idEmployee: 1,
  });
  const [editingData, setEditingData] = useState<VaccinationPlanApplication | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [plans, setPlans] = useState<VaccinationPlan[]>([]);
  const [horses, setHorses] = useState<Horse[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const isEditModalOpen = editingData !== null;

  useEffect(() => {
    if (!isEditModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setEditingData(null); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isEditModalOpen]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [applicationsRes, plansRes, horsesRes, employeesRes] = await Promise.all([
        fetch(`${API_URL}`),
        fetch(`${BASE_URL}/vaccination_plan/`),
        fetch(`${BASE_URL}/horses/`),
        fetch(`${BASE_URL}/employees/`),
      ]);

      const [applicationsData, plansData, horsesData, employeesData] = await Promise.all([
        applicationsRes.json(),
        plansRes.json(),
        horsesRes.json(),
        employeesRes.json(),
      ]);

      setApplications(applicationsData);
      setPlans(plansData);
      setHorses(horsesData);
      setEmployees(employeesData);

      setNewApplication(prev => ({
        ...prev,
        fk_idVaccinationPlan: plansData[0]?.idVaccinationPlan || prev.fk_idVaccinationPlan,
        fk_idHorse: horsesData[0]?.idHorse || prev.fk_idHorse,
        fk_idEmployee: employeesData[0]?.idEmployee || prev.fk_idEmployee,
      }));
    } catch (error) {
      toast.error('No se pudieron cargar los datos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const createApplication = async () => {
    if (!newApplication.applicationDate || !newApplication.fk_idVaccinationPlan || !newApplication.fk_idHorse || !newApplication.fk_idEmployee) {
      toast.error('Fecha, plan, caballo y empleado son obligatorios.');
      return;
    }
    if (!isDateNotPast(newApplication.applicationDate)) {
      toast.error('La fecha de aplicación no puede ser anterior a hoy.');
      return;
    }
    if (!validateMaxLength(newApplication.observation ?? '', 300)) {
      toast.error('La observación debe tener máximo 300 caracteres.');
      return;
    }
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newApplication),
      });
      if (!res.ok) throw new Error('Error al crear aplicación');
      toast.success('Aplicación creada!');
      setNewApplication({
        applicationDate: '',
        observation: '',
        fk_idVaccinationPlan: plans[0]?.idVaccinationPlan || 1,
        fk_idHorse: horses[0]?.idHorse || 1,
        fk_idEmployee: employees[0]?.idEmployee || 1,
      });
      fetchAllData();
    } catch {
      toast.error('No se pudo crear la aplicación.');
    }
  };

  const updateApplication = async (id: number) => {
    if (!editingData) return;
    if (!editingData.applicationDate || !editingData.fk_idVaccinationPlan || !editingData.fk_idHorse || !editingData.fk_idEmployee) {
      toast.error('Fecha, plan, caballo y empleado son obligatorios.');
      return;
    }
    if (!isDateNotPast(editingData.applicationDate)) {
      toast.error('La fecha de aplicación no puede ser anterior a hoy.');
      return;
    }
    if (!validateMaxLength(editingData.observation ?? '', 300)) {
      toast.error('La observación debe tener máximo 300 caracteres.');
      return;
    }
    try {
      const res = await fetch(`${API_URL}${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingData),
      });
      if (!res.ok) throw new Error('Error al actualizar aplicación');
      toast.success('Aplicación actualizada!');
      setEditingData(null);
      fetchAllData();
    } catch {
      toast.error('No se pudo actualizar la aplicación.');
    }
  };

  const deleteApplication = async (id: number) => {
    const confirmed = await confirmDialog({
      title: '¿Eliminar aplicación?',
      description: 'Esta acción eliminará la aplicación de vacunación permanentemente.',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
    });
    if (!confirmed) return;
    try {
      const res = await fetch(`${API_URL}${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar aplicación');
      toast.success('Aplicación eliminada!');
      fetchAllData();
    } catch {
      toast.error('No se pudo eliminar la aplicación.');
    }
  };

  const handleEditClick = (app: VaccinationPlanApplication) => {
    setEditingData({
      ...app,
      applicationDate: app.applicationDate?.slice(0, 10) || '',
    });
  };

  return (
    <div className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
      <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">Ejecución del Plan Sanitario (Vacunas)</h1>

      <AdminSection>
        <h2 className="text-xl font-semibold mb-4 text-[#bdab62]">Agregar Nueva Aplicación</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="flex flex-col">
            <label className="block mb-1 text-gray-300">Fecha de Aplicación</label>
            <input
              type="date"
              name="applicationDate"
              value={newApplication.applicationDate}
              onChange={e => setNewApplication({ ...newApplication, applicationDate: e.target.value })}
              className="w-full"
            />
          </div>
          <div className="flex flex-col">
            <label className="block mb-1 text-gray-300">Observación</label>
            <input
              type="text"
              name="observation"
              placeholder="Observación (Opcional)"
              value={newApplication.observation}
              onChange={e => setNewApplication({ ...newApplication, observation: e.target.value })}
              maxLength={300}
              className="w-full"
            />
          </div>
          <div className="flex flex-col">
            <label className="block mb-1 text-gray-300">Plan de Vacunación</label>
            <select
              name="fk_idVaccinationPlan"
              value={newApplication.fk_idVaccinationPlan}
              onChange={e => setNewApplication({ ...newApplication, fk_idVaccinationPlan: Number(e.target.value) })}
              className="w-full"
            >
              <option value="">-- Selecciona un Plan --</option>
              {plans.map(p => (<option key={p.idVaccinationPlan} value={p.idVaccinationPlan}>{p.planName}</option>))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="block mb-1 text-gray-300">Caballo</label>
            <select
              name="fk_idHorse"
              value={newApplication.fk_idHorse}
              onChange={e => setNewApplication({ ...newApplication, fk_idHorse: Number(e.target.value) })}
              className="w-full"
            >
              <option value="">-- Selecciona un Caballo --</option>
              {horses.map(h => (<option key={h.idHorse} value={h.idHorse}>{h.horseName}</option>))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="block mb-1 text-gray-300">Empleado</label>
            <select
              name="fk_idEmployee"
              value={newApplication.fk_idEmployee}
              onChange={e => setNewApplication({ ...newApplication, fk_idEmployee: Number(e.target.value) })}
              className="w-full"
            >
              <option value="">-- Selecciona un Empleado --</option>
              {employees.map(e => (<option key={e.idEmployee} value={e.idEmployee}>{e.fullName}</option>))}
            </select>
          </div>
        </div>
        <div className="flex justify-end">
          <AddButton onClick={createApplication}>Agregar Aplicación</AddButton>
        </div>
      </AdminSection>

      <AdminSection>
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400 p-8">
            <Loader size={24} className="animate-spin" />Cargando aplicaciones...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {applications.length === 0 ? (
              <p className="text-center text-gray-400 col-span-full">No hay aplicaciones de planes de vacunación registradas.</p>
            ) : (
              applications.map(app => (
                <div key={app.idVaccinationPlanApplication} className="rounded-2xl border border-slate-800/60 bg-gradient-to-br from-amber-500/10 via-slate-900/60 to-slate-900/90 shadow-lg shadow-black/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-amber-500/20">
                  <div className="flex flex-col items-center gap-2 py-5">
                    <span className="h-4 w-4 rounded-full bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.6)]" />
                    <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Aplicación</span>
                  </div>

                  <div className="px-6 pb-6 space-y-4 text-sm text-slate-200">
                    <div className="text-center space-y-1">
                      <h3 className="text-lg font-semibold text-amber-300">{plans.find(p => p.idVaccinationPlan === app.fk_idVaccinationPlan)?.planName || 'N/A'}</h3>
                    </div>

                    <div className="space-y-2 text-center">
                      <p><span className="font-medium text-slate-400">Fecha:</span> {app.applicationDate?.slice(0, 10)}</p>
                      <p><span className="font-medium text-slate-400">Caballo:</span> {horses.find(h => h.idHorse === app.fk_idHorse)?.horseName || 'N/A'}</p>
                      <p><span className="font-medium text-slate-400">Empleado:</span> {employees.find(e => e.idEmployee === app.fk_idEmployee)?.fullName || 'N/A'}</p>
                      <p><span className="font-medium text-slate-400">Observación:</span> {app.observation || 'N/A'}</p>
                    </div>

                    <div className="flex items-center justify-center gap-6 border-t border-slate-800 pt-6 pb-2">
                      <button
                        onClick={() => handleEditClick(app)}
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
                        onClick={() => deleteApplication(app.idVaccinationPlanApplication!)}
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
              ))
            )}
          </div>
        )}

        {isEditModalOpen && createPortal(
          <div
            className="fixed inset-0 lg:left-80 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setEditingData(null)}
          >
            <div
              className="w-full max-w-2xl max-h-[95vh] overflow-y-auto rounded-2xl border border-[#167C79]/60 bg-[#0f172a] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.6)]"
              onClick={e => e.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-[#F8F4E3]">Editar Aplicación de Vacunación</h3>
                  <p className="text-sm text-slate-400">Actualiza los datos.</p>
                </div>
                <button onClick={() => setEditingData(null)} className="rounded-lg border border-slate-500 px-3 py-1.5 text-slate-300 hover:bg-slate-800">
                  Cerrar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium">Fecha de Aplicación</label>
                  <input
                    type="date"
                    value={editingData!.applicationDate}
                    onChange={e => setEditingData({ ...editingData!, applicationDate: e.target.value })}
                    className="w-full p-2 rounded-md bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Observación</label>
                  <input
                    type="text"
                    value={editingData!.observation || ''}
                    onChange={e => setEditingData({ ...editingData!, observation: e.target.value })}
                    maxLength={300}
                    className="w-full p-2 rounded-md bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Plan de Vacunación</label>
                  <select
                    value={editingData!.fk_idVaccinationPlan}
                    onChange={e => setEditingData({ ...editingData!, fk_idVaccinationPlan: Number(e.target.value) })}
                    className="w-full p-2 rounded-md bg-gray-700"
                  >
                    {plans.map(p => (<option key={p.idVaccinationPlan} value={p.idVaccinationPlan}>{p.planName}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Caballo</label>
                  <select
                    value={editingData!.fk_idHorse}
                    onChange={e => setEditingData({ ...editingData!, fk_idHorse: Number(e.target.value) })}
                    className="w-full p-2 rounded-md bg-gray-700"
                  >
                    {horses.map(h => (<option key={h.idHorse} value={h.idHorse}>{h.horseName}</option>))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block mb-1 text-sm font-medium">Empleado</label>
                  <select
                    value={editingData!.fk_idEmployee}
                    onChange={e => setEditingData({ ...editingData!, fk_idEmployee: Number(e.target.value) })}
                    className="w-full p-2 rounded-md bg-gray-700"
                  >
                    {employees.map(e => (<option key={e.idEmployee} value={e.idEmployee}>{e.fullName}</option>))}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-700 pt-4">
                <CancelButton onClick={() => setEditingData(null)} />
                <SaveButton onClick={() => updateApplication(editingData!.idVaccinationPlanApplication!)} children="Guardar cambios" />
              </div>
            </div>
          </div>,
          document.body
        )}
      </AdminSection>
    </div>
  );
};

export default VaccinationPlanApplicationManagement;
