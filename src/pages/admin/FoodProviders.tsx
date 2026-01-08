import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Save, Trash2, Loader, X } from 'lucide-react';
import { confirmDialog } from '../../utils/confirmDialog';

const API_URL = 'http://localhost:8000/food-providers/';

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
    const confirmed = await confirmDialog({
      title: '¿Eliminar proveedor?',
      description: 'Esta acción eliminará el proveedor de alimentos permanentemente.',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
    });
    if (!confirmed) return;
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
  <div  className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
    <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">Gestión de Proveedores de Alimento</h1>
    <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.5)] text-[#F8F4E3]">
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
    <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.5)] text-[#F8F4E3]">
      {loading ? (
        <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
          <Loader size={24} className="animate-spin" /> Cargando proveedores...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.map(provider => (
              <div
                key={provider.idFoodProvider}
                className="rounded-2xl border border-slate-800/60 bg-gradient-to-br from-amber-500/10 via-slate-900/60 to-slate-900/90 shadow-lg shadow-black/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-amber-500/20"
              >
                {editingId === provider.idFoodProvider ? (
                  <div className="p-6">
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
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col items-center gap-2 py-5">
                      <span className="h-4 w-4 rounded-full bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.6)]" />
                      <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
                        Proveedor
                      </span>
                    </div>

                    <div className="px-6 pb-6 space-y-4 text-sm text-slate-200">
                      <div className="text-center space-y-1">
                        <h3 className="text-lg font-semibold text-amber-300">{provider.supplierName}</h3>
                        <p className="text-slate-400">
                          Celular: <span className="font-medium text-slate-200">{provider.cellphoneNumber}</span>
                        </p>
                        {provider.generalDescription && (
                          <p className="text-xs text-slate-300 mt-2">
                            {provider.generalDescription}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-center gap-6 border-t border-slate-800 pt-6 pb-2">
                        <button
                          onClick={() => {
                            setEditingId(provider.idFoodProvider!);
                            setNewProvider(provider);
                          }}
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
                          onClick={() => deleteProvider(provider.idFoodProvider!)}
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FoodProvidersManagement;