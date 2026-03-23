import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Save, Trash2, Loader, X } from 'lucide-react';
import { confirmDialog } from '../../utils/confirmDialog';

const API_URL = 'http://localhost:8000/vaccination_plan/';
const MEDICINES_URL = 'http://localhost:8000/medicines/';

interface VaccinationPlan {
  idVaccinationPlan?: number;
  planName: string;
  scheduledMonths: string; // JSON string
  dosesByMonth: string; // JSON string
  alertStatus: string;
  fk_idMedicine: number;
  created_at?: string;
}

// Interfaz para la representación de los datos en el frontend
interface FrontendPlanData {
  planName: string;
  scheduledMonths: { [key: string]: string };
  dosesByMonth: { [key: string]: number };
  alertStatus: string;
  fk_idMedicine: number;
}

const initialNewPlan: FrontendPlanData = {
  planName: '',
  scheduledMonths: {},
  dosesByMonth: {},
  alertStatus: '',
  fk_idMedicine: 1,
};

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const VaccinationPlanManagement = () => {
  const [plans, setPlans] = useState<VaccinationPlan[]>([]);
  const [newPlan, setNewPlan] = useState<FrontendPlanData>({ ...initialNewPlan });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingPlanData, setEditingPlanData] = useState<FrontendPlanData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [medicines, setMedicines] = useState<any[]>([]);

  // --- EFECTOS Y FETCHING DE DATOS ---
  useEffect(() => {
    fetchPlans();
    fetchMedicines();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al obtener planes de vacunación');
      const data = await res.json();
      setPlans(data);
    } catch (e) {
      toast.error('No se pudieron cargar los planes de vacunación.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicines = async () => {
    try {
      const res = await fetch(MEDICINES_URL);
      if (!res.ok) throw new Error("Error al obtener medicinas");
      const data = await res.json();
      setMedicines(data);
    } catch {
      // Silenciar error de carga
    }
  };

  // --- FUNCIONES CRUD ---
  const createPlan = async () => {
    try {
      // Convertir los objetos a JSON strings para el backend
      const planToSend = {
        ...newPlan,
        scheduledMonths: JSON.stringify(newPlan.scheduledMonths),
        dosesByMonth: JSON.stringify(newPlan.dosesByMonth),
      };

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planToSend),
      });

      if (!res.ok) throw new Error('Error al crear plan');
      toast.success('Plan de vacunación creado!');
      setNewPlan({ ...initialNewPlan }); // Resetear el formulario
      fetchPlans();
    } catch (e: any) {
      toast.error(`Error al crear plan: ${e.message}`);
    }
  };

  const updatePlan = async (id: number) => {
    if (!editingPlanData) return;
    try {
      // Convertir los objetos a JSON strings para el backend
      const planToSend = {
        ...editingPlanData,
        scheduledMonths: JSON.stringify(editingPlanData.scheduledMonths),
        dosesByMonth: JSON.stringify(editingPlanData.dosesByMonth),
      };
      
      const res = await fetch(`${API_URL}${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planToSend),
      });
      if (!res.ok) throw new Error('Error al actualizar plan');
      toast.success('Plan de vacunación actualizado!');
      setEditingId(null);
      setEditingPlanData(null);
      fetchPlans();
    } catch (e: any) {
      toast.error(`Error al actualizar plan: ${e.message}`);
    }
  };

  const deletePlan = async (id: number) => {
    const confirmed = await confirmDialog({
      title: '¿Eliminar plan de vacunación?',
      description: 'Esta acción eliminará el plan de vacunación permanentemente.',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
    });
    if (!confirmed) return;
    try {
      const res = await fetch(`${API_URL}${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar plan');
      toast.success('Plan de vacunación eliminado!');
      fetchPlans();
    } catch {
      toast.error('No se pudo eliminar el plan de vacunación.');
    }
  };
  
  // --- MANEJADORES DE ESTADO DEL FORMULARIO DINÁMICO ---
  const handleEditClick = (plan: VaccinationPlan) => {
    setEditingId(plan.idVaccinationPlan!);
    try {
      const parsedPlan: FrontendPlanData = {
        ...plan,
        scheduledMonths: JSON.parse(plan.scheduledMonths),
        dosesByMonth: JSON.parse(plan.dosesByMonth),
      };
      setEditingPlanData(parsedPlan);
    } catch (e) {
      toast.error('Error al cargar datos de edición. Formato JSON inválido.');
      console.error(e);
      setEditingId(null);
    }
  };
  

  const renderAddForm = () => {
    const availableScheduledMonths = MONTHS.filter(month => !Object.values(newPlan.scheduledMonths).includes(month));
    const availableDosesMonths = MONTHS.filter(month => !Object.keys(newPlan.dosesByMonth).includes(month));

    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 p-2 bg-gray-700 rounded-md">
          <label className="text-gray-300 font-bold">Meses Programados</label>
          {Object.entries(newPlan.scheduledMonths).map(([key, value]) => (
            <div key={key} className="flex gap-2 items-center">
              <input
                type="text"
                readOnly
                value={value}
                className="w-full"
              />
              <button
                onClick={() => setNewPlan((prev) => {
                  const updated = { ...prev.scheduledMonths };
                  delete updated[key];
                  return { ...prev, scheduledMonths: updated };
                })}
                className="bg-red-600 hover:bg-red-700 p-2 rounded-md"
              >
                <X size={16} />
              </button>
            </div>
          ))}
          {availableScheduledMonths.length > 0 && (
            <div className="flex gap-2 mt-2 items-center">
              <select
                onChange={(e) => {
                  const selectedMonth = e.target.value;
                  if (selectedMonth) {
                    setNewPlan((prev) => ({
                      ...prev,
                      scheduledMonths: {
                        ...prev.scheduledMonths,
                        [`month${Object.keys(prev.scheduledMonths).length + 1}`]: selectedMonth,
                      },
                    }));
                  }
                }}
                className="w-full"
                value=""
              >
                <option value="" disabled>Selecciona un mes</option>
                {availableScheduledMonths.map((month) => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
              <button
                onClick={() => {
                  const selectedMonth = availableScheduledMonths[0];
                  setNewPlan((prev) => ({
                    ...prev,
                    scheduledMonths: {
                      ...prev.scheduledMonths,
                      [`month${Object.keys(prev.scheduledMonths).length + 1}`]: selectedMonth,
                    },
                  }));
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md flex items-center justify-center gap-1"
                disabled={availableScheduledMonths.length === 0}
              >
                <Plus size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Dosis por Mes */}
        <div className="flex flex-col gap-2 p-2 bg-gray-700 rounded-md">
          <label className="text-gray-300 font-bold">Dosis por Mes</label>
          {Object.entries(newPlan.dosesByMonth).map(([key, value]) => (
            <div key={key} className="flex gap-2 items-center">
              <input
                type="text"
                readOnly
                value={key}
                className="w-full"
              />
              <input
                type="number"
                value={value}
                placeholder="Número de Dosis"
                onChange={(e) => setNewPlan((prev) => ({
                  ...prev,
                  dosesByMonth: { ...prev.dosesByMonth, [key]: Number(e.target.value) }
                }))}
                className="w-full"
              />
              <button
                onClick={() => setNewPlan((prev) => {
                  const updatedDoses = { ...prev.dosesByMonth };
                  delete updatedDoses[key];
                  return { ...prev, dosesByMonth: updatedDoses };
                })}
                className="bg-red-600 hover:bg-red-700 p-2 rounded-md"
              >
                <X size={16} />
              </button>
            </div>
          ))}
          {availableDosesMonths.length > 0 && (
            <div className="flex gap-2 mt-2 items-center">
              <select
                onChange={(e) => {
                  const selectedMonth = e.target.value;
                  if (selectedMonth) {
                    setNewPlan((prev) => ({
                      ...prev,
                      dosesByMonth: { ...prev.dosesByMonth, [selectedMonth]: 0 },
                    }));
                  }
                }}
                className="w-full"
                value=""
              >
                <option value="" disabled>Selecciona un mes</option>
                {availableDosesMonths.map((month) => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
              <button
                onClick={() => {
                  const selectedMonth = availableDosesMonths[0];
                  setNewPlan((prev) => ({
                    ...prev,
                    dosesByMonth: { ...prev.dosesByMonth, [selectedMonth]: 0 },
                  }));
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md flex items-center justify-center gap-1"
                disabled={availableDosesMonths.length === 0}
              >
                <Plus size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- FORMULARIO PARA EDITAR PLAN EXISTENTE ---
  const renderEditForm = () => {
    if (!editingPlanData) return null;
    const availableScheduledMonths = MONTHS.filter(month => !Object.values(editingPlanData.scheduledMonths).includes(month));
    const availableDosesMonths = MONTHS.filter(month => !Object.keys(editingPlanData.dosesByMonth).includes(month));

    return (
      <div className="flex flex-col gap-4">
        {/* Meses Programados */}
        <div className="flex flex-col gap-2 p-2 bg-gray-700 rounded-md">
          <label className="text-gray-300 font-bold">Meses Programados</label>
          {Object.entries(editingPlanData.scheduledMonths).map(([key, value]) => (
            <div key={key} className="flex gap-2 items-center">
              <input
                type="text"
                readOnly
                value={value}
                className="w-full"
              />
              <button
                onClick={() => setEditingPlanData((prev: FrontendPlanData | null) => {
                  if (!prev) return null;
                  const updated = { ...prev.scheduledMonths };
                  delete updated[key];
                  return { ...prev, scheduledMonths: updated };
                })}
                className="bg-red-600 hover:bg-red-700 p-2 rounded-md"
              >
                <X size={16} />
              </button>
            </div>
          ))}
          {availableScheduledMonths.length > 0 && (
            <div className="flex gap-2 mt-2 items-center">
              <select
                onChange={(e) => {
                  const selectedMonth = e.target.value;
                  if (selectedMonth) {
                    setEditingPlanData((prev: FrontendPlanData | null) => {
                      if (!prev) return null;
                      return {
                        ...prev,
                        scheduledMonths: {
                          ...prev.scheduledMonths,
                          [`month${Object.keys(prev.scheduledMonths).length + 1}`]: selectedMonth,
                        },
                      };
                    });
                  }
                }}
                className="w-full"
                value=""
              >
                <option value="" disabled>Selecciona un mes</option>
                {availableScheduledMonths.map((month) => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
              <button
                onClick={() => {
                  const selectedMonth = availableScheduledMonths[0];
                  setEditingPlanData((prev: FrontendPlanData | null) => {
                    if (!prev) return null;
                    return {
                      ...prev,
                      scheduledMonths: {
                        ...prev.scheduledMonths,
                        [`month${Object.keys(prev.scheduledMonths).length + 1}`]: selectedMonth,
                      },
                    };
                  });
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md flex items-center justify-center gap-1"
                disabled={availableScheduledMonths.length === 0}
              >
                <Plus size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Dosis por Mes */}
        <div className="flex flex-col gap-2 p-2 bg-gray-700 rounded-md">
          <label className="text-gray-300 font-bold">Dosis por Mes</label>
          {Object.entries(editingPlanData.dosesByMonth).map(([key, value]) => (
            <div key={key} className="flex gap-2 items-center">
              <input
                type="text"
                readOnly
                value={key}
                className="w-full"
              />
              <input
                type="number"
                value={value}
                placeholder="Número de Dosis"
                onChange={(e) => setEditingPlanData((prev: FrontendPlanData | null) => {
                  if (!prev) return null;
                  return {
                    ...prev,
                    dosesByMonth: { ...prev.dosesByMonth, [key]: Number(e.target.value) }
                  };
                })}
                className="w-full"
              />
              <button
                onClick={() => setEditingPlanData((prev: FrontendPlanData | null) => {
                  if (!prev) return null;
                  const updatedDoses = { ...prev.dosesByMonth };
                  delete updatedDoses[key];
                  return { ...prev, dosesByMonth: updatedDoses };
                })}
                className="bg-red-600 hover:bg-red-700 p-2 rounded-md"
              >
                <X size={16} />
              </button>
            </div>
          ))}
          {availableDosesMonths.length > 0 && (
            <div className="flex gap-2 mt-2 items-center">
              <select
                onChange={(e) => {
                  const selectedMonth = e.target.value;
                  if (selectedMonth) {
                    setEditingPlanData((prev: FrontendPlanData | null) => {
                      if (!prev) return null;
                      return {
                        ...prev,
                        dosesByMonth: { ...prev.dosesByMonth, [selectedMonth]: 0 },
                      };
                    });
                  }
                }}
                className="w-full"
                value=""
              >
                <option value="" disabled>Selecciona un mes</option>
                {availableDosesMonths.map((month) => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
              <button
                onClick={() => {
                  const selectedMonth = availableDosesMonths[0];
                  setEditingPlanData((prev: FrontendPlanData | null) => {
                    if (!prev) return null;
                    return {
                      ...prev,
                      dosesByMonth: { ...prev.dosesByMonth, [selectedMonth]: 0 },
                    };
                  });
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md flex items-center justify-center gap-1"
                disabled={availableDosesMonths.length === 0}
              >
                <Plus size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // Función auxiliar para parsear JSON de forma segura
  const safeJsonParse = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      return typeof parsed === 'object' ? parsed : null;
    } catch (e) {
      return null;
    }
  };

  return (
    <div  className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
      <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">Gestión del Plan Sanitario (Vacunas)</h1>
      
      {/* Formulario para agregar */}
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.5)] text-[#F8F4E3]">
        <h2 className="text-xl font-semibold mb-4 text-teal-400">Agregar Nuevo Plan</h2>
        <div className="flex flex-col gap-4">
          <input
            type="text"
            name="planName"
            placeholder="Nombre del Plan"
            value={newPlan.planName}
            onChange={e => setNewPlan({ ...newPlan, planName: e.target.value })}
            className="select-field placeholder-gray-400"
          />
          {renderAddForm()}
          <input
            type="text"
            name="alertStatus"
            placeholder="Estado de Alerta"
            value={newPlan.alertStatus}
            onChange={e => setNewPlan({ ...newPlan, alertStatus: e.target.value })}
            className="select-field placeholder-gray-400"
          />
          <select
            name="fk_idMedicine"
            value={newPlan.fk_idMedicine}
            onChange={e => setNewPlan({ ...newPlan, fk_idMedicine: Number(e.target.value) })}
            className="select-field"
          >
            <option value={1} disabled>-- Selecciona Medicina --</option>
            {medicines.map(m => (<option key={m.idMedicine} value={m.idMedicine}>{m.name}</option>))}
          </select>
          <button onClick={createPlan} className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-md font-semibold flex items-center justify-center gap-2 mt-4">
            <Plus size={20} /> Agregar Plan
          </button>
        </div>
      </div>
      
      {/* Lista de planes */}
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.5)] text-[#F8F4E3]">
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            <Loader size={24} className="animate-spin" />Cargando planes...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map(plan => {
              const parsedScheduledMonths = safeJsonParse(plan.scheduledMonths);
              const parsedDosesByMonth = safeJsonParse(plan.dosesByMonth);

              return (
                <div key={plan.idVaccinationPlan} className="rounded-2xl border border-slate-800/60 bg-gradient-to-br from-teal-500/10 via-slate-900/60 to-slate-900/90 shadow-lg shadow-black/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-teal-500/20">
                  {editingId === plan.idVaccinationPlan ? (
                    <>
                      <input
                        type="text"
                        defaultValue={editingPlanData?.planName}
                        onChange={e => setEditingPlanData((prev) => prev ? { ...prev, planName: e.target.value } : null)}
                        className="select-field mb-2"
                      />
                      {renderEditForm()}
                      <input
                        type="text"
                        defaultValue={editingPlanData?.alertStatus}
                        onChange={e => setEditingPlanData((prev) => prev ? { ...prev, alertStatus: e.target.value } : null)}
                        className="select-field mb-2"
                      />
                      <select
                        value={editingPlanData?.fk_idMedicine}
                        onChange={e => setEditingPlanData((prev) => prev ? { ...prev, fk_idMedicine: Number(e.target.value) } : null)}
                        className="select-field mb-2"
                      >
                        {medicines.map(m => (<option key={m.idMedicine} value={m.idMedicine}>{m.name}</option>))}
                      </select>
                      <div className="flex justify-center gap-3 px-6 pb-6 mt-4">
                        <button
                          onClick={() => updatePlan(plan.idVaccinationPlan!)}
                          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md flex items-center gap-1"
                        >
                          <Save size={16} /> Guardar
                        </button>
                        <button
                          onClick={() => { setEditingId(null); setEditingPlanData(null); }}
                          className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-md flex items-center gap-1"
                        >
                          <X size={16} /> Cancelar
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-col items-center gap-2 py-5">
                        <span className="h-4 w-4 rounded-full bg-teal-500 shadow-[0_0_12px_rgba(20,184,166,0.6)]" />
                        <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
                          Plan
                        </span>
                      </div>

                      <div className="px-6 pb-6 space-y-4 text-sm text-slate-200">
                        <div className="text-center space-y-1">
                          <h3 className="text-lg font-semibold text-teal-300">{plan.planName}</h3>
                          <p className="text-slate-400">
                            <span className="font-medium text-slate-200">{medicines.find(m => m.idMedicine === plan.fk_idMedicine)?.name || 'N/A'}</span>
                          </p>
                        </div>

                        <div className="space-y-2 text-center text-xs">
                          <div>
                            <p className="font-semibold text-teal-300 mb-1">Meses Programados:</p>
                            <ul className="list-none space-y-1">
                              {parsedScheduledMonths ?
                                Object.values(parsedScheduledMonths).map((month: any, index) => (
                                  <li key={index}>{month}</li>
                                ))
                                : <li>{plan.scheduledMonths}</li>
                              }
                            </ul>
                          </div>
                          
                          <div>
                            <p className="font-semibold text-teal-300 mb-1">Dosis por Mes:</p>
                            <ul className="list-none space-y-1">
                              {parsedDosesByMonth ?
                                Object.entries(parsedDosesByMonth).map(([month, doses]: any) => (
                                  <li key={month}>{month}: {doses} dosis</li>
                                ))
                                : <li>{plan.dosesByMonth}</li>
                              }
                            </ul>
                          </div>
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
                          onClick={() => deletePlan(plan.idVaccinationPlan!)}
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default VaccinationPlanManagement; 




