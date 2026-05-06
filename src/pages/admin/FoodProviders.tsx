import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import { Edit, Trash2, Loader } from 'lucide-react';
import { confirmDialog } from '../../utils/confirmDialog';
import { AddButton, AdminSection, SaveButton, CancelButton } from '../../components/ui/admin-buttons';
import { isNonEmptyString, isNumeric } from '../../utils/validation';

const API_URL = 'https://api.countryclub.doc-ia.cloud/food-providers/';

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
  const [editingData, setEditingData] = useState<FoodProvider | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const isEditModalOpen = editingId !== null && editingData !== null;

  useEffect(() => {
    if (!isEditModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') handleCancelEdit(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isEditModalOpen]);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al obtener proveedores');
      const data = await res.json();
      const list: FoodProvider[] = Array.isArray(data) ? data : [];
      list.sort((a, b) => (b.idFoodProvider ?? 0) - (a.idFoodProvider ?? 0));
      setProviders(list);
    } catch {
      toast.error('No se pudo cargar proveedores.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProviders(); }, []);

  const createProvider = async () => {
    if (!isNonEmptyString(newProvider.supplierName, 150)) {
      toast.error('El nombre del proveedor es obligatorio');
      return;
    }
    if (newProvider.cellphoneNumber && !isNumeric(String(newProvider.cellphoneNumber))) {
      toast.error('Número de celular inválido.');
      return;
    }
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

  const updateProvider = async (id: number) => {
    if (!editingData) return;
    if (!isNonEmptyString(editingData.supplierName, 150)) {
      toast.error('El nombre del proveedor es obligatorio');
      return;
    }
    if (editingData.cellphoneNumber && !isNumeric(String(editingData.cellphoneNumber))) {
      toast.error('Número de celular inválido.');
      return;
    }
    try {
      const res = await fetch(`${API_URL}${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingData),
      });
      if (!res.ok) throw new Error('Error al actualizar proveedor');
      toast.success('Proveedor actualizado!');
      setEditingId(null);
      setEditingData(null);
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

  const handleEditClick = (provider: FoodProvider) => {
    setEditingId(provider.idFoodProvider!);
    setEditingData({ ...provider });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingData(null);
  };

  return (
    <div className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
      <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">Gestión de Proveedores de Alimento</h1>
      <AdminSection>
        <h2 className="text-xl font-semibold mb-4 text-[#bdab62]">Agregar Nuevo Proveedor</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block mb-1 text-sm font-medium">Nombre del proveedor</label>
            <input
              type="text"
              name="supplierName"
              placeholder="Ej: Distribuidora La Paz"
              value={newProvider.supplierName}
              onChange={e => setNewProvider({ ...newProvider, supplierName: e.target.value })}
              maxLength={150}
              className="w-full"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Número de celular</label>
            <input
              type="number"
              name="cellphoneNumber"
              placeholder="Ej: 76543210"
              value={newProvider.cellphoneNumber === 0 ? '' : newProvider.cellphoneNumber}
              onChange={e => setNewProvider({ ...newProvider, cellphoneNumber: Number(e.target.value) })}
              className="w-full"
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
              maxLength={300}
              className="w-full"
            />
          </div>
        </div>
        <div className="flex justify-end mt-7">
          <AddButton onClick={createProvider} className="px-16 justify-center" />
        </div>
      </AdminSection>
      <AdminSection>
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
                      onClick={() => handleEditClick(provider)}
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
              </div>
            ))}
          </div>
        )}

        {editingId !== null && editingData && createPortal(
          <div
            className="fixed inset-0 lg:left-80 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={handleCancelEdit}
          >
            <div
              className="w-full max-w-2xl max-h-[95vh] overflow-y-auto rounded-2xl border border-[#167C79]/60 bg-[#0f172a] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.6)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-[#F8F4E3]">Editar Proveedor</h3>
                  <p className="text-sm text-slate-400">Actualiza los datos.</p>
                </div>
                <button onClick={handleCancelEdit} className="rounded-lg border border-slate-500 px-3 py-1.5 text-slate-300 hover:bg-slate-800">
                  Cerrar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium">Nombre del proveedor</label>
                  <input
                    type="text"
                    value={editingData.supplierName}
                    onChange={e => setEditingData({ ...editingData, supplierName: e.target.value })}
                    maxLength={150}
                    className="w-full p-2 rounded-md bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Número de celular</label>
                  <input
                    type="number"
                    value={editingData.cellphoneNumber}
                    onChange={e => setEditingData({ ...editingData, cellphoneNumber: Number(e.target.value) })}
                    className="w-full p-2 rounded-md bg-gray-700"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block mb-1 text-sm font-medium">Descripción general</label>
                  <input
                    type="text"
                    value={editingData.generalDescription || ''}
                    onChange={e => setEditingData({ ...editingData, generalDescription: e.target.value })}
                    maxLength={300}
                    className="w-full p-2 rounded-md bg-gray-700"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-700 pt-4">
                <CancelButton onClick={handleCancelEdit} />
                <SaveButton onClick={() => updateProvider(editingId)} children="Guardar cambios" />
              </div>
            </div>
          </div>,
          document.body
        )}
      </AdminSection>
    </div>
  );
};

export default FoodProvidersManagement;
