import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Save, Trash2, Loader, X } from 'lucide-react';

const API_URL = 'https://backend-country-nnxe.onrender.com/nutritional-plan-details/';

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
      const res = await fetch("https://backend-country-nnxe.onrender.com/food-stock/");
      if (!res.ok) throw new Error("Error al obtener comidas");
      const data = await res.json();
      setFoods(data);
    } catch {
      toast.error("No se pudieron cargar comidas");
    }
  };

  const fetchNutritionalPlans = async () => {
    try {
      const res = await fetch("https://backend-country-nnxe.onrender.com/nutritional-plans/");
      if (!res.ok) throw new Error("Error al obtener planes nutricionales");
      const data = await res.json();
      setNutritionalPlans(data);
    } catch {
      toast.error("No se pudieron cargar planes nutricionales");
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
    <div className="bg-slate-900 p-6 rounded-lg shadow-xl mb-8 border border-slate-700">
      
      <div className="flex items-center justify-center h-[15vh]">
        <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]
               filter drop-shadow-[0_0_10px_rgba(222,179,98,0.75)]
               drop-shadow-[0_0_26px_rgba(222,179,98,0.45)]
               drop-shadow-[0_0_30px_rgba(255,243,211,0.28)]">
          <span className="title-letter">G</span>
          <span className="title-letter">e</span>
          <span className="title-letter">s</span>
          <span className="title-letter">t</span>
          <span className="title-letter">i</span>
          <span className="title-letter">ó</span>
          <span className="title-letter">n</span>
          <span className="title-letter">&nbsp;</span>
          <span className="title-letter">d</span>
          <span className="title-letter">e</span>
          <span className="title-letter">&nbsp;</span>
          <span className="title-letter">D</span>
          <span className="title-letter">e</span>
          <span className="title-letter">t</span>
          <span className="title-letter">a</span>
          <span className="title-letter">l</span>
          <span className="title-letter">l</span>
          <span className="title-letter">e</span>
          <span className="title-letter">s</span>
          <span className="title-letter">&nbsp;</span>
          <span className="title-letter">d</span>
          <span className="title-letter">e</span>
          <span className="title-letter">l</span>
          <span className="title-letter">&nbsp;</span>
          <span className="title-letter">P</span>
          <span className="title-letter">l</span>
          <span className="title-letter">a</span>
          <span className="title-letter">n</span>
          <span className="title-letter">&nbsp;</span>
          <span className="title-letter">N</span>
          <span className="title-letter">u</span>
          <span className="title-letter">t</span>
          <span className="title-letter">r</span>
          <span className="title-letter">i</span>
          <span className="title-letter">c</span>
          <span className="title-letter">i</span>
          <span className="title-letter">o</span>
          <span className="title-letter">n</span>
          <span className="title-letter">a</span>
          <span className="title-letter">l</span>
        </h1>
      </div>
      <div className="bg-slate-800 p-6 rounded-lg shadow-xl mb-8 border border-slate-700">
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
     
      <div className="bg-slate-800 p-6 rounded-lg shadow-xl mb-8 border border-slate-700">
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            <Loader size={24} className="animate-spin" />Cargando detalles...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {details.map(detail => (
              <div key={detail.idDetail} className="bg-gray-700 p-4 rounded-md shadow-lg flex flex-col justify-between">
                {editingId === detail.idDetail ? (
                  <>
                    <input
                      type="number"
                      defaultValue={detail.consumptionKlg}
                      onChange={e => setNewDetail({ ...newDetail, consumptionKlg: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="number"
                      defaultValue={detail.daysConsumptionMonth}
                      onChange={e => setNewDetail({ ...newDetail, daysConsumptionMonth: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="number"
                      defaultValue={detail.totalConsumption}
                      onChange={e => setNewDetail({ ...newDetail, totalConsumption: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="date"
                      defaultValue={detail.period?.slice(0, 10)}
                      onChange={e => setNewDetail({ ...newDetail, period: e.target.value })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <select
                      value={newDetail.fk_idFood}
                      onChange={e => setNewDetail({ ...newDetail, fk_idFood: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
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
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
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
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold">Comida #{detail.fk_idFood} - Plan #{detail.fk_idNutritionalPlan}</h3>
                    <p>Consumo (Kg): {detail.consumptionKlg}</p>
                    <p>Días/mes: {detail.daysConsumptionMonth}</p>
                    <p>Total consumo: {detail.totalConsumption}</p>
                    <p>Periodo: {detail.period?.slice(0, 10)}</p>
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => { setEditingId(detail.idDetail!); setNewDetail(detail); }}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white p-2 rounded-md flex items-center gap-1"
                      >
                        <Edit size={16} /> Editar
                      </button>
                      <button
                        onClick={() => deleteDetail(detail.idDetail!)}
                        className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-md flex items-center gap-1"
                      >
                        <Trash2 size={16} /> Eliminar
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NutritionalPlanDetailsManagement;