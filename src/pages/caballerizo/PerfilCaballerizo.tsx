import { Loader2 } from "lucide-react";
import UserHeader from "../../components/UserHeader";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { ProfileCard } from "./components/ProfileCard";
import type { CaballerizoEmployee } from "./types";

interface PerfilCaballerizoProps {
  employee: CaballerizoEmployee | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onNavigateToTasks: () => void;
  onNavigateToHorses: () => void;
}

export function PerfilCaballerizo({
  employee,
  loading,
  error,
  onRetry,
  onNavigateToTasks,
  onNavigateToHorses,
}: PerfilCaballerizoProps) {
  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <UserHeader title="Perfil del caballerizo" />

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
      ) : employee ? (
        <div className="max-w-5xl mx-auto space-y-6">
          <ProfileCard
            employee={employee}
            onViewTasks={onNavigateToTasks}
            onViewHorses={onNavigateToHorses}
          />
        </div>
      ) : (
        <Card className="max-w-3xl mx-auto p-6 bg-slate-900/60 border border-slate-800/60 text-center">
          <p className="text-sm text-slate-300">
            No se encontro informacion del perfil.
          </p>
        </Card>
      )}
    </div>
  );
}
