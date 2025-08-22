import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Save, Trash2, Loader, X } from 'lucide-react';

const API_URL = 'https://backend-country-nnxe.onrender.com/nutritional-plan-details/';

interface NutritionalPlanDetail {
  idDetail?: number;
  amount: number;
  frequency: string;
  schedule: string; // ISO datetime
  fk_idFood: number;
  fk_idNutritionalPlan?: number;
}

const NutritionalPlanDetailsManagement = () => {
  const [details, setDetails] = useState<NutritionalPlanDetail[]>([]);
  const [newDetail, setNewDetail] = useState<NutritionalPlanDetail>({
    amount: 0,
    frequency: '',
    schedule: '',
    fk_idFood: 1,
    fk_idNutritionalPlan: undefined,
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al obtener detalles');
      const data = await res.json();
      setDetails(data);
    } catch {
      toast.error('No se pudo cargar detalles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, []);

  const createDetail = async () => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDetail),
      });
      if (!res.ok) throw new Error('Error al crear detalle');
      toast.success('Detalle creado!');
      setNewDetail({
        amount: 0,
        frequency: '',
        schedule: '',
        fk_idFood: 1,
        fk_idNutritionalPlan: undefined,
      });
      fetchDetails();
    } catch {
      toast.error('No se pudo crear detalle.');
    }
  };

  const updateDetail = async (id: number, updatedDetail: NutritionalPlanDetail) => {
    try {
      const res = await fetch(`${API_URL}${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedDetail),
      });
      if (!res.ok) throw new Error('Error al actualizar detalle');
      toast.success('Detalle actualizado!');
      setEditingId(null);
      fetchDetails();
    } catch {
      toast.error('No se pudo actualizar detalle.');
    }
  };

  const deleteDetail = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar detalle');
      toast.success('Detalle eliminado!');
      fetchDetails();
    } catch {
      toast.error('No se pudo eliminar detalle.');
    }
  };

  return (
    <div className="container mx-auto p-4 text-white">
      <h1 className="text-3xl font-bold mb-6 text-center">Gestión de Detalles del Plan Nutricional</h1>
      <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Agregar Nuevo Detalle</h2>
        <div className="flex gap-4 flex-wrap">
          <input
            type="number"
            name="amount"
            placeholder="Cantidad"
            value={newDetail.amount}
            onChange={e => setNewDetail({ ...newDetail, amount: Number(e.target.value) })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          <input
            type="text"
            name="frequency"
            placeholder="Frecuencia"
            value={newDetail.frequency}
            onChange={e => setNewDetail({ ...newDetail, frequency: e.target.value })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          <input
            type="datetime-local"
            name="schedule"
            placeholder="Horario"
            value={newDetail.schedule}
            onChange={e => setNewDetail({ ...newDetail, schedule: e.target.value })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          <input
            type="number"
            name="fk_idFood"
            placeholder="ID Comida"
            value={newDetail.fk_idFood}
            onChange={e => setNewDetail({ ...newDetail, fk_idFood: Number(e.target.value) })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          <input
            type="number"
            name="fk_idNutritionalPlan"
            placeholder="ID Plan Nutricional"
            value={newDetail.fk_idNutritionalPlan || ''}
            onChange={e => setNewDetail({ ...newDetail, fk_idNutritionalPlan: Number(e.target.value) || undefined })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          <button onClick={createDetail} className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-md font-semibold flex items-center gap-2">
            <Plus size={20} /> Agregar
          </button>
        </div>
      </div>
      <div className="bg-gray-800 p-6 rounded-lg shadow-md">
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            <Loader size={24} className="animate-spin" />Cargando detalles...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {details.map(detail => (
              <div key={detail.idDetail} className="bg-gray-700 p-4 rounded-md shadow-lg flex flex-col justify-between">
                {editingId === detail.idDetail ? (
                  <>
                    <input
                      type="number"
                      defaultValue={detail.amount}
                      onChange={e => setNewDetail({ ...newDetail, amount: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="text"
                      defaultValue={detail.frequency}
                      onChange={e => setNewDetail({ ...newDetail, frequency: e.target.value })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="datetime-local"
                      defaultValue={detail.schedule?.slice(0,16)}
                      onChange={e => setNewDetail({ ...newDetail, schedule: e.target.value })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="number"
                      defaultValue={detail.fk_idFood}
                      onChange={e => setNewDetail({ ...newDetail, fk_idFood: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="number"
                      defaultValue={detail.fk_idNutritionalPlan || ''}
                      onChange={e => setNewDetail({ ...newDetail, fk_idNutritionalPlan: Number(e.target.value) || undefined })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => updateDetail(detail.idDetail!, {
                          amount: newDetail.amount || detail.amount,
                          frequency: newDetail.frequency || detail.frequency,
                          schedule: newDetail.schedule || detail.schedule,
                          fk_idFood: newDetail.fk_idFood || detail.fk_idFood,
                          fk_idNutritionalPlan: newDetail.fk_idNutritionalPlan || detail.fk_idNutritionalPlan,
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
                    <h3 className="text-lg font-semibold">Comida #{detail.fk_idFood} - Plan #{detail.fk_idNutritionalPlan}</h3>
                    <p>Cantidad: {detail.amount}</p>
                    <p>Frecuencia: {detail.frequency}</p>
                    <p>Horario: {detail.schedule?.replace('T',' ').slice(0,16)}</p>
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => { setEditingId(detail.idDetail!); setNewDetail(detail); }}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white p-2 rounded-md flex items-center gap-1"
                      >
                        <Edit size={16} /> Editar
                      </button>
                      <button
                        onClick={() => deleteDetail(detail.idDetail!)}
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

export default NutritionalPlanDetailsManagement;