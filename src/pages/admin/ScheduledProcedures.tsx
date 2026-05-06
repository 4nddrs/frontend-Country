import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import {
  Edit, Trash2, Loader, AlertTriangle, Calendar, X, ClipboardList, Download,
} from 'lucide-react';
import { confirmDialog } from '../../utils/confirmDialog';
import { isNonEmptyString } from '../../utils/validation';
import { AddButton, AdminSection, SaveButton, CancelButton } from '../../components/ui/admin-buttons';

const API_URL = 'https://api.countryclub.doc-ia.cloud/scheduled_procedures/';

interface ScheduledProcedure {
  idScheduledProcedure?: number;
  year: string;          // stored as "YYYY-01-01", displayed as year only
  name: string;
  description?: string;
  scheduledMonths: string | number[];  // JSON "[1,3,6]" or array
  alertLabel: string;
  created_at?: string;
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const MONTH_ABBR = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

const ALERT_OPTIONS = [
  {
    value: 'critica', label: 'Crítica',
    bg: 'bg-red-500/20', border: 'border-red-400/70', text: 'text-red-100',
    glow: 'shadow-[0_0_14px_rgba(239,68,68,0.45)]', dot: 'bg-red-400',
    headerBg: 'from-red-900/25', cardBorder: 'border-red-700/40',
  },
  {
    value: 'alta', label: 'Alta',
    bg: 'bg-orange-500/20', border: 'border-orange-400/70', text: 'text-orange-100',
    glow: 'shadow-[0_0_14px_rgba(249,115,22,0.40)]', dot: 'bg-orange-400',
    headerBg: 'from-orange-900/20', cardBorder: 'border-orange-700/40',
  },
  {
    value: 'media', label: 'Media',
    bg: 'bg-yellow-500/15', border: 'border-yellow-400/60', text: 'text-yellow-100',
    glow: 'shadow-[0_0_10px_rgba(234,179,8,0.30)]', dot: 'bg-yellow-400',
    headerBg: 'from-yellow-900/15', cardBorder: 'border-yellow-700/35',
  },
  {
    value: 'baja', label: 'Baja',
    bg: 'bg-blue-500/15', border: 'border-blue-400/55', text: 'text-blue-100',
    glow: 'shadow-[0_0_8px_rgba(96,165,250,0.20)]', dot: 'bg-blue-400',
    headerBg: 'from-blue-900/15', cardBorder: 'border-blue-700/35',
  },
];

const getAlertCfg = (value: string) =>
  ALERT_OPTIONS.find(a => a.value === value?.toLowerCase()) ?? ALERT_OPTIONS[3];

const parseMonths = (scheduledMonths: string | number[]): number[] => {
  if (Array.isArray(scheduledMonths)) return scheduledMonths as number[];
  try { return JSON.parse(scheduledMonths as string) ?? []; } catch { return []; }
};

const getYear = (yearStr: string): number =>
  parseInt(yearStr?.slice(0, 4)) || new Date().getFullYear();

const yearToIso = (y: number) => `${y}-01-01`;

/* ── Year Spinner ── */
const YearSpinner = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (y: number) => void;
}) => (
  <div className="flex items-center gap-2 w-full bg-slate-800/80 border border-cyan-500/30 rounded-xl px-2 py-1 shadow-[0_0_10px_rgba(34,211,238,0.12)]">
    <span className="flex-1 text-base font-extrabold text-cyan-200 tracking-widest select-none text-center">
      {value}
    </span>
    <div className="flex flex-col gap-0.5">
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="w-4 h-3.5 flex items-center justify-center rounded bg-cyan-500/25 hover:bg-cyan-400/40 text-cyan-300 hover:text-white transition-all duration-150 text-[8px] font-black leading-none"
      >
        ▲
      </button>
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        className="w-4 h-3.5 flex items-center justify-center rounded bg-cyan-500/25 hover:bg-cyan-400/40 text-cyan-300 hover:text-white transition-all duration-150 text-[8px] font-black leading-none"
      >
        ▼
      </button>
    </div>
  </div>
);

