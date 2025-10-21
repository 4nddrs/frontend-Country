import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Save, Trash2, Loader, X } from 'lucide-react';

const API_URL = 'https://backend-country-nnxe.onrender.com/medicines/';
const MEDICATION_TYPE_OPTIONS = [
  'Antibióticos',
  'Antiinflamatorios y analgésicos',
  'Antiparasitarios (desparasitantes)',
  'Vacunas',
  'Vitaminas y suplementos',
  'Antisépticos y tópicos',
];

const NUMBER_INPUT_CLASSES =
  'p-2 rounded-md bg-gray-700 text-white placeholder-gray-400 w-full [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';

interface Medicine {
  idMedicine?: number;
  name: string;
  description?: string;
  medicationType?: string;
  stock: number | null;
  minStock: number | null;
  boxExpirationDate: string; // ISO date (caja)
  expiryStatus: string;
  stockStatus: string;
  notifyDaysBefore: number | null;
  isActive?: boolean;
  source?: string;
  fk_idHorse?: number;
  created_at?: string;
}

const EMPTY_MEDICINE: Medicine = {
  name: '',
  description: '',
  medicationType: '',
  stock: null,
  minStock: null,
  boxExpirationDate: '',
  expiryStatus: '',
  stockStatus: 'Por Determinar',
  notifyDaysBefore: null,
  isActive: true,
  source: '',
  fk_idHorse: undefined,
};

type MedicinePayload = Omit<Medicine, 'idMedicine' | 'created_at'>;

const toPayload = (medicine: Medicine): MedicinePayload => {
  const { idMedicine, created_at, ...payload } = medicine;
  return {
    ...payload,
    isActive: true,
    expiryStatus: 'Por definir',
  };
};

const sanitizeNumericFields = (medicine: Medicine): Medicine => ({
  ...medicine,
  stock: Math.max(0, Math.floor(Number(medicine.stock ?? 0))),
  minStock: Math.max(0, Math.floor(Number(medicine.minStock ?? 0))),
  notifyDaysBefore: Math.max(0, Math.floor(Number(medicine.notifyDaysBefore ?? 0))),
});

