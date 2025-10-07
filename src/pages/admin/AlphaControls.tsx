import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Plus, Save, Trash2, Loader, X, Edit, FileText } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";
import 'dayjs/locale/es';
dayjs.locale('es');


const API_URL = "http://localhost:8000/alpha_controls/";

interface ProviderLite {
  idFoodProvider: number;
  supplierName: string;
}

interface AlphaControl {
  idAlphaControl?: number;
  date: string;
  alphaIncome: number;
  unitPrice: number;
  totalPurchasePrice: number;
  outcome: number;
  balance: number;
  salePrice: number;
  income: number;
  fk_idFoodProvider: number | null;
  provider?: ProviderLite;
}

// 🔹 Formatea visualmente (para mostrar en tabla o PDF)
const formatDisplay = (value: number): string => {
  if (isNaN(value)) return "";
  return new Intl.NumberFormat("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// 🔹 Limpia la entrada del usuario (solo permite números, comas y puntos)
const normalizeInput = (raw: string): string => {
  return raw.replace(/[^\d.,]/g, "");
};

// 🔹 Convierte el string formateado a número (interno)
const parseToNumber = (raw: string): number => {
  if (!raw) return 0;
  const cleaned = raw.replace(/\./g, "").replace(",", ".");
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100) / 100; // 🔸 Redondea a 2 decimales
};

const AlphaControlsManagement: React.FC = () => {
  const [controls, setControls] = useState<AlphaControl[]>([]);
  const [newControl, setNewControl] = useState<AlphaControl>({
    date: "",
    alphaIncome: 0,
    unitPrice: 0,
    totalPurchasePrice: 0,
    outcome: 0,
    balance: 0,
    salePrice: 0,
    income: 0,
    fk_idFoodProvider: null,
  });

  const [displayInputs, setDisplayInputs] = useState({
    alphaIncome: "",
    unitPrice: "",
    outcome: "",
    salePrice: "",
  });

  const [foodProviders, setFoodProviders] = useState<ProviderLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<AlphaControl | null>(null);
  const [, setEditDisplay] = useState({
    alphaIncome: "",
    unitPrice: "",
    outcome: "",
    salePrice: "",
  });
  const [exporting, setExporting] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [isMonthlyClose, setIsMonthlyClose] = useState(false);


  // ===== Cargar logo =====
  useEffect(() => {
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

  // ===== Fetch datos =====
  const fetchFoodProviders = async () => {
    try {
      const res = await fetch("http://localhost:8000/food-providers/");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setFoodProviders(data);
    } catch {
      toast.error("Error al obtener proveedores");
    }
  };

  const fetchControls = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      const data = await res.json();

      // 🔹 ordenar siempre por ID (asegura orden ascendente)
      const sorted = [...data].sort(
        (a, b) => a.idAlphaControl - b.idAlphaControl
      );

      // 🔹 recalcular saldo en orden correcto
      setControls(calculateWithBalance(sorted));
    } catch {
      toast.error("No se pudieron cargar los controles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchControls();
    fetchFoodProviders();
  }, []);

  // ===== Calcular saldo acumulado =====
  const calculateWithBalance = (controls: AlphaControl[]) => {
    let saldo = 0;
    return controls.map((c) => {
      saldo = saldo + c.alphaIncome - c.outcome;
      return { ...c, balance: saldo };
    });
  };

  // ===== Input controlado (sin autocompletar) =====
  const handleDynamicInput = (
    field: keyof AlphaControl,
    rawValue: string,
    isEdit = false
  ) => {
    const cleaned = normalizeInput(rawValue);
    const num = parseToNumber(cleaned);

    if (isEdit && editData) {
      setEditDisplay((prev) => ({ ...prev, [field]: cleaned }));
      setEditData({ ...editData, [field]: num });
    } else {
      setDisplayInputs((prev) => ({ ...prev, [field]: cleaned }));
      setNewControl({ ...newControl, [field]: num });
    }
  };
  
  // ===== CRUD =====
  const handleSubmit = async () => {
    // === VALIDACIÓN SEGÚN ESTADO ===
    if (!isMonthlyClose) {
      if (!newControl.fk_idFoodProvider) {
        toast.error("Debes seleccionar un proveedor para registrar una compra.");
        return;
      }
      if (!newControl.alphaIncome || !newControl.unitPrice || !newControl.salePrice) {
        toast.error("Completa los campos de Ingreso, Precio unitario y Precio venta.");
        return;
      }
    } else {
      // Para el cierre de mes (venta)
      if (!newControl.outcome || !newControl.salePrice) {
        toast.error("Completa los campos de Egreso y Precio venta para el cierre de mes.");
        return;
      }
    }


    try {
      const payload = {
        ...newControl,
        totalPurchasePrice: Math.round(
          newControl.alphaIncome * newControl.unitPrice * 100
        ) / 100,
        income:
          Math.round(newControl.outcome * newControl.salePrice * 100) / 100,
      };

      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `${API_URL}${editingId}` : API_URL;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();

      const result = await res.json();
      let updatedControls: AlphaControl[] = [];

      if (editingId) {
        toast.success("Control actualizado!");
        // 🔹 Reemplazamos el registro editado en su posición original
        updatedControls = controls.map((c) =>
          c.idAlphaControl === editingId ? result : c
        );
      } else {
        toast.success("Control creado!");
        // 🔹 Agregamos el nuevo registro al final
        updatedControls = [...controls, result];
      }

      // 🔹 Mantener orden por ID antes de recalcular balances
      updatedControls = updatedControls.sort(
        (a, b) => (a.idAlphaControl ?? 0) - (b.idAlphaControl ?? 0)
      );

      // 🔹 Recalcular balances acumulados globalmente
      updatedControls = calculateWithBalance(updatedControls);


      // 🔹 Guardar los nuevos datos recalculados
      setControls(updatedControls);

      // 🔹 Resetear formulario y salir del modo edición
      resetForm();
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar control");
    }
  };



  const resetForm = () => {
    setNewControl({
      date: "",
      alphaIncome: 0,
      unitPrice: 0,
      totalPurchasePrice: 0,
      outcome: 0,
      balance: 0,
      salePrice: 0,
      income: 0,
      fk_idFoodProvider: null,
    });
    setDisplayInputs({
      alphaIncome: "",
      unitPrice: "",
      outcome: "",
      salePrice: "",
    });
    setEditingId(null);
  };

  const startEdit = (control: AlphaControl) => {
    setEditingId(control.idAlphaControl!);
    setNewControl(control);
    setDisplayInputs({
      alphaIncome: formatDisplay(control.alphaIncome),
      unitPrice: formatDisplay(control.unitPrice),
      outcome: formatDisplay(control.outcome),
      salePrice: formatDisplay(control.salePrice),
    });
    toast("Modo edición activado ✏️");

    // 🔹 Opcional: hacer scroll automático al formulario superior
    window.scrollTo({ top: 0, behavior: "smooth" });
  };


  const deleteControl = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Eliminado correctamente");

      // 🔹 Volver a traer los datos actualizados y recalcular balances
      fetchControls();
    } catch {
      toast.error("Error al eliminar");
    }
  };


  // ===== PDF =====
  const exportAlphaPDF = async () => {
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
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(
        "Reporte de Control de Alfalfa",
        doc.internal.pageSize.getWidth() / 2,
        50,
        { align: "center" }
      );
      const body = controls.map((p, i) => [
        i + 1,
        p.date ? new Date(p.date).toLocaleDateString("es-BO") : "—",
        p.provider?.supplierName
          ? p.provider.supplierName
          : `VENTA DE ALFA - ${dayjs(p.date).locale("es").format("MMMM").toUpperCase()}`,
        formatDisplay(p.alphaIncome) + " KLG",
        formatDisplay(p.totalPurchasePrice) + " Bs",
        formatDisplay(p.outcome) + " KLG",
        formatDisplay(p.income) + " Bs",
      ]);
      autoTable(doc, {
        startY: 110,
        head: [
          [
            "#",
            "FECHA",
            "PROVEEDOR",
            "INGRESO KLG.",
            "PRECIO COMPRA",
            "EGRESO KLG.",
            "INGRESO Bs.",
          ],
        ],
        body,
        styles: { fontSize: 9, cellPadding: 6 },
      });
      doc.save(`Alfalfa_${dayjs().format("YYYYMMDD_HHmm")}.pdf`);
      toast.success("PDF generado");
    } catch (err) {
      toast.error("No se pudo generar el PDF");
    } finally {
      setExporting(false);
    }
  };



  return (
    <div className="bg-slate-900 p-6 rounded-lg shadow-xl mb-8 border border-slate-700 overflow-x-auto">
      <h1 className="text-3xl font-bold mb-6 text-center text-teal-400">
        Gestión de Control de Alfalfa
      </h1>

      <div className="flex justify-end mb-4">
        <button
          onClick={exportAlphaPDF}
          disabled={exporting}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-md font-semibold flex items-center gap-2"
        >
          <FileText size={18} />
          {exporting ? "Generando..." : "Exportar PDF"}
        </button>
      </div>

      {/* FORMULARIO (crear / editar) */}
      <div className="bg-slate-800 p-6 rounded-lg shadow-xl mb-8 border border-slate-700">
        <h2 className="text-xl font-semibold mb-4 text-teal-400">
          {editingId ? "Editar Control de Alfalfa" : "Agregar Nuevo Control"}
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div>
            <label className="text-sm mb-1 block">FECHA</label>
            <input
              type="date"
              value={newControl.date}
              onChange={(e) =>
                setNewControl({ ...newControl, date: e.target.value })
              }
              className="w-full p-2 rounded-md bg-gray-700 text-white"
            />
          </div>

          <div>
            <label className="text-sm mb-1 block">
              PROVEEDOR{" "}
              {!isMonthlyClose && (
                <span className="text-red-400">*</span>
              )}
            </label>
            <select
              value={newControl.fk_idFoodProvider ?? ""}
              onChange={(e) =>
                setNewControl({
                  ...newControl,
                  fk_idFoodProvider: e.target.value ? Number(e.target.value) : null,
                })
              }
              className={`w-full p-2 rounded-md text-white ${
                isMonthlyClose ? "bg-gray-600 opacity-60 cursor-not-allowed" : "bg-gray-700"
              }`}
              disabled={isMonthlyClose}
            >
              <option value="">-- Sin proveedor --</option>
              {foodProviders.map((p) => (
                <option key={p.idFoodProvider} value={p.idFoodProvider}>
                  {p.supplierName}
                </option>
              ))}
            </select>
          </div>


          {[
            { label: "INGRESO KLG.", field: "alphaIncome" },
            { label: "PRECIO UNITARIO Bs.", field: "unitPrice" },
            { label: "EGRESO KLG.", field: "outcome" },
            { label: "PRECIO VENTA Bs.", field: "salePrice" },
          ].map(({ label, field }) => {
            // 🔹 lógica de habilitación
            const disabled =
              (isMonthlyClose && (field === "alphaIncome" || field === "unitPrice")) ||
              (!isMonthlyClose && field === "outcome");

            // 🔹 lógica de obligatoriedad
            const required =
              isMonthlyClose
                ? field === "outcome" || field === "salePrice"
                : field === "alphaIncome" ||
                  field === "unitPrice" ||
                  field === "salePrice";

            return (
              <div key={field}>
                <label className="text-sm mb-1 block">
                  {label} {required && <span className="text-red-400">*</span>}
                </label>
                <input
                  type="text"
                  placeholder="0,00"
                  value={(displayInputs as any)[field]}
                  onChange={(e) =>
                    handleDynamicInput(field as keyof AlphaControl, e.target.value)
                  }
                  className={`w-full p-2 rounded ${
                    disabled ? "bg-gray-600 opacity-60" : "bg-gray-700"
                  } text-white`}
                  disabled={disabled}
                  required={required}
                />
              </div>
            );
          })}
          
          <div className="col-span-full flex justify-between items-center mt-4">
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={isMonthlyClose}
                onChange={(e) => setIsMonthlyClose(e.target.checked)}
                className="w-4 h-4 accent-teal-500"
              />
              Cierre de mes
            </label>

            <div className="col-span-full flex justify-end gap-3">
              <button
                onClick={handleSubmit}
                className={`${
                  editingId
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-green-600 hover:bg-green-700"
                } text-white px-4 py-2 rounded-md font-semibold flex items-center gap-2`}
              >
                {editingId ? <Save size={20} /> : <Plus size={20} />}
                {editingId ? "Guardar Cambios" : "Agregar"}
              </button>

              {editingId && (
                <button
                  onClick={resetForm}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-semibold flex items-center gap-2"
                >
                  <X size={20} /> Cancelar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* TABLA */}
      <div className="bg-slate-800 p-6 rounded-lg shadow-xl mb-8 border border-slate-700 overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            <Loader size={24} className="animate-spin" /> Cargando controles...
          </div>
        ) : (
          <table className="w-full border-collapse text-sm text-gray-200">
            <thead className="bg-slate-700 text-gray-100">
              <tr>
                <th className="p-2 border border-slate-600">FECHA</th>
                <th className="p-2 border border-slate-600">PROVEEDOR</th>
                <th className="p-2 border border-slate-600">INGRESO KLG.</th>
                <th className="p-2 border border-slate-600">PRECIO UNITARIO</th>
                <th className="p-2 border border-slate-600">PRECIO COMPRA</th>
                <th className="p-2 border border-slate-600">EGRESO KLG.</th>
                <th className="p-2 border border-slate-600">SALDO KLG.</th>
                <th className="p-2 border border-slate-600">PRECIO VENTA</th>
                <th className="p-2 border border-slate-600">INGRESO Bs.</th>
                <th className="p-2 border border-slate-600">ACCIONES</th>
              </tr>
            </thead>

            <tbody>
              {controls.map((control) => (
                <tr key={control.idAlphaControl} className="hover:bg-slate-600">
                  <td className="p-2 border border-slate-600">
                    {control.date?.slice(0, 10)}
                  </td>
                  <td
                    className={`p-2 border border-slate-600 tracking-wide ${
                      control.provider?.supplierName
                        ? "text-white font-normal"
                        : "text-yellow-300 font-semibold"
                    }`}
                  >
                    {control.provider?.supplierName
                      ? control.provider.supplierName
                      : `VENTA DE ALFA - ${dayjs(control.date)
                          .locale("es")
                          .format("MMMM")
                          .toUpperCase()}`}
                  </td>
                  <td className="p-2 border border-slate-600">
                    {formatDisplay(control.alphaIncome)}
                  </td>
                  <td className="p-2 border border-slate-600">
                    {formatDisplay(control.unitPrice)}
                  </td>
                  <td className="p-2 border border-slate-600">
                    {formatDisplay(control.totalPurchasePrice)}
                  </td>
                  <td className="p-2 border border-slate-600">
                    {formatDisplay(control.outcome)}
                  </td>
                  <td className="p-2 border border-slate-600">
                    {formatDisplay(control.balance)}
                  </td>
                  <td className="p-2 border border-slate-600">
                    {formatDisplay(control.salePrice)}
                  </td>
                  <td className="p-2 border border-slate-600">
                    {formatDisplay(control.outcome * control.salePrice)}
                  </td>
                  <td className="p-2 border border-slate-600 flex gap-2">
                    <button
                      onClick={() => startEdit(control)}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded-md flex items-center gap-1"
                    >
                      <Edit size={14} /> Editar
                    </button>
                    <button
                      onClick={() => deleteControl(control.idAlphaControl!)}
                      className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded-md flex items-center gap-1"
                    >
                      <Trash2 size={14} /> Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );


};

export default AlphaControlsManagement;