import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  UserPlus,
  Trash2,
  Edit,
  Loader,
  Upload,
  RotateCcw,
} from 'lucide-react';
import { ExportButton, SaveButton, CancelButton } from '../../components/ui/admin-buttons';
import { confirmDialog } from '../../utils/confirmDialog';
import noPhoto from '../../assets/noPhoto.png';


const API_URL = 'https://api.countryclub.doc-ia.cloud';
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
  const [editingData, setEditingData] = useState<Employee | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<File | null>(null);
  const [creatingAccount, setCreatingAccount] = useState<boolean>(false);

  const newFileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [newPreviewUrl, setNewPreviewUrl] = useState<string | null>(null);
  const [newProgress, setNewProgress] = useState<number>(0);
  const [newDragOver, setNewDragOver] = useState<boolean>(false);
  const [editPreviewUrl, setEditPreviewUrl] = useState<string | null>(null);
  const [editProgress, setEditProgress] = useState<number>(0);
  const [editDragOver, setEditDragOver] = useState<boolean>(false);

  // estado para exportación
  const [exporting, setExporting] = useState<boolean>(false);

  const isEditModalOpen = editingId !== null && editingData !== null;

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

      setEmployees([...employeesData].sort((a: Employee, b: Employee) => (b.idEmployee ?? 0) - (a.idEmployee ?? 0)));
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

  // Escape key closes edit modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isEditModalOpen) {
        handleCancelEdit();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isEditModalOpen]);

  // Crear empleado (solo desde el formulario principal)
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (Number(newEmployee.salary) >= 100000) {
      toast.error("El salario debe ser menor a 100,000 BOB");
      return;
    }

    // Validar si se quiere crear cuenta
    if (userAccount.createAccount) {
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

      // 1. Crear cuenta de usuario en Supabase Auth + ERP User (solo si checkbox está marcado)
      if (userAccount.createAccount) {
        try {
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
          authUserId = accountData.uid;

          toast.success(`Cuenta de usuario creada para ${userAccount.email}`);
        } catch (accountError: any) {
          toast.error(`Error al crear cuenta: ${accountError.message}`);
          setCreatingAccount(false);
          return;
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
        uid: authUserId || newEmployee.uid,
        image_url: null,
      };

      if (!newEmployee.fk_idPositionEmployee) {
        toast.error("Debe seleccionar una posición válida para el empleado.");
        setCreatingAccount(false);
        return;
      }

      const response = await fetch(`${API_URL}/employees/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employeeData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error: ${response.status} - ${errorText}`);
      }

      const savedEmployee = await response.json();

      if (selectedPhoto) {
        const formData = new FormData();
        formData.append('image', selectedPhoto);
        await fetch(`${API_URL}/employees/${savedEmployee.idEmployee}/image`, {
          method: 'POST',
          body: formData,
        });
      }

      const successMessage = userAccount.createAccount
        ? 'Empleado creado con cuenta de acceso!'
        : 'Empleado creado con éxito!';

      toast.success(successMessage);

      setNewEmployee(getEmptyEmployee());
      setUserAccount({ email: '', password: '', username: '', createAccount: false });
      clearNewFile();
      fetchData();
    } catch (error: any) {
      toast.error(`Ocurrió un error en la operación: ${error.message}`);
    } finally {
      setCreatingAccount(false);
    }
  };

  // Actualizar empleado (desde el modal)
  const handleUpdate = async () => {
    if (!editingId || !editingData) return;
    if (Number(editingData.salary) >= 100000) {
      toast.error("El salario debe ser menor a 100,000 BOB");
      return;
    }
    try {
      setCreatingAccount(true);

      const employeeData = {
        ...editingData,
        phoneNumber: Number(editingData.phoneNumber),
        salary: Number(editingData.salary),
        startTime: editingData.startContractDate
          ? `${editingData.startContractDate}T${editingData.startTime || '08:00'}:00`
          : '',
        exitTime: editingData.endContractDate
          ? `${editingData.endContractDate}T${editingData.exitTime || '17:00'}:00`
          : '',
        image_url: editingData.image_url ?? null,
      };

      if (!editingData.fk_idPositionEmployee) {
        toast.error("Debe seleccionar una posición válida para el empleado.");
        setCreatingAccount(false);
        return;
      }

      const response = await fetch(`${API_URL}/employees/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employeeData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error: ${response.status} - ${errorText}`);
      }

      if (editingPhoto) {
        const formData = new FormData();
        formData.append('image', editingPhoto);
        await fetch(`${API_URL}/employees/${editingId}/image`, {
          method: 'POST',
          body: formData,
        });
      }

      toast.success('Empleado actualizado con éxito!');
      setEditingId(null);
      setEditingData(null);
      clearEditFile();
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

  // Modo edición — abre modal
  const startEdit = (employee: Employee) => {
    setEditingData({
      ...employee,
      startTime: formatTimeForInput(employee.startTime),
      exitTime: formatTimeForInput(employee.exitTime),
    });
    clearEditFile();
    setEditingId(employee.idEmployee!);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingData(null);
    clearEditFile();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let newValue: string | number | boolean = value;
    if (name === "ci" || name === "phoneNumber") {
      const digits = value.replace(/\D/g, '').slice(0, 8);
      newValue = digits === '' ? 0 : Number(digits);
    } else if (type === "number") {
      newValue = value === '' ? 0 : Number(value);
    } else if (name === "status") {
      newValue = (e.target as HTMLInputElement).checked;
    }
    setNewEmployee({ ...newEmployee, [name]: newValue });
  };

  const handleEditingDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!editingData) return;
    const { name, value, type } = e.target;
    let newValue: string | number | boolean = value;
    if (name === "ci" || name === "phoneNumber") {
      const digits = value.replace(/\D/g, '').slice(0, 8);
      newValue = digits === '' ? 0 : Number(digits);
    } else if (type === "number") {
      newValue = value === '' ? 0 : Number(value);
    } else if (name === "status") {
      newValue = (e.target as HTMLInputElement).checked;
    }
    setEditingData({ ...editingData, [name]: newValue });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const animateProgress = (setProgress: (v: number) => void) => {
    setProgress(0);
    let p = 0;
    const iv = setInterval(() => {
      p += 4;
      setProgress(Math.min(p, 100));
      if (p >= 100) clearInterval(iv);
    }, 25);
  };

  const applyNewFile = (file: File) => {
    setSelectedPhoto(file);
    setNewPreviewUrl(URL.createObjectURL(file));
    animateProgress(setNewProgress);
  };

  const clearNewFile = () => {
    setSelectedPhoto(null);
    setNewPreviewUrl(null);
    setNewProgress(0);
    if (newFileInputRef.current) newFileInputRef.current.value = '';
  };

  const applyEditFile = (file: File) => {
    setEditingPhoto(file);
    setEditPreviewUrl(URL.createObjectURL(file));
    animateProgress(setEditProgress);
  };

  const clearEditFile = () => {
    setEditingPhoto(null);
    setEditPreviewUrl(null);
    setEditProgress(0);
    if (editFileInputRef.current) editFileInputRef.current.value = '';
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) applyNewFile(file);
  };

  const handleEditingPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) applyEditFile(file);
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
        startY: 38,
        theme: "grid",
        styles: {
          fontSize: 10,
          cellPadding: 2,
          textColor: [30, 30, 30],
          lineColor: [180, 180, 180],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [38, 72, 131],
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
        onSubmit={handleCreate}
       className="bg-white/5 p-6 rounded-2xl mb-8 text-[#F8F4E3]"
      >

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-teal-300">
            Crear Nuevo Empleado
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label htmlFor="fullName">Nombre Completo</label>
            <input type="text" placeholder="" id="fullName" name="fullName" value={newEmployee.fullName} onChange={handleInputChange} className="w-full p-2 rounded-md bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500" required />
          </div>
          <div>
            <label htmlFor="ci">C.I.</label>
            <input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="" id="ci" name="ci" value={newEmployee.ci === 0 ? '' : String(newEmployee.ci)} onChange={handleInputChange} maxLength={8} className="w-full p-2 rounded-md bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500" required />
          </div>
          <div>
            <label htmlFor="phoneNumber">Número de Teléfono</label>
            <input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="" id="phoneNumber" name="phoneNumber" value={newEmployee.phoneNumber === 0 ? '' : String(newEmployee.phoneNumber)} onChange={handleInputChange} maxLength={8} className="w-full p-2 rounded-md bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500" required />
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
              placeholder=""
              id="salary"
              name="salary"
              value={newEmployee.salary === 0 ? '' : newEmployee.salary}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              max={99999.99}
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
            <label className="block mb-1 text-sm font-medium text-slate-300">Foto del Empleado</label>
            <div
              onDragOver={(e) => { e.preventDefault(); setNewDragOver(true); }}
              onDragLeave={() => setNewDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setNewDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) applyNewFile(f); }}
              className={`rounded-xl border-2 border-dashed transition-all duration-200 ${newDragOver ? 'border-[#167C79] bg-[#167C79]/15' : 'border-[#167C79]/40 bg-slate-800/60'}`}
            >
              {!(selectedPhoto && newPreviewUrl) && (
                <div className="text-center cursor-pointer py-6 px-4" onClick={() => newFileInputRef.current?.click()}>
                  <button type="button" className="flex items-center gap-1.5 mx-auto rounded-lg bg-[#167C79]/20 border border-[#167C79]/50 px-4 py-2 text-sm font-medium text-teal-300 hover:bg-[#167C79]/30 transition-colors">
                    <Upload size={15} className="shrink-0" />
                    Arrastra y suelta para subir
                  </button>
                </div>
              )}
              {selectedPhoto && newPreviewUrl && (
                <div className="px-4 pb-4 flex justify-center">
                  <div className="w-full max-w-sm rounded-xl border border-slate-600/50 bg-slate-800/80 p-3">
                    <div className="flex items-center gap-3">
                      <img src={newPreviewUrl} alt="preview" className="h-10 w-10 rounded-lg object-cover border border-slate-600/50 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#F8F4E3] truncate">{selectedPhoto.name}</p>
                        <p className="text-xs text-slate-400">{formatFileSize(selectedPhoto.size)}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button type="button" onClick={() => newFileInputRef.current?.click()} className="text-slate-400 hover:text-teal-300 transition-colors"><RotateCcw size={15} /></button>
                        <button type="button" onClick={clearNewFile} className="text-slate-400 hover:text-red-400 transition-colors"><Trash2 size={15} /></button>
                      </div>
                    </div>
                    <div className="mt-2.5 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-75 ${newProgress < 34 ? 'bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.8)]' : newProgress < 67 ? 'bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.8)]' : 'bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]'}`} style={{ width: `${newProgress}%` }} />
                      </div>
                      <span className={`text-xs shrink-0 w-12 text-right font-medium ${newProgress < 34 ? 'text-rose-300' : newProgress < 67 ? 'text-amber-300' : 'text-emerald-300'}`}>{newProgress} %</span>
                    </div>
                  </div>
                </div>
              )}
              <input type="file" accept="image/*" ref={newFileInputRef} onChange={handlePhotoChange} className="hidden" />
            </div>
          </div>
        </div>

        {/* Sección de Cuenta de Usuario (solo al crear nuevo empleado) */}
        <div className="mt-6 pt-6 border-t border-slate-600">
          <div className="flex items-center gap-4 mb-4">
            <button
              type="button"
              role="switch"
              aria-checked={userAccount.createAccount}
              onClick={() => setUserAccount({ ...userAccount, createAccount: !userAccount.createAccount })}
              className="relative w-24 h-10 shrink-0 cursor-pointer rounded-full overflow-hidden focus:outline-none shadow-[4px_4px_14px_rgba(0,0,0,0.9),inset_2px_2px_6px_rgba(0,0,0,0.6)]"
              style={{
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: userAccount.createAccount ? '#9333ea' : '#7a7a7a',
                transition: 'border-color 550ms cubic-bezier(0.4,0,0.2,1)',
              }}
            >
              {/* Fondo — color animado con style inline garantizado */}
              <span
                className="absolute inset-0"
                style={{
                  backgroundColor: userAccount.createAccount ? '#7e22ce' : '#7a7a7a',
                  boxShadow: userAccount.createAccount
                    ? 'inset 0 0 22px rgba(168,85,247,0.55)'
                    : 'inset 0 0 22px rgba(161, 161, 161, 0.55)',
                  transition: 'background-color 550ms cubic-bezier(0.4,0,0.2,1), box-shadow 550ms cubic-bezier(0.4,0,0.2,1)',
                }}
              />

              {/* "off" fijo a la izquierda */}
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white text-xs font-bold tracking-wide select-none pointer-events-none z-10">
                off
              </span>

              {/* "on" fijo a la derecha */}
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white text-xs font-bold tracking-wide select-none pointer-events-none z-10">
                on
              </span>

              {/* Knob — un solo eje left para animación continua real */}
              <span
                className="absolute top-1/2 -translate-y-1/2 h-8 w-10 rounded-full z-20 bg-gradient-to-b from-[#32353a] to-[#0c0d0f] shadow-[4px_4px_12px_rgba(0,0,0,0.95),-2px_-2px_7px_rgba(255,255,255,0.06),inset_0_1px_0_rgba(255,255,255,0.07)]"
                style={{
                  left: userAccount.createAccount ? 'calc(100% - 2.625rem)' : '0.125rem',
                  transition: 'left 550ms cubic-bezier(0.4,0,0.2,1)',
                }}
              >
                {/* Punto indicador de color */}
                <span
                  className="absolute top-[6px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor: userAccount.createAccount ? '#c084fc' : '#7a7a7a',
                    boxShadow: userAccount.createAccount
                      ? '0 0 5px rgba(168,85,247,0.9)'
                      : '0 0 5px rgba(161, 161, 161, 0.55)',
                    transition: 'background-color 550ms cubic-bezier(0.4,0,0.2,1), box-shadow 550ms cubic-bezier(0.4,0,0.2,1)',
                  }}
                />
                {/* Ranuras verticales */}
                <span className="absolute inset-0 flex items-center justify-center gap-[4px] pt-3">
                  {[0, 1, 2, 3].map(i => (
                    <span key={i} className="block h-3 w-[2px] rounded-full bg-slate-500/55" />
                  ))}
                </span>
              </span>
            </button>
            <label
              className="text-lg font-semibold cursor-pointer select-none"
              onClick={() => setUserAccount({ ...userAccount, createAccount: !userAccount.createAccount })}
            >
              <span className={`transition-colors duration-300 ${userAccount.createAccount ? 'text-purple-300 drop-shadow-[0_0_6px_rgba(168,85,247,0.8)]' : 'text-slate-400'}`}>
                Crear cuenta de acceso al sistema
              </span>
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

        {/* Barra de acciones inferiores */}
        <div className="flex flex-wrap items-center gap-3 mt-6">
          <div className="ml-auto flex gap-2">
            <ExportButton
              onClick={exportEmployeesPDF}
              disabled={loading || exporting || employees.length === 0}
            >
              {exporting ? 'Exportando…' : 'Exportar PDF'}
            </ExportButton>
            <button
              type="submit"
              aria-disabled={creatingAccount}
              className={`group relative ${creatingAccount ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="relative z-10 inline-flex w-full h-9 items-center justify-center overflow-hidden rounded-[10px] border border-[#3CC9F6]/70 bg-[#3CC9F6]/12 px-8 font-semibold text-[#3CC9F6] tracking-wide text-sm gap-2 shadow-[0_0_14px_rgba(60,201,246,0.35)] ring-1 ring-[#3CC9F6]/20 transition-all duration-300 group-hover:-translate-x-5 group-hover:-translate-y-5 group-active:translate-x-0 group-active:translate-y-0">
                {creatingAccount ? <Loader size={18} className="animate-spin" /> : <UserPlus size={18} />}
                {creatingAccount ? 'Creando...' : userAccount.createAccount ? 'Crear Empleado + Cuenta' : 'Agregar Empleado'}
              </div>
              <div className="absolute inset-0 z-0 h-full w-full rounded-[10px] bg-[#3CC9F6]/8 transition-all duration-300 group-hover:-translate-x-5 group-hover:-translate-y-5 group-hover:[box-shadow:7px_7px_rgba(60,201,246,0.6),14px_14px_rgba(60,201,246,0.4),21px_21px_rgba(60,201,246,0.2)] group-active:translate-x-0 group-active:translate-y-0 group-active:shadow-none" />
            </button>
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

      {/* Modal de edición */}
      {isEditModalOpen && editingData && createPortal(
        <div
          className="fixed inset-0 lg:left-80 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={handleCancelEdit}
        >
          <div
            className="w-full max-w-4xl max-h-[95vh] overflow-y-auto rounded-2xl border border-[#167C79]/60 bg-[#0f172a] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.6)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-[#F8F4E3]">Editar Empleado</h3>
                <p className="text-sm text-slate-400">Actualiza los datos del empleado.</p>
              </div>
              <button onClick={handleCancelEdit} className="rounded-lg border border-slate-500 px-3 py-1.5 text-slate-300 hover:bg-slate-800">
                Cerrar
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label htmlFor="edit-fullName" className="block mb-1 text-sm text-slate-300">Nombre Completo</label>
                <input
                  type="text"
                  id="edit-fullName"
                  name="fullName"
                  value={editingData.fullName}
                  onChange={handleEditingDataChange}
                  className="w-full p-2 rounded-md bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label htmlFor="edit-ci" className="block mb-1 text-sm text-slate-300">C.I.</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  id="edit-ci"
                  name="ci"
                  value={editingData.ci === 0 ? '' : String(editingData.ci)}
                  onChange={handleEditingDataChange}
                  maxLength={8}
                  className="w-full p-2 rounded-md bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label htmlFor="edit-phoneNumber" className="block mb-1 text-sm text-slate-300">Número de Teléfono</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  id="edit-phoneNumber"
                  name="phoneNumber"
                  value={editingData.phoneNumber === 0 ? '' : String(editingData.phoneNumber)}
                  onChange={handleEditingDataChange}
                  maxLength={8}
                  className="w-full p-2 rounded-md bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label htmlFor="edit-startContractDate" className="block mb-1 text-sm text-slate-300">Fecha de Contrato (Inicio)</label>
                <input
                  type="date"
                  id="edit-startContractDate"
                  name="startContractDate"
                  value={editingData.startContractDate}
                  onChange={handleEditingDataChange}
                  className="w-full p-2 rounded-md bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label htmlFor="edit-endContractDate" className="block mb-1 text-sm text-slate-300">Fecha de Contrato (Fin)</label>
                <input
                  type="date"
                  id="edit-endContractDate"
                  name="endContractDate"
                  value={editingData.endContractDate}
                  onChange={handleEditingDataChange}
                  className="w-full p-2 rounded-md bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label htmlFor="edit-startTime" className="block mb-1 text-sm text-slate-300">Hora de Entrada</label>
                <input
                  type="time"
                  id="edit-startTime"
                  name="startTime"
                  value={editingData.startTime}
                  onChange={handleEditingDataChange}
                  className="w-full p-2 rounded-md bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label htmlFor="edit-exitTime" className="block mb-1 text-sm text-slate-300">Hora de Salida</label>
                <input
                  type="time"
                  id="edit-exitTime"
                  name="exitTime"
                  value={editingData.exitTime}
                  onChange={handleEditingDataChange}
                  className="w-full p-2 rounded-md bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label htmlFor="edit-salary" className="block mb-1 text-sm text-slate-300">Salario</label>
                <input
                  type="number"
                  id="edit-salary"
                  name="salary"
                  value={editingData.salary === 0 ? '' : editingData.salary}
                  onChange={handleEditingDataChange}
                  step="0.01"
                  min="0"
                  max={99999.99}
                  inputMode="decimal"
                  className="w-full p-2 rounded-md bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label htmlFor="edit-fk_idPositionEmployee" className="block mb-1 text-sm text-slate-300">Posición</label>
                <select
                  id="edit-fk_idPositionEmployee"
                  name="fk_idPositionEmployee"
                  value={editingData.fk_idPositionEmployee}
                  onChange={handleEditingDataChange}
                  className="w-full p-2 rounded-md bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {positions.map((position) => (
                    <option key={position.idPositionEmployee} value={position.idPositionEmployee}>{position.namePosition}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="block mb-1 text-sm font-medium text-slate-300">Foto del Empleado</label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setEditDragOver(true); }}
                  onDragLeave={() => setEditDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setEditDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) applyEditFile(f); }}
                  className={`rounded-xl border-2 border-dashed transition-all duration-200 ${editDragOver ? 'border-[#167C79] bg-[#167C79]/15' : 'border-[#167C79]/40 bg-slate-800/60'}`}
                >
                  {!editingPhoto && (
                    <div className="text-center cursor-pointer py-6 px-4" onClick={() => editFileInputRef.current?.click()}>
                      <button type="button" className="flex items-center gap-1.5 mx-auto rounded-lg bg-[#167C79]/20 border border-[#167C79]/50 px-4 py-2 text-sm font-medium text-teal-300 hover:bg-[#167C79]/30 transition-colors">
                        <Upload size={15} className="shrink-0" />
                        Arrastra y suelta para subir
                      </button>
                    </div>
                  )}
                  {editingPhoto && editPreviewUrl && (
                    <div className="mx-4 mb-4 mt-2">
                      <div className="rounded-xl border border-slate-600/50 bg-slate-800/80 p-3">
                        <div className="flex items-center gap-3">
                          <img src={editPreviewUrl} alt="preview" className="h-10 w-10 rounded-lg object-cover border border-slate-600/50 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#F8F4E3] truncate">{editingPhoto.name}</p>
                            <p className="text-xs text-slate-400">{formatFileSize(editingPhoto.size)}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button type="button" onClick={() => editFileInputRef.current?.click()} className="text-slate-400 hover:text-teal-300 transition-colors"><RotateCcw size={15} /></button>
                            <button type="button" onClick={clearEditFile} className="text-slate-400 hover:text-red-400 transition-colors"><Trash2 size={15} /></button>
                          </div>
                        </div>
                        <div className="mt-2.5 flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-75 ${editProgress < 34 ? 'bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.8)]' : editProgress < 67 ? 'bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.8)]' : 'bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]'}`} style={{ width: `${editProgress}%` }} />
                          </div>
                          <span className={`text-xs shrink-0 w-12 text-right font-medium ${editProgress < 34 ? 'text-rose-300' : editProgress < 67 ? 'text-amber-300' : 'text-emerald-300'}`}>{editProgress} %</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <input type="file" accept="image/*" ref={editFileInputRef} onChange={handleEditingPhotoChange} className="hidden" />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-700 pt-4">
              <CancelButton onClick={handleCancelEdit} />
              <SaveButton onClick={() => handleUpdate()}>Guardar cambios</SaveButton>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Employees;
