import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Save, Trash2, Loader, X } from 'lucide-react';

const API_URL = 'https://backend-country-nnxe.onrender.com/vaccination_plan/';
const MEDICINES_URL = 'https://backend-country-nnxe.onrender.com/medicines/';

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
      toast.error("No se pudieron cargar las medicinas");
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
    if (!window.confirm('¿Estás seguro de que quieres eliminar este plan?')) return;
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
                className="flex-grow p-2 rounded-md bg-gray-600 text-white"
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
                className="flex-grow p-2 rounded-md bg-gray-600 text-white"
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
                className="w-1/2 p-2 rounded-md bg-gray-600 text-white"
              />
              <input
                type="number"
                value={value}
                placeholder="Número de Dosis"
                onChange={(e) => setNewPlan((prev) => ({
                  ...prev,
                  dosesByMonth: { ...prev.dosesByMonth, [key]: Number(e.target.value) }
                }))}
                className="w-1/2 p-2 rounded-md bg-gray-600 text-white"
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
                className="w-1/2 p-2 rounded-md bg-gray-600 text-white"
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
                className="flex-grow p-2 rounded-md bg-gray-600 text-white"
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
                className="flex-grow p-2 rounded-md bg-gray-600 text-white"
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
                className="w-1/2 p-2 rounded-md bg-gray-600 text-white"
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
                className="w-1/2 p-2 rounded-md bg-gray-600 text-white"
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
                className="w-1/2 p-2 rounded-md bg-gray-600 text-white"
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
    <div className="bg-slate-900 p-6 rounded-lg shadow-xl mb-8 border border-slate-700">
      <h1 className="text-3xl font-bold mb-6 text-center text-teal-400">Gestión de Planes de Vacunación</h1>
      
      {/* Formulario para agregar */}
      <div className="bg-slate-800 p-6 rounded-lg shadow-xl mb-8 border border-slate-700">
        <h2 className="text-xl font-semibold mb-4 text-teal-400">Agregar Nuevo Plan</h2>
        <div className="flex flex-col gap-4">
          <input
            type="text"
            name="planName"
            placeholder="Nombre del Plan"
            value={newPlan.planName}
            onChange={e => setNewPlan({ ...newPlan, planName: e.target.value })}
            className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          {renderAddForm()}
          <input
            type="text"
            name="alertStatus"
            placeholder="Estado de Alerta"
            value={newPlan.alertStatus}
            onChange={e => setNewPlan({ ...newPlan, alertStatus: e.target.value })}
            className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          <select
            name="fk_idMedicine"
            value={newPlan.fk_idMedicine}
            onChange={e => setNewPlan({ ...newPlan, fk_idMedicine: Number(e.target.value) })}
            className="p-2 rounded-md bg-gray-700 text-white"
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
      <div className="bg-slate-800 p-6 rounded-lg shadow-xl mb-8 border border-slate-700">
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
                <div key={plan.idVaccinationPlan} className="bg-gray-700 p-4 rounded-md shadow-lg flex flex-col justify-between">
                  {editingId === plan.idVaccinationPlan ? (
                    <>
                      <input
                        type="text"
                        defaultValue={editingPlanData?.planName}
                        onChange={e => setEditingPlanData((prev) => prev ? { ...prev, planName: e.target.value } : null)}
                        className="p-2 rounded-md bg-gray-600 text-white mb-2"
                      />
                      {renderEditForm()}
                      <input
                        type="text"
                        defaultValue={editingPlanData?.alertStatus}
                        onChange={e => setEditingPlanData((prev) => prev ? { ...prev, alertStatus: e.target.value } : null)}
                        className="p-2 rounded-md bg-gray-600 text-white mb-2"
                      />
                      <select
                        value={editingPlanData?.fk_idMedicine}
                        onChange={e => setEditingPlanData((prev) => prev ? { ...prev, fk_idMedicine: Number(e.target.value) } : null)}
                        className="p-2 rounded-md bg-gray-600 text-white mb-2"
                      >
                        {medicines.map(m => (<option key={m.idMedicine} value={m.idMedicine}>{m.name}</option>))}
                      </select>
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          onClick={() => updatePlan(plan.idVaccinationPlan!)}
                          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md flex items-center gap-1"
                        >
                          <Save size={16} /> Guardar
                        </button>
                        <button
                          onClick={() => { setEditingId(null); setEditingPlanData(null); }}
                          className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded-md flex items-center gap-1"
                        >
                          <X size={16} /> Cancelar
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex-grow space-y-1 mb-4">
                        <h3 className="text-xl font-bold">{plan.planName}</h3>
                        <p className="text-sm text-gray-400">Medicina: {medicines.find(m => m.idMedicine === plan.fk_idMedicine)?.name || 'N/A'}</p>
                        <p className="text-sm text-gray-400">Estado de Alerta: {plan.alertStatus}</p>
                        
                        <div className="mt-2 text-sm">
                          <h4 className="font-semibold text-gray-300">Meses Programados:</h4>
                          <ul className="list-disc list-inside ml-2">
                            {parsedScheduledMonths ?
                              Object.values(parsedScheduledMonths).map((month: any, index) => (
                                <li key={index}>{month}</li>
                              ))
                              : <li>{plan.scheduledMonths}</li>
                            }
                          </ul>
                        </div>
                        
                        <div className="mt-2 text-sm">
                          <h4 className="font-semibold text-gray-300">Dosis por Mes:</h4>
                          <ul className="list-disc list-inside ml-2">
                            {parsedDosesByMonth ?
                              Object.entries(parsedDosesByMonth).map(([month, doses]: any) => (
                                <li key={month}>{month}: {doses} dosis</li>
                              ))
                              : <li>{plan.dosesByMonth}</li>
                            }
                          </ul>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          onClick={() => handleEditClick(plan)}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white p-2 rounded-md flex items-center gap-1"
                        >
                          <Edit size={16} /> Editar
                        </button>
                        <button
                          onClick={() => deletePlan(plan.idVaccinationPlan!)}
                          className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-md flex items-center gap-1"
                        >
                          <Trash2 size={16} /> Eliminar
                        </button>
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