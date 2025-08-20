// src/pages/Employees.tsx
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  Plus,
  Trash2,
  Edit,
  Save,
  Loader,
  X,
} from 'lucide-react';

// Función para convertir un archivo a Base64
function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

// Modelo de datos para la API de FastAPI
interface Employee {
  idEmployee?: number;
  fullName: string;
  ci: string;
  phoneNumber: string;
  startContractDate: string;
  endContractDate: string;
  startTime: string;
  exitTime: string;
  salary: number;
  status: boolean;
  fk_idRoleEmployee: number;
  fk_idPositionEmployee: number;
  employeePhoto?: string | null;
  created_at?: string;
}

// Nuevo modelo para la creación de un empleado (según la documentación de la API)
interface EmployeeCreate {
  fullName: string;
  ci: string;
  phoneNumber: string;
  employeePhoto: string | null;
  startContractDate: string;
  endContractDate: string;
  startTime: string;
  exitTime: string;
  salary: number;
  status: boolean;
  fk_idRoleEmployee: number;
  fk_idPositionEmployee: number;
}

// Modelos para Roles y Posiciones con nombres de campos exactos de la DB
interface Role {
  idRoleEmployee: number;
  nameRole: string;
}

interface Position {
  idPositionEmployee: number;
  namePosition: string;
}

