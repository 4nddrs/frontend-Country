import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Edit, Save, Trash2, Loader, X } from 'lucide-react';
import { AddButton, AdminSection } from '../../components/ui/admin-buttons';
import { confirmDialog } from '../../utils/confirmDialog';

const API_URL = 'http://localhost:8000/shift_employeds/';

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
      const res = await fetch("http://localhost:8000/shift_types/");
      if (!res.ok) throw new Error("Error al obtener tipos de turno");
      const data = await res.json();
      setShiftTypes(data);
    } catch {
      // Silenciar error de carga
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
    const confirmed = await confirmDialog({
      title: '¿Eliminar turno?',
      description: 'Esta acción eliminará el turno permanentemente.',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
    });
    if (!confirmed) return;
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
    <div  className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
      <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">Gestión de Turnos de Empleados</h1>
      
      <AdminSection>
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
            className="select-field flex-1 placeholder-gray-400"
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
            className="select-field flex-1 placeholder-gray-400"
          />
          </div>
          <div>
          <label htmlFor="fk_idShiftType" className="block mb-1">Tipo de Turno</label>
          <select
            name="fk_idShiftType"
            value={newShift.fk_idShiftType}
            onChange={e => setNewShift({ ...newShift, fk_idShiftType: Number(e.target.value) })}
            className="select-field flex-1"
          >
            <option value="">-- Selecciona tipo de turno --</option>
            {shiftTypes.map(type => (
              <option key={type.idShiftType} value={type.idShiftType}>
                {type.shiftName}
              </option>
            ))}
          </select>
          </div>
          <AddButton onClick={createShift} />
        </div>
      </AdminSection>
      <AdminSection>
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            <Loader size={24} className="animate-spin" />Cargando turnos...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shifts.map(shift => (
              <div key={shift.idShiftEmployed} className="rounded-2xl border border-slate-800/60 bg-gradient-to-br from-slate-500/10 via-slate-900/60 to-slate-900/90 shadow-lg shadow-black/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-slate-500/20">
                {editingId === shift.idShiftEmployed ? (
                  <>
                  <div>
                    <label className="block mb-1">Inicio</label>
                    <input
                      type="datetime-local"
                      defaultValue={shift.startDateTime?.slice(0, 16)}
                      onChange={e => setNewShift({ ...newShift, startDateTime: e.target.value })}
                      className="select-field mb-2"
                    />
                    </div>
                    <div>
                      <label className="block mb-1">Fin</label>
                      <input
                        type="datetime-local"
                        defaultValue={shift.endDateTime?.slice(0, 16)}
                        onChange={e => setNewShift({ ...newShift, endDateTime: e.target.value })}
                        className="select-field mb-2"
                      />
                    </div>
                    <div>
                      <label className="block mb-1">Fin</label>
                      <input
                        type="datetime-local"
                        defaultValue={shift.endDateTime?.slice(0, 16)}
                        onChange={e => setNewShift({ ...newShift, endDateTime: e.target.value })}
                        className="select-field px-4 py-2 rounded-md border border-gray-600 focus:border-blue-500 focus:outline-none w-full mb-2"
                      />
                    </div>
                    <div>
                      <label className="block mb-1">Tipo de Turno</label>
                      <select
                        value={newShift.fk_idShiftType}
                        onChange={e => setNewShift({ ...newShift, fk_idShiftType: Number(e.target.value) })}
                        className="select-field px-4 py-2 rounded-md border border-gray-600 focus:border-blue-500 focus:outline-none w-full mb-2"
                      >
                      {shiftTypes.map(type => (
                        <option key={type.idShiftType} value={type.idShiftType}>
                          {type.shiftName}
                        </option>
                      ))}
                    </select>
                    </div>
                    <div className="flex justify-center gap-3 px-6 pb-4 mt-2">
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
                        className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-md flex items-center gap-1"
                      >
                        <X size={16} /> Cancelar
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col items-center gap-2 py-5">
                      <span className="h-4 w-4 rounded-full bg-slate-500 shadow-[0_0_12px_rgba(148,163,184,0.6)]" />
                      <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
                        Turno
                      </span>
                    </div>

                    <div className="px-6 pb-6 space-y-4 text-sm text-slate-200">
                      <div className="text-center space-y-1">
                        <h3 className="text-lg font-semibold text-slate-300">{shiftTypes.find(type => type.idShiftType === shift.fk_idShiftType)?.shiftName || shift.fk_idShiftType}</h3>
                      </div>

                      <div className="space-y-2 text-center">
                        <p><span className="font-medium text-slate-400">Inicio:</span> {shift.startDateTime?.replace('T', ' ').slice(0, 16)}</p>
                        <p><span className="font-medium text-slate-400">Fin:</span> {shift.endDateTime?.replace('T', ' ').slice(0, 16)}</p>
                      </div>

                      <div className="flex items-center justify-center gap-6 border-t border-slate-800 pt-6 pb-2">
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
                  </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </AdminSection>
    </div>
  );
};

export default ShiftEmployedsManagement;




