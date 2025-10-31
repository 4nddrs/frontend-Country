import { useState, useEffect, useMemo } from 'react';
import type { ChangeEvent } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Save, Trash2, Loader, X } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import dayjs from 'dayjs';

const API_URL = 'https://backend-country-nnxe.onrender.com/total_control/';
const BOX_CHARGE = 100;
const SECTION_CHARGE = 200;

const normalizeFlagString = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const resolveChargeFromFlag = (
  value: unknown,
  enabledAmount: number,
  fallback: number,
) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "boolean") {
    return value ? enabledAmount : 0;
  }

  if (typeof value === "string") {
    const normalized = normalizeFlagString(value);

    if (
      normalized === "true" ||
      normalized === "yes" ||
      normalized === "si" ||
      normalized === "1"
    ) {
      return enabledAmount;
    }

    if (
      normalized === "false" ||
      normalized === "no" ||
      normalized === "0" ||
      normalized === ""
    ) {
      return 0;
    }

    const parsed = Number(normalized.replace(",", "."));
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
};

const resolveNumericFlag = (value: unknown, fallback: number) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }

  if (typeof value === "string") {
    const normalized = normalizeFlagString(value);

    if (
      normalized === "true" ||
      normalized === "yes" ||
      normalized === "si" ||
      normalized === "1"
    ) {
      return 1;
    }

    if (
      normalized === "false" ||
      normalized === "no" ||
      normalized === "0" ||
      normalized === ""
    ) {
      return 0;
    }

    const parsed = Number(normalized.replace(",", "."));
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
};

