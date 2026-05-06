import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import { Edit, Trash2, Loader } from 'lucide-react';
import { confirmDialog } from '../../utils/confirmDialog';
import { AddButton, AdminSection, SaveButton, CancelButton } from '../../components/ui/admin-buttons';
import { isNonEmptyString } from '../../utils/validation';

const API_URL = 'https://api.countryclub.doc-ia.cloud/vaccines/';

interface Vaccine {
  idVaccine?: number;
  vaccineName: string;
  vaccineType: string;
}

const VaccinesManagement = () => {
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [newVaccine, setNewVaccine] = useState<Vaccine>({
    vaccineName: '',
    vaccineType: '',
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<Vaccine | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const isEditModalOpen = editingId !== null && editingData !== null;

  useEffect(() => {
    if (!isEditModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') handleCancelEdit(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isEditModalOpen]);

  const fetchVaccines = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al obtener vacunas');
      const data = await res.json();
      setVaccines(data);
    } catch {
      toast.error('No se pudo cargar vacunas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVaccines();
  }, []);

  const createVaccine = async () => {
    if (!isNonEmptyString(newVaccine.vaccineName, 150)) {
      toast.error('El nombre de la vacuna es obligatorio y debe tener máximo 150 caracteres.');
      return;
    }
    if (!isNonEmptyString(newVaccine.vaccineType, 150)) {
      toast.error('El tipo de vacuna es obligatorio y debe tener máximo 150 caracteres.');
      return;
    }
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVaccine),
      });
      if (!res.ok) throw new Error('Error al crear vacuna');
      toast.success('Vacuna creada!');
      setNewVaccine({ vaccineName: '', vaccineType: '' });
      fetchVaccines();
    } catch {
      toast.error('No se pudo crear vacuna.');
    }
  };

  const updateVaccine = async (id: number) => {
    if (!editingData) return;
    if (!isNonEmptyString(editingData.vaccineName, 150)) {
      toast.error('El nombre de la vacuna es obligatorio y debe tener máximo 150 caracteres.');
      return;
    }
    if (!isNonEmptyString(editingData.vaccineType, 150)) {
      toast.error('El tipo de vacuna es obligatorio y debe tener máximo 150 caracteres.');
      return;
    }
    try {
      const res = await fetch(`${API_URL}${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingData),
      });
      if (!res.ok) throw new Error('Error al actualizar vacuna');
      toast.success('Vacuna actualizada!');
      setEditingId(null);
      setEditingData(null);
      fetchVaccines();
    } catch {
      toast.error('No se pudo actualizar vacuna.');
    }
  };

  const deleteVaccine = async (id: number) => {
    const confirmed = await confirmDialog({
      title: '¿Eliminar vacuna?',
      description: 'Esta acción eliminará la vacuna permanentemente. Esta acción no se puede deshacer.',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
    });
    if (!confirmed) return;
    try {
      const res = await fetch(`${API_URL}${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar vacuna');
      toast.success('Vacuna eliminada!');
      fetchVaccines();
    } catch {
      toast.error('No se pudo eliminar vacuna.');
    }
  };

  const handleEditClick = (vaccine: Vaccine) => {
    setEditingId(vaccine.idVaccine!);
    setEditingData({ ...vaccine });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingData(null);
  };

  return (
    <div className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
      <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">Gestión de Vacunas</h1>
      <AdminSection>
        <h2 className="text-xl font-semibold mb-4">Agregar Nueva Vacuna</h2>
        <div className="flex gap-4">
          <input
            type="text"
            name="vaccineName"
            placeholder="Nombre de la vacuna"
            value={newVaccine.vaccineName}
            onChange={e => setNewVaccine({ ...newVaccine, vaccineName: e.target.value })}
            maxLength={150}
            className="select-field flex-1 placeholder-gray-400"
          />
          <input
            type="text"
            name="vaccineType"
            placeholder="Tipo de vacuna"
            value={newVaccine.vaccineType}
            onChange={e => setNewVaccine({ ...newVaccine, vaccineType: e.target.value })}
            maxLength={150}
            className="select-field flex-1 placeholder-gray-400"
          />
          <AddButton onClick={createVaccine} />
        </div>
      </AdminSection>
      <AdminSection>
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            <Loader size={24} className="animate-spin" />Cargando vacunas...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vaccines.map(vaccine => (
              <div
                key={vaccine.idVaccine}
                className="rounded-2xl border border-slate-800/60 bg-gradient-to-br from-emerald-500/10 via-slate-900/60 to-slate-900/90 shadow-lg shadow-black/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-emerald-500/20"
              >
                <div className="flex flex-col items-center gap-2 py-5">
                  <span className="h-4 w-4 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]" />
                  <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    Vacuna
                  </span>
                </div>

                <div className="px-6 pb-6 space-y-4 text-sm text-slate-200">
                  <div className="text-center space-y-1">
                    <h3 className="text-lg font-semibold text-emerald-300">{vaccine.vaccineName}</h3>
                  </div>

                  <div className="rounded-xl border border-slate-800/80 bg-slate-900/70 p-4 text-xs leading-relaxed">
                    <ul className="space-y-1">
                      <li><strong>Tipo:</strong> {vaccine.vaccineType}</li>
                    </ul>
                  </div>

                  <div className="flex items-center justify-center gap-6 border-t border-slate-800 pt-6 pb-2">
                    <button
                      onClick={() => handleEditClick(vaccine)}
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
                      onClick={() => deleteVaccine(vaccine.idVaccine!)}
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
            ))}
          </div>
        )}

        {editingId !== null && editingData && createPortal(
          <div
            className="fixed inset-0 lg:left-80 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={handleCancelEdit}
          >
            <div
              className="w-full max-w-2xl max-h-[95vh] overflow-y-auto rounded-2xl border border-[#167C79]/60 bg-[#0f172a] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.6)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-[#F8F4E3]">Editar Vacuna</h3>
                  <p className="text-sm text-slate-400">Actualiza los datos.</p>
                </div>
                <button onClick={handleCancelEdit} className="rounded-lg border border-slate-500 px-3 py-1.5 text-slate-300 hover:bg-slate-800">
                  Cerrar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Nombre de la Vacuna</label>
                  <input
                    type="text"
                    value={editingData.vaccineName}
                    onChange={e => setEditingData({ ...editingData, vaccineName: e.target.value })}
                    className="w-full p-2 rounded-md bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block mb-1">Tipo</label>
                  <input
                    type="text"
                    value={editingData.vaccineType}
                    onChange={e => setEditingData({ ...editingData, vaccineType: e.target.value })}
                    className="w-full p-2 rounded-md bg-gray-700"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-700 pt-4">
                <CancelButton onClick={handleCancelEdit} />
                <SaveButton onClick={() => updateVaccine(editingId)} children="Guardar cambios" />
              </div>
            </div>
          </div>,
          document.body
        )}
      </AdminSection>
    </div>
  );
};

export default VaccinesManagement;
