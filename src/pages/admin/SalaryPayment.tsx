import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Edit, Plus, Save, Trash2, X } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";

const API_URL = "https://backend-country-nnxe.onrender.com/salary_payments/";
const EMPLOYEES_URL = "https://backend-country-nnxe.onrender.com/employees/";
const EXPENSES_URL = "https://backend-country-nnxe.onrender.com/expenses/";

interface EmployeeLite {
  idEmployee: number;
  fullName: string;
  employee_position: {
    idPositionEmployee: number;
    namePosition: string;
  } | null;
}

interface SalaryPayment {
  idSalaryPayment: number;
  created_at: string;
  amount: number;
  state: string;
  registrationDate: string;
  paymentDate?: string | null;
  updateDate: string;
  fk_idEmployee: number;
  employee?: EmployeeLite | null;
}

interface Expense {
  idExpenses: number;
  created_at: string;
  date: string;
  description: string;
  AmountBsCaptureType: number;
  period: string;
}

type SalaryPaymentCreate = {
  amount: number;
  state: string;
  paymentDate?: string | null;
  fk_idEmployee: number;
};

type SalaryPaymentUpdate = Partial<SalaryPaymentCreate> & {
  updateDate?: string;
};

/** ========= Utils ========= */
const normalizeInput = (raw: string): string => {
  return raw.replace(/[^\d.,]/g, ""); 
};

const parseToNumber = (raw: string): number => {
  if (!raw) return 0;
  const cleaned = raw.replace(/\./g, "").replace(",", ".");
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100) / 100; 
};

function fmtDateView(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return isNaN(d.getTime()) ? value : d.toLocaleDateString();
}

function monthLabel(dateStr: string | null | undefined): string {
  if (!dateStr) return "sin fecha";
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
}

