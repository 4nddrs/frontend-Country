import { Calendar, CalendarClock, Trophy } from "lucide-react";
import type {
  CaballerizoHorse,
  CaballerizoHorseAssignment,
} from "../types";
import { Card } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { decodeBackendImage } from "../../../utils/imageHelpers";
import { getHorseImageUrl } from "../../../utils/supabaseStorageHelpers";

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

const getHorseImageSource = (horse: CaballerizoHorse | null): string | null => {
  if (!horse) return null;

  const record = horse as Record<string, unknown>;
  const rawImage =
    (typeof horse.horsePhoto === "string" && horse.horsePhoto) ||
    (typeof horse.image_url === "string" && horse.image_url) ||
    (typeof record.imageUrl === "string" && record.imageUrl) ||
    (typeof record.photo === "string" && record.photo) ||
    (typeof record.photo_url === "string" && record.photo_url) ||
    null;

  if (!rawImage) return null;

  return getHorseImageUrl(rawImage) || decodeBackendImage(rawImage);
};

export function HorseCard({ assignment, horse }: HorseCardProps) {
  const horseName = horse?.horseName ?? `Caballo #${assignment.fk_idHorse}`;
  const horseState = horse?.state ?? "Sin estado";
  const horseImage = getHorseImageSource(horse);

  return (
    <Card className="relative overflow-hidden border border-slate-700/60 bg-slate-900/70 shadow-[0_14px_40px_rgba(0,0,0,0.35)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.14),transparent_35%)]" />
      <div className="relative flex flex-col md:flex-row w-full p-3 md:p-4 gap-4">
        <div className="relative md:w-2/5 shrink-0 overflow-hidden rounded-xl">
          {horseImage ? (
            <img
              src={horseImage}
              alt={horseName}
              className="h-52 md:h-full w-full object-cover"
            />
          ) : (
            <div className="h-52 md:h-full w-full bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center">
              <Trophy className="w-10 h-10 text-emerald-300/70" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-transparent" />
          <div className="absolute left-3 bottom-3 flex items-center gap-2 text-xs text-white/90">
            <Trophy className="w-4 h-4 text-emerald-300" />
            Asignacion #{assignment.idHorseAssignments}
          </div>
        </div>

        <div className="flex-1 p-1 md:p-2">
          <div className="mb-4 rounded-full bg-emerald-600/90 py-1 px-3 border border-emerald-400/20 text-xs text-white shadow-sm w-fit text-center">
            CABALLO ASIGNADO
          </div>

          <div className="flex items-start justify-between gap-3">
            <h3 className="text-xl md:text-2xl font-semibold text-white leading-tight">
              {horseName}
            </h3>
            <Badge className={resolveStateClass(horseState)}>{horseState}</Badge>
          </div>

          <p className="mt-3 text-sm md:text-base text-slate-300 leading-relaxed max-w-2xl">
            Estado actual: {horseState}. Asignado desde {formatDate(assignment.assignmentDate)}
            {assignment.endDate ? ` con cierre previsto para ${formatDate(assignment.endDate)}.` : "."}
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 max-w-xl">
            <div className="flex items-center gap-3 rounded-lg border border-slate-700/70 bg-slate-800/60 p-3">
              <div className="w-9 h-9 rounded-md bg-slate-900/80 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 uppercase tracking-wide">Inicio</p>
                <p className="text-sm text-white">{formatDate(assignment.assignmentDate)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-slate-700/70 bg-slate-800/60 p-3">
              <div className="w-9 h-9 rounded-md bg-slate-900/80 flex items-center justify-center">
                <CalendarClock className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 uppercase tracking-wide">Fin previsto</p>
                <p className="text-sm text-white">{formatDate(assignment.endDate)}</p>
              </div>
            </div>
          </div>

         
        </div>
      </div>
    </Card>
  );
}



