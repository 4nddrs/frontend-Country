import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  Plus,
  Edit,
  Save,
  Trash2,
  Loader,
  X,
  FileText,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";

const API_URL = "https://backend-country-nnxe.onrender.com/horse_assignments/";
const EMPLOYEES_URL = "https://backend-country-nnxe.onrender.com/employees/";
const HORSES_URL = "https://backend-country-nnxe.onrender.com/horses/";

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
  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);
  const [filterMonth, setFilterMonth] = useState<string>("");
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
      setAssignments(data);
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
      toast.error("No se pudieron cargar los caballos.");
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
      toast.error("No se pudieron cargar los empleados.");
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


    const cancelEdit = () => {
        setEditingId(null);
        setForm({
        fk_idEmployee: "",
        fk_idHorse: "",
        assignmentDate: "",
        endDate: "",
        });
    };

    // === Cargar datos al editar ===
    const startEdit = (a: HorseAssignment) => {
        setEditingId(a.idHorseAssignments!);
        setForm({
            fk_idEmployee: a.employee?.idEmployee
            ? a.employee.idEmployee.toString()
            : "",
            fk_idHorse: a.horse?.idHorse ? a.horse.idHorse.toString() : "",
            assignmentDate: a.assignmentDate || "",
            endDate: a.endDate || "",
        });
    };


    // === Eliminar ===
    const deleteAssignment = async (id: number) => {
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

            // === Subtítulo (mes / general) ===
            doc.setFontSize(12);
            doc.text(
            filterMonth
                ? `${dayjs(filterMonth).format("MMMM / YYYY").toUpperCase()}`
                : "REPORTE GENERAL",
            doc.internal.pageSize.getWidth() / 2,
            145, // 🔽 también más abajo
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
            const filtered = filterMonth
            ? assignments.filter((a) => a.assignmentDate.startsWith(filterMonth))
            : assignments;

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
            doc.save(
            `Caballerizos_${dayjs(filterMonth || new Date()).format("YYYY_MM")}.pdf`
            );
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
    <div className="bg-slate-900 p-6 rounded-lg shadow-xl border border-slate-700">
      <h1 className="text-3xl font-bold mb-6 text-center text-teal-400">
        Gestión de Asignaciones de Caballos
      </h1>

      {/* === FORM === */}
      <div className="bg-slate-800 p-6 rounded-lg shadow-lg mb-8 border border-slate-700">
        <h2 className="text-xl font-semibold mb-4 text-teal-400">
          {editingId ? "Editar Asignación" : "Nueva Asignación"}
        </h2>

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
              className="p-2 rounded-md bg-gray-700 text-white w-full"
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
              className="p-2 rounded-md bg-gray-700 text-white w-full"
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
              className="p-2 rounded-md bg-gray-700 text-white w-full"
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
              className="p-2 rounded-md bg-gray-700 text-white w-full"
            />
          </div>
        </div>

        <div className="flex justify-end mt-4 gap-3">
          {editingId ? (
            <>
              <button
                onClick={handleSubmit}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-semibold flex items-center gap-2"
              >
                <Save size={18} /> Guardar cambios
              </button>
              <button
                onClick={cancelEdit}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-semibold flex items-center gap-2"
              >
                <X size={18} /> Cancelar
              </button>
            </>
          ) : (
            <button
              onClick={handleSubmit}
              className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md font-semibold flex items-center gap-2"
            >
              <Plus size={18} /> Agregar
            </button>
          )}
        </div>
      </div>

      {/* === FILTRO + BOTÓN PDF === */}
      <div className="flex justify-end items-center gap-3 mb-6">
        <input
          type="month"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="p-2 rounded-md bg-gray-700 text-white"
        />
        <button
          onClick={exportPDF}
          disabled={exporting}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-md font-semibold flex items-center gap-2"
        >
          <FileText size={18} />
          {exporting ? "Generando..." : "Exportar PDF"}
        </button>
      </div>

      {/* === TABLA === */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center text-gray-400 gap-2 text-lg">
            <Loader size={22} className="animate-spin" /> Cargando asignaciones...
          </div>
        ) : (
          <table className="w-full border-collapse text-sm text-left">
            <thead
              className="text-white"
              style={{
                background: "linear-gradient(90deg, #09203F 0%, #1EAE98 100%)",
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
                    <td className="p-3 border border-slate-700 text-center flex gap-2 justify-center">
                      <button
                        onClick={() => startEdit(a)}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white p-2 rounded-md flex items-center gap-1"
                      >
                        <Edit size={16} /> Editar
                      </button>
                      <button
                        onClick={() => deleteAssignment(a.idHorseAssignments!)}
                        className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-md flex items-center gap-1"
                      >
                        <Trash2 size={16} /> Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default HorseAssignmentsManagement;
