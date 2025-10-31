import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { Loader } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";


const API_URL = 'https://backend-country-nnxe.onrender.com/alpha_consumption_control/';

// Ruta pública del logo (en public/image/LogoHipica.png)
const LOGO_URL = `${import.meta.env.BASE_URL}image/LogoHipica.png`;

interface FoodOption {
  idFood: number;
  foodName: string;
}

interface ReportRow {
  horse_id: number;
  horse_name: string;
  owner_id: number;
  owner_name: string;
  period: string; // YYYY-MM
  consumptionKlg: number;
  daysConsumptionMonth: number;
  klgMes: number;
  stateSchool: boolean;    // 👈 NUEVO
}

interface ReportSummary {
  comen: number;
  no_comen: number;
  caballos_escuela: number;
  total_caballos: number;
  total_klg: number;
  total_klg_mes: number;
}

interface ReportData {
  period_month: string;
  food_id?: number | null;
  food_name?: string | null;
  rows: ReportRow[];
  summary: ReportSummary;
}

// Helper: URL pública -> DataURL (base64) para jsPDF.addImage
function urlToDataUrl(url: string): Promise<string> {
  return fetch(url)
    .then((r) => r.blob())
    .then(
      (blob) =>
        new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        })
    );
}

const AlphaConsumptionControl: React.FC = () => {
  // filtros
  const [foods, setFoods] = useState<FoodOption[]>([]);
  const [foodId, setFoodId] = useState<number | null>(null); // null = todos
  const [periods, setPeriods] = useState<string[]>([]);
  const [period, setPeriod] = useState<string>("");

  // datos
  const [report, setReport] = useState<ReportData | null>(null);

  // estados UI
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingPeriods, setLoadingPeriods] = useState<boolean>(false);
  const [loadingReport, setLoadingReport] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);

  // Logo en DataURL (para el PDF)
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  useEffect(() => {
    urlToDataUrl(LOGO_URL).then(setLogoDataUrl).catch(() => setLogoDataUrl(null));
  }, []);

  // --- API calls ---
  const fetchFoods = async () => {
    try {
      const res = await fetch(`${API_URL}foods`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setFoods(data);
    } catch (e: any) {
      console.error(e);
      toast.error("No se pudieron cargar los alimentos.");
      setFoods([]);
    }
  };

  const fetchPeriods = async (foodIdParam?: number | null) => {
    setLoadingPeriods(true);
    try {
      const url = foodIdParam ? `${API_URL}periods?food_id=${foodIdParam}` : `${API_URL}periods`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: string[] = await res.json();
      setPeriods(data);
      setPeriod(data[0] || "");
    } catch (e: any) {
      console.error(e);
      toast.error("No se pudieron cargar los periodos.");
      setPeriods([]);
      setPeriod("");
    } finally {
      setLoadingPeriods(false);
    }
  };

  const fetchReport = async (periodParam: string, foodIdParam?: number | null) => {
    if (!periodParam) return;
    setLoadingReport(true);
    try {
      const url = foodIdParam
        ? `${API_URL}consumption?period_month=${encodeURIComponent(periodParam)}&food_id=${foodIdParam}`
        : `${API_URL}consumption?period_month=${encodeURIComponent(periodParam)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ReportData = await res.json();
      setReport(data);
    } catch (e: any) {
      console.error(e);
      toast.error("No se pudo cargar el reporte.");
      setReport(null);
    } finally {
      setLoadingReport(false);
    }
  };

  // Carga inicial
  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchFoods();
      await fetchPeriods(null);
      setLoading(false);
    })();
  }, []);

  // Al cambiar alimento -> recargo periodos
  useEffect(() => {
    fetchPeriods(foodId);
  }, [foodId]);

  // Al cambiar periodo/alimento -> recargo reporte
  useEffect(() => {
    if (!period) {
      setReport(null);
      return;
    }
    fetchReport(period, foodId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, foodId]);

  const totals = useMemo(() => report?.summary, [report]);

  const sortedRows = useMemo(() => {
    if (!report?.rows) return [];
    return [...report.rows].sort((a, b) => a.horse_id - b.horse_id);
  }, [report]);

  // --------- Exportar a PDF Diseño----------
  const nf = new Intl.NumberFormat("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const exportPDF = async () => {
    if (!report) return;
    try {
      setExporting(true);

      const doc = new jsPDF({ orientation: "landscape", unit: "pt" });

      // LOGO
      try {
        if (logoDataUrl) {
          const margin = 40, w = 120, h = 70;
          const pageW = doc.internal.pageSize.getWidth();
          doc.addImage(logoDataUrl, "PNG", pageW - w - margin, 20, w, h);
        }
      } catch (e) {
        console.warn("No se pudo dibujar el logo:", e);
      }

      const alimento = report.food_id ? report.food_name : "Todos";
      const periodo = report.period_month;
      const titulo = "Control Consumo por Caballo";
      const now = dayjs().format("YYYY-MM-DD HH:mm");

      // Encabezado (título centrado)
      const pageW = doc.internal.pageSize.getWidth();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(titulo, pageW / 2, 50, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Alimento: ${alimento ?? "-"}`, 40, 70);
      doc.text(`Mes: ${periodo}`, 40, 85);
      doc.text(`Generado: ${now}`, 40, 100);

      // === 1) TABLA PRINCIPAL (detalle) ===
      autoTable(doc, {
        startY: 120,
        theme: "striped",
        head: [["Caballo", "Propietario", "Cons. (Klg)", "Días", "Klg Mes", "Escuela"]],
        body: sortedRows.map(r => [
          r.horse_name,
          r.owner_name,
          nf.format(r.consumptionKlg ?? 0),
          nf.format(r.daysConsumptionMonth ?? 0),
          nf.format(r.klgMes ?? 0),
          r.stateSchool ? "Sí" : "No",
        ]) ?? [],
        styles: { fontSize: 9, cellPadding: 6 },     // cuerpo blanco por defecto
        headStyles: {
          fillColor: [38, 72, 131],                  // #264883
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        didDrawPage: (data) => {
          const pageCount = doc.getNumberOfPages();
          doc.setFontSize(9);
          doc.text(
            `Página ${data.pageNumber} de ${pageCount}`,
            doc.internal.pageSize.getWidth() - 120,
            doc.internal.pageSize.getHeight() - 20
          );
        },
      });

      // === 2) TABLA RESUMEN (debajo de la principal) ===
      const afterDetailY =
        (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 16 : 220;

      autoTable(doc, {
        startY: afterDetailY,
        theme: "grid",
        head: [["Resumen", "Valor"]],
        body: [
          ["COMEN SECCIÓN", String(report.summary.comen ?? 0)],
          ["NO COMEN SECCIÓN", String(report.summary.no_comen ?? 0)],
          ["CABALLOS DE ESCUELA", String(report.summary.caballos_escuela ?? 0)],
          ["TOTAL CABALLOS", String(report.summary.total_caballos ?? 0)],
          ["TOTAL KLG", nf.format(report.summary.total_klg ?? 0)],
          ["TOTAL KLG MES", nf.format(report.summary.total_klg_mes ?? 0)],
        ],
        styles: { fontSize: 9, cellPadding: 6, overflow: "linebreak" },
        headStyles: {
          fillColor: [38, 72, 131],                  // #264883
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        columnStyles: {
          0: { cellWidth: 160 },   // 1ª columna más angosta
          1: { cellWidth: "auto" }
        },
        tableWidth: "wrap",
      });

      const fname = `Consumo_${(alimento || "Todos").toString().replace(/\s+/g, "_")}_${periodo}.pdf`;
      doc.save(fname);
      toast.success("PDF exportado.");
    } catch (e) {
      console.error(e);
      toast.error("No se pudo exportar el PDF.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div  className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
      <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">Control Consumo Alfa</h1>
      
      {/* Filtros */}
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.5)] text-[#F8F4E3]">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-xl font-semibold">Filtros</h2>

          {/* Botón Exportar PDF */}
          <button
            onClick={exportPDF}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-md font-semibold disabled:opacity-50"
            disabled={!report || loadingReport || exporting}
            title="Exporta el reporte filtrado actual"
          >
            {exporting ? "Exportando..." : "Exportar PDF"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col">
            <label className="block mb-1">Alimento</label>
            <select
              className="w-full p-2 rounded-md bg-gray-700 text-white"
              value={foodId ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                setFoodId(v === "" ? null : Number(v));
              }}
            >
              <option value="">Todos los alimentos</option>
              {foods.map((f) => (
                <option key={f.idFood} value={f.idFood}>
                  {f.foodName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="block mb-1">Mes</label>
            <select
              className="w-full p-2 rounded-md bg-gray-700 text-white"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              disabled={loadingPeriods}
            >
              {loadingPeriods ? (
                <option>Cargando...</option>
              ) : periods.length ? (
                periods.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))
              ) : (
                <option value="">Sin periodos</option>
              )}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => fetchReport(period, foodId)}
              className="w-full p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold"
              disabled={!period || loadingReport}
            >
              {loadingReport ? "Actualizando..." : "Actualizar"}
            </button>
          </div>
        </div>
      </div>

      {/* Resumen + Tabla */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
          <Loader size={24} className="animate-spin" /> Cargando...
        </div>
      ) : !report ? (
        <div className="bg-gray-800 p-6 rounded-lg text-gray-300">
          Selecciona filtros para ver el reporte.
        </div>
      ) : (
        <>
          {/* Resumen */}
          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.5)] text-[#F8F4E3]">
            <h2 className="text-xl font-semibold mb-4">Resumen</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-gray-700 p-4 rounded-md">
                <div className="text-xs text-gray-300">COMEN SECCIÓN</div>
                <div className="text-2xl font-bold">{totals?.comen} CABALLOS</div>
              </div>
              <div className="bg-gray-700 p-4 rounded-md">
                <div className="text-xs text-gray-300">NO COMEN SECCIÓN</div>
                <div className="text-2xl font-bold">{totals?.no_comen} CABALLOS</div>
              </div>
              <div className="bg-gray-700 p-4 rounded-md">
                <div className="text-xs text-gray-300">CABALLOS DE ESCUELA</div>
                <div className="text-2xl font-bold">{totals?.caballos_escuela}</div>
              </div>
              <div className="bg-gray-700 p-4 rounded-md">
                <div className="text-xs text-gray-300">TOTAL CABALLOS</div>
                <div className="text-2xl font-bold">{totals?.total_caballos}</div>
              </div>
              <div className="bg-gray-700 p-4 rounded-md">
                <div className="text-xs text-gray-300">TOTAL KLG</div>
                <div className="text-2xl font-bold">{totals?.total_klg}</div>
              </div>
              <div className="bg-gray-700 p-4 rounded-md">
                <div className="text-xs text-gray-300">TOTAL KLG MES</div>
                <div className="text-2xl font-bold">{totals?.total_klg_mes}</div>
              </div>
            </div>
          </div>

          {/* Tabla */}
          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.5)] text-[#F8F4E3]">
            <h2 className="text-xl font-semibold mb-4">Detalle por Caballo</h2>
            <div className="overflow-auto border border-gray-700 rounded">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-750">
                  <tr className="text-left">
                    <th className="p-2">Caballo</th>
                    <th className="p-2">Propietario</th>
                    <th className="p-2 text-right">Cons. (Klg)</th>
                    <th className="p-2 text-right">Días</th>
                    <th className="p-2 text-right">Klg Mes</th>
                    <th className="p-2 text-center">Escuela</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.length ? (
                    sortedRows.map((r) => (
                      <tr key={r.horse_id} className="border-t border-gray-700">
                        <td className="p-2">{r.horse_name}</td>
                        <td className="p-2">{r.owner_name}</td>
                        <td className="p-2 text-right">{nf.format(r.consumptionKlg)}</td>
                        <td className="p-2 text-right">{nf.format(r.daysConsumptionMonth)}</td>
                        <td className="p-2 text-right font-medium">{nf.format(r.klgMes)}</td>
                        <td className="p-2 text-center">{r.stateSchool ? 'Sí' : 'No'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="p-3 text-center" colSpan={5}>
                        Sin datos
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AlphaConsumptionControl;
