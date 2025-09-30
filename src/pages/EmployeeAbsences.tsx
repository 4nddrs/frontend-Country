import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Save, Trash2, Loader, X } from 'lucide-react';

const API_URL = 'https://backend-country-nnxe.onrender.com/employee_absences/';

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

  // For employee select
  const [employees, setEmployees] = useState<any[]>([]);
  const fetchEmployees = async () => {
    try {
      const res = await fetch("https://backend-country-nnxe.onrender.com/employees/");
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
    <div className="p-6 bg-slate-950 min-h-screen text-white">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
          body {
            font-family: 'Inter', sans-serif;
            background-color: #1a202c;
          }
        `}
      </style>
      <h1 className="text-3xl font-bold mb-6 text-center text-teal-400">Gestión de Ausencias de Empleados</h1>
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl mb-8">
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
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            <Loader size={24} className="animate-spin" /> Cargando ausencias...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {absences.map(abs => (
              <div key={abs.idEmployeeAbsence} className="bg-gray-700 p-4 rounded-md shadow-lg flex flex-col justify-between transition-transform transform hover:scale-105 duration-200">
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
                    <h3 className="text-lg font-semibold text-gray-200">Empleado: {employees.find(emp => emp.idEmployee === abs.fk_idEmployee)?.fullName || abs.fk_idEmployee}</h3>
                    <p className="text-sm text-gray-400 mt-1">Desde: <span className="text-gray-200">{abs.startDate?.slice(0, 10)}</span> hasta <span className="text-gray-200">{abs.endDate?.slice(0, 10)}</span></p>
                    <p className="text-sm text-gray-400 mt-1">Vacaciones: <span className="text-gray-200">{abs.isVacation ? 'Sí' : 'No'}</span> | Ausente: <span className="text-gray-200">{abs.absent ? 'Sí' : 'No'}</span></p>
                    <p className="text-sm text-gray-400 mt-1">Observación: <span className="text-gray-200">{abs.observation}</span></p>
                    <div className="flex justify-end gap-2 mt-4">
                      <button
                        onClick={() => { setEditingId(abs.idEmployeeAbsence!); setNewAbsence(abs); }}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white p-2 rounded-md flex items-center gap-1 transition-colors duration-200"
                      >
                        <Edit size={16} /> Editar
                      </button>
                      <button
                        onClick={() => deleteAbsence(abs.idEmployeeAbsence!)}
                        className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-md flex items-center gap-1 transition-colors duration-200"
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

export default EmployeeAbsencesManagement;
