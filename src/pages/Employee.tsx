import React, { useState, useEffect } from 'react';
import { decodeBackendImage, encodeImageForBackend } from '../utils/imageHelpers';
import { toast } from 'react-hot-toast';
import {
  UserPlus,
  Trash2,
  Edit,
  Save,
  Loader,
  X,
} from 'lucide-react';

const API_URL = 'https://backend-country-nnxe.onrender.com';

interface Employee {
  idEmployee?: number;
  fullName: string;
  ci: string;
  phoneNumber: number;
  startContractDate: string;
  endContractDate: string;
  startTime: string;
  exitTime: string;
  salary: number;
  status: boolean;
  fk_idPositionEmployee: number;
  employeePhoto?: string | null;
}

interface Position {
  idPositionEmployee: number;
  namePosition: string;
}

const formatTimeForInput = (isoDateString: string): string => {
  if (!isoDateString) return '';
  const date = new Date(isoDateString);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Utilidad para convertir imagen a base64 con prefijo
function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file); // incluye el prefijo
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

const Employees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [newEmployee, setNewEmployee] = useState<Employee>({
    fullName: '',
    ci: '',
    phoneNumber: 0,
    startContractDate: '',
    endContractDate: '',
    startTime: '',
    exitTime: '',
    salary: 0,
    status: true,
    fk_idPositionEmployee: 1,
    employeePhoto: null,
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);

const getEmptyEmployee = (): Employee => ({
  fullName: '',
  ci: '',
  phoneNumber: 0,
  startContractDate: '',
  endContractDate: '',
  startTime: '',
  exitTime: '',
  salary: 0,
  status: true,
  fk_idPositionEmployee: positions.length > 0 ? positions[0].idPositionEmployee : 0,
  employeePhoto: null,
});


  const fetchData = async () => {
  setLoading(true);
  setError(null);
  try {
    const employeesResponse = await fetch(`${API_URL}/employees/`);
    if (!employeesResponse.ok) throw new Error(`Error al obtener empleados: ${employeesResponse.statusText}`);
    const employeesData = await employeesResponse.json();

    const positionsResponse = await fetch(`${API_URL}/employee_positions/`);
    if (!positionsResponse.ok) throw new Error(`Error al obtener posiciones: ${positionsResponse.statusText}`);
    const positionsData = await positionsResponse.json();

    setEmployees(employeesData);
    setPositions(positionsData);

    if (!editingId) {
      setNewEmployee({
        ...getEmptyEmployee(),
        fk_idPositionEmployee: positionsData[0]?.idPositionEmployee || 0,
      });
    }

  } catch (error: any) {
    setError("No se pudo cargar la información. Inténtalo de nuevo más tarde.");
    toast.error(`Error al cargar los datos: ${error.message}`);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchData();
  }, []);

  // Crear o actualizar empleado
  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let employeePhoto: string | null = null;
      if (selectedPhoto) {
          const base64Full = await toBase64(selectedPhoto); 
          employeePhoto = encodeImageForBackend(base64Full);
      }

     const employeeData = {
        ...newEmployee,
        phoneNumber: Number(newEmployee.phoneNumber),
        salary: Number(newEmployee.salary),
        startTime: newEmployee.startContractDate
          ? `${newEmployee.startContractDate}T${newEmployee.startTime || '08:00'}:00`
          : '',
        exitTime: newEmployee.endContractDate
          ? `${newEmployee.endContractDate}T${newEmployee.exitTime || '17:00'}:00`
          : '',
        ...(employeePhoto !== null && { employeePhoto }),
      };


       console.log('Enviando empleado al backend:', employeeData);

      if (!newEmployee.fk_idPositionEmployee) {
        toast.error("Debe seleccionar una posición válida para el empleado.");
        return;
      }

      let response;
      if (editingId) {
        response = await fetch(`${API_URL}/employees/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(employeeData),
        });
      } else {
        response = await fetch(`${API_URL}/employees/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(employeeData),
        });
      }
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error: ${response.status} - ${errorText}`);
      }
      await response.json();
      toast.success(`Empleado ${editingId ? 'actualizado' : 'creado'} con éxito!`);
      setNewEmployee(getEmptyEmployee());
      setEditingId(null);
      setSelectedPhoto(null);
      fetchData();
    } catch (error: any) {
      toast.error(`Ocurrió un error en la operación: ${error.message}`);
    }
  };

  // Eliminar empleado
  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/employees/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error al eliminar: ${response.status} - ${errorText}`);
      }
      toast.success('Empleado eliminado con éxito!');
      fetchData();
    } catch (error: any) {
      toast.error(`Ocurrió un error al eliminar el empleado: ${error.message}`);
    }
  };

  // Modo edición
  const startEdit = (employee: Employee) => {
    console.log('Editando empleado:', employee);
    setNewEmployee({
      ...employee,
      startTime: formatTimeForInput(employee.startTime),
      exitTime: formatTimeForInput(employee.exitTime),
      employeePhoto: null
    });
    setSelectedPhoto(null);
    setEditingId(employee.idEmployee!);
  };

  const cancelEdit = () => {
    setNewEmployee(getEmptyEmployee());
    setEditingId(null);
    setSelectedPhoto(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let newValue: string | number | boolean = value;
    if (type === "number") {
      newValue = value === '' ? 0 : Number(value);
    } else if (name === "status") {
      newValue = (e.target as HTMLInputElement).checked;
    }
    setNewEmployee({ ...newEmployee, [name]: newValue });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedPhoto(e.target.files[0]);
    }
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-8 text-center text-teal-400">
        Gestión de Empleados
      </h1>
      <form
        onSubmit={handleCreateOrUpdate}
        className="bg-slate-800 p-6 rounded-lg shadow-xl mb-8 border border-slate-700"
      >
        <h2 className="text-xl font-semibold mb-4 text-teal-300">
          {editingId ? "Editar Empleado" : "Crear Nuevo Empleado"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label htmlFor="fullName">Nombre Completo</label>
          <input type="text" placeholder="Nombre Completo" name="fullName" value={newEmployee.fullName} onChange={handleInputChange} className="w-full p-2 rounded-md bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500" required />
         </div>
         <div>
           <label htmlFor="ci">C.I.</label>
          <input type="text" placeholder="C.I." name="ci" value={newEmployee.ci} onChange={handleInputChange} className="w-full p-2 rounded-md bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500" required />
         </div>
          <div>
            <label htmlFor="phoneNumber">Número de Teléfono</label>
          <input type="number" placeholder="Número de Teléfono" name="phoneNumber" value={newEmployee.phoneNumber} onChange={handleInputChange} className="w-full p-2 rounded-md bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500" required />
          </div>
          <div>
            <label htmlFor="startContractDate">Fecha de Contrato (Inicio)</label>
          <input type="date" placeholder="Fecha de Contrato (Inicio)" name="startContractDate" value={newEmployee.startContractDate} onChange={handleInputChange} className="w-full p-2 rounded-md bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500" required />
          </div>
          <div>
            <label htmlFor="endContractDate">Fecha de Contrato (Fin)</label>
          <input type="date" placeholder="Fecha de Contrato (Fin)" name="endContractDate" value={newEmployee.endContractDate} onChange={handleInputChange} className="w-full p-2 rounded-md bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500" required />
          </div>
          <div>
            <label htmlFor="startTime">Hora de Entrada</label>
          <input type="time" placeholder="Hora de Entrada" name="startTime" value={newEmployee.startTime} onChange={handleInputChange} className="w-full p-2 rounded-md bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <div>
            <label htmlFor="exitTime">Hora de Salida</label>
          <input type="time" placeholder="Hora de Salida" name="exitTime" value={newEmployee.exitTime} onChange={handleInputChange} className="w-full p-2 rounded-md bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <div>
            <label htmlFor="salary">Salario</label>
          <input type="number" placeholder="Salario" name="salary" value={newEmployee.salary} onChange={handleInputChange} className="w-full p-2 rounded-md bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500" required />         
          </div>
          <div>
            <label htmlFor="fk_idPositionEmployee">Posición</label>
          <select name="fk_idPositionEmployee" value={newEmployee.fk_idPositionEmployee} onChange={handleInputChange} className="w-full p-2 rounded-md bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-teal-500" required>
            {positions.map((position) => (
              <option key={position.idPositionEmployee} value={position.idPositionEmployee}>{position.namePosition}</option>
            ))}
          </select>
          </div>
          <div>
            <label htmlFor="employeePhoto">Foto del Empleado</label>
          <input type="file" name="employeePhoto" accept="image/*" onChange={handlePhotoChange} className="w-full p-2 text-white placeholder-slate-400" />
          </div>
        </div>
        <div className="flex justify-end gap-4 mt-6">
          {editingId ? (
            <>
              <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md shadow-md hover:bg-green-700 transition-colors"><Save size={18} /> Guardar Cambios</button>
              <button type="button" onClick={cancelEdit} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md shadow-md hover:bg-red-700 transition-colors"><X size={18} /> Cancelar</button>
            </>
          ) : (
            <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-md shadow-md hover:bg-teal-600 transition-colors"><UserPlus size={18} /> Agregar Empleado</button>
          )}
        </div>
      </form>
      {loading && (
        <div className="flex justify-center items-center p-8">
          <Loader size={48} className="animate-spin text-teal-400" />
        </div>
      )}
      {error && (
        <div className="text-center text-red-500 font-semibold mt-4">{error}</div>
      )}
      {!loading && !error && (
        <div className="overflow-x-auto bg-slate-800 rounded-lg shadow-xl border border-slate-700">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Foto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">C.I.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Número de Teléfono</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Posición</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Salario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Hora de Entrada</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Hora de Salida</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">Fecha de Contrato - Inicio y Fin </th>
              </tr>
            </thead>
            <tbody className="bg-slate-800 divide-y divide-slate-700">
              {employees.map((employee) => {              
                const positionName = positions.find(p => p.idPositionEmployee === employee.fk_idPositionEmployee)?.namePosition || 'Desconocido';
                return (
                  <tr key={employee.idEmployee} className="hover:bg-slate-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {employee.employeePhoto && (
                        <img
                          src={decodeBackendImage(employee.employeePhoto)}
                          alt={`Foto de ${employee.fullName}`}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{employee.fullName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{employee.ci}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{employee.phoneNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{positionName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">${employee.salary}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{employee.startTime ? new Date(employee.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{employee.exitTime ? new Date(employee.exitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{employee.startContractDate ? new Date(employee.startContractDate).toLocaleDateString() : 'N/A'} - {employee.endContractDate ? new Date(employee.endContractDate).toLocaleDateString() : 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => startEdit(employee)} className="text-teal-400 hover:text-teal-600 transition-colors mr-4"><Edit size={20} /></button>
                      <button onClick={() => handleDelete(employee.idEmployee!)} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 size={20} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Employees;