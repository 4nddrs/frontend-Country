import { Card } from "../../components/ui/card";
import UserHeader from "../../components/UserHeader";
import { Flag, Video, DollarSign, Newspaper, ChevronRight, Loader } from "lucide-react";
import { useCurrentUser, useOwnerData, useOwnerHorses } from "../../hooks/useUserData";
import type { Horse } from "../../services/userService";

interface HomeProps {
  setCurrentView: (view: "home" | "UserHorses" | "UserCamera" | "UserPayments" | "UserProfile") => void;
}

export function UserHome({ setCurrentView }: HomeProps) {
  const { data: user } = useCurrentUser();
  const { data: ownerData, isLoading: ownerLoading } = useOwnerData(user?.id);
  const { data: horses = [], isLoading: horsesLoading } = useOwnerHorses(ownerData?.idOwner);

  const loading = ownerLoading || horsesLoading;
  const ownerName = ownerData?.ownerName || ownerData?.name || "";

  const calculateAge = (birthdate?: string): number => {
    if (!birthdate) return 0;
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-cyan-500 mx-auto mb-4" />
          <p className="text-slate-400">Cargando datos...</p>
        </div>
      </div>
    );
  }

  const horsesList = horses as Horse[];

  return (
    <div className="min-h-screen bg-black">
      <div className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl m-6 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
        <UserHeader title={`Bienvenido${ownerName ? ", " + ownerName : ""}`} />

        <div className="px-0 py-4 md:px-0 md:py-6 max-w-6xl mx-auto space-y-3 md:space-y-4">
          {horsesList.length > 0 ? (
            horsesList.map((horse: Horse) => (
              <Card
                key={horse.idHorse}
                className="group relative overflow-hidden bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/50 backdrop-blur-md hover:border-cyan-500/60 active:scale-[0.98] transition-all duration-200 cursor-pointer shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
                onClick={() => setCurrentView("UserHorses")}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-cyan-500/0 group-hover:from-cyan-500/10 group-hover:to-transparent transition-all duration-300" />
                <div className="relative p-4 md:p-6 flex items-center justify-between min-h-[80px]">
                  <div className="flex items-center gap-3 md:gap-4 flex-1">
                    <div className="w-14 h-14 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 flex-shrink-0">
                      <Flag className="w-7 h-7 md:w-6 md:h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base md:text-lg text-white font-semibold mb-1 truncate">
                        {horse.horseName}
                      </h3>
                      <p className="text-xs md:text-sm text-slate-400 truncate">{calculateAge(horse.birthdate)} anos</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                </div>
              </Card>
            ))
          ) : (
            <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50 backdrop-blur-sm">
              <div className="p-6 text-center">
                <p className="text-slate-400">No tienes caballos registrados</p>
              </div>
            </Card>
          )}

          <Card
            className="group relative overflow-hidden bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/50 backdrop-blur-md hover:border-cyan-500/60 active:scale-[0.98] transition-all duration-200 cursor-pointer shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
            onClick={() => setCurrentView("UserCamera")}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-cyan-500/0 group-hover:from-cyan-500/10 group-hover:to-transparent transition-all duration-300" />
            <div className="relative p-4 md:p-6 flex items-center justify-between min-h-[80px]">
              <div className="flex items-center gap-3 md:gap-4 flex-1">
                <div className="w-14 h-14 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30 flex-shrink-0">
                  <Video className="w-7 h-7 md:w-6 md:h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base md:text-lg text-white font-semibold mb-1">Camara activa</h3>
                  <p className="text-xs md:text-sm text-slate-400">Monitoreo en tiempo real</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </Card>

          <Card
            className="group relative overflow-hidden bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/50 backdrop-blur-md hover:border-cyan-500/60 active:scale-[0.98] transition-all duration-200 cursor-pointer shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
            onClick={() => setCurrentView("UserPayments")}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-cyan-500/0 group-hover:from-emerald-500/10 group-hover:to-transparent transition-all duration-300" />
            <div className="relative p-4 md:p-6 flex items-center justify-between min-h-[80px]">
              <div className="flex items-center gap-3 md:gap-4 flex-1">
                <div className="w-14 h-14 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 flex-shrink-0">
                  <DollarSign className="w-7 h-7 md:w-6 md:h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base md:text-lg text-white font-semibold mb-1">Estado financiero</h3>
                  <p className="text-xs md:text-sm text-slate-400">Ver historial de pagos</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
            </div>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/50 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <div className="p-4 md:p-6">
              <div className="flex items-center gap-3 mb-4 md:mb-6">
                <div className="w-12 h-12 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30 flex-shrink-0">
                  <Newspaper className="w-6 h-6" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-teal-400">Noticias del Club</h3>
              </div>

              <div className="space-y-3">
                <div className="group flex gap-3 p-3 md:p-4 rounded-xl bg-slate-800/60 hover:bg-slate-800/80 active:scale-[0.98] transition-all cursor-pointer border border-slate-700/30">
                  <span className="text-2xl md:text-xl mt-0.5 flex-shrink-0">📰</span>
                  <p className="text-sm md:text-sm text-slate-200 leading-relaxed">Nuevo torneo ecuestre el 20 de octubre.</p>
                </div>

                <div className="group flex gap-3 p-3 md:p-4 rounded-xl bg-slate-800/60 hover:bg-slate-800/80 active:scale-[0.98] transition-all cursor-pointer border border-slate-700/30">
                  <span className="text-2xl md:text-xl mt-0.5 flex-shrink-0">🌿</span>
                  <p className="text-sm md:text-sm text-slate-200 leading-relaxed">Se renovaron las areas verdes del establo principal.</p>
                </div>

                <div className="group flex gap-3 p-3 md:p-4 rounded-xl bg-slate-800/60 hover:bg-slate-800/80 active:scale-[0.98] transition-all cursor-pointer border border-slate-700/30">
                  <span className="text-2xl md:text-xl mt-0.5 flex-shrink-0">🚰</span>
                  <p className="text-sm md:text-sm text-slate-200 leading-relaxed">Mantenimiento del sistema de agua el proximo fin de semana.</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
