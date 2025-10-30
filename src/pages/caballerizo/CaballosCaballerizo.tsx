import { Loader2, Trophy } from "lucide-react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { HorseCard } from "./components/HorseCard";
import type {
  CaballerizoHorse,
  CaballerizoHorseAssignment,
} from "./types";

interface CaballosCaballerizoProps {
  assignments: CaballerizoHorseAssignment[];
  horsesById: Record<number, CaballerizoHorse>;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function CaballosCaballerizo({
  assignments,
  horsesById,
  loading,
  error,
  onRetry,
}: CaballosCaballerizoProps) {
  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
        <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">
          Caballos asignados
        </h1>

        <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.5)] text-[#F8F4E3]">
          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
            </div>
          ) : error ? (
            <Card className="max-w-3xl mx-auto p-6 bg-slate-900/60 border border-red-500/30 text-center space-y-4">
              <p className="text-sm text-red-200">{error}</p>
              <Button
                onClick={onRetry}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
              >
                Reintentar
              </Button>
            </Card>
          ) : assignments.length === 0 ? (
            <Card className="max-w-3xl mx-auto p-6 bg-slate-900/60 border border-slate-800/60 text-center space-y-3">
              <Trophy className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-sm text-slate-300">
                No hay caballos asignados en este momento.
              </p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {assignments.map((assignment) => (
                <HorseCard
                  key={assignment.idHorseAssignments}
                  assignment={assignment}
                  horse={horsesById[assignment.fk_idHorse] ?? assignment.horse ?? null}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
