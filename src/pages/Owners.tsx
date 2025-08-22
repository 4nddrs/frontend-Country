import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Save, Trash2, Loader, X } from 'lucide-react';

const API_URL = 'https://backend-country-nnxe.onrender.com/owners/';

interface Owner {
  idOwner?: number;
  name: string;
  FirstName: string;
  SecondName?: string;
  ci: number;
  phoneNumber: number;
  ownerPhoto?: string; // Base64 string
}

const OwnersManagement = () => {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [newOwner, setNewOwner] = useState<Owner>({
    name: '',
    FirstName: '',
    SecondName: '',
    ci: 0,
    phoneNumber: 0,
    ownerPhoto: '',
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchOwners = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al obtener propietarios');
      const data = await res.json();
      setOwners(data);
    } catch {
      toast.error('No se pudo cargar propietarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwners();
  }, []);

  const createOwner = async () => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOwner),
      });
      if (!res.ok) throw new Error('Error al crear propietario');
      toast.success('Propietario creado!');
      setNewOwner({ name: '', FirstName: '', SecondName: '', ci: 0, phoneNumber: 0, ownerPhoto: '' });
      fetchOwners();
    } catch {
      toast.error('No se pudo crear propietario.');
    }
  };

  const updateOwner = async (id: number, updatedOwner: Owner) => {
    try {
      const res = await fetch(`${API_URL}${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedOwner),
      });
      if (!res.ok) throw new Error('Error al actualizar propietario');
      toast.success('Propietario actualizado!');
      setEditingId(null);
      fetchOwners();
    } catch {
      toast.error('No se pudo actualizar propietario.');
    }
  };

  const deleteOwner = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar propietario');
      toast.success('Propietario eliminado!');
      fetchOwners();
    } catch {
      toast.error('No se pudo eliminar propietario.');
    }
  };

  // Para mostrar la foto si tienes el base64 con prefijo
  function getImageSrc(photo?: string): string | undefined {
    if (!photo) return undefined;
    // Si ya es un data:image... base64, úsalo
    if (photo.startsWith('data:image')) return photo;
    // Si no, puedes ajustar aquí el tipo
    return `data:image/png;base64,${photo}`;
  }

  return (
    <div className="container mx-auto p-4 text-white">
      <h1 className="text-3xl font-bold mb-6 text-center">Gestión de Propietarios</h1>
      <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Agregar Nuevo Propietario</h2>
        <div className="flex gap-4 flex-wrap">
          <input
            type="text"
            name="name"
            placeholder="Apellido"
            value={newOwner.name}
            onChange={e => setNewOwner({ ...newOwner, name: e.target.value })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          <input
            type="text"
            name="FirstName"
            placeholder="Primer nombre"
            value={newOwner.FirstName}
            onChange={e => setNewOwner({ ...newOwner, FirstName: e.target.value })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          <input
            type="text"
            name="SecondName"
            placeholder="Segundo nombre"
            value={newOwner.SecondName}
            onChange={e => setNewOwner({ ...newOwner, SecondName: e.target.value })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          <input
            type="number"
            name="ci"
            placeholder="Cédula de identidad"
            value={newOwner.ci}
            onChange={e => setNewOwner({ ...newOwner, ci: Number(e.target.value) })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          <input
            type="number"
            name="phoneNumber"
            placeholder="Teléfono"
            value={newOwner.phoneNumber}
            onChange={e => setNewOwner({ ...newOwner, phoneNumber: Number(e.target.value) })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          {/* Si quieres permitir subir foto, puedes agregar input tipo file y convertir a base64 */}
          <button onClick={createOwner} className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-md font-semibold flex items-center gap-2">
            <Plus size={20} /> Agregar
          </button>
        </div>
      </div>
      <div className="bg-gray-800 p-6 rounded-lg shadow-md">
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            <Loader size={24} className="animate-spin" />Cargando propietarios...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {owners.map(owner => (
              <div key={owner.idOwner} className="bg-gray-700 p-4 rounded-md shadow-lg flex flex-col justify-between">
                {editingId === owner.idOwner ? (
                  <>
                    <input
                      type="text"
                      defaultValue={owner.name}
                      onChange={e => setNewOwner({ ...newOwner, name: e.target.value })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="text"
                      defaultValue={owner.FirstName}
                      onChange={e => setNewOwner({ ...newOwner, FirstName: e.target.value })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="text"
                      defaultValue={owner.SecondName}
                      onChange={e => setNewOwner({ ...newOwner, SecondName: e.target.value })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="number"
                      defaultValue={owner.ci}
                      onChange={e => setNewOwner({ ...newOwner, ci: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="number"
                      defaultValue={owner.phoneNumber}
                      onChange={e => setNewOwner({ ...newOwner, phoneNumber: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => updateOwner(owner.idOwner!, {
                          name: newOwner.name || owner.name,
                          FirstName: newOwner.FirstName || owner.FirstName,
                          SecondName: newOwner.SecondName || owner.SecondName,
                          ci: newOwner.ci || owner.ci,
                          phoneNumber: newOwner.phoneNumber || owner.phoneNumber,
                          ownerPhoto: owner.ownerPhoto,
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
                    <h3 className="text-lg font-semibold">{owner.name} {owner.FirstName} {owner.SecondName}</h3>
                    <p>CI: {owner.ci}</p>
                    <p>Teléfono: {owner.phoneNumber}</p>
                    {owner.ownerPhoto && (
                      <img
                        src={getImageSrc(owner.ownerPhoto)}
                        alt={`Foto de ${owner.name} ${owner.FirstName}`}
                        className="w-16 h-16 rounded-full object-cover mb-2"
                      />
                    )}
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => { setEditingId(owner.idOwner!); setNewOwner(owner); }}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white p-2 rounded-md flex items-center gap-1"
                      >
                        <Edit size={16} /> Editar
                      </button>
                      <button
                        onClick={() => deleteOwner(owner.idOwner!)}
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

export default OwnersManagement;