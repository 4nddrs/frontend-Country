import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Save, Trash2, Loader, X } from 'lucide-react';

const API_URL = 'https://backend-country-nnxe.onrender.com/shift_employeds/';

interface ShiftEmployed {
  idShiftEmployed?: number;
  startDateTime: string; 
  endDateTime: string;   
  fk_idShiftType: number;
  created_at?: string;
}

const ShiftEmployedsManagement = () => {
  const [shifts, setShifts] = useState<ShiftEmployed[]>([]);
  const [newShift, setNewShift] = useState<ShiftEmployed>({
    startDateTime: '',
    endDateTime: '',
    fk_idShiftType: 1,
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // For shift type select
  const [shiftTypes, setShiftTypes] = useState<any[]>([]);
  const fetchShiftTypes = async () => {
    try {
      const res = await fetch("https://backend-country-nnxe.onrender.com/shift_types/");
      if (!res.ok) throw new Error("Error al obtener tipos de turno");
      const data = await res.json();
      setShiftTypes(data);
    } catch {
      toast.error("No se pudieron cargar tipos de turno");
    }
  };

  const fetchShifts = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al obtener turnos empleados');
      const data = await res.json();
      setShifts(data);
    } catch {
      toast.error('No se pudo cargar turnos empleados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
    fetchShiftTypes();
  }, []);

  const createShift = async () => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newShift),
      });
      if (!res.ok) throw new Error('Error al crear turno');
      toast.success('Turno creado!');
      setNewShift({
        startDateTime: '',
        endDateTime: '',
        fk_idShiftType: 1,
      });
      fetchShifts();
    } catch {
      toast.error('No se pudo crear turno.');
    }
  };

  const updateShift = async (id: number, updatedShift: ShiftEmployed) => {
    try {
      const res = await fetch(`${API_URL}${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedShift),
      });
      if (!res.ok) throw new Error('Error al actualizar turno');
      toast.success('Turno actualizado!');
      setEditingId(null);
      fetchShifts();
    } catch {
      toast.error('No se pudo actualizar turno.');
    }
  };

  const deleteShift = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar turno');
      toast.success('Turno eliminado!');
      fetchShifts();
    } catch {
      toast.error('No se pudo eliminar turno.');
    }
  };

  return (
    <div className="bg-slate-900 p-6 rounded-lg shadow-xl mb-8 border border-slate-700">
      
      <div className="flex items-center justify-center h-[10vh]">
        <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]
               filter drop-shadow-[0_0_10px_rgba(222,179,98,0.75)]
               drop-shadow-[0_0_26px_rgba(222,179,98,0.45)]
               drop-shadow-[0_0_30px_rgba(255,243,211,0.28)]">
          <span className="title-letter">G</span>
          <span className="title-letter">e</span>
          <span className="title-letter">s</span>
          <span className="title-letter">t</span>
          <span className="title-letter">i</span>
          <span className="title-letter">ó</span>
          <span className="title-letter">n</span>
          <span className="title-letter">&nbsp;</span>
          <span className="title-letter">d</span>
          <span className="title-letter">e</span>
          <span className="title-letter">&nbsp;</span>
          <span className="title-letter">T</span>
          <span className="title-letter">u</span>
          <span className="title-letter">r</span>
          <span className="title-letter">n</span>
          <span className="title-letter">o</span>
          <span className="title-letter">s</span>
          <span className="title-letter">&nbsp;</span>
          <span className="title-letter">d</span>
          <span className="title-letter">e</span>
          <span className="title-letter">&nbsp;</span>
          <span className="title-letter">E</span>
          <span className="title-letter">m</span>
          <span className="title-letter">p</span>
          <span className="title-letter">l</span>
          <span className="title-letter">e</span>
          <span className="title-letter">a</span>
          <span className="title-letter">d</span>
          <span className="title-letter">o</span>
          <span className="title-letter">s</span>
        </h1>
      </div>
      <div className="bg-slate-800 p-6 rounded-lg shadow-xl mb-8 border border-slate-700">
        <h2 className="text-xl font-semibold mb-4 text-teal-400">Agregar Nuevo Turno</h2>
        <div className="flex gap-4 flex-wrap">
          <div>
          <label htmlFor="startDateTime" className="block mb-1">Inicio</label>
          <input
            type="datetime-local"
            name="startDateTime"
            placeholder="Inicio"
            value={newShift.startDateTime}
            onChange={e => setNewShift({ ...newShift, startDateTime: e.target.value })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          </div>
          <div>
          <label htmlFor="endDateTime" className="block mb-1">Fin</label>
          <input
            type="datetime-local"
            name="endDateTime"
            placeholder="Fin"
            value={newShift.endDateTime}
            onChange={e => setNewShift({ ...newShift, endDateTime: e.target.value })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          </div>
          <div>
          <label htmlFor="fk_idShiftType" className="block mb-1">Tipo de Turno</label>
          <select
            name="fk_idShiftType"
            value={newShift.fk_idShiftType}
            onChange={e => setNewShift({ ...newShift, fk_idShiftType: Number(e.target.value) })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white"
          >
            <option value="">-- Selecciona tipo de turno --</option>
            {shiftTypes.map(type => (
              <option key={type.idShiftType} value={type.idShiftType}>
                {type.shiftName}
              </option>
            ))}
          </select>
          </div>
          <button onClick={createShift} className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-md font-semibold flex items-center gap-2">
            <Plus size={20} /> Agregar
          </button>
        </div>
      </div>
      <div className="bg-slate-800 p-6 rounded-lg shadow-xl mb-8 border border-slate-700">
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            <Loader size={24} className="animate-spin" />Cargando turnos...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shifts.map(shift => (
              <div key={shift.idShiftEmployed} className="bg-gray-700 p-4 rounded-md shadow-lg flex flex-col justify-between">
                {editingId === shift.idShiftEmployed ? (
                  <>
                  <div>
                    <label className="block mb-1">Inicio</label>
                    <input
                      type="datetime-local"
                      defaultValue={shift.startDateTime?.slice(0, 16)}
                      onChange={e => setNewShift({ ...newShift, startDateTime: e.target.value })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    </div>
                    <div>
                      <label className="block mb-1">Fin</label>
                      <input
                        type="datetime-local"
                        defaultValue={shift.endDateTime?.slice(0, 16)}
                        onChange={e => setNewShift({ ...newShift, endDateTime: e.target.value })}
                        className="p-2 rounded-md bg-gray-600 text-white mb-2"
                      />
                    </div>
                    <div>
                      <label className="block mb-1">Fin</label>
                      <input
                        type="datetime-local"
                        defaultValue={shift.endDateTime?.slice(0, 16)}
                        onChange={e => setNewShift({ ...newShift, endDateTime: e.target.value })}
                        className="p-2 rounded-md bg-gray-600 text-white mb-2"
                      />
                    </div>
                    <div>
                      <label className="block mb-1">Tipo de Turno</label>
                      <select
                        value={newShift.fk_idShiftType}
                        onChange={e => setNewShift({ ...newShift, fk_idShiftType: Number(e.target.value) })}
                        className="p-2 rounded-md bg-gray-600 text-white mb-2"
                      >
                      {shiftTypes.map(type => (
                        <option key={type.idShiftType} value={type.idShiftType}>
                          {type.shiftName}
                        </option>
                      ))}
                    </select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => updateShift(shift.idShiftEmployed!, {
                          startDateTime: newShift.startDateTime || shift.startDateTime,
                          endDateTime: newShift.endDateTime || shift.endDateTime,
                          fk_idShiftType: newShift.fk_idShiftType || shift.fk_idShiftType,
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
                    <h3 className="text-lg font-semibold">Tipo de turno: {shiftTypes.find(type => type.idShiftType === shift.fk_idShiftType)?.shiftName || shift.fk_idShiftType}</h3>
                    <p>Inicio: {shift.startDateTime?.replace('T', ' ').slice(0, 16)}</p>
                    <p>Fin: {shift.endDateTime?.replace('T', ' ').slice(0, 16)}</p>
                    <div className="flex items-center justify-end gap-4">
                      <button
                        onClick={() => { setEditingId(shift.idShiftEmployed!); setNewShift(shift); }}
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
                        onClick={() => deleteShift(shift.idShiftEmployed!)}
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

export default ShiftEmployedsManagement;