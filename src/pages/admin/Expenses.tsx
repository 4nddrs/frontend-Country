import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Save, Trash2, Loader, X } from 'lucide-react';

const API_URL = 'https://backend-country-nnxe.onrender.com/expenses/';

interface Expense {
  idExpenses?: number;
  date: string; // "YYYY-MM-DD"
  description: string;
  AmountBsCaptureType: number;
  period: string; // "YYYY-MM-DD"
  created_at?: string;
}

const ExpensesManagement = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [newExpense, setNewExpense] = useState<Expense>({
    date: '',
    description: '',
    AmountBsCaptureType: 0,
    period: '',
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al obtener gastos');
      const data = await res.json();
      setExpenses(data);
    } catch {
      toast.error('No se pudieron cargar los gastos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const createExpense = async () => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExpense),
      });
      if (!res.ok) throw new Error('Error al crear gasto');
      toast.success('Gasto creado!');
      setNewExpense({
        date: '',
        description: '',
        AmountBsCaptureType: 0,
        period: '',
      });
      fetchExpenses();
    } catch {
      toast.error('No se pudo crear el gasto.');
    }
  };

  const updateExpense = async (id: number, updatedExpense: Expense) => {
    try {
      const res = await fetch(`${API_URL}${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedExpense),
      });
      if (!res.ok) throw new Error('Error al actualizar gasto');
      toast.success('Gasto actualizado!');
      setEditingId(null);
      fetchExpenses();
    } catch {
      toast.error('No se pudo actualizar el gasto.');
    }
  };

  const deleteExpense = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar gasto');
      toast.success('Gasto eliminado!');
      fetchExpenses();
    } catch {
      toast.error('No se pudo eliminar el gasto.');
    }
  };

  return (
    <div className="bg-slate-900 p-6 rounded-lg shadow-xl mb-8 border border-slate-700">
      <h1 className="text-3xl font-bold mb-6 text-center text-teal-400">Gestión de Gastos</h1>
      <div className="bg-slate-800 p-6 rounded-lg shadow-xl mb-8 border border-slate-700">
        <h2 className="text-xl font-semibold mb-4 text-teal-400">Agregar Nuevo Gasto</h2>
        <div className="flex gap-4 flex-wrap">
          <div>
            <label htmlFor="date" className="block mb-1">Fecha</label>
            <input
              type="date"
              name="date"
              placeholder="Fecha"
              value={newExpense.date}
              onChange={e => setNewExpense({ ...newExpense, date: e.target.value })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          </div>
          <div>
            <label htmlFor="description" className="block mb-1">Descripción</label>
            <input
              type="text"
              name="description"
              placeholder="Descripción"
              value={newExpense.description}
            onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          </div>
          <div>
            <label htmlFor="AmountBsCaptureType" className="block mb-1">Monto</label>
            <input
              type="number"
              name="AmountBsCaptureType"
              placeholder="Monto"
              value={newExpense.AmountBsCaptureType}
            onChange={e => setNewExpense({ ...newExpense, AmountBsCaptureType: Number(e.target.value) })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          </div>
          <div>
            <label htmlFor="period" className="block mb-1">Periodo</label>
          <input
            type="date"
            name="period"
            placeholder="Periodo"
            value={newExpense.period}
            onChange={e => setNewExpense({ ...newExpense, period: e.target.value })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          </div>
          <button onClick={createExpense} className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-md font-semibold flex items-center gap-2">
            <Plus size={20} /> Agregar
          </button>
          </div>
      </div>
      <div className="bg-slate-800 p-6 rounded-lg shadow-xl mb-8 border border-slate-700">
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            <Loader size={24} className="animate-spin" />Cargando gastos...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {expenses.map(expense => (
              <div key={expense.idExpenses} className="bg-gray-700 p-4 rounded-md shadow-lg flex flex-col justify-between">
                {editingId === expense.idExpenses ? (
                  <>
                  <div>
                    <label htmlFor="date" className="block mb-1">Fecha</label>
                    <input
                      type="date"
                      defaultValue={expense.date?.slice(0, 10)}
                      onChange={e => setNewExpense({ ...newExpense, date: e.target.value })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                  </div>
                  <div>
                    <label htmlFor="description" className="block mb-1">Descripción</label>
                    <input
                      type="text"
                      defaultValue={expense.description}
                      onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                  </div>
                  <div>
                    <label htmlFor="AmountBsCaptureType" className="block mb-1">Monto</label>
                    <input
                      type="number"
                      defaultValue={expense.AmountBsCaptureType}
                      onChange={e => setNewExpense({ ...newExpense, AmountBsCaptureType: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                  </div>
                  <div>
                    <label htmlFor="period" className="block mb-1">Periodo</label>
                    <input
                      type="date"
                      defaultValue={expense.period?.slice(0, 10)}
                      onChange={e => setNewExpense({ ...newExpense, period: e.target.value })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                  </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => updateExpense(expense.idExpenses!, {
                          date: newExpense.date || expense.date,
                          description: newExpense.description || expense.description,
                          AmountBsCaptureType: newExpense.AmountBsCaptureType || expense.AmountBsCaptureType,
                          period: newExpense.period || expense.period
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
                    <h3 className="text-lg font-semibold">Descripción: {expense.description}</h3>
                    <p>Fecha: {expense.date?.slice(0, 10)}</p>
                    <p>Monto: {expense.AmountBsCaptureType}</p>
                    <p>Periodo: {expense.period?.slice(0, 10)}</p>
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => { setEditingId(expense.idExpenses!); setNewExpense(expense); }}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white p-2 rounded-md flex items-center gap-1"
                      >
                        <Edit size={16} /> Editar
                      </button>
                      <button
                        onClick={() => deleteExpense(expense.idExpenses!)}
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

export default ExpensesManagement;