/** ========= Componente ========= */
const SalaryPayments: React.FC = () => {
  const [items, setItems] = useState<SalaryPayment[]>([]);
  const [employees, setEmployees] = useState<EmployeeLite[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [saving, setSaving] = useState(false);
  const [amountInput, setAmountInput] = useState(""); 
  const [filterEmployee, setFilterEmployee] = useState<number>(0);
  const [filterState, setFilterState] = useState<string>("");

  const [exporting, setExporting] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [filterMonth, setFilterMonth] = useState<string>("");

  const [form, setForm] = useState<SalaryPaymentCreate>({
    amount: 0,
    state: "",
    paymentDate: null,
    fk_idEmployee: 0,
  });

  const [editingRow, setEditingRow] = useState<SalaryPayment | null>(null);

  // ===== Manejo del input numérico =====
  const handleAmountChange = (raw: string) => {
    const cleaned = normalizeInput(raw);
    const num = parseToNumber(cleaned);

    setAmountInput(cleaned);
    setForm((prev) => ({ ...prev, amount: num }));
  };

  function resetForm() {
    setForm({ amount: 0, state: "", paymentDate: null, fk_idEmployee: 0 });
    setAmountInput("");
    setEditingRow(null);
  }

  async function load() {
    try {
      const [resPayments, resEmployees, resExpenses] = await Promise.all([
        fetch(API_URL, { headers: { Accept: "application/json" } }),
        fetch(EMPLOYEES_URL, { headers: { Accept: "application/json" } }),
        fetch(EXPENSES_URL, { headers: { Accept: "application/json" } }),
      ]);

      if (!resPayments.ok) throw new Error("GET payments failed");
      if (!resEmployees.ok) throw new Error("GET employees failed");
      if (!resExpenses.ok) throw new Error("GET expenses failed");

      const dataPayments = await resPayments.json();
      const normalizedPayments: SalaryPayment[] = dataPayments.map((p: any) => ({
        ...p,
        amount: Number(p.amount),
        employee: p.employee,
      }));

      setItems(normalizedPayments);
      setEmployees(await resEmployees.json());
      setExpenses(await resExpenses.json());
    } catch (e: any) {
      toast.error(`Error al cargar: ${e.message}`);
    }
  }

  useEffect(() => {
    load();

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

  async function maybeRegisterExpense(payment: SalaryPayment) {
    if (payment.state !== "PAGADO") return;

    const expensePayload = {
      date: new Date().toISOString().split("T")[0],
      description: `Pago de salario del mes ${monthLabel(payment.paymentDate)}`,
      AmountBsCaptureType: payment.amount,
      period: payment.paymentDate ?? new Date().toISOString().split("T")[0],
    };

    try {
      const res = await fetch(EXPENSES_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expensePayload),
      });
      if (!res.ok) throw new Error(`POST expense ${res.status}`);
      toast.success("Registrado en expenses");
      load();
    } catch (e: any) {
      toast.error(`Error registrando expense: ${e.message}`);
    }
  }

  async function createItem() {
    try {
      if (!form.state.trim()) return toast.error("Estado es requerido.");
      if (!form.fk_idEmployee) return toast.error("Empleado es requerido.");

      setSaving(true);
      const payload: SalaryPaymentCreate = {
        ...form,
        amount: Math.round(form.amount * 100) / 100,
      };

      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`POST ${res.status}`);
      const created: SalaryPayment = await res.json();

      setItems((prev) => [
        { ...created, amount: Number(created.amount) },
        ...prev,
      ]);
      await maybeRegisterExpense(created);

      resetForm();
      toast.success("¡Pago creado!");
    } catch (e: any) {
      toast.error(`Error al crear: ${e.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function updateItem() {
    if (!editingRow) return;
    try {
      setSaving(true);
      const payload: SalaryPaymentUpdate = {
        amount: Math.round(form.amount * 100) / 100,
        state: form.state,
        paymentDate: form.paymentDate,
        fk_idEmployee: form.fk_idEmployee,
      };

      const res = await fetch(`${API_URL}${editingRow.idSalaryPayment}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`PUT ${res.status}`);
      const updated: SalaryPayment = await res.json();

      setItems((prev) =>
        prev.map((x) =>
          x.idSalaryPayment === updated.idSalaryPayment
            ? { ...updated, amount: Number(updated.amount) }
            : x
        )
      );

      resetForm();
      toast.success("¡Pago actualizado!");
    } catch (e: any) {
      toast.error(`Error al actualizar: ${e.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(id: number) {
    try {
      const res = await fetch(`${API_URL}${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`DELETE ${res.status}`);
      setItems((prev) => prev.filter((x) => x.idSalaryPayment !== id));
      toast.success("¡Pago eliminado!");
    } catch (e: any) {
      toast.error(`Error al eliminar: ${e.message}`);
    }
  }

  function onChangeForm<K extends keyof SalaryPaymentCreate>(
    key: K,
    value: SalaryPaymentCreate[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  //Exportar PDF filtrado
  const exportFilteredPDF = async () => {
    try {
      setExporting(true);
      const doc = new jsPDF({ orientation: "landscape", unit: "pt" });

      // Agregar logo si está disponible
      if (logoDataUrl) {
        const margin = 40;
        const w = 120;
        const h = 70;
        const pageW = doc.internal.pageSize.getWidth();
        doc.addImage(logoDataUrl, "PNG", pageW - w - margin, 20, w, h);
      }

      let titulo = "Reporte de Salarios";
      if (filterMonth) {
        const [year, month] = filterMonth.split("-");
        const fecha = new Date(Number(year), Number(month) - 1);
        const mesNombre = fecha.toLocaleDateString("es-ES", { month: "long" });
        titulo = `Reporte de Salarios - ${mesNombre} ${year}`;
      }

      // Configurar título
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(titulo, doc.internal.pageSize.getWidth() / 2, 50, {
        align: "center",
      });

      // ====== Fecha y hora en la esquina izquierda ======
      const now = new Date();
      const fecha = now.toLocaleDateString("es-BO");
      const hora = now.toLocaleTimeString("es-BO", {
      hour: "2-digit",
      minute: "2-digit",
      });

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Fecha: ${fecha}  Hora: ${hora}`, 40, 70);

      // Filtrar registros
      let filtered = [...items];
      if (filterEmployee > 0)
        filtered = filtered.filter((p) => p.fk_idEmployee === filterEmployee);
      if (filterState)
        filtered = filtered.filter((p) => p.state === filterState);
      if (filterMonth)
        filtered = filtered.filter(
          (p) => p.paymentDate && p.paymentDate.startsWith(filterMonth)
        );

      const total = filtered.reduce((acc, p) => acc + p.amount, 0);

      const body = filtered.map((p, i) => [
        i + 1,
        p.employee?.fullName || "—",
        p.employee?.employee_position?.namePosition || "—",
        p.paymentDate
          ? new Date(p.paymentDate).toLocaleDateString("es-BO")
          : "—",
        new Intl.NumberFormat("es-BO", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(p.amount) + " Bs",
        "",
      ]);

      // 🎨 Estilo corporativo azul
      const corporateBlue: [number, number, number] = [38, 72, 131];

      autoTable(doc, {
        startY: 110,
        head: [["#", "Empleado", "Cargo", "Fecha de Pago", "Monto Bs.", "Firma"]],
        body,
        styles: { fontSize: 9, cellPadding: 6 },
        headStyles: {
          fillColor: corporateBlue,
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        foot: [
          [
            { content: "TOTAL", colSpan: 4, styles: { halign: "right", fontStyle: "bold" } },
            {
              content:
                new Intl.NumberFormat("es-BO", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(total) + " Bs",
              styles: { halign: "center", fontStyle: "bold" },
            },
            { content: "", styles: { halign: "center" } },
          ],
        ],
        footStyles: {
          fillColor: corporateBlue,
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
      });

      doc.save(`Salarios_${dayjs().format("YYYYMMDD_HHmm")}.pdf`);
      toast.success("PDF generado correctamente");
    } catch (e) {
      toast.error("Error al generar PDF");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="bg-slate-900 p-6 rounded-lg shadow-xl mb-8 border border-slate-700">
      <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">Gestión de Pagos de Salario</h1>
      
      {/* Formulario único */}
      <div className="bg-slate-800 p-6 rounded-lg shadow-xl mb-8 border border-slate-700">
        <h2 className="text-xl font-semibold mb-4 text-teal-400">
          {editingRow ? "Editar Pago" : "Agregar Pago"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Monto */}
          <div>
            <label className="text-sm mb-1 block">Monto (Bs)</label>
            <input
              type="text"
              placeholder="0,00"
              value={amountInput}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="p-2 rounded bg-gray-700 text-white w-full"
            />
          </div>

          {/* Estado */}
          <div>
            <label className="text-sm mb-1 block">Estado de Pago</label>
            <select
              value={form.state}
              onChange={(e) => onChangeForm("state", e.target.value)}
              className="p-2 rounded bg-gray-700 text-white w-full"
            >
              <option value="">Estado…</option>
              <option value="PAGADO">Pagado</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="ANULADO">Anulado</option>
            </select>
          </div>

          {/* Fecha */}
          <div>
            <label className="text-sm mb-1 block">Fecha de Pago</label>
            <input
              type="date"
              value={form.paymentDate ?? ""}
              onChange={(e) =>
                onChangeForm("paymentDate", e.target.value || null)
              }
              className="p-2 rounded bg-gray-700 text-white w-full"
            />
          </div>

          {/* Empleado */}
          <div>
            <label className="text-sm mb-1 block">Empleado</label>
            <select
              value={form.fk_idEmployee}
              onChange={(e) =>
                onChangeForm("fk_idEmployee", Number(e.target.value))
              }
              className="p-2 rounded bg-gray-700 text-white w-full"
            >
              <option value={0}>Empleado…</option>
              {employees.map((emp) => (
                <option key={emp.idEmployee} value={emp.idEmployee}>
                  {emp.fullName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Botones */}
        <div className="mt-4 text-right">
          {editingRow ? (
            <>
              <button
                onClick={updateItem}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white inline-flex items-center gap-2"
              >
                <Save size={18} /> Guardar cambios
              </button>
              <button
                onClick={resetForm}
                className="ml-2 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-white inline-flex items-center gap-2"
              >
                <X size={18} /> Cancelar
              </button>
            </>
          ) : (
            <button
              onClick={createItem}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white inline-flex items-center gap-2"
            >
              <Plus size={18} /> Agregar
            </button>
          )}
        </div>
      </div>

      {/* Tabla de Pagos */}
      <div className="bg-slate-800 p-6 rounded-lg shadow-xl mb-8 border border-slate-700">
        <h2 className="text-xl font-semibold mb-2 text-teal-400">
          Pagos Registrados
        </h2>

        <table className="w-full text-sm mb-8">
          <thead
              className="text-white"
              style={{
                background: "linear-gradient(90deg, #09203F 0%, #177e7a 100%)",
              }}
          >
            <tr>
              <th className="p-2">ID</th>
              <th className="p-2">Empleado</th>
              <th className="p-2">Cargo</th>
              <th className="p-2">Monto</th>
              <th className="p-2">Estado</th>
              <th className="p-2">Fecha Pago</th>
              <th className="p-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.idSalaryPayment} className="border-t border-gray-600 text-center align-middle px-6 py-4">
                <td className="p-2">{row.idSalaryPayment}</td>
                <td className="p-2">{row.employee?.fullName ?? "—"}</td>
                <td className="p-2">
                  {row.employee?.employee_position?.namePosition ?? "—"}
                </td>
                <td className="p-2">
                  {new Intl.NumberFormat("es-BO", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(row.amount)}{" "}
                  Bs
                </td>
                <td className="p-2">{row.state}</td>
                <td className="p-2">{fmtDateView(row.paymentDate)}</td>
                <td className="p-2 border-t border-gray-600 align-middle text-center">
                  <div className="flex items-center justify-center gap-6">
                    <button
                      onClick={() => {
                        setEditingRow(row);
                        setForm({
                          amount: row.amount,
                          state: row.state,
                          paymentDate: row.paymentDate ?? null,
                          fk_idEmployee: row.fk_idEmployee,
                        });
                        setAmountInput(
                          new Intl.NumberFormat("es-BO", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }).format(row.amount)
                        );
                      }}
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
                      onClick={() => deleteItem(row.idSalaryPayment)}
                      className="relative flex items-center justify-center w-13 h-13 rounded-[20px]
                                    bg-gradient-to-b from-[#1A1C1E] to-[#0E0F10]
                                    shadow-[8px_8px_16px_rgba(0,0,0,0.85),-5px_-5px_12px_rgba(255,255,255,0.06)]
                                    hover:scale-[1.1]
                                    active:shadow-[inset_5px_5px_12px_rgba(0,0,0,0.9),inset_-4px_-4px_10px_rgba(255,255,255,0.05)]
                                    transition-all duration-300 ease-in-out"
                    >
                      <Trash2 size={28} className="text-[#E86B6B] drop-shadow-[0_0_12px_rgba(255,80,80,0.9)] transition-transform duration-300 hover:-rotate-3" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Exportar PDF */}
      <div className="bg-slate-800 p-6 rounded-lg shadow-xl mb-8 border border-slate-700">
        <h2 className="text-xl font-semibold mb-4 text-teal-400">
          Exportar PDF de Salarios
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label>Empleado</label>
            <select
              value={filterEmployee}
              onChange={(e) => setFilterEmployee(Number(e.target.value))}
              className="p-2 rounded bg-gray-700 text-white w-full"
            >
              <option value={0}>Todos</option>
              {employees.map((emp) => (
                <option key={emp.idEmployee} value={emp.idEmployee}>
                  {emp.fullName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Estado</label>
            <select
              value={filterState}
              onChange={(e) => setFilterState(e.target.value)}
              className="p-2 rounded bg-gray-700 text-white w-full"
            >
              <option value="">Todos</option>
              <option value="PAGADO">Pagado</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="ANULADO">Anulado</option>
            </select>
          </div>

          <div>
            <label>Mes</label>
            <input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="p-2 rounded bg-gray-700 text-white w-full"
            />
          </div>
        </div>

        <div className="text-right">
          <button
            onClick={exportFilteredPDF}
            disabled={exporting || items.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 py-3 text-lg rounded-xl font-semibold shadow-md hover:shadow-lg transition"
          >
            {exporting ? "Exportando..." : "Exportar PDF"}
          </button>
        </div>
      </div>

      {/* Tabla de Expenses */}
      <div className="bg-slate-800 p-6 rounded-lg shadow-xl mb-8 border border-slate-700">
        <h2 className="text-xl font-semibold mb-2 text-teal-400">
          Registros en Expenses
        </h2>
        <table className="w-full text-sm">
          <thead
              className="text-white"
              style={{
                background: "linear-gradient(90deg, #09203F 0%, #177e7a 100%)",
              }}
          >
            <tr>
              <th className="p-2">ID</th>
              <th className="p-2">Fecha</th>
              <th className="p-2">Descripción</th>
              <th className="p-2">Monto</th>
              <th className="p-2">Periodo</th>
            </tr>
          </thead>
          <tbody>
            {expenses
              .filter((ex) => ex.description?.startsWith("Pago de salario"))
              .map((ex) => (
                <tr key={ex.idExpenses} className="border-t border-gray-600">
                  <td className="p-2">{ex.idExpenses}</td>
                  <td className="p-2">{fmtDateView(ex.date)}</td>
                  <td className="p-2">{ex.description}</td>
                  <td className="p-2">
                    {new Intl.NumberFormat("es-BO", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(ex.AmountBsCaptureType)}{" "}
                    Bs
                  </td>
                  <td className="p-2">{fmtDateView(ex.period)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );

};

export default SalaryPayments;