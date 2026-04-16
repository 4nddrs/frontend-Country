import React, { useState, useEffect } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import { Edit, Save, Trash2, Loader, X } from 'lucide-react';
import { AddButton, AdminSection } from '../../components/ui/admin-buttons';
import { confirmDialog } from '../../utils/confirmDialog';

const API_URL = 'http://localhost:8000/vaccination_plan_application/';
const BASE_URL = 'http://localhost:8000';

interface VaccinationPlanApplication {
  idVaccinationPlanApplication?: number;
  applicationDate: string; // "YYYY-MM-DD"
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
    fk_idVaccinationPlan: 1, // Default to first available, or a sensible default
    fk_idHorse: 1, // Default to first available
    fk_idEmployee: 1, // Default to first available
  });
  const [editedApplication, setEditedApplication] = useState<VaccinationPlanApplication | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [plans, setPlans] = useState<VaccinationPlan[]>([]);
  const [horses, setHorses] = useState<Horse[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

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

      // Set initial values for newApplication dropdowns if data is available
      setNewApplication(prev => ({
        ...prev,
        fk_idVaccinationPlan: plansData[0]?.idVaccinationPlan || prev.fk_idVaccinationPlan,
        fk_idHorse: horsesData[0]?.idHorse || prev.fk_idHorse,
        fk_idEmployee: employeesData[0]?.idEmployee || prev.fk_idEmployee,
      }));

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('No se pudieron cargar los datos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>, formType: 'new' | 'edit') => {
    const { name, value } = e.target;
    if (formType === 'new') {
      setNewApplication(prev => ({
        ...prev,
        [name]: name.startsWith('fk_') ? Number(value) : value,
      }));
    } else {
      setEditedApplication(prev => prev ? {
        ...prev,
        [name]: name.startsWith('fk_') ? Number(value) : value,
      } : null);
    }
  };

  const createApplication = async () => {
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
    } catch (error) {
      toast.error('No se pudo crear la aplicación.');
    }
  };

  const updateApplication = async (id: number) => {
    if (!editedApplication) return;
    try {
      const res = await fetch(`${API_URL}${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedApplication),
      });
      if (!res.ok) throw new Error('Error al actualizar aplicación');
      toast.success('Aplicación actualizada!');
      setEditedApplication(null);
      fetchAllData();
    } catch (error) {
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
    } catch (error) {
      toast.error('No se pudo eliminar la aplicación.');
    }
  };

  return (
    <div  className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
      <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">Ejecución del Plan Sanitario (Vacunas)</h1>
      
      <AdminSection>
        <h2 className="text-xl font-semibold mb-4 text-teal-400">Agregar Nueva Aplicación</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6"> {/* Added mb-6 for spacing */}
          <div className="flex flex-col"> {/* Use flex-col for label-input stacking */}
            <label htmlFor="applicationDate" className="block mb-1 text-gray-300">Fecha de Aplicación</label>
            <input
              type="date"
              id="applicationDate" // Added id for accessibility
              name="applicationDate"
              value={newApplication.applicationDate}
              onChange={(e) => handleFormChange(e, 'new')}
              className="select-field placeholder-gray-400 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="observation" className="block mb-1 text-gray-300">Observación</label>
            <input
              type="text"
              id="observation"
              name="observation"
              placeholder="Observación (Opcional)"
              value={newApplication.observation}
              onChange={(e) => handleFormChange(e, 'new')}
              className="select-field placeholder-gray-400 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="fk_idVaccinationPlan" className="block mb-1 text-gray-300">Plan de Vacunación</label>
            <select
              id="fk_idVaccinationPlan"
              name="fk_idVaccinationPlan"
              value={newApplication.fk_idVaccinationPlan}
              onChange={(e) => handleFormChange(e, 'new')}
              className="select-field border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Selecciona un Plan --</option>
              {plans.map(p => (<option key={p.idVaccinationPlan} value={p.idVaccinationPlan}>{p.planName}</option>))}
            </select>
          </div>
          <div className="flex flex-col">
            <label htmlFor="fk_idHorse" className="block mb-1 text-gray-300">Caballo</label>
            <select
              id="fk_idHorse"
              name="fk_idHorse"
              value={newApplication.fk_idHorse}
              onChange={(e) => handleFormChange(e, 'new')}
              className="select-field border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Selecciona un Caballo --</option>
              {horses.map(h => (<option key={h.idHorse} value={h.idHorse}>{h.horseName}</option>))}
            </select>
          </div>
          <div className="flex flex-col">
            <label htmlFor="fk_idEmployee" className="block mb-1 text-gray-300">Empleado</label>
            <select
              id="fk_idEmployee"
              name="fk_idEmployee"
              value={newApplication.fk_idEmployee}
              onChange={(e) => handleFormChange(e, 'new')}
              className="select-field border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <h2 className="text-xl font-semibold mb-4">Lista de Aplicaciones</h2>
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
                  {editedApplication?.idVaccinationPlanApplication === app.idVaccinationPlanApplication ? (
                    <>
                      <div className="flex flex-col gap-2 mb-4"> {/* Consistent styling for edit inputs */}
                        <label className="block">
                          <span className="text-gray-300">Fecha:</span>
                          <input
                            type="date"
                            name="applicationDate"
                            value={editedApplication ? editedApplication.applicationDate?.slice(0, 10) || '' : ''}
                            onChange={(e) => handleFormChange(e, 'edit')}
                            className="select-field w-full border border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </label>
                        <label className="block">
                          <span className="text-gray-300">Observación:</span>
                          <input
                            type="text"
                            name="observation"
                            value={editedApplication?.observation || ''}
                            onChange={(e) => handleFormChange(e, 'edit')}
                            className="select-field w-full border border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </label>
                        <label className="block">
                          <span className="text-gray-300">Plan:</span>
                          <select
                            name="fk_idVaccinationPlan"
                            value={editedApplication?.fk_idVaccinationPlan ?? ''}
                            onChange={(e) => handleFormChange(e, 'edit')}
                            className="select-field w-full border border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {plans.map(p => (<option key={p.idVaccinationPlan} value={p.idVaccinationPlan}>{p.planName}</option>))}
                          </select>
                        </label>
                        <label className="block">
                          <span className="text-gray-300">Caballo:</span>
                          <select
                            name="fk_idHorse"
                            value={editedApplication?.fk_idHorse ?? ''}
                            onChange={(e) => handleFormChange(e, 'edit')}
                            className="select-field w-full border border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {horses.map(h => (<option key={h.idHorse} value={h.idHorse}>{h.horseName}</option>))}
                          </select>
                        </label>
                        <label className="block">
                          <span className="text-gray-300">Empleado:</span>
                          <select
                            name="fk_idEmployee"
                            value={editedApplication?.fk_idEmployee ?? ''}
                            onChange={(e) => handleFormChange(e, 'edit')}
                            className="select-field w-full border border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {employees.map(e => (<option key={e.idEmployee} value={e.idEmployee}>{e.fullName}</option>))}
                          </select>
                        </label>
                      </div>
                      <div className="flex justify-center gap-3 px-6 pb-6 mt-2">
                        <button
                          onClick={() => updateApplication(app.idVaccinationPlanApplication!)}
                          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md flex items-center gap-1 transition duration-300"
                        >
                          <Save size={16} /> Guardar
                        </button>
                        <button
                          onClick={() => setEditedApplication(null)}
                          className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-md flex items-center gap-1"
                        >
                          <X size={16} /> Cancelar
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-col items-center gap-2 py-5">
                        <span className="h-4 w-4 rounded-full bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.6)]" />
                        <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
                          Aplicación
                        </span>
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
                          onClick={() => setEditedApplication(app)}
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
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </AdminSection>
    </div>
  );
};

const App = () => {
  return (
    <>
      <style>{`
        body {
          font-family: 'Inter', sans-serif;
          background-color: #1a202c; /* Darker background for the app */
        }
      `}</style>
      <Toaster />
      <VaccinationPlanApplicationManagement />
    </>
  );
};

export default App;




