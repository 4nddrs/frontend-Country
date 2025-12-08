import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Save, Trash2, Loader, X, ChevronUp, ChevronDown } from 'lucide-react';

const API_URL = 'http://localhost:8000/employee_absences/';

interface EmployeeAbsence {
  idEmployeeAbsence?: number;
  startDate: string; // ISO date string (YYYY-MM-DD)
  endDate: string;   // ISO date string (YYYY-MM-DD)
  isVacation: boolean;
  absent: boolean;
  observation: string;
  fk_idEmployee: number;
  created_at?: string;
}

const EmployeeAbsencesManagement = () => {
  const [absences, setAbsences] = useState<EmployeeAbsence[]>([]);
  const [newAbsence, setNewAbsence] = useState<EmployeeAbsence>({
    startDate: '',
    endDate: '',
    isVacation: false,
    absent: false,
    observation: '',
    fk_idEmployee: 1,
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  // For employee select
  const [employees, setEmployees] = useState<any[]>([]);
  const fetchEmployees = async () => {
    try {
      const res = await fetch("http://localhost:8000/employees/");
      if (!res.ok) throw new Error("Error al obtener empleados");
      const data = await res.json();
      setEmployees(data);
    } catch {
      toast.error("No se pudieron cargar empleados");
    }
  };

  const fetchAbsences = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al obtener ausencias');
      const data = await res.json();
      setAbsences(data);
    } catch {
      toast.error('No se pudo cargar ausencias.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAbsences();
    fetchEmployees();
  }, []);

  const createAbsence = async () => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAbsence),
      });
      if (!res.ok) throw new Error('Error al crear ausencia');
      toast.success('Ausencia creada!');
      setNewAbsence({
        startDate: '',
        endDate: '',
        isVacation: false,
        absent: false,
        observation: '',
        fk_idEmployee: 1,
      });
      fetchAbsences();
    } catch {
      toast.error('No se pudo crear ausencia.');
    }
  };

  const updateAbsence = async (id: number, updatedAbsence: EmployeeAbsence) => {
    try {
      const res = await fetch(`${API_URL}${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedAbsence),
      });
      if (!res.ok) throw new Error('Error al actualizar ausencia');
      toast.success('Ausencia actualizada!');
      setEditingId(null);
      fetchAbsences();
    } catch {
      toast.error('No se pudo actualizar ausencia.');
    }
  };

  const deleteAbsence = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar ausencia');
      toast.success('Ausencia eliminada!');
      fetchAbsences();
    } catch {
      toast.error('No se pudo eliminar ausencia.');
    }
  };

  return (
    <div  className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
          body {
            font-family: 'Inter', sans-serif;
            background-color: #1a202c;
          }
        `}
      </style>
      <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">Gestión de Ausencias de Empleados</h1>
      
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.5)] text-[#F8F4E3]">
        <h2 className="text-xl font-semibold mb-4 text-teal-400">Agregar Nueva Ausencia</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Fecha de Inicio */}
          <div className="flex flex-col">
            <label className="block text-gray-400 mb-1">Fecha de Inicio</label>
            <input
              type="date"
              name="startDate"
              value={newAbsence.startDate}
              onChange={e => setNewAbsence({ ...newAbsence, startDate: e.target.value })}
              className="w-full p-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>
          {/* Fecha de Fin */}
          <div className="flex flex-col">
            <label className="block text-gray-400 mb-1">Fecha de Fin</label>
            <input
              type="date"
              name="endDate"
              value={newAbsence.endDate}
              onChange={e => setNewAbsence({ ...newAbsence, endDate: e.target.value })}
              className="w-full p-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>
          {/* Tipo de Ausencia */}
          <div className="flex flex-col">
            <label className="block text-gray-400 mb-1">Tipo de Ausencia</label>
            <div className="flex gap-4 p-2 rounded-md bg-gray-700 border border-gray-600 items-center">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newAbsence.isVacation}
                  onChange={e => setNewAbsence({ ...newAbsence, isVacation: e.target.checked, absent: !e.target.checked })}
                  className="rounded text-blue-500 bg-gray-600 border-gray-500 focus:ring-blue-500"
                />
                Vacaciones
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newAbsence.absent}
                  onChange={e => setNewAbsence({ ...newAbsence, absent: e.target.checked, isVacation: !e.target.checked })}
                  className="rounded text-blue-500 bg-gray-600 border-gray-500 focus:ring-blue-500"
                />
                Ausente
              </label>
            </div>
          </div>
          {/* Observación */}
          <div className="flex flex-col">
            <label className="block text-gray-400 mb-1">Observación</label>
            <input
              type="text"
              name="observation"
              placeholder="Observación"
              value={newAbsence.observation}
              onChange={e => setNewAbsence({ ...newAbsence, observation: e.target.value })}
              className="w-full p-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>
          {/* Empleado */}
          <div className="flex flex-col">
            <label className="block text-gray-400 mb-1">Empleado</label>
            <select
              name="fk_idEmployee"
              value={newAbsence.fk_idEmployee}
              onChange={e => setNewAbsence({ ...newAbsence, fk_idEmployee: Number(e.target.value) })}
              className="w-full p-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="">-- Selecciona empleado --</option>
              {employees.map(emp => (
                <option key={emp.idEmployee} value={emp.idEmployee}>
                  {emp.fullName}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-6 text-right">
          <button onClick={createAbsence} className="bg-green-600 hover:bg-green-700 text-white p-2 px-4 rounded-md font-semibold flex items-center gap-2 inline-flex transition-colors duration-200">
            <Plus size={20} /> Agregar
          </button>
        </div>
      </div>
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.5)] text-[#F8F4E3]">
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            <Loader size={24} className="animate-spin" /> Cargando ausencias...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {absences.map(abs => {
              const isExpanded = expanded[abs.idEmployeeAbsence ?? 0] ?? false;
              return (
              <div
                key={abs.idEmployeeAbsence}
                className="rounded-2xl border border-slate-800/60 bg-gradient-to-br from-sky-500/10 via-slate-900/60 to-slate-900/90 shadow-lg shadow-black/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-sky-500/20"
              >
                {editingId === abs.idEmployeeAbsence ? (
                  <div className="flex flex-col gap-2">
                    <label className="block text-sm font-medium mb-1 text-gray-400">Fecha de Inicio</label>
                    <input
                      type="date"
                      defaultValue={abs.startDate?.slice(0, 10)}
                      onChange={e => setNewAbsence({ ...newAbsence, startDate: e.target.value })}
                      className="p-2 rounded-md bg-gray-600 text-white border border-gray-500 focus:border-blue-500 focus:outline-none"
                    />
                    <label className="block text-sm font-medium mb-1 mt-2 text-gray-400">Fecha de Fin</label>
                    <input
                      type="date"
                      defaultValue={abs.endDate?.slice(0, 10)}
                      onChange={e => setNewAbsence({ ...newAbsence, endDate: e.target.value })}
                      className="p-2 rounded-md bg-gray-600 text-white border border-gray-500 focus:border-blue-500 focus:outline-none"
                    />
                    <label className="block text-sm font-medium mb-1 mt-2 text-gray-400">Tipo de Ausencia</label>
                    <div className="flex gap-4 p-2 rounded-md bg-gray-600 border border-gray-500 items-center">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newAbsence.isVacation}
                          onChange={e => setNewAbsence({ ...newAbsence, isVacation: e.target.checked, absent: !e.target.checked })}
                          className="rounded text-blue-500 bg-gray-500 border-gray-400 focus:ring-blue-500"
                        />
                        Vacaciones
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newAbsence.absent}
                          onChange={e => setNewAbsence({ ...newAbsence, absent: e.target.checked, isVacation: !e.target.checked })}
                          className="rounded text-blue-500 bg-gray-500 border-gray-400 focus:ring-blue-500"
                        />
                        Ausente
                      </label>
                    </div>
                    <label className="block text-sm font-medium mb-1 mt-2 text-gray-400">Observación</label>
                    <input
                      type="text"
                      defaultValue={abs.observation}
                      onChange={e => setNewAbsence({ ...newAbsence, observation: e.target.value })}
                      className="p-2 rounded-md bg-gray-600 text-white border border-gray-500 focus:border-blue-500 focus:outline-none"
                    />
                    <label className="block text-sm font-medium mb-1 mt-2 text-gray-400">Empleado</label>
                    <select
                      value={newAbsence.fk_idEmployee}
                      onChange={e => setNewAbsence({ ...newAbsence, fk_idEmployee: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white border border-gray-500 focus:border-blue-500 focus:outline-none"
                    >
                      {employees.map(emp => (
                        <option key={emp.idEmployee} value={emp.idEmployee}>
                          {emp.fullName}
                        </option>
                      ))}
                    </select>
                    <div className="flex justify-end gap-2 mt-4">
                      <button
                        onClick={() => updateAbsence(abs.idEmployeeAbsence!, {
                          startDate: newAbsence.startDate || abs.startDate,
                          endDate: newAbsence.endDate || abs.endDate,
                          isVacation: newAbsence.isVacation,
                          absent: newAbsence.absent,
                          observation: newAbsence.observation || abs.observation,
                          fk_idEmployee: newAbsence.fk_idEmployee || abs.fk_idEmployee,
                        })}
                        className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md flex items-center gap-1 transition-colors duration-200"
                      >
                        <Save size={16} /> Guardar
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded-md flex items-center gap-1 transition-colors duration-200"
                      >
                        <X size={16} /> Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col items-center gap-2 py-5">
                      <span className="h-4 w-4 rounded-full bg-sky-500 shadow-[0_0_12px_rgba(14,165,233,0.6)]" />
                      <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
                        Ausencia
                      </span>
                    </div>

                    <div className="px-6 pb-6 space-y-4 text-sm text-slate-200">
                      <div className="text-center space-y-1">
                        <h3 className="text-lg font-semibold text-sky-300">{employees.find(emp => emp.idEmployee === abs.fk_idEmployee)?.fullName || 'Empleado'}</h3>
                        <p className="text-slate-400">
                          Desde: <span className="font-medium text-slate-200">{abs.startDate?.slice(0, 10)}</span>
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          setExpanded((prev) => ({
                            ...prev,
                            [abs.idEmployeeAbsence ?? 0]: !prev[abs.idEmployeeAbsence ?? 0],
                          }))
                        }
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-sky-500/40 bg-sky-500/10 py-2 text-sm font-medium text-sky-300 transition hover:bg-sky-500/15"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp size={16} /> Ver menos
                          </>
                        ) : (
                          <>
                            <ChevronDown size={16} /> Ver más
                          </>
                        )}
                      </button>

                      {isExpanded && (
                        <div className="rounded-xl border border-slate-800/80 bg-slate-900/70 p-4 text-xs leading-relaxed">
                          <ul className="space-y-1">
                            <li><strong>Hasta:</strong> {abs.endDate?.slice(0, 10)}</li>
                            <li><strong>Vacaciones:</strong> {abs.isVacation ? 'Sí' : 'No'}</li>
                            <li><strong>Ausente:</strong> {abs.absent ? 'Sí' : 'No'}</li>
                            <li><strong>Observación:</strong> {abs.observation}</li>
                          </ul>
                        </div>
                      )}

                      <div className="flex items-center justify-center gap-6 border-t border-slate-800 pt-6 pb-2">
                        <button
                          onClick={() => { setEditingId(abs.idEmployeeAbsence!); setNewAbsence(abs); }}
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
                          onClick={() => deleteAbsence(abs.idEmployeeAbsence!)}
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeAbsencesManagement;
