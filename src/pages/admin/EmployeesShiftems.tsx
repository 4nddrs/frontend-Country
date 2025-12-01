import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Save, Trash2, Loader, X } from 'lucide-react';

const API_URL = 'http://82.25.66.67:8000/employees_shiftems/';

interface EmployeesShiftem {
  idEmployeesShiftem?: number;
  fk_idEmployee?: number;
  fk_idShiftEmployees?: number;
  created_at?: string;
}

const EmployeesShiftemManagement = () => {
  const [emps, setEmps] = useState<EmployeesShiftem[]>([]);
  const [newEmp, setNewEmp] = useState<EmployeesShiftem>({
    fk_idEmployee: undefined,
    fk_idShiftEmployees: undefined,
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // For selects
  const [employees, setEmployees] = useState<any[]>([]);
  const [shiftEmployees, setShiftEmployees] = useState<any[]>([]);
  const [shiftTypes, setShiftTypes] = useState<any[]>([]);

  const fetchEmployees = async () => {
    try {
      const res = await fetch("http://82.25.66.67:8000/employees/");
      if (!res.ok) throw new Error("Error al obtener empleados");
      const data = await res.json();
      setEmployees(data);
    } catch {
      toast.error("No se pudieron cargar empleados");
    }
  };

  const fetchShiftEmployees = async () => {
    try {
      const res = await fetch("http://82.25.66.67:8000/shift_employeds/");
      if (!res.ok) throw new Error("Error al obtener turnos empleados");
      const data = await res.json();
      setShiftEmployees(data);
    } catch {
      toast.error("No se pudieron cargar turnos empleados");
    }
  };

  const fetchShiftTypes = async () => {
    try {
      const res = await fetch("http://82.25.66.67:8000/shift_types/");
      if (!res.ok) throw new Error("Error al obtener tipos de turno");
      const data = await res.json();
      setShiftTypes(data);
    } catch {
      toast.error("No se pudieron cargar los tipos de turno");
    }
  };

  const fetchEmps = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al obtener relaciones empleados-turnos');
      const data = await res.json();
      setEmps(data);
    } catch {
      toast.error('No se pudo cargar relaciones empleados-turnos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmps();
    fetchEmployees();
    fetchShiftEmployees();
    fetchShiftTypes();
  }, []);

  const getShiftTypeName = (shiftTypeId?: number) => {
    if (!shiftTypeId) return "";
    return shiftTypes.find((type) => type.idShiftType === shiftTypeId)?.shiftName ?? `Turno #${shiftTypeId}`;
  };

  const formatShiftOption = (shiftEmployee: any) => {
    const shiftName = getShiftTypeName(shiftEmployee.fk_idShiftType);
    const start = shiftEmployee.startDateTime?.replace('T', ' ').slice(0, 16) ?? '';
    const end = shiftEmployee.endDateTime?.replace('T', ' ').slice(0, 16) ?? '';
    if (!start && !end) {
      return `Tipo de turno: ${shiftName}`;
    }
    return `Tipo de turno: ${shiftName} (${start} - ${end})`;
  };

  const createEmp = async () => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEmp),
      });
      if (!res.ok) throw new Error('Error al crear relación');
      toast.success('Relación creada!');
      setNewEmp({
        fk_idEmployee: undefined,
        fk_idShiftEmployees: undefined,
      });
      fetchEmps();
    } catch {
      toast.error('No se pudo crear relación.');
    }
  };

  const updateEmp = async (id: number, updatedEmp: EmployeesShiftem) => {
    try {
      const res = await fetch(`${API_URL}${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedEmp),
      });
      if (!res.ok) throw new Error('Error al actualizar relación');
      toast.success('Relación actualizada!');
      setEditingId(null);
      fetchEmps();
    } catch {
      toast.error('No se pudo actualizar relación.');
    }
  };

  const deleteEmp = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar relación');
      toast.success('Relación eliminada!');
      fetchEmps();
    } catch {
      toast.error('No se pudo eliminar relación.');
    }
  };

  return (
    <div  className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
      <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">Gestión de Empleados-Turnos</h1>
      
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.5)] text-[#F8F4E3]">
        <h2 className="text-xl font-semibold mb-4 text-teal-400">Agregar Nueva Relación</h2>
        <div className="flex gap-4 flex-wrap">
          <select
            name="fk_idEmployee"
            value={newEmp.fk_idEmployee || ""}
            onChange={e => setNewEmp({ ...newEmp, fk_idEmployee: e.target.value ? Number(e.target.value) : undefined })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white"
          >
            <option value="">-- Selecciona empleado --</option>
            {employees.map(emp => (
              <option key={emp.idEmployee} value={emp.idEmployee}>
                {emp.fullName}
              </option>
            ))}
          </select>
          <select
            name="fk_idShiftEmployees"
            value={newEmp.fk_idShiftEmployees || ""}
            onChange={e => setNewEmp({ ...newEmp, fk_idShiftEmployees: e.target.value ? Number(e.target.value) : undefined })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white"
          >
            <option value="">-- Selecciona turno empleado --</option>
            {shiftEmployees.map(se => (
              <option key={se.idShiftEmployed} value={se.idShiftEmployed}>
                {formatShiftOption(se)}
              </option>
            ))}
          </select>
          <button onClick={createEmp} className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-md font-semibold flex items-center gap-2">
            <Plus size={20} /> Agregar
          </button>
        </div>
      </div>
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.5)] text-[#F8F4E3]">
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            <Loader size={24} className="animate-spin" />Cargando relaciones...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {emps.map(emp => (
              <div key={emp.idEmployeesShiftem} className="bg-gray-700 p-4 rounded-md shadow-lg flex flex-col justify-between">
                {editingId === emp.idEmployeesShiftem ? (
                  <>
                    <select
                      value={newEmp.fk_idEmployee || ""}
                      onChange={e => setNewEmp({ ...newEmp, fk_idEmployee: e.target.value ? Number(e.target.value) : undefined })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    >
                      {employees.map(emp2 => (
                        <option key={emp2.idEmployee} value={emp2.idEmployee}>
                          {emp2.fullName}
                        </option>
                      ))}
                    </select>
                    <select
                      value={newEmp.fk_idShiftEmployees || ""}
                      onChange={e => setNewEmp({ ...newEmp, fk_idShiftEmployees: e.target.value ? Number(e.target.value) : undefined })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    >
                      {shiftEmployees.map(se => (
                        <option key={se.idShiftEmployed} value={se.idShiftEmployed}>
                          {formatShiftOption(se)}
                        </option>
                      ))}
                    </select>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => updateEmp(emp.idEmployeesShiftem!, {
                          fk_idEmployee: newEmp.fk_idEmployee ?? emp.fk_idEmployee,
                          fk_idShiftEmployees: newEmp.fk_idShiftEmployees ?? emp.fk_idShiftEmployees,
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
                    <h3 className="text-lg font-semibold">Empleado: {employees.find(em => em.idEmployee === emp.fk_idEmployee)?.fullName || emp.fk_idEmployee}</h3>
                    <p>
                      Turno empleado:&nbsp;
                      {(() => {
                        const shiftAssigned = shiftEmployees.find(se => se.idShiftEmployed === emp.fk_idShiftEmployees);
                        return shiftAssigned ? formatShiftOption(shiftAssigned) : `Turno #${emp.fk_idShiftEmployees}`;
                      })()}
                    </p>
                    <div className="flex items-center justify-end gap-4 mt-4">
                      <button
                        onClick={() => { setEditingId(emp.idEmployeesShiftem!); setNewEmp(emp); }}
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
                        onClick={() => deleteEmp(emp.idEmployeesShiftem!)}
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

export default EmployeesShiftemManagement;
