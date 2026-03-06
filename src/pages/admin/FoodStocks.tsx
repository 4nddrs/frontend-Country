import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Save, Trash2, Loader, X, ChevronUp, ChevronDown } from 'lucide-react';
import { confirmDialog } from '../../utils/confirmDialog';

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
  const [loading, setLoading] = useState<boolean>(true);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const fetchStocks = async () => {
  setLoading(true);
  try {
    const [stocksRes, providersRes] = await Promise.all([
      fetch(API_URL),
      fetch('http://localhost:8000/food-providers/')
    ]);

    if (!stocksRes.ok || !providersRes.ok) {
      throw new Error('Error al obtener datos');
    }

    const [stocksData, providersData] = await Promise.all([
      stocksRes.json(),
      providersRes.json()
    ]);

    setStocks(stocksData);
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
      console.log('📤 Registrando nuevo stock:', newStock);
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
      console.error('❌ Error al registrar stock:', err);
      toast.error('No se pudo crear stock.');
    }
  };

  const updateStock = async (id: number, updatedStock: FoodStock) => {
    try {
      const res = await fetch(`${API_URL}${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedStock),
      });
      if (!res.ok) throw new Error('Error al actualizar stock');
      toast.success('Stock actualizado!');
      setEditingId(null);
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

 return (
  <div  className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
    <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">Gestión de Stock de Comida</h1>
    
    <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.5)] text-[#F8F4E3]">
      <h2 className="text-xl font-semibold mb-4 text-teal-400">Agregar Nuevo Stock</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block mb-1 text-sm font-medium">Nombre del alimento</label>
          <input
            type="text"
            name="foodName"
            placeholder="Ej: Arroz"
            value={newStock.foodName}
            onChange={e => setNewStock({ ...newStock, foodName: e.target.value })}
            className="w-full p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">Cantidad en stock</label>
          <input
            type="number"
            name="stock"
            placeholder="Ej: 100"
            value={newStock.stock}
            onChange={e => setNewStock({ ...newStock, stock: Number(e.target.value) })}
            className="w-full p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">Unidad de medida</label>
          <select
            name="unitMeasurement"
            value={newStock.unitMeasurement}
            onChange={e => setNewStock({ ...newStock, unitMeasurement: Number(e.target.value) })}
            className="w-full p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          >
            <option value={1}>Kilo</option>
            <option value={2}>Cubo</option>
            <option value={3}>Fardo</option>
          </select>
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">Stock mínimo permitido</label>
          <input
            type="number"
            name="minStock"
            placeholder="Ej: 10"
            value={newStock.minStock}
            onChange={e => setNewStock({ ...newStock, minStock: Number(e.target.value) })}
            className="w-full p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">Stock máximo permitido</label>
          <input
            type="number"
            name="maxStock"
            placeholder="Ej: 500"
            value={newStock.maxStock}
            onChange={e => setNewStock({ ...newStock, maxStock: Number(e.target.value) })}
            className="w-full p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">Proveedor asociado</label>
          <select
            name="fk_idFoodProvider"
            value={newStock.fk_idFoodProvider}
            onChange={e => setNewStock({ ...newStock, fk_idFoodProvider: Number(e.target.value) })}
            className="w-full p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          >
            {foodProviders.map(provider => (
              <option key={provider.idFoodProvider} value={provider.idFoodProvider}>
                {provider.supplierName}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button
        onClick={createStock}
        className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-semibold flex items-center gap-2"
      >
        <Plus size={20} /> Agregar
      </button>
    </div>

    {/* Lista de stocks */}
    <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.5)] text-[#F8F4E3]">
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
                {editingId === stock.idFood ? (
                  <div className="p-6">
                    <div>
                      <label className="block mb-1 text-sm font-medium">Nombre del alimento</label>
                      <input
                        type="text"
                        defaultValue={stock.foodName}
                        onChange={e => setNewStock({ ...newStock, foodName: e.target.value })}
                        className="w-full p-2 rounded-md bg-gray-600 text-white mb-2"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium">Cantidad en stock</label>
                      <input
                        type="number"
                        defaultValue={stock.stock}
                        onChange={e => setNewStock({ ...newStock, stock: Number(e.target.value) })}
                        className="w-full p-2 rounded-md bg-gray-600 text-white mb-2"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium">Unidad de medida</label>
                      <select
                        defaultValue={stock.unitMeasurement}
                        onChange={e => setNewStock({ ...newStock, unitMeasurement: Number(e.target.value) })}
                        className="w-full p-2 rounded-md bg-gray-600 text-white mb-2"
                      >
                        <option value={1}>Kilo</option>
                        <option value={2}>Cubo</option>
                        <option value={3}>Fardo</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium">Stock mínimo permitido</label>
                      <input
                        type="number"
                        defaultValue={stock.minStock}
                        onChange={e => setNewStock({ ...newStock, minStock: Number(e.target.value) })}
                        className="w-full p-2 rounded-md bg-gray-600 text-white mb-2"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium">Stock máximo permitido</label>
                      <input
                        type="number"
                        defaultValue={stock.maxStock}
                        onChange={e => setNewStock({ ...newStock, maxStock: Number(e.target.value) })}
                        className="w-full p-2 rounded-md bg-gray-600 text-white mb-2"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium">Proveedor asociado</label>
                      <select
                        defaultValue={stock.fk_idFoodProvider}
                        onChange={e => setNewStock({ ...newStock, fk_idFoodProvider: Number(e.target.value) })}
                        className="w-full p-2 rounded-md bg-gray-600 text-white mb-2"
                      >
                        {foodProviders.map(provider => (
                          <option key={provider.idFoodProvider} value={provider.idFoodProvider}>
                            {provider.supplierName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() =>
                          updateStock(stock.idFood!, {
                            foodName: newStock.foodName || stock.foodName,
                            stock: newStock.stock || stock.stock,
                            unitMeasurement: newStock.unitMeasurement || stock.unitMeasurement,
                            minStock: newStock.minStock || stock.minStock,
                            maxStock: newStock.maxStock || stock.maxStock,
                            fk_idFoodProvider: newStock.fk_idFoodProvider || stock.fk_idFoodProvider,
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
                      <span className="h-4 w-4 rounded-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)]" />
                      <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
                        Stock
                      </span>
                    </div>

                    <div className="px-6 pb-6 space-y-4 text-sm text-slate-200">
                      <div className="text-center space-y-1">
                        <h3 className="text-lg font-semibold text-green-300">{stock.foodName}</h3>
                        <p className="text-slate-400">
                          Cantidad: <span className="font-medium text-slate-200">{stock.stock}</span>
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          setExpanded((prev) => ({
                            ...prev,
                            [stock.idFood ?? 0]: !prev[stock.idFood ?? 0],
                          }))
                        }
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-green-500/40 bg-green-500/10 py-2 text-sm font-medium text-green-300 transition hover:bg-green-500/15"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp size={16} /> Ver menos
                          </>
                        ) : (
                          <>
                            <ChevronDown size={16} /> Ver más
                          </>
                        )}
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
                          onClick={() => {
                            setEditingId(stock.idFood!);
                            setNewStock(stock);
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
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  </div>
);

};

export default FoodStocksManagement;
