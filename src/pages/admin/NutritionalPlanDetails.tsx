import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Save, Trash2, Loader, X, ChevronUp, ChevronDown } from 'lucide-react';

const API_URL = 'http://localhost:8000/nutritional-plan-details/';

interface NutritionalPlanDetail {
  idDetail?: number;
  consumptionKlg: number;
  daysConsumptionMonth: number;
  totalConsumption: number;
  period: string; // ISO date string (YYYY-MM-DD)
  fk_idFood: number;
  fk_idNutritionalPlan: number;
}

const NutritionalPlanDetailsManagement = () => {
  const [details, setDetails] = useState<NutritionalPlanDetail[]>([]);
  const [newDetail, setNewDetail] = useState<NutritionalPlanDetail>({
    consumptionKlg: 0,
    daysConsumptionMonth: 0,
    totalConsumption: 0,
    period: '',
    fk_idFood: 1,
    fk_idNutritionalPlan: 1,
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [foods, setFoods] = useState<any[]>([]);
  const [nutritionalPlans, setNutritionalPlans] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const foodNameMap = useMemo(() => {
    return foods.reduce<Record<number, string>>((acc, food) => {
      if (food?.idFood !== undefined) {
        acc[food.idFood] = food.foodName ?? `Comida #${food.idFood}`;
      }
      return acc;
    }, {});
  }, [foods]);

  const planNameMap = useMemo(() => {
    return nutritionalPlans.reduce<Record<number, string>>((acc, plan) => {
      if (plan?.idNutritionalPlan !== undefined) {
        acc[plan.idNutritionalPlan] = plan.name ?? `Plan #${plan.idNutritionalPlan}`;
      }
      return acc;
    }, {});
  }, [nutritionalPlans]);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al obtener detalles');
      const data = await res.json();
      setDetails(data);
    } catch {
      toast.error('No se pudo cargar detalles.');
    } finally {
      setLoading(false);
    }
  };

  const fetchFoods = async () => {
    try {
      const res = await fetch("http://localhost:8000/food-stock/");
      if (!res.ok) throw new Error("Error al obtener comidas");
      const data = await res.json();
      setFoods(data);
    } catch {
      // Silenciar error de carga
    }
  };

  const fetchNutritionalPlans = async () => {
    try {
      const res = await fetch("http://localhost:8000/nutritional-plans/");
      if (!res.ok) throw new Error("Error al obtener planes nutricionales");
      const data = await res.json();
      setNutritionalPlans(data);
    } catch {
      // Silenciar error de carga
    }
  };

  useEffect(() => {
    fetchDetails();
    fetchFoods();
    fetchNutritionalPlans();
  }, []);

  const createDetail = async () => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDetail),
      });
      if (!res.ok) throw new Error('Error al crear detalle');
      toast.success('Detalle creado!');
      setNewDetail({
        consumptionKlg: 0,
        daysConsumptionMonth: 0,
        totalConsumption: 0,
        period: '',
        fk_idFood: 1,
        fk_idNutritionalPlan: 1,
      });
      fetchDetails();
    } catch {
      toast.error('No se pudo crear detalle.');
    }
  };

  const updateDetail = async (id: number, updatedDetail: NutritionalPlanDetail) => {
    try {
      const res = await fetch(`${API_URL}${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedDetail),
      });
      if (!res.ok) throw new Error('Error al actualizar detalle');
      toast.success('Detalle actualizado!');
      setEditingId(null);
      fetchDetails();
    } catch {
      toast.error('No se pudo actualizar detalle.');
    }
  };

  const deleteDetail = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar detalle');
      toast.success('Detalle eliminado!');
      fetchDetails();
    } catch {
      toast.error('No se pudo eliminar detalle.');
    }
  };

  return (
   <div  className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
      <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">Gestión de Detalles del Plan Nutricional</h1>
      
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.5)] text-[#F8F4E3]">
        <h2 className="text-xl font-semibold mb-4 text-teal-400">Agregar Nuevo Detalle</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

      <div>
        <label className="block mb-1">Consumo (Kg)</label>
        <input
          type="number"
          name="consumptionKlg"
          value={newDetail.consumptionKlg}
          onChange={e => setNewDetail({ ...newDetail, consumptionKlg: Number(e.target.value) })}
          className="w-full p-2 rounded-md bg-gray-700 text-white"
        />
      </div>

      <div>
        <label className="block mb-1">Días de Consumo al Mes</label>
        <input
          type="number"
          name="daysConsumptionMonth"
          value={newDetail.daysConsumptionMonth}
          onChange={e => setNewDetail({ ...newDetail, daysConsumptionMonth: Number(e.target.value) })}
          className="w-full p-2 rounded-md bg-gray-700 text-white"
        />
      </div>

      <div>
        <label className="block mb-1">Total de Consumo</label>
        <input
          type="number"
          name="totalConsumption"
          value={newDetail.totalConsumption}
          onChange={e => setNewDetail({ ...newDetail, totalConsumption: Number(e.target.value) })}
          className="w-full p-2 rounded-md bg-gray-700 text-white"
        />
      </div>

      <div>
        <label className="block mb-1">Periodo</label>
        <input
          type="date"
          name="period"
          value={newDetail.period}
          onChange={e => setNewDetail({ ...newDetail, period: e.target.value })}
          className="w-full p-2 rounded-md bg-gray-700 text-white"
        />
      </div>

      <div>
        <label className="block mb-1">Comida</label>
        <select
          name="fk_idFood"
          value={newDetail.fk_idFood}
          onChange={e => setNewDetail({ ...newDetail, fk_idFood: Number(e.target.value) })}
          className="w-full p-2 rounded-md bg-gray-700 text-white"
        >
          <option value="">-- Selecciona una comida --</option>
          {foods.map(food => (
            <option key={food.idFood} value={food.idFood}>
              {food.foodName}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block mb-1">Plan Nutricional</label>
        <select
          name="fk_idNutritionalPlan"
          value={newDetail.fk_idNutritionalPlan}
          onChange={e => setNewDetail({ ...newDetail, fk_idNutritionalPlan: Number(e.target.value) })}
          className="w-full p-2 rounded-md bg-gray-700 text-white"
        >
          <option value="">-- Selecciona un plan nutricional --</option>
          {nutritionalPlans.map(plan => (
            <option key={plan.idNutritionalPlan} value={plan.idNutritionalPlan}>
              {plan.name}
            </option>
          ))}
        </select>
      </div>

    </div>

    <div className="mt-4 text-right">
      <button
        onClick={createDetail}
        className="bg-green-600 hover:bg-green-700 text-white p-2 px-4 rounded-md font-semibold flex items-center gap-2 inline-flex"
      >
        <Plus size={20} /> Agregar
      </button>
    </div>
  </div>
     
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.5)] text-[#F8F4E3]">
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            <Loader size={24} className="animate-spin" />Cargando detalles...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {details.map(detail => {
              const isExpanded = expanded[detail.idDetail ?? 0] ?? false;
              return (
                <div 
                  key={detail.idDetail}
                  className="rounded-2xl border border-slate-800/60 bg-gradient-to-br from-cyan-500/10 via-slate-900/60 to-slate-900/90 shadow-lg shadow-black/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-cyan-500/20"
                >
                  {editingId === detail.idDetail ? (
                    <div className="p-6">
                      <input
                        type="number"
                        defaultValue={detail.consumptionKlg}
                        onChange={e => setNewDetail({ ...newDetail, consumptionKlg: Number(e.target.value) })}
                        className="w-full p-2 rounded-md bg-gray-600 text-white mb-2"
                      />
                      <input
                        type="number"
                        defaultValue={detail.daysConsumptionMonth}
                        onChange={e => setNewDetail({ ...newDetail, daysConsumptionMonth: Number(e.target.value) })}
                        className="w-full p-2 rounded-md bg-gray-600 text-white mb-2"
                      />
                      <input
                        type="number"
                        defaultValue={detail.totalConsumption}
                        onChange={e => setNewDetail({ ...newDetail, totalConsumption: Number(e.target.value) })}
                        className="w-full p-2 rounded-md bg-gray-600 text-white mb-2"
                      />
                      <input
                        type="date"
                        defaultValue={detail.period?.slice(0, 10)}
                        onChange={e => setNewDetail({ ...newDetail, period: e.target.value })}
                        className="w-full p-2 rounded-md bg-gray-600 text-white mb-2"
                      />
                      <select
                        value={newDetail.fk_idFood}
                        onChange={e => setNewDetail({ ...newDetail, fk_idFood: Number(e.target.value) })}
                        className="w-full p-2 rounded-md bg-gray-600 text-white mb-2"
                      >
                        {foods.map(food => (
                          <option key={food.idFood} value={food.idFood}>
                            {food.foodName}
                          </option>
                        ))}
                      </select>
                      <select
                        value={newDetail.fk_idNutritionalPlan}
                        onChange={e => setNewDetail({ ...newDetail, fk_idNutritionalPlan: Number(e.target.value) })}
                        className="w-full p-2 rounded-md bg-gray-600 text-white mb-2"
                      >
                        {nutritionalPlans.map(plan => (
                          <option key={plan.idNutritionalPlan} value={plan.idNutritionalPlan}>
                            {plan.name}
                          </option>
                        ))}
                      </select>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => updateDetail(detail.idDetail!, {
                            consumptionKlg: newDetail.consumptionKlg || detail.consumptionKlg,
                            daysConsumptionMonth: newDetail.daysConsumptionMonth || detail.daysConsumptionMonth,
                            totalConsumption: newDetail.totalConsumption || detail.totalConsumption,
                            period: newDetail.period || detail.period,
                            fk_idFood: newDetail.fk_idFood || detail.fk_idFood,
                            fk_idNutritionalPlan: newDetail.fk_idNutritionalPlan || detail.fk_idNutritionalPlan,
                          })}
                          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md flex items-center gap-1"
                        >
                          <Save size={16} /> Guardar
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded-md flex items-center gap-1"
                        >
                          <X size={16} /> Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col items-center gap-2 py-5">
                        <span className="h-4 w-4 rounded-full bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.6)]" />
                        <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
                          Detalle
                        </span>
                      </div>

                      <div className="px-6 pb-6 space-y-4 text-sm text-slate-200">
                        <div className="text-center space-y-1">
                          <h3 className="text-lg font-semibold text-cyan-300">
                            {(foodNameMap[detail.fk_idFood] ?? `Comida #${detail.fk_idFood}`)}
                          </h3>
                          <p className="text-slate-400">
                            Plan: <span className="font-medium text-slate-200">{(planNameMap[detail.fk_idNutritionalPlan] ?? `Plan #${detail.fk_idNutritionalPlan}`)}</span>
                          </p>
                        </div>

                        <button
                          onClick={() =>
                            setExpanded((prev) => ({
                              ...prev,
                              [detail.idDetail ?? 0]: !prev[detail.idDetail ?? 0],
                            }))
                          }
                          className="flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/15"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp size={16} /> Ver menos
                            </>
                          ) : (
                            <>
                              <ChevronDown size={16} /> Ver más
                            </>
                          )}
                        </button>

                        {isExpanded && (
                          <div className="rounded-xl border border-slate-800/80 bg-slate-900/70 p-4 text-xs leading-relaxed">
                            <ul className="space-y-1">
                              <li><strong>Consumo (Kg):</strong> {detail.consumptionKlg}</li>
                              <li><strong>Días/mes:</strong> {detail.daysConsumptionMonth}</li>
                              <li><strong>Total consumo:</strong> {detail.totalConsumption}</li>
                              <li><strong>Periodo:</strong> {detail.period?.slice(0, 10)}</li>
                            </ul>
                          </div>
                        )}

                        <div className="flex items-center justify-center gap-6 border-t border-slate-800 pt-6 pb-2">
                          <button
                            onClick={() => { setEditingId(detail.idDetail!); setNewDetail(detail); }}
                            className="relative flex items-center justify-center w-15 h-15 rounded-[20px]
                                        bg-gradient-to-b from-[#1A1C1E] to-[#0E0F10]
                                        shadow-[8px_8px_16px_rgba(0,0,0,0.85),-5px_-5px_12px_rgba(255,255,255,0.06)]
                                        hover:scale-[1.1]
                                        active:shadow-[inset_5px_5px_12px_rgba(0,0,0,0.9),inset_-4px_-4px_10px_rgba(255,255,255,0.05)]
                                        transition-all duration-300 ease-in-out"
                          >
                            <Edit size={28} className="text-[#E8C967] drop-shadow-[0_0_10px_rgba(255,215,100,0.85)] transition-transform duration-300 hover:rotate-3" />
                          </button>
                          <button
                            onClick={() => deleteDetail(detail.idDetail!)}
                            className="relative flex items-center justify-center w-15 h-15 rounded-[20px]
                                      bg-gradient-to-b from-[#1A1C1E] to-[#0E0F10]
                                      shadow-[8px_8px_16px_rgba(0,0,0,0.85),-5px_-5px_12px_rgba(255,255,255,0.06)]
                                      hover:scale-[1.1]
                                      active:shadow-[inset_5px_5px_12px_rgba(0,0,0,0.9),inset_-4px_-4px_10px_rgba(255,255,255,0.05)]
                                      transition-all duration-300 ease-in-out"
                          >
                            <Trash2 size={28} className="text-[#E86B6B] drop-shadow-[0_0_12px_rgba(255,80,80,0.9)] transition-transform duration-300 hover:-rotate-3" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NutritionalPlanDetailsManagement;
