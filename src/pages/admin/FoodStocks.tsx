import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Save, Trash2, Loader, X } from 'lucide-react';

const API_URL = 'https://backend-country-nnxe.onrender.com/food-stock/';


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
    unitMeasurement: 0,
    minStock: 0,
    maxStock: 0,
    fk_idFoodProvider: 1,
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchStocks = async () => {
  setLoading(true);
  try {
    const [stocksRes, providersRes] = await Promise.all([
      fetch(API_URL),
      fetch('https://backend-country-nnxe.onrender.com/food-providers/')
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
      setNewStock({ foodName: '', stock: 0, unitMeasurement: 0, minStock: 0, maxStock: 0, fk_idFoodProvider: 1 });
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
          <input
            type="number"
            name="unitMeasurement"
            placeholder="Ej: 1 (Kg), 2 (Lts)..."
            value={newStock.unitMeasurement}
            onChange={e => setNewStock({ ...newStock, unitMeasurement: Number(e.target.value) })}
            className="w-full p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
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
          {stocks.map(stock => (
            <div key={stock.idFood} className="bg-gray-700 p-4 rounded-md shadow-lg flex flex-col justify-between">
              {editingId === stock.idFood ? (
                <>
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
                    <input
                      type="number"
                      defaultValue={stock.unitMeasurement}
                      onChange={e => setNewStock({ ...newStock, unitMeasurement: Number(e.target.value) })}
                      className="w-full p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
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
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold">{stock.foodName}</h3>
                  <p>Cantidad: {stock.stock}</p>
                  <p>Unidad: {stock.unitMeasurement}</p>
                  <p>Stock Mínimo: {stock.minStock}</p>
                  <p>Stock Máximo: {stock.maxStock}</p>
                  <p>Proveedor ID: {stock.fk_idFoodProvider}</p>
                  <div className="flex items-center justify-end gap-4">
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

export default FoodStocksManagement;