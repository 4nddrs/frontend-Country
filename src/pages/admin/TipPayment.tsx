import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-hot-toast";
import { Edit, Trash2 } from "lucide-react";
import { AddButton, ExportButton, AdminSection, SaveButton, CancelButton } from '../../components/ui/admin-buttons';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";
import { confirmDialog } from '../../utils/confirmDialog';

const API_URL = "http://localhost:8000/tip_payments/";
const EMPLOYEES_URL = "http://localhost:8000/employees/";
const EXPENSES_URL = "http://localhost:8000/expenses/";

interface EmployeeLite {
  idEmployee: number;
  fullName: string;
  employee_position: {
    idPositionEmployee: number;
    namePosition: string;
  } | null;
}

interface TipPayment {
  idTipPayment: number;
  created_at: string;
  amount: number;
  state: string;
  registrationDate: string;
  paymentDate?: string | null;
  updateDate: string;
  description: string;
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

type TipPaymentCreate = {
  amount: number;
  state: string;
  paymentDate?: string | null;
  fk_idEmployee: number;
  description: string;
};

type TipPaymentUpdate = Partial<TipPaymentCreate> & {
  updateDate?: string;
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

// === helpers para montos ===
const normalizeInput = (raw: string): string => raw.replace(/[^\d.,]/g, "");

// Convierte texto en número decimal (interno)
const parseToNumber = (raw: string): number => {
  if (!raw) return 0;
  const cleaned = raw.replace(/\./g, "").replace(",", ".");
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100) / 100;
};

// Formatea visualmente para mostrar con puntos de miles y coma decimal
const formatDisplay = (num: number): string =>
  new Intl.NumberFormat("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);

/** ========= Componente ========= */
const TipPayment: React.FC = () => {
    const [items, setItems] = useState<TipPayment[]>([]);
    const [employees, setEmployees] = useState<EmployeeLite[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [saving, setSaving] = useState(false);
    const [amountInput, setAmountInput] = useState(""); // edit modal
    const [createAmountInput, setCreateAmountInput] = useState(""); // create form
    const [filterEmployee, setFilterEmployee] = useState<number>(0);
    const [filterState, setFilterState] = useState<string>("");

    //Estados para exportar PDF
    const [exporting, setExporting] = useState(false);
    const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
    const [filterMonth, setFilterMonth] = useState<string>("");

    // edit modal state
    const [form, setForm] = useState<TipPaymentCreate>({
        amount: 0,
        state: "",
        paymentDate: null,
        fk_idEmployee: 0,
        description: "",
    });

    // create form state
    const [createForm, setCreateForm] = useState<TipPaymentCreate>({
        amount: 0,
        state: "",
        paymentDate: null,
        fk_idEmployee: 0,
        description: "",
    });

    // si editingRow ≠ null → estamos editando
    const [editingRow, setEditingRow] = useState<TipPayment | null>(null);

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

    // ====== Función para exportar PDF filtrado ======
    const exportFilteredPDF = async () => {
        try {
        setExporting(true);
        const doc = new jsPDF({ orientation: "landscape", unit: "pt" });

        // Logo
        if (logoDataUrl) {
            const margin = 40;
            const w = 120;
            const h = 70;
            const pageW = doc.internal.pageSize.getWidth();
            doc.addImage(logoDataUrl, "PNG", pageW - w - margin, 20, w, h);
        }

        let titulo = "Reporte de Propinas";

        if (filterMonth) {
            const [year, month] = filterMonth.split("-");
            const fecha = new Date(Number(year), Number(month) - 1);
            const mesNombre = fecha.toLocaleDateString("es-ES", { month: "long" });
            titulo = `Reporte de Propinas - ${mesNombre} ${year}`;
        }

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

        // aplicar filtros
        let filtered = [...items];
        if (filterEmployee > 0) {
            filtered = filtered.filter((p) => p.fk_idEmployee === filterEmployee);
        }
        if (filterState) {
            filtered = filtered.filter((p) => p.state === filterState);
        }
        if (filterMonth) {
            filtered = filtered.filter(
            (p) => p.paymentDate && p.paymentDate.startsWith(filterMonth)
            );
        }

        // construir tabla
        const total = filtered.reduce((acc, p) => acc + p.amount, 0);

        const body = filtered.map((p, i) => [
            i + 1,
            p.employee?.fullName || "—",
            p.employee?.employee_position?.namePosition || "—",
            p.paymentDate
            ? new Date(p.paymentDate).toLocaleDateString("es-BO")
            : "—",
            formatDisplay(p.amount) + " Bs",
            p.description || "—",
            "",
        ]);

        autoTable(doc, {
            startY: 110,
            theme: "striped",
            head: [
            [
                "NRO.",
                "NOMBRE",
                "CARGO",
                "FECHA DE PAGO",
                "MONTO Bs.",
                "DESCRIPCIÓN",
                "FIRMA",
            ],
            ],
            body,
            styles: { fontSize: 9, cellPadding: 6 },
            headStyles: {
            fillColor: [38, 72, 131],
            textColor: [255, 255, 255],
            fontStyle: "bold",
            },
            foot: [
            [
                {
                content: "TOTAL",
                colSpan: 5,
                styles: { halign: "right", fontStyle: "bold" },
                },
                {
                content: formatDisplay(total) + " Bs",
                styles: { halign: "center", fontStyle: "bold" },
                },
            ],
            ],
            footStyles: {
            fillColor: [38, 72, 131],
            textColor: [255, 255, 255],
            },
        });

        doc.save(`Propinas_Filtradas_${dayjs().format("YYYYMMDD_HHmm")}.pdf`);
        toast.success("PDF generado.");
        } catch (e) {
        console.error(e);
        toast.error("No se pudo generar el PDF.");
        } finally {
        setExporting(false);
        }
    };

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
        const normalizedPayments: TipPayment[] = dataPayments.map((p: any) => ({
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
    }, []);

    // === Manejo input amount (edit modal) ===
    const handleAmountChange = (raw: string) => {
        const cleaned = normalizeInput(raw);
        const num = parseToNumber(cleaned);
        setAmountInput(cleaned);
        setForm((prev) => ({ ...prev, amount: num }));
    };

    // === Manejo input amount (create form) ===
    const handleCreateAmountChange = (raw: string) => {
        const cleaned = normalizeInput(raw);
        const num = parseToNumber(cleaned);
        setCreateAmountInput(cleaned);
        setCreateForm((prev) => ({ ...prev, amount: num }));
    };

    function onChangeForm<K extends keyof TipPaymentCreate>(
        key: K,
        value: TipPaymentCreate[K]
    ) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    function onChangeCreateForm<K extends keyof TipPaymentCreate>(
        key: K,
        value: TipPaymentCreate[K]
    ) {
        setCreateForm((prev) => ({ ...prev, [key]: value }));
    }

    function resetEditForm() {
        setForm({ amount: 0, state: "", paymentDate: null, fk_idEmployee: 0, description: "" });
        setAmountInput("");
        setEditingRow(null);
    }

    function resetForm() {
        setCreateForm({ amount: 0, state: "", paymentDate: null, fk_idEmployee: 0, description: "" });
        setCreateAmountInput("");
    }

    async function maybeRegisterExpense(payment: TipPayment) {
        if (payment.state !== "PAGADO") return;

        const expensePayload = {
        date: new Date().toISOString().split("T")[0],
        description: `Pago de Propina del mes ${monthLabel(payment.paymentDate)}`,
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
        if (!createForm.state.trim()) return toast.error("Estado es requerido.");
        if (!createForm.fk_idEmployee) return toast.error("Empleado es requerido.");

        setSaving(true);
        const payload: TipPaymentCreate = {
            ...createForm,
            amount: Math.round(createForm.amount * 100) / 100,
        };

        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`POST ${res.status}`);
        const created: TipPayment = await res.json();

        setItems((prev) => [
            { ...created, amount: Number(created.amount) },
            ...prev,
        ]);
        await maybeRegisterExpense(created);

        setCreateForm({ amount: 0, state: "", paymentDate: null, fk_idEmployee: 0, description: "" });
        setCreateAmountInput("");
        toast.success("Propina creada!");
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
        const payload: TipPaymentUpdate = {
            amount: Math.round(form.amount * 100) / 100,
            state: form.state,
            paymentDate: form.paymentDate,
            fk_idEmployee: form.fk_idEmployee,
            description: form.description,
        };

        const res = await fetch(`${API_URL}${editingRow.idTipPayment}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`PUT ${res.status}`);
        const updated: TipPayment = await res.json();

        setItems((prev) =>
            prev.map((x) =>
            x.idTipPayment === updated.idTipPayment
                ? { ...updated, amount: Number(updated.amount) }
                : x
            )
        );
        
        resetEditForm();
        toast.success("Propina actualizada!");
        } catch (e: any) {
        toast.error(`Error al actualizar: ${e.message}`);
        } finally {
        setSaving(false);
        }
    }

    async function deleteItem(id: number) {
        const confirmed = await confirmDialog({
          title: '¿Eliminar propina?',
          description: 'Esta acción eliminará el registro de propina permanentemente.',
          confirmText: 'Sí, eliminar',
          cancelText: 'Cancelar',
        });
        if (!confirmed) return;
        try {
        const res = await fetch(`${API_URL}${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error(`DELETE ${res.status}`);
        setItems((prev) => prev.filter((x) => x.idTipPayment !== id));
        toast.success("Propina eliminada!");
        } catch (e: any) {
        toast.error(`Error al eliminar: ${e.message}`);
        }
    }

    return (
        <div  className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
            <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">Gestión de Propinas</h1>
            

            {/* Formulario crear */}
            <AdminSection>
            <h2 className="text-xl font-semibold mb-4">Agregar Propina</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                <label>Monto (Bs)</label>
                <input type="text" placeholder="0,00" value={createAmountInput} onChange={(e) => handleCreateAmountChange(e.target.value)} className="select-field w-full text-white" />
                </div>
                <div>
                <label>Estado de Propina</label>
                <select value={createForm.state} onChange={(e) => onChangeCreateForm("state", e.target.value)} className="select-field w-full text-white">
                    <option value="">Estado…</option>
                    <option value="PAGADO">Pagado</option>
                    <option value="PENDIENTE">Pendiente</option>
                    <option value="ANULADO">Anulado</option>
                </select>
                </div>
                <div>
                <label>Fecha de Pago</label>
                <input type="date" value={createForm.paymentDate ?? ""} onChange={(e) => onChangeCreateForm("paymentDate", e.target.value || null)} className="select-field w-full text-white" />
                </div>
                <div>
                <label>Empleado</label>
                <select value={createForm.fk_idEmployee} onChange={(e) => onChangeCreateForm("fk_idEmployee", Number(e.target.value))} className="select-field w-full text-white">
                    <option value={0}>Empleado…</option>
                    {employees.map((emp) => (
                    <option key={emp.idEmployee} value={emp.idEmployee}>{emp.fullName}</option>
                    ))}
                </select>
                </div>
                <div>
                <label>Descripción</label>
                <input type="text" placeholder="Motivo de la propina" value={createForm.description || ""} onChange={(e) => onChangeCreateForm("description", e.target.value)} className="select-field w-full text-white" />
                </div>
            </div>

            <div className="mt-4 text-right">
                <AddButton onClick={createItem} disabled={saving} />
            </div>
            </AdminSection>

            {/* Tabla de Propinas */}
            <AdminSection>
                <h2 className="text-xl font-semibold mb-2">Propinas registradas</h2>
                <div className="overflow-x-auto bg-slate-800 rounded-lg shadow-xl border border-slate-700">
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
                            <tr key={row.idTipPayment} className="border-t border-gray-600 text-center align-middle px-6 py-4">
                            <td className="p-2">{row.idTipPayment}</td>
                            <td className="p-2">{row.employee?.fullName ?? "❌ sin nombre"}</td>
                            <td className="p-2">
                                {row.employee?.employee_position?.namePosition ??
                                "❌ sin cargo"}
                            </td>
                            <td className="p-2">{formatDisplay(row.amount)} Bs</td>
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
                                        description: row.description,
                                        });
                                        // Carga limpio, sin puntos de miles, pero con coma decimal
                                        setAmountInput(
                                        formatDisplay(row.amount).replace(/\./g, "").replace(",", ",")
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
                                    onClick={() => deleteItem(row.idTipPayment)}
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
            </AdminSection>

            {/* Sección de filtros para PDF */}
            <AdminSection>
            <h2 className="text-xl font-semibold mb-4">Exportar PDF de Propinas</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                <label>Empleado</label>
                <select
                    value={filterEmployee}
                    onChange={(e) => setFilterEmployee(Number(e.target.value))}
                    className="select-field w-full text-white"
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
                    className="select-field w-full text-white"
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
                    className="select-field w-full text-white"
                />
                </div>
            </div>

            <div className="text-right">
                <ExportButton
                onClick={exportFilteredPDF}
                disabled={exporting || items.length === 0}
                >
                {exporting ? "Exportando..." : "Exportar PDF"}
                </ExportButton>
            </div>
            </AdminSection>

            {/* Tabla de Expenses */}
            <AdminSection>
                <h2 className="text-xl font-semibold mb-2">
                    Registros en Egresos (Propinas)
                </h2>
                <div className="overflow-x-auto bg-slate-800 rounded-lg shadow-xl border border-slate-700">
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
                            .filter((ex) => ex.description?.startsWith("Pago de Propina"))
                            .map((ex) => (
                            <tr key={ex.idExpenses} className="border-t border-gray-600">
                                <td className="p-2">{ex.idExpenses}</td>
                                <td className="p-2">{fmtDateView(ex.date)}</td>
                                <td className="p-2">{ex.description}</td>
                                <td className="p-2">{formatDisplay(ex.AmountBsCaptureType)} Bs</td>
                                <td className="p-2">{fmtDateView(ex.period)}</td>
                            </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </AdminSection>

      {editingRow && createPortal(
        <div
          className="fixed inset-0 lg:left-80 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={resetEditForm}
        >
          <div
            className="w-full max-w-2xl max-h-[95vh] overflow-y-auto rounded-2xl border border-[#167C79]/60 bg-[#0f172a] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.6)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-[#F8F4E3] mb-6">Editar Propina</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1">Monto (Bs)</label>
                <input type="text" placeholder="0,00" value={amountInput} onChange={(e) => handleAmountChange(e.target.value)} className="select-field w-full text-white" />
              </div>
              <div>
                <label className="block mb-1">Estado de Propina</label>
                <select value={form.state} onChange={(e) => onChangeForm("state", e.target.value)} className="select-field w-full text-white">
                  <option value="">Estado…</option>
                  <option value="PAGADO">Pagado</option>
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="ANULADO">Anulado</option>
                </select>
              </div>
              <div>
                <label className="block mb-1">Fecha de Pago</label>
                <input type="date" value={form.paymentDate ?? ""} onChange={(e) => onChangeForm("paymentDate", e.target.value || null)} className="select-field w-full text-white" />
              </div>
              <div>
                <label className="block mb-1">Empleado</label>
                <select value={form.fk_idEmployee} onChange={(e) => onChangeForm("fk_idEmployee", Number(e.target.value))} className="select-field w-full text-white">
                  <option value={0}>Empleado…</option>
                  {employees.map((emp) => (
                    <option key={emp.idEmployee} value={emp.idEmployee}>{emp.fullName}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block mb-1">Descripción</label>
                <input type="text" placeholder="Motivo de la propina" value={form.description || ""} onChange={(e) => onChangeForm("description", e.target.value)} className="select-field w-full text-white" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3 border-t border-slate-700 pt-4">
              <CancelButton onClick={resetEditForm} />
              <SaveButton onClick={updateItem} disabled={saving} children="Guardar cambios" />
            </div>
          </div>
        </div>,
        document.body
      )}
        </div>
        );


};

export default TipPayment;



