import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  UserPlus,
  Trash2,
  Edit,
  Save,
  Loader,
  X,
} from 'lucide-react';
import { ExportButton } from '../../components/ui/admin-buttons';
import { confirmDialog } from '../../utils/confirmDialog';
import noPhoto from '../../assets/noPhoto.png';


const API_URL = 'http://localhost:8000';
const PLACEHOLDER = noPhoto;

// ====== LOGO (según tu indicación) ======
const LOGO_URL = `${import.meta.env.BASE_URL}image/LogoHipica.png`;
const urlToDataUrl = (url: string) =>
  fetch(url)
    .then(r => r.blob())
    .then(
      blob =>
        new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        })
    );

// ====== Tipos ======
interface Employee {
  idEmployee?: number;
  fullName: string;
  ci: number;
  phoneNumber: number;
  startContractDate: string;
  endContractDate: string;
  startTime: string;
  exitTime: string;
  salary: number;
  status: boolean;
  fk_idPositionEmployee: number;
  uid?: string | null; // UUID de Supabase (cambiado de fk_idAuthUser a uid)
  image_url?: string | null;
}

interface Position {
  idPositionEmployee: number;
  namePosition: string;
}

interface UserAccountData {
  email: string;
  password: string;
  username: string;
  createAccount: boolean; // Flag para saber si se debe crear cuenta
}

