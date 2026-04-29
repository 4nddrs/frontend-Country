import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import {
  Edit, Trash2, Loader, AlertTriangle, Download, Info, X, Syringe, Calendar,
} from 'lucide-react';
import { AddButton, AdminSection, SaveButton, CancelButton } from '../../components/ui/admin-buttons';
import { confirmDialog } from '../../utils/confirmDialog';

const API_URL = 'https://api.countryclub.doc-ia.cloud/vaccination_plan/';
const MEDICINES_URL = 'https://api.countryclub.doc-ia.cloud/medicines/';

interface VaccinationPlan {
  idVaccinationPlan?: number;
  planName: string;
  scheduledMonths: string;
  dosesByMonth: string;
  alertStatus: string;
  fk_idMedicine: number;
  created_at?: string;
}

interface FrontendPlanData {
  planName: string;
  scheduledMonths: { [key: string]: string };
  dosesByMonth: { [key: string]: number };
  alertStatus: string;
  fk_idMedicine: number;
}

const EMPTY_PLAN: FrontendPlanData = {
  planName: '',
  scheduledMonths: {},
  dosesByMonth: {},
  alertStatus: '',
  fk_idMedicine: 0,
};

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const MONTH_ABBR = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

const noSpinnerStyle: React.CSSProperties = {
  appearance: 'textfield',
  WebkitAppearance: 'none',
  MozAppearance: 'textfield',
};

const safeJsonParse = (json: string): Record<string, unknown> | null => {
  try {
    const p = JSON.parse(json);
    return typeof p === 'object' && p !== null ? p : null;
  } catch {
    return null;
  }
};

const getScheduledNames = (plan: VaccinationPlan): string[] => {
  const p = safeJsonParse(plan.scheduledMonths);
  return p ? (Object.values(p) as string[]) : [];
};

const getDoses = (plan: VaccinationPlan): Record<string, number> => {
  const p = safeJsonParse(plan.dosesByMonth);
  return (p as Record<string, number>) ?? {};
};

const computeAlerts = (names: string[]) => {
  const now = new Date().getMonth();
  const idxs = names.map(m => MONTHS.indexOf(m)).filter(i => i >= 0).sort((a, b) => a - b);
  const upcoming = idxs.filter(i => i >= now);
  const overdue = idxs.filter(i => i < now);
  const nextIdx = upcoming[0] ?? null;
  return {
    currentMonthIdx: now,
    nextIdx,
    isApproaching: nextIdx !== null && nextIdx <= now + 1,
    hasOverdue: overdue.length > 0,
  };
};

