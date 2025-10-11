import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Save, Trash2, Loader, X } from 'lucide-react';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const API_URL = 'https://backend-country-nnxe.onrender.com/income/';

interface Income {
  idIncome?: number;
  date: string; // "YYYY-MM-DD"
  description: string;
  amountBsCaptureType: number;
  period: string; // "YYYY-MM-DD"
  created_at?: string;
}

const IncomeManagement = () => {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [newIncome, setNewIncome] = useState<Income>({
    date: '',
    description: '',
    amountBsCaptureType: 0,
    period: '',
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterMonth, setFilterMonth] = useState("");
  const [exporting, setExporting] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);

  const fetchIncomes = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al obtener ingresos');
      const data = await res.json();
      setIncomes(data);
    } catch {
      toast.error('No se pudieron cargar los ingresos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomes();

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
    // ✅ Validar campos vacíos
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
      // 🧹 Limpiar el monto antes de enviar
      const cleanedAmount = (() => {
        let value = String(newIncome.amountBsCaptureType).trim();

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
          ...newIncome,
          amountBsCaptureType: cleanedAmount,
        }),
      });

      if (!res.ok) throw new Error("Error al crear ingreso");

      toast.success("Ingreso creado correctamente ✅");

      // 🧼 Limpiar formulario
      setNewIncome({
        date: "",
        description: "",
        amountBsCaptureType: 0,
        period: "",
      });

      fetchIncomes();
    } catch {
      toast.error("No se pudo crear el ingreso.");
    }
  };

  const updateIncome = async (id: number, updatedIncome: Income) => {
    // ✅ Validar campos vacíos
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
      // 🧹 Limpiar el monto antes de enviar
      const cleanedAmount = (() => {
        let value = String(updatedIncome.amountBsCaptureType).trim();

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
          ...updatedIncome,
          amountBsCaptureType: cleanedAmount,
        }),
      });

      if (!res.ok) throw new Error("Error al actualizar ingreso");

      toast.success("Ingreso actualizado correctamente ✅");

      // 🧼 Limpiar formulario y salir del modo edición
      setNewIncome({
        date: "",
        description: "",
        amountBsCaptureType: 0,
        period: "",
      });
      setEditingId(null);

      fetchIncomes();
    } catch {
      toast.error("No se pudo actualizar el ingreso.");
    }
  };



  const deleteIncome = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar ingreso');
      toast.success('Ingreso eliminado!');
      fetchIncomes();
    } catch {
      toast.error('No se pudo eliminar el ingreso.');
    }
  };

  // === Formatear número al estilo boliviano ===
  const formatCurrency = (value: number): string => {
    return value.toLocaleString("es-BO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // === Exportar PDF filtrado por mes ===
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

      // Título centrado
      const pageW = doc.internal.pageSize.getWidth();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      const titulo = filterMonth
        ? `Ingresos del mes ${new Date(filterMonth).toLocaleDateString("es-ES", {
            month: "long",
            year: "numeric",
          })}`
        : "Ingresos (sin filtro de mes)";
      doc.text(titulo, pageW / 2, 50, { align: "center" });

      // Fecha y hora
      const now = new Date();
      const fecha = now.toLocaleDateString("es-BO");
      const hora = now.toLocaleTimeString("es-BO", {
        hour: "2-digit",
        minute: "2-digit",
      });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Fecha: ${fecha}  Hora: ${hora}`, 40, 70);

      // Filtrar ingresos
      const filtered = filterMonth
        ? incomes.filter((i) => i.period?.startsWith(filterMonth))
        : incomes;

      const total = filtered.reduce(
        (acc, i) => acc + Number(i.amountBsCaptureType || 0),
        0
      );

      // Crear cuerpo de tabla
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

      // Guardar PDF
      const fileName = `Ingresos_${filterMonth || "SinFiltro"}_${now
        .toISOString()
        .slice(0, 10)}.pdf`;
      doc.save(fileName);
      toast.success("PDF generado correctamente");
    } catch {
      toast.error("No se pudo generar el PDF.");
    } finally {
      setExporting(false);
    }
  };


  return (
    <div className="bg-slate-900 p-6 rounded-lg shadow-xl mb-8 border border-slate-700">
      <h1 className="text-3xl font-bold mb-6 text-center text-teal-400">Gestión de Ingresos</h1>

      {/* === Formulario principal (crear / editar) === */}
      <div className="bg-slate-800 p-6 rounded-lg shadow-xl mb-8 border border-slate-700">
        <h2 className="text-xl font-semibold mb-4 text-teal-400">
          {editingId ? "Editar Ingreso" : "Agregar Nuevo Ingreso"}
        </h2>
        {editingId && (
          <div className="bg-yellow-800/30 border border-yellow-500 text-yellow-300 px-4 py-2 rounded-md mb-4 text-sm flex items-center gap-2 animate-fade-in">
            <Edit size={16} /> 
            <span>Estás editando un gasto existente. Modifica los datos y guarda los cambios.</span>
          </div>
        )}
        <div className="flex flex-wrap gap-4 items-end justify-between">
          <div className="flex flex-wrap gap-4">
            <div>
              <label htmlFor="date" className="block mb-1 text-white">
                Fecha <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="date"
                value={newIncome.date}
                onChange={(e) => setNewIncome({ ...newIncome, date: e.target.value })}
                className="flex-1 p-2 rounded-md bg-gray-700 text-white"
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
                value={newIncome.description}
                onChange={(e) => setNewIncome({ ...newIncome, description: e.target.value })}
                className="flex-1 p-2 rounded-md bg-gray-700 text-white"
              />
            </div>
            <div>
              <label htmlFor="amountBsCaptureType" className="block mb-1 text-white">
                Monto <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="amountBsCaptureType"
                placeholder="Ej: 1.000,50"
                value={newIncome.amountBsCaptureType}
                onChange={(e) =>
                  setNewIncome({
                    ...newIncome,
                    amountBsCaptureType: e.target.value as any,
                  })
                }
                className="flex-1 p-2 rounded-md bg-gray-700 text-white"
              />
            </div>
            <div>
              <label htmlFor="period" className="block mb-1 text-white">
                Periodo <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="period"
                value={newIncome.period}
                onChange={(e) => setNewIncome({ ...newIncome, period: e.target.value })}
                className="flex-1 p-2 rounded-md bg-gray-700 text-white"
              />
            </div>
          </div>

          {/* Botón dinámico */}
          {editingId ? (
            <div className="flex gap-2">
              <button
                onClick={() =>
                  updateIncome(editingId, {
                    ...newIncome,
                  })
                }
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md font-semibold flex items-center justify-center gap-1 text-sm h-[36px]"
              >
                <Save size={16} /> Guardar cambios
              </button>
              <button
                onClick={() => {
                  setEditingId(null);
                  setNewIncome({
                    date: "",
                    description: "",
                    amountBsCaptureType: 0,
                    period: "",
                  });
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded-md font-semibold flex items-center justify-center gap-1 text-sm h-[36px]"
              >
                <X size={16} /> Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={createIncome}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md font-semibold flex items-center justify-center gap-1 ml-auto text-sm h-[36px]"
            >
              <Plus size={16} /> Agregar
            </button>
          )}
        </div>

        {/* === Filtro + Exportar PDF === */}
        <div className="flex flex-wrap items-center justify-between mt-6 pt-4 border-t border-slate-600">
          <div className="flex items-center gap-2">
            <label className="text-white">Filtrar por mes:</label>
            <input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="bg-gray-700 text-white rounded-md p-2"
            />
          </div>

          <button
            onClick={exportFilteredPDF}
            disabled={exporting}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-3 py-1 rounded-md font-semibold flex items-center justify-center gap-1 text-sm h-[36px]"
          >
            {exporting ? "Generando..." : "Exportar PDF"}
          </button>
        </div>
      </div>

      {/* === Listado de ingresos === */}
      <div className="bg-slate-800 p-6 rounded-lg shadow-xl mb-8 border border-slate-700">
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            <Loader size={24} className="animate-spin" />Cargando ingresos...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {incomes.map((income) => (
              <div
                key={income.idIncome}
                className="bg-gray-700 p-4 rounded-md shadow-lg flex flex-col justify-between"
              >
                <h3 className="text-lg font-semibold">Descripción: {income.description}</h3>
                <p>Fecha: {income.date?.slice(0, 10)}</p>
                <p>Monto: {income.amountBsCaptureType}</p>
                <p>Periodo: {income.period?.slice(0, 10)}</p>
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => {
                      setEditingId(income.idIncome!);

                      // 🧠 Convertir punto decimal a coma solo para mostrar en el input
                      const displayAmount = income.amountBsCaptureType
                        ? String(income.amountBsCaptureType).replace(".", ",")
                        : "";

                      setNewIncome({
                        date: income.date,
                        description: income.description,
                        amountBsCaptureType: displayAmount as any, // guardamos como string visible
                        period: income.period,
                      });
                    }}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white p-2 rounded-md flex items-center gap-1"
                  >
                    <Edit size={16} /> Editar
                  </button>
                  <button
                    onClick={() => deleteIncome(income.idIncome!)}
                    className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-md flex items-center gap-1"
                  >
                    <Trash2 size={16} /> Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

};

export default IncomeManagement;