import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Save, Trash2, Loader, X } from 'lucide-react';

const API_URL = 'https://backend-country-nnxe.onrender.com/attention_horses/';

interface AttentionHorse {
  idAttentionHorse?: number;
  date: string; // ISO date string (YYYY-MM-DD)
  reason: string;
  description?: string;
  fk_idHorse: number;
  created_at?: string;
}

const AttentionHorsesManagement = () => {
  const [attentions, setAttentions] = useState<AttentionHorse[]>([]);
  const [newAttention, setNewAttention] = useState<AttentionHorse>({
    date: '',
    reason: '',
    description: '',
    fk_idHorse: 1,
  });
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

  const fetchAttentions = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al obtener atenciones');
      const data = await res.json();
      setAttentions(data);
    } catch {
      toast.error('No se pudo cargar atenciones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttentions();
    fetchHorses();
  }, []);

  const createAttention = async () => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAttention),
      });
      if (!res.ok) throw new Error('Error al crear atención');
      toast.success('Atención creada!');
      setNewAttention({
        date: '',
        reason: '',
        description: '',
        fk_idHorse: 1,
      });
      fetchAttentions();
    } catch {
      toast.error('No se pudo crear atención.');
    }
  };

  const updateAttention = async (id: number, updatedAttention: AttentionHorse) => {
    try {
      const res = await fetch(`${API_URL}${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedAttention),
      });
      if (!res.ok) throw new Error('Error al actualizar atención');
      toast.success('Atención actualizada!');
      setEditingId(null);
      fetchAttentions();
    } catch {
      toast.error('No se pudo actualizar atención.');
    }
  };

  const deleteAttention = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar atención');
      toast.success('Atención eliminada!');
      fetchAttentions();
    } catch {
      toast.error('No se pudo eliminar atención.');
    }
  };

  return (
    <div className="p-6 bg-slate-950 min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-6 text-center text-teal-400">Gestión de Atenciones a Caballos</h1>
      <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4 text-teal-400">Agregar Nueva Atención</h2>
        <div className="flex gap-4 flex-wrap">
          <div>
            <label htmlFor="date" className="block mb-1">Fecha</label>
          <input
            type="date"
            name="date"
            placeholder="Fecha"
            value={newAttention.date}
            onChange={e => setNewAttention({ ...newAttention, date: e.target.value })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          </div>
          <div>
            <label htmlFor="reason" className="block mb-1">Motivo</label>
          <input
            type="text"
            name="reason"
            placeholder="Motivo"
            value={newAttention.reason}
            onChange={e => setNewAttention({ ...newAttention, reason: e.target.value })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          </div>
          <div>
            <label htmlFor="description" className="block mb-1">Descripción</label>
          <input
            type="text"
            name="description"
            placeholder="Descripción"
            value={newAttention.description}
            onChange={e => setNewAttention({ ...newAttention, description: e.target.value })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          </div>
          <div>
            <label htmlFor="fk_idHorse" className="block mb-1">Caballo</label>
          <select
            name="fk_idHorse"
            value={newAttention.fk_idHorse}
            onChange={e => setNewAttention({ ...newAttention, fk_idHorse: Number(e.target.value) })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white"
          >
            <option value="">-- Selecciona caballo --</option>
            {horses.map(horse => (
              <option key={horse.idHorse} value={horse.idHorse}>
                {horse.horseName}
              </option>
            ))}
          </select>
          </div>
          <button onClick={createAttention} className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-md font-semibold flex items-center gap-2">
            <Plus size={20} /> Agregar
          </button>
        </div>
      </div>
      <div className="bg-gray-800 p-6 rounded-lg shadow-md">
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            <Loader size={24} className="animate-spin" />Cargando atenciones...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {attentions.map(att => (
              <div key={att.idAttentionHorse} className="bg-gray-700 p-4 rounded-md shadow-lg flex flex-col justify-between">
                {editingId === att.idAttentionHorse ? (
                  <>
                    <input
                      type="date"
                      defaultValue={att.date?.slice(0, 10)}
                      onChange={e => setNewAttention({ ...newAttention, date: e.target.value })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="text"
                      defaultValue={att.reason}
                      onChange={e => setNewAttention({ ...newAttention, reason: e.target.value })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="text"
                      defaultValue={att.description}
                      onChange={e => setNewAttention({ ...newAttention, description: e.target.value })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <select
                      value={newAttention.fk_idHorse}
                      onChange={e => setNewAttention({ ...newAttention, fk_idHorse: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    >
                      {horses.map(horse => (
                        <option key={horse.idHorse} value={horse.idHorse}>
                          {horse.horseName}
                        </option>
                      ))}
                    </select>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => updateAttention(att.idAttentionHorse!, {
                          date: newAttention.date || att.date,
                          reason: newAttention.reason || att.reason,
                          description: newAttention.description || att.description,
                          fk_idHorse: newAttention.fk_idHorse || att.fk_idHorse,
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
                    <h3 className="text-lg font-semibold">Fecha: {att.date?.slice(0, 10)}</h3>
                    <p>Motivo: {att.reason}</p>
                    <p>Descripción: {att.description}</p>
                    <p>Caballo: {horses.find(h => h.idHorse === att.fk_idHorse)?.horseName || att.fk_idHorse}</p>
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => { setEditingId(att.idAttentionHorse!); setNewAttention(att); }}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white p-2 rounded-md flex items-center gap-1"
                      >
                        <Edit size={16} /> Editar
                      </button>
                      <button
                        onClick={() => deleteAttention(att.idAttentionHorse!)}
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

export default AttentionHorsesManagement;