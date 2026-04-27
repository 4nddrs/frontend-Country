import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import { Edit, Trash2, Loader } from 'lucide-react';
import { AddButton, AdminSection, SaveButton, CancelButton } from '../../components/ui/admin-buttons';
import { confirmDialog } from '../../utils/confirmDialog';

const API_URL = 'http://localhost:8000/employees_shiftems/';

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
  const [editingData, setEditingData] = useState<EmployeesShiftem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [employees, setEmployees] = useState<any[]>([]);
  const [shiftEmployees, setShiftEmployees] = useState<any[]>([]);
  const [shiftTypes, setShiftTypes] = useState<any[]>([]);

  const isEditModalOpen = editingId !== null && editingData !== null;

  useEffect(() => {
    if (!isEditModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') handleCancelEdit(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isEditModalOpen]);

  const fetchEmployees = async () => {
    try {
      const res = await fetch("http://localhost:8000/employees/");
      if (!res.ok) throw new Error("Error al obtener empleados");
      const data = await res.json();
      setEmployees(data);
    } catch {
      // Silenciar error de carga
    }
  };

  const fetchShiftEmployees = async () => {
    try {
      const res = await fetch("http://localhost:8000/shift_employeds/");
      if (!res.ok) throw new Error("Error al obtener turnos empleados");
      const data = await res.json();
      setShiftEmployees(data);
    } catch {
      // Silenciar error de carga
    }
  };

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

  const fetchEmps = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al obtener relaciones empleados-turnos');
      const data = await res.json();
      setEmps([...data].sort((a: EmployeesShiftem, b: EmployeesShiftem) => (b.idEmployeesShiftem ?? 0) - (a.idEmployeesShiftem ?? 0)));
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
      setNewEmp({ fk_idEmployee: undefined, fk_idShiftEmployees: undefined });
      fetchEmps();
    } catch {
      toast.error('No se pudo crear relación.');
    }
  };

  const updateEmp = async (id: number) => {
    if (!editingData) return;
    try {
      const res = await fetch(`${API_URL}${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingData),
      });
      if (!res.ok) throw new Error('Error al actualizar relación');
      toast.success('Relación actualizada!');
      setEditingId(null);
      setEditingData(null);
      fetchEmps();
    } catch {
      toast.error('No se pudo actualizar relación.');
    }
  };

  const deleteEmp = async (id: number) => {
    const confirmed = await confirmDialog({
      title: '¿Eliminar relación?',
      description: 'Esta acción eliminará la relación entre empleado y turno.',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
    });
    if (!confirmed) return;
    try {
      const res = await fetch(`${API_URL}${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar relación');
      toast.success('Relación eliminada!');
      fetchEmps();
    } catch {
      toast.error('No se pudo eliminar relación.');
    }
  };

  const handleEditClick = (emp: EmployeesShiftem) => {
    setEditingId(emp.idEmployeesShiftem!);
    setEditingData({ ...emp });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingData(null);
  };

  return (
    <div className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
      <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">Gestión de Empleados-Turnos</h1>

      <AdminSection>
        <h2 className="text-xl font-semibold mb-4 text-teal-400">Agregar asignación de Turno a un Empleado</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 text-sm text-slate-300">Empleado</label>
            <select
              name="fk_idEmployee"
              value={newEmp.fk_idEmployee || ""}
              onChange={e => setNewEmp({ ...newEmp, fk_idEmployee: e.target.value ? Number(e.target.value) : undefined })}
              className="select-field w-full"
            >
              <option value="">-- Selecciona empleado --</option>
              {employees.map(emp => (
                <option key={emp.idEmployee} value={emp.idEmployee}>{emp.fullName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 text-sm text-slate-300">Turno asignado</label>
            <select
              name="fk_idShiftEmployees"
              value={newEmp.fk_idShiftEmployees || ""}
              onChange={e => setNewEmp({ ...newEmp, fk_idShiftEmployees: e.target.value ? Number(e.target.value) : undefined })}
              className="select-field w-full"
            >
              <option value="">-- Selecciona turno --</option>
              {shiftEmployees.map(se => (
                <option key={se.idShiftEmployed} value={se.idShiftEmployed}>{formatShiftOption(se)}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <AddButton onClick={createEmp} />
        </div>
      </AdminSection>

      <AdminSection>
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            <Loader size={24} className="animate-spin" />Cargando relaciones...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {emps.map(emp => (
              <div
                key={emp.idEmployeesShiftem}
                className="rounded-2xl border border-slate-800/60 bg-gradient-to-br from-fuchsia-500/10 via-slate-900/60 to-slate-900/90 shadow-lg shadow-black/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-fuchsia-500/20"
              >
                <div className="flex flex-col items-center gap-2 py-5">
                  <span className="h-4 w-4 rounded-full bg-fuchsia-500 shadow-[0_0_12px_rgba(217,70,239,0.6)]" />
                  <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Asignación</span>
                </div>

                <div className="px-6 pb-6 space-y-4 text-sm text-slate-200">
                  <div className="text-center space-y-1">
                    <h3 className="text-lg font-semibold text-fuchsia-300">{employees.find(em => em.idEmployee === emp.fk_idEmployee)?.fullName || 'Empleado'}</h3>
                  </div>

                  <div className="rounded-xl border border-slate-800/80 bg-slate-900/70 p-4 text-xs leading-relaxed">
                    <ul className="space-y-1">
                      <li><strong>Turno:</strong> {(() => {
                        const shiftAssigned = shiftEmployees.find(se => se.idShiftEmployed === emp.fk_idShiftEmployees);
                        return shiftAssigned ? formatShiftOption(shiftAssigned) : `Turno #${emp.fk_idShiftEmployees}`;
                      })()}</li>
                    </ul>
                  </div>

                  <div className="flex items-center justify-center gap-6 border-t border-slate-800 pt-6 pb-2">
                    <button
                      onClick={() => handleEditClick(emp)}
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
                </div>
              </div>
            ))}
          </div>
        )}

        {isEditModalOpen && createPortal(
          <div
            className="fixed inset-0 lg:left-80 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={handleCancelEdit}
          >
            <div
              className="w-full max-w-lg max-h-[95vh] overflow-y-auto rounded-2xl border border-[#167C79]/60 bg-[#0f172a] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.6)]"
              onClick={e => e.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-[#F8F4E3]">Editar Relación Empleado-Turno</h3>
                  <p className="text-sm text-slate-400">Actualiza los datos.</p>
                </div>
                <button onClick={handleCancelEdit} className="rounded-lg border border-slate-500 px-3 py-1.5 text-slate-300 hover:bg-slate-800">
                  Cerrar
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block mb-1 text-sm font-medium">Empleado</label>
                  <select
                    value={editingData!.fk_idEmployee || ""}
                    onChange={e => setEditingData({ ...editingData!, fk_idEmployee: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full p-2 rounded-md bg-gray-700"
                  >
                    <option value="">-- Selecciona empleado --</option>
                    {employees.map(emp => (
                      <option key={emp.idEmployee} value={emp.idEmployee}>{emp.fullName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Turno</label>
                  <select
                    value={editingData!.fk_idShiftEmployees || ""}
                    onChange={e => setEditingData({ ...editingData!, fk_idShiftEmployees: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full p-2 rounded-md bg-gray-700"
                  >
                    <option value="">-- Selecciona turno empleado --</option>
                    {shiftEmployees.map(se => (
                      <option key={se.idShiftEmployed} value={se.idShiftEmployed}>{formatShiftOption(se)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-700 pt-4">
                <CancelButton onClick={handleCancelEdit} />
                <SaveButton onClick={() => updateEmp(editingId!)} children="Guardar cambios" />
              </div>
            </div>
          </div>,
          document.body
        )}
      </AdminSection>
    </div>
  );
};

export default EmployeesShiftemManagement;
