import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Save, Trash2, Loader, X } from 'lucide-react';

const API_URL = 'https://backend-country-nnxe.onrender.com/shift_types/';

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
    <div className="p-6 bg-slate-950 min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-6 text-center text-teal-400">Gestión de Tipos de Turno</h1>
      <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-8">
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
      <div className="bg-gray-800 p-6 rounded-lg shadow-md">
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            <Loader size={24} className="animate-spin" />Cargando tipos de turno...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shiftTypes.map(shift => (
              <div key={shift.idShiftType} className="bg-gray-700 p-4 rounded-md shadow-lg flex flex-col justify-between">
                {editingId === shift.idShiftType ? (
                  <>
                    <input
                      type="text"
                      defaultValue={shift.shiftName}
                      onChange={e => setNewShiftType({ ...newShiftType, shiftName: e.target.value })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="text"
                      defaultValue={shift.description}
                      onChange={e => setNewShiftType({ ...newShiftType, description: e.target.value })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <div className="flex justify-end gap-2">
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
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold">{shift.shiftName}</h3>
                    <p>Descripción: {shift.description}</p>
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => { setEditingId(shift.idShiftType!); setNewShiftType(shift); }}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white p-2 rounded-md flex items-center gap-1"
                      >
                        <Edit size={16} /> Editar
                      </button>
                      <button
                        onClick={() => deleteShiftType(shift.idShiftType!)}
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

export default ShiftTypesManagement;