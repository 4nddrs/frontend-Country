import { useState, useEffect } from 'react';
import { Heart, Calendar, Activity, Apple, Loader } from 'lucide-react';
import { Card } from '../../components/ui/card';
import UserHeader from '../../components/UserHeader';
import { useCurrentUser, useOwnerData, useOwnerHorses } from '../../hooks/useUserData';

interface MiCaballoProps {}

interface Horse {
  idHorse: number;
  horseName: string;
  birthdate?: string;
  sex?: string;
  color?: string;
  race?: { nameRace: string };
  generalDescription?: string;
  passportNumber?: number;
  box?: boolean;
  section?: boolean;
  basket?: boolean;
  state?: string;
}

interface NutritionalPlan {
  planName: string;
  description: string;
}

interface TotalControl {
  box: number;
  period: string;
}

export function UserHorses(_: MiCaballoProps) {
  const [selectedHorse, setSelectedHorse] = useState<Horse | null>(null);
  const [nutritionalPlan, setNutritionalPlan] = useState<NutritionalPlan | null>(null);
  const [controlData, setControlData] = useState<TotalControl | null>(null);

  // Usar hooks optimizados con React Query
  const { data: user } = useCurrentUser();
  const { data: ownerData, isLoading: ownerLoading } = useOwnerData(user?.id);
  const { data: horses = [], isLoading: horsesLoading } = useOwnerHorses(ownerData?.idOwner);

  const loading = ownerLoading || horsesLoading;
  const horsesList = horses as Horse[];

  // Función para calcular la edad desde la fecha de nacimiento
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

  useEffect(() => {
    if (horsesList.length > 0 && !selectedHorse) {
      const firstHorse = horsesList[0];
      setSelectedHorse(firstHorse);
      fetchAdditionalHorseData(firstHorse.idHorse);
    }
  }, [horsesList, selectedHorse]);

  const fetchAdditionalHorseData = async (horseId: number) => {
    // Get nutritional plan
    try {
      const planRes = await fetch(`http://localhost:8000/nutritional_plan_horses/by_horse/${horseId}`);
      if (planRes.ok) {
        const planHorseData = await planRes.json();
        if (planHorseData && planHorseData[0]?.fk_idNutritionalPlan) {
          const nutritionalPlanRes = await fetch(`http://localhost:8000/nutritional_plans/${planHorseData[0].fk_idNutritionalPlan}`);
          if (nutritionalPlanRes.ok) {
            setNutritionalPlan(await nutritionalPlanRes.json());
          }
        }
      }
    } catch (error) {
      console.error('Error fetching nutritional plan:', error);
    }

    // Get control data (box info)
    try {
      const controlRes = await fetch(`http://localhost:8000/total_control/by_horse/${horseId}`);
      if (controlRes.ok) {
        const controlsData = await controlRes.json();
        if (controlsData && controlsData.length > 0) {
          setControlData(controlsData[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching control data:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 flex items-center justify-center">
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
      <div className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl m-6 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
        {/* Header */}
        <UserHeader title="Mi Caballo" />

        <div className="max-w-4xl mx-auto space-y-5 p-0">
        {/* Horse Selector if multiple horses */}
        {horsesList.length > 1 && (
          <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50 backdrop-blur-sm p-4">
            <select 
              className="w-full p-2 rounded-md bg-slate-700 text-white border border-slate-600"
              value={selectedHorse?.idHorse}
              onChange={(e) => {
                const horse = horsesList.find((h: Horse) => h.idHorse === Number(e.target.value));
                if (horse) {
                  setSelectedHorse(horse);
                  fetchAdditionalHorseData(horse.idHorse);
                }
              }}
            >
              {horsesList.map((horse: Horse) => (
                <option key={horse.idHorse} value={horse.idHorse}>{horse.horseName}</option>
              ))}
            </select>
          </Card>
        )}

        {selectedHorse && (
          <>
            {/* Main Info Card */}
            <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-slate-700/50 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl" />
          <div className="relative p-6 md:p-8">
            <div className="flex items-start justify-between mb-6">
              <h2 className="text-xl md:text-2xl font-semibold text-teal-400">{selectedHorse.horseName}</h2>
              <Heart className="w-6 h-6 text-slate-400 hover:text-red-400 cursor-pointer transition-colors" />
            </div>
            
            <div className="grid grid-cols-2 gap-4 md:gap-6">
              <div>
                <p className="text-xs text-slate-500 mb-1">Nombre</p>
                <p className="text-white">{selectedHorse.horseName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Raza</p>
                <p className="text-white">{selectedHorse.race?.nameRace || 'Sin especificar'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Raza</p>
                <p className="text-white">{selectedHorse.race?.nameRace || 'Sin especificar'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Edad</p>
                <p className="text-white">{calculateAge(selectedHorse.birthdate)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Sexo</p>
                <p className="text-white">{selectedHorse.sex || 'No especificado'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Color</p>
                <p className="text-white">{selectedHorse.color || 'No especificado'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Estado</p>
                <p className="text-white">{selectedHorse.state || 'Activo'}</p>
              </div>
            </div>
          </div>
            </Card>

            {/* Stats Grid */}
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
          {/* Plan Nutricional */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50 backdrop-blur-sm hover:border-cyan-500/30 transition-all shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <div className="p-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 flex items-center justify-center mb-4">
                <Apple className="w-5 h-5 text-cyan-400" />
              </div>
              <p className="text-xs text-slate-500 mb-2">Plan Nutricional</p>
              <p className="text-sm text-white">{nutritionalPlan?.planName || 'Sin plan asignado'}</p>
              {nutritionalPlan?.description && (
                <p className="text-xs text-cyan-400 mt-1">{nutritionalPlan.description}</p>
              )}
            </div>
          </Card>

          {/* Box */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50 backdrop-blur-sm hover:border-cyan-500/30 transition-all">
            <div className="p-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 flex items-center justify-center mb-4">
                <Calendar className="w-5 h-5 text-cyan-400" />
              </div>
              <p className="text-xs text-slate-500 mb-2">Box asignado</p>
              <p className="text-sm text-white">Box #{controlData?.box || 'Sin asignar'}</p>
              {controlData?.period && (
                <p className="text-xs text-slate-400 mt-1">Período: {new Date(controlData.period).toLocaleDateString()}</p>
              )}
            </div>
          </Card>

          {/* Actividad */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50 backdrop-blur-sm hover:border-cyan-500/30 transition-all">
            <div className="p-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center mb-4">
                <Activity className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-xs text-slate-500 mb-2">Estado</p>
              <p className="text-sm text-white">Activo</p>
              <p className="text-xs text-emerald-400 mt-1">En cuidado</p>
            </div>
              </Card>
            </div>

            {/* Additional Info */}
            <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50 backdrop-blur-sm">
              <div className="p-4 md:p-6">
                <h3 className="text-sm text-slate-400 mb-4">Información adicional</h3>
                <div className="space-y-3">
                  
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-3 rounded-lg bg-slate-800/50">
                    <span className="text-sm text-slate-300">Box actual</span>
                    <span className="text-sm text-white">{controlData?.box ? `Box #${controlData.box}` : 'No asignado'}</span>
                  </div>
                </div>
              </div>
            </Card>
          </>
        )}
        </div>
      </div>
    </div>
  );
}
