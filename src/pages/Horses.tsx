import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast'; 
import { Plus, Edit, Save, Trash2, Loader, X } from 'lucide-react';
import { decodeBackendImage } from '../utils/imageHelpers';

// URL de tu API backend
const API_URL = '/api/horses/';


// --- INTERFACES ---
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
  horsePhoto?: string | null;

}

// --- COMPONENTE ---
const HorsesManagement = () => {
  // --- ESTADOS ---
  const [owners, setOwners] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [races, setRaces] = useState<any[]>([]);
  const [vaccines, setVaccines] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [horses, setHorses] = useState<Horse[]>([]);

  const [newHorse, setNewHorse] = useState<Omit<Horse, 'idHorse'>>({
    horseName: '',
    dirthDate: '',
    sex: '',
    color: '',
    generalDescription: '',
    fk_idOwner: 1,
    fk_idRace: 1,
    fk_idEmployee: 1,
    fk_idVaccine: undefined,
    horsePhoto: null,
  });

  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingHorseData, setEditingHorseData] = useState<Horse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  
  // --- EFECTOS ---
  useEffect(() => {
    fetchHorses();
  }, []);

  const fetchOwners = async () => {
  if (owners.length === 0) {
    try {
      const res = await fetch("https://backend-country-nnxe.onrender.com/owners/");
      const data = await res.json();
      setOwners(data);
    } catch (err) {
      console.error("Error cargando owners:", err);
    }
  }
};

const fetchEmployees = async () => {
  if (employees.length === 0) {
    try {
      const res = await fetch("https://backend-country-nnxe.onrender.com/employees/");
      const data = await res.json();
      setEmployees(data);
    } catch (err) {
      console.error("Error cargando employees:", err);
    }
  }
};

const fetchRaces = async () => {
  if (races.length === 0) {
    try {
      const res = await fetch("https://backend-country-nnxe.onrender.com/races/");
      const data = await res.json();
      setRaces(data);
    } catch (err) {
      console.error("Error cargando races:", err);
    }
  }
};

const fetchVaccines = async () => {
  if (vaccines.length === 0) {
    try {
      const res = await fetch("https://backend-country-nnxe.onrender.com/vaccines/");
      const data = await res.json();
      setVaccines(data);
    } catch (err) {
      console.error("Error cargando vaccines:", err);
    }
  }
};

  // --- FUNCIONES API ---
  const fetchHorses = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al obtener los caballos');
      const data = await res.json();
      setHorses(data);
    } catch (error) {
      console.error(error);
      toast.error('No se pudo cargar la lista de caballos.');
    } finally {
      setLoading(false);
    }
  };

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file); // incluye el prefijo data:image/...
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