/* ── Modern Month Calendar Picker with Year Navigation ── */
const MonthCalendarPicker = ({
  plan,
  onToggle,
}: {
  plan: FrontendPlanData;
  onToggle: (month: string, selected: boolean) => void;
}) => {
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const selected = Object.values(plan.scheduledMonths);
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  return (
    <div>
      {/* Header with year navigation */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center shrink-0 shadow-[0_0_14px_rgba(34,211,238,0.2)]">
            <Calendar size={17} className="text-cyan-300" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-100 leading-tight">Meses Programados</p>
            <p className="text-xs text-slate-500 leading-tight">Toca un mes para activarlo</p>
          </div>
        </div>

        {/* Year selector */}
        <div className="flex items-center gap-2 bg-slate-800/80 border border-cyan-500/30 rounded-xl px-2 py-1 shadow-[0_0_10px_rgba(34,211,238,0.12)]">
          <span className="text-sm font-extrabold text-cyan-200 tracking-widest select-none min-w-[40px] text-center">
            {calYear}
          </span>
          <div className="flex flex-col gap-0.5">
            <button
              type="button"
              onClick={() => setCalYear(y => y + 1)}
              className="w-4 h-3.5 flex items-center justify-center rounded bg-cyan-500/25 hover:bg-cyan-400/40 text-cyan-300 hover:text-white transition-all duration-150 text-[8px] font-black leading-none"
            >
              ▲
            </button>
            <button
              type="button"
              onClick={() => setCalYear(y => y - 1)}
              className="w-4 h-3.5 flex items-center justify-center rounded bg-cyan-500/25 hover:bg-cyan-400/40 text-cyan-300 hover:text-white transition-all duration-150 text-[8px] font-black leading-none"
            >
              ▼
            </button>
          </div>
        </div>
      </div>

      {/* Month grid */}
      <div className="grid grid-cols-4 gap-2">
        {MONTHS.map((month, idx) => {
          const on = selected.includes(month);
          const isCurrent = idx === currentMonth && calYear === currentYear;
          const selIdx = selected.indexOf(month);
          const isOrange = on && selIdx % 2 === 0;
          const isPink = on && selIdx % 2 !== 0;

          return (
            <button
              key={month}
              type="button"
              onClick={() => onToggle(month, on)}
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
                {String(idx + 1).padStart(2, '0')}
              </p>
              <p className={`text-[12px] font-extrabold leading-none tracking-wider ${
                isOrange ? 'text-orange-100' : isPink ? 'text-fuchsia-100' : isCurrent ? 'text-teal-300' : 'text-slate-400 group-hover:text-slate-200'
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

      {selected.length > 0 && (
        <div className="mt-3 flex items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-200 bg-slate-800/70 border border-slate-600/50 rounded-full px-3.5 py-1.5">
            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-400 to-fuchsia-400 inline-block shadow-sm" />
            {selected.length} mes{selected.length !== 1 ? 'es' : ''} seleccionado{selected.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
};

/* ── Plan Details Panel ── */
const PlanDetailsPanel = ({
  plan,
  medicines,
  onChangeName,
  onChangeMedicine,
  onDose,
}: {
  plan: FrontendPlanData;
  medicines: { idMedicine: number; name: string }[];
  onChangeName: (v: string) => void;
  onChangeMedicine: (v: number) => void;
  onDose: (month: string, dose: number) => void;
}) => {
  const selectedMonths = Object.values(plan.scheduledMonths).sort(
    (a, b) => MONTHS.indexOf(a) - MONTHS.indexOf(b),
  );

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div>
        <label className="block mb-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
          Nombre del Tratamiento
        </label>
        <input
          type="text"
          placeholder="Ej. Plan Anual 2026"
          value={plan.planName}
          onChange={e => onChangeName(e.target.value)}
          className="select-field placeholder-gray-400 w-full"
        />
      </div>

      <div>
        <label className="block mb-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
          Medicamento
        </label>
        <select
          value={plan.fk_idMedicine}
          onChange={e => onChangeMedicine(Number(e.target.value))}
          className="w-full"
        >
          <option value={0}>-- Selecciona medicamento --</option>
          {medicines.map(m => (
            <option key={m.idMedicine} value={m.idMedicine}>{m.name}</option>
          ))}
        </select>
      </div>

      {selectedMonths.length > 0 && (
        <div className="flex-1">
          <label className="block mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            Dosis por Mes
          </label>
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1"
            style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(6,182,212,0.3) transparent' }}>
            {selectedMonths.map(month => (
              <div
                key={month}
                className="flex items-center justify-between gap-3 rounded-xl bg-slate-800/50 border border-slate-700/50 px-3.5 py-2.5 hover:border-cyan-500/40 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.7)] shrink-0" />
                  <span className="text-sm font-semibold text-cyan-200">{month}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">dosis</span>
                  <input
                    type="number"
                    min={1}
                    value={plan.dosesByMonth[month] ?? 1}
                    onChange={e => onDose(month, Math.max(1, Number(e.target.value)))}
                    onFocus={e => e.target.select()}
                    style={noSpinnerStyle}
                    className="w-14 text-center text-sm font-bold bg-slate-900/60 border border-slate-700/60 rounded-lg py-1 text-white focus:outline-none focus:border-cyan-500/70 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedMonths.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/50 border border-slate-700/40 flex items-center justify-center mx-auto mb-3">
              <Syringe size={20} className="text-slate-600" />
            </div>
            <p className="text-xs text-slate-500">Selecciona meses en el calendario<br />para ingresar las dosis</p>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Card Timeline (single alert, no dose multipliers) ── */
const CardTimeline = ({
  scheduledNames,
}: {
  scheduledNames: string[];
}) => {
  const currentIdx = new Date().getMonth();
  const { isApproaching, nextIdx, hasOverdue } = computeAlerts(scheduledNames);
  const sorted = [...scheduledNames].sort((a, b) => MONTHS.indexOf(a) - MONTHS.indexOf(b));

  if (sorted.length === 0) return null;

  const alert = isApproaching && nextIdx !== null
    ? { kind: 'upcoming' as const, monthName: MONTHS[nextIdx] }
    : hasOverdue
    ? { kind: 'overdue' as const }
    : null;

  return (
    <div className="mt-3 space-y-3">
      {alert && (
        alert.kind === 'upcoming' ? (
          <div className="flex items-center gap-2 rounded-xl bg-orange-500/12 border border-orange-500/45 px-3 py-2">
            <AlertTriangle size={13} className="text-orange-400 shrink-0" />
            <span className="text-sm font-semibold text-orange-200">
              Próxima: <strong className="text-orange-100">{alert.monthName}</strong>
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl bg-red-500/12 border border-red-500/45 px-3 py-2">
            <AlertTriangle size={13} className="text-red-400 shrink-0" />
            <span className="text-sm font-semibold text-red-200">Aplicaciones vencidas</span>
          </div>
        )
      )}

      <ol className="flex items-start gap-0">
        {sorted.map((month, i) => {
          const idx = MONTHS.indexOf(month);
          const isPast = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const isLast = i === sorted.length - 1;

          const dotColor = isPast
            ? 'bg-orange-500/30 border-orange-400/60 ring-orange-900/25'
            : isCurrent
            ? 'bg-emerald-500/30 border-emerald-400/70 ring-emerald-900/25'
            : 'bg-cyan-500/25 border-cyan-400/60 ring-cyan-900/20';

          const iconColor = isPast ? 'text-orange-300' : isCurrent ? 'text-emerald-300' : 'text-cyan-300';
          const labelColor = isPast ? 'text-orange-200' : isCurrent ? 'text-emerald-200' : 'text-cyan-200';
          const borderColor = isPast ? 'border-orange-400/50' : isCurrent ? 'border-emerald-400/50' : 'border-blue-400/60';
          const bgColor = isPast ? 'bg-orange-500/12' : isCurrent ? 'bg-emerald-500/12' : 'bg-blue-500/15';

          return (
            <li key={month} className="relative flex-1 min-w-0">
              <div className="flex items-center">
                <div className={`z-10 flex items-center justify-center w-7 h-7 rounded-full shrink-0 ring-4 border ${dotColor}`}>
                  <Syringe size={11} className={iconColor} />
                </div>
                {!isLast && <div className="flex-1 h-px bg-slate-700/50" />}
              </div>
              <div className="mt-2 pr-1">
                <time className={`text-[11px] font-bold rounded-md px-2 py-0.5 border ${bgColor} ${borderColor} ${labelColor}`}>
                  {MONTH_ABBR[idx]}
                </time>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

/* ── Global Chronological Timeline ── */
const GlobalTimeline = ({
  plans,
  medicines,
}: {
  plans: VaccinationPlan[];
  medicines: { idMedicine: number; name: string }[];
}) => {
  const currentIdx = new Date().getMonth();

  const events: {
    monthIdx: number; month: string; planName: string; medName: string; dose: number;
  }[] = [];

  plans.forEach(plan => {
    const names = getScheduledNames(plan);
    const doses = getDoses(plan);
    const medName = medicines.find(m => m.idMedicine === plan.fk_idMedicine)?.name ?? 'N/A';
    names.forEach(month => {
      const idx = MONTHS.indexOf(month);
      if (idx >= 0) events.push({ monthIdx: idx, month, planName: plan.planName, medName, dose: doses[month] ?? 1 });
    });
  });

  events.sort((a, b) => a.monthIdx - b.monthIdx);
  if (events.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center shrink-0 shadow-[0_0_14px_rgba(20,184,166,0.25)]">
          <Calendar size={17} className="text-teal-300" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-teal-200 leading-tight">Cronograma General</h3>
          <p className="text-xs text-slate-500 leading-tight">Línea de tiempo de todas las vacunaciones programadas</p>
        </div>
      </div>

      <ol className="items-start sm:flex sm:flex-wrap gap-y-8">
        {events.map((ev, i) => {
          const isPast = ev.monthIdx < currentIdx;
          const isCurrent = ev.monthIdx === currentIdx;

          const dotBg = isPast
            ? 'bg-orange-500/25 sm:ring-orange-900/20'
            : isCurrent
            ? 'bg-emerald-500/25 sm:ring-emerald-900/20'
            : 'bg-cyan-500/20 sm:ring-cyan-900/15';

          const iconColor = isPast ? 'text-orange-300' : isCurrent ? 'text-emerald-300' : 'text-cyan-300';

          const timeBg = isPast
            ? 'bg-orange-500/15 border-orange-400/40 text-orange-200'
            : isCurrent
            ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200'
            : 'bg-blue-500/15 border-blue-400/50 text-blue-200';

          return (
            <li key={`${ev.planName}-${ev.month}-${i}`} className="relative mb-6 sm:mb-0 sm:flex-1 min-w-[90px]">
              <div className="flex items-center">
                <div className={`z-10 flex items-center justify-center w-9 h-9 rounded-full ring-0 sm:ring-8 shrink-0 border border-white/10 ${dotBg}`}>
                  <svg className={`w-4 h-4 ${iconColor}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 10h16m-8-3V4M7 7V4m10 3V4M5 20h14a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1Zm3-7h.01v.01H8V13Zm4 0h.01v.01H12V13Zm4 0h.01v.01H16V13Zm-8 4h.01v.01H8V17Zm4 0h.01v.01H12V17Zm4 0h.01v.01H16V17Z" />
                  </svg>
                </div>
                <div className="hidden sm:flex w-full bg-slate-700/40 h-px" />
              </div>
              <div className="mt-3 sm:pe-6">
                <time className={`text-sm font-bold px-2.5 py-1 rounded-lg border ${timeBg}`}>
                  {ev.month}
                </time>
                <h4 className="text-base font-bold text-slate-100 mt-2.5 mb-0.5 leading-tight">{ev.planName}</h4>
                <p className="text-sm text-slate-400 leading-snug">{ev.medName}</p>
                <p className="text-xs text-slate-500 mt-0.5">{ev.dose} dosis</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

/* ── Info Modal ── */
const InfoModal = ({
  plans,
  medicines,
  onClose,
}: {
  plans: VaccinationPlan[];
  medicines: { idMedicine: number; name: string }[];
  onClose: () => void;
}) => {
  type Row = { planName: string; month: string; monthIdx: number; medName: string; dose: number };
  const rows: Row[] = [];

  plans.forEach(plan => {
    const names = getScheduledNames(plan);
    const doses = getDoses(plan);
    const medName = medicines.find(m => m.idMedicine === plan.fk_idMedicine)?.name ?? 'N/A';
    names.forEach(month => {
      const idx = MONTHS.indexOf(month);
      rows.push({ planName: plan.planName, month, monthIdx: idx, medName, dose: doses[month] ?? 1 });
    });
  });

  rows.sort((a, b) => a.monthIdx - b.monthIdx);
  const currentIdx = new Date().getMonth();

  return createPortal(
    <div
      className="fixed inset-0 lg:left-80 z-[130] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-[#167C79]/50 bg-[#0a1628] shadow-[0_30px_90px_rgba(0,0,0,0.7)] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center">
              <Info size={16} className="text-cyan-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Resumen de Vacunaciones</h3>
              <p className="text-xs text-slate-500">Todos los planes · {rows.length} registros</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-slate-700/60 bg-slate-800/50 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(6,182,212,0.2) transparent' }}>
          {rows.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-slate-500 text-sm">
              No hay planes registrados.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[#0a1628] border-b border-slate-800/70">
                <tr>
                  {['Plan', 'Mes', 'Medicamento', 'Dosis'].map(h => (
                    <th key={h} className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-500 px-5 py-3.5">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const isPast = row.monthIdx < currentIdx;
                  const isCurrent = row.monthIdx === currentIdx;
                  const monthColor = isPast ? 'text-orange-200' : isCurrent ? 'text-emerald-200' : 'text-blue-200';
                  const monthBg = isPast ? 'bg-orange-500/12 border-orange-400/35' : isCurrent ? 'bg-emerald-500/12 border-emerald-400/35' : 'bg-blue-500/12 border-blue-400/40';

                  return (
                    <tr
                      key={i}
                      className={`border-b border-slate-800/40 transition-colors ${i % 2 === 0 ? 'bg-white/[0.02]' : 'bg-transparent'} hover:bg-slate-800/30`}
                    >
                      <td className="px-5 py-3 text-sm font-semibold text-slate-200">{row.planName}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-lg border ${monthBg} ${monthColor}`}>
                          {row.month}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-slate-400">{row.medName}</td>
                      <td className="px-5 py-3">
                        <span className="text-sm font-bold text-slate-200">{row.dose}</span>
                        <span className="text-xs text-slate-600 ml-1">dosis</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

/* ── Main component ── */
const VaccinationPlanManagement = () => {
  const [plans, setPlans] = useState<VaccinationPlan[]>([]);
  const [newPlan, setNewPlan] = useState<FrontendPlanData>({ ...EMPTY_PLAN });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingPlanData, setEditingPlanData] = useState<FrontendPlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [medicines, setMedicines] = useState<{ idMedicine: number; name: string }[]>([]);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const isEditModalOpen = editingId !== null && editingPlanData !== null;

  useEffect(() => { fetchPlans(); fetchMedicines(); }, []);

  useEffect(() => {
    if (!isEditModalOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setEditingId(null); setEditingPlanData(null); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isEditModalOpen]);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const list: VaccinationPlan[] = Array.isArray(data) ? data : [];
      list.sort((a, b) => (b.idVaccinationPlan ?? 0) - (a.idVaccinationPlan ?? 0));
      setPlans(list);
    } catch {
      toast.error('No se pudieron cargar los planes de vacunación.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicines = async () => {
    try {
      const res = await fetch(MEDICINES_URL);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMedicines(Array.isArray(data) ? data : []);
    } catch { /* silenciar */ }
  };

  const serializePlan = (p: FrontendPlanData) => ({
    ...p,
    scheduledMonths: JSON.stringify(p.scheduledMonths),
    dosesByMonth: JSON.stringify(p.dosesByMonth),
  });

  const createPlan = async () => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serializePlan(newPlan)),
      });
      if (!res.ok) throw new Error();
      toast.success('Plan de vacunación creado!');
      setNewPlan({ ...EMPTY_PLAN });
      fetchPlans();
    } catch {
      toast.error('Error al crear plan.');
    }
  };

  const updatePlan = async (id: number) => {
    if (!editingPlanData) return;
    try {
      const res = await fetch(`${API_URL}${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serializePlan(editingPlanData)),
      });
      if (!res.ok) throw new Error();
      toast.success('Plan actualizado!');
      setEditingId(null);
      setEditingPlanData(null);
      fetchPlans();
    } catch {
      toast.error('Error al actualizar plan.');
    }
  };

  const deletePlan = async (id: number) => {
    const ok = await confirmDialog({
      title: '¿Eliminar plan de vacunación?',
      description: 'Esta acción eliminará el plan permanentemente.',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
    });
    if (!ok) return;
    try {
      const res = await fetch(`${API_URL}${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Plan eliminado!');
      fetchPlans();
    } catch {
      toast.error('No se pudo eliminar el plan.');
    }
  };

  const handleEditClick = (plan: VaccinationPlan) => {
    setEditingId(plan.idVaccinationPlan!);
    try {
      setEditingPlanData({
        ...plan,
        scheduledMonths: JSON.parse(plan.scheduledMonths),
        dosesByMonth: JSON.parse(plan.dosesByMonth),
      });
    } catch {
      toast.error('Error al cargar datos de edición.');
      setEditingId(null);
    }
  };

  const toggleMonth = (
    month: string,
    isOn: boolean,
    plan: FrontendPlanData,
    setPlan: (p: FrontendPlanData) => void,
  ) => {
    if (isOn) {
      const filtered = Object.fromEntries(
        Object.entries(plan.scheduledMonths).filter(([, v]) => v !== month),
      );
      const reKeyed = Object.fromEntries(
        Object.values(filtered).map((v, i) => [`month${i + 1}`, v as string]),
      );
      const newDoses = { ...plan.dosesByMonth };
      delete newDoses[month];
      setPlan({ ...plan, scheduledMonths: reKeyed, dosesByMonth: newDoses });
    } else {
      const newKey = `month${Object.keys(plan.scheduledMonths).length + 1}`;
      setPlan({
        ...plan,
        scheduledMonths: { ...plan.scheduledMonths, [newKey]: month },
        dosesByMonth: { ...plan.dosesByMonth, [month]: 1 },
      });
    }
  };

  const handleDownloadCSV = () => {
    const rows: string[] = ['Plan,Mes,Medicamento,Dosis'];
    plans.forEach(plan => {
      const names = getScheduledNames(plan);
      const doses = getDoses(plan);
      const medName = medicines.find(m => m.idMedicine === plan.fk_idMedicine)?.name ?? 'N/A';
      names.forEach(month => {
        rows.push(`"${plan.planName}","${month}","${medName}",${doses[month] ?? 1}`);
      });
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'planes_vacunacion.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
      <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">
        Gestión del Plan Sanitario (Vacunas)
      </h1>

      {/* ── Formulario de registro ── */}
      <AdminSection>
        <h2 className="text-xl font-semibold mb-5 text-teal-400">Agregar Nuevo Plan</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[360px]">
          {/* Left: Month Calendar */}
          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-5">
            <MonthCalendarPicker
              plan={newPlan}
              onToggle={(month, on) => toggleMonth(month, on, newPlan, setNewPlan)}
            />
          </div>

          {/* Right: Plan details */}
          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-5 flex flex-col">
            <PlanDetailsPanel
              plan={newPlan}
              medicines={medicines}
              onChangeName={v => setNewPlan(prev => ({ ...prev, planName: v }))}
              onChangeMedicine={v => setNewPlan(prev => ({ ...prev, fk_idMedicine: v }))}
              onDose={(month, dose) =>
                setNewPlan(prev => ({ ...prev, dosesByMonth: { ...prev.dosesByMonth, [month]: dose } }))
              }
            />
            <div className="flex justify-end mt-5 pt-4 border-t border-slate-800/50">
              <AddButton onClick={createPlan}>Agregar Plan</AddButton>
            </div>
          </div>
        </div>
      </AdminSection>

      {/* ── Cronograma General (justo debajo del formulario) ── */}
      {!loading && plans.length > 0 && (
        <AdminSection>
          <div className="rounded-2xl border border-teal-500/25 bg-gradient-to-br from-slate-900/60 via-teal-950/20 to-slate-900/60 p-6">
            <GlobalTimeline plans={plans} medicines={medicines} />
          </div>
        </AdminSection>
      )}

      {/* ── Lista de planes ── */}
      <AdminSection>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-teal-400">Planes Registrados</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInfoModal(true)}
              className="flex items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-800/50 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:border-cyan-500/50 hover:bg-slate-700/60 hover:text-cyan-300 transition-all duration-200 shadow-sm"
            >
              <Info size={14} />
              Información
            </button>
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
            <Loader size={24} className="animate-spin" /> Cargando planes...
          </div>
        ) : plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/50 border border-slate-700/40 flex items-center justify-center mb-4">
              <Syringe size={24} className="text-slate-600" />
            </div>
            <p className="text-slate-400 font-medium">No hay planes de vacunación</p>
            <p className="text-xs text-slate-600 mt-1">Agrega un nuevo plan usando el formulario de arriba</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {plans.map(plan => {
              const scheduledNames = getScheduledNames(plan);
              const medName = medicines.find(m => m.idMedicine === plan.fk_idMedicine)?.name ?? 'N/A';

              return (
                <div
                  key={plan.idVaccinationPlan}
                  className="rounded-2xl border border-teal-700/40 bg-gradient-to-br from-slate-900/90 via-slate-900/75 to-cyan-950/30 shadow-lg shadow-black/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(20,184,166,0.15)] hover:border-teal-600/60 overflow-hidden"
                >
                  {/* Card header */}
                  <div className="px-5 pt-5 pb-4 border-b border-slate-800/60 bg-gradient-to-r from-teal-900/20 to-transparent">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center shrink-0 mt-0.5 shadow-[0_0_12px_rgba(20,184,166,0.2)]">
                        <Syringe size={17} className="text-teal-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-teal-100 leading-tight truncate">{plan.planName}</h3>
                        <p className="text-sm text-slate-400 mt-0.5 truncate">{medName}</p>
                      </div>
                      {scheduledNames.length > 0 && (
                        <span className="shrink-0 text-xs font-bold bg-blue-500/15 border border-blue-400/50 text-blue-300 rounded-full px-2.5 py-0.5 shadow-[0_0_8px_rgba(96,165,250,0.2)]">
                          {scheduledNames.length} mes{scheduledNames.length !== 1 ? 'es' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="px-5 py-4">
                    <CardTimeline scheduledNames={scheduledNames} />
                    {scheduledNames.length === 0 && (
                      <p className="text-sm text-slate-600 text-center py-3">Sin meses programados</p>
                    )}
                  </div>

                  {/* Month pills - blue border, no dose multipliers */}
                  {scheduledNames.length > 0 && (
                    <div className="px-5 pb-4 flex flex-wrap gap-1.5">
                      {[...scheduledNames]
                        .sort((a, b) => MONTHS.indexOf(a) - MONTHS.indexOf(b))
                        .map(month => (
                          <span
                            key={month}
                            className="text-xs font-semibold rounded-full bg-blue-500/15 border border-blue-400/55 px-2.5 py-0.5 text-blue-200 shadow-[0_0_6px_rgba(96,165,250,0.15)]"
                          >
                            {MONTH_ABBR[MONTHS.indexOf(month)]}
                          </span>
                        ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-center gap-5 border-t border-slate-800/60 px-5 py-4 bg-slate-900/30">
                    <button
                      onClick={() => handleEditClick(plan)}
                      className="relative flex items-center justify-center w-14 h-14 rounded-[18px]
                        bg-gradient-to-b from-[#1A1C1E] to-[#0E0F10]
                        shadow-[6px_6px_14px_rgba(0,0,0,0.8),-4px_-4px_10px_rgba(255,255,255,0.05)]
                        hover:scale-[1.1] active:shadow-[inset_4px_4px_10px_rgba(0,0,0,0.9),inset_-3px_-3px_8px_rgba(255,255,255,0.04)]
                        transition-all duration-300"
                    >
                      <Edit size={22} className="text-[#E8C967] drop-shadow-[0_0_8px_rgba(255,215,100,0.8)]" />
                    </button>
                    <button
                      onClick={() => deletePlan(plan.idVaccinationPlan!)}
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
        {isEditModalOpen && createPortal(
          <div
            className="fixed inset-0 lg:left-80 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => { setEditingId(null); setEditingPlanData(null); }}
          >
            <div
              className="w-full max-w-3xl max-h-[95vh] overflow-y-auto rounded-2xl border border-[#167C79]/60 bg-[#0f172a] shadow-[0_30px_90px_rgba(0,0,0,0.7)]"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/70">
                <div>
                  <h3 className="text-xl font-bold text-[#F8F4E3]">Editar Plan de Vacunación</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Actualiza los datos del plan</p>
                </div>
                <button
                  onClick={() => { setEditingId(null); setEditingPlanData(null); }}
                  className="w-8 h-8 rounded-lg border border-slate-700/60 bg-slate-800/50 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 transition-colors"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 min-h-[340px]">
                  <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-5">
                    <MonthCalendarPicker
                      plan={editingPlanData!}
                      onToggle={(month, on) => {
                        if (!editingPlanData) return;
                        toggleMonth(month, on, editingPlanData, p => setEditingPlanData(p));
                      }}
                    />
                  </div>

                  <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-5 flex flex-col">
                    <PlanDetailsPanel
                      plan={editingPlanData!}
                      medicines={medicines}
                      onChangeName={v => setEditingPlanData(prev => prev ? { ...prev, planName: v } : null)}
                      onChangeMedicine={v => setEditingPlanData(prev => prev ? { ...prev, fk_idMedicine: v } : null)}
                      onDose={(month, dose) =>
                        setEditingPlanData(prev =>
                          prev ? { ...prev, dosesByMonth: { ...prev.dosesByMonth, [month]: dose } } : null,
                        )
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-800/70">
                <CancelButton onClick={() => { setEditingId(null); setEditingPlanData(null); }} />
                <SaveButton onClick={() => updatePlan(editingId!)} children="Guardar cambios" />
              </div>
            </div>
          </div>,
          document.body,
        )}
      </AdminSection>

      {showInfoModal && (
        <InfoModal
          plans={plans}
          medicines={medicines}
          onClose={() => setShowInfoModal(false)}
        />
      )}
    </div>
  );
};

export default VaccinationPlanManagement;
