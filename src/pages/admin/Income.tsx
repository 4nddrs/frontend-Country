import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import { Edit, Trash2, Loader } from 'lucide-react';
import { AddButton, ExportButton, AdminSection, SaveButton, CancelButton } from '../../components/ui/admin-buttons';
import { confirmDialog } from '../../utils/confirmDialog';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import AnimatedBackground from '../../components/ui/AnimatedBackground';

const API_URL = 'https://api.countryclub.doc-ia.cloud/income/';

interface Income {
  idIncome?: number;
  date: string;
  description: string;
  amountBsCaptureType: number;
  period: string;
  created_at?: string;
}

interface ChartPoint {
  date: string;
  amountBsCaptureType: number;
}

const IncomeManagement = () => {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [chartPoints, setChartPoints] = useState<ChartPoint[]>([]);
  const [newIncome, setNewIncome] = useState<Income>({
    date: '',
    description: '',
    amountBsCaptureType: '' as any,
    period: '',
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterMonth, setFilterMonth] = useState('');
  const [exporting, setExporting] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);

  const fetchIncomes = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al obtener ingresos');
      const data: Income[] = await res.json();
      data.sort((a, b) => (b.idIncome ?? 0) - (a.idIncome ?? 0));
      setIncomes(data);
    } catch {
      toast.error('No se pudieron cargar los ingresos.');
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async () => {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) return;
      const data: Income[] = await res.json();
      setChartPoints(
        data.map(({ date, amountBsCaptureType }) => ({ date, amountBsCaptureType }))
      );
    } catch {
      // silent — chart is non-critical
    }
  };

  useEffect(() => {
    fetchIncomes();
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

  const createIncome = async () => {
    if (
      !newIncome.date ||
      !newIncome.description.trim() ||
      !String(newIncome.amountBsCaptureType).trim() ||
      !newIncome.period
    ) {
      toast.error("Todos los campos son obligatorios.");
      return;
    }

    try {
      const cleanedAmount = (() => {
        let value = String(newIncome.amountBsCaptureType).trim();
        if (value.includes(",")) {
          value = value.replace(/\./g, "").replace(",", ".");
        }
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
      })();

      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newIncome,
          amountBsCaptureType: cleanedAmount,
          period: newIncome.period ? `${newIncome.period}-01` : '',
        }),
      });

      if (!res.ok) throw new Error("Error al crear ingreso");
      toast.success("Ingreso creado correctamente");
      setNewIncome({ date: "", description: "", amountBsCaptureType: '' as any, period: "" });
      fetchIncomes();
      fetchChartData();
    } catch {
      toast.error("No se pudo crear el ingreso.");
    }
  };

  const updateIncome = async (id: number, updatedIncome: Income) => {
    if (
      !updatedIncome.date ||
      !updatedIncome.description.trim() ||
      !String(updatedIncome.amountBsCaptureType).trim() ||
      !updatedIncome.period
    ) {
      toast.error("Todos los campos son obligatorios.");
      return;
    }

    try {
      const cleanedAmount = (() => {
        let value = String(updatedIncome.amountBsCaptureType).trim();
        if (value.includes(",")) {
          value = value.replace(/\./g, "").replace(",", ".");
        }
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
      })();

      const res = await fetch(`${API_URL}${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...updatedIncome,
          amountBsCaptureType: cleanedAmount,
          period: updatedIncome.period ? `${updatedIncome.period}-01` : '',
        }),
      });

      if (!res.ok) throw new Error("Error al actualizar ingreso");
      toast.success("Ingreso actualizado correctamente");
      setEditingIncome(null);
      setEditingId(null);
      fetchIncomes();
      fetchChartData();
    } catch {
      toast.error("No se pudo actualizar el ingreso.");
    }
  };

  const deleteIncome = async (id: number) => {
    const confirmed = await confirmDialog({
      title: '¿Eliminar ingreso?',
      description: 'Esta acción eliminará el registro de ingreso permanentemente.',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
    });
    if (!confirmed) return;
    try {
      const res = await fetch(`${API_URL}${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar ingreso');
      toast.success('Ingreso eliminado!');
      fetchIncomes();
      fetchChartData();
    } catch {
      toast.error('No se pudo eliminar el ingreso.');
    }
  };

  // === Datos del gráfico — solo date y amount, agrupados por mes ===
  const chartData = useMemo(() => {
    if (filterMonth) {
      // Vista diaria del mes seleccionado
      const [y, m] = filterMonth.split('-').map(Number);
      const daysInMonth = new Date(y, m, 0).getDate();
      const days = Array.from({ length: daysInMonth }, (_, i) => {
        const d = String(i + 1).padStart(2, '0');
        return { name: d, key: `${filterMonth}-${d}`, amount: 0 };
      });
      chartPoints.forEach(({ date, amountBsCaptureType }) => {
        if (date?.startsWith(filterMonth)) {
          const entry = days.find((day) => day.key === date.slice(0, 10));
          if (entry) entry.amount += Number(amountBsCaptureType || 0);
        }
      });
      return days.map(({ name, amount }) => ({ name, amount: Math.round(amount * 100) / 100 }));
    }

    // Vista mensual — últimos 12 meses
    const now = new Date();
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      return {
        name: d.toLocaleDateString('es-BO', { month: 'short', year: '2-digit' }).replace('.', ''),
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        amount: 0,
      };
    });
    chartPoints.forEach(({ date, amountBsCaptureType }) => {
      if (date) {
        const key = date.slice(0, 7);
        const entry = months.find((m) => m.key === key);
        if (entry) entry.amount += Number(amountBsCaptureType || 0);
      }
    });
    return months.map(({ name, amount }) => ({ name, amount: Math.round(amount * 100) / 100 }));
  }, [chartPoints, filterMonth]);

  const formatCurrency = (value: number): string =>
    value.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const exportFilteredPDF = async () => {
    try {
      setExporting(true);
      const doc = new jsPDF({ orientation: "landscape", unit: "pt" });

      if (logoDataUrl) {
        const margin = 40;
        const w = 120;
        const h = 70;
        const pageW = doc.internal.pageSize.getWidth();
        doc.addImage(logoDataUrl, "PNG", pageW - w - margin, 20, w, h);
      }

      const pageW = doc.internal.pageSize.getWidth();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      const titulo = filterMonth
        ? `Ingresos del mes ${new Date(filterMonth).toLocaleDateString("es-ES", { month: "long", year: "numeric" })}`
        : "Ingresos (sin filtro de mes)";
      doc.text(titulo, pageW / 2, 50, { align: "center" });

      const now = new Date();
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(
        `Fecha: ${now.toLocaleDateString("es-BO")}  Hora: ${now.toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })}`,
        40, 70
      );

      const filtered = filterMonth
        ? incomes.filter((i) => i.period?.startsWith(filterMonth))
        : incomes;

      const total = filtered.reduce((acc, i) => acc + Number(i.amountBsCaptureType || 0), 0);
      const body = filtered.map((i, idx) => [
        idx + 1,
        i.date ? new Date(i.date).toLocaleDateString("es-BO") : "—",
        i.description || "—",
        `${formatCurrency(i.amountBsCaptureType)} Bs`,
      ]);

      autoTable(doc, {
        startY: 100,
        head: [["#", "Fecha", "Descripción", "Monto (Bs)"]],
        body,
        theme: "grid",
        styles: { fontSize: 10, cellPadding: 6 },
        headStyles: { fillColor: [38, 72, 131], textColor: [255, 255, 255], fontStyle: "bold" },
        showFoot: 'lastPage',
        foot: [[
          { content: "TOTAL", colSpan: 3, styles: { halign: "right" } },
          { content: `${formatCurrency(total)} Bs`, styles: { halign: "center" } },
        ]],
        footStyles: { fillColor: [38, 72, 131], textColor: [255, 255, 255], fontStyle: "bold" },
      });

      doc.save(`Ingresos_${filterMonth || "SinFiltro"}_${now.toISOString().slice(0, 10)}.pdf`);
      toast.success("PDF generado correctamente");
    } catch {
      toast.error("No se pudo generar el PDF.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
      <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">Gestión de Ingresos</h1>

      {/* === Formulario principal === */}
      <AdminSection>
        <h2 className="text-xl font-semibold mb-4 text-[#bdab62]">Agregar Nuevo Ingreso</h2>

        {/* Inputs en una fila, botón al extremo derecho */}
        <div className="flex items-end gap-3 w-full overflow-x-auto py-5">
          <div className="flex-1 min-w-0">
            <label className="block mb-1 text-white text-sm">
              Fecha <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={newIncome.date}
              onChange={(e) => setNewIncome({ ...newIncome, date: e.target.value })}
              className="select-field w-full"
            />
          </div>

          <div className="flex-[2] min-w-0">
            <label className="block mb-1 text-white text-sm">
              Descripción <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Descripción"
              value={newIncome.description}
              onChange={(e) => setNewIncome({ ...newIncome, description: e.target.value })}
              className="select-field w-full"
            />
          </div>

          <div className="flex-1 min-w-0">
            <label className="block mb-1 text-white text-sm">
              Monto <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Ej: 1.000,50"
              value={newIncome.amountBsCaptureType}
              onFocus={() => {
                if (String(newIncome.amountBsCaptureType) === '0') {
                  setNewIncome((prev) => ({ ...prev, amountBsCaptureType: '' as any }));
                }
              }}
              onChange={(e) =>
                setNewIncome({ ...newIncome, amountBsCaptureType: e.target.value as any })
              }
              className="select-field w-full"
            />
          </div>

          <div className="flex-1 min-w-0">
            <label className="block mb-1 text-white text-sm">
              Periodo <span className="text-red-500">*</span>
            </label>
            <input
              type="month"
              value={newIncome.period}
              onChange={(e) => setNewIncome({ ...newIncome, period: e.target.value })}
              className="select-field w-full"
            />
          </div>

          <div className="flex-shrink-0 ml-2">
            <AddButton onClick={createIncome} />
          </div>
        </div>

        {/* Separador visual */}
        <div className="mt-6 border-t border-slate-600/50" />

        {/* === Gráfico de ingresos — estilo Sales Overview === */}
        <AnimatedBackground className="mt-6 rounded-xl border border-blue-900/30">
          {/* Header del gráfico: título izq, filtro der */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-sm font-semibold text-white">Resumen de Ingresos</p>
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
                onChange={(e) => setFilterMonth(e.target.value)}
                className="select-field rounded-md px-2 py-1 text-sm"
              />
              {filterMonth && (
                <button
                  onClick={() => setFilterMonth('')}
                  className="text-slate-400 hover:text-white text-xs px-1"
                  title="Quitar filtro"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.06)"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
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
                contentStyle={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: '#94a3b8' }}
                itemStyle={{ color: '#60a5fa' }}
                formatter={(value: unknown) => [
                  `Bs ${formatCurrency(Number(value))}`,
                  'Ingreso',
                ]}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#38bdf8"
                strokeWidth={2}
                fill="url(#incomeGradient)"
                dot={false}
                activeDot={{ r: 5, fill: '#38bdf8', stroke: '#7dd3fc', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </AnimatedBackground>

        {/* Separador visual + exportar PDF */}
        <div className="flex flex-wrap items-center justify-end mt-6 pt-4 border-t border-slate-600">
          <ExportButton onClick={exportFilteredPDF} disabled={exporting}>
            {exporting ? "Generando..." : "Exportar PDF"}
          </ExportButton>
        </div>
      </AdminSection>

      {/* === Listado de ingresos === */}
      <AdminSection>
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            <Loader size={24} className="animate-spin" />Cargando ingresos...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {incomes.map((income) => (
              <div
                key={income.idIncome}
                className="rounded-2xl border border-slate-800/60 bg-gradient-to-br from-indigo-500/10 via-slate-900/60 to-slate-900/90 shadow-lg shadow-black/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-indigo-500/20"
              >
                <div className="flex flex-col items-center gap-2 py-5">
                  <span className="h-4 w-4 rounded-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.6)]" />
                  <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Ingreso</span>
                </div>

                <div className="px-6 pb-6 space-y-4 text-sm text-slate-200">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-indigo-300">{income.description}</h3>
                  </div>

                  <div className="space-y-2 text-center">
                    <p><span className="font-medium text-slate-400">Fecha:</span> {income.date?.slice(0, 10)}</p>
                    <p><span className="font-medium text-slate-400">Monto:</span> <span className="text-indigo-300">Bs {income.amountBsCaptureType}</span></p>
                    <p><span className="font-medium text-slate-400">Periodo:</span> {income.period?.slice(0, 10)}</p>
                  </div>

                  <div className="flex items-center justify-center gap-6 border-t border-slate-800 pt-6 pb-2">
                    <button
                      onClick={() => {
                        setEditingId(income.idIncome!);
                        const displayAmount = income.amountBsCaptureType
                          ? String(income.amountBsCaptureType).replace(".", ",")
                          : "";
                        setEditingIncome({
                          date: income.date,
                          description: income.description,
                          amountBsCaptureType: displayAmount as any,
                          period: income.period?.slice(0, 7) ?? '',
                        });
                      }}
                      className="relative flex items-center justify-center w-15 h-15 rounded-[20px]
                                 bg-gradient-to-b from-[#1A1C1E] to-[#0E0F10]
                                 shadow-[8px_8px_16px_rgba(0,0,0,0.85),-5px_-5px_12px_rgba(255,255,255,0.06)]
                                 hover:scale-[1.1]
                                 active:shadow-[inset_5px_5px_12px_rgba(0,0,0,0.9),inset_-4px_-4px_10px_rgba(255,255,255,0.05)]
                                 transition-all duration-300 ease-in-out"
                    >
                      <Edit size={28} className="text-[#E8C967] drop-shadow-[0_0_10px_rgba(255,215,100,0.85)] transition-transform duration-300 hover:rotate-3" />
                    </button>
                    <button
                      onClick={() => deleteIncome(income.idIncome!)}
                      className="relative flex items-center justify-center w-15 h-15 rounded-[20px]
                                 bg-gradient-to-b from-[#1A1C1E] to-[#0E0F10]
                                 shadow-[8px_8px_16px_rgba(0,0,0,0.85),-5px_-5px_12px_rgba(255,255,255,0.06)]
                                 hover:scale-[1.1]
                                 active:shadow-[inset_5px_5px_12px_rgba(0,0,0,0.9),inset_-4px_-4px_10px_rgba(255,255,255,0.05)]
                                 transition-all duration-300 ease-in-out"
                    >
                      <Trash2 size={28} className="text-[#E86B6B] drop-shadow-[0_0_12px_rgba(255,80,80,0.9)] transition-transform duration-300 hover:-rotate-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminSection>

      {editingId !== null && editingIncome && createPortal(
        <div
          className="fixed inset-0 lg:left-80 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => { setEditingId(null); setEditingIncome(null); }}
        >
          <div
            className="w-full max-w-2xl max-h-[95vh] overflow-y-auto rounded-2xl border border-[#167C79]/60 bg-[#0f172a] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.6)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-[#F8F4E3] mb-6">Editar Ingreso</h3>
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block mb-1 text-white">Fecha <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={editingIncome.date}
                  onChange={(e) => setEditingIncome({ ...editingIncome, date: e.target.value })}
                  className="select-field"
                />
              </div>
              <div>
                <label className="block mb-1 text-white">Descripción <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="Descripción"
                  value={editingIncome.description}
                  onChange={(e) => setEditingIncome({ ...editingIncome, description: e.target.value })}
                  className="select-field"
                  style={{ width: '50ch' }}
                />
              </div>
              <div>
                <label className="block mb-1 text-white">Monto <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="Ej: 1.000,50"
                  value={editingIncome.amountBsCaptureType}
                  onChange={(e) => setEditingIncome({ ...editingIncome, amountBsCaptureType: e.target.value as any })}
                  className="select-field"
                />
              </div>
              <div>
                <label className="block mb-1 text-white">Periodo <span className="text-red-500">*</span></label>
                <input
                  type="month"
                  value={editingIncome.period}
                  onChange={(e) => setEditingIncome({ ...editingIncome, period: e.target.value })}
                  className="select-field"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3 border-t border-slate-700 pt-4">
              <CancelButton onClick={() => { setEditingId(null); setEditingIncome(null); }} />
              <SaveButton onClick={() => updateIncome(editingId, editingIncome)} children="Guardar cambios" />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default IncomeManagement;
