import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import { Edit, Trash2, Loader, ChevronUp, ChevronDown } from 'lucide-react';
import { AddButton, AdminSection, SaveButton, CancelButton } from '../../components/ui/admin-buttons';
import { confirmDialog } from '../../utils/confirmDialog';

const API_URL = 'http://localhost:8000/medicines/';
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
  const [editingData, setEditingData] = useState<Medicine | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const isEditModalOpen = editingId !== null && editingData !== null;

  // For horse select
  const [horses, setHorses] = useState<any[]>([]);
  const fetchHorses = async () => {
    try {
      const res = await fetch("http://localhost:8000/horses/");
      if (!res.ok) throw new Error("Error al obtener caballos");
      const data = await res.json();
      setHorses(data);
    } catch {
      // Silenciar error de carga
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

  useEffect(() => {
    if (!isEditModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') { setEditingId(null); setEditingData(null); } };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isEditModalOpen]);

  const createMedicine = async () => {
    if (newMedicine.source === 'Del Caballo' && !newMedicine.fk_idHorse) {
      toast.error('Selecciona un caballo cuando el origen es Del Caballo.');
      return;
    }
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
      setNewMedicine({ ...EMPTY_MEDICINE });
      fetchMedicines();
    } catch {
      toast.error('No se pudo crear medicamento.');
    }
  };

  const updateMedicine = async (id: number) => {
    if (!editingData) return;
    try {
      const sanitized = sanitizeNumericFields(editingData);
      const res = await fetch(`${API_URL}${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toPayload(sanitized)),
      });
      if (!res.ok) throw new Error('Error al actualizar medicamento');
      toast.success('Medicamento actualizado!');
      setEditingId(null);
      setEditingData(null);
      fetchMedicines();
    } catch {
      toast.error('No se pudo actualizar medicamento.');
    }
  };

  const startEditing = (med: Medicine) => {
    if (!med.idMedicine) return;
    setEditingId(med.idMedicine);
    setEditingData({
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
  };

  const deleteMedicine = async (id: number) => {
    const confirmed = await confirmDialog({
      title: '¿Eliminar medicamento?',
      description: 'Esta acción eliminará el medicamento del inventario permanentemente.',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
    });
    if (!confirmed) return;
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
    <div className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
      <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">Gestión de Medicamentos</h1>

      <AdminSection>
        <h2 className="text-xl font-semibold mb-4 text-teal-400">Agregar Nuevo Medicamento</h2>
        <div className="flex gap-6 flex-wrap">
          <div>
            <label className="block mb-1">Nombre del medicamento</label>
            <input
              type="text"
              placeholder="Nombre"
              value={newMedicine.name}
              onChange={e => setNewMedicine({ ...newMedicine, name: e.target.value })}
              className="select-field placeholder-gray-400 w-full"
            />
          </div>
          <div>
            <label className="block mb-1">Descripción</label>
            <input
              type="text"
              placeholder="Descripción"
              value={newMedicine.description}
              onChange={e => setNewMedicine({ ...newMedicine, description: e.target.value })}
              className="select-field placeholder-gray-400 w-full"
            />
          </div>
          <div>
            <label className="block mb-1">Tipo de medicamento</label>
            <select
              value={newMedicine.medicationType || ''}
              onChange={e => setNewMedicine({ ...newMedicine, medicationType: e.target.value })}
              className="w-full"
            >
              <option value="">-- Selecciona tipo --</option>
              {MEDICATION_TYPE_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1">Cantidad en stock</label>
            <input
              type="number"
              placeholder="0"
              value={newMedicine.stock ?? ''}
              min={0}
              step={1}
              inputMode="numeric"
              onChange={e => {
                const { value } = e.target;
                const sanitized = value === '' ? null : Math.max(0, Math.floor(Number(value) || 0));
                setNewMedicine({ ...newMedicine, stock: sanitized });
              }}
              className={NUMBER_INPUT_CLASSES}
            />
          </div>
          <div>
            <label className="block mb-1">Stock mínimo para alerta</label>
            <input
              type="number"
              placeholder="0"
              value={newMedicine.minStock ?? ''}
              min={0}
              step={1}
              inputMode="numeric"
              onChange={e => {
                const { value } = e.target;
                const sanitized = value === '' ? null : Math.max(0, Math.floor(Number(value) || 0));
                setNewMedicine({ ...newMedicine, minStock: sanitized });
              }}
              className={NUMBER_INPUT_CLASSES}
            />
          </div>
          <div>
            <label className="block mb-1">Fecha de vencimiento (caja)</label>
            <input
              type="date"
              value={newMedicine.boxExpirationDate}
              onChange={e => setNewMedicine({ ...newMedicine, boxExpirationDate: e.target.value })}
              className="select-field placeholder-gray-400 w-full"
            />
          </div>
          <div>
            <label className="block mb-1">Semanas aviso antes de vencer</label>
            <input
              type="number"
              placeholder="0"
              value={newMedicine.notifyDaysBefore ?? ''}
              min={0}
              step={1}
              inputMode="numeric"
              onChange={e => {
                const { value } = e.target;
                const sanitized = value === '' ? null : Math.max(0, Math.floor(Number(value) || 0));
                setNewMedicine({ ...newMedicine, notifyDaysBefore: sanitized });
              }}
              className={NUMBER_INPUT_CLASSES}
            />
          </div>
          <div>
            <label className="block mb-1">Origen</label>
            <select
              value={newMedicine.source || ''}
              onChange={e => {
                const selectedSource = e.target.value;
                setNewMedicine(prev => ({
                  ...prev,
                  source: selectedSource,
                  fk_idHorse: selectedSource === 'Veterinario' ? undefined : prev.fk_idHorse,
                }));
              }}
              className="w-full"
            >
              <option value="">-- Selecciona origen --</option>
              <option value="Veterinario">Veterinario</option>
              <option value="Del Caballo">Del Caballo</option>
            </select>
          </div>
          <div>
            <label className="block mb-1">Caballo asociado</label>
            <select
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
                <option key={horse.idHorse} value={horse.idHorse}>{horse.horseName}</option>
              ))}
            </select>
          </div>
          <div className="w-full flex justify-center mt-4">
            <AddButton onClick={createMedicine}>Agregar</AddButton>
          </div>
        </div>
      </AdminSection>

      <AdminSection>
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            <Loader size={24} className="animate-spin" />Cargando medicamentos...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {medicines.map(med => {
              const isExpanded = expanded[med.idMedicine ?? 0] ?? false;
              return (
                <div
                  key={med.idMedicine}
                  className="rounded-2xl border border-slate-800/60 bg-gradient-to-br from-emerald-500/10 via-slate-900/60 to-slate-900/90 shadow-lg shadow-black/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-emerald-500/20"
                >
                  <div className="flex flex-col items-center gap-2 py-5">
                    <span className="h-4 w-4 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]" />
                    <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Medicamento</span>
                  </div>

                  <div className="px-6 pb-6 space-y-4 text-sm text-slate-200">
                    <div className="text-center space-y-1">
                      <h3 className="text-lg font-semibold text-emerald-300">{med.name}</h3>
                      <p className="text-slate-400">
                        <span className="font-medium text-slate-200">{med.medicationType || '-'}</span>
                      </p>
                    </div>

                    <div className="space-y-2 text-center">
                      <p><span className="font-medium text-slate-400">Stock:</span> {med.stock ?? 0} <span className="text-xs">(min: {med.minStock ?? 0})</span></p>
                      <p><span className="font-medium text-slate-400">Vencimiento:</span> {med.boxExpirationDate?.slice(0, 10) || '-'}</p>
                    </div>

                    <button
                      onClick={() =>
                        setExpanded((prev) => ({
                          ...prev,
                          [med.idMedicine ?? 0]: !prev[med.idMedicine ?? 0],
                        }))
                      }
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/15"
                    >
                      {isExpanded ? (
                        <><ChevronUp size={16} /> Ver menos</>
                      ) : (
                        <><ChevronDown size={16} /> Ver más</>
                      )}
                    </button>

                    {isExpanded && (
                      <div className="rounded-xl border border-slate-800/80 bg-slate-900/70 p-4 text-xs leading-relaxed">
                        <ul className="space-y-1">
                          <li><strong>Estado vencimiento:</strong> {med.expiryStatus || '-'}</li>
                          <li><strong>Estado stock:</strong> {med.stockStatus || '-'}</li>
                          <li><strong>Aviso:</strong> {med.notifyDaysBefore ?? 0} sem. antes</li>
                          <li><strong>Origen:</strong> {med.source || '-'}</li>
                          <li><strong>Caballo:</strong> {horses.find(h => h.idHorse === med.fk_idHorse)?.horseName || med.fk_idHorse || '-'}</li>
                          <li><strong>Descripción:</strong> {med.description || 'Sin descripción registrada.'}</li>
                        </ul>
                      </div>
                    )}

                    <div className="flex items-center justify-center gap-6 border-t border-slate-800 pt-6 pb-2">
                      <button
                        onClick={() => startEditing(med)}
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
                        onClick={() => deleteMedicine(med.idMedicine!)}
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
            onClick={() => { setEditingId(null); setEditingData(null); }}
          >
            <div
              className="w-full max-w-2xl max-h-[95vh] overflow-y-auto rounded-2xl border border-[#167C79]/60 bg-[#0f172a] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.6)]"
              onClick={e => e.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-[#F8F4E3]">Editar Medicamento</h3>
                  <p className="text-sm text-slate-400">Actualiza los datos.</p>
                </div>
                <button onClick={() => { setEditingId(null); setEditingData(null); }} className="rounded-lg border border-slate-500 px-3 py-1.5 text-slate-300 hover:bg-slate-800">
                  Cerrar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium">Nombre</label>
                  <input
                    type="text"
                    value={editingData!.name}
                    onChange={e => setEditingData(prev => prev ? { ...prev, name: e.target.value } : null)}
                    className="w-full p-2 rounded-md bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Descripción</label>
                  <input
                    type="text"
                    value={editingData!.description || ''}
                    onChange={e => setEditingData(prev => prev ? { ...prev, description: e.target.value } : null)}
                    className="w-full p-2 rounded-md bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Tipo de medicamento</label>
                  <select
                    value={editingData!.medicationType || ''}
                    onChange={e => setEditingData(prev => prev ? { ...prev, medicationType: e.target.value } : null)}
                    className="w-full p-2 rounded-md bg-gray-700"
                  >
                    <option value="">-- Selecciona tipo --</option>
                    {MEDICATION_TYPE_OPTIONS.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Cantidad en stock</label>
                  <input
                    type="number"
                    value={editingData!.stock ?? ''}
                    min={0}
                    step={1}
                    onChange={e => {
                      const { value } = e.target;
                      const sanitized = value === '' ? null : Math.max(0, Math.floor(Number(value) || 0));
                      setEditingData(prev => prev ? { ...prev, stock: sanitized } : null);
                    }}
                    className={NUMBER_INPUT_CLASSES}
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Stock mínimo</label>
                  <input
                    type="number"
                    value={editingData!.minStock ?? ''}
                    min={0}
                    step={1}
                    onChange={e => {
                      const { value } = e.target;
                      const sanitized = value === '' ? null : Math.max(0, Math.floor(Number(value) || 0));
                      setEditingData(prev => prev ? { ...prev, minStock: sanitized } : null);
                    }}
                    className={NUMBER_INPUT_CLASSES}
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Fecha de vencimiento (caja)</label>
                  <input
                    type="date"
                    value={editingData!.boxExpirationDate}
                    onChange={e => setEditingData(prev => prev ? { ...prev, boxExpirationDate: e.target.value } : null)}
                    className="w-full p-2 rounded-md bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Semanas aviso antes de vencer</label>
                  <input
                    type="number"
                    value={editingData!.notifyDaysBefore ?? ''}
                    min={0}
                    step={1}
                    onChange={e => {
                      const { value } = e.target;
                      const sanitized = value === '' ? null : Math.max(0, Math.floor(Number(value) || 0));
                      setEditingData(prev => prev ? { ...prev, notifyDaysBefore: sanitized } : null);
                    }}
                    className={NUMBER_INPUT_CLASSES}
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Origen</label>
                  <select
                    value={editingData!.source || ''}
                    onChange={e => {
                      const selectedSource = e.target.value;
                      setEditingData(prev => prev ? {
                        ...prev,
                        source: selectedSource,
                        fk_idHorse: selectedSource === 'Veterinario' ? undefined : prev.fk_idHorse,
                      } : null);
                    }}
                    className="w-full p-2 rounded-md bg-gray-700"
                  >
                    <option value="">-- Selecciona origen --</option>
                    <option value="Veterinario">Veterinario</option>
                    <option value="Del Caballo">Del Caballo</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Caballo asociado</label>
                  <select
                    value={editingData!.fk_idHorse || ""}
                    onChange={e => setEditingData(prev => prev ? { ...prev, fk_idHorse: e.target.value ? Number(e.target.value) : undefined } : null)}
                    className={`p-2 rounded-md text-white w-full transition ${editingData!.source === 'Veterinario'
                      ? 'bg-gray-700/60 opacity-60 cursor-not-allowed'
                      : 'bg-gray-700 opacity-100'}`}
                    disabled={editingData!.source === 'Veterinario'}
                  >
                    <option value="">-- Opcional: Selecciona caballo --</option>
                    {horses.map(horse => (
                      <option key={horse.idHorse} value={horse.idHorse}>{horse.horseName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-700 pt-4">
                <CancelButton onClick={() => { setEditingId(null); setEditingData(null); }} />
                <SaveButton onClick={() => updateMedicine(editingId!)} children="Guardar cambios" />
              </div>
            </div>
          </div>,
          document.body
        )}
      </AdminSection>
    </div>
  );
};

export default MedicinesManagement;