const MedicinesManagement = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [newMedicine, setNewMedicine] = useState<Medicine>({ ...EMPTY_MEDICINE });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // For horse select
  const [horses, setHorses] = useState<any[]>([]);
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

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al obtener medicamentos');
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      const normalized: Medicine[] = list.map((med: any) => {
        const parsedStock =
          med?.stock === null || med?.stock === undefined
            ? null
            : Math.max(0, Math.floor(Number(med.stock) || 0));
        const parsedMinStock =
          med?.minStock === null || med?.minStock === undefined
            ? null
            : Math.max(0, Math.floor(Number(med.minStock) || 0));
        const parsedNotify =
          med?.notifyDaysBefore === null || med?.notifyDaysBefore === undefined
            ? null
            : Math.max(0, Math.floor(Number(med.notifyDaysBefore) || 0));

        return {
          ...med,
          stock: parsedStock,
          minStock: parsedMinStock,
          notifyDaysBefore: parsedNotify,
        };
      });
      setMedicines(normalized);
    } catch {
      toast.error('No se pudo cargar medicamentos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
    fetchHorses();
  }, []);

  const resetForm = () => {
    setNewMedicine({ ...EMPTY_MEDICINE });
    setEditingId(null);
  };

  const createMedicine = async () => {
    try {
      const sanitized = sanitizeNumericFields(newMedicine);
      const payload = toPayload({ ...sanitized, stockStatus: 'Por Determinar' });
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Error al crear medicamento');
      toast.success('Medicamento creado!');
      resetForm();
      fetchMedicines();
    } catch {
      toast.error('No se pudo crear medicamento.');
    }
  };

  const updateMedicine = async (id: number, updatedMedicine: Medicine) => {
    try {
      const sanitized = sanitizeNumericFields(updatedMedicine);
      const res = await fetch(`${API_URL}${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toPayload(sanitized)),
      });
      if (!res.ok) throw new Error('Error al actualizar medicamento');
      toast.success('Medicamento actualizado!');
      resetForm();
      fetchMedicines();
    } catch {
      toast.error('No se pudo actualizar medicamento.');
    }
  };

  const handleSubmit = () => {
    if (newMedicine.source === 'Del Caballo' && !newMedicine.fk_idHorse) {
      toast.error('Selecciona un caballo cuando el origen es Del Caballo.');
      return;
    }

    if (editingId !== null) {
      updateMedicine(editingId, newMedicine);
    } else {
      createMedicine();
    }
  };

  const scrollMainToTop = () => {
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const startEditing = (med: Medicine) => {
    if (!med.idMedicine) return;
    setEditingId(med.idMedicine);
    setNewMedicine({
      ...EMPTY_MEDICINE,
      ...med,
      stock:
        med.stock === null || med.stock === undefined
          ? null
          : Math.max(0, Math.floor(Number(med.stock) || 0)),
      minStock:
        med.minStock === null || med.minStock === undefined
          ? null
          : Math.max(0, Math.floor(Number(med.minStock) || 0)),
      description: med.description ?? '',
      medicationType: med.medicationType ?? '',
      boxExpirationDate: med.boxExpirationDate ? med.boxExpirationDate.slice(0, 10) : '',
      notifyDaysBefore:
        med.notifyDaysBefore === null || med.notifyDaysBefore === undefined
          ? null
          : Math.max(0, Math.floor(Number(med.notifyDaysBefore) || 0)),
      expiryStatus: med.expiryStatus ?? '',
      stockStatus: med.stockStatus ?? 'Por Determinar',
      source: med.source ?? '',
      isActive: med.isActive ?? true,
      fk_idHorse: med.source === 'Veterinario' ? undefined : med.fk_idHorse ?? undefined,
    });
    requestAnimationFrame(() => {
      scrollMainToTop();
    });
  };

  const cancelEdit = () => {
    resetForm();
  };

  const deleteMedicine = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar medicamento');
      toast.success('Medicamento eliminado!');
      fetchMedicines();
    } catch {
      toast.error('No se pudo eliminar medicamento.');
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
          <span className="title-letter">M</span>
          <span className="title-letter">e</span>
          <span className="title-letter">d</span>
          <span className="title-letter">i</span>
          <span className="title-letter">c</span>
          <span className="title-letter">a</span>
          <span className="title-letter">m</span>
          <span className="title-letter">e</span>
          <span className="title-letter">n</span>
          <span className="title-letter">t</span>
          <span className="title-letter">o</span>
          <span className="title-letter">s</span>
        </h1>
      </div>
      <div
        className={`p-6 rounded-lg shadow-xl mb-8 transition-all duration-500 ${
          editingId !== null
            ? "bg-slate-800 border-2 border-teal-400 shadow-[0_0_20px_#14b8a6]"
            : "bg-slate-800 border border-slate-700"
        }`}>
        <h2 className="text-xl font-semibold mb-4 text-teal-400">
          {editingId !== null ? 'Editar Medicamento' : 'Agregar Nuevo Medicamento'}
        </h2>
        {editingId !== null && (
          <div className="mb-4 text-teal-400 font-semibold text-lg animate-pulse text-center">
            Modo edición activo, actualiza los campos y guarda los cambios
          </div>
        )}
        <div className="flex gap-6 flex-wrap">
          <div>
          <label className="block mb-1">Nombre del medicamento</label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="Nombre"
              value={newMedicine.name}
              onChange={e => setNewMedicine({ ...newMedicine, name: e.target.value })}
              className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400 w-full"
            />
          </div>
          <div>
            <label htmlFor="description" className="block mb-1">Descripción</label>
            <input
              type="text"
              id="description"
              name="description"
              placeholder="Descripción"
              value={newMedicine.description}
              onChange={e => setNewMedicine({ ...newMedicine, description: e.target.value })}
              className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400 w-full"
            />
          </div>
          <div>
            <label htmlFor="medicationType" className="block mb-1">Tipo de medicamento</label>
            <select
              id="medicationType"
              name="medicationType"
              value={newMedicine.medicationType || ''}
              onChange={e => setNewMedicine({ ...newMedicine, medicationType: e.target.value })}
              className="p-2 rounded-md bg-gray-700 text-white w-full"
            >
              <option value="">-- Selecciona tipo --</option>
              {MEDICATION_TYPE_OPTIONS.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="stock" className="block mb-1">Cantidad en stock</label>
            <input
              type="number"
              id="stock"
              name="stock"
              placeholder="0"
              value={newMedicine.stock ?? ''}
              min={0}
              step={1}
              inputMode="numeric"
              onChange={e => {
                const { value } = e.target;
                const sanitized =
                  value === '' ? null : Math.max(0, Math.floor(Number(value) || 0));
                setNewMedicine({ ...newMedicine, stock: sanitized });
              }}
              className={NUMBER_INPUT_CLASSES}
            />
          </div>
          <div>
            <label htmlFor="minStock" className="block mb-1">Stock mínimo para alerta</label>
            <input
              type="number"
              id="minStock"
              name="minStock"
              placeholder="0"
              value={newMedicine.minStock ?? ''}
              min={0}
              step={1}
              inputMode="numeric"
              onChange={e => {
                const { value } = e.target;
                const sanitized =
                  value === '' ? null : Math.max(0, Math.floor(Number(value) || 0));
                setNewMedicine({ ...newMedicine, minStock: sanitized });
              }}
              className={NUMBER_INPUT_CLASSES}
            />
          </div>
          <div>
            <label htmlFor="boxExpirationDate" className="block mb-1">Fecha de vencimiento (caja)</label>
            <input
              type="date"
              id="boxExpirationDate"
              name="boxExpirationDate"
              placeholder="Vence caja"
              value={newMedicine.boxExpirationDate}
              onChange={e => setNewMedicine({ ...newMedicine, boxExpirationDate: e.target.value })}
              className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400 w-full"
            />
          </div>
          <div>
            <label htmlFor="notifyDaysBefore" className="block mb-1">Semanas aviso antes de vencer</label>
            <input
              type="number"
              id="notifyDaysBefore"
              name="notifyDaysBefore"
              placeholder="0"
              value={newMedicine.notifyDaysBefore ?? ''}
              min={0}
              step={1}
              inputMode="numeric"
              onChange={e => {
                const { value } = e.target;
                const sanitized =
                  value === '' ? null : Math.max(0, Math.floor(Number(value) || 0));
                setNewMedicine({ ...newMedicine, notifyDaysBefore: sanitized });
              }}
              className={NUMBER_INPUT_CLASSES}
            />
          </div>
          <div>
            <label htmlFor="source" className="block mb-1">Origen</label>
            <select
              id="source"
              name="source"
              value={newMedicine.source || ''}
              onChange={e => {
                const selectedSource = e.target.value;
                setNewMedicine(prev => ({
                  ...prev,
                  source: selectedSource,
                  fk_idHorse: selectedSource === 'Veterinario' ? undefined : prev.fk_idHorse,
                }));
              }}
              className="p-2 rounded-md bg-gray-700 text-white w-full"
            >
              <option value="">-- Selecciona origen --</option>
              <option value="Veterinario">Veterinario</option>
              <option value="Del Caballo">Del Caballo</option>
            </select>
          </div>
          <div>
            <label htmlFor="fk_idHorse" className="block mb-1">Caballo asociado</label>
            <select
              id="fk_idHorse"
              name="fk_idHorse"
              value={newMedicine.fk_idHorse || ""}
              onChange={e => setNewMedicine({ ...newMedicine, fk_idHorse: e.target.value ? Number(e.target.value) : undefined })}
              className={`p-2 rounded-md text-white w-full transition ${newMedicine.source === 'Veterinario'
                ? 'bg-gray-700/60 opacity-60 cursor-not-allowed'
                : 'bg-gray-700 opacity-100'}`}
              disabled={newMedicine.source === 'Veterinario'}
            >
              <option value="">
                {newMedicine.source === 'Del Caballo'
                  ? '-- Selecciona un caballo --'
                  : '-- Opcional: Selecciona caballo --'}
              </option>
              {horses.map(horse => (
                <option key={horse.idHorse} value={horse.idHorse}>
                  {horse.horseName}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={handleSubmit}
              className={`${editingId !== null ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'} text-white p-2 rounded-md font-semibold flex items-center gap-2`}
            >
              {editingId !== null ? (
                <>
                  <Save size={20} /> Guardar cambios
                </>
              ) : (
                <>
                  <Plus size={20} /> Agregar
                </>
              )}
            </button>
            {editingId !== null && (
              <button
                type="button"
                onClick={cancelEdit}
                className="bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-md font-semibold flex items-center gap-2"
              >
                <X size={20} /> Cancelar
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="bg-slate-800 p-6 rounded-lg shadow-xl mb-8 border border-slate-700">
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            <Loader size={24} className="animate-spin" />Cargando medicamentos...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {medicines.map(med => (
              <div
                key={med.idMedicine}
                className={`bg-gray-700 p-4 rounded-md shadow-lg flex flex-col justify-between border ${editingId === med.idMedicine ? 'border-teal-400' : 'border-transparent'}`}
              >
                <h3 className="text-lg font-semibold text-white mb-2">{med.name}</h3>
                <p>Tipo Medicamento: {med.medicationType || '-'}</p>
                <p>Cantidad en Stock: {med.stock ?? 0} (min: {med.minStock ?? 0})</p>
                <p>Fecha de Vencimiento: {med.boxExpirationDate?.slice(0, 10) || '-'}</p>
                <p>Estado vencimiento: {med.expiryStatus || '-'}</p>
                <p>Estado stock: {med.stockStatus || '-'}</p>
                <p>Aviso de Vencimiento: {med.notifyDaysBefore ?? 0} sem. antes</p>
                <p>Origen Medicamento: {med.source || '-'}</p>
                <p>Pertenece al Caballo: {horses.find(h => h.idHorse === med.fk_idHorse)?.horseName || med.fk_idHorse || '-'}</p>
                <p className="text-sm text-gray-300 mt-2">{med.description || 'Sin descripción registrada.'}</p>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => startEditing(med)}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white p-2 rounded-md flex items-center gap-1"
                  >
                    <Edit size={16} /> Editar
                  </button>
                  <button
                    onClick={() => deleteMedicine(med.idMedicine!)}
                    className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-md flex items-center gap-1"
                  >
                    <Trash2 size={16} /> Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicinesManagement;

