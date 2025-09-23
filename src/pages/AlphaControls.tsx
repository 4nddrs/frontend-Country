import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Save, Trash2, Loader, X } from 'lucide-react';

const API_URL = 'https://backend-country-nnxe.onrender.com/alpha_controls/';

interface AlphaControl {
  idAlphaControl?: number;
  date: string; // ISO date: "YYYY-MM-DD"
  alphaIncome: number;
  unitPrice: number;
  totalPurchasePrice: number;
  outcome: number;
  balance: number;
  salePrice: number;
  income: number;
  closingAmount: string;
  fk_idFoodProvider: number;
  created_at?: string;
}

const AlphaControlsManagement = () => {
  const [controls, setControls] = useState<AlphaControl[]>([]);
  const [newControl, setNewControl] = useState<AlphaControl>({
    date: '',
    alphaIncome: 0,
    unitPrice: 0,
    totalPurchasePrice: 0,
    outcome: 0,
    balance: 0,
    salePrice: 0,
    income: 0,
    closingAmount: '',
    fk_idFoodProvider: 1,
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);


  const [foodProviders, setFoodProviders] = useState<any[]>([]);
  const fetchFoodProviders = async () => {
    try {
      const res = await fetch("https://backend-country-nnxe.onrender.com/food-providers/");
      if (!res.ok) throw new Error("Error al obtener proveedores");
      const data = await res.json();
      setFoodProviders(data);
    } catch {
      toast.error("No se pudieron cargar proveedores");
    }
  };

  const fetchControls = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al obtener controles');
      const data = await res.json();
      setControls(data);
    } catch {
      toast.error('No se pudo cargar controles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchControls();
    fetchFoodProviders();
  }, []);

  const createControl = async () => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newControl),
      });
      if (!res.ok) throw new Error('Error al crear control');
      toast.success('Control creado!');
      setNewControl({
        date: '',
        alphaIncome: 0,
        unitPrice: 0,
        totalPurchasePrice: 0,
        outcome: 0,
        balance: 0,
        salePrice: 0,
        income: 0,
        closingAmount: '',
        fk_idFoodProvider: 1,
      });
      fetchControls();
    } catch {
      toast.error('No se pudo crear control.');
    }
  };

  const updateControl = async (id: number, updatedControl: AlphaControl) => {
    try {
      const res = await fetch(`${API_URL}${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedControl),
      });
      if (!res.ok) throw new Error('Error al actualizar control');
      toast.success('Control actualizado!');
      setEditingId(null);
      fetchControls();
    } catch {
      toast.error('No se pudo actualizar control.');
    }
  };

  const deleteControl = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar control');
      toast.success('Control eliminado!');
      fetchControls();
    } catch {
      toast.error('No se pudo eliminar control.');
    }
  };

  return (
    <div className="container mx-auto p-4 text-white">
      <h1 className="text-3xl font-bold mb-6 text-center">Gestión de Control de Alfalfa</h1>
    <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-8">
  <h2 className="text-xl font-semibold mb-4">Agregar Nuevo Control</h2>
  <div className="flex gap-4 flex-wrap">

    <div className="flex-1">
      <label className="text-sm mb-1 block">Fecha del control</label>
      <input
        type="date"
        name="date"
        value={newControl.date}
        onChange={e => setNewControl({ ...newControl, date: e.target.value })}
        className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
      />
    </div>

    <div className="flex-1">
      <label className="text-sm mb-1 block">Ingreso alfalfa (kg)</label>
      <input
        type="number"
        name="alphaIncome"
        value={newControl.alphaIncome}
        onChange={e => setNewControl({ ...newControl, alphaIncome: Number(e.target.value) })}
        className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
      />
    </div>

    <div className="flex-1">
      <label className="text-sm mb-1 block">Precio unitario (Bs.)</label>
      <input
        type="number"
        name="unitPrice"
        value={newControl.unitPrice}
        onChange={e => setNewControl({ ...newControl, unitPrice: Number(e.target.value) })}
        className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
      />
    </div>

    <div className="flex-1">
      <label className="text-sm mb-1 block">Precio total de compra (Bs.)</label>
      <input
        type="number"
        name="totalPurchasePrice"
        value={newControl.totalPurchasePrice}
        onChange={e => setNewControl({ ...newControl, totalPurchasePrice: Number(e.target.value) })}
        className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
      />
    </div>

    <div className="flex-1">
      <label className="text-sm mb-1 block">Salida de alfalfa (kg)</label>
      <input
        type="number"
        name="outcome"
        value={newControl.outcome}
        onChange={e => setNewControl({ ...newControl, outcome: Number(e.target.value) })}
        className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
      />
    </div>

    <div className="flex-1">
      <label className="text-sm mb-1 block">Balance (kg)</label>
      <input
        type="number"
        name="balance"
        value={newControl.balance}
        onChange={e => setNewControl({ ...newControl, balance: Number(e.target.value) })}
        className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
      />
    </div>

    <div className="flex-1">
      <label className="text-sm mb-1 block">Precio de venta (Bs.)</label>
      <input
        type="number"
        name="salePrice"
        value={newControl.salePrice}
        onChange={e => setNewControl({ ...newControl, salePrice: Number(e.target.value) })}
        className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
      />
    </div>

    <div className="flex-1">
      <label className="text-sm mb-1 block">Ingreso (Bs.)</label>
      <input
        type="number"
        name="income"
        value={newControl.income}
        onChange={e => setNewControl({ ...newControl, income: Number(e.target.value) })}
        className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
      />
    </div>

    <div className="flex-1">
      <label className="text-sm mb-1 block">Monto de cierre</label>
      <input
        type="text"
        name="closingAmount"
        value={newControl.closingAmount}
        onChange={e => setNewControl({ ...newControl, closingAmount: e.target.value })}
        className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
      />
    </div>

    <div className="flex-1">
      <label className="text-sm mb-1 block">Proveedor de alfalfa</label>
      <select
        name="fk_idFoodProvider"
        value={newControl.fk_idFoodProvider}
        onChange={e => setNewControl({ ...newControl, fk_idFoodProvider: Number(e.target.value) })}
        className="flex-1 p-2 rounded-md bg-gray-700 text-white"
      >
        <option value="">-- Selecciona proveedor --</option>
        {foodProviders.map(p => (
          <option key={p.idFoodProvider} value={p.idFoodProvider}>{p.supplierName}</option>
        ))}
      </select>
    </div>

    <button
      onClick={createControl}
      className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-md font-semibold flex items-center gap-2"
    >
      <Plus size={20} /> Agregar
    </button>
  </div>
</div>

      <div className="bg-gray-800 p-6 rounded-lg shadow-md">
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            <Loader size={24} className="animate-spin" />Cargando controles...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {controls.map(control => (
              <div key={control.idAlphaControl} className="bg-gray-700 p-4 rounded-md shadow-lg flex flex-col justify-between">
                {editingId === control.idAlphaControl ? (
                  <>
                    <input
                      type="date"
                      defaultValue={control.date?.slice(0,10)}
                      onChange={e => setNewControl({ ...newControl, date: e.target.value })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="number"
                      defaultValue={control.alphaIncome}
                      onChange={e => setNewControl({ ...newControl, alphaIncome: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="number"
                      defaultValue={control.unitPrice}
                      onChange={e => setNewControl({ ...newControl, unitPrice: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="number"
                      defaultValue={control.totalPurchasePrice}
                      onChange={e => setNewControl({ ...newControl, totalPurchasePrice: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="number"
                      defaultValue={control.outcome}
                      onChange={e => setNewControl({ ...newControl, outcome: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="number"
                      defaultValue={control.balance}
                      onChange={e => setNewControl({ ...newControl, balance: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="number"
                      defaultValue={control.salePrice}
                      onChange={e => setNewControl({ ...newControl, salePrice: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="number"
                      defaultValue={control.income}
                      onChange={e => setNewControl({ ...newControl, income: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="text"
                      defaultValue={control.closingAmount}
                      onChange={e => setNewControl({ ...newControl, closingAmount: e.target.value })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <select
                      value={newControl.fk_idFoodProvider}
                      onChange={e => setNewControl({ ...newControl, fk_idFoodProvider: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    >
                      {foodProviders.map(p => (<option key={p.idFoodProvider} value={p.idFoodProvider}>{p.supplierName}</option>))}
                    </select>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => updateControl(control.idAlphaControl!, {
                          date: newControl.date || control.date,
                          alphaIncome: newControl.alphaIncome || control.alphaIncome,
                          unitPrice: newControl.unitPrice || control.unitPrice,
                          totalPurchasePrice: newControl.totalPurchasePrice || control.totalPurchasePrice,
                          outcome: newControl.outcome || control.outcome,
                          balance: newControl.balance || control.balance,
                          salePrice: newControl.salePrice || control.salePrice,
                          income: newControl.income || control.income,
                          closingAmount: newControl.closingAmount || control.closingAmount,
                          fk_idFoodProvider: newControl.fk_idFoodProvider || control.fk_idFoodProvider
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
                    <h3 className="text-lg font-semibold">Fecha: {control.date?.slice(0, 10)}</h3>
                    <p>Ingreso alfalfa: {control.alphaIncome}</p>
                    <p>Precio unitario: {control.unitPrice}</p>
                    <p>Precio total compra: {control.totalPurchasePrice}</p>
                    <p>Salida: {control.outcome}</p>
                    <p>Balance: {control.balance}</p>
                    <p>Precio venta: {control.salePrice}</p>
                    <p>Ingreso: {control.income}</p>
                    <p>Monto cierre: {control.closingAmount}</p>
                    <p>Proveedor: {foodProviders.find(p => p.idFoodProvider === control.fk_idFoodProvider)?.supplierName || control.fk_idFoodProvider}</p>
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => { setEditingId(control.idAlphaControl!); setNewControl(control); }}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white p-2 rounded-md flex items-center gap-1"
                      >
                        <Edit size={16} /> Editar
                      </button>
                      <button
                        onClick={() => deleteControl(control.idAlphaControl!)}
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

export default AlphaControlsManagement;