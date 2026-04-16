import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Toaster, toast } from 'react-hot-toast';
import { Edit, Trash2 } from 'lucide-react';
import { confirmDialog } from '../../utils/confirmDialog';
import noPhoto from '../../assets/noPhoto.png';
import { AddButton, AdminSection, SaveButton, CancelButton } from '../../components/ui/admin-buttons';

const API_URL = 'http://localhost:8000/owner/';

interface Owner {
  idOwner?: number;
  name: string;
  FirstName: string;
  SecondName?: string;
  ci: number;
  phoneNumber: number;
  image_url?: string | null;
}

interface OwnerFormData {
  name: string;
  FirstName: string;
  SecondName: string;
  ci: number;
  phoneNumber: number;
}

const EMPTY_FORM: OwnerFormData = {
  name: '',
  FirstName: '',
  SecondName: '',
  ci: 0,
  phoneNumber: 0,
};

const PLACEHOLDER = noPhoto;

const OwnersManagement = () => {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);
  const pageSize = 9;

  const [newOwner, setNewOwner] = useState<OwnerFormData>(EMPTY_FORM);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const newFileRef = useRef<HTMLInputElement>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingOwnerData, setEditingOwnerData] = useState<Owner | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const editFileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState<boolean>(true);

  const isEditModalOpen = editingId !== null && editingOwnerData !== null;

  useEffect(() => {
    if (!isEditModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') handleCancelEdit(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isEditModalOpen]);

  useEffect(() => {
    fetchOwners(1);
  }, []);

  const fetchOwners = async (page: number) => {
    setLoading(true);
    try {
      const skip = (page - 1) * pageSize;
      const res = await fetch(`${API_URL}?skip=${skip}&limit=${pageSize}`);
      if (!res.ok) throw new Error();
      const data: Owner[] = await res.json();
      const sorted = [...data].sort((a, b) => (b.idOwner ?? 0) - (a.idOwner ?? 0));
      setOwners(sorted);
      setCurrentPage(page);
      setHasNextPage(sorted.length === pageSize);
    } catch {
      toast.error('No se pudo cargar la lista de propietarios.');
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (ownerId: number, file: File): Promise<void> => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${API_URL}${ownerId}/image`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error('No se pudo subir la imagen.');
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
      if (!res.ok) throw new Error();
      const createdOwner: Owner = await res.json();
      if (newImageFile) {
        await uploadImage(createdOwner.idOwner!, newImageFile);
        await fetchOwners(1);
      } else {
        setOwners((prev) => [createdOwner, ...prev]);
        setCurrentPage(1);
      }
      toast.success('Propietario creado!');
      setNewOwner(EMPTY_FORM);
      setNewImageFile(null);
      if (newFileRef.current) newFileRef.current.value = '';
    } catch {
      toast.error('No se pudo crear el propietario.');
    }
  };

  const updateOwner = async (id: number) => {
    if (!editingOwnerData) return;
    try {
      const { image_url, idOwner, ...dataToSend } = editingOwnerData;
      const res = await fetch(`${API_URL}${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });
      if (!res.ok) throw new Error();
      if (editImageFile) {
        await uploadImage(id, editImageFile);
      }
      toast.success('Propietario actualizado!');
      setEditingId(null);
      setEditingOwnerData(null);
      setEditImageFile(null);
      if (editFileRef.current) editFileRef.current.value = '';
      fetchOwners(currentPage);
    } catch {
      toast.error('No se pudo actualizar el propietario.');
    }
  };

  const deleteOwner = async (id: number) => {
    const confirmed = await confirmDialog({
      title: '¿Eliminar propietario?',
      description: 'Esta acción eliminará al propietario y toda su información asociada.',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
    });
    if (!confirmed) return;
    try {
      const res = await fetch(`${API_URL}${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Propietario eliminado!');
      fetchOwners(Math.max(1, currentPage));
    } catch {
      toast.error('No se pudo eliminar el propietario.');
    }
  };

  const handleEditClick = (owner: Owner) => {
    setEditingId(owner.idOwner!);
    setEditingOwnerData({ ...owner });
    setEditImageFile(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingOwnerData(null);
    setEditImageFile(null);
    if (editFileRef.current) editFileRef.current.value = '';
  };

  return (
    <div className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
      <Toaster position="top-right" toastOptions={{ style: { background: '#334155', color: 'white' } }} />
      <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">Gestión de Propietarios</h1>

      {/* Formulario de creación */}
      <AdminSection>
        <h2 className="text-xl font-semibold mb-4 text-teal-400">Agregar Nuevo Propietario</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <input type="text" placeholder="Nombre" value={newOwner.name}
            onChange={e => setNewOwner({ ...newOwner, name: e.target.value })}
            className="p-2 rounded-md bg-gray-700" />
          <input type="text" placeholder="Primer Apellido" value={newOwner.FirstName}
            onChange={e => setNewOwner({ ...newOwner, FirstName: e.target.value })}
            className="p-2 rounded-md bg-gray-700" />
          <input type="text" placeholder="Segundo Apellido (Opcional)" value={newOwner.SecondName}
            onChange={e => setNewOwner({ ...newOwner, SecondName: e.target.value })}
            className="p-2 rounded-md bg-gray-700" />
          <input type="number" placeholder="Cedula de Identidad" value={newOwner.ci || ''}
            onChange={e => setNewOwner({ ...newOwner, ci: Number(e.target.value) })}
            className="p-2 rounded-md bg-gray-700" />
          <input type="number" placeholder="Telefono" value={newOwner.phoneNumber || ''}
            onChange={e => setNewOwner({ ...newOwner, phoneNumber: Number(e.target.value) })}
            className="p-2 rounded-md bg-gray-700" />
          <input
            type="file"
            accept="image/*"
            ref={newFileRef}
            onChange={e => setNewImageFile(e.target.files?.[0] ?? null)}
            className="p-1.5 rounded-md bg-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
          />
        </div>
        <div className="mt-4 text-right">
          <AddButton onClick={createOwner} />
        </div>
      </AdminSection>

      {/* Lista de propietarios */}
      <AdminSection>
        <div className="flex items-center justify-between mb-4 text-sm text-gray-300">
          <span>Página {currentPage}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => fetchOwners(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1 || loading}
              className="px-3 py-1 rounded-md border border-gray-600 bg-gray-700 disabled:opacity-50">
              Anterior
            </button>
            <button onClick={() => fetchOwners(currentPage + 1)}
              disabled={!hasNextPage || loading}
              className="px-3 py-1 rounded-md border border-gray-600 bg-gray-700 disabled:opacity-50">
              Siguiente
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: pageSize }).map((_, idx) => (
              <div key={idx} className="bg-gray-700 p-4 rounded-md shadow-lg animate-pulse space-y-3">
                <div className="w-full h-40 rounded-md bg-gray-600" />
                <div className="h-4 bg-gray-600 rounded w-3/4" />
                <div className="h-3 bg-gray-600 rounded w-1/2" />
                <div className="h-3 bg-gray-600 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {owners.map(owner => (
              <div key={owner.idOwner} className="bg-gray-700 p-4 rounded-md shadow-lg flex flex-col justify-between">
                <div>
                  <img
                    src={owner.image_url ?? PLACEHOLDER}
                    alt={`Foto de ${owner.FirstName}`}
                    className="w-full h-40 rounded-md object-cover mb-4 bg-gray-600"
                    onError={e => { e.currentTarget.src = PLACEHOLDER; }}
                  />
                  <h3 className="text-lg font-semibold">{owner.name} {owner.FirstName} {owner.SecondName}</h3>
                  <p>CI: {owner.ci}</p>
                  <p>Telefono: {owner.phoneNumber}</p>
                </div>
                <div className="flex items-center justify-end gap-4 mt-4">
                  <button onClick={() => handleEditClick(owner)}
                    className="relative flex items-center justify-center w-15 h-15 rounded-[20px]
                      bg-gradient-to-b from-[#1A1C1E] to-[#0E0F10]
                      shadow-[8px_8px_16px_rgba(0,0,0,0.85),-5px_-5px_12px_rgba(255,255,255,0.06)]
                      hover:scale-[1.1]
                      active:shadow-[inset_5px_5px_12px_rgba(0,0,0,0.9),inset_-4px_-4px_10px_rgba(255,255,255,0.05)]
                      transition-all duration-300 ease-in-out">
                    <Edit size={28} className="text-[#E8C967] drop-shadow-[0_0_10px_rgba(255,215,100,0.85)] transition-transform duration-300 hover:rotate-3" />
                  </button>
                  <button onClick={() => deleteOwner(owner.idOwner!)}
                    className="relative flex items-center justify-center w-15 h-15 rounded-[20px]
                      bg-gradient-to-b from-[#1A1C1E] to-[#0E0F10]
                      shadow-[8px_8px_16px_rgba(0,0,0,0.85),-5px_-5px_12px_rgba(255,255,255,0.06)]
                      hover:scale-[1.1]
                      active:shadow-[inset_5px_5px_12px_rgba(0,0,0,0.9),inset_-4px_-4px_10px_rgba(255,255,255,0.05)]
                      transition-all duration-300 ease-in-out">
                    <Trash2 size={28} className="text-[#E86B6B] drop-shadow-[0_0_12px_rgba(255,80,80,0.9)] transition-transform duration-300 hover:-rotate-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {editingId !== null && editingOwnerData && createPortal(
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
                  <h3 className="text-2xl font-bold text-[#F8F4E3]">Editar Propietario</h3>
                  <p className="text-sm text-slate-400">Actualiza los datos.</p>
                </div>
                <button onClick={handleCancelEdit} className="rounded-lg border border-slate-500 px-3 py-1.5 text-slate-300 hover:bg-slate-800">
                  Cerrar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Nombre</label>
                  <input type="text" value={editingOwnerData.name}
                    onChange={e => setEditingOwnerData({ ...editingOwnerData, name: e.target.value })}
                    className="w-full p-2 rounded-md bg-gray-700" />
                </div>
                <div>
                  <label className="block mb-1">Primer Apellido</label>
                  <input type="text" value={editingOwnerData.FirstName}
                    onChange={e => setEditingOwnerData({ ...editingOwnerData, FirstName: e.target.value })}
                    className="w-full p-2 rounded-md bg-gray-700" />
                </div>
                <div>
                  <label className="block mb-1">Segundo Apellido</label>
                  <input type="text" value={editingOwnerData.SecondName || ''}
                    onChange={e => setEditingOwnerData({ ...editingOwnerData, SecondName: e.target.value })}
                    className="w-full p-2 rounded-md bg-gray-700" />
                </div>
                <div>
                  <label className="block mb-1">C.I.</label>
                  <input type="number" value={editingOwnerData.ci}
                    onChange={e => setEditingOwnerData({ ...editingOwnerData, ci: Number(e.target.value) })}
                    className="w-full p-2 rounded-md bg-gray-700" />
                </div>
                <div>
                  <label className="block mb-1">Teléfono</label>
                  <input type="number" value={editingOwnerData.phoneNumber}
                    onChange={e => setEditingOwnerData({ ...editingOwnerData, phoneNumber: Number(e.target.value) })}
                    className="w-full p-2 rounded-md bg-gray-700" />
                </div>
                <div>
                  <label className="block mb-1">Foto</label>
                  <input type="file" accept="image/*" ref={editFileRef}
                    onChange={e => setEditImageFile(e.target.files?.[0] ?? null)}
                    className="w-full p-1.5 rounded-md bg-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100" />
                </div>
                {(editingOwnerData.image_url || editImageFile) && (
                  <div className="md:col-span-2">
                    <img
                      src={editImageFile ? URL.createObjectURL(editImageFile) : editingOwnerData.image_url ?? PLACEHOLDER}
                      alt="Vista previa"
                      className="w-full h-44 rounded-xl object-cover border border-slate-600"
                    />
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-700 pt-4">
                <CancelButton onClick={handleCancelEdit} />
                <SaveButton onClick={() => updateOwner(editingId)} children="Guardar cambios" />
              </div>
            </div>
          </div>,
          document.body
        )}
      </AdminSection>
    </div>
  );
};

export default OwnersManagement;
