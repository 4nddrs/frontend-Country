import { useState, useEffect, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Save, Trash2, Loader, X } from 'lucide-react';

const API_URL = 'http://localhost:8000/owner_report_month/';
const OWNERS_URL = 'http://localhost:8000/owner/';
const HORSES_URL = 'http://localhost:8000/horses/';

interface HorseReport {
  fk_idHorse: number;
  days: number;
  alphaKg: number;
  daysDisplay?: string;
  alphaKgDisplay?: string;
}

interface OwnerReportMonth {
  idOwnerReportMonth?: number;
  period: string;
  priceAlpha: number;
  box: number;
  section: number;
  aBasket: number;
  contributionCabFlyer: number;
  VaccineApplication: number;
  deworming: number;
  AmeniaExam: number;
  externalTeacher: number;
  fine: number;
  saleChala: number;
  costPerBucket: number;
  healthCardPayment: number;
  other: number;
  state: string;
  paymentDate?: string | null;
  fk_idOwner: number;
  horses_report?: HorseReport[];
  created_at?: string;
}

interface OwnerOption {
  idOwner: number;
  name: string;
  FirstName: string;
  SecondName?: string | null;
}

interface HorseOption {
  idHorse: number;
  horseName: string;
}

const createInitialReport = (): OwnerReportMonth => ({
  period: '',
  priceAlpha: 0,
  box: 0,
  section: 0,
  aBasket: 0,
  contributionCabFlyer: 0,
  VaccineApplication: 0,
  deworming: 0,
  AmeniaExam: 0,
  externalTeacher: 0,
  fine: 0,
  saleChala: 0,
  costPerBucket: 0,
  healthCardPayment: 0,
  other: 0,
  state: 'Pendiente',
  paymentDate: '',
  fk_idOwner: 0,
});

const extractErrorMessage = async (response: Response) => {
  try {
    const data = await response.json();
    if (typeof data === 'string') return data;
    if (Array.isArray(data?.detail)) {
      return data.detail
        .map((item: any) => {
          const location = Array.isArray(item?.loc)
            ? item.loc.filter((segment: unknown) => typeof segment === 'string' || typeof segment === 'number').join('.')
            : '';
          if (item?.msg) {
            return location ? `${location}: ${item.msg}` : item.msg;
          }
          return '';
        })
        .filter(Boolean)
        .join(' | ');
    }
    if (typeof data?.detail === 'string') {
      return data.detail;
    }
    return JSON.stringify(data);
  } catch {
    return response.statusText;
  }
};

const normalizeDateForInput = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 10);
  }
  return date.toISOString().slice(0, 10);
};

const formatDateForDisplay = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value.split('T')[0] ?? value;
  }
  return date.toLocaleDateString();
};

const formatOwnerName = (owner?: OwnerOption) =>
  owner
    ? [owner.FirstName, owner.SecondName, owner.name].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
    : '';

const parseNumberInput = (raw: string): number | null => {
  if (!raw) return null;
  const normalized = raw.replace(/\./g, '').replace(',', '.').trim();
  if (normalized === '' || normalized === '.' || normalized === ',') return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const formatNumberDisplay = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  const numeric =
    typeof value === 'number' ? value : Number(String(value).replace(/\./g, '').replace(',', '.'));
  if (!Number.isFinite(numeric)) return '';

  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 20,
  }).format(numeric);
};

const NUMERIC_FIELDS = [
  'priceAlpha',
  'box',
  'section',
  'aBasket',
  'contributionCabFlyer',
  'VaccineApplication',
  'deworming',
  'AmeniaExam',
  'externalTeacher',
  'fine',
  'saleChala',
  'costPerBucket',
  'healthCardPayment',
  'other',
] as const;

type NumericField = (typeof NUMERIC_FIELDS)[number];

const createInitialNumericDisplays = (): Record<NumericField, string> =>
  NUMERIC_FIELDS.reduce(
    (acc, field) => {
      acc[field] = '';
      return acc;
    },
    {} as Record<NumericField, string>
  );

const RequiredMark = () => <span className="text-red-400 ml-1">*</span>;

