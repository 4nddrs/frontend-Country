import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import { Edit, Trash2, Loader, ChevronUp, ChevronDown } from 'lucide-react';
import { AddButton, AdminSection, SaveButton, CancelButton } from '../../components/ui/admin-buttons';
import { confirmDialog } from '../../utils/confirmDialog';

const API_URL = 'https://api.countryclub.doc-ia.cloud/nutritional-plan-details/';

interface NutritionalPlanDetail {
  idDetail?: number;
  consumptionKlg: number;
  daysConsumptionMonth: number;
  totalConsumption: number;
  period: string;
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
  const [editingData, setEditingData] = useState<NutritionalPlanDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [foods, setFoods] = useState<any[]>([]);
  const [nutritionalPlans, setNutritionalPlans] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const isEditModalOpen = editingId !== null && editingData !== null;

  useEffect(() => {
    if (!isEditModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') handleCancelEdit(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isEditModalOpen]);

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
      const data: NutritionalPlanDetail[] = await res.json();
      setDetails(data.sort((a, b) => (b.idDetail ?? 0) - (a.idDetail ?? 0)));
    } catch {
      toast.error('No se pudo cargar detalles.');
    } finally {
      setLoading(false);
    }
  };

  const fetchFoods = async () => {
    try {
      const res = await fetch("https://api.countryclub.doc-ia.cloud/food-stock/");
      if (!res.ok) throw new Error("Error al obtener comidas");
      const data = await res.json();
      setFoods(data);
    } catch {
      // Silenciar error de carga
    }
  };

  const fetchNutritionalPlans = async () => {
    try {
      const res = await fetch("https://api.countryclub.doc-ia.cloud/nutritional-plans/");
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
      const payload = { ...newDetail, period: newDetail.period ? `${newDetail.period}-01` : '' };
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Error al crear detalle');
      toast.success('Detalle creado!');
      setNewDetail({ consumptionKlg: 0, daysConsumptionMonth: 0, totalConsumption: 0, period: '', fk_idFood: 1, fk_idNutritionalPlan: 1 });
      fetchDetails();
    } catch {
      toast.error('No se pudo crear detalle.');
    }
  };

  const updateDetail = async (id: number) => {
    if (!editingData) return;
    const payload = {
      ...editingData,
      totalConsumption: editingData.consumptionKlg * editingData.daysConsumptionMonth,
      period: editingData.period ? `${editingData.period}-01` : '',
    };
    try {
      const res = await fetch(`${API_URL}${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Error al actualizar detalle');
      toast.success('Detalle actualizado!');
      setEditingId(null);
      setEditingData(null);
      fetchDetails();
    } catch {
      toast.error('No se pudo actualizar detalle.');
    }
  };

  const deleteDetail = async (id: number) => {
    const confirmed = await confirmDialog({
      title: '¿Eliminar detalle?',
      description: 'Esta acción eliminará el detalle del plan nutricional permanentemente.',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
    });
    if (!confirmed) return;
    try {
      const res = await fetch(`${API_URL}${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar detalle');
      toast.success('Detalle eliminado!');
      fetchDetails();
    } catch {
      toast.error('No se pudo eliminar detalle.');
    }
  };

  const handleEditClick = (detail: NutritionalPlanDetail) => {
    setEditingId(detail.idDetail!);
    setEditingData({
      ...detail,
      period: detail.period?.slice(0, 7) || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingData(null);
  };

  return (
    <div className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
      <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">Gestión de Detalles del Plan Nutricional</h1>

      <AdminSection>
        <h2 className="text-xl font-semibold mb-4 text-[#bdab62]">Agregar Nuevo Detalle</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block mb-1">Consumo (Kg)</label>
            <input
              type="number"
              name="consumptionKlg"
              value={newDetail.consumptionKlg === 0 ? '' : newDetail.consumptionKlg}
              onChange={e => {
                const consumptionKlg = e.target.value === '' ? 0 : Number(e.target.value);
                setNewDetail(prev => ({ ...prev, consumptionKlg, totalConsumption: consumptionKlg * prev.daysConsumptionMonth }));
              }}
              className="w-full"
            />
          </div>
          <div>
            <label className="block mb-1">Días de Consumo al Mes</label>
            <input
              type="number"
              name="daysConsumptionMonth"
              value={newDetail.daysConsumptionMonth === 0 ? '' : newDetail.daysConsumptionMonth}
              onChange={e => {
                const daysConsumptionMonth = e.target.value === '' ? 0 : Number(e.target.value);
                setNewDetail(prev => ({ ...prev, daysConsumptionMonth, totalConsumption: prev.consumptionKlg * daysConsumptionMonth }));
              }}
              className="w-full"
            />
          </div>
          <div>
            <label className="block mb-1 text-slate-400">Total de Consumo <span className="text-xs text-slate-500">(calculado)</span></label>
            <div className="w-full px-3 py-2 rounded-md border border-slate-700/60 bg-slate-800/50 text-slate-300 font-semibold flex items-center justify-between">
              <span>{newDetail.totalConsumption > 0 ? newDetail.totalConsumption.toFixed(2) : '—'}</span>
              <span className="text-xs text-slate-500">kg</span>
            </div>
          </div>
          <div>
            <label className="block mb-1">Periodo</label>
            <input
              type="month"
              name="period"
              value={newDetail.period}
              onChange={e => setNewDetail({ ...newDetail, period: e.target.value })}
              className="w-full"
            />
          </div>
          <div>
            <label className="block mb-1">Comida</label>
            <select
              name="fk_idFood"
              value={newDetail.fk_idFood}
              onChange={e => setNewDetail({ ...newDetail, fk_idFood: Number(e.target.value) })}
              className="w-full"
            >
              <option value="">— Selecciona una comida —</option>
              {foods.map(food => (
                <option key={food.idFood} value={food.idFood}>{food.foodName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1">Plan Nutricional</label>
            <select
              name="fk_idNutritionalPlan"
              value={newDetail.fk_idNutritionalPlan}
              onChange={e => setNewDetail({ ...newDetail, fk_idNutritionalPlan: Number(e.target.value) })}
              className="w-full"
            >
              <option value="">— Selecciona un plan —</option>
              {nutritionalPlans.map(plan => (
                <option key={plan.idNutritionalPlan} value={plan.idNutritionalPlan}>{plan.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-7 text-right">
          <AddButton onClick={createDetail} />
        </div>
      </AdminSection>

      <AdminSection>
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
                  <div className="flex flex-col items-center gap-2 py-5">
                    <span className="h-4 w-4 rounded-full bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.6)]" />
                    <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Detalle</span>
                  </div>

                  <div className="px-6 pb-6 space-y-4 text-sm text-slate-200">
                    <div className="text-center space-y-1">
                      <h3 className="text-lg font-semibold text-cyan-300">
                        {foodNameMap[detail.fk_idFood] ?? `Comida #${detail.fk_idFood}`}
                      </h3>
                      <p className="text-slate-400">
                        Plan: <span className="font-medium text-slate-200">{planNameMap[detail.fk_idNutritionalPlan] ?? `Plan #${detail.fk_idNutritionalPlan}`}</span>
                      </p>
                    </div>

                    <button
                      onClick={() => setExpanded(prev => ({ ...prev, [detail.idDetail ?? 0]: !prev[detail.idDetail ?? 0] }))}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/15"
                    >
                      {isExpanded ? <><ChevronUp size={16} /> Ver menos</> : <><ChevronDown size={16} /> Ver más</>}
                    </button>

                    {isExpanded && (
                      <div className="rounded-xl border border-slate-800/80 bg-slate-900/70 p-4 text-xs leading-relaxed">
                        <ul className="space-y-1">
                          <li><strong>Consumo (Kg):</strong> {detail.consumptionKlg}</li>
                          <li><strong>Días/mes:</strong> {detail.daysConsumptionMonth}</li>
                          <li><strong>Total consumo:</strong> {detail.totalConsumption}</li>
                          <li><strong>Periodo:</strong> {detail.period?.slice(0, 7)}</li>
                        </ul>
                      </div>
                    )}

                    <div className="flex items-center justify-center gap-6 border-t border-slate-800 pt-6 pb-2">
                      <button
                        onClick={() => handleEditClick(detail)}
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
                </div>
              );
            })}
          </div>
        )}

        {isEditModalOpen && createPortal(
          <div
            className="fixed inset-0 lg:left-80 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={handleCancelEdit}
          >
            <div
              className="w-full max-w-2xl max-h-[95vh] overflow-y-auto rounded-2xl border border-[#167C79]/60 bg-[#0f172a] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.6)]"
              onClick={e => e.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-[#F8F4E3]">Editar Detalle del Plan</h3>
                  <p className="text-sm text-slate-400">Actualiza los datos.</p>
                </div>
                <button onClick={handleCancelEdit} className="rounded-lg border border-slate-500 px-3 py-1.5 text-slate-300 hover:bg-slate-800">
                  Cerrar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium">Consumo (Kg)</label>
                  <input
                    type="number"
                    value={editingData!.consumptionKlg}
                    onChange={e => {
                      const consumptionKlg = Number(e.target.value);
                      setEditingData(prev => prev ? ({ ...prev, consumptionKlg, totalConsumption: consumptionKlg * prev.daysConsumptionMonth }) : null);
                    }}
                    className="w-full p-2 rounded-md bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Días de Consumo al Mes</label>
                  <input
                    type="number"
                    value={editingData!.daysConsumptionMonth}
                    onChange={e => {
                      const daysConsumptionMonth = Number(e.target.value);
                      setEditingData(prev => prev ? ({ ...prev, daysConsumptionMonth, totalConsumption: prev.consumptionKlg * daysConsumptionMonth }) : null);
                    }}
                    className="w-full p-2 rounded-md bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-slate-400">Total Consumo <span className="text-xs">(calculado)</span></label>
                  <div className="w-full px-3 py-2 rounded-md border border-slate-700/60 bg-slate-800/50 text-slate-300 font-semibold flex items-center justify-between">
                    <span>{editingData!.totalConsumption.toFixed(2)}</span>
                    <span className="text-xs text-slate-500">kg</span>
                  </div>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Periodo</label>
                  <input
                    type="month"
                    value={editingData!.period}
                    onChange={e => setEditingData({ ...editingData!, period: e.target.value })}
                    className="w-full p-2 rounded-md bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Comida</label>
                  <select
                    value={editingData!.fk_idFood}
                    onChange={e => setEditingData({ ...editingData!, fk_idFood: Number(e.target.value) })}
                    className="w-full p-2 rounded-md bg-gray-700"
                  >
                    {foods.map(food => (
                      <option key={food.idFood} value={food.idFood}>{food.foodName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Plan Nutricional</label>
                  <select
                    value={editingData!.fk_idNutritionalPlan}
                    onChange={e => setEditingData({ ...editingData!, fk_idNutritionalPlan: Number(e.target.value) })}
                    className="w-full p-2 rounded-md bg-gray-700"
                  >
                    {nutritionalPlans.map(plan => (
                      <option key={plan.idNutritionalPlan} value={plan.idNutritionalPlan}>{plan.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-700 pt-4">
                <CancelButton onClick={handleCancelEdit} />
                <SaveButton onClick={() => updateDetail(editingId!)} children="Guardar cambios" />
              </div>
            </div>
          </div>,
          document.body
        )}
      </AdminSection>
    </div>
  );
};

export default NutritionalPlanDetailsManagement;
