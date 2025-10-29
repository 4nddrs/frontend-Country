  import React, { useState, useEffect } from 'react';
  import { Toaster, toast } from 'react-hot-toast';
  import { Plus, Edit, Save, Trash2, Loader, X } from 'lucide-react';
  import { decodeBackendImage } from '../../utils/imageHelpers';


  const API_URL = 'https://backend-country-nnxe.onrender.com/owner/';

  interface Owner {
    idOwner?: number;
    name: string;
    FirstName: string;
    SecondName?: string;
    ci: number;
    phoneNumber: number;
    ownerPhoto?: string | null | { type: 'Buffer', data: number[] }; 
  }


  const OwnersManagement = () => {
   
    const [owners, setOwners] = useState<Owner[]>([]);
    const [newOwner, setNewOwner] = useState<Omit<Owner, 'idOwner'>>({
      name: '',
      FirstName: '',
      SecondName: '',
      ci: 0,
      phoneNumber: 0,
      ownerPhoto: null,
    });
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingOwnerData, setEditingOwnerData] = useState<Owner | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    

    useEffect(() => {
      fetchOwners();
    }, []);


    const fetchOwners = async () => {
      setLoading(true);
      try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error('Error al obtener propietarios');
        const data = await res.json();
        console.log("Datos crudos recibidos del backend:", data);
        setOwners(data);
      } catch (error) {
        console.error(error);
        toast.error('No se pudo cargar la lista de propietarios.');
      } finally {
        setLoading(false);
      }
    };


    const createOwner = async () => {
      if (!newOwner.name || !newOwner.FirstName || !newOwner.ci) {
          toast.error('Por favor, completa Apellido, Primer Nombre y C.I.');
          return;
      }
      try {
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newOwner),
        });
        if (!res.ok) throw new Error('Error al crear propietario');
        toast.success('¡Propietario creado!');
        setNewOwner({ name: '', FirstName: '', SecondName: '', ci: 0, phoneNumber: 0, ownerPhoto: null });
        fetchOwners();
      } catch (error) {
        console.error(error);
        toast.error('No se pudo crear el propietario.');
      }
    };

    const updateOwner = async (id: number) => {
      if (!editingOwnerData) return;
      try {
        const res = await fetch(`${API_URL}${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingOwnerData),
        });
        if (!res.ok) throw new Error('Error al actualizar propietario');
        toast.success('¡Propietario actualizado!');
        setEditingId(null);
        setEditingOwnerData(null);
        fetchOwners();
      } catch (error) {
          console.error(error);
        toast.error('No se pudo actualizar el propietario.');
      }
    };

    const deleteOwner = async (id: number) => {
      if (!window.confirm('¿Estás seguro de que quieres eliminar este propietario?')) return;
      try {
        const res = await fetch(`${API_URL}${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Error al eliminar propietario');
        toast.success('¡Propietario eliminado!');
        fetchOwners();
      } catch (error) {
          console.error(error);
        toast.error('No se pudo eliminar el propietario.');
      }
    };

  
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'new' | 'edit') => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        console.log("Archivo cargado en Base64:", result.substring(0, 30) + "...");
        if (target === 'new') {
          setNewOwner({ ...newOwner, ownerPhoto: result });
        } else if (editingOwnerData) {
          setEditingOwnerData({ ...editingOwnerData, ownerPhoto: result });
        }
      };
      reader.readAsDataURL(file);
    };

    const handleEditClick = (owner: Owner) => {
      setEditingId(owner.idOwner!);
      setEditingOwnerData(owner);
    };

    const handleCancelEdit = () => {
      setEditingId(null);
      setEditingOwnerData(null);
    };

  
    return (
      <div  className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
        <Toaster position="top-right" toastOptions={{ style: { background: '#334155', color: 'white' } }} />
        <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">Gestión de Propietarios</h1>
        
        <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.5)] text-[#F8F4E3]">
          <h2 className="text-xl font-semibold mb-4 text-teal-400">Agregar Nuevo Propietario</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <input type="text" placeholder="Nombre" value={newOwner.name} onChange={e => setNewOwner({ ...newOwner, name: e.target.value })} className="p-2 rounded-md bg-gray-700" />
            <input type="text" placeholder="Primer Apellido" value={newOwner.FirstName} onChange={e => setNewOwner({ ...newOwner, FirstName: e.target.value })} className="p-2 rounded-md bg-gray-700" />
            <input type="text" placeholder="Segundo Apellido (Opcional)" value={newOwner.SecondName || ''} onChange={e => setNewOwner({ ...newOwner, SecondName: e.target.value })} className="p-2 rounded-md bg-gray-700" />
            <input type="number" placeholder="Cédula de Identidad" value={newOwner.ci || ''} onChange={e => setNewOwner({ ...newOwner, ci: Number(e.target.value) })} className="p-2 rounded-md bg-gray-700" />
            <input type="number" placeholder="Teléfono" value={newOwner.phoneNumber || ''} onChange={e => setNewOwner({ ...newOwner, phoneNumber: Number(e.target.value) })} className="p-2 rounded-md bg-gray-700" />
            <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'new')} className="p-1.5 rounded-md bg-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100" />
          </div>
          <div className="mt-4 text-right">
              <button onClick={createOwner} className="bg-green-600 hover:bg-green-700 text-white p-2 px-4 rounded-md font-semibold flex items-center gap-2 inline-flex">
                  <Plus size={20} /> Agregar
              </button>
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.5)] text-[#F8F4E3]">
          {loading ? (
            <div className="flex items-center justify-center gap-2 text-xl text-gray-400"><Loader size={24} className="animate-spin" />Cargando propietarios...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {owners.map(owner => (
                <div key={owner.idOwner} className="bg-gray-700 p-4 rounded-md shadow-lg flex flex-col justify-between">
                  {editingId === owner.idOwner && editingOwnerData ? (

                    <>
                      <div className="flex-grow space-y-2 mb-4">
                          <input type="text" placeholder="Nombre" value={editingOwnerData.name} onChange={e => setEditingOwnerData({...editingOwnerData, name: e.target.value})} className="w-full p-2 rounded-md bg-gray-600"/>
                          <input type="text" placeholder="Primer Apellido" value={editingOwnerData.FirstName} onChange={e => setEditingOwnerData({...editingOwnerData, FirstName: e.target.value})} className="w-full p-2 rounded-md bg-gray-600"/>
                          <input type="number" placeholder="C.I." value={editingOwnerData.ci} onChange={e => setEditingOwnerData({...editingOwnerData, ci: Number(e.target.value)})} className="w-full p-2 rounded-md bg-gray-600"/>
                          <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'edit')} className="w-full p-1.5 rounded-md bg-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100" />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button onClick={() => updateOwner(owner.idOwner!)} className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md flex items-center gap-1"><Save size={16} /> Guardar</button>
                        <button onClick={handleCancelEdit} className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded-md flex items-center gap-1"><X size={16} /> Cancelar</button>
                      </div>
                    </>
                  ) : (
  
                    <>
                      <div>
                      <img
                        src={decodeBackendImage(owner.ownerPhoto)}
                        alt={`Foto de ${owner.FirstName}`}
                        className="w-full h-40 rounded-md object-cover mb-4 bg-gray-600"
                        onError={(e) => { e.currentTarget.src = 'https://placehold.co/200x150/4a5568/ffffff?text=Error'; }}
                      />
                        <h3 className="text-lg font-semibold">{owner.FirstName} {owner.SecondName} {owner.name}</h3>
                        <p>CI: {owner.ci}</p>   
                        <p>Teléfono: {owner.phoneNumber}</p>
                      </div>
                      <div className="flex items-center justify-end gap-4">
                        <button onClick={() => handleEditClick(owner)} 
                          className="relative flex items-center justify-center w-15 h-15 rounded-[20px]
                                    bg-gradient-to-b from-[#1A1C1E] to-[#0E0F10]
                                    shadow-[8px_8px_16px_rgba(0,0,0,0.85),-5px_-5px_12px_rgba(255,255,255,0.06)]
                                    hover:scale-[1.1]
                                    active:shadow-[inset_5px_5px_12px_rgba(0,0,0,0.9),inset_-4px_-4px_10px_rgba(255,255,255,0.05)]
                                    transition-all duration-300 ease-in-out"
                        >
                          <Edit size={28} className="text-[#E8C967] drop-shadow-[0_0_10px_rgba(255,215,100,0.85)] transition-transform duration-300 hover:rotate-3" /> 
                        </button>
                        <button onClick={() => deleteOwner(owner.idOwner!)} 
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

  export default OwnersManagement;
