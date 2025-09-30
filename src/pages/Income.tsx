import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Save, Trash2, Loader, X } from 'lucide-react';

const API_URL = 'https://backend-country-nnxe.onrender.com/income/';

interface Income {
  idIncome?: number;
  date: string; // "YYYY-MM-DD"
  description: string;
  amountBsCaptureType: number;
  period: string; // "YYYY-MM-DD"
  created_at?: string;
}

const IncomeManagement = () => {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [newIncome, setNewIncome] = useState<Income>({
    date: '',
    description: '',
    amountBsCaptureType: 0,
    period: '',
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchIncomes = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al obtener ingresos');
      const data = await res.json();
      setIncomes(data);
    } catch {
      toast.error('No se pudieron cargar los ingresos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomes();
  }, []);

  const createIncome = async () => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIncome),
      });
      if (!res.ok) throw new Error('Error al crear ingreso');
      toast.success('Ingreso creado!');
      setNewIncome({
        date: '',
        description: '',
        amountBsCaptureType: 0,
        period: '',
      });
      fetchIncomes();
    } catch {
      toast.error('No se pudo crear el ingreso.');
    }
  };

  const updateIncome = async (id: number, updatedIncome: Income) => {
    try {
      const res = await fetch(`${API_URL}${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedIncome),
      });
      if (!res.ok) throw new Error('Error al actualizar ingreso');
      toast.success('Ingreso actualizado!');
      setEditingId(null);
      fetchIncomes();
    } catch {
      toast.error('No se pudo actualizar el ingreso.');
    }
  };

  const deleteIncome = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar ingreso');
      toast.success('Ingreso eliminado!');
      fetchIncomes();
    } catch {
      toast.error('No se pudo eliminar el ingreso.');
    }
  };

  return (
    <div className="p-6 bg-slate-950 min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-6 text-center text-teal-400">Gestión de Ingresos</h1>
      <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4 text-teal-400">Agregar Nuevo Ingreso</h2>
        <div className="flex gap-4 flex-wrap">
          <div>
            <label htmlFor="date" className="block mb-1">Fecha</label>
          <input
            type="date"
            name="date"
            placeholder="Fecha"
            value={newIncome.date}
            onChange={e => setNewIncome({ ...newIncome, date: e.target.value })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          </div>
          <div>
            <label htmlFor="description" className="block mb-1">Descripción</label>
          <input
            type="text"
            name="description"
            placeholder="Descripción"
            value={newIncome.description}
            onChange={e => setNewIncome({ ...newIncome, description: e.target.value })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          </div>
          <div>
            <label htmlFor="amountBsCaptureType" className="block mb-1">Monto</label>
          <input
            type="number"
            name="amountBsCaptureType"
            placeholder="Monto"
            value={newIncome.amountBsCaptureType}
            onChange={e => setNewIncome({ ...newIncome, amountBsCaptureType: Number(e.target.value) })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          </div>
          <div>
            <label htmlFor="period" className="block mb-1">Periodo</label>
          <input
            type="date"
            name="period"
            placeholder="Periodo"
            value={newIncome.period}
            onChange={e => setNewIncome({ ...newIncome, period: e.target.value })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          </div>
          <button onClick={createIncome} className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-md font-semibold flex items-center gap-2">
            <Plus size={20} /> Agregar
          </button>
        </div>
      </div>
      <div className="bg-gray-800 p-6 rounded-lg shadow-md">
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            <Loader size={24} className="animate-spin" />Cargando ingresos...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {incomes.map(income => (
              <div key={income.idIncome} className="bg-gray-700 p-4 rounded-md shadow-lg flex flex-col justify-between">
                {editingId === income.idIncome ? (
                  <>
                  <div>
                    <label htmlFor="date" className="block mb-1">Fecha</label>
                    <input
                      type="date"
                      defaultValue={income.date?.slice(0, 10)}
                      onChange={e => setNewIncome({ ...newIncome, date: e.target.value })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    </div>
                    <div>
                      <label htmlFor="description" className="block mb-1">Descripción</label>
                    <input
                      type="text"
                      defaultValue={income.description}
                      onChange={e => setNewIncome({ ...newIncome, description: e.target.value })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    </div>
                    <div>
                      <label htmlFor="amountBsCaptureType" className="block mb-1">Monto</label>
                    <input
                      type="number"
                      defaultValue={income.amountBsCaptureType}
                      onChange={e => setNewIncome({ ...newIncome, amountBsCaptureType: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    </div>
                    <div>
                      <label htmlFor="period" className="block mb-1">Periodo</label>
                    <input
                      type="date"
                      defaultValue={income.period?.slice(0, 10)}
                      onChange={e => setNewIncome({ ...newIncome, period: e.target.value })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => updateIncome(income.idIncome!, {
                          date: newIncome.date || income.date,
                          description: newIncome.description || income.description,
                          amountBsCaptureType: newIncome.amountBsCaptureType || income.amountBsCaptureType,
                          period: newIncome.period || income.period
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
                    <h3 className="text-lg font-semibold">Descripción: {income.description}</h3>
                    <p>Fecha: {income.date?.slice(0, 10)}</p>
                    <p>Monto: {income.amountBsCaptureType}</p>
                    <p>Periodo: {income.period?.slice(0, 10)}</p>
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => { setEditingId(income.idIncome!); setNewIncome(income); }}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white p-2 rounded-md flex items-center gap-1"
                      >
                        <Edit size={16} /> Editar
                      </button>
                      <button
                        onClick={() => deleteIncome(income.idIncome!)}
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

export default IncomeManagement;