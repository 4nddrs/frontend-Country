import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Save, Trash2, Loader, X } from 'lucide-react';

const API_URL = 'https://backend-country-nnxe.onrender.com/vaccines/';

interface Vaccine {
  idVaccine?: number;
  vaccineName: string;
  vaccineType: string;
}

const VaccinesManagement = () => {
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [newVaccine, setNewVaccine] = useState<Vaccine>({
    vaccineName: '',
    vaccineType: '',
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchVaccines = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al obtener vacunas');
      const data = await res.json();
      setVaccines(data);
    } catch {
      toast.error('No se pudo cargar vacunas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVaccines();
  }, []);

  const createVaccine = async () => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVaccine),
      });
      if (!res.ok) throw new Error('Error al crear vacuna');
      toast.success('Vacuna creada!');
      setNewVaccine({ vaccineName: '', vaccineType: '' });
      fetchVaccines();
    } catch {
      toast.error('No se pudo crear vacuna.');
    }
  };

  const updateVaccine = async (id: number, updatedVaccine: Vaccine) => {
    try {
      const res = await fetch(`${API_URL}${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedVaccine),
      });
      if (!res.ok) throw new Error('Error al actualizar vacuna');
      toast.success('Vacuna actualizada!');
      setEditingId(null);
      fetchVaccines();
    } catch {
      toast.error('No se pudo actualizar vacuna.');
    }
  };

  const deleteVaccine = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar vacuna');
      toast.success('Vacuna eliminada!');
      fetchVaccines();
    } catch {
      toast.error('No se pudo eliminar vacuna.');
    }
  };

  return (
    <div className="container mx-auto p-4 text-white">
      <h1 className="text-3xl font-bold mb-6 text-center">Gestión de Vacunas</h1>
      <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Agregar Nueva Vacuna</h2>
        <div className="flex gap-4">
          <input
            type="text"
            name="vaccineName"
            placeholder="Nombre de la vacuna"
            value={newVaccine.vaccineName}
            onChange={e => setNewVaccine({ ...newVaccine, vaccineName: e.target.value })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          <input
            type="text"
            name="vaccineType"
            placeholder="Tipo de vacuna"
            value={newVaccine.vaccineType}
            onChange={e => setNewVaccine({ ...newVaccine, vaccineType: e.target.value })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          <button onClick={createVaccine} className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-md font-semibold flex items-center gap-2">
            <Plus size={20} /> Agregar
          </button>
        </div>
      </div>
      <div className="bg-gray-800 p-6 rounded-lg shadow-md">
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            <Loader size={24} className="animate-spin" />Cargando vacunas...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vaccines.map(vaccine => (
              <div key={vaccine.idVaccine} className="bg-gray-700 p-4 rounded-md shadow-lg flex flex-col justify-between">
                {editingId === vaccine.idVaccine ? (
                  <>
                    <input
                      type="text"
                      defaultValue={vaccine.vaccineName}
                      onChange={e => setNewVaccine({ ...newVaccine, vaccineName: e.target.value })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="text"
                      defaultValue={vaccine.vaccineType}
                      onChange={e => setNewVaccine({ ...newVaccine, vaccineType: e.target.value })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => updateVaccine(vaccine.idVaccine!, {
                          vaccineName: newVaccine.vaccineName || vaccine.vaccineName,
                          vaccineType: newVaccine.vaccineType || vaccine.vaccineType,
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
                    <h3 className="text-lg font-semibold">{vaccine.vaccineName}</h3>
                    <p>Tipo: {vaccine.vaccineType}</p>
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => { setEditingId(vaccine.idVaccine!); setNewVaccine(vaccine); }}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white p-2 rounded-md flex items-center gap-1"
                      >
                        <Edit size={16} /> Editar
                      </button>
                      <button
                        onClick={() => deleteVaccine(vaccine.idVaccine!)}
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

export default VaccinesManagement;