// src/components/Employee.tsx

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  UserPlus,
  Trash2,
  Edit,
  Save,
  Loader,
  X,
  RotateCcw,
} from 'lucide-react';

// Se usa la variable de entorno para la URL base de tu API, que usa el proxy
const API_URL = import.meta.env.VITE_API_URL;

// Interface para el modelo de Empleado
interface Employee {
  idEmployee?: number;
  fullName: string;
  ci: string;
  // ✅ CORRECCIÓN: phoneNumber ahora es un número, ya que el backend lo espera así
  phoneNumber: number;
  startContractDate: string;
  endContractDate: string;
  startTime: string;
  exitTime: string;
  salary: number;
  status: boolean;
  fk_idRoleEmployee: number;
  fk_idPositionEmployee: number;
  employeePhoto?: string | null;
}

// Interface para el modelo de Rol
interface Role {
  idRoleEmployee: number;
  nameRole: string;
}

// Interface para el modelo de Posición
interface Position {
  idPositionEmployee: number;
  namePosition: string;
}

// Función de ayuda para formatear la hora del backend a un formato de input
const formatTimeForInput = (isoDateString: string): string => {
  if (!isoDateString) return '';
  // Usamos el constructor de Date para manejar el formato ISO 8601
  const date = new Date(isoDateString);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const Employees = () => {
  // Estado para la lista de empleados
  const [employees, setEmployees] = useState<Employee[]>([]);
  // Estado para la lista de roles
  const [roles, setRoles] = useState<Role[]>([]);
  // Estado para la lista de posiciones
  const [positions, setPositions] = useState<Position[]>([]);
  // Estado para el formulario de nuevo empleado
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
    fk_idRoleEmployee: 1,
    fk_idPositionEmployee: 1,
    employeePhoto: null,
  });

  // Estado para controlar el modo de edición
  const [editingId, setEditingId] = useState<number | null>(null);
  // Estado para la carga de datos
  const [loading, setLoading] = useState<boolean>(true);
  // Estado para manejar errores de carga
  const [error, setError] = useState<string | null>(null);

  // Estado para almacenar la foto seleccionada temporalmente
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);

  // Función para obtener todos los datos de la API
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('--- [PROCESO] Iniciando carga de datos de la API ---');

      // Petición para empleados
      const employeesResponse = await fetch(`${API_URL}/employees`);
      if (!employeesResponse.ok) {
        throw new Error(`Error al obtener empleados: ${employeesResponse.statusText}`);
      }
      const employeesData = await employeesResponse.json();
      setEmployees(employeesData);

      // Petición para roles
      const rolesResponse = await fetch(`${API_URL}/employee_roles`);
      if (!rolesResponse.ok) {
        throw new Error(`Error al obtener roles: ${rolesResponse.statusText}`);
      }
      const rolesData = await rolesResponse.json();
      setRoles(rolesData);

      // Petición para posiciones
      const positionsResponse = await fetch(`${API_URL}/employee_positions`);
      if (!positionsResponse.ok) {
        throw new Error(`Error al obtener posiciones: ${positionsResponse.statusText}`);
      }
      const positionsData = await positionsResponse.json();
      setPositions(positionsData);

    } catch (error: any) {
      console.error("[ERROR DE CONEXIÓN] No se pudo cargar la información:", error);
      setError("No se pudo cargar la información. Inténtalo de nuevo más tarde.");
      toast.error(`Error al cargar los datos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Cargar los datos al iniciar el componente
  useEffect(() => {
    fetchData();
  }, []);

  // Manejar el envío del formulario (crear o actualizar)
  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let photoBase64: string | null = null;
      if (selectedPhoto) {
        photoBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.onerror = reject;
          reader.readAsDataURL(selectedPhoto);
        });
        // Elimina el prefijo 'data:image/png;base64,'
        photoBase64 = photoBase64.split(',')[1];
      }

      // ✅ CORRECCIÓN: Formateo de datos a los tipos que el backend espera
      const employeeData = {
        ...newEmployee,
        phoneNumber: Number(newEmployee.phoneNumber), // Asegurar que sea un número
        salary: Number(newEmployee.salary), // Asegurar que sea un número
        // ✅ CORRECCIÓN: Usar la fecha de hoy para crear el TIMESTAMP, ya que el backend no necesita el '1970-01-01'
        startTime: new Date(`2025-01-01T${newEmployee.startTime}:00Z`).toISOString(),
        exitTime: new Date(`2025-01-01T${newEmployee.exitTime}:00Z`).toISOString(),
        employeePhoto: photoBase64,
      };

      let response;
      if (editingId) {
        // Lógica para actualizar empleado
        response = await fetch(`${API_URL}/employees/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(employeeData),
        });
      } else {
        // Lógica para crear empleado
        response = await fetch(`${API_URL}/employees`, {
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

      // Restablecer el formulario y el estado de edición
      setNewEmployee({
        fullName: '',
        ci: '',
        phoneNumber: 0,
        startContractDate: '',
        endContractDate: '',
        startTime: '',
        exitTime: '',
        salary: 0,
        status: true,
        fk_idRoleEmployee: 1,
        fk_idPositionEmployee: 1,
        employeePhoto: null,
      });
      setEditingId(null);
      setSelectedPhoto(null);
      fetchData(); // Vuelve a cargar los datos después de la operación
    } catch (error: any) {
      console.error("[ERROR EN OPERACIÓN] Ocurrió un error en la operación de crear/actualizar:", error);
      toast.error(`Ocurrió un error en la operación: ${error.message}`);
    }
  };

  // Manejar la eliminación de un empleado
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
      fetchData(); // Vuelve a cargar los datos
    } catch (error: any) {
      console.error("[ERROR EN OPERACIÓN] Ocurrió un error al eliminar:", error);
      toast.error(`Ocurrió un error al eliminar el empleado: ${error.message}`);
    }
  };

  // Iniciar el modo de edición
  const startEdit = (employee: Employee) => {
    setNewEmployee({
      ...employee,
      // Usar la función de formato para la hora
      startTime: formatTimeForInput(employee.startTime),
      exitTime: formatTimeForInput(employee.exitTime),
      employeePhoto: null
    });
    setSelectedPhoto(null);
    setEditingId(employee.idEmployee!);
  };

  // Cancelar el modo de edición
  const cancelEdit = () => {
    setNewEmployee({
      fullName: '',
      ci: '',
      phoneNumber: 0,
      startContractDate: '',
      endContractDate: '',
      startTime: '',
      exitTime: '',
      salary: 0,
      status: true,
      fk_idRoleEmployee: 1,
      fk_idPositionEmployee: 1,
      employeePhoto: null,
    });
    setEditingId(null);
    setSelectedPhoto(null);
  };

  // Manejadores de cambios en los campos del formulario
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

      {/* Formulario de creación/edición */}
      <form
        onSubmit={handleCreateOrUpdate}
        className="bg-slate-800 p-6 rounded-lg shadow-xl mb-8 border border-slate-700"
      >
        <h2 className="text-xl font-semibold mb-4 text-teal-300">
          {editingId ? "Editar Empleado" : "Crear Nuevo Empleado"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Campo Nombre Completo */}
          <input
            type="text"
            placeholder="Nombre Completo"
            name="fullName"
            value={newEmployee.fullName}
            onChange={handleInputChange}
            className="w-full p-2 rounded-md bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            required
          />
          {/* Campo CI */}
          <input
            type="text"
            placeholder="C.I."
            name="ci"
            value={newEmployee.ci}
            onChange={handleInputChange}
            className="w-full p-2 rounded-md bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            required
          />
          {/* Campo Teléfono */}
          <input
            type="number" // ✅ CAMBIO: Usamos 'number' para asegurar que el input sea numérico
            placeholder="Número de Teléfono"
            name="phoneNumber"
            value={newEmployee.phoneNumber}
            onChange={handleInputChange}
            className="w-full p-2 rounded-md bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            required
          />
          {/* Campo Fecha de Inicio */}
          <input
            type="date"
            placeholder="Fecha de Contrato (Inicio)"
            name="startContractDate"
            value={newEmployee.startContractDate}
            onChange={handleInputChange}
            className="w-full p-2 rounded-md bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            required
          />
          {/* Campo Fecha de Fin */}
          <input
            type="date"
            placeholder="Fecha de Contrato (Fin)"
            name="endContractDate"
            value={newEmployee.endContractDate}
            onChange={handleInputChange}
            className="w-full p-2 rounded-md bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            required
          />
          {/* Campo Hora de Inicio */}
          <input
            type="time"
            placeholder="Hora de Entrada"
            name="startTime"
            value={newEmployee.startTime}
            onChange={handleInputChange}
            className="w-full p-2 rounded-md bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          {/* Campo Hora de Salida */}
          <input
            type="time"
            placeholder="Hora de Salida"
            name="exitTime"
            value={newEmployee.exitTime}
            onChange={handleInputChange}
            className="w-full p-2 rounded-md bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          {/* Campo Salario */}
          <input
            type="number"
            placeholder="Salario"
            name="salary"
            value={newEmployee.salary}
            onChange={handleInputChange}
            className="w-full p-2 rounded-md bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            required
          />
          {/* Select de Roles */}
          <select
            name="fk_idRoleEmployee"
            value={newEmployee.fk_idRoleEmployee}
            onChange={handleInputChange}
            className="w-full p-2 rounded-md bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            required
          >
            {roles.map((role) => (
              <option key={role.idRoleEmployee} value={role.idRoleEmployee}>
                {role.nameRole}
              </option>
            ))}
          </select>
          {/* Select de Posiciones */}
          <select
            name="fk_idPositionEmployee"
            value={newEmployee.fk_idPositionEmployee}
            onChange={handleInputChange}
            className="w-full p-2 rounded-md bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            required
          >
            {positions.map((position) => (
              <option key={position.idPositionEmployee} value={position.idPositionEmployee}>
                {position.namePosition}
              </option>
            ))}
          </select>
          {/* Input de foto */}
          <input
            type="file"
            name="employeePhoto"
            accept="image/*"
            onChange={handlePhotoChange}
            className="w-full p-2 text-white placeholder-slate-400"
          />
        </div>

        <div className="flex justify-end gap-4 mt-6">
          {editingId ? (
            <>
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md shadow-md hover:bg-green-700 transition-colors"
              >
                <Save size={18} /> Guardar Cambios
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md shadow-md hover:bg-red-700 transition-colors"
              >
                <X size={18} /> Cancelar
              </button>
            </>
          ) : (
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-md shadow-md hover:bg-teal-600 transition-colors"
            >
              <UserPlus size={18} /> Agregar Empleado
            </button>
          )}
        </div>
      </form>

      {/* Mostrar estado de la carga y errores */}
      {loading && (
        <div className="flex justify-center items-center p-8">
          <Loader size={48} className="animate-spin text-teal-400" />
        </div>
      )}
      {error && (
        <div className="text-center text-red-500 font-semibold mt-4">
          {error}
        </div>
      )}

      {/* Tabla de Empleados */}
      {!loading && !error && (
        <div className="overflow-x-auto bg-slate-800 rounded-lg shadow-xl border border-slate-700">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Foto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">C.I.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Rol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Posición</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Salario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-slate-800 divide-y divide-slate-700">
              {employees.map((employee) => {
                const roleName = roles.find(r => r.idRoleEmployee === employee.fk_idRoleEmployee)?.nameRole || 'Desconocido';
                const positionName = positions.find(p => p.idPositionEmployee === employee.fk_idPositionEmployee)?.namePosition || 'Desconocido';
                return (
                  <tr key={employee.idEmployee} className="hover:bg-slate-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {employee.employeePhoto && (
                        <img
                          src={employee.employeePhoto}
                          alt={`Foto de ${employee.fullName}`}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{employee.fullName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{employee.ci}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{roleName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{positionName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">${employee.salary}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => startEdit(employee)}
                        className="text-teal-400 hover:text-teal-600 transition-colors mr-4"
                      >
                        <Edit size={20} />
                      </button>
                      <button
                        onClick={() => handleDelete(employee.idEmployee!)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={20} />
                      </button>
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
