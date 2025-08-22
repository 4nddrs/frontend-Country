import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Save, Trash2, Loader, X } from 'lucide-react';

const API_URL = 'https://backend-country-nnxe.onrender.com/food-stocks/';

interface FoodStock {
  idFood?: number;
  foodName: string;
  stock: number;
  unitMeasurement: number;
  unitPrice: number;
  fk_idFoodProvider: number;
}

const FoodStocksManagement = () => {
  const [stocks, setStocks] = useState<FoodStock[]>([]);
  const [newStock, setNewStock] = useState<FoodStock>({
    foodName: '',
    stock: 0,
    unitMeasurement: 0,
    unitPrice: 0,
    fk_idFoodProvider: 1,
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchStocks = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al obtener stocks');
      const data = await res.json();
      setStocks(data);
    } catch {
      toast.error('No se pudo cargar stocks.');
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
      setNewStock({ foodName: '', stock: 0, unitMeasurement: 0, unitPrice: 0, fk_idFoodProvider: 1 });
      fetchStocks();
    } catch {
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
    <div className="container mx-auto p-4 text-white">
      <h1 className="text-3xl font-bold mb-6 text-center">Gestión de Stock de Comida</h1>
      <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Agregar Nuevo Stock</h2>
        <div className="flex gap-4 flex-wrap">
          <input
            type="text"
            name="foodName"
            placeholder="Nombre de la comida"
            value={newStock.foodName}
            onChange={e => setNewStock({ ...newStock, foodName: e.target.value })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          <input
            type="number"
            name="stock"
            placeholder="Cantidad"
            value={newStock.stock}
            onChange={e => setNewStock({ ...newStock, stock: Number(e.target.value) })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          <input
            type="number"
            name="unitMeasurement"
            placeholder="Unidad de medida"
            value={newStock.unitMeasurement}
            onChange={e => setNewStock({ ...newStock, unitMeasurement: Number(e.target.value) })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          <input
            type="number"
            name="unitPrice"
            placeholder="Precio unitario"
            value={newStock.unitPrice}
            onChange={e => setNewStock({ ...newStock, unitPrice: Number(e.target.value) })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          <input
            type="number"
            name="fk_idFoodProvider"
            placeholder="ID Proveedor"
            value={newStock.fk_idFoodProvider}
            onChange={e => setNewStock({ ...newStock, fk_idFoodProvider: Number(e.target.value) })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          <button onClick={createStock} className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-md font-semibold flex items-center gap-2">
            <Plus size={20} /> Agregar
          </button>
        </div>
      </div>
      <div className="bg-gray-800 p-6 rounded-lg shadow-md">
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            <Loader size={24} className="animate-spin" />Cargando stock...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stocks.map(stock => (
              <div key={stock.idFood} className="bg-gray-700 p-4 rounded-md shadow-lg flex flex-col justify-between">
                {editingId === stock.idFood ? (
                  <>
                    <input
                      type="text"
                      defaultValue={stock.foodName}
                      onChange={e => setNewStock({ ...newStock, foodName: e.target.value })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="number"
                      defaultValue={stock.stock}
                      onChange={e => setNewStock({ ...newStock, stock: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="number"
                      defaultValue={stock.unitMeasurement}
                      onChange={e => setNewStock({ ...newStock, unitMeasurement: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="number"
                      defaultValue={stock.unitPrice}
                      onChange={e => setNewStock({ ...newStock, unitPrice: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="number"
                      defaultValue={stock.fk_idFoodProvider}
                      onChange={e => setNewStock({ ...newStock, fk_idFoodProvider: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => updateStock(stock.idFood!, {
                          foodName: newStock.foodName || stock.foodName,
                          stock: newStock.stock || stock.stock,
                          unitMeasurement: newStock.unitMeasurement || stock.unitMeasurement,
                          unitPrice: newStock.unitPrice || stock.unitPrice,
                          fk_idFoodProvider: newStock.fk_idFoodProvider || stock.fk_idFoodProvider,
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
                    <h3 className="text-lg font-semibold">{stock.foodName}</h3>
                    <p>Cantidad: {stock.stock}</p>
                    <p>Unidad: {stock.unitMeasurement}</p>
                    <p>Precio: {stock.unitPrice}</p>
                    <p>ID Proveedor: {stock.fk_idFoodProvider}</p>
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => { setEditingId(stock.idFood!); setNewStock(stock); }}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white p-2 rounded-md flex items-center gap-1"
                      >
                        <Edit size={16} /> Editar
                      </button>
                      <button
                        onClick={() => deleteStock(stock.idFood!)}
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

export default FoodStocksManagement;