import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Save, Trash2, Loader, X } from 'lucide-react';import { confirmDialog } from '../../utils/confirmDialog';
const API_URL = 'http://localhost:8000/scheduled_procedures/';

interface ScheduledProcedure {
  idScheduledProcedure?: number;
  year: string;
  name: string;
  description?: string;
  scheduledMonths: string;
  alertLabel: string;
  created_at?: string;
}

const ScheduledProceduresManagement = () => {
  const [procedures, setProcedures] = useState<ScheduledProcedure[]>([]);
  const [newProcedure, setNewProcedure] = useState<ScheduledProcedure>({
    year: '',
    name: '',
    description: '',
    scheduledMonths: '[]',
    alertLabel: '',
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Meses del año para los checkboxes
  const months = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' },
  ];

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const monthValue = Number(e.target.value);
    let currentMonths = JSON.parse(newProcedure.scheduledMonths);
    if (e.target.checked) {
      currentMonths.push(monthValue);
    } else {
      currentMonths = currentMonths.filter((month: number) => month !== monthValue);
    }
    setNewProcedure({ ...newProcedure, scheduledMonths: JSON.stringify(currentMonths.sort((a: number, b: number) => a - b)) });
  };

  const handleEditMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const monthValue = Number(e.target.value);
    let currentMonths = JSON.parse(newProcedure.scheduledMonths);
    if (e.target.checked) {
      currentMonths.push(monthValue);
    } else {
      currentMonths = currentMonths.filter((month: number) => month !== monthValue);
    }
    setNewProcedure({ ...newProcedure, scheduledMonths: JSON.stringify(currentMonths.sort((a: number, b: number) => a - b)) });
  };

  const fetchProcedures = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al obtener procedimientos');
      const data = await res.json();
      setProcedures(data);
    } catch {
      toast.error('No se pudo cargar procedimientos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcedures();
  }, []);

  const createProcedure = async () => {
    try {
      const selectedMonths = JSON.parse(newProcedure.scheduledMonths || '[]');
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newProcedure, scheduledMonths: selectedMonths }),
      });
      if (!res.ok) throw new Error('Error al crear procedimiento');
      toast.success('Procedimiento creado!');
      setNewProcedure({
        year: '',
        name: '',
        description: '',
        scheduledMonths: '[]',
        alertLabel: '',
      });
      fetchProcedures();
    } catch {
      toast.error('No se pudo crear procedimiento.');
    }
  };

  const updateProcedure = async (id: number, updatedProcedure: ScheduledProcedure) => {
    try {
      const selectedMonths = JSON.parse(updatedProcedure.scheduledMonths || '[]');
      const res = await fetch(`${API_URL}${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updatedProcedure, scheduledMonths: selectedMonths }),
      });
      if (!res.ok) throw new Error('Error al actualizar procedimiento');
      toast.success('Procedimiento actualizado!');
      setEditingId(null);
      fetchProcedures();
    } catch {
      toast.error('No se pudo actualizar procedimiento.');
    }
  };

  const deleteProcedure = async (id: number) => {
    const confirmed = await confirmDialog({
      title: '¿Eliminar procedimiento?',
      description: 'Esta acción eliminará el procedimiento programado permanentemente.',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
    });
    if (!confirmed) return;
    try {
      const res = await fetch(`${API_URL}${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar procedimiento');
      toast.success('Procedimiento eliminado!');
      fetchProcedures();
    } catch {
      toast.error('No se pudo eliminar procedimiento.');
    }
  };

  return (
    <div  className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
      <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">Procedimientos Sanitarios Programados</h1>
      
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.5)] text-[#F8F4E3]">
        <h2 className="text-xl font-semibold mb-4 text-teal-400">Agregar Nuevo Procedimiento</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex flex-col">
            <label htmlFor="year-input" className="block mb-1">Año de vigencia</label>
            <input
              id="year-input"
              type="date"
              name="year"
              value={newProcedure.year}
              onChange={e => setNewProcedure({ ...newProcedure, year: e.target.value })}
              className="w-full"
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="name-input" className="block mb-1">Nombre del procedimiento</label>
            <input
              id="name-input"
              type="text"
              name="name"
              value={newProcedure.name}
              onChange={e => setNewProcedure({ ...newProcedure, name: e.target.value })}
              className="w-full"
              placeholder="Ej: Desparasitación"
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="description-input" className="block mb-1">Descripción (opcional)</label>
            <input
              id="description-input"
              type="text"
              name="description"
              value={newProcedure.description}
              onChange={e => setNewProcedure({ ...newProcedure, description: e.target.value })}
              className="w-full"
              placeholder="Detalles sobre el procedimiento"
            />
          </div>

          <div className="flex flex-col col-span-1 md:col-span-2 lg:col-span-3">
            <label className="block mb-1">Meses de aplicación</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {months.map(month => (
                <div key={month.value} className="flex items-center">
                  <input
                    id={`month-${month.value}`}
                    type="checkbox"
                    value={month.value}
                    checked={JSON.parse(newProcedure.scheduledMonths).includes(month.value)}
                    onChange={handleMonthChange}
                    className="h-4 w-4 text-blue-600 bg-gray-700 rounded border-gray-600 focus:ring-blue-500"
                  />
                  <label htmlFor={`month-${month.value}`} className="ml-2 text-sm text-gray-300">{month.label}</label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col">
            <label htmlFor="alert-input" className="block mb-1">Etiqueta de alerta</label>
            <input
              id="alert-input"
              type="text"
              name="alertLabel"
              value={newProcedure.alertLabel}
              onChange={e => setNewProcedure({ ...newProcedure, alertLabel: e.target.value })}
              className="w-full"
              placeholder="Ej: 'Prioridad alta'"
            />
          </div>

          <div className="flex items-end justify-end">
            <button onClick={createProcedure} className="w-full p-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-semibold flex items-center justify-center gap-2">
              <Plus size={20} /> Agregar
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.5)] text-[#F8F4E3]">
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            <Loader size={24} className="animate-spin" />Cargando procedimientos...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {procedures.map(proc => (
              <div key={proc.idScheduledProcedure} className="rounded-2xl border border-slate-800/60 bg-gradient-to-br from-purple-500/10 via-slate-900/60 to-slate-900/90 shadow-lg shadow-black/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-purple-500/20">
                {editingId === proc.idScheduledProcedure ? (
                  <div className="p-6 space-y-4">
                    <div className="flex flex-col">
                      <label className="block mb-2 font-medium text-gray-200">Año de vigencia</label>
                      <input
                        id={`edit-year-${proc.idScheduledProcedure}`}
                        type="date"
                        defaultValue={proc.year?.slice(0, 10)}
                        onChange={e => setNewProcedure({ ...newProcedure, year: e.target.value })}
                        className="select-field px-4 py-2 rounded-md border border-gray-600 focus:border-blue-500 focus:outline-none w-full"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="block mb-2 font-medium text-gray-200">Nombre del procedimiento</label>
                      <input
                        id={`edit-name-${proc.idScheduledProcedure}`}
                        type="text"
                        defaultValue={proc.name}
                        onChange={e => setNewProcedure({ ...newProcedure, name: e.target.value })}
                        className="select-field px-4 py-2 rounded-md border border-gray-600 focus:border-blue-500 focus:outline-none w-full"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="block mb-2 font-medium text-gray-200">Descripción</label>
                      <input
                        id={`edit-description-${proc.idScheduledProcedure}`}
                        type="text"
                        defaultValue={proc.description}
                        onChange={e => setNewProcedure({ ...newProcedure, description: e.target.value })}
                        className="select-field px-4 py-2 rounded-md border border-gray-600 focus:border-blue-500 focus:outline-none w-full"
                      />
                    </div>
                    {/* Campo de edición: Meses de aplicación (con checkboxes) */}
                    <div className="flex flex-col">
                      <label className="block mb-3 font-medium text-gray-200">Meses de aplicación</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-3 bg-gray-800/30 rounded-md border border-gray-700">
                        {months.map(month => (
                          <div key={month.value} className="flex items-center gap-2">
                            <input
                              id={`edit-month-${proc.idScheduledProcedure}-${month.value}`}
                              type="checkbox"
                              value={month.value}
                              checked={JSON.parse(newProcedure.scheduledMonths || '[]').includes(month.value)}
                              onChange={handleEditMonthChange}
                              className="h-4 w-4 text-blue-600 bg-gray-700 rounded border-gray-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            />
                            <label htmlFor={`edit-month-${proc.idScheduledProcedure}-${month.value}`} className="text-sm text-gray-300 cursor-pointer">{month.label}</label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <label htmlFor={`edit-alert-${proc.idScheduledProcedure}`} className="block mb-2 font-medium text-gray-200">Etiqueta de alerta</label>
                      <input
                        id={`edit-alert-${proc.idScheduledProcedure}`}
                        type="text"
                        defaultValue={proc.alertLabel}
                        onChange={e => setNewProcedure({ ...newProcedure, alertLabel: e.target.value })}
                        className="select-field px-4 py-2 rounded-md border border-gray-600 focus:border-blue-500 focus:outline-none w-full"
                      />
                    </div>
                    <div className="flex justify-center gap-3 px-6 pb-2 mt-4 -mx-6 -mb-4">
                      <button
                        onClick={() => updateProcedure(proc.idScheduledProcedure!, {
                          ...proc,
                          ...newProcedure,
                          scheduledMonths: newProcedure.scheduledMonths || JSON.stringify(proc.scheduledMonths),
                        })}
                        className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md flex items-center gap-1"
                      >
                        <Save size={16} /> Guardar
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-md flex items-center gap-1"
                      >
                        <X size={16} /> Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col items-center gap-2 py-5">
                      <span className="h-4 w-4 rounded-full bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.6)]" />
                      <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
                        Procedimiento
                      </span>
                    </div>

                    <div className="px-6 pb-6 space-y-4 text-sm text-slate-200">
                      <div className="text-center space-y-1">
                        <h3 className="text-lg font-semibold text-purple-300">{proc.name}</h3>
                      </div>

                      <div className="space-y-2 text-center">
                        <p><span className="font-medium text-slate-400">Año:</span> {proc.year?.slice(0, 10)}</p>
                        <p><span className="font-medium text-slate-400">Descripción:</span> {proc.description}</p>
                        <p><span className="font-medium text-slate-400">Meses:</span> {Array.isArray(proc.scheduledMonths) ? proc.scheduledMonths.map(m => months.find(mo => mo.value === m)?.label).join(', ') : String(proc.scheduledMonths)}</p>
                        <p><span className="font-medium text-slate-400">Alerta:</span> {proc.alertLabel}</p>
                      </div>

                      <div className="flex items-center justify-center gap-6 border-t border-slate-800 pt-6 pb-2">
                      <button
                        onClick={() => {
                          setEditingId(proc.idScheduledProcedure!);
                          setNewProcedure({
                            year: proc.year?.slice(0, 10) || '',
                            name: proc.name,
                            description: proc.description,
                            scheduledMonths: JSON.stringify(proc.scheduledMonths),
                            alertLabel: proc.alertLabel,
                          });
                        }}
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
                        onClick={() => deleteProcedure(proc.idScheduledProcedure!)}
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduledProceduresManagement;




