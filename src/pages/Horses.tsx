import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Save, Trash2, Loader, X } from 'lucide-react';

const API_URL = 'https://backend-country-nnxe.onrender.com/horses/';

interface Horse {
  idHorse?: number;
  horseName: string;
  dirthDate: string; // ISO string
  sex: string;
  color: string;
  generalDescription: string;
  fk_idOwner: number;
  fk_idRace: number;
  fk_idEmployee: number;
  fk_idVaccine?: number;
  horsePhoto?: string; // base64 or binary, if used
}

const HorsesManagement = () => {
  const [horses, setHorses] = useState<Horse[]>([]);
  const [newHorse, setNewHorse] = useState<Horse>({
    horseName: '',
    dirthDate: '',
    sex: '',
    color: '',
    generalDescription: '',
    fk_idOwner: 1,
    fk_idRace: 1,
    fk_idEmployee: 1,
    fk_idVaccine: undefined,
    horsePhoto: '',
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchHorses = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al obtener caballos');
      const data = await res.json();
      setHorses(data);
    } catch {
      toast.error('No se pudo cargar caballos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHorses();
  }, []);

  const createHorse = async () => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newHorse),
      });
      if (!res.ok) throw new Error('Error al crear caballo');
      toast.success('Caballo creado!');
      setNewHorse({
        horseName: '',
        dirthDate: '',
        sex: '',
        color: '',
        generalDescription: '',
        fk_idOwner: 1,
        fk_idRace: 1,
        fk_idEmployee: 1,
        fk_idVaccine: undefined,
        horsePhoto: '',
      });
      fetchHorses();
    } catch {
      toast.error('No se pudo crear caballo.');
    }
  };

  const updateHorse = async (id: number, updatedHorse: Horse) => {
    try {
      const res = await fetch(`${API_URL}${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedHorse),
      });
      if (!res.ok) throw new Error('Error al actualizar caballo');
      toast.success('Caballo actualizado!');
      setEditingId(null);
      fetchHorses();
    } catch {
      toast.error('No se pudo actualizar caballo.');
    }
  };

  const deleteHorse = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar caballo');
      toast.success('Caballo eliminado!');
      fetchHorses();
    } catch {
      toast.error('No se pudo eliminar caballo.');
    }
  };

  function getImageSrc(photo?: string): string | undefined {
    if (!photo) return undefined;
    // Si ya es un data:image... base64, úsalo
    if (photo.startsWith('data:image')) return photo;
    return `data:image/png;base64,${photo}`;
  }

  return (
    <div className="container mx-auto p-4 text-white">
      <h1 className="text-3xl font-bold mb-6 text-center">Gestión de Caballos</h1>
      <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Agregar Nuevo Caballo</h2>
        <div className="flex gap-4 flex-wrap">
          <input
            type="text"
            name="horseName"
            placeholder="Nombre del caballo"
            value={newHorse.horseName}
            onChange={e => setNewHorse({ ...newHorse, horseName: e.target.value })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          <input
            type="date"
            name="dirthDate"
            placeholder="Fecha de nacimiento"
            value={newHorse.dirthDate}
            onChange={e => setNewHorse({ ...newHorse, dirthDate: e.target.value })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          <input
            type="text"
            name="sex"
            placeholder="Sexo"
            value={newHorse.sex}
            onChange={e => setNewHorse({ ...newHorse, sex: e.target.value })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          <input
            type="text"
            name="color"
            placeholder="Color"
            value={newHorse.color}
            onChange={e => setNewHorse({ ...newHorse, color: e.target.value })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          <input
            type="text"
            name="generalDescription"
            placeholder="Descripción"
            value={newHorse.generalDescription}
            onChange={e => setNewHorse({ ...newHorse, generalDescription: e.target.value })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          <input
            type="number"
            name="fk_idOwner"
            placeholder="ID Propietario"
            value={newHorse.fk_idOwner}
            onChange={e => setNewHorse({ ...newHorse, fk_idOwner: Number(e.target.value) })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          <input
            type="number"
            name="fk_idRace"
            placeholder="ID Raza"
            value={newHorse.fk_idRace}
            onChange={e => setNewHorse({ ...newHorse, fk_idRace: Number(e.target.value) })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          <input
            type="number"
            name="fk_idEmployee"
            placeholder="ID Empleado"
            value={newHorse.fk_idEmployee}
            onChange={e => setNewHorse({ ...newHorse, fk_idEmployee: Number(e.target.value) })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          <input
            type="number"
            name="fk_idVaccine"
            placeholder="ID Vacuna"
            value={newHorse.fk_idVaccine || ''}
            onChange={e => setNewHorse({ ...newHorse, fk_idVaccine: Number(e.target.value) || undefined })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          {/* Si quieres permitir subir foto, puedes agregar input tipo file y convertir a base64 */}
          <button onClick={createHorse} className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-md font-semibold flex items-center gap-2">
            <Plus size={20} /> Agregar
          </button>
        </div>
      </div>
      <div className="bg-gray-800 p-6 rounded-lg shadow-md">
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            <Loader size={24} className="animate-spin" />Cargando caballos...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {horses.map(horse => (
              <div key={horse.idHorse} className="bg-gray-700 p-4 rounded-md shadow-lg flex flex-col justify-between">
                {editingId === horse.idHorse ? (
                  <>
                    <input
                      type="text"
                      defaultValue={horse.horseName}
                      onChange={e => setNewHorse({ ...newHorse, horseName: e.target.value })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="date"
                      defaultValue={horse.dirthDate?.slice(0, 10)}
                      onChange={e => setNewHorse({ ...newHorse, dirthDate: e.target.value })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="text"
                      defaultValue={horse.sex}
                      onChange={e => setNewHorse({ ...newHorse, sex: e.target.value })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="text"
                      defaultValue={horse.color}
                      onChange={e => setNewHorse({ ...newHorse, color: e.target.value })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="text"
                      defaultValue={horse.generalDescription}
                      onChange={e => setNewHorse({ ...newHorse, generalDescription: e.target.value })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="number"
                      defaultValue={horse.fk_idOwner}
                      onChange={e => setNewHorse({ ...newHorse, fk_idOwner: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="number"
                      defaultValue={horse.fk_idRace}
                      onChange={e => setNewHorse({ ...newHorse, fk_idRace: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="number"
                      defaultValue={horse.fk_idEmployee}
                      onChange={e => setNewHorse({ ...newHorse, fk_idEmployee: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="number"
                      defaultValue={horse.fk_idVaccine || ''}
                      onChange={e => setNewHorse({ ...newHorse, fk_idVaccine: Number(e.target.value) || undefined })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => updateHorse(horse.idHorse!, {
                          ...horse,
                          ...newHorse,
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
                    <h3 className="text-lg font-semibold">{horse.horseName}</h3>
                    <p>Fecha nacimiento: {horse.dirthDate?.slice(0,10)}</p>
                    <p>Sexo: {horse.sex}</p>
                    <p>Color: {horse.color}</p>
                    <p>Descripción: {horse.generalDescription}</p>
                    <p>ID Propietario: {horse.fk_idOwner}</p>
                    <p>ID Raza: {horse.fk_idRace}</p>
                    <p>ID Empleado: {horse.fk_idEmployee}</p>
                    <p>ID Vacuna: {horse.fk_idVaccine || '-'}</p>
                    {horse.horsePhoto && (
                      <img
                        src={getImageSrc(horse.horsePhoto)}
                        alt={`Foto de ${horse.horseName}`}
                        className="w-16 h-16 rounded-full object-cover mb-2"
                      />
                    )}
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => { setEditingId(horse.idHorse!); setNewHorse(horse); }}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white p-2 rounded-md flex items-center gap-1"
                      >
                        <Edit size={16} /> Editar
                      </button>
                      <button
                        onClick={() => deleteHorse(horse.idHorse!)}
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

export default HorsesManagement;