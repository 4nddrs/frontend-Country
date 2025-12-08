import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Save, Trash2, Loader, X } from 'lucide-react';

const API_URL = 'http://localhost:8000/employee_positions/';

interface Position {
  idPositionEmployee?: number;
  namePosition: string;
}

const PositionManagement = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [newPosition, setNewPosition] = useState<Position>({ namePosition: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchPositions = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al obtener posiciones');
      const data = await res.json();
      setPositions(data);
    } catch (err) {
      toast.error('No se pudo cargar posiciones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPositions(); }, []);

  const createPosition = async () => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPosition),
      });
      if (!res.ok) throw new Error('Error al crear posición');
      toast.success('Posición creada!');
      setNewPosition({ namePosition: '' });
      fetchPositions();
    } catch {
      toast.error('No se pudo crear posición.');
    }
  };

  const updatePosition = async (id: number, updatedPosition: Position) => {
    try {
      const res = await fetch(`${API_URL}${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPosition),
      });
      if (!res.ok) throw new Error('Error al actualizar posición');
      toast.success('Posición actualizada!');
      setEditingId(null);
      fetchPositions();
    } catch {
      toast.error('No se pudo actualizar posición.');
    }
  };

  const deletePosition = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar posición');
      toast.success('Posición eliminada!');
      fetchPositions();
    } catch {
      toast.error('No se pudo eliminar posición.');
    }
  };

  return (
    <div  className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
      <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">Gestión de Posiciones</h1>
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.5)] text-[#F8F4E3]">
        <h2 className="text-xl font-semibold mb-4 text-teal-400">Agregar Nueva Posición</h2>
        <div className="flex gap-4">
          <input
            type="text"
            name="namePosition"
            placeholder="Nombre de la posición"
            value={newPosition.namePosition}
            onChange={e => setNewPosition({ namePosition: e.target.value })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          <button onClick={createPosition} className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-md font-semibold flex items-center gap-2">
            <Plus size={20} /> Agregar
          </button>
        </div>
      </div>
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.5)] text-[#F8F4E3]">
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            <Loader size={24} className="animate-spin" />Cargando posiciones...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {positions.map(pos => (
              <div 
                key={pos.idPositionEmployee}
                className="rounded-2xl border border-slate-800/60 bg-gradient-to-br from-teal-500/10 via-slate-900/60 to-slate-900/90 shadow-lg shadow-black/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-teal-500/20"
              >
                {editingId === pos.idPositionEmployee ? (
                  <div className="p-6">
                    <input
                      type="text"
                      defaultValue={pos.namePosition}
                      onChange={e => setNewPosition({ namePosition: e.target.value })}
                      className="w-full p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => updatePosition(pos.idPositionEmployee!, { namePosition: newPosition.namePosition || pos.namePosition })}
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
                      <span className="h-4 w-4 rounded-full bg-teal-500 shadow-[0_0_12px_rgba(20,184,166,0.6)]" />
                      <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
                        Posición
                      </span>
                    </div>

                    <div className="px-6 pb-6 space-y-4 text-sm text-slate-200">
                      <div className="text-center space-y-1">
                        <h3 className="text-lg font-semibold text-teal-300">{pos.namePosition}</h3>
                      </div>

                      <div className="flex items-center justify-center gap-6 border-t border-slate-800 pt-6 pb-2">
                        <button
                          onClick={() => { setEditingId(pos.idPositionEmployee!); setNewPosition(pos); }}
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
                          onClick={() => deletePosition(pos.idPositionEmployee!)}
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
export default PositionManagement;