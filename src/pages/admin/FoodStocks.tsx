import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import { Edit, Trash2, Loader, ChevronUp, ChevronDown } from 'lucide-react';
import { confirmDialog } from '../../utils/confirmDialog';
import { AddButton, AdminSection, SaveButton, CancelButton } from '../../components/ui/admin-buttons';

const API_URL = 'http://localhost:8000/food-stock/';

interface FoodProvider {
  idFoodProvider: number;
  supplierName: string;
}

interface FoodStock {
  idFood?: number;
  foodName: string;
  stock: number;
  unitMeasurement: number;
  minStock: number;
  maxStock: number;
  fk_idFoodProvider: number;
}

const FoodStocksManagement = () => {
  const [foodProviders, setFoodProviders] = useState<FoodProvider[]>([]);
  const [stocks, setStocks] = useState<FoodStock[]>([]);
  const [newStock, setNewStock] = useState<FoodStock>({
    foodName: '',
    stock: 0,
    unitMeasurement: 1,
    minStock: 0,
    maxStock: 0,
    fk_idFoodProvider: 1,
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<FoodStock | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const isEditModalOpen = editingId !== null && editingData !== null;

  useEffect(() => {
    if (!isEditModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') handleCancelEdit(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isEditModalOpen]);

  const fetchStocks = async () => {
    setLoading(true);
    try {
      const [stocksRes, providersRes] = await Promise.all([
        fetch(API_URL),
        fetch('http://localhost:8000/food-providers/')
      ]);
      if (!stocksRes.ok || !providersRes.ok) throw new Error('Error al obtener datos');
      const [stocksData, providersData] = await Promise.all([
        stocksRes.json(),
        providersRes.json()
      ]);
      const list: FoodStock[] = Array.isArray(stocksData) ? stocksData : [];
      list.sort((a, b) => (b.idFood ?? 0) - (a.idFood ?? 0));
      setStocks(list);
      setFoodProviders(providersData);
    } catch (error) {
      toast.error('No se pudo cargar stocks o proveedores.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
  }, []);

  const createStock = async () => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStock),
      });
      if (!res.ok) throw new Error('Error al crear stock');
      toast.success('Stock creado!');
      setNewStock({ foodName: '', stock: 0, unitMeasurement: 1, minStock: 0, maxStock: 0, fk_idFoodProvider: 1 });
      fetchStocks();
    } catch (err) {
      toast.error('No se pudo crear stock.');
    }
  };

  const updateStock = async (id: number) => {
    if (!editingData) return;
    try {
      const res = await fetch(`${API_URL}${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingData),
      });
      if (!res.ok) throw new Error('Error al actualizar stock');
      toast.success('Stock actualizado!');
      setEditingId(null);
      setEditingData(null);
      fetchStocks();
    } catch {
      toast.error('No se pudo actualizar stock.');
    }
  };

  const deleteStock = async (id: number) => {
    const confirmed = await confirmDialog({
      title: '¿Eliminar stock?',
      description: 'Esta acción eliminará el registro de stock de alimento permanentemente.',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
    });
    if (!confirmed) return;
    try {
      const res = await fetch(`${API_URL}${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar stock');
      toast.success('Stock eliminado!');
      fetchStocks();
    } catch {
      toast.error('No se pudo eliminar stock.');
    }
  };

  const handleEditClick = (stock: FoodStock) => {
    setEditingId(stock.idFood!);
    setEditingData({ ...stock });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingData(null);
  };

  return (
    <div className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
      <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">Gestión de Stock de Comida</h1>

      <AdminSection>
        <h2 className="text-xl font-semibold mb-4 text-teal-400">Agregar Nuevo Stock</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block mb-1 text-sm font-medium">Nombre del alimento</label>
            <input type="text" name="foodName" placeholder="Ej: Arroz" value={newStock.foodName}
              onChange={e => setNewStock({ ...newStock, foodName: e.target.value })} className="w-full" />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Cantidad en stock</label>
            <input type="number" name="stock" placeholder="Ej: 100" value={newStock.stock === 0 ? '' : newStock.stock}
              onChange={e => setNewStock({ ...newStock, stock: Number(e.target.value) })} className="w-full" />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Unidad de medida</label>
            <div className="relative">
              <select name="unitMeasurement" value={newStock.unitMeasurement}
                onChange={e => setNewStock({ ...newStock, unitMeasurement: Number(e.target.value) })} className="w-full appearance-none pr-8">
                <option value={1}>Kilo</option>
                <option value={2}>Cubo</option>
                <option value={3}>Fardo</option>
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Stock mínimo permitido</label>
            <input type="number" name="minStock" placeholder="Ej: 10" value={newStock.minStock === 0 ? '' : newStock.minStock}
              onChange={e => setNewStock({ ...newStock, minStock: Number(e.target.value) })} className="w-full" />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Stock máximo permitido</label>
            <input type="number" name="maxStock" placeholder="Ej: 500" value={newStock.maxStock === 0 ? '' : newStock.maxStock}
              onChange={e => setNewStock({ ...newStock, maxStock: Number(e.target.value) })} className="w-full" />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Proveedor asociado</label>
            <div className="relative">
              <select name="fk_idFoodProvider" value={newStock.fk_idFoodProvider}
                onChange={e => setNewStock({ ...newStock, fk_idFoodProvider: Number(e.target.value) })} className="w-full appearance-none pr-8">
                {foodProviders.map(provider => (
                  <option key={provider.idFoodProvider} value={provider.idFoodProvider}>{provider.supplierName}</option>
                ))}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-7">
          <AddButton onClick={createStock} className="px-16 justify-center" />
        </div>
      </AdminSection>

      <AdminSection>
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            <Loader size={24} className="animate-spin" /> Cargando stock...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stocks.map(stock => {
              const isExpanded = expanded[stock.idFood ?? 0] ?? false;
              const providerName = foodProviders.find(p => p.idFoodProvider === stock.fk_idFoodProvider)?.supplierName || `Proveedor #${stock.fk_idFoodProvider}`;
              return (
                <div
                  key={stock.idFood}
                  className="rounded-2xl border border-slate-800/60 bg-gradient-to-br from-green-500/10 via-slate-900/60 to-slate-900/90 shadow-lg shadow-black/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-green-500/20"
                >
                  <div className="flex flex-col items-center gap-2 py-5">
                    <span className="h-4 w-4 rounded-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)]" />
                    <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Stock</span>
                  </div>

                  <div className="px-6 pb-6 space-y-4 text-sm text-slate-200">
                    <div className="text-center space-y-1">
                      <h3 className="text-lg font-semibold text-green-300">{stock.foodName}</h3>
                      <p className="text-slate-400">
                        Cantidad: <span className="font-medium text-slate-200">{stock.stock}</span>
                      </p>
                    </div>

                    <button
                      onClick={() => setExpanded(prev => ({ ...prev, [stock.idFood ?? 0]: !prev[stock.idFood ?? 0] }))}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-green-500/40 bg-green-500/10 py-2 text-sm font-medium text-green-300 transition hover:bg-green-500/15"
                    >
                      {isExpanded ? <><ChevronUp size={16} /> Ver menos</> : <><ChevronDown size={16} /> Ver más</>}
                    </button>

                    {isExpanded && (
                      <div className="rounded-xl border border-slate-800/80 bg-slate-900/70 p-4 text-xs leading-relaxed">
                        <ul className="space-y-1">
                          <li><strong>Unidad:</strong> {stock.unitMeasurement}</li>
                          <li><strong>Stock Mínimo:</strong> {stock.minStock}</li>
                          <li><strong>Stock Máximo:</strong> {stock.maxStock}</li>
                          <li><strong>Proveedor:</strong> {providerName}</li>
                        </ul>
                      </div>
                    )}

                    <div className="flex items-center justify-center gap-6 border-t border-slate-800 pt-6 pb-2">
                      <button
                        onClick={() => handleEditClick(stock)}
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
                        onClick={() => deleteStock(stock.idFood!)}
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
              );
            })}
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
                  <h3 className="text-2xl font-bold text-[#F8F4E3]">Editar Stock</h3>
                  <p className="text-sm text-slate-400">Actualiza los datos.</p>
                </div>
                <button onClick={handleCancelEdit} className="rounded-lg border border-slate-500 px-3 py-1.5 text-slate-300 hover:bg-slate-800">
                  Cerrar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium">Nombre del alimento</label>
                  <input type="text" value={editingData.foodName}
                    onChange={e => setEditingData({ ...editingData, foodName: e.target.value })}
                    className="w-full p-2 rounded-md bg-gray-700" />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Cantidad en stock</label>
                  <input type="number" value={editingData.stock}
                    onChange={e => setEditingData({ ...editingData, stock: Number(e.target.value) })}
                    className="w-full p-2 rounded-md bg-gray-700" />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Unidad de medida</label>
                  <select value={editingData.unitMeasurement}
                    onChange={e => setEditingData({ ...editingData, unitMeasurement: Number(e.target.value) })}
                    className="w-full p-2 rounded-md bg-gray-700">
                    <option value={1}>Kilo</option>
                    <option value={2}>Cubo</option>
                    <option value={3}>Fardo</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Stock mínimo</label>
                  <input type="number" value={editingData.minStock}
                    onChange={e => setEditingData({ ...editingData, minStock: Number(e.target.value) })}
                    className="w-full p-2 rounded-md bg-gray-700" />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Stock máximo</label>
                  <input type="number" value={editingData.maxStock}
                    onChange={e => setEditingData({ ...editingData, maxStock: Number(e.target.value) })}
                    className="w-full p-2 rounded-md bg-gray-700" />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Proveedor asociado</label>
                  <select value={editingData.fk_idFoodProvider}
                    onChange={e => setEditingData({ ...editingData, fk_idFoodProvider: Number(e.target.value) })}
                    className="w-full p-2 rounded-md bg-gray-700">
                    {foodProviders.map(provider => (
                      <option key={provider.idFoodProvider} value={provider.idFoodProvider}>{provider.supplierName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-700 pt-4">
                <CancelButton onClick={handleCancelEdit} />
                <SaveButton onClick={() => updateStock(editingId)} children="Guardar cambios" />
              </div>
            </div>
          </div>,
          document.body
        )}
      </AdminSection>
    </div>
  );
};

export default FoodStocksManagement;
