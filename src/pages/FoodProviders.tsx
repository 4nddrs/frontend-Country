import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Save, Trash2, Loader, X } from 'lucide-react';

const API_URL = 'https://backend-country-nnxe.onrender.com/food-providers/';

interface FoodProvider {
  idFoodProvider?: number;
  supplierName: string;
  cellphoneNumber: number;
  generalDescription?: string;
}

const FoodProvidersManagement = () => {
  const [providers, setProviders] = useState<FoodProvider[]>([]);
  const [newProvider, setNewProvider] = useState<FoodProvider>({ supplierName: '', cellphoneNumber: 0, generalDescription: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al obtener proveedores');
      const data = await res.json();
      setProviders(data);
    } catch {
      toast.error('No se pudo cargar proveedores.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProviders(); }, []);

  const createProvider = async () => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProvider),
      });
      if (!res.ok) throw new Error('Error al crear proveedor');
      toast.success('Proveedor creado!');
      setNewProvider({ supplierName: '', cellphoneNumber: 0, generalDescription: '' });
      fetchProviders();
    } catch {
      toast.error('No se pudo crear proveedor.');
    }
  };

  const updateProvider = async (id: number, updatedProvider: FoodProvider) => {
    try {
      const res = await fetch(`${API_URL}${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProvider),
      });
      if (!res.ok) throw new Error('Error al actualizar proveedor');
      toast.success('Proveedor actualizado!');
      setEditingId(null);
      fetchProviders();
    } catch {
      toast.error('No se pudo actualizar proveedor.');
    }
  };

  const deleteProvider = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar proveedor');
      toast.success('Proveedor eliminado!');
      fetchProviders();
    } catch {
      toast.error('No se pudo eliminar proveedor.');
    }
  };

return (
  <div className="bg-slate-900 p-6 rounded-lg shadow-xl mb-8 border border-slate-700">
    <h1 className="text-3xl font-bold mb-6 text-center text-teal-400">
      Gestión de Proveedores de Alimento
    </h1>
    <div className="bg-slate-800 p-6 rounded-lg shadow-xl mb-8 border border-slate-700">
      <h2 className="text-xl font-semibold mb-4 text-teal-400">Agregar Nuevo Proveedor</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block mb-1 text-sm font-medium">Nombre del proveedor</label>
          <input
            type="text"
            name="supplierName"
            placeholder="Ej: Distribuidora La Paz"
            value={newProvider.supplierName}
            onChange={e => setNewProvider({ ...newProvider, supplierName: e.target.value })}
            className="w-full p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">Número de celular</label>
          <input
            type="number"
            name="cellphoneNumber"
            placeholder="Ej: 76543210"
            value={newProvider.cellphoneNumber}
            onChange={e => setNewProvider({ ...newProvider, cellphoneNumber: Number(e.target.value) })}
            className="w-full p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">Descripción general</label>
          <input
            type="text"
            name="generalDescription"
            placeholder="Ej: Proveedor de carnes y embutidos"
            value={newProvider.generalDescription}
            onChange={e => setNewProvider({ ...newProvider, generalDescription: e.target.value })}
            className="w-full p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
        </div>
      </div>
      <button
        onClick={createProvider}
        className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-semibold flex items-center gap-2"
      >
        <Plus size={20} /> Agregar
      </button>
    </div>
    <div className="bg-slate-800 p-6 rounded-lg shadow-xl mb-8 border border-slate-700">
      {loading ? (
        <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
          <Loader size={24} className="animate-spin" /> Cargando proveedores...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.map(provider => (
            <div
              key={provider.idFoodProvider}
              className="bg-gray-700 p-4 rounded-md shadow-lg flex flex-col justify-between"
            >
              {editingId === provider.idFoodProvider ? (
                <>
                  <div>
                    <label className="block mb-1 text-sm font-medium">Nombre del proveedor</label>
                    <input
                      type="text"
                      defaultValue={provider.supplierName}
                      onChange={e => setNewProvider({ ...newProvider, supplierName: e.target.value })}
                      className="w-full p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium">Número de celular</label>
                    <input
                      type="number"
                      defaultValue={provider.cellphoneNumber}
                      onChange={e => setNewProvider({ ...newProvider, cellphoneNumber: Number(e.target.value) })}
                      className="w-full p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium">Descripción general</label>
                    <input
                      type="text"
                      defaultValue={provider.generalDescription}
                      onChange={e => setNewProvider({ ...newProvider, generalDescription: e.target.value })}
                      className="w-full p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                  </div>
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={() =>
                        updateProvider(provider.idFoodProvider!, {
                          supplierName: newProvider.supplierName || provider.supplierName,
                          cellphoneNumber: newProvider.cellphoneNumber || provider.cellphoneNumber,
                          generalDescription: newProvider.generalDescription || provider.generalDescription,
                        })
                      }
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
                  <h3 className="text-lg font-semibold">{provider.supplierName}</h3>
                  <p>Celular: {provider.cellphoneNumber}</p>
                  <p>{provider.generalDescription}</p>
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={() => {
                        setEditingId(provider.idFoodProvider!);
                        setNewProvider(provider);
                      }}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white p-2 rounded-md flex items-center gap-1"
                    >
                      <Edit size={16} /> Editar
                    </button>
                    <button
                      onClick={() => deleteProvider(provider.idFoodProvider!)}
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

export default FoodProvidersManagement;