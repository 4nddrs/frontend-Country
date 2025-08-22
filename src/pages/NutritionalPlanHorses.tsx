import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Save, Trash2, Loader, X } from 'lucide-react';

const API_URL = 'https://backend-country-nnxe.onrender.com/nutritional-plan-horses/';

interface NutritionalPlanHorse {
  idNutritionalPlan_horse?: number;
  assignmentDate: string; // ISO date
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
  const [loading, setLoading] = useState<boolean>(true);

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

  useEffect(() => {
    fetchAssignments();
  }, []);

  const createAssignment = async () => {
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

  const updateAssignment = async (id: number, updatedAssignment: NutritionalPlanHorse) => {
    try {
      const res = await fetch(`${API_URL}${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedAssignment),
      });
      if (!res.ok) throw new Error('Error al actualizar asignación');
      toast.success('Asignación actualizada!');
      setEditingId(null);
      fetchAssignments();
    } catch {
      toast.error('No se pudo actualizar asignación.');
    }
  };

  const deleteAssignment = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar asignación');
      toast.success('Asignación eliminada!');
      fetchAssignments();
    } catch {
      toast.error('No se pudo eliminar asignación.');
    }
  };

  return (
    <div className="container mx-auto p-4 text-white">
      <h1 className="text-3xl font-bold mb-6 text-center">Gestión de Asignaciones de Planes Nutricionales a Caballos</h1>
      <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Agregar Nueva Asignación</h2>
        <div className="flex gap-4 flex-wrap">
          <input
            type="date"
            name="assignmentDate"
            placeholder="Fecha de asignación"
            value={newAssignment.assignmentDate}
            onChange={e => setNewAssignment({ ...newAssignment, assignmentDate: e.target.value })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          <input
            type="number"
            name="fk_idNutritionalPlan"
            placeholder="ID Plan Nutricional"
            value={newAssignment.fk_idNutritionalPlan}
            onChange={e => setNewAssignment({ ...newAssignment, fk_idNutritionalPlan: Number(e.target.value) })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          <input
            type="number"
            name="fk_idHorse"
            placeholder="ID Caballo"
            value={newAssignment.fk_idHorse}
            onChange={e => setNewAssignment({ ...newAssignment, fk_idHorse: Number(e.target.value) })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          <button onClick={createAssignment} className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-md font-semibold flex items-center gap-2">
            <Plus size={20} /> Agregar
          </button>
        </div>
      </div>
      <div className="bg-gray-800 p-6 rounded-lg shadow-md">
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            <Loader size={24} className="animate-spin" />Cargando asignaciones...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignments.map(assign => (
              <div key={assign.idNutritionalPlan_horse} className="bg-gray-700 p-4 rounded-md shadow-lg flex flex-col justify-between">
                {editingId === assign.idNutritionalPlan_horse ? (
                  <>
                    <input
                      type="date"
                      defaultValue={assign.assignmentDate?.slice(0,10)}
                      onChange={e => setNewAssignment({ ...newAssignment, assignmentDate: e.target.value })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="number"
                      defaultValue={assign.fk_idNutritionalPlan}
                      onChange={e => setNewAssignment({ ...newAssignment, fk_idNutritionalPlan: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="number"
                      defaultValue={assign.fk_idHorse}
                      onChange={e => setNewAssignment({ ...newAssignment, fk_idHorse: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => updateAssignment(assign.idNutritionalPlan_horse!, {
                          assignmentDate: newAssignment.assignmentDate || assign.assignmentDate,
                          fk_idNutritionalPlan: newAssignment.fk_idNutritionalPlan || assign.fk_idNutritionalPlan,
                          fk_idHorse: newAssignment.fk_idHorse || assign.fk_idHorse,
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
                    <h3 className="text-lg font-semibold">Plan #{assign.fk_idNutritionalPlan} - Caballo #{assign.fk_idHorse}</h3>
                    <p>Fecha de asignación: {assign.assignmentDate?.slice(0,10)}</p>
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => { setEditingId(assign.idNutritionalPlan_horse!); setNewAssignment(assign); }}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white p-2 rounded-md flex items-center gap-1"
                      >
                        <Edit size={16} /> Editar
                      </button>
                      <button
                        onClick={() => deleteAssignment(assign.idNutritionalPlan_horse!)}
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

export default NutritionalPlanHorsesManagement;