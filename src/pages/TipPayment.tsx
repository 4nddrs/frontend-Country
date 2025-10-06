import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Plus, Save, X } from "lucide-react";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import dayjs from 'dayjs';


const API_URL = "https://backend-country-nnxe.onrender.com/tip_payments/";
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


/** ========= Componente ========= */
const SalaryPayments: React.FC = () => {
    const [items, setItems] = useState<TipPayment[]>([]);
    const [employees, setEmployees] = useState<EmployeeLite[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [saving, setSaving] = useState(false);
    const [amountInput, setAmountInput] = useState("");
    const [filterEmployee, setFilterEmployee] = useState<number>(0);
    const [filterState, setFilterState] = useState<string>("");

    //Estados para exportar PDF
    const [exporting, setExporting] = useState(false);
    const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
    const [filterMonth, setFilterMonth] = useState<string>("");


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
            doc.text(titulo, doc.internal.pageSize.getWidth() / 2, 50, { align: "center" });

            // aplicar filtros
            let filtered = [...items];
            if (filterEmployee > 0) {
                filtered = filtered.filter((p) => p.fk_idEmployee === filterEmployee);
            }
            if (filterState) {
                filtered = filtered.filter((p) => p.state === filterState);
            }
            if (filterMonth) {
                // Solo registros cuyo paymentDate empieza con YYYY-MM
                filtered = filtered.filter((p) => p.paymentDate && p.paymentDate.startsWith(filterMonth));
            }


            // construir tabla
            const total = filtered.reduce((acc, p) => acc + p.amount, 0);

            const body = filtered.map((p, i) => [
                i + 1,
                p.employee?.fullName || "—",
                p.employee?.employee_position?.namePosition || "—",
                p.paymentDate ? new Date(p.paymentDate).toLocaleDateString("es-BO") : "—",
                new Intl.NumberFormat("es-BO", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                }).format(p.amount) + " Bs",
                p.description || "—", 
            ]);

            autoTable(doc, {
                startY: 110,
                theme: "striped",
                head: [["NRO.", "NOMBRE", "CARGO", "FECHA DE PAGO", "MONTO Bs.", "DESCRIPCIÓN", "FIRMA"]],
                body,
                styles: { fontSize: 9, cellPadding: 6 },
                headStyles: { fillColor: [38, 72, 131], textColor: [255, 255, 255], fontStyle: "bold" },
                foot: [[
                    { content: "TOTAL", colSpan: 5, styles: { halign: "right", fontStyle: "bold" } }, 
                    {
                    content: new Intl.NumberFormat("es-BO", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    }).format(total) + " Bs",
                    styles: { halign: "center", fontStyle: "bold" },
                    },
                ]],
                footStyles: { fillColor: [38, 72, 131], textColor: [255, 255, 255] },
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
    // formulario único
    const [form, setForm] = useState<TipPaymentCreate>({
        amount: 0,
        state: "",
        paymentDate: null,
        fk_idEmployee: 0,
        description: "",
    });
    // si editingRow ≠ null → estamos editando
    const [editingRow, setEditingRow] = useState<TipPayment | null>(null);

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
            console.log("📌 DataPayments crudo desde backend:", dataPayments);

            const normalizedPayments: TipPayment[] = dataPayments.map((p: any) => {
                console.log("👉 Payment recibido:", p);
                return {
                ...p,
                amount: Number(p.amount),
                employee: p.employee,
                };
            });
            console.log("✅ NormalizedPayments:", normalizedPayments);

            setItems(normalizedPayments);

            const dataEmployees = await resEmployees.json();
            console.log("📌 Employees crudos:", dataEmployees);
            setEmployees(dataEmployees);

            const dataExpenses = await resExpenses.json();
            console.log("📌 Expenses crudos:", dataExpenses);
            setExpenses(dataExpenses);
        } catch (e: any) {
            toast.error(`Error al cargar: ${e.message}`);
        }
    }

    useEffect(() => {
        load();
    }, []);

    function onChangeForm<K extends keyof TipPaymentCreate>(
        key: K,
        value: TipPaymentCreate[K]
    ) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    function resetForm() {
        setForm({ amount: 0, state: "", paymentDate: null, fk_idEmployee: 0, description: "" });
        setAmountInput("");
        setEditingRow(null);
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
            if (!form.state.trim()) return toast.error("Estado es requerido.");
            if (!form.fk_idEmployee) return toast.error("Empleado es requerido.");

            setSaving(true);
            const payload: TipPaymentCreate = { ...form, amount: Number(form.amount) };

            const res = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error(`POST ${res.status}`);
            const created: TipPayment = await res.json();

            setItems((prev) => [{ ...created, amount: Number(created.amount) }, ...prev]);
            await maybeRegisterExpense(created);

            resetForm();
            toast.success("Propina creado!");
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
                amount: Number(form.amount),
                state: form.state,
                paymentDate: form.paymentDate,
                fk_idEmployee: form.fk_idEmployee,
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
            await maybeRegisterExpense(updated);

            resetForm();
            toast.success("Propina actualizado!");
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
            setItems((prev) => prev.filter((x) => x.idTipPayment !== id));
            toast.success("Propina eliminado!");
        } catch (e: any) {
            toast.error(`Error al eliminar: ${e.message}`);
        }
    }


    return (
        <div className="bg-slate-900 p-6 rounded-lg shadow-xl mb-8 border border-slate-700">
            <h1 className="text-3xl font-bold mb-6 text-center">Gestión de Propinas</h1>

            {/* Formulario único */}
            <div className="bg-slate-800 p-6 rounded-lg shadow-xl mb-8 border border-slate-700">
                <h2 className="text-xl font-semibold mb-4">
                    {editingRow ? "Editar Propina" : "Agregar Propina"}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                    <label>Monto (Bs)</label>
                    <input
                        type="text"
                        placeholder="0,00"
                        value={amountInput}
                        onChange={(e) => {
                            const raw = e.target.value;
                            setAmountInput(raw);
                            const parsed = parseFloat(raw.replace(",", "."));
                            setForm((prev) => ({
                            ...prev,
                            amount: isNaN(parsed) ? 0 : parsed,
                            }));
                        }}
                        className="p-2 rounded bg-gray-700 w-full"
                    />
                </div>
                <div>
                    <label>Estado de Propina</label>
                    <select
                        value={form.state}
                        onChange={(e) => onChangeForm("state", e.target.value)}
                        className="p-2 rounded bg-gray-700 w-full"
                        >
                        <option value="">Estado…</option>
                        <option value="PAGADO">Pagado</option>
                        <option value="PENDIENTE">Pendiente</option>
                        <option value="ANULADO">Anulado</option>
                    </select>
                </div>
                <div>
                    <label>Fecha de Pago</label>
                    <input
                        type="date"
                        value={form.paymentDate ?? ""}
                        onChange={(e) => onChangeForm("paymentDate", e.target.value || null)}
                        className="p-2 rounded bg-gray-700 w-full"
                    />
                </div>
                <div>
                    <label>Empleado</label>
                    <select
                        value={form.fk_idEmployee}
                        onChange={(e) => onChangeForm("fk_idEmployee", Number(e.target.value))}
                        className="p-2 rounded bg-gray-700 w-full"
                        >
                        <option value={0}>Empleado…</option>
                        {employees.map((emp) => (
                            <option key={emp.idEmployee} value={emp.idEmployee}>
                            {emp.fullName}
                            </option>
                        ))}
                    </select>
                </div>
                    <div>
                        <label>Descripción</label>
                        <input
                            type="text"
                            placeholder="Motivo de la propina"
                            value={form.description || ""}
                            onChange={(e) => onChangeForm("description", e.target.value)}
                            className="p-2 rounded bg-gray-700 w-full"
                        />
                    </div>
                </div>
                <div className="mt-4 text-right">
                    {editingRow ? (
                        <>
                            <button
                                onClick={updateItem}
                                disabled={saving}
                                className="bg-blue-600 px-4 py-2 rounded inline-flex items-center gap-2"
                            >
                                <Save size={18} /> Guardar cambios
                            </button>
                            <button
                                onClick={resetForm}
                                className="ml-2 bg-gray-600 px-4 py-2 rounded inline-flex items-center gap-2"
                            >
                                <X size={18} /> Cancelar
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={createItem}
                            disabled={saving}
                            className="bg-green-600 px-4 py-2 rounded inline-flex items-center gap-2"
                            >
                            <Plus size={18} /> Agregar
                        </button>
                    )}
                </div>
            </div>
            {/* Tabla de SalaryPayments */}
            <div className="bg-slate-800 p-6 rounded-lg shadow-xl mb-8 border border-slate-700">
                <h2 className="text-xl font-semibold mb-2">Propinas registradas</h2>
                <table className="w-full text-sm mb-8">
                    <thead className="bg-gray-700">
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
                        <tr key={row.idTipPayment} className="border-t border-gray-600">
                            <td className="p-2">{row.idTipPayment}</td>
                            <td className="p-2">{row.employee?.fullName ?? "❌ sin nombre"}</td>
                            <td className="p-2">
                                {row.employee?.employee_position?.namePosition ?? "❌ sin cargo"}
                            </td>
                            <td className="p-2">{row.amount.toFixed(2)} Bs</td>
                            <td className="p-2">{row.state}</td>
                            <td className="p-2">{fmtDateView(row.paymentDate)}</td>
                            <td className="p-2 flex gap-2">
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
                                        setAmountInput(row.amount.toString()); 
                                    }}
                                    className="bg-yellow-600 px-2 py-1 rounded"
                                    >
                                    Editar
                                </button>
                                <button
                                    onClick={() => deleteItem(row.idTipPayment)}
                                    className="bg-red-600 px-2 py-1 rounded"
                                    >
                                    Eliminar
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
            {/* Sección de filtros para PDF */}
            <div className="bg-slate-800 p-6 rounded-lg shadow-xl mb-8 border border-slate-700">
                <h2 className="text-xl font-semibold mb-4">Exportar PDF de Propinas</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                        <label>Empleado</label>
                        <select
                            value={filterEmployee}
                            onChange={(e) => setFilterEmployee(Number(e.target.value))}
                            className="p-2 rounded bg-gray-700 w-full"
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
                            className="p-2 rounded bg-gray-700 w-full"
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
                            className="p-2 rounded bg-gray-700 w-full"
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
                <h2 className="text-xl font-semibold mb-2">Registros en Egresos (Propinas)</h2>
                <table className="w-full text-sm">
                    <thead className="bg-gray-700">
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
                                <td className="p-2">{ex.AmountBsCaptureType.toFixed(2)} Bs</td>
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
