import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Save, Trash2, Loader, X } from 'lucide-react';

const API_URL = 'https://backend-country-nnxe.onrender.com/total_control/';

interface TotalControl {
  idTotalControl?: number;
  toCaballerizo: number;
  vaccines: number;
  anemia: number;
  deworming: number;
  consumptionAlfaDiaKlg: number;
  costAlfaBs: number;
  daysConsumptionMonth: number;
  consumptionAlphaMonthKlg: number;
  costTotalAlphaBs: number;
  cubeChala: number;
  UnitCostChalaBs: number;
  costTotalChalaBs: number;
  totalCharge: number;
  fk_idOwner: number;
  fk_idHorse: number;
  created_at?: string;
}

const TotalControlManagement = () => {
  const [controls, setControls] = useState<TotalControl[]>([]);
  const [newControl, setNewControl] = useState<TotalControl>({
    toCaballerizo: 0,
    vaccines: 0,
    anemia: 0,
    deworming: 0,
    consumptionAlfaDiaKlg: 0,
    costAlfaBs: 0,
    daysConsumptionMonth: 0,
    consumptionAlphaMonthKlg: 0,
    costTotalAlphaBs: 0,
    cubeChala: 0,
    UnitCostChalaBs: 0,
    costTotalChalaBs: 0,
    totalCharge: 0,
    fk_idOwner: 1,
    fk_idHorse: 1,
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // For related data selects
  const [owners, setOwners] = useState<any[]>([]);
  const [horses, setHorses] = useState<any[]>([]);

  const fetchOwners = async () => {
    try {
      const res = await fetch("https://backend-country-nnxe.onrender.com/owner/");
      if (!res.ok) throw new Error("Error al obtener propietarios");
      const data = await res.json();
      setOwners(data);
    } catch {
      toast.error("No se pudieron cargar propietarios");
    }
  };

  const fetchHorses = async () => {
    try {
      const res = await fetch("https://backend-country-nnxe.onrender.com/horses/");
      if (!res.ok) throw new Error("Error al obtener caballos");
      const data = await res.json();
      setHorses(data);
    } catch {
      toast.error("No se pudieron cargar caballos");
    }
  };

  const fetchControls = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al obtener controles');
      const data = await res.json();
      setControls(data);
    } catch {
      toast.error('No se pudieron cargar los controles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchControls();
    fetchOwners();
    fetchHorses();
  }, []);

  const createControl = async () => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newControl),
      });
      if (!res.ok) throw new Error('Error al crear control');
      toast.success('Control creado!');
      setNewControl({
        toCaballerizo: 0,
        vaccines: 0,
        anemia: 0,
        deworming: 0,
        consumptionAlfaDiaKlg: 0,
        costAlfaBs: 0,
        daysConsumptionMonth: 0,
        consumptionAlphaMonthKlg: 0,
        costTotalAlphaBs: 0,
        cubeChala: 0,
        UnitCostChalaBs: 0,
        costTotalChalaBs: 0,
        totalCharge: 0,
        fk_idOwner: 1,
        fk_idHorse: 1,
      });
      fetchControls();
    } catch {
      toast.error('No se pudo crear el control.');
    }
  };

  const updateControl = async (id: number, updatedControl: TotalControl) => {
    try {
      const res = await fetch(`${API_URL}${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedControl),
      });
      if (!res.ok) throw new Error('Error al actualizar control');
      toast.success('Control actualizado!');
      setEditingId(null);
      fetchControls();
    } catch {
      toast.error('No se pudo actualizar el control.');
    }
  };

  const deleteControl = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar control');
      toast.success('Control eliminado!');
      fetchControls();
    } catch {
      toast.error('No se pudo eliminar el control.');
    }
  };

  return (
    <div className="bg-slate-900 p-6 rounded-lg shadow-xl mb-8 border border-slate-700">
      <h1 className="text-3xl font-bold mb-6 text-center text-teal-400">Gestión de Control Total</h1>
      <div className="bg-slate-800 p-6 rounded-lg shadow-xl mb-8 border border-slate-700">
        <h2 className="text-xl font-semibold mb-4 text-teal-400">Agregar Nuevo Control Total</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
          <label htmlFor="toCaballerizo" className="block mb-1">A caballerizo</label>
          <input
            type="number"
            name="toCaballerizo"
            placeholder="A caballerizo"
            value={newControl.toCaballerizo}
            onChange={e => setNewControl({ ...newControl, toCaballerizo: Number(e.target.value) })}
            className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          </div>
          <div>
          <label htmlFor="vaccines" className="block mb-1">Vacunas</label>
          <input
            type="number"
            name="vaccines"
            placeholder="Vacunas"
            value={newControl.vaccines}
            onChange={e => setNewControl({ ...newControl, vaccines: Number(e.target.value) })}
            className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          </div>
          <div>
          <label htmlFor="anemia" className="block mb-1">Anemia</label>
          <input
            type="number"
            name="anemia"
            placeholder="Anemia"
            value={newControl.anemia}
            onChange={e => setNewControl({ ...newControl, anemia: Number(e.target.value) })}
            className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          </div>
          <div>
          <label htmlFor="deworming" className="block mb-1">Desparasitación</label>
          <input
            type="number"
            name="deworming"
            placeholder="Desparasitación"
            value={newControl.deworming}
            onChange={e => setNewControl({ ...newControl, deworming: Number(e.target.value) })}
            className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          </div>
          <div>
          <label htmlFor="consumptionAlfaDiaKlg" className="block mb-1">Consumo alfalfa por día (Kg)</label>
          <input
            type="number"
            name="consumptionAlfaDiaKlg"
            placeholder="Consumo alfalfa por día (Kg)"
            value={newControl.consumptionAlfaDiaKlg}
            onChange={e => setNewControl({ ...newControl, consumptionAlfaDiaKlg: Number(e.target.value) })}
            className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          </div>
          <div>
          <label htmlFor="costAlfaBs" className="block mb-1">Costo alfalfa (Bs)</label>
          <input
            type="number"
            name="costAlfaBs"
            placeholder="Costo alfalfa (Bs)"
            value={newControl.costAlfaBs}
            onChange={e => setNewControl({ ...newControl, costAlfaBs: Number(e.target.value) })}
            className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          </div>
          <div>
          <label htmlFor="daysConsumptionMonth" className="block mb-1">Días de consumo al mes</label>
          <input
            type="number"
            name="daysConsumptionMonth"
            placeholder="Días de consumo al mes"
            value={newControl.daysConsumptionMonth}
            onChange={e => setNewControl({ ...newControl, daysConsumptionMonth: Number(e.target.value) })}
            className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          </div>
          <div>
          <label htmlFor="consumptionAlphaMonthKlg" className="block mb-1">Consumo alfalfa mes (Kg)</label>
          <input
            type="number"
            name="consumptionAlphaMonthKlg"
            placeholder="Consumo alfalfa mes (Kg)"
            value={newControl.consumptionAlphaMonthKlg}
            onChange={e => setNewControl({ ...newControl, consumptionAlphaMonthKlg: Number(e.target.value) })}
            className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          </div>
          <div>
          <label htmlFor="costTotalAlphaBs" className="block mb-1">Costo total alfalfa (Bs)</label>
          <input
            type="number"
            name="costTotalAlphaBs"
            placeholder="Costo total alfalfa (Bs)"
            value={newControl.costTotalAlphaBs}
            onChange={e => setNewControl({ ...newControl, costTotalAlphaBs: Number(e.target.value) })}
            className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          </div>
          <div>
          <label htmlFor="cubeChala" className="block mb-1">Cubo de chala</label>
          <input
            type="number"
            name="cubeChala"
            placeholder="Cubo de chala"
            value={newControl.cubeChala}
            onChange={e => setNewControl({ ...newControl, cubeChala: Number(e.target.value) })}
            className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          </div>
          <div>
          <label htmlFor="UnitCostChalaBs" className="block mb-1">Costo unitario chala (Bs)</label>
          <input
            type="number"
            name="UnitCostChalaBs"
            placeholder="Costo unitario chala (Bs)"
            value={newControl.UnitCostChalaBs}
            onChange={e => setNewControl({ ...newControl, UnitCostChalaBs: Number(e.target.value) })}
            className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          </div>
          <div>
          <label htmlFor="costTotalChalaBs" className="block mb-1">Costo total chala (Bs)</label>
          <input
            type="number"
            name="costTotalChalaBs"
            placeholder="Costo total chala (Bs)"
            value={newControl.costTotalChalaBs}
            onChange={e => setNewControl({ ...newControl, costTotalChalaBs: Number(e.target.value) })}
            className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          </div>
          <div>
          <label htmlFor="totalCharge" className="block mb-1">Cargo total</label>
          <input
            type="number"
            name="totalCharge"
            placeholder="Cargo total"
            value={newControl.totalCharge}
            onChange={e => setNewControl({ ...newControl, totalCharge: Number(e.target.value) })}
            className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          </div>
          <div>
          <label htmlFor="fk_idOwner" className="block mb-1">Propietario</label>
          <select
            name="fk_idOwner"
            value={newControl.fk_idOwner}
            onChange={e => setNewControl({ ...newControl, fk_idOwner: Number(e.target.value) })}
            className="p-2 rounded-md bg-gray-700 text-white"
          >
            <option value="">-- Selecciona propietario --</option>
            {owners.map(o => (<option key={o.idOwner} value={o.idOwner}>{o.name}</option>))}
          </select>
          </div>
          <div>
          <label htmlFor="fk_idHorse" className="block mb-1">Caballo</label>
          <select
            name="fk_idHorse"
            value={newControl.fk_idHorse}
            onChange={e => setNewControl({ ...newControl, fk_idHorse: Number(e.target.value) })}
            className="p-2 rounded-md bg-gray-700 text-white"
          >
            <option value="">-- Selecciona caballo --</option>
            {horses.map(h => (<option key={h.idHorse} value={h.idHorse}>{h.horseName}</option>))}
          </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={createControl} className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-md font-semibold flex items-center gap-2">
            <Plus size={20} /> Agregar
          </button>
        </div>
      </div>
      <div className="bg-slate-800 p-6 rounded-lg shadow-xl mb-8 border border-slate-700">
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            <Loader size={24} className="animate-spin" />Cargando controles...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {controls.map(control => (
              <div key={control.idTotalControl} className="bg-gray-700 p-4 rounded-md shadow-lg flex flex-col justify-between">
                {editingId === control.idTotalControl ? (
                  <>
                    <input
                      type="number"
                      defaultValue={control.toCaballerizo}
                      onChange={e => setNewControl({ ...newControl, toCaballerizo: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="number"
                      defaultValue={control.vaccines}
                      onChange={e => setNewControl({ ...newControl, vaccines: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="number"
                      defaultValue={control.anemia}
                      onChange={e => setNewControl({ ...newControl, anemia: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="number"
                      defaultValue={control.deworming}
                      onChange={e => setNewControl({ ...newControl, deworming: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="number"
                      defaultValue={control.consumptionAlfaDiaKlg}
                      onChange={e => setNewControl({ ...newControl, consumptionAlfaDiaKlg: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="number"
                      defaultValue={control.costAlfaBs}
                      onChange={e => setNewControl({ ...newControl, costAlfaBs: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="number"
                      defaultValue={control.daysConsumptionMonth}
                      onChange={e => setNewControl({ ...newControl, daysConsumptionMonth: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="number"
                      defaultValue={control.consumptionAlphaMonthKlg}
                      onChange={e => setNewControl({ ...newControl, consumptionAlphaMonthKlg: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="number"
                      defaultValue={control.costTotalAlphaBs}
                      onChange={e => setNewControl({ ...newControl, costTotalAlphaBs: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="number"
                      defaultValue={control.cubeChala}
                      onChange={e => setNewControl({ ...newControl, cubeChala: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="number"
                      defaultValue={control.UnitCostChalaBs}
                      onChange={e => setNewControl({ ...newControl, UnitCostChalaBs: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="number"
                      defaultValue={control.costTotalChalaBs}
                      onChange={e => setNewControl({ ...newControl, costTotalChalaBs: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="number"
                      defaultValue={control.totalCharge}
                      onChange={e => setNewControl({ ...newControl, totalCharge: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <select
                      value={newControl.fk_idOwner}
                      onChange={e => setNewControl({ ...newControl, fk_idOwner: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    >
                      {owners.map(o => (<option key={o.idOwner} value={o.idOwner}>{o.name}</option>))}
                    </select>
                    <select
                      value={newControl.fk_idHorse}
                      onChange={e => setNewControl({ ...newControl, fk_idHorse: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    >
                      {horses.map(h => (<option key={h.idHorse} value={h.idHorse}>{h.horseName}</option>))}
                    </select>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => updateControl(control.idTotalControl!, {
                          ...control,
                          ...newControl,
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
                    <h3 className="text-lg font-semibold">Propietario: {owners.find(o => o.idOwner === control.fk_idOwner)?.name || control.fk_idOwner}</h3>
                    <p>Caballo: {horses.find(h => h.idHorse === control.fk_idHorse)?.horseName || control.fk_idHorse}</p>
                    <p>A caballerizo: {control.toCaballerizo}</p>
                    <p>Vacunas: {control.vaccines}</p>
                    <p>Anemia: {control.anemia}</p>
                    <p>Desparasitación: {control.deworming}</p>
                    <p>Consumo alfalfa por día (Kg): {control.consumptionAlfaDiaKlg}</p>
                    <p>Costo alfalfa (Bs): {control.costAlfaBs}</p>
                    <p>Días de consumo al mes: {control.daysConsumptionMonth}</p>
                    <p>Consumo alfalfa mes (Kg): {control.consumptionAlphaMonthKlg}</p>
                    <p>Costo total alfalfa (Bs): {control.costTotalAlphaBs}</p>
                    <p>Cubo de chala: {control.cubeChala}</p>
                    <p>Costo unitario chala (Bs): {control.UnitCostChalaBs}</p>
                    <p>Costo total chala (Bs): {control.costTotalChalaBs}</p>
                    <p>Cargo total: {control.totalCharge}</p>
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => { setEditingId(control.idTotalControl!); setNewControl(control); }}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white p-2 rounded-md flex items-center gap-1"
                      >
                        <Edit size={16} /> Editar
                      </button>
                      <button
                        onClick={() => deleteControl(control.idTotalControl!)}
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

export default TotalControlManagement;