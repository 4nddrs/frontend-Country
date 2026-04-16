import { useState, useEffect, useRef } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { Edit, Save, Trash2, X } from 'lucide-react';
import { confirmDialog } from '../../utils/confirmDialog';
import noPhoto from '../../assets/noPhoto.png';
import { AddButton, AdminSection } from '../../components/ui/admin-buttons';

const API_URL = 'http://localhost:8000/owner/';

interface Owner {
  idOwner?: number;
  name: string;
  FirstName: string;
  SecondName?: string;
  ci: number;
  phoneNumber: number;
  image_url?: string | null;   // URL pública de Supabase Storage
}

// Datos del formulario de creación (sin image_url, se sube aparte)
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

  // Formulario de creación
  const [newOwner, setNewOwner] = useState<OwnerFormData>(EMPTY_FORM);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const newFileRef = useRef<HTMLInputElement>(null);

  // Edición
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingOwnerData, setEditingOwnerData] = useState<Owner | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const editFileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchOwners(1);
  }, []);

  // ─── Fetch ────────────────────────────────────────────────────────────────

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

  // ─── Subir imagen al Storage ───────────────────────────────────────────────

  const uploadImage = async (ownerId: number, file: File): Promise<void> => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${API_URL}${ownerId}/image`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('No se pudo subir la imagen.');
  };

  // ─── Crear ────────────────────────────────────────────────────────────────

  const createOwner = async () => {
    if (!newOwner.name || !newOwner.FirstName || !newOwner.ci) {
      toast.error('Por favor, completa Apellido, Primer Nombre y C.I.');
      return;
    }
    try {
      // 1. Crear el propietario (solo datos, sin imagen)
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOwner),
      });
      if (!res.ok) throw new Error();
      const createdOwner: Owner = await res.json();

      // 2. Si hay imagen seleccionada, subirla al Storage
      if (newImageFile) {
        await uploadImage(createdOwner.idOwner!, newImageFile);
        // Recargar para obtener la image_url actualizada
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

  // ─── Actualizar ───────────────────────────────────────────────────────────

  const updateOwner = async (id: number) => {
    if (!editingOwnerData) return;
    try {
      // 1. Actualizar datos del propietario (sin imagen)
      const { image_url, idOwner, ...dataToSend } = editingOwnerData;
      const res = await fetch(`${API_URL}${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });
      if (!res.ok) throw new Error();

      // 2. Si hay imagen nueva, subirla al Storage
      if (editImageFile) {
        await uploadImage(id, editImageFile);
      }

      toast.success('Propietario actualizado!'); // mensaje de éxito
      setEditingId(null);
      setEditingOwnerData(null);
      setEditImageFile(null);
      if (editFileRef.current) editFileRef.current.value = '';
      fetchOwners(currentPage);
    } catch {
      toast.error('No se pudo actualizar el propietario.');
    }
  };

  // ─── Eliminar ─────────────────────────────────────────────────────────────

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

  // ─── Handlers ─────────────────────────────────────────────────────────────

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

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
      <Toaster position="top-right" toastOptions={{ style: { background: '#334155', color: 'white' } }} />
      <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">Gestión de Propietarios</h1>

      {/* ── Formulario de creación ── */}
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

      {/* ── Lista de propietarios ── */}
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

                {editingId === owner.idOwner && editingOwnerData ? (
                  // ── Modo edición ──
                  <>
                    <div className="flex-grow space-y-2 mb-4">
                      <input type="text" placeholder="Nombre" value={editingOwnerData.name}
                        onChange={e => setEditingOwnerData({ ...editingOwnerData, name: e.target.value })}
                        className="w-full p-2 rounded-md bg-gray-600" />
                      <input type="text" placeholder="Primer Apellido" value={editingOwnerData.FirstName}
                        onChange={e => setEditingOwnerData({ ...editingOwnerData, FirstName: e.target.value })}
                        className="w-full p-2 rounded-md bg-gray-600" />
                      <input type="number" placeholder="C.I." value={editingOwnerData.ci}
                        onChange={e => setEditingOwnerData({ ...editingOwnerData, ci: Number(e.target.value) })}
                        className="w-full p-2 rounded-md bg-gray-600" />

                      {/* Preview de imagen actual */}
                      {editingOwnerData.image_url && !editImageFile && (
                        <img src={editingOwnerData.image_url} alt="Foto actual"
                          className="w-full h-32 rounded-md object-cover" />
                      )}
                      {/* Preview de imagen nueva seleccionada */}
                      {editImageFile && (
                        <img src={URL.createObjectURL(editImageFile)} alt="Nueva foto"
                          className="w-full h-32 rounded-md object-cover border-2 border-teal-400" />
                      )}

                      <input type="file" accept="image/*" ref={editFileRef}
                        onChange={e => setEditImageFile(e.target.files?.[0] ?? null)}
                        className="w-full p-1.5 rounded-md bg-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100" />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => updateOwner(owner.idOwner!)}
                        className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md flex items-center gap-1">
                        <Save size={16} /> Guardar
                      </button>
                      <button onClick={handleCancelEdit}
                        className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded-md flex items-center gap-1">
                        <X size={16} /> Cancelar
                      </button>
                    </div>
                  </>
                ) : (
                  // ── Modo vista ──
                  <>
                    <div>
                      {/* image_url es una URL directa, sin decodificación */}
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
                    <div className="flex items-center justify-end gap-4">
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
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </AdminSection>
    </div>
  );
};

export default OwnersManagement;