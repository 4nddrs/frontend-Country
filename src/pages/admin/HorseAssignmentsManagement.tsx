import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-hot-toast";
import {
  Edit,
  Trash2,
  Loader,
  FileText,
} from "lucide-react";
import { confirmDialog } from '../../utils/confirmDialog';
import { AddButton, ExportButton, ClearButton, AdminSection, SaveButton, CancelButton } from '../../components/ui/admin-buttons';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";

const API_URL = "https://api.countryclub.doc-ia.cloud/horse_assignments/";
const EMPLOYEES_URL = "https://api.countryclub.doc-ia.cloud/employees/";
const HORSES_URL = "https://api.countryclub.doc-ia.cloud/horses/";

interface HorseAssignment {
  idHorseAssignments?: number;
  assignmentDate: string;
  endDate: string;
  fk_idEmployee: number;
  fk_idHorse: number;
  horse?: { idHorse: number; horseName: string };
  employee?: {
    idEmployee: number;
    fullName: string;
    employee_position?: {
      idPositionEmployee: number;
      namePosition: string;
    } | null;
  };
}

interface Horse {
  idHorse: number;
  horseName: string;
  state: string;
}

interface EmployeeLite {
  idEmployee: number;
  fullName: string;
  employee_position: {
    idPositionEmployee: number;
    namePosition: string;
  } | null;
}