// ====== Helpers ======
const formatTimeForInput = (isoDateString: string): string => {
  if (!isoDateString) return '';
  const date = new Date(isoDateString);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

// moneda BOB
const formatCurrency = (n: number) =>
  new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB', maximumFractionDigits: 2 })
    .format(n || 0);

const Employees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [newEmployee, setNewEmployee] = useState<Employee>({
    fullName: '',
    ci: 0,
    phoneNumber: 0,
    startContractDate: '',
    endContractDate: '',
    startTime: '',
    exitTime: '',
    salary: 0,
    status: true,
    fk_idPositionEmployee: 1,
    uid: null,
    image_url: null,
  });
  const [userAccount, setUserAccount] = useState<UserAccountData>({
    email: '',
    password: '',
    username: '',
    createAccount: false,
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [creatingAccount, setCreatingAccount] = useState<boolean>(false);

  // estado para exportación
  const [exporting, setExporting] = useState<boolean>(false);

  const getEmptyEmployee = (): Employee => ({
    fullName: '',
    ci: 0,
    phoneNumber: 0,
    startContractDate: '',
    endContractDate: '',
    startTime: '',
    exitTime: '',
    salary: 0,
    status: true,
    fk_idPositionEmployee: positions.length > 0 ? positions[0].idPositionEmployee : 0,
    uid: null,
    image_url: null,
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
    
    // Validar si se quiere crear cuenta
    if (!editingId && userAccount.createAccount) {
      if (!userAccount.email || !userAccount.password || !userAccount.username) {
        toast.error("Debe completar todos los campos de la cuenta de usuario");
        return;
      }
      
      if (userAccount.password.length < 6) {
        toast.error("La contraseña debe tener al menos 6 caracteres");
        return;
      }
    }
    
    try {
      setCreatingAccount(true);
      let authUserId: string | null = null;

      // 1. Crear cuenta de usuario en Supabase Auth + ERP User (solo si es nuevo empleado y checkbox está marcado)
      if (!editingId && userAccount.createAccount) {
        try {
          // Crear cuenta en backend (el backend manejará Supabase Auth y erp_user)
          const createAccountResponse = await fetch(`${API_URL}/employees/create-account`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: userAccount.email,
              password: userAccount.password,
              username: userAccount.username,
              fullName: newEmployee.fullName,
            }),
          });

          if (!createAccountResponse.ok) {
            const errorData = await createAccountResponse.json();
            throw new Error(errorData.detail || 'Error al crear cuenta de usuario');
          }

          const accountData = await createAccountResponse.json();
          authUserId = accountData.uid; // UID retornado por el backend
          
          toast.success(`Cuenta de usuario creada para ${userAccount.email}`);
        } catch (accountError: any) {
          toast.error(`Error al crear cuenta: ${accountError.message}`);
          setCreatingAccount(false);
          return; // No continuar si falla la creación de cuenta
        }
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
        uid: authUserId || newEmployee.uid, // Vincular con la cuenta creada (cambiado a uid)
        image_url: null, // Inicialmente null, se actualizará si se selecciona una foto
      };

      if (!newEmployee.fk_idPositionEmployee) {
        toast.error("Debe seleccionar una posición válida para el empleado.");
        setCreatingAccount(false);
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
      
      const savedEmployee = await response.json();

      if (selectedPhoto) {
        const id = editingId ?? savedEmployee.idEmployee;
        const formData = new FormData();
        formData.append('image', selectedPhoto);
        await fetch(`${API_URL}/employees/${id}/image`, {
          method: 'POST',
          body: formData,
        });
      }
      
      const successMessage = editingId 
        ? 'Empleado actualizado con éxito!' 
        : userAccount.createAccount 
          ? 'Empleado creado con cuenta de acceso!' 
          : 'Empleado creado con éxito!';
      
      toast.success(successMessage);
      
      // Resetear formularios
      setNewEmployee(getEmptyEmployee());
      setUserAccount({
        email: '',
        password: '',
        username: '',
        createAccount: false,
      });
      setEditingId(null);
      setSelectedPhoto(null);
      fetchData();
    } catch (error: any) {
      toast.error(`Ocurrió un error en la operación: ${error.message}`);
    } finally {
      setCreatingAccount(false);
    }
  };

  // Eliminar empleado
  const handleDelete = async (id: number) => {
    const confirmed = await confirmDialog({
      title: '¿Eliminar empleado?',
      description: 'Esta acción eliminará al empleado y todos sus datos asociados permanentemente.',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
    });
    if (!confirmed) return;
    try {
      const response = await fetch(`${API_URL}/employees/${id}`, { method: 'DELETE' });
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
    setNewEmployee({
      ...employee,
      startTime: formatTimeForInput(employee.startTime),
      exitTime: formatTimeForInput(employee.exitTime),
    });
    setSelectedPhoto(null);
    setEditingId(employee.idEmployee!);
  };

  const cancelEdit = () => {
    setNewEmployee(getEmptyEmployee());
    setUserAccount({
      email: '',
      password: '',
      username: '',
      createAccount: false,
    });
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

  // ====== Exportar PDF ======
  const exportEmployeesPDF = async () => {
    if (employees.length === 0) return;
    try {
      setExporting(true);

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // ====== Título centrado ======
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Planilla de Empleados", pageWidth / 2, 18, { align: "center" });

      // ====== Fecha y hora en la esquina izquierda ======
      const now = new Date();
      const fecha = now.toLocaleDateString("es-BO");
      const hora = now.toLocaleTimeString("es-BO", {
        hour: "2-digit",
        minute: "2-digit",
      });

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Fecha: ${fecha}  Hora: ${hora}`, 14, 28);

      // ====== Logo en la esquina derecha ======
      try {
        const logoDataUrl = await urlToDataUrl(LOGO_URL);
        if (logoDataUrl) {
          const isPng = logoDataUrl.startsWith("data:image/png");
          const isJpg =
            logoDataUrl.startsWith("data:image/jpeg") ||
            logoDataUrl.startsWith("data:image/jpg");
          const fmt = isPng ? "PNG" : isJpg ? "JPEG" : "PNG";

          const imgW = 22;
          const imgH = 22;
          const x = pageWidth - imgW - 14;
          const y = 10;
          try {
            doc.addImage(logoDataUrl, fmt as any, x, y, imgW, imgH);
          } catch {
            /* si falla, continuar sin logo */
          }
        }
      } catch {
        /* ignorar si falla */
      }

      // ====== Encabezados y filas ======
      const head = [["Empleado", "Cargo", "Sueldo"]];
      const body = employees.map((emp) => {
        const positionName =
          positions.find((p) => p.idPositionEmployee === emp.fk_idPositionEmployee)
            ?.namePosition || "Desconocido";
        return [
          emp.fullName,
          positionName,
          formatCurrency(Number(emp.salary || 0)),
        ];
      });

      // ====== Tabla ======
      autoTable(doc, {
        head,
        body,
        startY: 38, // debajo de la fecha
        theme: "grid",
        styles: {
          fontSize: 10,
          cellPadding: 2,
          textColor: [30, 30, 30],
          lineColor: [180, 180, 180],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [38, 72, 131], // color corporativo
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        tableLineColor: [200, 200, 200],
        tableLineWidth: 0.1,
      });

      // ====== Guardar PDF ======
      const fileName = `planilla_empleados_${now.toISOString().slice(0, 10)}.pdf`;
      doc.save(fileName);
      toast.success("PDF generado correctamente");
    } catch {
      toast.error("No se pudo generar el PDF");
    } finally {
      setExporting(false);
    }
  };


  return (
    <div  className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
      <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">Gestión de Empleados</h1>
      <form
        onSubmit={handleCreateOrUpdate}
       className="bg-white/5 p-6 rounded-2xl mb-8 text-[#F8F4E3]"
      >
  
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-teal-300">
            {editingId ? "Editar Empleado" : "Crear Nuevo Empleado"}
          </h2>

          <ExportButton
            onClick={exportEmployeesPDF}
            disabled={loading || exporting || employees.length === 0}
          >
            {exporting ? 'Exportando…' : 'Exportar PDF'}
          </ExportButton>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label htmlFor="fullName">Nombre Completo</label>
            <input type="text" placeholder="Nombre Completo" id="fullName" name="fullName" value={newEmployee.fullName} onChange={handleInputChange} className="w-full p-2 rounded-md bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500" required />
          </div>
          <div>
            <label htmlFor="ci">C.I.</label>
            <input type="number" placeholder="C.I." id="ci" name="ci" value={newEmployee.ci} onChange={handleInputChange} className="w-full p-2 rounded-md bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500" required />
          </div>
          <div>
            <label htmlFor="phoneNumber">Número de Teléfono</label>
            <input type="number" placeholder="Número de Teléfono" id="phoneNumber" name="phoneNumber" value={newEmployee.phoneNumber} onChange={handleInputChange} className="w-full p-2 rounded-md bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500" required />
          </div>
          <div>
            <label htmlFor="startContractDate">Fecha de Contrato (Inicio)</label>
            <input type="date" placeholder="Fecha de Contrato (Inicio)" id="startContractDate" name="startContractDate" value={newEmployee.startContractDate} onChange={handleInputChange} className="w-full p-2 rounded-md bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500" required />
          </div>
          <div>
            <label htmlFor="endContractDate">Fecha de Contrato (Fin)</label>
            <input type="date" placeholder="Fecha de Contrato (Fin)" id="endContractDate" name="endContractDate" value={newEmployee.endContractDate} onChange={handleInputChange} className="w-full p-2 rounded-md bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500" required />
          </div>
          <div>
            <label htmlFor="startTime">Hora de Entrada</label>
            <input type="time" placeholder="Hora de Entrada" id="startTime" name="startTime" value={newEmployee.startTime} onChange={handleInputChange} className="w-full p-2 rounded-md bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <div>
            <label htmlFor="exitTime">Hora de Salida</label>
            <input type="time" placeholder="Hora de Salida" id="exitTime" name="exitTime" value={newEmployee.exitTime} onChange={handleInputChange} className="w-full p-2 rounded-md bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <div>
            <label htmlFor="salary">Salario</label>
            <input
              type="number"
              placeholder="Salario"
              id="salary"
              name="salary"
              value={newEmployee.salary}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              inputMode="decimal"
              className="w-full p-2 rounded-md bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>
          <div>
            <label htmlFor="fk_idPositionEmployee">Posición</label>
            <select id="fk_idPositionEmployee" name="fk_idPositionEmployee" value={newEmployee.fk_idPositionEmployee} onChange={handleInputChange} className="w-full p-2 rounded-md bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-teal-500" required>
              {positions.map((position) => (
                <option key={position.idPositionEmployee} value={position.idPositionEmployee}>{position.namePosition}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="employeePhoto">Foto del Empleado</label>
            <input type="file" id="employeePhoto" name="employeePhoto" accept="image/*" onChange={handlePhotoChange} className="w-full p-2 text-white placeholder-slate-400" />
            {newEmployee.image_url && !selectedPhoto && (
              <img src={newEmployee.image_url} alt="Foto actual" className="w-16 h-16 rounded-full object-cover mt-2" />
            )}
            {selectedPhoto && (
              <img src={URL.createObjectURL(selectedPhoto)} alt="Nueva foto" className="w-16 h-16 rounded-full object-cover mt-2 border-2 border-teal-400" />
            )}
          </div>
        </div>

        {/* Sección de Cuenta de Usuario (solo al crear nuevo empleado) */}
        {!editingId && (
          <div className="mt-6 pt-6 border-t border-slate-600">
            <div className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                id="createAccount"
                checked={userAccount.createAccount}
                onChange={(e) => setUserAccount({ ...userAccount, createAccount: e.target.checked })}
                className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-teal-500 focus:ring-2 focus:ring-teal-500"
              />
              <label htmlFor="createAccount" className="text-lg font-semibold text-teal-300 cursor-pointer">
                ✨ Crear cuenta de acceso al sistema
              </label>
            </div>

            {userAccount.createAccount && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-800/50 p-4 rounded-lg border border-teal-500/30">
                <div>
                  <label htmlFor="username" className="text-sm text-slate-300">
                    Usuario <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="username"
                    placeholder="Ej: juan.perez"
                    value={userAccount.username}
                    onChange={(e) => setUserAccount({ ...userAccount, username: e.target.value })}
                    className="w-full p-2 rounded-md bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required={userAccount.createAccount}
                  />
                  <p className="text-xs text-slate-400 mt-1">Nombre de usuario para iniciar sesión</p>
                </div>

                <div>
                  <label htmlFor="email" className="text-sm text-slate-300">
                    Correo Electrónico <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    placeholder="empleado@ejemplo.com"
                    value={userAccount.email}
                    onChange={(e) => setUserAccount({ ...userAccount, email: e.target.value })}
                    className="w-full p-2 rounded-md bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required={userAccount.createAccount}
                  />
                  <p className="text-xs text-slate-400 mt-1">Se usará para recuperar contraseña</p>
                </div>

                <div>
                  <label htmlFor="password" className="text-sm text-slate-300">
                    Contraseña <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="password"
                    id="password"
                    placeholder="Mínimo 6 caracteres"
                    value={userAccount.password}
                    onChange={(e) => setUserAccount({ ...userAccount, password: e.target.value })}
                    className="w-full p-2 rounded-md bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required={userAccount.createAccount}
                    minLength={6}
                  />
                  <p className="text-xs text-slate-400 mt-1">Mínimo 6 caracteres</p>
                </div>

                <div className="md:col-span-3 bg-blue-900/30 border border-blue-500/30 rounded-lg p-3">
                  <p className="text-sm text-blue-200">
                   ℹ️ Al crear la cuenta, el empleado podrá iniciar sesión como <strong>Caballerizo</strong> y ver sus tareas asignadas.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Barra de acciones inferiores */}
        <div className="flex flex-wrap items-center gap-3 mt-6">
          <span className="text-sm bg-gray-700 px-3 py-1 rounded-md">
            Total: <b>{formatCurrency(employees.reduce((acc, e) => acc + Number(e.salary || 0), 0))}</b>
          </span>

          <div className="ml-auto flex gap-2">
            {editingId ? (
              <>
                <button 
                  type="submit" 
                  disabled={creatingAccount}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md shadow-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingAccount ? <Loader size={18} className="animate-spin" /> : <Save size={18} />}
                  {creatingAccount ? 'Guardando...' : 'Guardar Cambios'}
                </button>
                <button type="button" onClick={cancelEdit} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md shadow-md hover:bg-red-700 transition-colors"><X size={18} /> Cancelar</button>
              </>
            ) : (
              <button
                type="submit"
                aria-disabled={creatingAccount}
                className={`group relative ${creatingAccount ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="relative z-10 inline-flex w-full h-9 items-center justify-center overflow-hidden rounded-[23px] border border-[#3CC9F6]/70 bg-[#3CC9F6]/12 px-4 font-semibold text-[#3CC9F6] tracking-wide text-sm gap-2 shadow-[0_0_14px_rgba(60,201,246,0.35)] ring-1 ring-[#3CC9F6]/20 transition-all duration-300 group-hover:-translate-x-5 group-hover:-translate-y-5 group-active:translate-x-0 group-active:translate-y-0">
                  {creatingAccount ? <Loader size={18} className="animate-spin" /> : <UserPlus size={18} />}
                  {creatingAccount ? 'Creando...' : userAccount.createAccount ? 'Crear Empleado + Cuenta' : 'Agregar Empleado'}
                </div>
                <div className="absolute inset-0 z-0 h-full w-full rounded-[23px] bg-[#3CC9F6]/8 transition-all duration-300 group-hover:-translate-x-5 group-hover:-translate-y-5 group-hover:[box-shadow:7px_7px_rgba(60,201,246,0.6),14px_14px_rgba(60,201,246,0.4),21px_21px_rgba(60,201,246,0.2)] group-active:translate-x-0 group-active:translate-y-0 group-active:shadow-none" />
              </button>
            )}
          </div>
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
            <thead
              className="text-white"
              style={{
                background: "linear-gradient(90deg, #09203F 0%, #177e7a 100%)",
              }}
            >
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
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-slate-800 divide-y divide-slate-700">
              {employees.map((employee) => {
                const positionName = positions.find(p => p.idPositionEmployee === employee.fk_idPositionEmployee)?.namePosition || 'Desconocido';
                return (
                  <tr key={employee.idEmployee} className="hover:bg-slate-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <img
                        src={employee.image_url ?? PLACEHOLDER}
                        alt={`Foto de ${employee.fullName}`}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{employee.fullName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{employee.ci}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{employee.phoneNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{positionName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{formatCurrency(Number(employee.salary || 0))}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{employee.startTime ? new Date(employee.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{employee.exitTime ? new Date(employee.exitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{employee.startContractDate ? new Date(employee.startContractDate).toLocaleDateString() : 'N/A'} - {employee.endContractDate ? new Date(employee.endContractDate).toLocaleDateString() : 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-4">
                      <button
                        onClick={() => startEdit(employee)}
                        className="relative flex items-center justify-center w-15 h-15 rounded-[20px]
                                  bg-gradient-to-b from-[#1A1C1E] to-[#0E0F10]
                                  shadow-[8px_8px_16px_rgba(0,0,0,0.8),-5px_-5px_12px_rgba(255,255,255,0.07)]
                                  hover:scale-[1.08] active:shadow-[inset_5px_5px_12px_rgba(0,0,0,0.85),inset_-4px_-4px_10px_rgba(255,255,255,0.05)]
                                  transition-all duration-300 ease-in-out
                                  before:absolute before:inset-0 before:rounded-[20px]
                                  before:bg-gradient-to-b before:from-white/10 before:to-transparent before:opacity-25"
                      >
                        <Edit size={28} className="text-[#E8C967] drop-shadow-[0_0_6px_rgba(255,215,100,0.85)]" />
                      </button>
                      <button
                        onClick={() => handleDelete(employee.idEmployee!)}
                        className="relative flex items-center justify-center w-15 h-15 rounded-[20px]
                                  bg-gradient-to-b from-[#1A1C1E] to-[#0E0F10]
                                  shadow-[8px_8px_16px_rgba(0,0,0,0.8),-5px_-5px_12px_rgba(255,255,255,0.07)]
                                  hover:scale-[1.08] active:shadow-[inset_5px_5px_12px_rgba(0,0,0,0.85),inset_-4px_-4px_10px_rgba(255,255,255,0.05)]
                                  transition-all duration-300 ease-in-out
                                  before:absolute before:inset-0 before:rounded-[20px]
                                  before:bg-gradient-to-b before:from-white/10 before:to-transparent before:opacity-25"
                      >
                        <Trash2 size={28} className="text-[#E86B6B] drop-shadow-[0_0_7px_rgba(255,80,80,0.9)]" />
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
