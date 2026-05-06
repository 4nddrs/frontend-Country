import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import { Edit, Trash2, Loader, ChevronUp, ChevronDown } from 'lucide-react';
import { AddButton, AdminSection, SaveButton, CancelButton } from '../../components/ui/admin-buttons';
import { confirmDialog } from '../../utils/confirmDialog';
import { isDateNotPast, isEndDateAfterStart, validateMaxLength } from '../../utils/validation';

const API_URL = 'https://api.countryclub.doc-ia.cloud/employee_absences/';

interface EmployeeAbsence {
  idEmployeeAbsence?: number;
  startDate: string;
  endDate: string;
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
  const [editingData, setEditingData] = useState<EmployeeAbsence | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const [employees, setEmployees] = useState<any[]>([]);

  const isEditModalOpen = editingId !== null && editingData !== null;

  useEffect(() => {
    if (!isEditModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') handleCancelEdit(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isEditModalOpen]);

  const fetchEmployees = async () => {
    try {
      const res = await fetch("https://api.countryclub.doc-ia.cloud/employees/");
      if (!res.ok) throw new Error("Error al obtener empleados");
      const data = await res.json();
      setEmployees(data);
    } catch {
      // Silenciar error de carga
    }
  };

  const fetchAbsences = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al obtener ausencias');
      const data = await res.json();
      const sorted = [...data].sort(
        (a: EmployeeAbsence, b: EmployeeAbsence) =>
          (b.idEmployeeAbsence ?? 0) - (a.idEmployeeAbsence ?? 0)
      );
      setAbsences(sorted);
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
    if (!newAbsence.startDate || !newAbsence.endDate || !newAbsence.fk_idEmployee) {
      toast.error('Fecha de inicio, fecha de fin y empleado son obligatorios.');
      return;
    }
    if (!isDateNotPast(newAbsence.startDate)) {
      toast.error('La fecha de inicio no puede ser anterior a hoy.');
      return;
    }
    if (!isEndDateAfterStart(newAbsence.startDate, newAbsence.endDate)) {
      toast.error('La fecha de fin debe ser igual o posterior a la fecha de inicio.');
      return;
    }
    if (!validateMaxLength(newAbsence.observation, 300)) {
      toast.error('La observación debe tener máximo 300 caracteres.');
      return;
    }
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAbsence),
      });
      if (!res.ok) throw new Error('Error al crear ausencia');
      toast.success('Ausencia creada!');
      setNewAbsence({ startDate: '', endDate: '', isVacation: false, absent: false, observation: '', fk_idEmployee: 1 });
      fetchAbsences();
    } catch {
      toast.error('No se pudo crear ausencia.');
    }
  };

  const updateAbsence = async (id: number) => {
    if (!editingData) return;
    if (!editingData.startDate || !editingData.endDate || !editingData.fk_idEmployee) {
      toast.error('Fecha de inicio, fecha de fin y empleado son obligatorios.');
      return;
    }
    if (!isDateNotPast(editingData.startDate)) {
      toast.error('La fecha de inicio no puede ser anterior a hoy.');
      return;
    }
    if (!isEndDateAfterStart(editingData.startDate, editingData.endDate)) {
      toast.error('La fecha de fin debe ser igual o posterior a la fecha de inicio.');
      return;
    }
    if (!validateMaxLength(editingData.observation, 300)) {
      toast.error('La observación debe tener máximo 300 caracteres.');
      return;
    }
    try {
      const res = await fetch(`${API_URL}${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingData),
      });
      if (!res.ok) throw new Error('Error al actualizar ausencia');
      toast.success('Ausencia actualizada!');
      setEditingId(null);
      setEditingData(null);
      fetchAbsences();
    } catch {
      toast.error('No se pudo actualizar ausencia.');
    }
  };

  const deleteAbsence = async (id: number) => {
    const confirmed = await confirmDialog({
      title: '¿Eliminar ausencia?',
      description: 'Esta acción eliminará el registro de ausencia del empleado.',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
    });
    if (!confirmed) return;
    try {
      const res = await fetch(`${API_URL}${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar ausencia');
      toast.success('Ausencia eliminada!');
      fetchAbsences();
    } catch {
      toast.error('No se pudo eliminar ausencia.');
    }
  };

  const handleEditClick = (abs: EmployeeAbsence) => {
    setEditingId(abs.idEmployeeAbsence!);
    setEditingData({
      ...abs,
      startDate: abs.startDate?.slice(0, 10) || '',
      endDate: abs.endDate?.slice(0, 10) || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingData(null);
  };

  return (
    <div className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
      <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">Gestión de Ausencias de Empleados</h1>

      <AdminSection>
        <h2 className="text-xl font-semibold mb-4 text-[#bdab62]">Agregar Nueva Ausencia</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="flex flex-col">
            <label className="block text-gray-400 mb-1">Fecha de Inicio</label>
            <input
              type="date"
              name="startDate"
              value={newAbsence.startDate}
              onChange={e => setNewAbsence({ ...newAbsence, startDate: e.target.value })}
              className="w-full"
            />
          </div>
          <div className="flex flex-col">
            <label className="block text-gray-400 mb-1">Fecha de Fin</label>
            <input
              type="date"
              name="endDate"
              value={newAbsence.endDate}
              onChange={e => setNewAbsence({ ...newAbsence, endDate: e.target.value })}
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="block mb-2 text-sm font-medium text-slate-300">Tipo de Ausencia</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { key: 'isVacation', label: 'Vacaciones' },
                { key: 'absent',     label: 'Ausente' },
              ] as const).map(({ key, label }) => (
                <label
                  key={key}
                  className={`flex items-center justify-center gap-2 cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-200
                    ${newAbsence[key]
                      ? 'border-purple-400/70 bg-purple-500/15 text-purple-300 shadow-[0_0_8px_rgba(168,85,247,0.3)]'
                      : 'border-slate-600/60 bg-slate-800/50 text-slate-400 hover:border-slate-500'}`}
                >
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={newAbsence[key]}
                    onChange={() => setNewAbsence({
                      ...newAbsence,
                      isVacation: key === 'isVacation',
                      absent: key === 'absent',
                    })}
                  />
                  <span className={`h-2 w-2 rounded-full ${newAbsence[key] ? 'bg-purple-400' : 'bg-slate-600'}`} />
                  {label}
                </label>
              ))}
            </div>
          </div>
          <div className="flex flex-col">
            <label className="block text-gray-400 mb-1">Observación</label>
            <input
              type="text"
              name="observation"
              placeholder="Observación"
              value={newAbsence.observation}
              onChange={e => setNewAbsence({ ...newAbsence, observation: e.target.value })}
              maxLength={300}
              className="w-full"
            />
          </div>
          <div className="flex flex-col">
            <label className="block text-gray-400 mb-1">Empleado</label>
            <select
              name="fk_idEmployee"
              value={newAbsence.fk_idEmployee}
              onChange={e => setNewAbsence({ ...newAbsence, fk_idEmployee: Number(e.target.value) })}
              className="w-full"
            >
              <option value="">-- Selecciona empleado --</option>
              {employees.map(emp => (
                <option key={emp.idEmployee} value={emp.idEmployee}>{emp.fullName}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-6 text-right">
          <AddButton onClick={createAbsence} />
        </div>
      </AdminSection>

      <AdminSection>
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
                  <div className="flex flex-col items-center gap-2 py-5">
                    <span className="h-4 w-4 rounded-full bg-sky-500 shadow-[0_0_12px_rgba(14,165,233,0.6)]" />
                    <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Ausencia</span>
                  </div>

                  <div className="px-6 pb-6 space-y-4 text-sm text-slate-200">
                    <div className="text-center space-y-1">
                      <h3 className="text-lg font-semibold text-sky-300">{employees.find(emp => emp.idEmployee === abs.fk_idEmployee)?.fullName || 'Empleado'}</h3>
                      <p className="text-slate-400">
                        Desde: <span className="font-medium text-slate-200">{abs.startDate?.slice(0, 10)}</span>
                      </p>
                    </div>

                    <button
                      onClick={() => setExpanded(prev => ({ ...prev, [abs.idEmployeeAbsence ?? 0]: !prev[abs.idEmployeeAbsence ?? 0] }))}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-sky-500/40 bg-sky-500/10 py-2 text-sm font-medium text-sky-300 transition hover:bg-sky-500/15"
                    >
                      {isExpanded ? <><ChevronUp size={16} /> Ver menos</> : <><ChevronDown size={16} /> Ver más</>}
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
                        onClick={() => handleEditClick(abs)}
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
                </div>
              );
            })}
          </div>
        )}

        {isEditModalOpen && createPortal(
          <div
            className="fixed inset-0 lg:left-80 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={handleCancelEdit}
          >
            <div
              className="w-full max-w-2xl max-h-[95vh] overflow-y-auto rounded-2xl border border-[#167C79]/60 bg-[#0f172a] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.6)]"
              onClick={e => e.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-[#F8F4E3]">Editar Ausencia</h3>
                  <p className="text-sm text-slate-400">Actualiza los datos.</p>
                </div>
                <button onClick={handleCancelEdit} className="rounded-lg border border-slate-500 px-3 py-1.5 text-slate-300 hover:bg-slate-800">
                  Cerrar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium">Fecha de Inicio</label>
                  <input
                    type="date"
                    value={editingData!.startDate}
                    onChange={e => setEditingData({ ...editingData!, startDate: e.target.value })}
                    className="w-full p-2 rounded-md bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Fecha de Fin</label>
                  <input
                    type="date"
                    value={editingData!.endDate}
                    onChange={e => setEditingData({ ...editingData!, endDate: e.target.value })}
                    className="w-full p-2 rounded-md bg-gray-700"
                  />
                </div>
                <div className="md:col-span-2 flex flex-col gap-2">
                  <label className="block mb-2 text-sm font-medium text-slate-300">Tipo de Ausencia</label>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { key: 'isVacation', label: 'Vacaciones' },
                      { key: 'absent',     label: 'Ausente' },
                    ] as const).map(({ key, label }) => (
                      <label
                        key={key}
                        className={`flex items-center justify-center gap-2 cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-200
                          ${editingData![key]
                            ? 'border-purple-400/70 bg-purple-500/15 text-purple-300 shadow-[0_0_8px_rgba(168,85,247,0.3)]'
                            : 'border-slate-600/60 bg-slate-800/50 text-slate-400 hover:border-slate-500'}`}
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={editingData![key]}
                          onChange={() => setEditingData({
                            ...editingData!,
                            isVacation: key === 'isVacation',
                            absent: key === 'absent',
                          })}
                        />
                        <span className={`h-2 w-2 rounded-full ${editingData![key] ? 'bg-purple-400' : 'bg-slate-600'}`} />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Observación</label>
                  <input
                    type="text"
                    value={editingData!.observation}
                    onChange={e => setEditingData({ ...editingData!, observation: e.target.value })}
                    maxLength={300}
                    className="w-full p-2 rounded-md bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Empleado</label>
                  <select
                    value={editingData!.fk_idEmployee}
                    onChange={e => setEditingData({ ...editingData!, fk_idEmployee: Number(e.target.value) })}
                    className="w-full p-2 rounded-md bg-gray-700"
                  >
                    <option value="">-- Selecciona empleado --</option>
                    {employees.map(emp => (
                      <option key={emp.idEmployee} value={emp.idEmployee}>{emp.fullName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-700 pt-4">
                <CancelButton onClick={handleCancelEdit} />
                <SaveButton onClick={() => updateAbsence(editingId!)} children="Guardar cambios" />
              </div>
            </div>
          </div>,
          document.body
        )}
      </AdminSection>
    </div>
  );
};

export default EmployeeAbsencesManagement;
