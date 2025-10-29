import { Calendar, CalendarClock, ShieldCheck, Trophy } from "lucide-react";
import type {
  CaballerizoHorse,
  CaballerizoHorseAssignment,
} from "../types";
import { Card } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";

interface HorseCardProps {
  assignment: CaballerizoHorseAssignment;
  horse: CaballerizoHorse | null;
}

const formatDate = (value?: string | null) => {
  if (!value) return "Sin registro";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-BO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const resolveStateClass = (state?: string | null) => {
  const normalized = state?.toLowerCase() ?? "";
  if (normalized.includes("recup")) {
    return "bg-amber-500/20 text-amber-200 border border-amber-500/40";
  }
  if (normalized.includes("comp")) {
    return "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40";
  }
  return "bg-slate-800/60 text-slate-200 border border-slate-700/60";
};

export function HorseCard({ assignment, horse }: HorseCardProps) {
  const horseName = horse?.horseName ?? `Caballo #${assignment.fk_idHorse}`;
  const horseState = horse?.state ?? "Sin estado";

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50 backdrop-blur-sm">
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl" />
      <div className="relative p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-emerald-400" />
              <h3 className="text-lg text-white font-semibold">{horseName}</h3>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              ID asignacion #{assignment.idHorseAssignments}
            </p>
          </div>
          <Badge className={resolveStateClass(horseState)}>{horseState}</Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-800/50 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Inicio</p>
              <p className="text-sm text-white">
                {formatDate(assignment.assignmentDate)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-800/50 flex items-center justify-center">
              <CalendarClock className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Fin previsto</p>
              <p className="text-sm text-white">
                {formatDate(assignment.endDate)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Plan de bienestar activo
        </div>
      </div>
    </Card>
  );
}