const parseLocalizedNumber = (value: string) => {
  if (!value) return 0;

  const trimmed = value.replace(/\s/g, "");
  const hasComma = trimmed.includes(",");
  const hasDot = trimmed.includes(".");
  let normalized = trimmed;

  if (hasComma) {
    normalized = normalized.replace(/\./g, "");
    normalized = normalized.replace(/,/g, ".");
  } else if (hasDot) {
    const dotParts = normalized.split(".");

    if (dotParts.length > 2) {
      normalized = normalized.replace(/\./g, "");
    } else {
      const [, decimalPart = ""] = dotParts;
      if (decimalPart.length > 2) {
        normalized = normalized.replace(/\./g, "");
      } else {
        normalized = normalized.replace(/,/g, "");
      }
    }
  }

  normalized = normalized.replace(/[^\d.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatNumberForInput = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "";
  }

  const fixed = value.toFixed(2);
  const [integerPartRaw, decimalPartRaw = "00"] = fixed.split(".");
  const integerPart = integerPartRaw.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return `${integerPart},${decimalPartRaw}`;
};

const roundToTwo = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const safeNumber = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

const normalizeDateForInput = (value?: string | null) => {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  const [datePart] = trimmed.split("T");
  return datePart;
};

const formatNumberForPdf = (value: unknown) => {
  const numeric = safeNumber(value);
  const formatted = formatNumberForInput(numeric);
  return formatted === "" ? "0,00" : formatted;
};

const formatCurrencyForPdf = (value: unknown) =>
  `${formatNumberForPdf(value)} Bs`;

const buildOwnerDisplayName = (owner: any) => {
  if (!owner) return "";

  const pickString = (input: unknown) =>
    typeof input === "string"
      ? input.trim()
      : typeof input === "number"
      ? String(input)
      : "";

  const primary = pickString(owner.name ?? owner.Name);
  const firstName = pickString(owner.firstName ?? owner.FirstName);
  const parts = [primary, firstName].filter((part) => part.length > 0);

  if (parts.length > 0) {
    return parts.join(" ");
  }

  return pickString(owner.lastName ?? owner.LastName ?? owner.lastname);
};

const RequiredMark = () => <span className="text-red-400 ml-1">*</span>;

interface TotalControl {
  idTotalControl?: number;
  toCaballerizo: number;
  vaccines: number;
  anemia: number;
  deworming: number;
  consumptionAlfaDiaKlg: number;
  costAlfaBs: number;
  daysConsumptionMonth: number;
  consumptionAlphaMonthKlg: number;
  costTotalAlphaBs: number;
  cubeChala: number;
  UnitCostChalaBs: number;
  costTotalChalaBs: number;
  totalCharge: number;
  fk_idOwner: number;
  fk_idHorse: number;
  period: string;
  created_at?: string;
  box: number;
  section: number;
  basket: number;
}

const numericFields = [
  "toCaballerizo",
  "vaccines",
  "anemia",
  "deworming",
  "consumptionAlfaDiaKlg",
  "costAlfaBs",
  "daysConsumptionMonth",
  "consumptionAlphaMonthKlg",
  "costTotalAlphaBs",
  "cubeChala",
  "UnitCostChalaBs",
  "costTotalChalaBs",
  "totalCharge",
  "box",
  "section",
  "basket",
 ] as const;

type NumericField = (typeof numericFields)[number];

const DERIVED_FIELDS = [
  "consumptionAlphaMonthKlg",
  "costTotalAlphaBs",
  "costTotalChalaBs",
  "totalCharge",
] as const;

type DerivedField = (typeof DERIVED_FIELDS)[number];

const REQUIRED_NUMERIC_FIELDS: NumericField[] = [
  "box",
  "section",
  "basket",
  "toCaballerizo",
  "vaccines",
  "anemia",
  "deworming",
  "consumptionAlfaDiaKlg",
  "costAlfaBs",
  "daysConsumptionMonth",
  "cubeChala",
  "UnitCostChalaBs",
];

const FIELD_LABELS: Partial<Record<NumericField, string>> = {
  box: "Box",
  section: "Seccion",
  basket: "Canaston",
  toCaballerizo: "A/ caballerizo",
  vaccines: "Vacunas",
  anemia: "Anemia",
  deworming: "Desparasitacion",
  consumptionAlfaDiaKlg: "Consumo alfalfa por dia (Kg)",
  costAlfaBs: "Costo alfalfa (Bs)",
  daysConsumptionMonth: "Dias de consumo al mes",
  cubeChala: "Cubo de chala",
  UnitCostChalaBs: "Costo unitario chala (Bs)",
};

const applyDerivedValues = (control: TotalControl): TotalControl => {
  const consumptionAlphaMonthKlg = roundToTwo(
    safeNumber(control.consumptionAlfaDiaKlg) *
      safeNumber(control.daysConsumptionMonth)
  );

  const costTotalAlphaBs = roundToTwo(
    consumptionAlphaMonthKlg * safeNumber(control.costAlfaBs)
  );

  const costTotalChalaBs = roundToTwo(
    safeNumber(control.cubeChala) * safeNumber(control.UnitCostChalaBs)
  );

  const totalCharge = roundToTwo(
    safeNumber(control.box) +
      safeNumber(control.section) +
      safeNumber(control.basket) +
      safeNumber(control.toCaballerizo) +
      safeNumber(control.vaccines) +
      safeNumber(control.anemia) +
      safeNumber(control.deworming) +
      costTotalAlphaBs +
      costTotalChalaBs
  );

  return {
    ...control,
    consumptionAlphaMonthKlg,
    costTotalAlphaBs,
    costTotalChalaBs,
    totalCharge,
    period: normalizeDateForInput(control.period),
  };
};

const getDerivedFormValues = (
  control: TotalControl,
  zeroAsEmpty = false
): Partial<Record<DerivedField, string>> => {
  const formatted: Partial<Record<DerivedField, string>> = {};

  DERIVED_FIELDS.forEach((field) => {
    const value = control[field];
    if ((value === 0 || value === null) && zeroAsEmpty) {
      formatted[field] = "";
    } else {
      formatted[field] = formatNumberForInput(value);
    }
  });

  return formatted;
};

const createInitialControl = (
  overrides: Partial<TotalControl> = {}
): TotalControl => {
  const normalizedPeriod = normalizeDateForInput(overrides.period);

  return {
    idTotalControl: overrides.idTotalControl,
    toCaballerizo: overrides.toCaballerizo ?? 0,
    vaccines: overrides.vaccines ?? 0,
    anemia: overrides.anemia ?? 0,
    deworming: overrides.deworming ?? 0,
    consumptionAlfaDiaKlg: overrides.consumptionAlfaDiaKlg ?? 0,
    costAlfaBs: overrides.costAlfaBs ?? 0,
    daysConsumptionMonth: overrides.daysConsumptionMonth ?? 0,
    consumptionAlphaMonthKlg: overrides.consumptionAlphaMonthKlg ?? 0,
    costTotalAlphaBs: overrides.costTotalAlphaBs ?? 0,
    cubeChala: overrides.cubeChala ?? 0,
    UnitCostChalaBs: overrides.UnitCostChalaBs ?? 0,
    costTotalChalaBs: overrides.costTotalChalaBs ?? 0,
    totalCharge: overrides.totalCharge ?? 0,
    fk_idOwner: overrides.fk_idOwner ?? 0,
    fk_idHorse: overrides.fk_idHorse ?? 0,
    box: overrides.box ?? 0,
    section: overrides.section ?? 0,
    basket: overrides.basket ?? 0,
    period: normalizedPeriod,
    created_at: overrides.created_at,
  };
};

const formatControlToForm = (
  control: TotalControl,
  zeroAsEmpty = false
): Partial<Record<NumericField, string>> => {
  const normalized = applyDerivedValues(control);
  const formatted: Partial<Record<NumericField, string>> = {};

  numericFields.forEach((field) => {
    const value = normalized[field] ?? 0;
    if ((value === 0 || value === null) && zeroAsEmpty) {
      formatted[field] = "";
    } else {
      formatted[field] = formatNumberForInput(value);
    }
  });

  return formatted;
};

const TotalControlManagement = () => {
  const [controls, setControls] = useState<TotalControl[]>([]);
  const [newControl, setNewControl] = useState<TotalControl>(() =>
    applyDerivedValues(createInitialControl())
  );
  const [formValues, setFormValues] = useState<
    Partial<Record<NumericField, string>>
  >(() => formatControlToForm(createInitialControl(), true));
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  
  // For related data selects
  const [owners, setOwners] = useState<any[]>([]);
  const [horses, setHorses] = useState<any[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<number | null>(null);
  const [horseLookup, setHorseLookup] = useState<Record<number, string>>({});
  const [exporting, setExporting] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [filterMonth, setFilterMonth] = useState<string>("");
  const [filterYear, setFilterYear] = useState<string>("");

  const availableYears = useMemo(() => {
    const yearSet = new Set<string>();
    controls.forEach((control) => {
      const normalized = normalizeDateForInput(control.period);
      if (normalized) {
        yearSet.add(normalized.slice(0, 4));
      }
    });
    return Array.from(yearSet).sort();
  }, [controls]);

  const handleNumericInputChange =
    (field: NumericField) => (event: ChangeEvent<HTMLInputElement>) => {
      const rawValue = event.target.value;
      const sanitized = rawValue.replace(/[^\d.,-]/g, "");

      setFormValues((prev) => ({
        ...prev,
        [field]: sanitized,
      }));

      const parsed = parseLocalizedNumber(sanitized);

      setNewControl((prev) => {
        const updated = { ...prev, [field]: parsed };
        const recalculated = applyDerivedValues(updated);

        setFormValues((prevForm) => ({
          ...prevForm,
          ...getDerivedFormValues(recalculated),
        }));

        return recalculated;
      });
    };

  const handleNumericInputBlur = (field: NumericField) => () => {
    setFormValues((prev) => {
      const nextValue = prev[field];
      if (nextValue === "") {
        return prev;
      }

      return {
        ...prev,
        [field]: formatNumberForInput(safeNumber(newControl[field])),
      };
    });
  };

  const isFormValid = () => {
    if (!selectedOwner || selectedOwner <= 0) {
      toast.error("Selecciona un propietario.");
      return false;
    }

    if (!newControl.fk_idHorse) {
      toast.error("Selecciona un caballo.");
      return false;
    }

    if (!normalizeDateForInput(newControl.period)) {
      toast.error("Selecciona el periodo.");
      return false;
    }

    const missingField = REQUIRED_NUMERIC_FIELDS.find((field) => {
      const value = formValues[field];
      return value === undefined || value.trim() === "";
    });

    if (missingField) {
      const label = FIELD_LABELS[missingField] ?? missingField;
      toast.error(`Completa el campo ${label}.`);
      return false;
    }

    return true;
  };

  const updateNumericFormValues = (
    updates: Partial<Record<NumericField, number>>,
    options: { zeroAsEmpty?: boolean } = {}
  ) => {
    const { zeroAsEmpty = false } = options;

    setNewControl((prev) => {
      const updated = { ...prev, ...updates };
      const recalculated = applyDerivedValues(updated);

      setFormValues((prevForm) => {
        const nextForm = { ...prevForm };

        Object.entries(updates).forEach(([key, numericValue]) => {
          const numericKey = key as NumericField;
          const valueToFormat = recalculated[numericKey as keyof TotalControl];

          if (
            zeroAsEmpty &&
            (numericValue === 0 ||
              numericValue === null ||
              numericValue === undefined)
          ) {
            nextForm[numericKey] = "";
          } else if (typeof valueToFormat === "number") {
            nextForm[numericKey] = formatNumberForInput(valueToFormat);
          }
        });

        return {
          ...nextForm,
          ...getDerivedFormValues(recalculated, zeroAsEmpty),
        };
      });

      return recalculated;
    });
  };

  const fetchOwners = async () => {
    try {
      const res = await fetch("https://backend-country-nnxe.onrender.com/owner/");
      if (!res.ok) throw new Error("Error al obtener propietarios");
      const data = await res.json();
      setOwners(data);
    } catch {
      toast.error("No se pudieron cargar propietarios");
    }
  };

  const fetchAllHorses = async () => {
    try {
      const res = await fetch("https://backend-country-nnxe.onrender.com/horses/");
      if (!res.ok) throw new Error("Error al obtener caballos");
      const data = await res.json();

      setHorseLookup((prev) => {
        const updated = { ...prev };
        data.forEach((horse: { idHorse: number; horseName: string }) => {
          if (horse?.idHorse) {
            updated[horse.idHorse] = horse.horseName;
          }
        });
        return updated;
      });
    } catch {
      toast.error("No se pudieron cargar los caballos.");
    }
  };

  const fetchHorsesByOwner = async (ownerId: number) => {
    try {
      const res = await fetch(`https://backend-country-nnxe.onrender.com/horses/by_owner/${ownerId}`);
      if (!res.ok) throw new Error("Error al obtener caballos del propietario");
      const data = await res.json();
      setHorses(data);

      setHorseLookup((prev) => {
        const updated = { ...prev };
        data.forEach((horse: { idHorse: number; horseName: string }) => {
          if (horse?.idHorse) {
            updated[horse.idHorse] = horse.horseName;
          }
        });
        return updated;
      });
    } catch {
      toast.error("No se pudieron cargar caballos");
    }
  };


  const loadLogo = async () => {
    try {
      const LOGO_URL = `${import.meta.env.BASE_URL}image/LogoHipica.png`;
      const response = await fetch(LOGO_URL);
      if (!response.ok) return;
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => setLogoDataUrl(reader.result as string);
      reader.readAsDataURL(blob);
    } catch {
      console.warn("No se pudo cargar el logo para el PDF.");
    }
  };

  const fetchControls = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al obtener controles');
      const data = await res.json();
      const normalizedData: TotalControl[] = Array.isArray(data)
        ? data.map((item: any) =>
            applyDerivedValues(
              createInitialControl({
                ...item,
                period: normalizeDateForInput(item?.period),
              })
            )
          )
        : [];
      setControls(normalizedData);
    } catch {
      toast.error('No se pudieron cargar los controles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchControls();
    fetchOwners();
    fetchAllHorses();
    loadLogo();
  }, []);

  const createControl = async () => {
    if (!isFormValid()) return;

    try {
      const payload = applyDerivedValues(newControl);
      if (isEditing && editId) {
        const res = await fetch(`${API_URL}${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Error al actualizar control");
        toast.success("Actualización realizada correctamente", { position: "top-right" });
      } else {
    
        const res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Error al crear control");
        toast.success("Registro creado correctamente", { position: "top-right" });
      }

      resetForm();
      fetchControls();
    } catch {
      toast.error(" No se pudo procesar la acción.");
    }
  };


  const deleteControl = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar control');
      toast.success('Control eliminado!');
      fetchControls();
    } catch {
      toast.error('No se pudo eliminar el control.');
    }
  };

  const exportFilteredPDF = async () => {
    try {
      setExporting(true);

      const monthFilter = filterMonth.trim();
      const yearFilter = filterYear.trim();

      let filtered = controls;
      if (monthFilter) {
        filtered = controls.filter((control) =>
          normalizeDateForInput(control.period).startsWith(monthFilter)
        );
      } else if (yearFilter) {
        filtered = controls.filter((control) =>
          normalizeDateForInput(control.period).startsWith(yearFilter)
        );
      }

      if (!filtered.length) {
        toast.error("No hay registros para el periodo seleccionado.");
        return;
      }

      const doc = new jsPDF({ orientation: "landscape", unit: "pt" });

      if (logoDataUrl) {
        const margin = 40;
        const w = 120;
        const h = 70;
        const pageW = doc.internal.pageSize.getWidth();
        doc.addImage(logoDataUrl, "PNG", pageW - w - margin, 20, w, h);
      }

      let titulo = "PLANILLA DE CONTROL";
      if (monthFilter) {
        const [year, month] = monthFilter.split("-");
        const fecha = new Date(Number(year), Number(month) - 1);
        const mesNombre = fecha.toLocaleDateString("es-ES", { month: "long" }).toUpperCase();
        titulo = `PLANILLA DE CONTROL POR EL MES DE - ${mesNombre} ${year}`;
      } else if (yearFilter) {
        titulo = `PLANILLA DE CONTROL DEL - AÑO ${yearFilter}`;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(titulo, doc.internal.pageSize.getWidth() / 2, 45, { align: "center" });

      const now = new Date();
      const fecha = now.toLocaleDateString("es-BO");
      const hora = now.toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" });

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Fecha: ${fecha}  Hora: ${hora}`, 40, 65);

      const totals = filtered.reduce(
        (acc, control) => {
          acc.box += safeNumber(control.box);
          acc.section += safeNumber(control.section);
          acc.basket += safeNumber(control.basket);
          acc.toCaballerizo += safeNumber(control.toCaballerizo);
          acc.vaccines += safeNumber(control.vaccines);
          acc.anemia += safeNumber(control.anemia);
          acc.deworming += safeNumber(control.deworming);
          acc.consumptionAlfaDiaKlg += safeNumber(control.consumptionAlfaDiaKlg);
          acc.consumptionAlphaMonthKlg += safeNumber(control.consumptionAlphaMonthKlg);
          acc.costTotalAlphaBs += safeNumber(control.costTotalAlphaBs);
          acc.cubeChala += safeNumber(control.cubeChala);
          acc.costTotalChalaBs += safeNumber(control.costTotalChalaBs);
          acc.totalCharge += safeNumber(control.totalCharge);
          return acc;
        },
        {
          box: 0,
          section: 0,
          basket: 0,
          toCaballerizo: 0,
          vaccines: 0,
          anemia: 0,
          deworming: 0,
          consumptionAlfaDiaKlg: 0,
          consumptionAlphaMonthKlg: 0,
          costTotalAlphaBs: 0,
          cubeChala: 0,
          costTotalChalaBs: 0,
          totalCharge: 0,
        }
      );

      const body = filtered.map((control, index) => {
        const ownerRecord = owners.find(
          (o) => o.idOwner === control.fk_idOwner
        );
        const ownerName =
          buildOwnerDisplayName(ownerRecord) ||
          (control.fk_idOwner ? String(control.fk_idOwner) : "-");

        const horseName =
          horseLookup[control.fk_idHorse] ??
          horses.find((h) => h.idHorse === control.fk_idHorse)?.horseName ??
          (control.fk_idHorse ? String(control.fk_idHorse) : "—");

        return [
          index + 1,
          ownerName, // ✅ muestra nombre del propietario
          horseName, // ✅ muestra nombre del caballo
          formatCurrencyForPdf(control.box),
          formatCurrencyForPdf(control.section),
          formatNumberForPdf(control.basket),
          formatCurrencyForPdf(control.toCaballerizo),
          formatCurrencyForPdf(control.vaccines),
          formatCurrencyForPdf(control.anemia),
          formatCurrencyForPdf(control.deworming),
          formatNumberForPdf(control.consumptionAlfaDiaKlg),
          formatNumberForPdf(control.consumptionAlphaMonthKlg),
          formatCurrencyForPdf(control.costTotalAlphaBs),
          formatNumberForPdf(control.cubeChala),
          formatCurrencyForPdf(control.costTotalChalaBs),
          formatCurrencyForPdf(control.totalCharge),
        ];
      });

      autoTable(doc, {
        startY: 100,
        theme: "striped",
        margin: { left: 20, right: 15 },

        head: [[
          "NRO.",
          "PROPIETARIO",
          "CABALLO",
          "BOX",
          "SECCIÓN",
          "CANASTO",
          "A CABALLERIZO",
          "VACUNAS",
          "ANEMIA",
          "DESPARASITACIÓN",
          "CONS. ALFALFA DÍA (KG)",
          "CONS. ALFALFA MES (KG)",
          "COSTO TOT. ALFALFA (BS)",
          "CUBO CHALA",
          "COSTO TOT. CHALA (BS)",
          "TOTAL COBRAR (BS)",
        ]],

        body: body, // ✅ cuerpo corregido con nombres

        styles: {
          fontSize: 4.2,
          cellPadding: 1.2,
          overflow: "linebreak",
          valign: "middle",
        },
        bodyStyles: { fontSize: 3.9 },
        headStyles: {
          fillColor: [38, 72, 131],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          halign: "center",
          valign: "middle",
          fontSize: 4.5,
          cellPadding: 1.1,
        },
        footStyles: {
          fillColor: [38, 72, 131],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          halign: "center",
          valign: "middle",
          fontSize: 4.3,
        },

        columnStyles: {
          0: { cellWidth: 20, halign: "center" },
          1: { cellWidth: 70, halign: "left" },  // propietario
          2: { cellWidth: 65, halign: "left" },  // caballo
          3: { cellWidth: 35, halign: "center" },
          4: { cellWidth: 40, halign: "center" },
          5: { cellWidth: 40, halign: "center" },
          6: { cellWidth: 45, halign: "center" },
          7: { cellWidth: 45, halign: "center" },
          8: { cellWidth: 45, halign: "center" },
          9: { cellWidth: 50, halign: "center" },
          10: { cellWidth: 55, halign: "center" },
          11: { cellWidth: 55, halign: "center" },
          12: { cellWidth: 60, halign: "center" },
          13: { cellWidth: 50, halign: "center" },
          14: { cellWidth: 60, halign: "center" },
          15: { cellWidth: 65, halign: "center" },
        },

        foot: [[
          { content: "TOTAL", colSpan: 3, styles: { halign: "right", fontStyle: "bold" } },
          formatCurrencyForPdf(totals.box),
          formatCurrencyForPdf(totals.section),
          formatNumberForPdf(totals.basket),
          formatCurrencyForPdf(totals.toCaballerizo),
          formatCurrencyForPdf(totals.vaccines),
          formatCurrencyForPdf(totals.anemia),
          formatCurrencyForPdf(totals.deworming),
          formatNumberForPdf(totals.consumptionAlfaDiaKlg),
          formatNumberForPdf(totals.consumptionAlphaMonthKlg),
          formatCurrencyForPdf(totals.costTotalAlphaBs),
          formatNumberForPdf(totals.cubeChala),
          formatCurrencyForPdf(totals.costTotalChalaBs),
          formatCurrencyForPdf(totals.totalCharge),
        ]],
      });


      doc.save(`Planilla Control-${dayjs().format("YYYY-MM-DD")}.pdf`);
      toast.success("PDF generado correctamente.");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo generar el PDF.");
    } finally {
      setExporting(false);
    }
  };


  const resetForm = () => {
    const baseControl = applyDerivedValues(
      createInitialControl({ fk_idOwner: 0, fk_idHorse: 0 })
    );

    setNewControl(baseControl);
    setFormValues(formatControlToForm(baseControl, true));
    setSelectedOwner(null);
    setHorses([]);
    setIsEditing(false);
    setEditId(null);
  };


  return (
    <div  className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
      <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">Gestión de Control Total</h1>
      
      <div
        className={`bg-white/10 backdrop-blur-lg p-6 rounded-2xl mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.5)] text-[#F8F4E3] ${
          isEditing
            ? "bg-slate-800 border-2 border-teal-400 shadow-[0_0_20px_#14b8a6]"
            : "bg-slate-800 border border-slate-700"
        }`}
      >
        <h2 className="text-xl font-semibold mb-4 text-teal-400">Agregar Nuevo Control Total</h2>
        {isEditing && (
          <div className="mb-4 text-teal-400 font-semibold text-lg animate-pulse text-center">
             Modo edición activo , actualiza los campos y guarda los cambios
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="col-span-1 lg:col-span-1">
            <label htmlFor="fk_idOwner" className="block mb-1">
              Propietario
              <RequiredMark />
            </label>
            <select
              name="fk_idOwner"
              value={selectedOwner || ""}
              onChange={(e) => {
                const ownerId = Number(e.target.value);
                const normalizedOwner = ownerId || null;
                setSelectedOwner(normalizedOwner);
                setNewControl((prev) => ({
                  ...prev,
                  fk_idOwner: ownerId,
                  fk_idHorse: 0,
                }));
                updateNumericFormValues(
                  { box: 0, section: 0, basket: 0 },
                  { zeroAsEmpty: true }
                );
                if (ownerId) {
              fetchHorsesByOwner(ownerId);
            } else {
              setHorses([]);
            }
          }}
          className="p-2 rounded-md bg-gray-700 text-white text-sm w-full"
        >
          <option value="">-- Selecciona propietario --</option>
          {owners.map((o) => (
            <option key={o.idOwner} value={o.idOwner}>
              {buildOwnerDisplayName(o) || `ID ${o.idOwner}`}
            </option>
          ))}
        </select>
      </div>

          <div>
            <label htmlFor="period" className="block mb-1">
              Periodo
              <RequiredMark />
            </label>
            <input
              type="date"
              name="period"
              value={normalizeDateForInput(newControl.period)}
              onChange={(e) => {
                const value = normalizeDateForInput(e.target.value);
                setNewControl((prev) => ({
                  ...prev,
                  period: value,
                }));
              }}
              className="p-2 rounded-md bg-gray-700 text-white w-full"
              required
            />
          </div>

          <div>
            <label htmlFor="fk_idHorse" className="block mb-1">
              Caballo
              <RequiredMark />
            </label>
            <select
              name="fk_idHorse"
              value={newControl.fk_idHorse}
              onChange={(e) => {
                const horseId = Number(e.target.value);
                setNewControl((prev) => ({
                  ...prev,
                  fk_idHorse: horseId,
                }));

                const selectedHorse = horses.find((h) => h.idHorse === horseId);

                if (!selectedHorse) {
                  updateNumericFormValues(
                    { box: 0, section: 0, basket: 0 },
                    { zeroAsEmpty: true }
                  );
                  return;
                }

                const hasBox = selectedHorse.box !== undefined && selectedHorse.box !== null;
                const hasSection = selectedHorse.section !== undefined && selectedHorse.section !== null;
                const hasBasket = selectedHorse.basket !== undefined && selectedHorse.basket !== null;

                const boxValue = hasBox
                  ? resolveChargeFromFlag(selectedHorse.box, BOX_CHARGE, newControl.box)
                  : newControl.box;

                const sectionValue = hasSection
                  ? resolveChargeFromFlag(selectedHorse.section, SECTION_CHARGE, newControl.section)
                  : newControl.section;

                const basketValue = hasBasket
                  ? resolveNumericFlag(selectedHorse.basket, newControl.basket)
                  : newControl.basket;

                updateNumericFormValues({
                  box: boxValue,
                  section: sectionValue,
                  basket: basketValue,
                });
              }}
              disabled={!selectedOwner}
              className="p-2 rounded-md bg-gray-700 text-white disabled:opacity-50 w-full"
            >
              <option value="">-- Selecciona caballo --</option>
              {horses.map((h) => (
                <option key={h.idHorse} value={h.idHorse}>
                  {h.horseName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="box" className="block mb-1">
              Box
              <RequiredMark />
            </label>
            <input
              type="text"
              inputMode="decimal"
              name="box"
              placeholder="0,00"
              value={formValues.box ?? ""}
              onChange={handleNumericInputChange("box")}
              onBlur={handleNumericInputBlur("box")}
              className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400 w-full"
            />
          </div>

          <div>
            <label htmlFor="section" className="block mb-1">Sección<RequiredMark /></label>
            <input
              type="text"
              inputMode="decimal"
              name="section"
              placeholder="0,00"
              value={formValues.section ?? ""}
              onChange={handleNumericInputChange("section")}
              onBlur={handleNumericInputBlur("section")}
              className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400 w-full"
            />
          </div>

          <div>
            <label htmlFor="basket" className="block mb-1">Canaston<RequiredMark /></label>
            <input
              type="text"
              inputMode="decimal"
              name="basket"
              placeholder="0,00"
              value={formValues.basket ?? ""}
              onChange={handleNumericInputChange("basket")}
              onBlur={handleNumericInputBlur("basket")}
              className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400 w-full"
            />
          </div>

          <div>
            <label htmlFor="toCaballerizo" className="block mb-1">A/ caballerizo<RequiredMark /></label>
            <input
              type="text"
              inputMode="decimal"
              name="toCaballerizo"
              placeholder="0,00"
              value={formValues.toCaballerizo ?? ""}
              onChange={handleNumericInputChange("toCaballerizo")}
              onBlur={handleNumericInputBlur("toCaballerizo")}
              className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400 w-full"
            />
          </div>

          <div>
            <label htmlFor="vaccines" className="block mb-1">Vacunas<RequiredMark /></label>
            <input
              type="text"
              inputMode="decimal"
              name="vaccines"
              placeholder="0,00"
              value={formValues.vaccines ?? ""}
              onChange={handleNumericInputChange("vaccines")}
              onBlur={handleNumericInputBlur("vaccines")}
              className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400 w-full"
            />
          </div>

          <div>
            <label htmlFor="anemia" className="block mb-1">Anemia<RequiredMark /></label>
            <input
              type="text"
              inputMode="decimal"
              name="anemia"
              placeholder="0,00"
              value={formValues.anemia ?? ""}
              onChange={handleNumericInputChange("anemia")}
              onBlur={handleNumericInputBlur("anemia")}
              className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400 w-full"
            />
          </div>

          <div>
            <label htmlFor="deworming" className="block mb-1">Desparasitacion<RequiredMark /></label>
            <input
              type="text"
              inputMode="decimal"
              name="deworming"
              placeholder="0,00"
              value={formValues.deworming ?? ""}
              onChange={handleNumericInputChange("deworming")}
              onBlur={handleNumericInputBlur("deworming")}
              className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400 w-full"
            />
          </div>

          <div className="col-span-5 mt-4 mb-2">
            <h3 className="text-sm font-semibold text-amber-400 text-left uppercase tracking-wide">
              Datos de Alfalfa
            </h3>
          </div>

          <div>
            <label htmlFor="consumptionAlfaDiaKlg" className="block mb-1">Consumo alfalfa por dia (Kg)<RequiredMark /></label>
            <input
              type="text"
              inputMode="decimal"
              name="consumptionAlfaDiaKlg"
              placeholder="0,00"
              value={formValues.consumptionAlfaDiaKlg ?? ""}
              onChange={handleNumericInputChange("consumptionAlfaDiaKlg")}
              onBlur={handleNumericInputBlur("consumptionAlfaDiaKlg")}
              className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400 w-full"
            />
          </div>

          <div>
            <label htmlFor="costAlfaBs" className="block mb-1">Costo alfalfa (Bs)<RequiredMark /></label>
            <input
              type="text"
              inputMode="decimal"
              name="costAlfaBs"
              placeholder="0,00"
              value={formValues.costAlfaBs ?? ""}
              onChange={handleNumericInputChange("costAlfaBs")}
              onBlur={handleNumericInputBlur("costAlfaBs")}
              className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400 w-full"
            />
          </div>

          <div>
            <label htmlFor="daysConsumptionMonth" className="block mb-1">Dí­as de consumo al mes<RequiredMark /></label>
            <input
              type="text"
              inputMode="decimal"
              name="daysConsumptionMonth"
              placeholder="0,00"
              value={formValues.daysConsumptionMonth ?? ""}
              onChange={handleNumericInputChange("daysConsumptionMonth")}
              onBlur={handleNumericInputBlur("daysConsumptionMonth")}
              className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400 w-full"
            />
          </div>

          <div>
            <label htmlFor="consumptionAlphaMonthKlg" className="block mb-1">Consumo alfalfa mes (Kg)<RequiredMark /></label>
            <input
              type="text"
              inputMode="decimal"
              name="consumptionAlphaMonthKlg"
              placeholder="0,00"
              value={formValues.consumptionAlphaMonthKlg ?? ""}
              readOnly
              className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400 w-full"
            />
          </div>

          <div>
            <label htmlFor="costTotalAlphaBs" className="block mb-1">Costo total alfalfa (Bs)<RequiredMark /></label>
            <input
              type="text"
              inputMode="decimal"
              name="costTotalAlphaBs"
              placeholder="0,00"
              value={formValues.costTotalAlphaBs ?? ""}
              readOnly
              className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400 w-full"
            />
          </div>

          <div className="col-span-5 mt-4 mb-2">
            <h3 className="text-sm font-semibold text-amber-400 text-left uppercase tracking-wide">
              Datos de Chala
            </h3>
          </div>

          <div>
            <label htmlFor="cubeChala" className="block mb-1">Cubo de chala<RequiredMark /></label>
            <input
              type="text"
              inputMode="decimal"
              name="cubeChala"
              placeholder="0,00"
              value={formValues.cubeChala ?? ""}
              onChange={handleNumericInputChange("cubeChala")}
              onBlur={handleNumericInputBlur("cubeChala")}
              className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400 w-full"
            />
          </div>

          <div>
            <label htmlFor="UnitCostChalaBs" className="block mb-1">Costo unitario chala (Bs)<RequiredMark /></label>
            <input
              type="text"
              inputMode="decimal"
              name="UnitCostChalaBs"
              placeholder="0,00"
              value={formValues.UnitCostChalaBs ?? ""}
              onChange={handleNumericInputChange("UnitCostChalaBs")}
              onBlur={handleNumericInputBlur("UnitCostChalaBs")}
              className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400 w-full"
            />
          </div>

          <div>
            <label htmlFor="costTotalChalaBs" className="block mb-1">Costo total chala (Bs)<RequiredMark /></label>
            <input
              type="text"
              inputMode="decimal"
              name="costTotalChalaBs"
              placeholder="0,00"
              value={formValues.costTotalChalaBs ?? ""}
              readOnly
              className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400 w-full"
            />
          </div>

          <div>
            <label htmlFor="totalCharge" className="block mb-1">Total por Cobrar en Bs.<RequiredMark /></label>
            <input
              type="text"
              inputMode="decimal"
              name="totalCharge"
              placeholder="0,00"
              value={formValues.totalCharge ?? ""}
              readOnly
              className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400 w-full"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={createControl}
            className={`${isEditing ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"} text-white p-2 rounded-md font-semibold flex items-center gap-2`}
          >
            {isEditing ? <Save size={20} /> : <Plus size={20} />}
            {isEditing ? "Actualizar Registro" : "Agregar"}
          </button>

          {isEditing && (
            <button
              onClick={resetForm}
              className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded-md font-semibold flex items-center gap-2"
            >
              <X size={20} /> Cancelar
            </button>
          )}
        </div>
      </div>
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.5)] text-[#F8F4E3]">
        <div className="flex flex-col gap-4 w-full md:flex-row">
          <div className="w-full md:w-auto">
            <label htmlFor="filterMonth" className="block mb-1 text-sm font-semibold text-teal-300">
              Filtrar por mes
            </label>
            <input
              type="month"
              name="filterMonth"
              id="filterMonth"
              value={filterMonth}
              onChange={(e) => {
                const value = e.target.value;
                setFilterMonth(value);
                if (value) {
                  setFilterYear("");
                }
              }}
              className="p-2 rounded-md bg-gray-700 text-white w-full md:w-56"
            />
          </div>
          <div className="w-full md:w-auto">
            <label htmlFor="filterYear" className="block mb-1 text-sm font-semibold text-teal-300">
              O filtrar por año
            </label>
            <select
              name="filterYear"
              id="filterYear"
              value={filterYear}
              onChange={(e) => {
                const value = e.target.value;
                setFilterYear(value);
                if (value) {
                  setFilterMonth("");
                }
              }}
              className="p-2 rounded-md bg-gray-700 text-white w-full md:w-48"
            >
              <option value="">-- Todos los años --</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          type="button"
          onClick={exportFilteredPDF}
          disabled={exporting}
          className="bg-teal-500 hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md font-semibold flex items-center gap-2 justify-center"
        >
          {exporting && <Loader size={18} className="animate-spin" />}
          {exporting ? "Generando PDF..." : "Exportar PDF"}
        </button>
      </div>
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.5)] text-[#F8F4E3]">
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            <Loader size={24} className="animate-spin" />Cargando controles...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {controls.map((control) => {
              const ownerRecord = owners.find(
                (o) => o.idOwner === control.fk_idOwner
              );
              const ownerDisplayName =
                buildOwnerDisplayName(ownerRecord) || control.fk_idOwner;

              return (
                <div
                  key={control.idTotalControl}
                  className="bg-gray-700 p-4 rounded-md shadow-lg flex flex-col justify-between"
                >
                  <h3 className="text-lg font-semibold">
                    Propietario: {ownerDisplayName}
                  </h3>
                <p>
                  Caballo:{" "}
                  {horseLookup[control.fk_idHorse] ??
                    horses.find((h) => h.idHorse === control.fk_idHorse)?.horseName ??
                    control.fk_idHorse}
                </p>
                <p>Periodo: {normalizeDateForInput(control.period) || "Sin periodo"}</p>
                <p>Box: {control.box}</p>
                <p>Sección: {control.section}</p>
                <p>Canasta: {control.basket}</p>
                <p>A caballerizo: {control.toCaballerizo}</p>
                <p>Vacunas: {control.vaccines}</p>
                <p>Anemia: {control.anemia}</p>
                <p>Desparasitación: {control.deworming}</p>
                <p>Consumo alfalfa por día (Kg): {control.consumptionAlfaDiaKlg}</p>
                <p>Costo alfalfa (Bs): {control.costAlfaBs}</p>
                <p>Días de consumo al mes: {control.daysConsumptionMonth}</p>
                <p>Consumo alfalfa mes (Kg): {control.consumptionAlphaMonthKlg}</p>
                <p>Costo total alfalfa (Bs): {control.costTotalAlphaBs}</p>
                <p>Cubo de chala: {control.cubeChala}</p>
                <p>Costo unitario chala (Bs): {control.UnitCostChalaBs}</p>
                <p>Costo total chala (Bs): {control.costTotalChalaBs}</p>
                <p>Cargo total: {control.totalCharge}</p>
                
                <div className="flex items-center justify-end gap-4">
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setEditId(control.idTotalControl!);
                      const normalizedControl = applyDerivedValues(control);
                      setNewControl(normalizedControl);
                      setFormValues(formatControlToForm(normalizedControl));

                      setSelectedOwner(control.fk_idOwner || null);
                      if (control.fk_idOwner) {
                        fetchHorsesByOwner(control.fk_idOwner);
                      } else {
                        setHorses([]);
                      }

                      toast.success("Modo edición activado", { position: "top-right" });
                      window.scrollTo({ top: 0, behavior: "smooth" });
                      setTimeout(() => document.querySelector<HTMLInputElement>('input[name="toCaballerizo"]')?.focus(), 300);
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
                    onClick={() => deleteControl(control.idTotalControl!)}
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TotalControlManagement;