const HorseAssignmentsManagement = () => {
  const [assignments, setAssignments] = useState<HorseAssignment[]>([]);
  const [horses, setHorses] = useState<Horse[]>([]);
  const [employees, setEmployees] = useState<EmployeeLite[]>([]);
  const [form, setForm] = useState({
    fk_idEmployee: "",
    fk_idHorse: "",
    assignmentDate: "",
    endDate: "",
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    fk_idEmployee: "",
    fk_idHorse: "",
    assignmentDate: "",
    endDate: "",
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);
  const [filterFrom, setFilterFrom] = useState<string>("");
  const [filterTo, setFilterTo] = useState<string>("");
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);

  const EXCLUDED_ROLES = ["secretaria", "administrador", "recepcionista"];

  // === Cargar datos y logo ===
  useEffect(() => {
    fetchAssignments();
    fetchHorses();
    fetchEmployees();

    const LOGO_URL = `${import.meta.env.BASE_URL}image/LogoHipica.png`;
    fetch(LOGO_URL)
      .then((r) => r.blob())
      .then((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => setLogoDataUrl(reader.result as string);
        reader.readAsDataURL(blob);
      })
      .catch(() => console.warn("No se pudo cargar el logo"));
  }, []);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}with_details`);
      if (!res.ok) throw new Error("Error al obtener asignaciones");
      const data = await res.json();
      const sorted = [...data].sort(
        (a: HorseAssignment, b: HorseAssignment) =>
          (b.idHorseAssignments ?? 0) - (a.idHorseAssignments ?? 0)
      );
      setAssignments(sorted);
    } catch {
      toast.error("No se pudo cargar asignaciones.");
    } finally {
      setLoading(false);
    }
  };

  const fetchHorses = async () => {
    try {
      const res = await fetch(HORSES_URL);
      if (!res.ok) throw new Error("Error al obtener caballos");
      const data: Horse[] = await res.json();
      const activos = data.filter(
        (h) => h.state !== "FALLECIDO" && h.state !== "AUSENTE"
      );
      setHorses(activos);
    } catch {
      // Silenciar error de carga
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch(EMPLOYEES_URL);
      if (!res.ok) throw new Error("Error al obtener empleados");
      const data: EmployeeLite[] = await res.json();

      const validEmployees = data.filter((emp) => {
        const role =
          emp.employee_position?.namePosition?.toLowerCase().trim() || "";
        return !EXCLUDED_ROLES.includes(role);
      });

      setEmployees(validEmployees);
    } catch (err) {
      console.error("Error cargando empleados:", err);
      // Silenciar error de carga
    }
  };

    // === Crear o actualizar ===
    const handleSubmit = async () => {
        // ✅ Validación campos vacíos
        if (
            !form.fk_idEmployee ||
            !form.fk_idHorse ||
            !form.assignmentDate ||
            !form.endDate
        ) {
            toast.error("Todos los campos marcados con * son obligatorios.");
            return;
        }

        // ✅ Validar roles prohibidos
        const emp = employees.find(
            (e) => e.idEmployee === Number(form.fk_idEmployee)
        );
        const role =
            emp?.employee_position?.namePosition?.toLowerCase().trim() || "";
        if (EXCLUDED_ROLES.includes(role)) {
            toast.error("🚫 Empleado no válido para asignación de caballos.");
            return;
        }

        // ✅ Validar caballo ya asignado
        const horseId = Number(form.fk_idHorse);
        const today = new Date();

        const isHorseAssigned = assignments.some((a) => {
            const horseMatch = a.horse?.idHorse === horseId;
            const endDate = new Date(a.endDate);
            const stillActive = endDate >= today;
            const differentRecord = !editingId || a.idHorseAssignments !== editingId;
            return horseMatch && stillActive && differentRecord;
        });

        if (isHorseAssigned) {
            toast.error("Este caballo ya está asignado a otro empleado actualmente.");
            return;
        }

        // ✅ Enviar solicitud
        try {
            const method = editingId ? "PUT" : "POST";
            const url = editingId ? `${API_URL}${editingId}` : API_URL;

            const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
            });

            if (!res.ok) throw new Error("Error al guardar asignación");

            toast.success(editingId ? "Asignación actualizada!" : "Asignación creada!");
            setForm({
            fk_idEmployee: "",
            fk_idHorse: "",
            assignmentDate: "",
            endDate: "",
            });
            setEditingId(null);
            fetchAssignments();
        } catch {
            toast.error("No se pudo guardar la asignación.");
        }
    };

    // === Cargar datos al editar ===
    const startEdit = (a: HorseAssignment) => {
        setEditingId(a.idHorseAssignments!);
        setEditForm({
            fk_idEmployee: a.employee?.idEmployee
            ? a.employee.idEmployee.toString()
            : "",
            fk_idHorse: a.horse?.idHorse ? a.horse.idHorse.toString() : "",
            assignmentDate: a.assignmentDate || "",
            endDate: a.endDate || "",
        });
    };

    const handleEditSubmit = async () => {
        if (!editForm.fk_idEmployee || !editForm.fk_idHorse || !editForm.assignmentDate || !editForm.endDate) {
            toast.error("Todos los campos marcados con * son obligatorios.");
            return;
        }
        const emp = employees.find((e) => e.idEmployee === Number(editForm.fk_idEmployee));
        const role = emp?.employee_position?.namePosition?.toLowerCase().trim() || "";
        if (EXCLUDED_ROLES.includes(role)) {
            toast.error("🚫 Empleado no válido para asignación de caballos.");
            return;
        }
        const horseId = Number(editForm.fk_idHorse);
        const today = new Date();
        const isHorseAssigned = assignments.some((a) => {
            const horseMatch = a.horse?.idHorse === horseId;
            const endDate = new Date(a.endDate);
            const stillActive = endDate >= today;
            const differentRecord = a.idHorseAssignments !== editingId;
            return horseMatch && stillActive && differentRecord;
        });
        if (isHorseAssigned) {
            toast.error("Este caballo ya está asignado a otro empleado actualmente.");
            return;
        }
        try {
            const res = await fetch(`${API_URL}${editingId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editForm),
            });
            if (!res.ok) throw new Error("Error al guardar asignación");
            toast.success("Asignación actualizada!");
            setEditingId(null);
            fetchAssignments();
        } catch {
            toast.error("No se pudo guardar la asignación.");
        }
    };


    // === Eliminar ===
    const deleteAssignment = async (id: number) => {
        const confirmed = await confirmDialog({
            title: "¿Eliminar asignación?",
            description: "Esta acción no se puede deshacer. ¿Deseas continuar?",
            confirmText: "Eliminar",
            cancelText: "Cancelar",
        });
        if (!confirmed) return;
        try {
        const res = await fetch(`${API_URL}${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Error al eliminar asignación");
        toast.success("Asignación eliminada!");
        fetchAssignments();
        } catch {
        toast.error("No se pudo eliminar la asignación.");
        }
    };

    // === Exportar PDF agrupado por cargo ===
    const exportPDF = async () => {
        try {
            setExporting(true);
            const doc = new jsPDF({ orientation: "portrait", unit: "pt" });

            // === Logo ===
            if (logoDataUrl) {
            const margin = 40;
            const w = 120;
            const h = 70;
            const pageW = doc.internal.pageSize.getWidth();
            doc.addImage(logoDataUrl, "PNG", pageW - w - margin, 30, w, h);
            }

            // === Título principal ===
            doc.setFont("helvetica", "bold");
            doc.setFontSize(16);
            doc.text(
            "CABALLERIZOS CANTIDAD DE CUIDADO DE CABALLOS",
            doc.internal.pageSize.getWidth() / 2,
            120, // 🔽 más abajo para mejor equilibrio
            { align: "center" }
            );

            // === Subtítulo (rango / general) ===
            doc.setFontSize(12);
            doc.text(
            filterFrom || filterTo
                ? `${filterFrom ? dayjs(filterFrom).format("DD/MM/YYYY") : "..."} — ${filterTo ? dayjs(filterTo).format("DD/MM/YYYY") : "..."}`
                : "REPORTE GENERAL",
            doc.internal.pageSize.getWidth() / 2,
            145,
            { align: "center" }
            );

            // === Fecha y hora ===
            const now = new Date();
            const fecha = now.toLocaleDateString("es-BO");
            const hora = now.toLocaleTimeString("es-BO", {
            hour: "2-digit",
            minute: "2-digit",
            });
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.text(`Fecha: ${fecha}  Hora: ${hora}`, 40, 165); // 🔽 bajada debajo del subtítulo

            // === Filtrar y agrupar datos ===
            const filtered = assignments.filter((a) => {
              const d = a.assignmentDate;
              if (filterFrom && d < filterFrom) return false;
              if (filterTo && d > filterTo) return false;
              return true;
            });

            const groupedByEmployee: Record<string, number> = {};
            filtered.forEach((a) => {
            const emp = a.employee?.fullName || "Desconocido";
            groupedByEmployee[emp] = (groupedByEmployee[emp] || 0) + 1;
            });

            const groupedByRole: Record<string, number> = {};
            filtered.forEach((a) => {
            const role = a.employee?.employee_position?.namePosition || "Sin Cargo";
            groupedByRole[role] = (groupedByRole[role] || 0) + 1;
            });

            const rows = Object.entries(groupedByEmployee).map(([name, count]) => [
            name,
            count.toString(),
            ]);

            // === Tabla principal ===
            autoTable(doc, {
            startY: 190, // 🔽 antes era 130 → baja la tabla
            head: [["EMPLEADO", "CABALLOS ASIGNADOS"]],
            body: rows,
            styles: { fontSize: 11, halign: "center", cellPadding: 6 },
            headStyles: {
                fillColor: [38, 72, 131],
                textColor: 255,
                fontStyle: "bold",
            },
            theme: "grid",
            });

            // === Totales ===
            let y = (doc as any).lastAutoTable.finalY + 35; // más espacio antes de los totales
            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            Object.entries(groupedByRole).forEach(([role, count]) => {
            doc.text(`TOTAL ${role.toUpperCase()}: ${count}`, 60, y);
            y += 20;
            });

            const totalCaballos = Object.values(groupedByEmployee).reduce(
            (acc, v) => acc + v,
            0
            );
            y += 10;
            doc.text(`TOTAL CABALLOS: ${totalCaballos}`, 60, y);

            // === Guardar ===
            const suffix = filterFrom
              ? `${dayjs(filterFrom).format("YYYY_MM_DD")}_${dayjs(filterTo || filterFrom).format("YYYY_MM_DD")}`
              : dayjs().format("YYYY_MM_DD");
            doc.save(`Caballerizos_${suffix}.pdf`);
            toast.success("PDF generado correctamente 🎉");
        } catch (e) {
            console.error(e);
            toast.error("No se pudo generar el PDF.");
        } finally {
            setExporting(false);
        }
    };


  // === UI ===
  return (
    <div  className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
      <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">Gestión de Asignaciones de Caballos</h1>

      {/* === FORM === */}
      <AdminSection>
        <h2 className="text-xl font-semibold mb-4 text-[#bdab62]">Nueva Asignación</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm text-gray-300 mb-1">
              Empleado <span className="text-red-500">*</span>
            </label>
            <select
              value={form.fk_idEmployee}
              onChange={(e) =>
                setForm({ ...form, fk_idEmployee: e.target.value })
              }
              className="w-full"
            >
              <option value="">Seleccionar Empleado</option>
              {employees.map((emp) => (
                <option key={emp.idEmployee} value={emp.idEmployee}>
                  {emp.fullName}{" "}
                  {emp.employee_position
                    ? `- ${emp.employee_position.namePosition}`
                    : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-300 mb-1">
              Caballo <span className="text-red-500">*</span>
            </label>
            <select
              value={form.fk_idHorse}
              onChange={(e) =>
                setForm({ ...form, fk_idHorse: e.target.value })
              }
              className="w-full"
            >
              <option value="">Seleccionar Caballo</option>
              {horses.map((h) => (
                <option key={h.idHorse} value={h.idHorse}>
                  {h.horseName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-300 mb-1">
              Fecha Asignación <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={form.assignmentDate}
              onChange={(e) =>
                setForm({ ...form, assignmentDate: e.target.value })
              }
              className="w-full"
            />
          </div>

          <div>
            <label className="text-sm text-gray-300 mb-1">
              Fecha Fin <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              className="w-full"
            />
          </div>
        </div>

        <div className="flex justify-end mt-4 gap-3">
          <AddButton onClick={handleSubmit} />
        </div>
      </AdminSection>

      {/* === FILTRO + BOTÓN PDF === */}
      <div className="bg-white/5 rounded-xl px-5 py-6 mb-6 shadow-inner">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <span className="text-base font-semibold text-teal-400 self-center whitespace-nowrap">Exportar Reporte</span>
          <div className="flex flex-wrap items-end gap-5 ml-auto">
          <div className="flex flex-col gap-1 px-5">
            <label className="text-xs text-gray-400">Desde</label>
            <input
              type="date"
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
              className="select-field w-44"
            />
          </div>
          <div className="flex flex-col gap-1 px-5">
            <label className="text-xs text-gray-400">Hasta</label>
            <input
              type="date"
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
              className="select-field w-44"
            />
          </div>
          <ExportButton onClick={exportPDF} disabled={exporting}>
            <FileText size={18} />
            {exporting ? "Generando..." : "Exportar PDF"}
          </ExportButton>
          <ClearButton onClick={() => { setFilterFrom(""); setFilterTo(""); }}>
            Limpiar
          </ClearButton>
          </div>
        </div>
      </div>

      {/* === TABLA === */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center text-gray-400 gap-2 text-lg">
            <Loader size={22} className="animate-spin" /> Cargando asignaciones...
          </div>
        ) : (
          <div className="overflow-x-auto bg-slate-800 rounded-lg shadow-xl border border-slate-700">
            <table className="w-full border-collapse text-sm text-left">
              <thead
                className="text-white"
                style={{
                  background: "linear-gradient(90deg, #09203F 0%, #177e7a 100%)",
                }}
              >
                <tr>
                  <th className="p-3 border border-slate-700">Caballo</th>
                  <th className="p-3 border border-slate-700">Empleado</th>
                  <th className="p-3 border border-slate-700">Cargo</th>
                  <th className="p-3 border border-slate-700">Fecha Asignación</th>
                  <th className="p-3 border border-slate-700">Fecha Fin</th>
                  <th className="p-3 border border-slate-700 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {assignments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-4 text-gray-400">
                      No hay asignaciones registradas.
                    </td>
                  </tr>
                ) : (
                  assignments.map((a) => (
                    <tr
                      key={a.idHorseAssignments}
                      className="hover:bg-slate-800 transition text-gray-200"
                    >
                      <td className="p-3 border border-slate-700">
                        {a.horse?.horseName || "—"}
                      </td>
                      <td className="p-3 border border-slate-700">
                        {a.employee?.fullName || "—"}
                      </td>
                      <td className="p-3 border border-slate-700">
                        {a.employee?.employee_position?.namePosition || "—"}
                      </td>
                      <td className="p-3 border border-slate-700">
                        {a.assignmentDate}
                      </td>
                      <td className="p-3 border border-slate-700">
                        {a.endDate}
                      </td>
                      <td className="p-3 border border-slate-700 text-center flex gap-6 justify-center">
                        <button
                          onClick={() => startEdit(a)}
                          className="relative flex items-center justify-center w-13 h-13 rounded-[20px]
                                      bg-gradient-to-b from-[#1A1C1E] to-[#0E0F10]
                                      shadow-[8px_8px_16px_rgba(0,0,0,0.85),-5px_-5px_12px_rgba(255,255,255,0.06)]
                                      hover:scale-[1.1]
                                      active:shadow-[inset_5px_5px_12px_rgba(0,0,0,0.9),inset_-4px_-4px_10px_rgba(255,255,255,0.05)]
                                      transition-all duration-300 ease-in-out"
                        >
                          <Edit size={28} className="text-[#E8C967] drop-shadow-[0_0_10px_rgba(255,215,100,0.85)] transition-transform duration-300 hover:rotate-3" />
                        </button>
                        <button
                          onClick={() => deleteAssignment(a.idHorseAssignments!)}
                          className="relative flex items-center justify-center w-13 h-13 rounded-[20px]
                                    bg-gradient-to-b from-[#1A1C1E] to-[#0E0F10]
                                    shadow-[8px_8px_16px_rgba(0,0,0,0.85),-5px_-5px_12px_rgba(255,255,255,0.06)]
                                    hover:scale-[1.1]
                                    active:shadow-[inset_5px_5px_12px_rgba(0,0,0,0.9),inset_-4px_-4px_10px_rgba(255,255,255,0.05)]
                                    transition-all duration-300 ease-in-out"
                        >
                        <Trash2 size={28} className="text-[#E86B6B] drop-shadow-[0_0_12px_rgba(255,80,80,0.9)] transition-transform duration-300 hover:-rotate-3" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingId !== null && createPortal(
        <div
          className="fixed inset-0 lg:left-80 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setEditingId(null)}
        >
          <div
            className="w-full max-w-2xl max-h-[95vh] overflow-y-auto rounded-2xl border border-[#167C79]/60 bg-[#0f172a] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.6)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-[#F8F4E3] mb-6">Editar Asignación</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-300 mb-1 block">Empleado <span className="text-red-500">*</span></label>
                <select value={editForm.fk_idEmployee} onChange={(e) => setEditForm({ ...editForm, fk_idEmployee: e.target.value })} className="w-full">
                  <option value="">Seleccionar Empleado</option>
                  {employees.map((emp) => (
                    <option key={emp.idEmployee} value={emp.idEmployee}>
                      {emp.fullName}{emp.employee_position ? ` - ${emp.employee_position.namePosition}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-1 block">Caballo <span className="text-red-500">*</span></label>
                <select value={editForm.fk_idHorse} onChange={(e) => setEditForm({ ...editForm, fk_idHorse: e.target.value })} className="w-full">
                  <option value="">Seleccionar Caballo</option>
                  {horses.map((h) => <option key={h.idHorse} value={h.idHorse}>{h.horseName}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-1 block">Fecha Asignación <span className="text-red-500">*</span></label>
                <input type="date" value={editForm.assignmentDate} onChange={(e) => setEditForm({ ...editForm, assignmentDate: e.target.value })} className="w-full" />
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-1 block">Fecha Fin <span className="text-red-500">*</span></label>
                <input type="date" value={editForm.endDate} onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })} className="w-full" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3 border-t border-slate-700 pt-4">
              <CancelButton onClick={() => setEditingId(null)} />
              <SaveButton onClick={handleEditSubmit} children="Guardar cambios" />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default HorseAssignmentsManagement;




