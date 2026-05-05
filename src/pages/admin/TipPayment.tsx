import React, { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-hot-toast";
import { Edit, Trash2 } from "lucide-react";
import { AddButton, ExportButton, AdminSection, SaveButton, CancelButton } from '../../components/ui/admin-buttons';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";
import { confirmDialog } from '../../utils/confirmDialog';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import AnimatedBackground from '../../components/ui/AnimatedBackground';

const API_URL = "https://api.countryclub.doc-ia.cloud/tip_payments/";
const EMPLOYEES_URL = "https://api.countryclub.doc-ia.cloud/employees/";
const EXPENSES_URL = "https://api.countryclub.doc-ia.cloud/expenses/";

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

interface ChartPoint {
  date: string;
  amount: number;
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

// =========================================================
// CHART CONFIG — ajustar colores/etiquetas aquí sin tocar
// el resto del componente
// =========================================================
const CHART_CONFIG = {
  gradientId: "tipGradient",
  borderColor: "border-orange-900/30",
  gradientColor: "#c026d3",     // orange-600
  strokeColor: "#d946ef",       // orange-500
  activeDotFill: "#d946ef",
  activeDotStroke: "#f5d0fe",   // orange-200
  tooltipItemColor: "#e879f9",  // orange-400
  tooltipLabel: "Propina",
} as const;

interface TipAreaChartProps {
  data: { name: string; amount: number }[];
  filterMonth: string;
  onFilterChange: (v: string) => void;
  formatCurrency: (n: number) => string;
}

function TipAreaChart({ data, filterMonth, onFilterChange, formatCurrency }: TipAreaChartProps) {
  const { gradientId, borderColor, gradientColor, strokeColor, activeDotFill, activeDotStroke, tooltipItemColor, tooltipLabel } = CHART_CONFIG;

  return (
    <AnimatedBackground className={`mt-6 rounded-xl border ${borderColor}`}>
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-sm font-semibold text-white">Resumen de Pagos de Propinas</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {filterMonth
              ? new Date(filterMonth + '-01').toLocaleDateString('es-BO', { month: 'long', year: 'numeric' })
              : 'Últimos 12 meses'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 whitespace-nowrap">Filtrar por mes:</label>
          <input
            type="month"
            value={filterMonth}
            onChange={(e) => onFilterChange(e.target.value)}
            className="select-field rounded-md px-2 py-1 text-sm"
          />
          {filterMonth && (
            <button
              onClick={() => onFilterChange('')}
              className="text-slate-400 hover:text-white text-xs px-1"
              title="Quitar filtro"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={gradientColor} stopOpacity={0.45} />
              <stop offset="95%" stopColor={gradientColor} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={70}
            tickFormatter={(v: unknown) => {
              const n = Number(v);
              return n === 0 ? '0' : formatCurrency(n);
            }}
          />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#94a3b8' }}
            itemStyle={{ color: tooltipItemColor }}
            formatter={(value: unknown) => [`Bs ${formatCurrency(Number(value))}`, tooltipLabel]}
          />
          <Area
            type="monotone"
            dataKey="amount"
            stroke={strokeColor}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 5, fill: activeDotFill, stroke: activeDotStroke, strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </AnimatedBackground>
  );
}

/** ========= Status Badge — Cyber-Dark LED style ========= */
function StatusBadge({ state }: { state: string }) {
  const configs: Record<string, { label: string; dot: string; bg: string; border: string; text: string; glow: string; pulse: boolean }> = {
    PAGADO: {
      label: "PAGADO",
      dot: "bg-emerald-400",
      bg: "bg-emerald-950/60",
      border: "border-emerald-500/30",
      text: "text-emerald-300",
      glow: "shadow-[0_0_8px_rgba(52,211,153,0.4)]",
      pulse: false,
    },
    PENDIENTE: {
      label: "PENDIENTE",
      dot: "bg-amber-400",
      bg: "bg-amber-950/60",
      border: "border-amber-500/30",
      text: "text-amber-300",
      glow: "shadow-[0_0_8px_rgba(251,191,36,0.4)]",
      pulse: true,
    },
    ANULADO: {
      label: "ANULADO",
      dot: "bg-red-500",
      bg: "bg-red-950/60",
      border: "border-red-500/30",
      text: "text-red-400",
      glow: "shadow-[0_0_8px_rgba(239,68,68,0.4)]",
      pulse: false,
    },
  };

  const cfg = configs[state] ?? {
    label: state,
    dot: "bg-slate-400",
    bg: "bg-slate-900/60",
    border: "border-slate-600/30",
    text: "text-slate-300",
    glow: "",
    pulse: false,
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border backdrop-blur-sm ${cfg.bg} ${cfg.border} ${cfg.text} ${cfg.glow}`}>
      <span className={`h-2 w-2 rounded-full ${cfg.dot} ${cfg.pulse ? "animate-pulse" : ""}`} />
      {cfg.label}
    </span>
  );
}

// === helpers para montos ===
const normalizeInput = (raw: string): string => raw.replace(/[^\d.,]/g, "");

const parseToNumber = (raw: string): number => {
  if (!raw) return 0;
  const cleaned = raw.replace(/\./g, "").replace(",", ".");
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100) / 100;
};

const formatDisplay = (num: number): string =>
  new Intl.NumberFormat("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);

function fmtDateView(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return isNaN(d.getTime()) ? value : d.toLocaleDateString();
}

/** ========= Componente ========= */
const TipPaymentPage: React.FC = () => {
  const [items, setItems] = useState<TipPayment[]>([]);
  const [employees, setEmployees] = useState<EmployeeLite[]>([]);
  const [chartPoints, setChartPoints] = useState<ChartPoint[]>([]);
  const [saving, setSaving] = useState(false);
  const [amountInput, setAmountInput] = useState("");
  const [createAmountInput, setCreateAmountInput] = useState("");
  const [filterEmployee, setFilterEmployee] = useState<number>(0);
  const [filterState, setFilterState] = useState<string>("");
  const [filterMonth, setFilterMonth] = useState<string>("");

  const [exporting, setExporting] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);

  const [form, setForm] = useState<TipPaymentCreate>({
    amount: 0,
    state: "",
    paymentDate: null,
    fk_idEmployee: 0,
    description: "",
  });

  const [createForm, setCreateForm] = useState<TipPaymentCreate>({
    amount: 0,
    state: "",
    paymentDate: null,
    fk_idEmployee: 0,
    description: "",
  });

  const [editingRow, setEditingRow] = useState<TipPayment | null>(null);

  const handleAmountChange = (raw: string) => {
    const cleaned = normalizeInput(raw);
    setAmountInput(cleaned);
    setForm((prev) => ({ ...prev, amount: parseToNumber(cleaned) }));
  };

  const handleCreateAmountChange = (raw: string) => {
    const cleaned = normalizeInput(raw);
    setCreateAmountInput(cleaned);
    setCreateForm((prev) => ({ ...prev, amount: parseToNumber(cleaned) }));
  };

  function onChangeForm<K extends keyof TipPaymentCreate>(key: K, value: TipPaymentCreate[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onChangeCreateForm<K extends keyof TipPaymentCreate>(key: K, value: TipPaymentCreate[K]) {
    setCreateForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetEditForm() {
    setForm({ amount: 0, state: "", paymentDate: null, fk_idEmployee: 0, description: "" });
    setAmountInput("");
    setEditingRow(null);
  }

  async function load() {
    try {
      const [resPayments, resEmployees] = await Promise.all([
        fetch(API_URL, { headers: { Accept: "application/json" } }),
        fetch(EMPLOYEES_URL, { headers: { Accept: "application/json" } }),
      ]);
      if (!resPayments.ok) throw new Error("GET payments failed");
      if (!resEmployees.ok) throw new Error("GET employees failed");

      const dataPayments: any[] = await resPayments.json();
      const normalizedPayments: TipPayment[] = dataPayments
        .map((p) => ({ ...p, amount: Number(p.amount), employee: p.employee }))
        .sort((a, b) => b.idTipPayment - a.idTipPayment);

      setItems(normalizedPayments);
      setEmployees(await resEmployees.json());
    } catch (e: any) {
      toast.error(`Error al cargar: ${e.message}`);
    }
  }

  async function fetchChartData() {
    try {
      const res = await fetch(API_URL, { headers: { Accept: "application/json" } });
      if (!res.ok) return;
      const data: any[] = await res.json();
      setChartPoints(
        data
          .filter((p) => p.paymentDate && p.amount)
          .map((p) => ({ date: String(p.paymentDate).slice(0, 10), amount: Number(p.amount) }))
      );
    } catch {
      // silent — chart is non-critical
    }
  }

  useEffect(() => {
    load();
    fetchChartData();

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

  // === Chart data — agrupado por mes o por día según filtro ===
  const chartData = useMemo(() => {
    if (filterMonth) {
      const [y, m] = filterMonth.split('-').map(Number);
      const daysInMonth = new Date(y, m, 0).getDate();
      const days = Array.from({ length: daysInMonth }, (_, i) => {
        const d = String(i + 1).padStart(2, '0');
        return { name: d, key: `${filterMonth}-${d}`, amount: 0 };
      });
      chartPoints.forEach(({ date, amount }) => {
        if (date?.startsWith(filterMonth)) {
          const entry = days.find((day) => day.key === date.slice(0, 10));
          if (entry) entry.amount += amount;
        }
      });
      return days.map(({ name, amount }) => ({ name, amount: Math.round(amount * 100) / 100 }));
    }

    const now = new Date();
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      return {
        name: d.toLocaleDateString('es-BO', { month: 'short', year: '2-digit' }).replace('.', ''),
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        amount: 0,
      };
    });
    chartPoints.forEach(({ date, amount }) => {
      if (date) {
        const key = date.slice(0, 7);
        const entry = months.find((mo) => mo.key === key);
        if (entry) entry.amount += amount;
      }
    });
    return months.map(({ name, amount }) => ({ name, amount: Math.round(amount * 100) / 100 }));
  }, [chartPoints, filterMonth]);

  const formatCurrency = (value: number): string =>
    value.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  async function maybeRegisterExpense(payment: TipPayment) {
    if (payment.state !== "PAGADO") return;

    const employeeName =
      payment.employee?.fullName ??
      employees.find((e) => e.idEmployee === payment.fk_idEmployee)?.fullName ??
      "Empleado";

    const today = new Date().toISOString().split("T")[0];
    const periodBase = payment.paymentDate ?? today;
    const period = `${periodBase.slice(0, 7)}-01`;

    try {
      const res = await fetch(EXPENSES_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: today,
          description: `Pago de propina - ${employeeName}`,
          AmountBsCaptureType: payment.amount,
          period,
        }),
      });
      if (!res.ok) throw new Error(`POST expense ${res.status}`);
      toast.success("Registrado automáticamente en Egresos");
    } catch (e: any) {
      toast.error(`Error registrando egreso: ${e.message}`);
    }
  }

  async function createItem() {
    try {
      if (!createForm.state.trim()) return toast.error("Estado es requerido.");
      if (!createForm.fk_idEmployee) return toast.error("Empleado es requerido.");

      setSaving(true);
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...createForm, amount: Math.round(createForm.amount * 100) / 100 }),
      });
      if (!res.ok) throw new Error(`POST ${res.status}`);
      const created: TipPayment = await res.json();
      const normalized = { ...created, amount: Number(created.amount) };

      setItems((prev) => [normalized, ...prev]);
      await maybeRegisterExpense(normalized);
      fetchChartData();

      setCreateForm({ amount: 0, state: "", paymentDate: null, fk_idEmployee: 0, description: "" });
      setCreateAmountInput("");
      toast.success("¡Propina creada!");
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
      const normalized = { ...updated, amount: Number(updated.amount) };

      setItems((prev) =>
        prev.map((x) => x.idTipPayment === normalized.idTipPayment ? normalized : x)
      );

      // Registrar egreso solo al transicionar a PAGADO
      if (editingRow.state !== "PAGADO" && normalized.state === "PAGADO") {
        await maybeRegisterExpense(normalized);
        fetchChartData();
      }

      resetEditForm();
      toast.success("¡Propina actualizada!");
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
      toast.success("¡Propina eliminada!");
    } catch (e: any) {
      toast.error(`Error al eliminar: ${e.message}`);
    }
  }

  const exportFilteredPDF = async () => {
    try {
      setExporting(true);
      const doc = new jsPDF({ orientation: "landscape", unit: "pt" });

      if (logoDataUrl) {
        const pageW = doc.internal.pageSize.getWidth();
        doc.addImage(logoDataUrl, "PNG", pageW - 160, 20, 120, 70);
      }

      let titulo = "Reporte de Propinas";
      if (filterMonth) {
        const [year, month] = filterMonth.split("-");
        const mesNombre = new Date(Number(year), Number(month) - 1).toLocaleDateString("es-ES", { month: "long" });
        titulo = `Reporte de Propinas - ${mesNombre} ${year}`;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(titulo, doc.internal.pageSize.getWidth() / 2, 50, { align: "center" });

      const now = new Date();
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Fecha: ${now.toLocaleDateString("es-BO")}  Hora: ${now.toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })}`,
        40, 70
      );

      let filtered = [...items];
      if (filterEmployee > 0) filtered = filtered.filter((p) => p.fk_idEmployee === filterEmployee);
      if (filterState) filtered = filtered.filter((p) => p.state === filterState);
      if (filterMonth) filtered = filtered.filter((p) => p.paymentDate && p.paymentDate.startsWith(filterMonth));

      const total = filtered.reduce((acc, p) => acc + p.amount, 0);
      const body = filtered.map((p, i) => [
        i + 1,
        p.employee?.fullName || "—",
        p.employee?.employee_position?.namePosition || "—",
        p.paymentDate ? new Date(p.paymentDate).toLocaleDateString("es-BO") : "—",
        formatDisplay(p.amount) + " Bs",
        p.description || "—",
        "",
      ]);

      const corporateBlue: [number, number, number] = [38, 72, 131];

      autoTable(doc, {
        startY: 110,
        theme: "striped",
        head: [["NRO.", "NOMBRE", "CARGO", "FECHA DE PAGO", "MONTO Bs.", "DESCRIPCIÓN", "FIRMA"]],
        body,
        styles: { fontSize: 9, cellPadding: 6 },
        headStyles: { fillColor: corporateBlue, textColor: [255, 255, 255], fontStyle: "bold" },
        foot: [[
          { content: "TOTAL", colSpan: 5, styles: { halign: "right", fontStyle: "bold" } },
          { content: formatDisplay(total) + " Bs", styles: { halign: "center", fontStyle: "bold" } },
          { content: "", styles: { halign: "center" } },
        ]],
        footStyles: { fillColor: corporateBlue, textColor: [255, 255, 255], fontStyle: "bold" },
      });

      doc.save(`Propinas_${dayjs().format("YYYYMMDD_HHmm")}.pdf`);
      toast.success("PDF generado.");
    } catch {
      toast.error("No se pudo generar el PDF.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
      <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">Gestión de Propinas</h1>

      {/* === Sección superior: formulario + gráfico === */}
      <AdminSection>
        <h2 className="text-xl font-semibold mb-4 text-[#bdab62]">Agregar Propina</h2>

        {/* Fila 1 — 3 columnas: Monto | Estado | Fecha */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-sm mb-1 block">Monto (Bs)</label>
            <input
              type="text"
              placeholder="0,00"
              value={createAmountInput}
              onChange={(e) => handleCreateAmountChange(e.target.value)}
              className="select-field w-full text-white"
            />
          </div>
          <div>
            <label className="text-sm mb-1 block">Estado de Propina</label>
            <select
              value={createForm.state}
              onChange={(e) => onChangeCreateForm("state", e.target.value)}
              className="select-field w-full text-white"
            >
              <option value="">Estado…</option>
              <option value="PAGADO">Pagado</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="ANULADO">Anulado</option>
            </select>
          </div>
          <div>
            <label className="text-sm mb-1 block">Fecha de Pago</label>
            <input
              type="date"
              value={createForm.paymentDate ?? ""}
              onChange={(e) => onChangeCreateForm("paymentDate", e.target.value || null)}
              className="select-field w-full text-white"
            />
          </div>
        </div>

        {/* Fila 2 — 2 columnas mitad-mitad: Empleado | Descripción */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm mb-1 block">Empleado</label>
            <select
              value={createForm.fk_idEmployee}
              onChange={(e) => onChangeCreateForm("fk_idEmployee", Number(e.target.value))}
              className="select-field w-full text-white"
            >
              <option value={0}>Empleado…</option>
              {employees.map((emp) => (
                <option key={emp.idEmployee} value={emp.idEmployee}>{emp.fullName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm mb-1 block">Descripción</label>
            <input
              type="text"
              placeholder="Motivo de la propina"
              value={createForm.description}
              onChange={(e) => onChangeCreateForm("description", e.target.value)}
              className="select-field w-full text-white"
            />
          </div>
        </div>

        <div className="mt-4 text-right">
          <AddButton onClick={createItem} disabled={saving} />
        </div>

        {/* Separador visual */}
        <div className="mt-6 border-t border-slate-600/50" />

        {/* === Gráfico de propinas === */}
        <TipAreaChart
          data={chartData}
          filterMonth={filterMonth}
          onFilterChange={setFilterMonth}
          formatCurrency={formatCurrency}
        />
      </AdminSection>

      {/* Separador visual adicional */}
      <div className="border-t border-slate-600/50 my-2" />

      {/* === Tabla de Propinas === */}
      <AdminSection>
        <h2 className="text-xl font-semibold mb-2 text-teal-400">Propinas Registradas</h2>
        <div className="overflow-x-auto bg-slate-800 rounded-lg shadow-xl border border-slate-700">
          <table className="w-full text-sm mb-8">
            <thead
              className="text-white"
              style={{ background: "linear-gradient(90deg, #09203F 0%, #177e7a 100%)" }}
            >
              <tr>
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
                  <td className="p-2">{row.employee?.fullName ?? "—"}</td>
                  <td className="p-2">{row.employee?.employee_position?.namePosition ?? "—"}</td>
                  <td className="p-2">{formatDisplay(row.amount)} Bs</td>
                  <td className="p-2">
                    <StatusBadge state={row.state} />
                  </td>
                  <td className="p-2">{fmtDateView(row.paymentDate)}</td>
                  <td className="p-2 align-middle text-center">
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
                          setAmountInput(formatDisplay(row.amount));
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

      {/* === Exportar PDF === */}
      <AdminSection>
        <h2 className="text-xl font-semibold mb-4 text-[#bdab62]">Exportar PDF de Propinas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label>Empleado</label>
            <select value={filterEmployee} onChange={(e) => setFilterEmployee(Number(e.target.value))} className="select-field w-full text-white">
              <option value={0}>Todos</option>
              {employees.map((emp) => (
                <option key={emp.idEmployee} value={emp.idEmployee}>{emp.fullName}</option>
              ))}
            </select>
          </div>

          <div>
            <label>Estado</label>
            <select value={filterState} onChange={(e) => setFilterState(e.target.value)} className="select-field w-full text-white">
              <option value="">Todos</option>
              <option value="PAGADO">Pagado</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="ANULADO">Anulado</option>
            </select>
          </div>

          <div>
            <label className="text-sm mb-1 block text-slate-400">Mes (filtrado desde el gráfico)</label>
            <p className="text-sm text-slate-300 mt-2">
              {filterMonth
                ? new Date(filterMonth + '-01').toLocaleDateString('es-BO', { month: 'long', year: 'numeric' })
                : 'Sin filtro de mes'}
            </p>
          </div>
        </div>

        <div className="text-right">
          <ExportButton onClick={exportFilteredPDF} disabled={exporting || items.length === 0}>
            {exporting ? "Exportando..." : "Exportar PDF"}
          </ExportButton>
        </div>
      </AdminSection>

      {/* === Modal de edición === */}
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
              <div className="md:col-span-2">
                <label className="block mb-1">Descripción</label>
                <input type="text" placeholder="Motivo de la propina" value={form.description} onChange={(e) => onChangeForm("description", e.target.value)} className="select-field w-full text-white" />
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

export default TipPaymentPage;