const OwnerReportMonthManagement = () => {
  const [reports, setReports] = useState<OwnerReportMonth[]>([]);
  const [newReport, setNewReport] = useState<OwnerReportMonth>(createInitialReport());
  const [numericDisplays, setNumericDisplays] = useState<Record<NumericField, string>>(
    () => createInitialNumericDisplays()
  );
  const [horsesReport, setHorsesReport] = useState<HorseReport[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [owners, setOwners] = useState<OwnerOption[]>([]);
  const [horses, setHorses] = useState<HorseOption[]>([]);
  const [ownerHorses, setOwnerHorses] = useState<HorseOption[]>([]);
  const [loadingOwnerHorses, setLoadingOwnerHorses] = useState(false);
  const reportsSectionRef = useRef<HTMLDivElement | null>(null);

  const isEditing = editingId !== null;

  const fetchOwners = async () => {
    try {
      const res = await fetch(OWNERS_URL);
      if (!res.ok) throw new Error('Error al obtener propietarios');
      const data = await res.json();
      setOwners(data);
    } catch {
      toast.error('No se pudieron cargar propietarios');
    }
  };

  const fetchHorses = async () => {
    try {
      const res = await fetch(HORSES_URL);
      if (!res.ok) throw new Error('Error al obtener caballos');
      const data = await res.json();
      setHorses(data);
    } catch {
      toast.error('No se pudieron cargar caballos');
    }
  };

  const fetchOwnerHorses = async (ownerId: number, existing: HorseReport[] = []) => {
    if (!ownerId) {
      setOwnerHorses([]);
      setHorsesReport([]);
      return;
    }

    setLoadingOwnerHorses(true);
    try {
      const res = await fetch(`${HORSES_URL}by_owner/${ownerId}`);
      if (!res.ok) throw new Error('Error al obtener caballos del propietario');
      const data: HorseOption[] = await res.json();
      setOwnerHorses(data);
      setHorsesReport(
        data.map((horse) => {
          const previous = existing.find((item) => item.fk_idHorse === horse.idHorse);
          const days = previous?.days ?? 0;
          const alphaKg = previous?.alphaKg ?? 0;
          return {
            fk_idHorse: horse.idHorse,
            days,
            alphaKg,
            daysDisplay: previous?.daysDisplay ?? (days ? formatNumberDisplay(days) : ''),
            alphaKgDisplay: previous?.alphaKgDisplay ?? (alphaKg ? formatNumberDisplay(alphaKg) : ''),
          };
        })
      );
    } catch {
      toast.error('No se pudieron cargar los caballos del propietario.');
      setOwnerHorses([]);
      setHorsesReport([]);
    } finally {
      setLoadingOwnerHorses(false);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al obtener reportes');
      const data = await res.json();
      setReports(data);
    } catch {
      toast.error('No se pudieron cargar los reportes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    fetchOwners();
    fetchHorses();
  }, []);

  useEffect(() => {
    if (!owners.length) {
      if (newReport.fk_idOwner !== 0) {
        setNewReport((prev) => ({ ...prev, fk_idOwner: 0 }));
      }
      setOwnerHorses([]);
      setHorsesReport([]);
      return;
    }

    const ownerExists = owners.some((owner) => owner.idOwner === newReport.fk_idOwner);

    if (!ownerExists && newReport.fk_idOwner !== 0) {
      setNewReport((prev) => ({ ...prev, fk_idOwner: 0 }));
      setOwnerHorses([]);
      setHorsesReport([]);
    }
  }, [owners, newReport.fk_idOwner]);

  const resetForm = () => {
    setNewReport(createInitialReport());
    setNumericDisplays(createInitialNumericDisplays());
    setHorsesReport([]);
    setOwnerHorses([]);
    setEditingId(null);
  };

  const handleReportChange =
    (field: keyof OwnerReportMonth) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { value } = event.target;

      if (field === 'fk_idOwner') {
        const ownerId = value === '' ? 0 : Number(value);
        setNewReport((prev) => ({
          ...prev,
          fk_idOwner: ownerId,
        }));
        setOwnerHorses([]);
        setHorsesReport([]);
        fetchOwnerHorses(ownerId);
        return;
      }

      if (NUMERIC_FIELDS.includes(field as NumericField)) {
        const numericField = field as NumericField;
        setNumericDisplays((prev) => ({
          ...prev,
          [numericField]: value,
        }));
        const parsed = parseNumberInput(value);
        setNewReport((prev) => ({
          ...prev,
          [field]: parsed ?? 0,
        }));
        return;
      }

      setNewReport((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

  const updateHorseRow = (index: number, field: 'days' | 'alphaKg', rawValue: string) => {
    setHorsesReport((prev) => {
      const next = [...prev];
      const parsed = parseNumberInput(rawValue);
      const displayKey = field === 'days' ? 'daysDisplay' : 'alphaKgDisplay';
      next[index] = {
        ...next[index],
        [field]: parsed ?? 0,
        [displayKey]: rawValue,
      };
      return next;
    });
  };

  const buildPayload = () => {
    const sanitizedHorses = horsesReport
      .filter((horse) => horse.fk_idHorse !== 0)
      .map((horse) => ({
        fk_idHorse: horse.fk_idHorse,
        days: Number(horse.days) || 0,
        alphaKg: Number(horse.alphaKg) || 0,
      }));

    return {
      ...newReport,
      horses_report: sanitizedHorses,
      period: newReport.period || null,
      paymentDate: newReport.paymentDate ? `${newReport.paymentDate}T00:00:00` : null,
    };
  };

  const createReport = async () => {
    if (!newReport.fk_idOwner) {
      toast.error('Selecciona un propietario válido.');
      return;
    }

    if (!newReport.period) {
      toast.error('Ingresa un periodo válido.');
      return;
    }

    const invalidHorse = horsesReport.some(
      (horse) =>
        horse.fk_idHorse !== 0 &&
        (horse.days > 0 || horse.alphaKg > 0) &&
        (horse.days <= 0 || horse.alphaKg <= 0)
    );

    if (invalidHorse) {
      toast.error('Completa días y alfalfa (Kg) para cada caballo registrado.');
      return;
    }

    try {
      const payload = buildPayload();
      console.debug('Creando reporte mensual', payload);
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const detail = await extractErrorMessage(res);
        throw new Error(detail || 'Error al crear reporte');
      }
      toast.success('Reporte creado!');
      resetForm();
      fetchReports();
      setTimeout(() => {
        reportsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : 'No se pudo crear el reporte.'
      );
    }
  };

  const updateReport = async () => {
    if (editingId === null) return;

    const invalidHorse = horsesReport.some(
      (horse) =>
        horse.fk_idHorse !== 0 &&
        (horse.days > 0 || horse.alphaKg > 0) &&
        (horse.days <= 0 || horse.alphaKg <= 0)
    );

    if (invalidHorse) {
      toast.error('Completa días y alfalfa (Kg) para cada caballo registrado.');
      return;
    }

    try {
      const payload = buildPayload();
      console.debug('Actualizando reporte mensual', editingId, payload);
      const res = await fetch(`${API_URL}${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const detail = await extractErrorMessage(res);
        throw new Error(detail || 'Error al actualizar reporte');
      }
      toast.success('Reporte actualizado!');
      resetForm();
      fetchReports();
      setTimeout(() => {
        reportsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : 'No se pudo actualizar el reporte.'
      );
    }
  };

  const deleteReport = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar reporte');
      toast.success('Reporte eliminado!');
      fetchReports();
    } catch {
      toast.error('No se pudo eliminar el reporte.');
    }
  };

  const startEditing = (report: OwnerReportMonth) => {
    const { idOwnerReportMonth, created_at, horses_report, ...rest } = report;
    const ownerId = rest.fk_idOwner || (owners[0]?.idOwner ?? 0);

    const sanitizedNumericValues = NUMERIC_FIELDS.reduce<Record<NumericField, number>>((acc, field) => {
      const rawValue = rest[field];
      if (typeof rawValue === 'number') {
        acc[field] = rawValue;
        return acc;
      }

      if (typeof rawValue === 'string') {
        const parsed = parseNumberInput(rawValue);
        acc[field] = parsed ?? 0;
        return acc;
      }

      acc[field] = Number(rawValue) || 0;
      return acc;
    }, {} as Record<NumericField, number>);

    const nextNumericDisplays = createInitialNumericDisplays();
    NUMERIC_FIELDS.forEach((field) => {
      const numericValue = sanitizedNumericValues[field];
      nextNumericDisplays[field] = formatNumberDisplay(numericValue);
    });
    setNumericDisplays(nextNumericDisplays);

    setNewReport({
      ...rest,
      ...sanitizedNumericValues,
      period: normalizeDateForInput(rest.period),
      paymentDate: normalizeDateForInput(rest.paymentDate),
      fk_idOwner: ownerId,
    });
    const existingHorses = horses_report
      ? horses_report.map((horse) => {
          const parsedDays =
            typeof horse.days === 'number' ? horse.days : parseNumberInput(String(horse.days)) ?? 0;
          const parsedAlphaKg =
            typeof horse.alphaKg === 'number'
              ? horse.alphaKg
              : parseNumberInput(String(horse.alphaKg)) ?? 0;

          return {
            ...horse,
            fk_idHorse: horse.fk_idHorse,
            days: parsedDays,
            alphaKg: parsedAlphaKg,
            daysDisplay: parsedDays ? formatNumberDisplay(parsedDays) : '',
            alphaKgDisplay: parsedAlphaKg ? formatNumberDisplay(parsedAlphaKg) : '',
          };
        })
      : [];
    setHorsesReport(existingHorses);
    setEditingId(idOwnerReportMonth ?? null);
    if (ownerId) {
      fetchOwnerHorses(ownerId, existingHorses);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      document.querySelector<HTMLInputElement>('input[name="period"]')?.focus();
    }, 300);
  };

  return (
    <div className="bg-slate-900 p-6 rounded-lg shadow-xl mb-8 border border-slate-700">
      <h1 className="text-3xl font-bold mb-6 text-center text-teal-400">
        Gestión Reportes Mensuales de Propietarios
      </h1>

      <div
        className={`p-6 rounded-lg shadow-xl mb-8 transition-all duration-500 ${
          isEditing
            ? "bg-slate-800 border-2 border-teal-400 shadow-[0_0_20px_#14b8a6]"
            : "bg-slate-800 border border-slate-700"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-teal-300">
            {isEditing ? 'Editar Reporte Mensual' : 'Agregar Nuevo Reporte Mensual'}
          </h2>
        </div>

        {isEditing && (
          <div className="mb-4 text-teal-400 font-semibold text-lg animate-pulse text-center">
            Modo edición activo, actualiza los campos y guarda los cambios
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div>
            <label className="block mb-1 text-sm text-slate-200">
              Periodo<RequiredMark />
            </label>
            <input
              type="date"
              name="period"
              value={normalizeDateForInput(newReport.period)}
              onChange={(event) =>
                setNewReport((prev) => ({
                  ...prev,
                  period: event.target.value,
                }))
              }
              className="w-full p-2 rounded-md bg-gray-700 text-white"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-slate-200">
              Precio Alfalfa<RequiredMark />
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={numericDisplays.priceAlpha}
              onChange={handleReportChange('priceAlpha')}
              className="w-full p-2 rounded-md bg-gray-700 text-white"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-slate-200">
              Box<RequiredMark />
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={numericDisplays.box}
              onChange={handleReportChange('box')}
              className="w-full p-2 rounded-md bg-gray-700 text-white"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-slate-200">
              Sección<RequiredMark />
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={numericDisplays.section}
              onChange={handleReportChange('section')}
              className="w-full p-2 rounded-md bg-gray-700 text-white"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-slate-200">
              Canasto A<RequiredMark />
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={numericDisplays.aBasket}
              onChange={handleReportChange('aBasket')}
              className="w-full p-2 rounded-md bg-gray-700 text-white"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-slate-200">
              Contribución Cab. Flyer<RequiredMark />
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={numericDisplays.contributionCabFlyer}
              onChange={handleReportChange('contributionCabFlyer')}
              className="w-full p-2 rounded-md bg-gray-700 text-white"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-slate-200">
              Aplicación Vacuna<RequiredMark />
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={numericDisplays.VaccineApplication}
              onChange={handleReportChange('VaccineApplication')}
              className="w-full p-2 rounded-md bg-gray-700 text-white"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-slate-200">
              Desparasitación<RequiredMark />
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={numericDisplays.deworming}
              onChange={handleReportChange('deworming')}
              className="w-full p-2 rounded-md bg-gray-700 text-white"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-slate-200">
              Examen Amenia<RequiredMark />
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={numericDisplays.AmeniaExam}
              onChange={handleReportChange('AmeniaExam')}
              className="w-full p-2 rounded-md bg-gray-700 text-white"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-slate-200">
              Docente Externo<RequiredMark />
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={numericDisplays.externalTeacher}
              onChange={handleReportChange('externalTeacher')}
              className="w-full p-2 rounded-md bg-gray-700 text-white"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-slate-200">
              Multa<RequiredMark />
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={numericDisplays.fine}
              onChange={handleReportChange('fine')}
              className="w-full p-2 rounded-md bg-gray-700 text-white"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-slate-200">
              Venta Chala<RequiredMark />
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={numericDisplays.saleChala}
              onChange={handleReportChange('saleChala')}
              className="w-full p-2 rounded-md bg-gray-700 text-white"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-slate-200">
              Costo por Balde<RequiredMark />
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={numericDisplays.costPerBucket}
              onChange={handleReportChange('costPerBucket')}
              className="w-full p-2 rounded-md bg-gray-700 text-white"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-slate-200">
              Pago Carnet Salud<RequiredMark />
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={numericDisplays.healthCardPayment}
              onChange={handleReportChange('healthCardPayment')}
              className="w-full p-2 rounded-md bg-gray-700 text-white"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-slate-200">
              Otro<RequiredMark />
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={numericDisplays.other}
              onChange={handleReportChange('other')}
              className="w-full p-2 rounded-md bg-gray-700 text-white"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-slate-200">
              Propietario<RequiredMark />
            </label>
            <select
              value={newReport.fk_idOwner}
              onChange={handleReportChange('fk_idOwner')}
              className="w-full p-2 rounded-md bg-gray-700 text-white"
            >
              <option value={0}>Selecciona propietario</option>
              {owners.map((owner) => (
                <option key={owner.idOwner} value={owner.idOwner}>
                  {formatOwnerName(owner)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 text-sm text-slate-200">Fecha de pago</label>
            <input
              type="date"
              value={normalizeDateForInput(newReport.paymentDate)}
              onChange={(event) =>
                setNewReport((prev) => ({
                  ...prev,
                  paymentDate: event.target.value,
                }))
              }
              className="w-full p-2 rounded-md bg-gray-700 text-white"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-slate-200">
              Estado<RequiredMark />
            </label>
            <select
              value={newReport.state}
              onChange={handleReportChange('state')}
              className="w-full p-2 rounded-md bg-gray-700 text-white"
            >
              <option value="Pendiente">Pendiente</option>
              <option value="Pagado">Pagado</option>
              <option value="Anulado">Anulado</option>
            </select>
          </div>
        </div>

        <div className="mt-6 bg-slate-700 border border-slate-600 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-teal-300">Caballos del periodo</h3>
            {loadingOwnerHorses && (
              <span className="flex items-center gap-2 text-xs text-slate-200">
                <Loader size={16} className="animate-spin" /> Cargando caballos...
              </span>
            )}
          </div>

          {!newReport.fk_idOwner ? (
            <p className="text-sm text-slate-200">
              Selecciona un propietario para cargar sus caballos.
            </p>
          ) : horsesReport.length === 0 ? (
            <p className="text-sm text-slate-200">
              El propietario seleccionado no tiene caballos registrados.
            </p>
          ) : (
            <div className="space-y-4">
              {horsesReport.map((horse, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end bg-slate-800 border border-slate-600 p-3 rounded-md"
                >
                  <div>
                    <label className="block mb-1 text-sm text-slate-200">
                      Caballo<RequiredMark />
                    </label>
                    <div className="w-full p-2 rounded-md bg-gray-800 text-slate-200 border border-slate-600">
                      {ownerHorses.find((item) => item.idHorse === horse.fk_idHorse)?.horseName ??
                        horses.find((item) => item.idHorse === horse.fk_idHorse)?.horseName ??
                        `ID ${horse.fk_idHorse}`}
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1 text-sm text-slate-200">
                      Días<RequiredMark />
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={horse.daysDisplay ?? ''}
                      onChange={(event) => updateHorseRow(index, 'days', event.target.value)}
                      className="w-full p-2 rounded-md bg-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm text-slate-200">
                      Alfalfa Kg<RequiredMark />
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={horse.alphaKgDisplay ?? ''}
                      onChange={(event) => updateHorseRow(index, 'alphaKg', event.target.value)}
                      className="w-full p-2 rounded-md bg-gray-700 text-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={isEditing ? updateReport : createReport}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-semibold text-white ${
              isEditing ? 'bg-blue-600 hover:bg-blue-500' : 'bg-green-600 hover:bg-green-500'
            }`}
          >
            {isEditing ? <Save size={18} /> : <Plus size={18} />}
            {isEditing ? 'Actualizar Reporte' : 'Crear Reporte'}
          </button>
          {isEditing && (
            <button
              onClick={resetForm}
              className="flex items-center gap-2 px-4 py-2 rounded-md font-semibold bg-gray-600 hover:bg-gray-500 text-white"
            >
              <X size={18} /> Cancelar
            </button>
          )}
        </div>
      </div>

      <div
        ref={reportsSectionRef}
        className="bg-slate-800 p-6 rounded-lg shadow-xl mb-8 border border-slate-700"
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            <Loader size={24} className="animate-spin" /> Cargando reportes...
          </div>
        ) : reports.length === 0 ? (
          <p className="text-center text-slate-300">No hay reportes registrados.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <div
                key={report.idOwnerReportMonth}
                className="bg-gray-700 p-4 rounded-md shadow-lg flex flex-col justify-between border border-slate-600"
              >
                <div className="space-y-1 text-sm text-white">
                  <h3 className="text-lg font-semibold text-teal-300">
                    Reporte periodo: {formatDateForDisplay(report.period)}
                  </h3>
                  <p>Precio alfalfa: {report.priceAlpha}</p>
                  <p>Box: {report.box}</p>
                  <p>Sección: {report.section}</p>
                  <p>Canasto A: {report.aBasket}</p>
                  <p>Contribución Cab. Flyer: {report.contributionCabFlyer}</p>
                  <p>Aplicación vacuna: {report.VaccineApplication}</p>
                  <p>Desparasitación: {report.deworming}</p>
                  <p>Examen amenia: {report.AmeniaExam}</p>
                  <p>Docente externo: {report.externalTeacher}</p>
                  <p>Multa: {report.fine}</p>
                  <p>Venta chala: {report.saleChala}</p>
                  <p>Costo por balde: {report.costPerBucket}</p>
                  <p>Pago carnet de salud: {report.healthCardPayment}</p>
                  <p>Otro: {report.other}</p>
                  {report.paymentDate && (
                    <p>Fecha de pago: {formatDateForDisplay(report.paymentDate)}</p>
                  )}
                  <p>Estado: {report.state}</p>
                  <p>
                    Propietario:{' '}
                    {(() => {
                      const owner = owners.find((o) => o.idOwner === report.fk_idOwner);
                      return owner ? formatOwnerName(owner) : report.fk_idOwner;
                    })()}
                  </p>
                  <div className="mt-3 bg-slate-800 rounded-md p-3 border border-slate-600">
                    <h4 className="text-sm font-semibold text-teal-200 mb-2">Caballos</h4>
                    {report.horses_report && report.horses_report.length > 0 ? (
                      <ul className="space-y-1 text-xs text-slate-200">
                        {report.horses_report.map((horse, index) => {
                          const horseName =
                            horses.find((item) => item.idHorse === horse.fk_idHorse)?.horseName ??
                            horse.fk_idHorse;
                          return (
                            <li key={`${report.idOwnerReportMonth}-horse-${index}`}>
                              {horseName} — Días: {horse.days}, Alfalfa Kg: {horse.alphaKg}
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-400">Sin caballos registrados.</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => startEditing(report)}
                    className="bg-yellow-600 hover:bg-yellow-500 text-white p-2 rounded-md flex items-center gap-1"
                  >
                    <Edit size={16} /> Editar
                  </button>
                  <button
                    onClick={() => deleteReport(report.idOwnerReportMonth!)}
                    className="bg-red-600 hover:bg-red-500 text-white p-2 rounded-md flex items-center gap-1"
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

export default OwnerReportMonthManagement;