function base64ToBytes(base64: string): number[] {
  const cleaned = base64.split(",")[1]; // quita el "data:image/jpeg;base64,"
  const binary = atob(cleaned);
  const bytes = new Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

const handlePhotoChange = async (
  e: React.ChangeEvent<HTMLInputElement>,
  mode: "create" | "edit" = "create"
) => {
  if (e.target.files && e.target.files[0]) {
    const base64 = await toBase64(e.target.files[0]); // incluye "data:image/jpeg;base64,..."

    if (mode === "create") {
      setNewHorse({ ...newHorse, horsePhoto: base64 });
    } else if (mode === "edit" && editingHorseData) {
      setEditingHorseData({ ...editingHorseData, horsePhoto: base64 });
    }
  }
};

const prepareHorseData = (horse: Horse) => ({
  ...horse,
  fk_idOwner: Number(horse.fk_idOwner),
  fk_idRace: Number(horse.fk_idRace),
  fk_idEmployee: Number(horse.fk_idEmployee),
  fk_idVaccine: horse.fk_idVaccine ? Number(horse.fk_idVaccine) : undefined,
  horsePhoto: horse.horsePhoto ? horse.horsePhoto.split(",")[1] : null, // quita el prefijo
});


  // --- CONVERTIR ARCHIVO A BASE64 ---

  const createHorse = async () => {
  if (!newHorse.horseName || !newHorse.dirthDate || !newHorse.sex || !newHorse.color) {
    toast.error('Completa los campos obligatorios (Nombre, Fecha, Sexo, Color).');
    return;
  }

  try {
    const horseData = {
      ...newHorse,
      fk_idOwner: Number(newHorse.fk_idOwner),
      fk_idRace: Number(newHorse.fk_idRace),
      fk_idEmployee: Number(newHorse.fk_idEmployee),
      fk_idVaccine: newHorse.fk_idVaccine ? Number(newHorse.fk_idVaccine) : undefined,
      horsePhoto: newHorse.horsePhoto || null, // ✅ enviamos dataURL completo
    };

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(horseData),
    });

    if (!res.ok) throw new Error(await res.text());

    toast.success('¡Caballo creado con éxito!');
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
      horsePhoto: null,
    });
 if (fileInputRef.current) fileInputRef.current.value = '';

    fetchHorses();
  } catch (error: any) {
    console.error('Error creando caballo:', error);
    toast.error(`Error creando caballo: ${error.message}`);
  }
};




  const updateHorse = async (id: number) => {
    
    if (!editingHorseData) return;

    try {
      const res = await fetch(`${API_URL}${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingHorseData),
      });
      if (!res.ok) throw new Error('Error al actualizar el caballo');
      toast.success('¡Caballo actualizado!');
      setEditingId(null);
      setEditingHorseData(null);
      fetchHorses();
    } catch (error) {
      console.error(error);
      toast.error('No se pudo actualizar el caballo.');
    }
  };

  const deleteHorse = async (id: number) => {
    if (!window.confirm('¿Seguro quieres eliminar este caballo?')) return;
    try {
      const res = await fetch(`${API_URL}${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar el caballo');
      toast.success('¡Caballo eliminado!');
      fetchHorses();
    } catch (error) {
      console.error(error);
      toast.error('No se pudo eliminar el caballo.');
    }
  };

  const handleEditClick = (horse: Horse) => {
    setEditingId(horse.idHorse!);
    setEditingHorseData(horse);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingHorseData(null);
  };

  // --- RENDER ---
  return (
    <div className="container mx-auto p-4 text-white font-sans">
      <h1 className="text-3xl font-bold mb-6 text-center">Gestión de Caballos</h1>

      {/* Formulario para agregar */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Agregar Nuevo Caballo</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <input type="text" placeholder="Nombre del caballo" value={newHorse.horseName} onChange={e => setNewHorse({ ...newHorse, horseName: e.target.value })} className="p-2 rounded-md bg-gray-700" />
          <input type="date" value={newHorse.dirthDate} onChange={e => setNewHorse({ ...newHorse, dirthDate: e.target.value })} className="p-2 rounded-md bg-gray-700" />
          <input type="text" placeholder="Sexo" value={newHorse.sex} onChange={e => setNewHorse({ ...newHorse, sex: e.target.value })} className="p-2 rounded-md bg-gray-700" />
          <input type="text" placeholder="Color" value={newHorse.color} onChange={e => setNewHorse({ ...newHorse, color: e.target.value })} className="p-2 rounded-md bg-gray-700" />
          <input type="text" placeholder="Descripción" value={newHorse.generalDescription} onChange={e => setNewHorse({ ...newHorse, generalDescription: e.target.value })} className="p-2 rounded-md bg-gray-700" />
          <select
            name="fk_idOwner"
            value={newHorse.fk_idOwner || ""}
            onChange={e => setNewHorse({ ...newHorse, fk_idOwner: Number(e.target.value) })}
            onClick={fetchOwners}
          >
            <option value="">-- Selecciona un dueño --</option>
            {owners.map((o) => (
              <option key={o.idOwner} value={o.idOwner}>
                {o.name} {o.FirstName}  
              </option>
            ))}
          </select>
          <select
            name="fk_idRace"
            value={newHorse.fk_idRace || ""}
            onChange={e => setNewHorse({ ...newHorse, fk_idRace: Number(e.target.value) })}
            onClick={fetchRaces}
          >
            <option value="">-- Selecciona una raza --</option>
            {races.map((r) => (
              <option key={r.idRace} value={r.idRace}>
                {r.nameRace}
              </option>
            ))}
          </select>
          <select
            name="fk_idEmployee"
            value={newHorse.fk_idEmployee || ""}
            onChange={e => setNewHorse({ ...newHorse, fk_idEmployee: Number(e.target.value) })}
            onClick={fetchEmployees}
          >
            <option value="">-- Selecciona un empleado --</option>
            {employees.map((e) => (
              <option key={e.idEmployee} value={e.idEmployee}>
                {e.name}
              </option>
            ))}
          </select>
          <select
            name="fk_idVaccine"
            value={newHorse.fk_idVaccine || ""}
            onChange={e => setNewHorse({ ...newHorse, fk_idVaccine: Number(e.target.value) })}
            onClick={fetchVaccines}
          >
            <option value="">-- Selecciona una vacuna --</option>
            {vaccines.map((v) => (
              <option key={v.idVaccine} value={v.idVaccine}>
                {v.vaccineName}
              </option>
            ))}
          </select>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={(e) => handlePhotoChange(e, "create")}
            className="p-1.5 rounded-md bg-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
          />

        </div>
        <div className="mt-4 text-right">
          <button onClick={createHorse} className="bg-green-600 hover:bg-green-700 text-white p-2 px-4 rounded-md font-semibold flex items-center gap-2 inline-flex">
            <Plus size={20} /> Agregar
          </button>
        </div>
      </div>

      {/* Lista de caballos */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-md">
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            <Loader size={24} className="animate-spin" />Cargando caballos...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {horses.map(horse => (
              <div key={horse.idHorse} className="bg-gray-700 p-4 rounded-md shadow-lg flex flex-col">
                {editingId === horse.idHorse && editingHorseData ? (
                  <>
                    <div className="flex-grow space-y-2 mb-4">
                      <input type="text" value={editingHorseData.horseName} onChange={e => setEditingHorseData({...editingHorseData, horseName: e.target.value})} className="w-full p-2 rounded-md bg-gray-600"/>
                      <input type="date" value={editingHorseData.dirthDate?.slice(0, 10)} onChange={e => setEditingHorseData({...editingHorseData, dirthDate: e.target.value})} className="w-full p-2 rounded-md bg-gray-600"/>
                      <input type="text" value={editingHorseData.color} onChange={e => setEditingHorseData({...editingHorseData, color: e.target.value})} className="w-full p-2 rounded-md bg-gray-600"/>
                      <textarea value={editingHorseData.generalDescription} onChange={e => setEditingHorseData({...editingHorseData, generalDescription: e.target.value})} className="w-full p-2 rounded-md bg-gray-600" rows={2}></textarea>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={(e) => handlePhotoChange(e, "edit")}
                      className="w-full p-1.5 rounded-md bg-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                    />

                    </div>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => updateHorse(horse.idHorse!)} className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md flex items-center gap-1"><Save size={16} /> Guardar</button>
                      <button onClick={handleCancelEdit} className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded-md flex items-center gap-1"><X size={16} /> Cancelar</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex-grow mb-4">
                     <img src={decodeBackendImage(horse.horsePhoto) || 'https://placehold.co/100x100/4a5568/ffffff?text=Sin+Foto'} alt={`Foto de ${horse.horseName}`} className="w-full h-40 rounded-md object-cover mb-4 bg-gray-600" />
                      <h3 className="text-xl font-bold">{horse.horseName}</h3>
                      <p className="text-sm text-gray-300">Nacimiento: {new Date(horse.dirthDate).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-300">Sexo: {horse.sex}</p>
                      <p className="text-sm text-gray-300">Color: {horse.color}</p>
                      {horse.generalDescription && <p className="mt-2 text-gray-400 text-sm">{horse.generalDescription}</p>}
                    </div>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleEditClick(horse)} className="bg-yellow-600 hover:bg-yellow-700 text-white p-2 rounded-md flex items-center gap-1"><Edit size={16} /> Editar</button>
                      <button onClick={() => deleteHorse(horse.idHorse!)} className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-md flex items-center gap-1"><Trash2 size={16} /> Eliminar</button>
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

function hexToBase64(hexString: string) {
  if (hexString.startsWith("\\x")) {
    hexString = hexString.slice(2);
  }

  const bytes = new Uint8Array(
    hexString.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
  );

  const text = new TextDecoder().decode(bytes);
  return text; 
}

export default HorsesManagement;