const Employees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [newEmployee, setNewEmployee] = useState<Employee>({
    fullName: '',
    ci: '',
    phoneNumber: '',
    startContractDate: '',
    endContractDate: '',
    startTime: '',
    exitTime: '',
    salary: 0,
    status: true,
    fk_idRoleEmployee: 0,
    fk_idPositionEmployee: 0,
    employeePhoto: null,
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Usa un string vacío, el proxy de Vite se encargará de la URL base.
  const API_URL = '';

  // Obtener todos los datos necesarios
  const fetchData = async () => {
    try {
      setLoading(true);
      const [employeesRes, rolesRes, positionsRes] = await Promise.all([
        fetch(`${API_URL}/api/employees`),
        fetch(`${API_URL}/api/employee_roles`),
        fetch(`${API_URL}/api/employee_positions`),
      ]);

      const employeesData = await employeesRes.json();
      const rolesData = await rolesRes.json();
      const positionsData = await positionsRes.json();

      setEmployees(employeesData);
      setRoles(rolesData);
      setPositions(positionsData);

      // Pre-seleccionar la primera opción en los select cuando los datos se cargan por primera vez
      if (rolesData.length > 0 && positionsData.length > 0) {
        setNewEmployee(prevState => ({
          ...prevState,
          fk_idRoleEmployee: rolesData[0].idRoleEmployee,
          fk_idPositionEmployee: positionsData[0].idPositionEmployee,
        }));
      }

    } catch (error: unknown) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar los datos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Crear un nuevo empleado
  const createEmployee = async () => {
    try {
      // Validación para asegurar que se seleccionó una opción válida
      if (newEmployee.fk_idRoleEmployee === 0 || newEmployee.fk_idPositionEmployee === 0) {
        toast.error('Por favor, selecciona un rol y una posición válidos.');
        return;
      }
      
      const employeeCreateData: EmployeeCreate = {
        fullName: newEmployee.fullName,
        ci: newEmployee.ci,
        phoneNumber: newEmployee.phoneNumber,
        employeePhoto: newEmployee.employeePhoto || null,
        startContractDate: newEmployee.startContractDate,
        endContractDate: newEmployee.endContractDate,
        startTime: `${newEmployee.startContractDate}T${newEmployee.startTime}:00`,
        exitTime: `${newEmployee.startContractDate}T${newEmployee.exitTime}:00`,
        salary: newEmployee.salary,
        status: newEmployee.status,
        fk_idRoleEmployee: newEmployee.fk_idRoleEmployee,
        fk_idPositionEmployee: newEmployee.fk_idPositionEmployee,
      };
      
      const response = await fetch(`${API_URL}/api/employees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(employeeCreateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response from server:', errorData);

        let errorMessage = 'Error al crear el empleado.';
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map((err: any) => {
            const loc = err.loc ? err.loc.join(' > ') : 'N/A';
            return `Campo: ${loc}, Mensaje: ${err.msg}`;
          }).join(' | ');
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        }

        throw new Error(errorMessage);
      }

      await fetchData();
      setNewEmployee({
        fullName: '',
        ci: '',
        phoneNumber: '',
        startContractDate: '',
        endContractDate: '',
        startTime: '',
        exitTime: '',
        salary: 0,
        status: true,
        fk_idRoleEmployee: roles[0]?.idRoleEmployee || 0,
        fk_idPositionEmployee: positions[0]?.idPositionEmployee || 0,
        employeePhoto: null,
      });
      toast.success('Empleado creado exitosamente!');
    } catch (error: unknown) {
      console.error('Error creating employee:', error);
      toast.error(`Error: ${error instanceof Error ? error.message : 'Error al crear el empleado.'}`);
    }
  };

  // Actualizar un empleado existente
  const updateEmployee = async (id: number, updatedEmployee: Employee) => {
    try {
      const employeeToSend = {
        ...updatedEmployee,
        startTime: `${updatedEmployee.startContractDate}T${updatedEmployee.startTime}:00`,
        exitTime: `${updatedEmployee.startContractDate}T${updatedEmployee.exitTime}:00`,
      };

      const response = await fetch(`${API_URL}/api/employees/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(employeeToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = 'Error al actualizar el empleado.';
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map((err: any) => {
            const loc = err.loc ? err.loc.join(' > ') : 'N/A';
            return `Campo: ${loc}, Mensaje: ${err.msg}`;
          }).join(' | ');
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        }
        throw new Error(errorMessage);
      }

      await fetchData();
      setEditingId(null);
      toast.success('Empleado actualizado exitosamente!');
    } catch (error: unknown) {
      console.error('Error updating employee:', error);
      toast.error(`Error: ${error instanceof Error ? error.message : 'Error al actualizar el empleado.'}`);
    }
  };

  // Eliminar un empleado
  const deleteEmployee = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/api/employees/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = 'Error al eliminar el empleado.';
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map((err: any) => {
            const loc = err.loc ? err.loc.join(' > ') : 'N/A';
            return `Campo: ${loc}, Mensaje: ${err.msg}`;
          }).join(' | ');
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        }
        throw new Error(errorMessage);
      }

      await fetchData();
      toast.success('Empleado eliminado exitosamente!');
    } catch (error: unknown) {
      console.error('Error deleting employee:', error);
      toast.error(`Error: ${error instanceof Error ? error.message : 'Error al eliminar el empleado.'}`);
    }
  };

  // Obtener el nombre del rol a partir del ID
  const getRoleName = (id: number) => {
    const role = roles.find(r => r.idRoleEmployee === id);
    return role ? role.nameRole : 'N/A';
  };

  // Obtener el nombre de la posición a partir del ID
  const getPositionName = (id: number) => {
    const position = positions.find(p => p.idPositionEmployee === id);
    return position ? position.namePosition : 'N/A';
  };

  // Manejar cambios en los inputs y selects
  const handleNewEmployeeChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'file' && 'files' in e.target && e.target.files) {
      const file = e.target.files[0];
      if (file) {
        const base64String = await toBase64(file);
        setNewEmployee({ ...newEmployee, employeePhoto: base64String });
      }
    } else if (name.startsWith('fk_') || name === 'salary') {
      setNewEmployee({
        ...newEmployee,
        [name]: Number(value),
      });
    } else {
      setNewEmployee({
        ...newEmployee,
        [name]: value,
      });
    }
  };

  return (
    <div className="container mx-auto p-4 text-white">
      <h1 className="text-3xl font-bold mb-6 text-center">Gestión de Empleados</h1>

      {/* Formulario para agregar/crear un nuevo empleado */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Agregar Nuevo Empleado</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <input
            type="text"
            name="fullName"
            placeholder="Nombre Completo"
            value={newEmployee.fullName}
            onChange={handleNewEmployeeChange}
            className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          <input
            type="text"
            name="ci"
            placeholder="CI"
            value={newEmployee.ci}
            onChange={handleNewEmployeeChange}
            className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          <input
            type="text"
            name="phoneNumber"
            placeholder="Número de Teléfono"
            value={newEmployee.phoneNumber}
            onChange={handleNewEmployeeChange}
            className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          <label className="flex items-center gap-2 text-gray-400">
            Fecha Inicio Contrato:
            <input
              type="date"
              name="startContractDate"
              value={newEmployee.startContractDate}
              onChange={handleNewEmployeeChange}
              className="p-2 rounded-md bg-gray-700 text-white"
            />
          </label>
          <label className="flex items-center gap-2 text-gray-400">
            Fecha Fin Contrato:
            <input
              type="date"
              name="endContractDate"
              value={newEmployee.endContractDate}
              onChange={handleNewEmployeeChange}
              className="p-2 rounded-md bg-gray-700 text-white"
            />
          </label>
          <label className="flex items-center gap-2 text-gray-400">
            Hora Inicio:
            <input
              type="time"
              name="startTime"
              value={newEmployee.startTime}
              onChange={handleNewEmployeeChange}
              className="p-2 rounded-md bg-gray-700 text-white"
            />
          </label>
          <label className="flex items-center gap-2 text-gray-400">
            Hora Salida:
            <input
              type="time"
              name="exitTime"
              value={newEmployee.exitTime}
              onChange={handleNewEmployeeChange}
              className="p-2 rounded-md bg-gray-700 text-white"
            />
          </label>
          <input
            type="number"
            name="salary"
            placeholder="Salario"
            value={newEmployee.salary || ''}
            onChange={handleNewEmployeeChange}
            className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          <label className="flex items-center gap-2 text-gray-400">
            Foto:
            <input
              type="file"
              name="employeePhoto"
              onChange={handleNewEmployeeChange}
              className="p-2 rounded-md bg-gray-700 text-white"
            />
          </label>
          
          {/* Menú desplegable para el rol */}
          <select
            name="fk_idRoleEmployee"
            value={newEmployee.fk_idRoleEmployee}
            onChange={handleNewEmployeeChange}
            className="p-2 rounded-md bg-gray-700 text-white"
          >
            <option value={0}>Selecciona un Rol</option>
            {roles.map(role => (
              <option key={role.idRoleEmployee} value={role.idRoleEmployee}>
                {role.nameRole}
              </option>
            ))}
          </select>

          {/* Menú desplegable para la posición */}
          <select
            name="fk_idPositionEmployee"
            value={newEmployee.fk_idPositionEmployee}
            onChange={handleNewEmployeeChange}
            className="p-2 rounded-md bg-gray-700 text-white"
          >
            <option value={0}>Selecciona una Posición</option>
            {positions.map(position => (
              <option key={position.idPositionEmployee} value={position.idPositionEmployee}>
                {position.namePosition}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end mt-4">
          <button
            onClick={createEmployee}
            className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-md font-semibold flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Agregar Empleado
          </button>
        </div>
      </div>

      {/* Listado de Empleados */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-md">
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            <Loader size={24} className="animate-spin" />
            Cargando empleados...
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {employees.map((employee) => (
              <div key={employee.idEmployee} className="bg-gray-700 p-4 rounded-md shadow-lg flex flex-col justify-between">
                {editingId === employee.idEmployee ? (
                  // Formulario de edición
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <input type="text" defaultValue={employee.fullName} onChange={(e) => setNewEmployee({...newEmployee, fullName: e.target.value})} className="p-2 rounded-md bg-gray-600 text-white" />
                    <input type="text" defaultValue={employee.ci} onChange={(e) => setNewEmployee({...newEmployee, ci: e.target.value})} className="p-2 rounded-md bg-gray-600 text-white" />
                    <input type="text" defaultValue={employee.phoneNumber} onChange={(e) => setNewEmployee({...newEmployee, phoneNumber: e.target.value})} className="p-2 rounded-md bg-gray-600 text-white" />
                    <input type="date" defaultValue={employee.startContractDate} onChange={(e) => setNewEmployee({...newEmployee, startContractDate: e.target.value})} className="p-2 rounded-md bg-gray-600 text-white" />
                    <input type="date" defaultValue={employee.endContractDate} onChange={(e) => setNewEmployee({...newEmployee, endContractDate: e.target.value})} className="p-2 rounded-md bg-gray-600 text-white" />
                    <input type="time" defaultValue={employee.startTime} onChange={(e) => setNewEmployee({...newEmployee, startTime: e.target.value})} className="p-2 rounded-md bg-gray-600 text-white" />
                    <input type="time" defaultValue={employee.exitTime} onChange={(e) => setNewEmployee({...newEmployee, exitTime: e.target.value})} className="p-2 rounded-md bg-gray-600 text-white" />
                    <input type="number" defaultValue={employee.salary} onChange={(e) => setNewEmployee({...newEmployee, salary: Number(e.target.value)})} className="p-2 rounded-md bg-gray-600 text-white" />
                    
                    <select
                      name="fk_idRoleEmployee"
                      value={newEmployee.fk_idRoleEmployee}
                      onChange={handleNewEmployeeChange}
                      className="p-2 rounded-md bg-gray-600 text-white"
                    >
                      {roles.map(role => (
                        <option key={role.idRoleEmployee} value={role.idRoleEmployee}>
                          {role.nameRole}
                        </option>
                      ))}
                    </select>

                    <select
                      name="fk_idPositionEmployee"
                      value={newEmployee.fk_idPositionEmployee}
                      onChange={handleNewEmployeeChange}
                      className="p-2 rounded-md bg-gray-600 text-white"
                    >
                      {positions.map(position => (
                        <option key={position.idPositionEmployee} value={position.idPositionEmployee}>
                          {position.namePosition}
                        </option>
                      ))}
                    </select>
                    
                    <div className="col-span-full flex justify-end gap-2 mt-4">
                      <button
                        onClick={() => updateEmployee(employee.idEmployee!, newEmployee)}
                        className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md flex items-center gap-1"
                      >
                        <Save size={16} />
                        Guardar
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded-md flex items-center gap-1"
                      >
                        <X size={16} />
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  // Vista de empleado
                  <>
                    <h3 className="text-lg font-semibold">{employee.fullName}</h3>
                    <p className="text-gray-400 text-sm">CI: {employee.ci}</p>
                    <p className="text-gray-400 text-sm">Teléfono: {employee.phoneNumber}</p>
                    <p className="text-gray-400 text-sm">Rol: {getRoleName(employee.fk_idRoleEmployee)}</p>
                    <p className="text-gray-400 text-sm">Posición: {getPositionName(employee.fk_idPositionEmployee)}</p>
                    <p className="text-gray-400 text-sm">Contrato: {employee.startContractDate} a {employee.endContractDate}</p>
                    <p className="text-gray-400 text-sm">Horario: {employee.startTime} - {employee.exitTime}</p>
                    <p className="text-gray-400 text-sm">Salario: ${employee.salary}</p>
                    <p className="text-gray-400 text-sm">Estatus: {employee.status ? 'Activo' : 'Inactivo'}</p>
                    <div className="flex justify-end gap-2 mt-4">
                      <button
                        onClick={() => {
                          setEditingId(employee.idEmployee!);
                          setNewEmployee(employee);
                        }}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white p-2 rounded-md flex items-center gap-1"
                      >
                        <Edit size={16} />
                        Editar
                      </button>
                      <button
                        onClick={() => deleteEmployee(employee.idEmployee!)}
                        className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-md flex items-center gap-1"
                      >
                        <Trash2 size={16} />
                        Eliminar
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

export default Employees;
