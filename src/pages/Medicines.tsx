import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Save, Trash2, Loader, X } from 'lucide-react';

const API_URL = 'https://backend-country-nnxe.onrender.com/medicines/';

interface Medicine {
  idMedicine?: number;
  name: string;
  description?: string;
  medicationType?: string;
  stock: number;
  minStock: number;
  boxExpirationDate: string; // ISO date
  openedOn: string; // ISO date
  daysAfterOpening: number;
  openedExpirationDate: string; // ISO date
  expiryStatus: string;
  stockStatus: string;
  notifyDaysBefore: string; // ISO date
  isActive?: boolean;
  source?: string;
  fk_idHorse?: number;
  created_at?: string;
}

const MedicinesManagement = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [newMedicine, setNewMedicine] = useState<Medicine>({
    name: '',
    description: '',
    medicationType: '',
    stock: 0,
    minStock: 0,
    boxExpirationDate: '',
    openedOn: '',
    daysAfterOpening: 0,
    openedExpirationDate: '',
    expiryStatus: '',
    stockStatus: '',
    notifyDaysBefore: '',
    isActive: true,
    source: '',
    fk_idHorse: undefined,
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

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al obtener medicamentos');
      const data = await res.json();
      setMedicines(data);
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

  const createMedicine = async () => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMedicine),
      });
      if (!res.ok) throw new Error('Error al crear medicamento');
      toast.success('Medicamento creado!');
      setNewMedicine({
        name: '',
        description: '',
        medicationType: '',
        stock: 0,
        minStock: 0,
        boxExpirationDate: '',
        openedOn: '',
        daysAfterOpening: 0,
        openedExpirationDate: '',
        expiryStatus: '',
        stockStatus: '',
        notifyDaysBefore: '',
        isActive: true,
        source: '',
        fk_idHorse: undefined,
      });
      fetchMedicines();
    } catch {
      toast.error('No se pudo crear medicamento.');
    }
  };

  const updateMedicine = async (id: number, updatedMedicine: Medicine) => {
    try {
      const res = await fetch(`${API_URL}${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedMedicine),
      });
      if (!res.ok) throw new Error('Error al actualizar medicamento');
      toast.success('Medicamento actualizado!');
      setEditingId(null);
      fetchMedicines();
    } catch {
      toast.error('No se pudo actualizar medicamento.');
    }
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
   <div className="p-6 bg-slate-950 min-h-screen text-white">
  <h1 className="text-3xl font-bold mb-6 text-center text-teal-400">Gestión de Medicamentos</h1>
  <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-8">
    <h2 className="text-xl font-semibold mb-4 text-teal-400">Agregar Nuevo Medicamento</h2>
    <div className="flex gap-4 flex-wrap">
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
        <input
          type="text"
          id="medicationType"
          name="medicationType"
          placeholder="Tipo de medicamento"
          value={newMedicine.medicationType}
          onChange={e => setNewMedicine({ ...newMedicine, medicationType: e.target.value })}
          className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400 w-full"
        />
      </div>
      <div>
        <label htmlFor="stock" className="block mb-1">Cantidad en stock</label>
        <input
          type="number"
          id="stock"
          name="stock"
          placeholder="Stock"
          value={newMedicine.stock}
          onChange={e => setNewMedicine({ ...newMedicine, stock: Number(e.target.value) })}
          className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400 w-full"
        />
      </div>
      <div>
        <label htmlFor="minStock" className="block mb-1">Stock mínimo para alerta</label>
        <input
          type="number"
          id="minStock"
          name="minStock"
          placeholder="Stock mínimo"
          value={newMedicine.minStock}
          onChange={e => setNewMedicine({ ...newMedicine, minStock: Number(e.target.value) })}
          className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400 w-full"
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
        <label htmlFor="openedOn" className="block mb-1">Fecha en que se abrió</label>
        <input
          type="date"
          id="openedOn"
          name="openedOn"
          placeholder="Abierto el"
          value={newMedicine.openedOn}
          onChange={e => setNewMedicine({ ...newMedicine, openedOn: e.target.value })}
          className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400 w-full"
        />
      </div>
      <div>
        <label htmlFor="daysAfterOpening" className="block mb-1">Días de uso después de abrir</label>
        <input
          type="number"
          id="daysAfterOpening"
          name="daysAfterOpening"
          placeholder="Días tras abrir"
          value={newMedicine.daysAfterOpening}
          onChange={e => setNewMedicine({ ...newMedicine, daysAfterOpening: Number(e.target.value) })}
          className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400 w-full"
        />
      </div>
      <div>
        <label htmlFor="openedExpirationDate" className="block mb-1">Fecha de vencimiento (abierto)</label>
        <input
          type="date"
          id="openedExpirationDate"
          name="openedExpirationDate"
          placeholder="Vence tras abrir"
          value={newMedicine.openedExpirationDate}
          onChange={e => setNewMedicine({ ...newMedicine, openedExpirationDate: e.target.value })}
          className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400 w-full"
        />
      </div>
      <div>
        <label htmlFor="expiryStatus" className="block mb-1">Estado de vencimiento</label>
        <input
          type="text"
          id="expiryStatus"
          name="expiryStatus"
          placeholder="Estado vencimiento"
          value={newMedicine.expiryStatus}
          onChange={e => setNewMedicine({ ...newMedicine, expiryStatus: e.target.value })}
          className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400 w-full"
        />
      </div>
      <div>
        <label className="block mb-1">Estado de stock</label>
        <input
          type="text"
          id="stockStatus"
          name="stockStatus"
          placeholder="Estado stock"
          value={newMedicine.stockStatus}
          onChange={e => setNewMedicine({ ...newMedicine, stockStatus: e.target.value })}
          className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400 w-full"
        />
      </div>
      <div>
        <label htmlFor="notifyDaysBefore" className="block mb-1">Fecha para notificar antes del vencimiento</label>
        <input
          type="date"
          id="notifyDaysBefore"
          name="notifyDaysBefore"
          placeholder="Notificar antes de"
          value={newMedicine.notifyDaysBefore}
          onChange={e => setNewMedicine({ ...newMedicine, notifyDaysBefore: e.target.value })}
          className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400 w-full"
        />
      </div>
      <div>
        <label htmlFor="isActive" className="block mb-1">Estado (activo/inactivo)</label>
        <select
          id="isActive"
          name="isActive"
          value={newMedicine.isActive ? "true" : "false"}
          onChange={e => setNewMedicine({ ...newMedicine, isActive: e.target.value === "true" })}
          className="p-2 rounded-md bg-gray-700 text-white w-full"
        >
          <option value="true">Activo</option>
          <option value="false">Inactivo</option>
        </select>
      </div>
      <div>
        <label htmlFor="source" className="block mb-1">Origen o proveedor</label>
        <input
          type="text"
          id="source"
          name="source"
          placeholder="Fuente"
          value={newMedicine.source}
          onChange={e => setNewMedicine({ ...newMedicine, source: e.target.value })}
          className="p-2 rounded-md bg-gray-700 text-white placeholder-gray-400 w-full"
        />
      </div>
      <div>
        <label htmlFor="fk_idHorse" className="block mb-1">Caballo asociado</label>
        <select
          id="fk_idHorse"
          name="fk_idHorse"
          value={newMedicine.fk_idHorse || ""}
          onChange={e => setNewMedicine({ ...newMedicine, fk_idHorse: e.target.value ? Number(e.target.value) : undefined })}
          className="p-2 rounded-md bg-gray-700 text-white w-full"
        >
          <option value="">-- Opcional: Selecciona caballo --</option>
          {horses.map(horse => (
            <option key={horse.idHorse} value={horse.idHorse}>
              {horse.horseName}
            </option>
          ))}
        </select>
      </div>
      <button onClick={createMedicine} className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-md font-semibold flex items-center gap-2 mt-auto">
        <Plus size={20} /> Agregar
      </button>
    </div>
  </div>
  <div className="bg-gray-800 p-6 rounded-lg shadow-md">
    {loading ? (
      <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
        <Loader size={24} className="animate-spin" />Cargando medicamentos...
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {medicines.map(med => (
          <div key={med.idMedicine} className="bg-gray-700 p-4 rounded-md shadow-lg flex flex-col justify-between">
            {editingId === med.idMedicine ? (
              <>
                <div>
                  <label className="block mb-1">Nombre del medicamento</label>
                  <input type="text" id="edit-name" defaultValue={med.name} onChange={e => setNewMedicine({ ...newMedicine, name: e.target.value })} className="p-2 rounded-md bg-gray-600 text-white mb-2 w-full" />
                </div>
                <div>
                  <label className="block mb-1">Descripción</label>
                  <input type="text" id="edit-description" defaultValue={med.description} onChange={e => setNewMedicine({ ...newMedicine, description: e.target.value })} className="p-2 rounded-md bg-gray-600 text-white mb-2 w-full" />
                </div>
                <div>
                  <label htmlFor="edit-medicationType" className="block mb-1">Tipo de medicamento</label>
                  <input type="text" id="edit-medicationType" defaultValue={med.medicationType} onChange={e => setNewMedicine({ ...newMedicine, medicationType: e.target.value })} className="p-2 rounded-md bg-gray-600 text-white mb-2 w-full" />
                </div>
                <div>
                  <label htmlFor="edit-stock" className="block mb-1">Cantidad en stock</label>
                  <input type="number" id="edit-stock" defaultValue={med.stock} onChange={e => setNewMedicine({ ...newMedicine, stock: Number(e.target.value) })} className="p-2 rounded-md bg-gray-600 text-white mb-2 w-full" />
                </div>
                <div>
                  <label htmlFor="edit-minStock" className="block mb-1">Stock mínimo para alerta</label>
                  <input type="number" id="edit-minStock" defaultValue={med.minStock} onChange={e => setNewMedicine({ ...newMedicine, minStock: Number(e.target.value) })} className="p-2 rounded-md bg-gray-600 text-white mb-2 w-full" />
                </div>
                <div>
                  <label htmlFor="edit-boxExpirationDate" className="block mb-1">Fecha de vencimiento (caja)</label>
                  <input type="date" id="edit-boxExpirationDate" defaultValue={med.boxExpirationDate?.slice(0, 10)} onChange={e => setNewMedicine({ ...newMedicine, boxExpirationDate: e.target.value })} className="p-2 rounded-md bg-gray-600 text-white mb-2 w-full" />
                </div>
                <div>
                  <label htmlFor="edit-openedOn" className="block mb-1">Fecha en que se abrió</label>
                  <input type="date" id="edit-openedOn" defaultValue={med.openedOn?.slice(0, 10)} onChange={e => setNewMedicine({ ...newMedicine, openedOn: e.target.value })} className="p-2 rounded-md bg-gray-600 text-white mb-2 w-full" />
                </div>
                <div>
                  <label htmlFor="edit-daysAfterOpening" className="block mb-1">Días de uso después de abrir</label>
                  <input type="number" id="edit-daysAfterOpening" defaultValue={med.daysAfterOpening} onChange={e => setNewMedicine({ ...newMedicine, daysAfterOpening: Number(e.target.value) })} className="p-2 rounded-md bg-gray-600 text-white mb-2 w-full" />
                </div>
                <div>
                  <label htmlFor="edit-openedExpirationDate" className="block mb-1">Fecha de vencimiento (abierto)</label>
                  <input type="date" id="edit-openedExpirationDate" defaultValue={med.openedExpirationDate?.slice(0, 10)} onChange={e => setNewMedicine({ ...newMedicine, openedExpirationDate: e.target.value })} className="p-2 rounded-md bg-gray-600 text-white mb-2 w-full" />
                </div>
                <div>
                  <label htmlFor="edit-expiryStatus" className="block mb-1">Estado de vencimiento</label>
                  <input type="text" id="edit-expiryStatus" defaultValue={med.expiryStatus} onChange={e => setNewMedicine({ ...newMedicine, expiryStatus: e.target.value })} className="p-2 rounded-md bg-gray-600 text-white mb-2 w-full" />
                </div>
                <div>
                  <label htmlFor="edit-stockStatus" className="block mb-1">Estado de stock</label>
                  <input type="text" id="edit-stockStatus" defaultValue={med.stockStatus} onChange={e => setNewMedicine({ ...newMedicine, stockStatus: e.target.value })} className="p-2 rounded-md bg-gray-600 text-white mb-2 w-full" />
                </div>
                <div>
                  <label htmlFor="edit-notifyDaysBefore" className="block mb-1">Fecha para notificar antes</label>
                  <input type="date" id="edit-notifyDaysBefore" defaultValue={med.notifyDaysBefore?.slice(0, 10)} onChange={e => setNewMedicine({ ...newMedicine, notifyDaysBefore: e.target.value })} className="p-2 rounded-md bg-gray-600 text-white mb-2 w-full" />
                </div>
                <div>
                  <label htmlFor="edit-isActive" className="block mb-1">Estado</label>
                  <select id="edit-isActive" value={newMedicine.isActive ? "true" : "false"} onChange={e => setNewMedicine({ ...newMedicine, isActive: e.target.value === "true" })} className="p-2 rounded-md bg-gray-600 text-white mb-2 w-full">
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </div>
                <div>
                 <label className="block mb-1">Origen o proveedor</label>
                  <input type="text" id="edit-source" defaultValue={med.source} onChange={e => setNewMedicine({ ...newMedicine, source: e.target.value })} className="p-2 rounded-md bg-gray-600 text-white mb-2 w-full" />
                </div>
                <div>
                  <label htmlFor="edit-fk_idHorse" className="block mb-1">Caballo asociado</label>
                  <select id="edit-fk_idHorse" value={newMedicine.fk_idHorse || ""} onChange={e => setNewMedicine({ ...newMedicine, fk_idHorse: e.target.value ? Number(e.target.value) : undefined })} className="p-2 rounded-md bg-gray-600 text-white mb-2 w-full">
                    <option value="">-- Opcional: Selecciona caballo --</option>
                    {horses.map(horse => (
                      <option key={horse.idHorse} value={horse.idHorse}>
                        {horse.horseName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => updateMedicine(med.idMedicine!, {
                      ...med,
                      ...newMedicine,
                      fk_idHorse: newMedicine.fk_idHorse ?? med.fk_idHorse
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
                <h3 className="text-lg font-semibold">{med.name}</h3>
                <p>Tipo: {med.medicationType}</p>
                <p>Stock: {med.stock} (min: {med.minStock})</p>
                <p>Vence caja: {med.boxExpirationDate?.slice(0, 10)}</p>
                <p>Abierto el: {med.openedOn?.slice(0, 10)} | Vence tras abrir: {med.openedExpirationDate?.slice(0, 10)}</p>
                <p>Días tras abrir: {med.daysAfterOpening}</p>
                <p>Estado vencimiento: {med.expiryStatus}</p>
                <p>Estado stock: {med.stockStatus}</p>
                <p>Notificar antes de: {med.notifyDaysBefore?.slice(0, 10)}</p>
                <p>Activo: {med.isActive ? 'Sí' : 'No'}</p>
                <p>Fuente: {med.source}</p>
                <p>Caballo: {horses.find(h => h.idHorse === med.fk_idHorse)?.horseName || med.fk_idHorse || '-'}</p>
                <p className="text-sm text-gray-400">{med.description}</p>
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => { setEditingId(med.idMedicine!); setNewMedicine(med); }}
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

export default MedicinesManagement;