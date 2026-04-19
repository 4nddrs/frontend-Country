import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import { Edit, Trash2, Loader } from 'lucide-react';
import { AddButton, ExportButton, AdminSection, SaveButton, CancelButton } from '../../components/ui/admin-buttons';
import { confirmDialog } from '../../utils/confirmDialog';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


const API_URL = 'http://localhost:8000/expenses/';

interface Expense {
  idExpenses?: number;
  date: string; // "YYYY-MM-DD"
  description: string;
  AmountBsCaptureType: number;
  period: string; // "YYYY-MM-DD"
  created_at?: string;
}

const ExpensesManagement = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [newExpense, setNewExpense] = useState<Expense>({
    date: '',
    description: '',
    AmountBsCaptureType: 0,
    period: '',
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterMonth, setFilterMonth] = useState("");
  const [exporting, setExporting] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);


  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al obtener gastos');
      const data = await res.json();
      setExpenses(data);
    } catch {
      toast.error('No se pudieron cargar los gastos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();

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

  const createExpense = async () => {
    if (
      !newExpense.date ||
      !newExpense.description.trim() ||
      !String(newExpense.AmountBsCaptureType).trim() ||
      !newExpense.period
    ) {
      toast.error("Todos los campos son obligatorios.");
      return;
    }

    try {
      const cleanedAmount = (() => {
        let value = String(newExpense.AmountBsCaptureType).trim();

        if (value.includes(",")) {
          value = value.replace(/\./g, "");
          value = value.replace(",", ".");
        }

        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
      })();

      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newExpense,
          AmountBsCaptureType: cleanedAmount,
        }),
      });

      if (!res.ok) throw new Error("Error al crear gasto");

      toast.success("Gasto creado correctamente ✅");

      // 🧼 limpiar campos
      setNewExpense({
        date: "",
        description: "",
        AmountBsCaptureType: 0,
        period: "",
      });

      fetchExpenses();
    } catch {
      toast.error("No se pudo crear el gasto.");
    }
  };


  const updateExpense = async (id: number, updatedExpense: Expense) => {
    if (
      !updatedExpense.date ||
      !updatedExpense.description.trim() ||
      !String(updatedExpense.AmountBsCaptureType).trim() ||
      !updatedExpense.period
    ) {
      toast.error("Todos los campos son obligatorios.");
      return;
    }

    try {
      const cleanedAmount = (() => {
        let value = String(updatedExpense.AmountBsCaptureType).trim();

        if (value.includes(",")) {
          value = value.replace(/\./g, "");
          value = value.replace(",", ".");
        }

        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
      })();

      const res = await fetch(`${API_URL}${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...updatedExpense,
          AmountBsCaptureType: cleanedAmount,
        }),
      });

      if (!res.ok) throw new Error("Error al actualizar gasto");

      toast.success("Gasto actualizado correctamente ✅");

      setEditingId(null);
      setEditingExpense(null);

      fetchExpenses();
    } catch {
      toast.error("No se pudo actualizar el gasto.");
    }
  };


  const deleteExpense = async (id: number) => {
    const confirmed = await confirmDialog({
      title: '¿Eliminar gasto?',
      description: 'Esta acción eliminará el registro de gasto permanentemente.',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
    });
    if (!confirmed) return;
    try {
      const res = await fetch(`${API_URL}${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar gasto');
      toast.success('Gasto eliminado!');
      fetchExpenses();
    } catch {
      toast.error('No se pudo eliminar el gasto.');
    }
  };

  const formatCurrency = (value: number): string => {
    return value.toLocaleString("es-BO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // ====== Exportar PDF filtrado por mes ======
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

      // ====== Encabezado ======
      const pageW = doc.internal.pageSize.getWidth();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);

      const titulo = filterMonth
        ? `Egresos del mes ${new Date(filterMonth).toLocaleDateString("es-ES", {
            month: "long",
            year: "numeric",
          })}`
        : "Egresos (sin filtro de mes)";

      doc.text(titulo, pageW / 2, 50, { align: "center" });

      // ====== Fecha y hora ======
      const now = new Date();
      const fecha = now.toLocaleDateString("es-BO");
      const hora = now.toLocaleTimeString("es-BO", {
        hour: "2-digit",
        minute: "2-digit",
      });
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Fecha: ${fecha}  Hora: ${hora}`, 40, 70);

      // ====== Filtro de datos ======
      const filtered = filterMonth
        ? expenses.filter((e) => e.period?.startsWith(filterMonth))
        : expenses;

      // ====== Cuerpo de tabla ======
      const body = filtered.map((e, i) => [
        i + 1,
        e.date ? new Date(e.date).toLocaleDateString("es-BO") : "—",
        e.description || "—",
        `${formatCurrency(e.AmountBsCaptureType)} Bs`,
      ]);

      const total = filtered.reduce(
        (acc, e) => acc + Number(e.AmountBsCaptureType || 0),
        0
      );

      // ====== Tabla ======
      autoTable(doc, {
        startY: 100,
        head: [["#", "Fecha", "Descripción", "Monto (Bs)"]],
        body,
        theme: "grid",
        styles: { fontSize: 10, cellPadding: 6 },
        headStyles: {
          fillColor: [38, 72, 131],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        foot: [
          [
            { content: "TOTAL DEL MES", colSpan: 3, styles: { halign: "right" } },
            { content: `${formatCurrency(total)} Bs`, styles: { halign: "center" } },
          ],
        ],
        footStyles: {
          fillColor: [38, 72, 131],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
      });

      // ====== Guardar PDF ======
      const fileName = `Egresos_${filterMonth || "SinFiltro"}_${now
        .toISOString()
        .slice(0, 10)}.pdf`;
      doc.save(fileName);
      toast.success("PDF generado correctamente");
    } catch (e) {
      console.error(e);
      toast.error("No se pudo generar el PDF.");
    } finally {
      setExporting(false);
    }
  };


  return (
    <div  className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
      <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">Gestión de Gastos</h1>

      {/* === Formulario principal (crear) === */}
      <AdminSection>
        <h2 className="text-xl font-semibold mb-4 text-teal-400">Agregar Nuevo Gasto</h2>

        <div className="flex flex-wrap gap-4 items-end justify-between">
          <div className="flex flex-wrap gap-4">
            <div>
              <label htmlFor="date" className="block mb-1 text-white">
                Fecha <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="date"
                value={newExpense.date}
                onChange={(e) =>
                  setNewExpense({ ...newExpense, date: e.target.value })
                }
                className="select-field flex-1"
              />
            </div>

            <div>
              <label htmlFor="description" className="block mb-1 text-white">
                Descripción <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="description"
                placeholder="Descripción"
                value={newExpense.description}
                onChange={(e) =>
                  setNewExpense({ ...newExpense, description: e.target.value })
                }
                className="w-full"
              />
            </div>

            <div>
              <label htmlFor="AmountBsCaptureType" className="block mb-1 text-white">
                Monto <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="AmountBsCaptureType"
                placeholder="Ej: 1.000,50"
                value={newExpense.AmountBsCaptureType}
                onChange={(e) =>
                  setNewExpense({
                    ...newExpense,
                    AmountBsCaptureType: e.target.value as any,
                  })
                }
                className="select-field flex-1"
              />
            </div>

            <div>
              <label htmlFor="period" className="block mb-1 text-white">
                Periodo <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="period"
                value={newExpense.period}
                onChange={(e) =>
                  setNewExpense({ ...newExpense, period: e.target.value })
                }
                className="select-field flex-1"
              />
            </div>
          </div>

          <AddButton onClick={createExpense} className="ml-auto" />
        </div>

        {/* === Filtro y Exportar PDF === */}
        <div className="flex flex-wrap items-center justify-between mt-6 pt-4 border-t border-slate-600">
          <div className="flex items-center gap-2">
            <label className="text-white">Filtrar por mes:</label>
            <input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="select-field rounded-md p-2"
            />
          </div>

          <ExportButton onClick={exportFilteredPDF} disabled={exporting}>
            {exporting ? "Generando..." : "Exportar PDF"}
          </ExportButton>
        </div>
      </AdminSection>

      {/* === Listado de gastos === */}
      <AdminSection>
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            <Loader size={24} className="animate-spin" /> Cargando gastos...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {expenses.map((expense) => (
              <div
                key={expense.idExpenses}
                className="rounded-2xl border border-slate-800/60 bg-gradient-to-br from-red-500/10 via-slate-900/60 to-slate-900/90 shadow-lg shadow-black/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-red-500/20"
              >
                <div className="flex flex-col items-center gap-2 py-5">
                  <span className="h-4 w-4 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)]" />
                  <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    Gasto
                  </span>
                </div>

                <div className="px-6 pb-6 space-y-4 text-sm text-slate-200">
                  <div className="text-center space-y-1">
                    <h3 className="text-lg font-semibold text-red-300">{expense.description}</h3>
                  </div>

                  <div className="space-y-2 text-center">
                    <p><span className="font-medium text-slate-400">Fecha:</span> {expense.date?.slice(0, 10)}</p>
                    <p><span className="font-medium text-slate-400">Monto:</span> <span className="text-red-300">{expense.AmountBsCaptureType}</span></p>
                    <p><span className="font-medium text-slate-400">Periodo:</span> {expense.period?.slice(0, 10)}</p>
                  </div>

                  <div className="flex items-center justify-center gap-6 border-t border-slate-800 pt-6 pb-2">
                  <button
                    onClick={() => {
                      setEditingId(expense.idExpenses!);
                      const displayAmount = expense.AmountBsCaptureType
                        ? String(expense.AmountBsCaptureType).replace(".", ",")
                        : "";
                      setEditingExpense({
                        date: expense.date,
                        description: expense.description,
                        AmountBsCaptureType: displayAmount as any,
                        period: expense.period,
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
                    onClick={() => deleteExpense(expense.idExpenses!)}
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

      {editingId !== null && editingExpense && createPortal(
        <div
          className="fixed inset-0 lg:left-80 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => { setEditingId(null); setEditingExpense(null); }}
        >
          <div
            className="w-full max-w-2xl max-h-[95vh] overflow-y-auto rounded-2xl border border-[#167C79]/60 bg-[#0f172a] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.6)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-[#F8F4E3] mb-6">Editar Gasto</h3>
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block mb-1 text-white">Fecha <span className="text-red-500">*</span></label>
                <input type="date" value={editingExpense.date}
                  onChange={(e) => setEditingExpense({ ...editingExpense, date: e.target.value })}
                  className="select-field flex-1" />
              </div>
              <div>
                <label className="block mb-1 text-white">Descripción <span className="text-red-500">*</span></label>
                <input type="text" placeholder="Descripción" value={editingExpense.description}
                  onChange={(e) => setEditingExpense({ ...editingExpense, description: e.target.value })}
                  className="w-full" />
              </div>
              <div>
                <label className="block mb-1 text-white">Monto <span className="text-red-500">*</span></label>
                <input type="text" placeholder="Ej: 1.000,50" value={editingExpense.AmountBsCaptureType}
                  onChange={(e) => setEditingExpense({ ...editingExpense, AmountBsCaptureType: e.target.value as any })}
                  className="select-field flex-1" />
              </div>
              <div>
                <label className="block mb-1 text-white">Periodo <span className="text-red-500">*</span></label>
                <input type="date" value={editingExpense.period}
                  onChange={(e) => setEditingExpense({ ...editingExpense, period: e.target.value })}
                  className="select-field flex-1" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3 border-t border-slate-700 pt-4">
              <CancelButton onClick={() => { setEditingId(null); setEditingExpense(null); }} />
              <SaveButton onClick={() => updateExpense(editingId, editingExpense)} children="Guardar cambios" />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ExpensesManagement;




