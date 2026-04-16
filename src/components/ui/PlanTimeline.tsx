interface PlanTimelineProps {
  assignmentDate: string;
  endDate: string;
  state: string;
}

export const PlanTimeline = ({ assignmentDate, endDate, state }: PlanTimelineProps) => {
  const progress = (() => {
    if (!assignmentDate || !endDate) return 0;
    const start = new Date(assignmentDate).getTime();
    const end = new Date(endDate).getTime();
    const now = Date.now();
    if (now <= start) return 0;
    if (now >= end) return 100;
    return Math.round(((now - start) / (end - start)) * 100);
  })();

  const daysLeft = (() => {
    if (!endDate) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const end = new Date(endDate); end.setHours(0, 0, 0, 0);
    return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  })();

  const colors = {
    bar:  { ACTIVO: 'from-emerald-500 to-teal-400', 'POR VENCER': 'from-amber-500 to-yellow-400', VENCIDO: 'from-rose-500 to-pink-400' },
    glow: { ACTIVO: 'shadow-[0_0_10px_rgba(16,185,129,0.8)]', 'POR VENCER': 'shadow-[0_0_10px_rgba(245,158,11,0.8)]', VENCIDO: 'shadow-[0_0_10px_rgba(244,63,94,0.75)]' },
    text: { ACTIVO: 'text-emerald-400', 'POR VENCER': 'text-amber-400', VENCIDO: 'text-rose-400' },
    dot:  { ACTIVO: 'bg-emerald-300', 'POR VENCER': 'bg-amber-300', VENCIDO: 'bg-rose-400' },
  };

  const barColor  = colors.bar[state  as keyof typeof colors.bar]  ?? 'from-slate-600 to-slate-500';
  const glowColor = colors.glow[state as keyof typeof colors.glow] ?? '';
  const textColor = colors.text[state as keyof typeof colors.text] ?? 'text-slate-400';
  const dotColor  = colors.dot[state  as keyof typeof colors.dot]  ?? 'bg-slate-400';

  const label = state === 'VENCIDO'
    ? `Venció hace ${Math.abs(daysLeft ?? 0)}d`
    : daysLeft !== null
      ? `${daysLeft}d restantes`
      : '';

  return (
    <div className="px-5 pb-3">
      <div className="flex justify-between items-center text-[10px] mb-1.5">
        <span className="text-slate-500">{assignmentDate?.slice(0, 10)}</span>
        <span className={`font-bold tracking-wide ${textColor}`}>{label}</span>
        <span className="text-slate-500">{endDate?.slice(0, 10)}</span>
      </div>

      <div className="relative h-2 w-full rounded-full bg-slate-800 overflow-visible">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${barColor} ${glowColor} transition-all duration-700`}
          style={{ width: `${progress}%` }}
        />
        {progress > 0 && progress < 100 && (
          <span
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-3.5 w-3.5 rounded-full border-2 border-slate-900 ${dotColor} ${glowColor}`}
            style={{ left: `${progress}%` }}
          />
        )}
      </div>

      <div className="flex justify-between text-[10px] text-slate-600 mt-1">
        <span>Inicio</span>
        <span className={`font-semibold ${textColor}`}>{progress}%</span>
        <span>Fin</span>
      </div>
    </div>
  );
};
