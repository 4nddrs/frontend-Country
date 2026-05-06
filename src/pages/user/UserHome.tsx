import { Card } from "../../components/ui/card";
import UserHeader from "../../components/UserHeader";
import {
  Flag,
  Video,
  DollarSign,
  ChevronRight,
  Loader,
  User,
  Shield,
} from "lucide-react";
import { useCurrentUser, useOwnerData, useOwnerHorses } from "../../hooks/useUserData";
import type { Horse } from "../../services/userService";
import { decodeBackendImage } from "../../utils/imageHelpers";
import { getOwnerImageUrl } from "../../utils/supabaseStorageHelpers";

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

  const getHorseStatusLabel = (state?: string): string => {
    if (!state) return "Sin estado";
    const value = state.toLowerCase();
    if (value.includes("recup")) return "Recuperacion";
    if (value.includes("comp") || value.includes("activ")) return "Activo";
    return state;
  };

  const ownerImage = ownerData?.ownerPhoto
    ? getOwnerImageUrl(ownerData.ownerPhoto) || decodeBackendImage(ownerData.ownerPhoto)
    : null;

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
  const ownerDisplayName = ownerData?.ownerName || ownerData?.name || "Propietario";
  const ownerCi = ownerData?.ci || "Sin CI";
  const horsesWithBox = horsesList.filter((horse) => Boolean(horse.box)).length;
  const averageHorseAge = horsesList.length
    ? Math.round(
        horsesList.reduce((acc, horse) => acc + calculateAge(horse.birthdate), 0) /
          horsesList.length,
      )
    : 0;

  return (
    <div className="min-h-screen bg-black">
      <div className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl m-6 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
        <UserHeader title={`Bienvenido${ownerName ? ", " + ownerName : ""}`} />

        <div className="px-0 py-4 md:py-6 max-w-6xl mx-auto space-y-6">
          <Card className="relative overflow-hidden border-slate-700/60 bg-gradient-to-r from-[#131f3f] via-[#17264a] to-[#0f1730] shadow-[0_20px_40px_rgba(0,0,0,0.35)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.14),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.14),transparent_35%)]" />
            <div className="relative p-5 md:p-7">
              <div className="flex flex-col md:flex-row gap-5 md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  {ownerImage ? (
                    <img
                      src={ownerImage}
                      alt={ownerDisplayName}
                      className="h-20 w-20 rounded-2xl object-cover border border-cyan-400/40"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 border border-cyan-400/40 flex items-center justify-center">
                      <User className="w-9 h-9 text-white" />
                    </div>
                  )}
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/80 mb-1">Mi cuenta</p>
                    <h2 className="text-2xl md:text-3xl font-semibold text-white">{ownerDisplayName}</h2>
                    <p className="text-sm text-slate-300 mt-1">CI: {ownerCi}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentView("UserProfile")}
                  className="self-start md:self-center inline-flex items-center gap-2 rounded-lg bg-cyan-500/20 px-4 py-2 text-sm text-cyan-200 border border-cyan-400/30 hover:bg-cyan-500/30 transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  Ver perfil
                </button>
              </div>

              <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Caballos</p>
                  <p className="text-xl font-semibold text-white mt-1">{horsesList.length}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Con box</p>
                  <p className="text-xl font-semibold text-white mt-1">{horsesWithBox}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Edad promedio</p>
                  <p className="text-xl font-semibold text-white mt-1">{averageHorseAge} años</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Estado cuenta</p>
                  <p className="text-xl font-semibold text-emerald-300 mt-1">Activa</p>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid lg:grid-cols-[1.4fr_1fr] gap-5">
            <Card className="border-slate-700/60 bg-gradient-to-br from-slate-900/90 to-slate-900/60">
              <div className="p-5 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white text-lg font-semibold">Mis caballos</h3>
                  <button
                    type="button"
                    onClick={() => setCurrentView("UserHorses")}
                    className="text-xs uppercase tracking-[0.14em] text-cyan-300 hover:text-cyan-200"
                  >
                    Ver todos
                  </button>
                </div>

                {horsesList.length === 0 ? (
                  <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-5 text-center text-slate-400">
                    No tienes caballos registrados
                  </div>
                ) : (
                  <div className="space-y-3">
                    {horsesList.map((horse) => (
                      <button
                        key={horse.idHorse}
                        type="button"
                        onClick={() => setCurrentView("UserHorses")}
                        className="w-full text-left group rounded-xl border border-slate-700/50 bg-slate-800/40 hover:border-cyan-400/50 hover:bg-slate-800/70 transition-all p-4"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                              <Flag className="w-5 h-5 text-white" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-white font-medium truncate">{horse.horseName}</p>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {calculateAge(horse.birthdate)} anos · {getHorseStatusLabel(horse.state)}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-cyan-300 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            <div className="space-y-5">
              <Card
                className="group cursor-pointer border-slate-700/60 bg-gradient-to-br from-[#1a1f39] to-[#12182e] hover:border-cyan-400/50 transition-all"
                onClick={() => setCurrentView("UserCamera")}
              >
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-fuchsia-500 to-violet-600 flex items-center justify-center shadow-lg shadow-fuchsia-500/20">
                        <Video className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-semibold">Cámara del establo</p>
                        <p className="text-xs text-slate-400">Monitoreo en tiempo real</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-cyan-300" />
                  </div>
                </div>
              </Card>

              <Card
                className="group cursor-pointer border-slate-700/60 bg-gradient-to-br from-[#17243a] to-[#111b2a] hover:border-emerald-400/50 transition-all"
                onClick={() => setCurrentView("UserPayments")}
              >
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <DollarSign className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-semibold">Estado financiero</p>
                        <p className="text-xs text-slate-400">Consulta de pagos y movimientos</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-300" />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



