import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, AlertTriangle, ChevronRight, ClipboardList, Clock3, Loader, ShieldCheck, Syringe } from 'lucide-react';
import { Card } from '../../components/ui/card';

type Horse = {
  idHorse: number;
  horseName: string;
  state?: string;
};

type Medicine = {
  idMedicine?: number;
  name?: string;
  stock?: number | null;
  minStock?: number | null;
  stockStatus?: string;
  isActive?: boolean;
};

type AttentionHorse = {
  idAttentionHorse: number;
  date: string;
  description?: string;
  cost?: number;
  fk_idHorse?: number;
};

type RecentAttentionView = AttentionHorse & { horseName: string };

const API_BASE = 'https://api.countryclub.doc-ia.cloud';

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('es-BO', { day: '2-digit', month: 'short' });

const VeterinarioHome = () => {
  const [horses, setHorses] = useState<Horse[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [attentions, setAttentions] = useState<AttentionHorse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        const [horsesRes, medicinesRes, attentionsRes] = await Promise.all([
          fetch(`${API_BASE}/horses/`),
          fetch(`${API_BASE}/medicines/`),
          fetch(`${API_BASE}/attention_horses/`),
        ]);

        const horsesData = horsesRes.ok ? await horsesRes.json() : [];
        const medicinesData = medicinesRes.ok ? await medicinesRes.json() : [];
        const attentionsData = attentionsRes.ok ? await attentionsRes.json() : [];

        if (!cancelled) {
          setHorses(Array.isArray(horsesData) ? horsesData : []);
          setMedicines(Array.isArray(medicinesData) ? medicinesData : []);
          setAttentions(Array.isArray(attentionsData) ? attentionsData : []);
        }
      } catch (error) {
        console.error('Error loading veterinarian home data:', error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  const activeHorses = useMemo(
    () => horses.filter((horse) => (horse.state || '').toLowerCase().includes('activ')).length,
    [horses],
  );

  const lowStockMedicines = useMemo(
    () =>
      medicines.filter((medicine) => {
        if (medicine.stock === null || medicine.stock === undefined) return false;
        if (medicine.minStock === null || medicine.minStock === undefined) return false;
        return Number(medicine.stock) <= Number(medicine.minStock);
      }).length,
    [medicines],
  );

  const lastSevenDaysAttentions = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    return attentions.filter((attention) => new Date(attention.date) >= sevenDaysAgo).length;
  }, [attentions]);

  const recentAttentions: RecentAttentionView[] = useMemo(() => {
    const horseMap = new Map(horses.map((horse) => [horse.idHorse, horse.horseName]));
    return attentions
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map((attention) => ({
        ...attention,
        horseName: horseMap.get(attention.fk_idHorse ?? -1) ?? 'Desconocido',
      }));
  }, [attentions, horses]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-slate-400">Cargando panel veterinario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="bg-white/0 backdrop-blur-lg p-4 md:p-6 rounded-2xl m-4 md:m-6 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
        <div className="max-w-7xl mx-auto space-y-6">
          <Card className="relative overflow-hidden border-slate-700/50 bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-800/80 shadow-[0_18px_50px_rgba(0,0,0,0.45)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.16),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.12),transparent_35%)]" />
            <div className="relative p-5 md:p-7 lg:p-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/80 mb-2">Rol Veterinario</p>
                  <h1 className="text-3xl md:text-4xl font-semibold text-[#bdab62] leading-tight">Panel sanitario</h1>
                  <p className="text-sm text-slate-400 mt-2 max-w-2xl">
                    Acceso rápido a medicamentos, plan sanitario, procedimientos y seguimiento de atenciones.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300 w-fit">
                  <ShieldCheck className="h-4 w-4" />
                  Veterinario activo
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400 mb-2">Caballos supervisados</p>
                  <p className="text-3xl font-semibold text-white">{horses.length}</p>
                  <p className="text-sm text-cyan-300 mt-1">{activeHorses} activos</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400 mb-2">Atenciones recientes</p>
                  <p className="text-3xl font-semibold text-white">{lastSevenDaysAttentions}</p>
                  <p className="text-sm text-slate-300 mt-1">Últimos 7 días</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400 mb-2">Medicamentos</p>
                  <p className="text-3xl font-semibold text-white">{medicines.length}</p>
                  <p className="text-sm text-slate-300 mt-1">Inventario registrado</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400 mb-2">Stock bajo</p>
                  <p className="text-3xl font-semibold text-white">{lowStockMedicines}</p>
                  <p className="text-sm text-amber-300 mt-1">Requieren revisión</p>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid xl:grid-cols-[1.3fr_1fr] gap-6">
            <Card className="border-slate-700/50 bg-gradient-to-br from-slate-900/90 to-slate-900/60 shadow-[0_12px_36px_rgba(0,0,0,0.35)]">
              <div className="p-5 md:p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                      <Activity className="h-5 w-5 text-cyan-300" />
                      Accesos rápidos
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">Todo lo que usa el veterinario está aquí, sin bloques ocultos.</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Medicamentos', description: 'Inventario y control', href: '/medicines', icon: Syringe, tone: 'from-cyan-500/20 to-cyan-600/10' },
                    { label: 'Plan Sanitario', description: 'Gestión de vacunas', href: '/VaccinationPlan', icon: ClipboardList, tone: 'from-violet-500/20 to-violet-600/10' },
                    { label: 'Procedimientos programados', description: 'Agenda sanitaria', href: '/scheduled-procedures', icon: Clock3, tone: 'from-amber-500/20 to-amber-600/10' },
                    { label: 'Ejecución de procedimientos', description: 'Aplicación y seguimiento', href: '/application-procedures', icon: AlertTriangle, tone: 'from-emerald-500/20 to-emerald-600/10' },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        className={`group rounded-2xl border border-white/8 bg-gradient-to-br ${item.tone} p-4 transition-all hover:border-cyan-400/30 hover:shadow-[0_0_24px_rgba(34,211,238,0.12)]`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-2">
                            <div className="h-11 w-11 rounded-xl bg-white/8 flex items-center justify-center border border-white/10">
                              <Icon className="h-5 w-5 text-cyan-200" />
                            </div>
                            <div>
                              <p className="text-white font-semibold">{item.label}</p>
                              <p className="text-sm text-slate-300 mt-1">{item.description}</p>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-cyan-300 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </Card>

            <Card className="border-slate-700/50 bg-gradient-to-br from-slate-900/90 to-slate-900/60 shadow-[0_12px_36px_rgba(0,0,0,0.35)]">
              <div className="p-5 md:p-6">
                <h2 className="text-xl font-semibold text-white mb-5">Atenciones recientes</h2>
                {recentAttentions.length === 0 ? (
                  <div className="rounded-2xl border border-white/8 bg-white/5 p-4 text-slate-400">
                    No hay atenciones registradas recientemente.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentAttentions.map((attention) => (
                      <div key={attention.idAttentionHorse} className="rounded-2xl border border-white/8 bg-white/5 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-white font-semibold">{attention.horseName}</p>
                            <p className="text-sm text-slate-400 mt-1">{attention.description || 'Sin descripción'}</p>
                            <p className="text-xs text-slate-500 mt-2">{formatDate(attention.date)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Costo</p>
                            <p className="text-sm font-semibold text-emerald-300">Bs {Number(attention.cost || 0).toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VeterinarioHome;