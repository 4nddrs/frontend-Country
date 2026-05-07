import { useEffect, useState } from 'react';
import { CalendarDays, Activity, Apple, Loader, ChevronRight, Crown } from 'lucide-react';
import { Card } from '../../components/ui/card';
import UserHeader from '../../components/UserHeader';
import { useCurrentUser, useOwnerData, useOwnerHorses } from '../../hooks/useUserData';
import {
  type Horse,
  getNutritionalPlanById,
  getRaceById,
} from '../../services/userService';

interface MiCaballoProps {}

type HorseDetails = {
  raceName: string;
  planName: string;
  planDescription?: string;
  boxLabel: string;
  hasBox: boolean;
  boxPeriod?: string;
};

export function UserHorses(_: MiCaballoProps) {
  const [selectedHorse, setSelectedHorse] = useState<Horse | null>(null);
  const [selectedHorseDetails, setSelectedHorseDetails] = useState<HorseDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [raceNames, setRaceNames] = useState<Record<number, string>>({});

  const { data: user } = useCurrentUser();
  const { data: ownerData, isLoading: ownerLoading } = useOwnerData(user?.id);
  const { data: horses = [], isLoading: horsesLoading } = useOwnerHorses(ownerData?.idOwner);

  const loading = ownerLoading || horsesLoading;
  const horsesList = horses as Horse[];

  const getRaceName = async (fk_idRace?: number): Promise<string> => {
    if (!fk_idRace) return 'Sin especificar';
    
    // Intenta obtener del objeto horse primero (si la API devuelve la raza)
    const horse = horsesList.find(h => h.fk_idRace === fk_idRace);
    if (horse?.race?.nameRace) {
      return horse.race.nameRace;
    }
    
    // Si no, obtén la raza de la API
    try {
      const race = await getRaceById(fk_idRace);
      return race?.nameRace ?? 'Sin especificar';
    } catch (error) {
      console.error('Error fetching race:', error);
      return 'Sin especificar';
    }
  };

  const calculateAge = (birthdate?: string): string => {
    if (!birthdate) return 'No especificada';
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return `${age} años`;
  };

  // Cargar nombres de razas para todos los caballos
  useEffect(() => {
    let cancelled = false;

    const loadRaceNames = async () => {
      const names: Record<number, string> = {};
      
      for (const horse of horsesList) {
        if (horse.fk_idRace) {
          names[horse.idHorse] = await getRaceName(horse.fk_idRace);
        }
      }

      if (!cancelled) {
        setRaceNames(names);
      }
    };

    if (horsesList.length > 0) {
      loadRaceNames();
    }

    return () => {
      cancelled = true;
    };
  }, [horsesList]);

  useEffect(() => {
    if (horsesList.length === 0) {
      setSelectedHorse(null);
      setSelectedHorseDetails(null);
      return;
    }

    if (!selectedHorse || !horsesList.some((horse) => horse.idHorse === selectedHorse.idHorse)) {
      setSelectedHorse(horsesList[0]);
    }
  }, [horsesList, selectedHorse]);

  useEffect(() => {
    let cancelled = false;

    const loadHorseDetails = async () => {
      if (!selectedHorse) {
        setSelectedHorseDetails(null);
        return;
      }

      setDetailsLoading(true);

      try {
        let planName = 'Sin plan asignado';
        let planDescription: string | undefined;

        // Obtener plan nutricional directamente del objeto horse
        try {
          // El plan está guardado directamente en el objeto Horse
          const planId = (selectedHorse as any)?.fl_idNutritionalPlan;
          
          console.log('Direct planId from horse:', planId);

          if (planId) {
            const plan = await getNutritionalPlanById(planId);
            console.log('Plan details:', plan);
            if (plan?.name) {
              planName = plan.name;
              planDescription = plan.description || undefined;
            }
          } else {
            console.warn('No fl_idNutritionalPlan found in horse:', selectedHorse);
          }
        } catch (error) {
          console.error('Error loading nutritional plan:', error);
        }

        let hasBox = false;
        let boxLabel = 'Sin box';
        let boxPeriod: string | undefined;

        // El box está guardado directamente en el objeto horse
        if (selectedHorse.box) {
          hasBox = true;
          boxLabel = 'Con box';
        }

        // Obtener el nombre de la raza
        const raceName = await getRaceName(selectedHorse.fk_idRace);

        const details: HorseDetails = {
          raceName,
          planName,
          planDescription,
          boxLabel,
          hasBox,
          boxPeriod,
        };

        if (!cancelled) {
          setSelectedHorseDetails(details);
        }
      } catch (error) {
        console.error('Error fetching horse details:', error);
        const raceName = await getRaceName(selectedHorse.fk_idRace);
        if (!cancelled) {
          setSelectedHorseDetails({
            raceName,
            planName: 'Sin plan asignado',
            boxLabel: selectedHorse.box ? 'Con box' : 'Sin box',
            hasBox: Boolean(selectedHorse.box),
          });
        }
      } finally {
        if (!cancelled) {
          setDetailsLoading(false);
        }
      }
    };

    loadHorseDetails();

    return () => {
      cancelled = true;
    };
  }, [selectedHorse]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-cyan-500 mx-auto mb-4" />
          <p className="text-slate-400">Cargando caballos...</p>
        </div>
      </div>
    );
  }

  if (horsesList.length === 0) {
    return (
      <div className="min-h-screen p-4 md:p-6 lg:p-8">
        <UserHeader title="Mi Caballo" />
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50 backdrop-blur-sm p-8 text-center">
            <p className="text-slate-400">No tienes caballos registrados</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="bg-white/0 backdrop-blur-lg p-4 md:p-6 rounded-2xl m-4 md:m-6 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
        <UserHeader title="Mi Caballo" />

        <div className="max-w-6xl mx-auto space-y-5 md:space-y-6">
          <Card className="relative overflow-hidden border-slate-700/50 bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-800/80 shadow-[0_18px_50px_rgba(0,0,0,0.45)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(139,92,246,0.14),transparent_35%)]" />
            <div className="relative p-5 md:p-7 lg:p-8">
              <div className="flex flex-col xl:flex-row gap-6 xl:gap-8">
                <div className="flex-1 space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/80 mb-2">Rol Dueño</p>
                    <h2 className="text-2xl md:text-3xl font-semibold text-white leading-tight">Detalles del caballo</h2>
                    <p className="text-sm text-slate-400 mt-1">Consulta raza, plan nutricional y box sin editar datos sensibles.</p>
                  </div>

                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3 backdrop-blur-sm">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400 mb-1">Caballos</p>
                      <p className="text-lg font-semibold text-white">{horsesList.length}</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3 backdrop-blur-sm">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400 mb-1">Seleccionado</p>
                      <p className="text-lg font-semibold text-white truncate">{selectedHorse?.horseName}</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3 backdrop-blur-sm">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400 mb-1">Raza</p>
                      <p className="text-lg font-semibold text-white">{selectedHorseDetails?.raceName || 'Sin especificar'}</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3 backdrop-blur-sm">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400 mb-1">Box</p>
                      <p className="text-lg font-semibold text-emerald-400">{selectedHorseDetails?.boxLabel || 'Sin box'}</p>
                    </div>
                  </div>
                </div>

                <div className="xl:w-[24rem]">
                  <Card className="h-full border-white/8 bg-slate-950/40 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
                    <div className="p-4 md:p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Caballo activo</p>
                          <h3 className="text-xl font-semibold text-white">{selectedHorse?.horseName}</h3>
                        </div>
                      </div>

                      {horsesList.length > 1 ? (
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                          {horsesList.map((horse) => {
                            const isSelected = selectedHorse?.idHorse === horse.idHorse;
                            return (
                              <button
                                key={horse.idHorse}
                                onClick={() => setSelectedHorse(horse)}
                                className={`w-full rounded-2xl border px-4 py-3 text-left transition-all ${
                                  isSelected
                                    ? 'border-cyan-400/40 bg-cyan-500/10 shadow-[0_0_18px_rgba(34,211,238,0.12)]'
                                    : 'border-white/8 bg-white/5 hover:border-cyan-400/20 hover:bg-white/8'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-white truncate">{horse.horseName}</p>
                                    <p className="text-xs text-slate-400 truncate">{raceNames[horse.idHorse] || 'Sin especificar'}</p>
                                  </div>
                                  <ChevronRight className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-cyan-300' : 'text-slate-500'}`} />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-slate-300">
                          Solo tienes un caballo registrado.
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </Card>

          {selectedHorse && (
            <>
              <Card className="relative overflow-hidden border-slate-700/50 bg-gradient-to-br from-slate-800/55 to-slate-900/65 shadow-[0_12px_36px_rgba(0,0,0,0.35)]">
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl" />
                <div className="relative p-5 md:p-6 lg:p-7">
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-400 mb-2">Ficha del caballo</p>
                      <h2 className="text-xl md:text-2xl font-semibold text-teal-400">{selectedHorse.horseName}</h2>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                      <Crown className="h-3.5 w-3.5" />
                      Activo
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                      <p className="text-xs text-slate-500 mb-1">Nombre</p>
                      <p className="text-white font-medium">{selectedHorse.horseName}</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                      <p className="text-xs text-slate-500 mb-1">Raza</p>
                      <p className="text-white font-medium">{selectedHorseDetails?.raceName || 'Sin especificar'}</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                      <p className="text-xs text-slate-500 mb-1">Edad</p>
                      <p className="text-white font-medium">{calculateAge(selectedHorse.birthdate)}</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                      <p className="text-xs text-slate-500 mb-1">Sexo</p>
                      <p className="text-white font-medium">{selectedHorse.sex || 'No especificado'}</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                      <p className="text-xs text-slate-500 mb-1">Color</p>
                      <p className="text-white font-medium">{selectedHorse.color || 'No especificado'}</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                      <p className="text-xs text-slate-500 mb-1">Estado</p>
                      <p className="text-white font-medium">{selectedHorse.state || 'Activo'}</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                      <p className="text-xs text-slate-500 mb-1">Pasaporte</p>
                      <p className="text-white font-medium">{selectedHorse.passportNumber || 'No registrado'}</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                      <p className="text-xs text-slate-500 mb-1">Box</p>
                      <p className="text-white font-medium">{selectedHorseDetails?.boxLabel || (selectedHorse.box ? 'Con box' : 'Sin box')}</p>
                    </div>
                  </div>
                </div>
              </Card>

              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
                <Card className="group relative overflow-hidden bg-gradient-to-br from-slate-800/45 to-slate-900/45 border-slate-700/50 backdrop-blur-sm hover:border-cyan-500/30 transition-all shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                  <div className="p-6">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 flex items-center justify-center mb-4">
                      <Apple className="w-5 h-5 text-cyan-400" />
                    </div>
                    <p className="text-xs text-slate-500 mb-2">Plan nutricional</p>
                    <p className="text-sm text-white">{detailsLoading ? 'Cargando...' : selectedHorseDetails?.planName || 'Sin plan asignado'}</p>
                    {selectedHorseDetails?.planDescription ? (
                      <p className="text-xs text-cyan-300 mt-1">{selectedHorseDetails.planDescription}</p>
                    ) : null}
                  </div>
                </Card>

                <Card className="group relative overflow-hidden bg-gradient-to-br from-slate-800/45 to-slate-900/45 border-slate-700/50 backdrop-blur-sm hover:border-cyan-500/30 transition-all shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                  <div className="p-6">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 flex items-center justify-center mb-4">
                      <CalendarDays className="w-5 h-5 text-cyan-400" />
                    </div>
                    <p className="text-xs text-slate-500 mb-2">Box asignado</p>
                    <p className="text-sm text-white">{detailsLoading ? 'Cargando...' : selectedHorseDetails?.boxLabel || 'Sin box'}</p>
                    {selectedHorseDetails?.boxPeriod ? (
                      <p className="text-xs text-slate-400 mt-1">Período: {new Date(selectedHorseDetails.boxPeriod).toLocaleDateString()}</p>
                    ) : null}
                  </div>
                </Card>

                <Card className="group relative overflow-hidden bg-gradient-to-br from-slate-800/45 to-slate-900/45 border-slate-700/50 backdrop-blur-sm hover:border-cyan-500/30 transition-all shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                  <div className="p-6">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center mb-4">
                      <Activity className="w-5 h-5 text-emerald-400" />
                    </div>
                    <p className="text-xs text-slate-500 mb-2">Estado</p>
                    <p className="text-sm text-white">{selectedHorse?.state || 'Activo'}</p>
                  </div>
                </Card>
              </div>

             
            </>
          )}
        </div>
      </div>
    </div>
  );
}