/* ── Procedure Month Picker ── */
const ProcedureMonthPicker = ({
  selectedMonths,
  onToggle,
}: {
  selectedMonths: number[];
  onToggle: (monthNum: number) => void;
}) => {
  const currentMonth = new Date().getMonth() + 1;

  return (
    <div>
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center shrink-0 shadow-[0_0_14px_rgba(34,211,238,0.2)]">
          <Calendar size={17} className="text-cyan-300" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-100 leading-tight">Meses de Aplicación</p>
          <p className="text-xs text-slate-500 leading-tight">Toca un mes para activarlo</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {MONTHS.map((month, idx) => {
          const monthNum = idx + 1;
          const on = selectedMonths.includes(monthNum);
          const isCurrent = monthNum === currentMonth;
          const selIdx = selectedMonths.indexOf(monthNum);
          const isOrange = on && selIdx % 2 === 0;
          const isPink = on && selIdx % 2 !== 0;

          return (
            <button
              key={month}
              type="button"
              onClick={() => onToggle(monthNum)}
              className={`relative rounded-2xl py-3.5 px-1 text-center cursor-pointer select-none transition-all duration-200 border group ${
                isOrange
                  ? 'border-orange-400/90 bg-gradient-to-b from-orange-500/50 to-orange-700/25 shadow-[0_0_22px_rgba(249,115,22,0.55),inset_0_1px_0_rgba(255,255,255,0.1)] scale-[1.06]'
                  : isPink
                  ? 'border-fuchsia-400/90 bg-gradient-to-b from-fuchsia-500/50 to-pink-700/25 shadow-[0_0_22px_rgba(217,70,239,0.55),inset_0_1px_0_rgba(255,255,255,0.1)] scale-[1.06]'
                  : isCurrent
                  ? 'border-teal-400/50 bg-teal-500/12 hover:border-teal-400/70 hover:bg-teal-500/18'
                  : 'border-slate-700/40 bg-slate-900/40 hover:border-slate-500/60 hover:bg-slate-800/50'
              }`}
            >
              {isCurrent && !on && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-teal-400 shadow-[0_0_5px_rgba(20,184,166,0.9)]" />
              )}
              <p className={`text-[9px] font-bold mb-0.5 ${
                isOrange ? 'text-orange-300/80' : isPink ? 'text-fuchsia-300/80' : 'text-slate-600'
              }`}>
                {String(monthNum).padStart(2, '0')}
              </p>
              <p className={`text-[12px] font-extrabold leading-none tracking-wider ${
                isOrange ? 'text-orange-100' : isPink ? 'text-fuchsia-100'
                  : isCurrent ? 'text-teal-300' : 'text-slate-400 group-hover:text-slate-200'
              }`}>
                {MONTH_ABBR[idx]}
              </p>
              {on && (
                <div className={`mt-1.5 w-1.5 h-1.5 rounded-full mx-auto ${
                  isOrange
                    ? 'bg-orange-300 shadow-[0_0_8px_rgba(253,186,116,0.95)]'
                    : 'bg-fuchsia-300 shadow-[0_0_8px_rgba(240,171,252,0.95)]'
                }`} />
              )}
            </button>
          );
        })}
      </div>

      {selectedMonths.length > 0 && (
        <div className="mt-3 flex items-center justify-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-200 bg-slate-800/70 border border-slate-600/50 rounded-full px-3.5 py-1.5">
            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-400 to-fuchsia-400 inline-block" />
            {selectedMonths.length} mes{selectedMonths.length !== 1 ? 'es' : ''} seleccionado{selectedMonths.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
};

/* ── Alert Badge ── */
const AlertBadge = ({ alertLabel, size = 'md' }: { alertLabel: string; size?: 'sm' | 'md' }) => {
  if (!alertLabel) return null;
  const cfg = getAlertCfg(alertLabel);
  return (
    <span className={`inline-flex items-center gap-1.5 font-bold rounded-full border ${cfg.bg} ${cfg.border} ${cfg.text} ${cfg.glow} ${
      size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
    }`}>
      <AlertTriangle size={size === 'sm' ? 9 : 11} />
      {cfg.label}
    </span>
  );
};

/* ── Global Procedures Timeline ── */
const GlobalProceduresTimeline = ({ procedures }: { procedures: ScheduledProcedure[] }) => {
  const currentMonthIdx = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  interface ProcEvent {
    monthIdx: number; month: string; procName: string;
    year: number; alertLabel: string;
  }

  const events: ProcEvent[] = [];
  procedures.forEach(proc => {
    const monthNums = parseMonths(proc.scheduledMonths);
    const procYear = getYear(proc.year);
    monthNums.forEach(mNum => {
      const idx = mNum - 1;
      if (idx >= 0 && idx < 12) {
        events.push({ monthIdx: idx, month: MONTHS[idx], procName: proc.name, year: procYear, alertLabel: proc.alertLabel });
      }
    });
  });

  events.sort((a, b) => a.monthIdx - b.monthIdx);
  if (events.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center shrink-0 shadow-[0_0_14px_rgba(168,85,247,0.25)]">
          <Calendar size={17} className="text-purple-300" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-purple-200 leading-tight">Cronograma General</h3>
          <p className="text-xs text-slate-500 leading-tight">Línea de tiempo de todos los procedimientos programados</p>
        </div>
      </div>

      <ol className="items-start sm:flex sm:flex-wrap gap-y-8">
        {events.map((ev, i) => {
          const isPast = ev.year < currentYear || (ev.year === currentYear && ev.monthIdx < currentMonthIdx);
          const isCurrent = ev.year === currentYear && ev.monthIdx === currentMonthIdx;

          const dotBg = isPast
            ? 'bg-orange-500/25 sm:ring-orange-900/20'
            : isCurrent ? 'bg-emerald-500/25 sm:ring-emerald-900/20'
            : 'bg-purple-500/20 sm:ring-purple-900/15';

          const iconColor = isPast ? 'text-orange-300' : isCurrent ? 'text-emerald-300' : 'text-purple-300';

          const timeBg = isPast
            ? 'bg-orange-500/15 border-orange-400/40 text-orange-200'
            : isCurrent ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200'
            : 'bg-blue-500/15 border-blue-400/50 text-blue-200';

          return (
            <li key={`${ev.procName}-${ev.month}-${i}`} className="relative mb-6 sm:mb-0 sm:flex-1 min-w-[90px]">
              <div className="flex items-center">
                <div className={`z-10 flex items-center justify-center w-9 h-9 rounded-full ring-0 sm:ring-8 shrink-0 border border-white/10 ${dotBg}`}>
                  <ClipboardList size={15} className={iconColor} />
                </div>
                <div className="hidden sm:flex w-full bg-slate-700/40 h-px" />
              </div>
              <div className="mt-3 sm:pe-6">
                <time className={`text-sm font-bold px-2.5 py-1 rounded-lg border ${timeBg}`}>
                  {ev.month}
                </time>
                <h4 className="text-base font-bold text-slate-100 mt-2.5 mb-1 leading-tight">{ev.procName}</h4>
                <p className="text-xs text-slate-500 mb-1.5">{ev.year}</p>
                {ev.alertLabel && <AlertBadge alertLabel={ev.alertLabel} size="sm" />}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

/* ── Main Component ── */
const ScheduledProceduresManagement = () => {
  const [procedures, setProcedures] = useState<ScheduledProcedure[]>([]);
  const [newProc, setNewProc] = useState<ScheduledProcedure>({
    year: yearToIso(new Date().getFullYear()),
    name: '',
    description: '',
    scheduledMonths: '[]',
    alertLabel: '',
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editProc, setEditProc] = useState<ScheduledProcedure | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchProcedures(); }, []);

  useEffect(() => {
    if (editingId === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setEditingId(null); setEditProc(null); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [editingId]);

  const fetchProcedures = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const list: ScheduledProcedure[] = Array.isArray(data) ? data : [];
      list.sort((a, b) => (b.idScheduledProcedure ?? 0) - (a.idScheduledProcedure ?? 0));
      setProcedures(list);
    } catch {
      toast.error('No se pudo cargar procedimientos.');
    } finally {
      setLoading(false);
    }
  };

  const toggleNewMonth = (monthNum: number) => {
    const months = parseMonths(newProc.scheduledMonths);
    const next = months.includes(monthNum)
      ? months.filter(m => m !== monthNum)
      : [...months, monthNum].sort((a, b) => a - b);
    setNewProc({ ...newProc, scheduledMonths: JSON.stringify(next) });
  };

  const toggleEditMonth = (monthNum: number) => {
    if (!editProc) return;
    const months = parseMonths(editProc.scheduledMonths);
    const next = months.includes(monthNum)
      ? months.filter(m => m !== monthNum)
      : [...months, monthNum].sort((a, b) => a - b);
    setEditProc({ ...editProc, scheduledMonths: JSON.stringify(next) });
  };

  const createProcedure = async () => {
    // Validaciones cliente
    if (!isNonEmptyString(newProc.name, 150)) {
      toast.error('El nombre del procedimiento es obligatorio');
      return;
    }
    const selectedMonths = parseMonths(newProc.scheduledMonths);
    if (!Array.isArray(selectedMonths) || selectedMonths.length === 0) {
      toast.error('Debes seleccionar al menos un mes para el procedimiento.');
      return;
    }
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newProc, scheduledMonths: selectedMonths }),
      });
      if (!res.ok) throw new Error();
      toast.success('Procedimiento creado!');
      setNewProc({ year: yearToIso(new Date().getFullYear()), name: '', description: '', scheduledMonths: '[]', alertLabel: '' });
      fetchProcedures();
    } catch {
      toast.error('No se pudo crear procedimiento.');
    }
  };

  const updateProcedure = async (id: number) => {
    if (!editProc) return;
    // Validaciones en edición
    if (!isNonEmptyString(editProc.name, 150)) {
      toast.error('El nombre del procedimiento es obligatorio');
      return;
    }
    const selectedMonths = parseMonths(editProc.scheduledMonths);
    if (!Array.isArray(selectedMonths) || selectedMonths.length === 0) {
      toast.error('Debes seleccionar al menos un mes para el procedimiento.');
      return;
    }
    try {
      const res = await fetch(`${API_URL}${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editProc, scheduledMonths: selectedMonths }),
      });
      if (!res.ok) throw new Error();
      toast.success('Procedimiento actualizado!');
      setEditingId(null);
      setEditProc(null);
      fetchProcedures();
    } catch {
      toast.error('No se pudo actualizar procedimiento.');
    }
  };

  const deleteProcedure = async (id: number) => {
    const ok = await confirmDialog({
      title: '¿Eliminar procedimiento?',
      description: 'Esta acción eliminará el procedimiento permanentemente.',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
    });
    if (!ok) return;
    try {
      const res = await fetch(`${API_URL}${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Procedimiento eliminado!');
      fetchProcedures();
    } catch {
      toast.error('No se pudo eliminar procedimiento.');
    }
  };

  const handleDownloadCSV = () => {
    const rows = ['Procedimiento,Año,Mes,Alerta'];
    procedures.forEach(proc => {
      const months = parseMonths(proc.scheduledMonths);
      months.forEach(m => {
        rows.push(`"${proc.name}",${getYear(proc.year)},"${MONTHS[m - 1]}","${proc.alertLabel}"`);
      });
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'procedimientos_sanitarios.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
      <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">
        Procedimientos Sanitarios Programados
      </h1>

      {/* ── Formulario de registro ── */}
      <AdminSection>
        <h2 className="text-xl font-semibold mb-5 text-[#bdab62]">Agregar Nuevo Procedimiento</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[360px]">
          {/* Left: Month Calendar */}
          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-5">
            <ProcedureMonthPicker
              selectedMonths={parseMonths(newProc.scheduledMonths)}
              onToggle={toggleNewMonth}
            />
          </div>

          {/* Right: Form fields */}
          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-5 flex flex-col gap-4">
            <div>
              <label className="block mb-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                Nombre del Procedimiento
              </label>
              <input
                type="text"
                placeholder="Ej: Desparasitación"
                value={newProc.name}
                onChange={e => setNewProc({ ...newProc, name: e.target.value })}
                className="select-field placeholder-gray-400 w-full"
              />
            </div>

            <div>
              <label className="block mb-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                Descripción <span className="text-slate-600 normal-case font-normal">(opcional)</span>
              </label>
              <input
                type="text"
                placeholder="Detalles sobre el procedimiento"
                value={newProc.description ?? ''}
                onChange={e => setNewProc({ ...newProc, description: e.target.value })}
                className="select-field placeholder-gray-400 w-full"
              />
            </div>

            {/* Año + Prioridad 50/50 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Año de Vigencia
                </label>
                <YearSpinner
                  value={getYear(newProc.year)}
                  onChange={y => setNewProc({ ...newProc, year: yearToIso(y) })}
                />
              </div>
              <div>
                <label className="block mb-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Prioridad
                </label>
                <select
                  value={newProc.alertLabel}
                  onChange={e => setNewProc({ ...newProc, alertLabel: e.target.value })}
                  className="w-full"
                >
                  <option value="">-- Prioridad --</option>
                  {ALERT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {newProc.alertLabel && (
                  <div className="mt-2">
                    <AlertBadge alertLabel={newProc.alertLabel} />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end mt-auto pt-4 border-t border-slate-800/50">
              <AddButton onClick={createProcedure}>Agregar Procedimiento</AddButton>
            </div>
          </div>
        </div>
      </AdminSection>

      {/* ── Cronograma General (justo debajo del formulario) ── */}
      {!loading && procedures.length > 0 && (
        <AdminSection>
          <div className="rounded-2xl border border-purple-500/25 bg-gradient-to-br from-slate-900/60 via-purple-950/20 to-slate-900/60 p-6">
            <GlobalProceduresTimeline procedures={procedures} />
          </div>
        </AdminSection>
      )}

      {/* ── Lista de procedimientos ── */}
      <AdminSection>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-teal-400">Procedimientos Registrados</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-800/50 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:border-teal-500/50 hover:bg-slate-700/60 hover:text-teal-300 transition-all duration-200 shadow-sm"
            >
              <Download size={14} />
              Descargar
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400 py-12">
            <Loader size={24} className="animate-spin" /> Cargando procedimientos...
          </div>
        ) : procedures.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/50 border border-slate-700/40 flex items-center justify-center mb-4">
              <ClipboardList size={24} className="text-slate-600" />
            </div>
            <p className="text-slate-400 font-medium">No hay procedimientos registrados</p>
            <p className="text-xs text-slate-600 mt-1">Agrega un nuevo procedimiento usando el formulario de arriba</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {procedures.map(proc => {
              const monthNums = parseMonths(proc.scheduledMonths);
              const procYear = getYear(proc.year);

              return (
                <div
                  key={proc.idScheduledProcedure}
                  className="rounded-2xl border border-slate-800/60 bg-gradient-to-br from-purple-500/10 via-slate-900/60 to-slate-900/90 shadow-lg shadow-black/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-purple-500/20"
                >
                  {/* Dot + label centrado */}
                  <div className="flex flex-col items-center gap-2 py-5">
                    <span className="h-4 w-4 rounded-full bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.6)]" />
                    <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Procedimiento</span>
                  </div>

                  {/* Nombre centrado */}
                  <div className="px-6 pb-2 text-center">
                    <h3 className="text-lg font-semibold text-purple-300 leading-snug">{proc.name}</h3>
                  </div>

                  {/* Info box */}
                  <div className="mx-6 mb-5 rounded-xl border border-slate-700/50 bg-slate-800/30 px-4 py-3 space-y-2 text-sm text-slate-200">
                    <p className="flex items-center gap-2">
                      <span className="font-medium text-slate-400 shrink-0">Año:</span>
                      <span className="font-bold text-cyan-300">{procYear}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="font-medium text-slate-400 shrink-0">Estado:</span>
                      {proc.alertLabel
                        ? <AlertBadge alertLabel={proc.alertLabel} />
                        : <span className="text-slate-600 text-xs">Sin asignar</span>
                      }
                    </p>
                    {proc.description && (
                      <p>
                        <span className="font-medium text-slate-400">Descripción:</span>{' '}
                        <span className="text-slate-300">{proc.description}</span>
                      </p>
                    )}
                    {monthNums.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {monthNums.map(m => (
                          <span
                            key={m}
                            className="text-xs font-semibold rounded-full bg-blue-500/15 border border-blue-400/55 px-2.5 py-0.5 text-blue-200"
                          >
                            {MONTH_ABBR[m - 1]}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-center gap-5 border-t border-slate-800/60 px-5 py-4 bg-slate-900/30">
                    <button
                      onClick={() => {
                        setEditingId(proc.idScheduledProcedure!);
                        setEditProc({
                          ...proc,
                          scheduledMonths: Array.isArray(proc.scheduledMonths)
                            ? JSON.stringify(proc.scheduledMonths)
                            : proc.scheduledMonths || '[]',
                        });
                      }}
                      className="relative flex items-center justify-center w-14 h-14 rounded-[18px]
                        bg-gradient-to-b from-[#1A1C1E] to-[#0E0F10]
                        shadow-[6px_6px_14px_rgba(0,0,0,0.8),-4px_-4px_10px_rgba(255,255,255,0.05)]
                        hover:scale-[1.1] active:shadow-[inset_4px_4px_10px_rgba(0,0,0,0.9),inset_-3px_-3px_8px_rgba(255,255,255,0.04)]
                        transition-all duration-300"
                    >
                      <Edit size={22} className="text-[#E8C967] drop-shadow-[0_0_8px_rgba(255,215,100,0.8)]" />
                    </button>
                    <button
                      onClick={() => deleteProcedure(proc.idScheduledProcedure!)}
                      className="relative flex items-center justify-center w-14 h-14 rounded-[18px]
                        bg-gradient-to-b from-[#1A1C1E] to-[#0E0F10]
                        shadow-[6px_6px_14px_rgba(0,0,0,0.8),-4px_-4px_10px_rgba(255,255,255,0.05)]
                        hover:scale-[1.1] active:shadow-[inset_4px_4px_10px_rgba(0,0,0,0.9),inset_-3px_-3px_8px_rgba(255,255,255,0.04)]
                        transition-all duration-300"
                    >
                      <Trash2 size={22} className="text-[#E86B6B] drop-shadow-[0_0_10px_rgba(255,80,80,0.85)]" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Edit modal ── */}
        {editingId !== null && editProc && createPortal(
          <div
            className="fixed inset-0 lg:left-80 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => { setEditingId(null); setEditProc(null); }}
          >
            <div
              className="w-full max-w-3xl max-h-[95vh] overflow-y-auto rounded-2xl border border-[#167C79]/60 bg-[#0f172a] shadow-[0_30px_90px_rgba(0,0,0,0.7)]"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/70">
                <div>
                  <h3 className="text-xl font-bold text-[#F8F4E3]">Editar Procedimiento</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Actualiza los datos del procedimiento</p>
                </div>
                <button
                  onClick={() => { setEditingId(null); setEditProc(null); }}
                  className="w-8 h-8 rounded-lg border border-slate-700/60 bg-slate-800/50 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 transition-colors"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Modal body */}
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 min-h-[340px]">
                  {/* Left: calendar */}
                  <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-5">
                    <ProcedureMonthPicker
                      selectedMonths={parseMonths(editProc.scheduledMonths)}
                      onToggle={toggleEditMonth}
                    />
                  </div>

                  {/* Right: fields */}
                  <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-5 flex flex-col gap-4">
                    <div>
                      <label className="block mb-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Nombre del Procedimiento
                      </label>
                      <input
                        type="text"
                        value={editProc.name}
                        onChange={e => setEditProc({ ...editProc, name: e.target.value })}
                        className="select-field w-full"
                      />
                    </div>

                    <div>
                      <label className="block mb-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Descripción
                      </label>
                      <input
                        type="text"
                        value={editProc.description ?? ''}
                        onChange={e => setEditProc({ ...editProc, description: e.target.value })}
                        className="select-field w-full"
                      />
                    </div>

                    {/* Año + Prioridad 50/50 */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block mb-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Año de Vigencia
                        </label>
                        <YearSpinner
                          value={getYear(editProc.year)}
                          onChange={y => setEditProc({ ...editProc, year: yearToIso(y) })}
                        />
                      </div>
                      <div>
                        <label className="block mb-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Prioridad
                        </label>
                        <select
                          value={editProc.alertLabel}
                          onChange={e => setEditProc({ ...editProc, alertLabel: e.target.value })}
                          className="w-full"
                        >
                          <option value="">-- Prioridad --</option>
                          {ALERT_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        {editProc.alertLabel && (
                          <div className="mt-2">
                            <AlertBadge alertLabel={editProc.alertLabel} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal footer */}
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-800/70">
                <CancelButton onClick={() => { setEditingId(null); setEditProc(null); }} />
                <SaveButton onClick={() => updateProcedure(editingId!)} children="Guardar cambios" />
              </div>
            </div>
          </div>,
          document.body,
        )}
      </AdminSection>
    </div>
  );
};

export default ScheduledProceduresManagement;
