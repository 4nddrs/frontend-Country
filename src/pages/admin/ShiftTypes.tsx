import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Save, Trash2, Loader, X } from 'lucide-react';
import { confirmDialog } from '../../utils/confirmDialog';

const API_URL = 'http://localhost:8000/shift_types/';

interface ShiftType {
  idShiftType?: number;
  shiftName: string;
  description?: string;
  created_at?: string;
}

const ShiftTypesManagement = () => {
  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>([]);
  const [newShiftType, setNewShiftType] = useState<ShiftType>({
    shiftName: '',
    description: '',
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchShiftTypes = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al obtener tipos de turno');
      const data = await res.json();
      setShiftTypes(data);
    } catch {
      toast.error('No se pudieron cargar los tipos de turno.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShiftTypes();
  }, []);

  const createShiftType = async () => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newShiftType),
      });
      if (!res.ok) throw new Error('Error al crear tipo de turno');
      toast.success('Tipo de turno creado!');
      setNewShiftType({ shiftName: '', description: '' });
      fetchShiftTypes();
    } catch {
      toast.error('No se pudo crear el tipo de turno.');
    }
  };

  const updateShiftType = async (id: number, updatedShiftType: ShiftType) => {
    try {
      const res = await fetch(`${API_URL}${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedShiftType),
      });
      if (!res.ok) throw new Error('Error al actualizar tipo de turno');
      toast.success('Tipo de turno actualizado!');
      setEditingId(null);
      fetchShiftTypes();
    } catch {
      toast.error('No se pudo actualizar el tipo de turno.');
    }
  };

  const deleteShiftType = async (id: number) => {
    const confirmed = await confirmDialog({
      title: '¿Eliminar tipo de turno?',
      description: 'Esta acción eliminará el tipo de turno permanentemente.',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
    });
    if (!confirmed) return;
    try {
      const res = await fetch(`${API_URL}${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar tipo de turno');
      toast.success('Tipo de turno eliminado!');
      fetchShiftTypes();
    } catch {
      toast.error('No se pudo eliminar el tipo de turno.');
    }
  };

  return (
    <div  className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
      <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">Gestión de Tipos de Turno</h1>
      
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.5)] text-[#F8F4E3]">
        <h2 className="text-xl font-semibold mb-4 text-teal-400">Agregar Nuevo Tipo de Turno</h2>
        <div className="flex gap-4 flex-wrap">
          <input
            type="text"
            name="shiftName"
            placeholder="Nombre del turno"
            value={newShiftType.shiftName}
            onChange={e => setNewShiftType({ ...newShiftType, shiftName: e.target.value })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          <input
            type="text"
            name="description"
            placeholder="Descripción"
            value={newShiftType.description}
            onChange={e => setNewShiftType({ ...newShiftType, description: e.target.value })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          <button onClick={createShiftType} className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-md font-semibold flex items-center gap-2">
            <Plus size={20} /> Agregar
          </button>
        </div>
      </div>
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.5)] text-[#F8F4E3]">
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            <Loader size={24} className="animate-spin" />Cargando tipos de turno...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shiftTypes.map(shift => (
              <div
                key={shift.idShiftType}
                className="rounded-2xl border border-slate-800/60 bg-gradient-to-br from-indigo-500/10 via-slate-900/60 to-slate-900/90 shadow-lg shadow-black/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-indigo-500/20"
              >
                {editingId === shift.idShiftType ? (
                  <div className="p-6">
                    <div>
                      <label className="block mb-1 text-sm font-medium">Nombre del turno</label>
                      <input
                        type="text"
                        defaultValue={shift.shiftName}
                        onChange={e => setNewShiftType({ ...newShiftType, shiftName: e.target.value })}
                        className="w-full p-2 rounded-md bg-gray-600 text-white mb-2"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium">Descripción</label>
                      <input
                        type="text"
                        defaultValue={shift.description}
                        onChange={e => setNewShiftType({ ...newShiftType, description: e.target.value })}
                        className="w-full p-2 rounded-md bg-gray-600 text-white mb-2"
                      />
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => updateShiftType(shift.idShiftType!, {
                          ...shift,
                          ...newShiftType,
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
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col items-center gap-2 py-5">
                      <span className="h-4 w-4 rounded-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.6)]" />
                      <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
                        Turno
                      </span>
                    </div>

                    <div className="px-6 pb-6 space-y-4 text-sm text-slate-200">
                      <div className="text-center space-y-1">
                        <h3 className="text-lg font-semibold text-indigo-300">{shift.shiftName}</h3>
                      </div>

                      {shift.description && (
                        <div className="rounded-xl border border-slate-800/80 bg-slate-900/70 p-4 text-xs leading-relaxed">
                          <ul className="space-y-1">
                            <li><strong>Descripción:</strong> {shift.description}</li>
                          </ul>
                        </div>
                      )}

                      <div className="flex items-center justify-center gap-6 border-t border-slate-800 pt-6 pb-2">
                        <button
                          onClick={() => { setEditingId(shift.idShiftType!); setNewShiftType(shift); }}
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
                          onClick={() => deleteShiftType(shift.idShiftType!)}
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

export default ShiftTypesManagement;