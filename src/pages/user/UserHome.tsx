import { useState, useEffect } from 'react';
import { Flag, Video, DollarSign, Newspaper, ChevronRight, Loader } from 'lucide-react';
import { Card } from '../../components/ui/card';
import UserHeader from '../../components/UserHeader';
import { supabase } from '../../supabaseClient';
import { toast } from 'react-hot-toast';

interface HomeProps {
  setCurrentView: (view: 'home' | 'UserHorses' | 'UserCamera' | 'UserPayments' | 'UserProfile') => void;
}

interface Horse {
  idHorse: number;
  horseName: string;
  age: number;
  race: { nameRace: string };
}

export function UserHome({ setCurrentView }: HomeProps) {
  const [horses, setHorses] = useState<Horse[]>([]);
  const [loading, setLoading] = useState(true);
  const [ownerName, setOwnerName] = useState('');

  useEffect(() => {
    fetchOwnerData();
  }, []);

  const fetchOwnerData = async () => {
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
      setOwnerName(ownerData.ownerName || ownerData.name || 'Usuario');

      // Get horses by owner
      const horsesRes = await fetch(`http://localhost:8000/horses/by_owner/${ownerData.idOwner}`);
      if (!horsesRes.ok) throw new Error('Error al obtener caballos');
      const horsesData = await horsesRes.json();
      setHorses(horsesData);
      
    } catch (error: any) {
      console.error('Error fetching owner data:', error);
      toast.error('Error al cargar datos');
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

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <UserHeader title={`Bienvenido${ownerName ? ', ' + ownerName : ''}`} />

      {/* Widgets Grid */}
      <div className="max-w-6xl mx-auto grid gap-5">
        {/* My Horses */}
        {horses.length > 0 ? (
          horses.map((horse) => (
            <Card 
              key={horse.idHorse}
              className="group relative overflow-hidden bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50 backdrop-blur-sm hover:border-cyan-500/50 transition-all duration-300 cursor-pointer"
              onClick={() => setCurrentView('UserHorses')}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-cyan-500/0 group-hover:from-cyan-500/5 group-hover:to-transparent transition-all duration-300" />
              <div className="relative p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                    <Flag className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg text-white mb-1">{horse.horseName}</h3>
                    <p className="text-sm text-slate-400">{horse.race?.nameRace || 'Sin raza'} · {horse.age} años</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
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

        {/* Cámara Activa Widget */}
        <Card 
          className="group relative overflow-hidden bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50 backdrop-blur-sm hover:border-cyan-500/50 transition-all duration-300 cursor-pointer"
          onClick={() => setCurrentView('UserCamera')}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-cyan-500/0 group-hover:from-cyan-500/5 group-hover:to-transparent transition-all duration-300" />
          <div className="relative p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Video className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg text-white mb-1">Cámara activa</h3>
                <p className="text-sm text-slate-400">Monitoreo en tiempo real</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </Card>

        {/* Estado Financiero Widget */}
        <Card 
          className="group relative overflow-hidden bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50 backdrop-blur-sm hover:border-cyan-500/50 transition-all duration-300 cursor-pointer"
          onClick={() => setCurrentView('UserPayments')}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-cyan-500/0 group-hover:from-cyan-500/5 group-hover:to-transparent transition-all duration-300" />
          <div className="relative p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg text-white mb-1">Estado financiero</h3>
                <p className="text-sm text-slate-400">Ver historial de pagos</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
          </div>
        </Card>

        {/* Noticias del Club Widget */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50 backdrop-blur-sm">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Newspaper className="w-6 h-6" />
              </div>
              <h3 className="text-xl text-cyan-400">Noticias del Club</h3>
            </div>
            
            <div className="space-y-4">
              <div className="group flex gap-3 p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800/70 transition-colors cursor-pointer">
                <span className="text-xl mt-0.5">🏆</span>
                <p className="text-sm text-slate-300">Nuevo torneo ecuestre el 20 de octubre.</p>
              </div>
              
              <div className="group flex gap-3 p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800/70 transition-colors cursor-pointer">
                <span className="text-xl mt-0.5">🌱</span>
                <p className="text-sm text-slate-300">Se renovaron las áreas verdes del establo principal.</p>
              </div>
              
              <div className="group flex gap-3 p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800/70 transition-colors cursor-pointer">
                <span className="text-xl mt-0.5">💧</span>
                <p className="text-sm text-slate-300">Mantenimiento del sistema de agua el próximo fin de semana.</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
