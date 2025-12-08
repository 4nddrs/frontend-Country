import { useState, useEffect } from 'react';
import { Heart, Calendar, Activity, Apple, Loader } from 'lucide-react';
import { Card } from '../../components/ui/card';
import UserHeader from '../../components/UserHeader';
import { supabase } from '../../supabaseClient';
import { toast } from 'react-hot-toast';

interface MiCaballoProps {}

interface Horse {
  idHorse: number;
  horseName: string;
  age: number;
  race: { nameRace: string };
  gender: string;
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
  const [horses, setHorses] = useState<Horse[]>([]);
  const [selectedHorse, setSelectedHorse] = useState<Horse | null>(null);
  const [nutritionalPlan, setNutritionalPlan] = useState<NutritionalPlan | null>(null);
  const [controlData, setControlData] = useState<TotalControl | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHorseData();
  }, []);

  const fetchHorseData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('No hay sesión activa');
        return;
      }

      // Get owner data - try query param or filter all owners
      let ownerData;
      const ownerRes = await fetch(`http://localhost:8000/owner/?uid=${user.id}`);
      
      if (ownerRes.status === 404 || !ownerRes.ok) {
        // Try getting all owners and filter by uid
        const allOwnersRes = await fetch(`http://localhost:8000/owner/`);
        if (!allOwnersRes.ok) {
          toast.error('Tu usuario no está registrado como propietario. Contacta al administrador.');
          console.log('Usuario no encontrado como owner:', user.id);
          return;
        }
        const allOwners = await allOwnersRes.json();
        ownerData = allOwners.find((o: any) => o.uid === user.id);
        
        if (!ownerData) {
          toast.error('Tu usuario no está registrado como propietario. Contacta al administrador.');
          console.log('Usuario no encontrado como owner:', user.id);
          return;
        }
      } else {
        const result = await ownerRes.json();
        // If it's an array, find the matching uid; otherwise use directly
        if (Array.isArray(result)) {
          ownerData = result.find((o: any) => o.uid === user.id);
          if (!ownerData) {
            toast.error('Tu usuario no está registrado como propietario. Contacta al administrador.');
            console.log('Usuario no encontrado en array de owners:', user.id);
            return;
          }
        } else {
          ownerData = result;
        }
      }

      // Get horses by owner
      const horsesRes = await fetch(`http://localhost:8000/horses/by_owner/${ownerData.idOwner}`);
      if (!horsesRes.ok) throw new Error('Error al obtener caballos');
      const horsesData = await horsesRes.json();
      setHorses(horsesData);
      
      if (horsesData.length > 0) {
        const firstHorse = horsesData[0];
        setSelectedHorse(firstHorse);

        // Get nutritional plan
        try {
          const planRes = await fetch(`http://localhost:8000/nutritional_plan_horses/by_horse/${firstHorse.idHorse}`);
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
          const controlRes = await fetch(`http://localhost:8000/total_control/by_horse/${firstHorse.idHorse}`);
          if (controlRes.ok) {
            const controlsData = await controlRes.json();
            if (controlsData && controlsData.length > 0) {
              setControlData(controlsData[0]);
            }
          }
        } catch (error) {
          console.error('Error fetching control data:', error);
        }
      }
      
    } catch (error: any) {
      console.error('Error fetching horse data:', error);
      toast.error('Error al cargar datos del caballo');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 md:p-6 lg:p-8 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  if (!selectedHorse) {
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
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      {/* Header */}
      <UserHeader title="Mi Caballo" />

      <div className="max-w-4xl mx-auto space-y-5">
        {/* Horse Selector if multiple horses */}
        {horses.length > 1 && (
          <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50 backdrop-blur-sm p-4">
            <select 
              className="w-full p-2 rounded-md bg-slate-700 text-white border border-slate-600"
              value={selectedHorse.idHorse}
              onChange={(e) => {
                const horse = horses.find(h => h.idHorse === Number(e.target.value));
                if (horse) setSelectedHorse(horse);
              }}
            >
              {horses.map(horse => (
                <option key={horse.idHorse} value={horse.idHorse}>{horse.horseName}</option>
              ))}
            </select>
          </Card>
        )}

        {/* Main Info Card */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-slate-700/50 backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl" />
          <div className="relative p-6 md:p-8">
            <div className="flex items-start justify-between mb-6">
              <h2 className="text-xl md:text-2xl text-cyan-400">{selectedHorse.horseName}</h2>
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
                <p className="text-xs text-slate-500 mb-1">Edad</p>
                <p className="text-white">{selectedHorse.age} años</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Género</p>
                <p className="text-white">{selectedHorse.gender || 'No especificado'}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
          {/* Plan Nutricional */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50 backdrop-blur-sm hover:border-cyan-500/30 transition-all">
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
                <span className="text-sm text-slate-300">ID del Caballo</span>
                <span className="text-sm text-cyan-400">#{selectedHorse.idHorse}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-3 rounded-lg bg-slate-800/50">
                <span className="text-sm text-slate-300">Box actual</span>
                <span className="text-sm text-white">{controlData?.box ? `Box #${controlData.box}` : 'No asignado'}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
