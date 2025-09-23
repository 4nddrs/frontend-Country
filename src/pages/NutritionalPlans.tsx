import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Save, Trash2, Loader, X } from 'lucide-react';

const API_URL = 'https://backend-country-nnxe.onrender.com/nutritional-plans/';

interface NutritionalPlan {
  idNutritionalPlan?: number;
  name: string;
  assignmentDate: string; // <--- CAMBIO aquí
  endDate: string;
  state: string;          // <--- CAMBIO aquí
  description?: string;
}

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
  const [loading, setLoading] = useState<boolean>(true);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al obtener planes nutricionales');
      const data = await res.json();
      setPlans(data);
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
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPlan),
      });
      if (!res.ok) throw new Error('Error al crear plan');
      toast.success('Plan creado!');
      setNewPlan({ name: '', assignmentDate: '', endDate: '', state: '', description: '' });
      fetchPlans();
    } catch {
      toast.error('No se pudo crear plan.');
    }
  };

  const updatePlan = async (id: number, updatedPlan: NutritionalPlan) => {
    try {
      const res = await fetch(`${API_URL}${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPlan),
      });
      if (!res.ok) throw new Error('Error al actualizar plan');
      toast.success('Plan actualizado!');
      setEditingId(null);
      fetchPlans();
    } catch {
      toast.error('No se pudo actualizar plan.');
    }
  };

  const deletePlan = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar plan');
      toast.success('Plan eliminado!');
      fetchPlans();
    } catch {
      toast.error('No se pudo eliminar plan.');
    }
  };

  return (
    <div className="container mx-auto p-4 text-white">
      <h1 className="text-3xl font-bold mb-6 text-center">Gestión de Planes Nutricionales</h1>
      <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-8">
      <h2 className="text-xl font-semibold mb-4">Agregar Nuevo Plan Nutricional</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

        <div>
          <label className="block mb-1">Nombre del Plan</label>
          <input
            type="text"
            name="name"
            value={newPlan.name}
            onChange={e => setNewPlan({ ...newPlan, name: e.target.value })}
            className="w-full p-2 rounded-md bg-gray-700 text-white"
          />
        </div>

        <div>
          <label className="block mb-1">Fecha de Asignación</label>
          <input
            type="date"
            name="assignmentDate"
            value={newPlan.assignmentDate}
            onChange={e => setNewPlan({ ...newPlan, assignmentDate: e.target.value })}
            className="w-full p-2 rounded-md bg-gray-700 text-white"
          />
        </div>

        <div>
          <label className="block mb-1">Fecha de Finalización</label>
          <input
            type="date"
            name="endDate"
            value={newPlan.endDate}
            onChange={e => setNewPlan({ ...newPlan, endDate: e.target.value })}
            className="w-full p-2 rounded-md bg-gray-700 text-white"
          />
        </div>

        <div>
          <label className="block mb-1">Estado del Plan</label>
          <input
            type="text"
            name="state"
            value={newPlan.state}
            onChange={e => setNewPlan({ ...newPlan, state: e.target.value })}
            className="w-full p-2 rounded-md bg-gray-700 text-white"
          />
        </div>

        <div className="md:col-span-2 lg:col-span-3">
          <label className="block mb-1">Descripción</label>
          <input
            type="text"
            name="description"
            value={newPlan.description}
            onChange={e => setNewPlan({ ...newPlan, description: e.target.value })}
            className="w-full p-2 rounded-md bg-gray-700 text-white"
          />
        </div>

      </div>

      <div className="mt-4 text-right">
        <button
          onClick={createPlan}
          className="bg-green-600 hover:bg-green-700 text-white p-2 px-4 rounded-md font-semibold flex items-center gap-2 inline-flex"
        >
          <Plus size={20} /> Agregar
        </button>
      </div>
    </div>

      <div className="bg-gray-800 p-6 rounded-lg shadow-md">
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            <Loader size={24} className="animate-spin" />Cargando planes...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map(plan => (
              <div key={plan.idNutritionalPlan} className="bg-gray-700 p-4 rounded-md shadow-lg flex flex-col justify-between">
                {editingId === plan.idNutritionalPlan ? (
                  <>
                    <input
                      type="text"
                      defaultValue={plan.name}
                      onChange={e => setNewPlan({ ...newPlan, name: e.target.value })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="date"
                      defaultValue={plan.assignmentDate?.slice(0, 10)}
                      onChange={e => setNewPlan({ ...newPlan, assignmentDate: e.target.value })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="date"
                      defaultValue={plan.endDate?.slice(0, 10)}
                      onChange={e => setNewPlan({ ...newPlan, endDate: e.target.value })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="text"
                      defaultValue={plan.state}
                      onChange={e => setNewPlan({ ...newPlan, state: e.target.value })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="text"
                      defaultValue={plan.description}
                      onChange={e => setNewPlan({ ...newPlan, description: e.target.value })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => updatePlan(plan.idNutritionalPlan!, {
                          name: newPlan.name || plan.name,
                          assignmentDate: newPlan.assignmentDate || plan.assignmentDate,
                          endDate: newPlan.endDate || plan.endDate,
                          state: newPlan.state || plan.state,
                          description: newPlan.description || plan.description,
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
                    <h3 className="text-lg font-semibold">{plan.name}</h3>
                    <p>Asignado: {plan.assignmentDate?.slice(0, 10)}</p>
                    <p>Fin: {plan.endDate?.slice(0, 10)}</p>
                    <p>Estado: {plan.state}</p>
                    <p>{plan.description}</p>
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => { setEditingId(plan.idNutritionalPlan!); setNewPlan(plan); }}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white p-2 rounded-md flex items-center gap-1"
                      >
                        <Edit size={16} /> Editar
                      </button>
                      <button
                        onClick={() => deletePlan(plan.idNutritionalPlan!)}
                        className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-md flex items-center gap-1"
                      >
                        <Trash2 size={16} /> Eliminar
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

export default NutritionalPlansManagement;