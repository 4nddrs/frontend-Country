import { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Save, Trash2, Loader, X } from 'lucide-react';

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
        // Ã°Å¸â€Â¹ Crear nuevo
        const res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Error al crear control");
        toast.success("Registro creado correctamente", { position: "top-right" });
      }

      // Reiniciar formulario y seleccionar valores base
      resetForm();
      fetchControls();
    } catch {
      toast.error("Ã¢Å¡Â Ã¯Â¸Â No se pudo procesar la acción.");
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
    <div className="bg-slate-900 p-6 rounded-lg shadow-xl mb-8 border border-slate-700">
      <h1 className="text-3xl font-bold mb-6 text-center text-teal-400">Gestión de Control Total</h1>
      <div
        className={`p-6 rounded-lg shadow-xl mb-8 transition-all duration-500 ${
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
              className="p-2 rounded-md bg-gray-700 text-white w-full"
            >
              <option value="">-- Selecciona propietario --</option>
              {owners.map((o) => (
                <option key={o.idOwner} value={o.idOwner}>
                  {o.name}
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
      <div className="bg-slate-800 p-6 rounded-lg shadow-xl mb-8 border border-slate-700">
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            <Loader size={24} className="animate-spin" />Cargando controles...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {controls.map((control) => (
              <div
                key={control.idTotalControl}
                className="bg-gray-700 p-4 rounded-md shadow-lg flex flex-col justify-between"
              >
                <h3 className="text-lg font-semibold">
                  Propietario:{" "}
                  {owners.find((o) => o.idOwner === control.fk_idOwner)?.name ||
                    control.fk_idOwner}
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
                
                <div className="flex justify-end gap-2 mt-3">
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
                    className="bg-yellow-600 hover:bg-yellow-700 text-white p-2 rounded-md flex items-center gap-1"
                  >
                    <Edit size={16} /> Editar
                  </button>

                  <button
                    onClick={() => deleteControl(control.idTotalControl!)}
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

export default TotalControlManagement;
