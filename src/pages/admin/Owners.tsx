import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import { Edit, Trash2, Upload, RotateCcw } from 'lucide-react';
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
  const [allOwners, setAllOwners] = useState<Owner[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 9;

  const [newOwner, setNewOwner] = useState<OwnerFormData>(EMPTY_FORM);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const newFileRef = useRef<HTMLInputElement>(null);
  const [newPreviewUrl, setNewPreviewUrl] = useState<string | null>(null);
  const [newProgress, setNewProgress] = useState<number>(0);
  const [newDragOver, setNewDragOver] = useState<boolean>(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingOwnerData, setEditingOwnerData] = useState<Owner | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const editFileRef = useRef<HTMLInputElement>(null);
  const [editPreviewUrl, setEditPreviewUrl] = useState<string | null>(null);
  const [editProgress, setEditProgress] = useState<number>(0);
  const [editDragOver, setEditDragOver] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(true);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const animateProgress = (setProgress: (v: number) => void) => {
    setProgress(0);
    let p = 0;
    const iv = setInterval(() => {
      p += 4;
      setProgress(Math.min(p, 100));
      if (p >= 100) clearInterval(iv);
    }, 25);
  };

  const applyNewFile = (file: File) => {
    setNewImageFile(file);
    setNewPreviewUrl(URL.createObjectURL(file));
    animateProgress(setNewProgress);
  };

  const clearNewFile = () => {
    setNewImageFile(null);
    setNewPreviewUrl(null);
    setNewProgress(0);
    if (newFileRef.current) newFileRef.current.value = '';
  };

  const applyEditFile = (file: File) => {
    setEditImageFile(file);
    setEditPreviewUrl(URL.createObjectURL(file));
    animateProgress(setEditProgress);
  };

  const clearEditFile = () => {
    setEditImageFile(null);
    setEditPreviewUrl(null);
    setEditProgress(0);
    if (editFileRef.current) editFileRef.current.value = '';
  };

  const isEditModalOpen = editingId !== null && editingOwnerData !== null;

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(allOwners.length / pageSize)),
    [allOwners.length]
  );

  const hasNextPage = currentPage < totalPages;

  const pagedOwners = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return allOwners.slice(start, start + pageSize);
  }, [allOwners, currentPage]);

  const pageNumbers = useMemo(() => {
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, start + 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (!isEditModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') handleCancelEdit(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isEditModalOpen]);

  useEffect(() => {
    fetchOwners(1);
  }, []);

  const fetchOwners = async (page: number = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}?skip=0&limit=9999`);
      if (!res.ok) throw new Error();
      const data: Owner[] = await res.json();
      const sorted = [...data].sort((a, b) => (b.idOwner ?? 0) - (a.idOwner ?? 0));
      setAllOwners(sorted);
      setCurrentPage(page);
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
    if (String(newOwner.ci).length !== 8) {
      toast.error('El C.I. debe tener exactamente 8 dígitos.');
      return;
    }
    if (newOwner.phoneNumber && String(newOwner.phoneNumber).length !== 8) {
      toast.error('El teléfono debe tener exactamente 8 dígitos.');
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
      }
      setAllOwners(prev => [createdOwner, ...prev]);
      setCurrentPage(1);
      toast.success('Propietario creado!');
      setNewOwner(EMPTY_FORM);
      clearNewFile();
    } catch {
      toast.error('No se pudo crear el propietario.');
    }
  };

  const updateOwner = async (id: number) => {
    if (!editingOwnerData) return;
    if (String(editingOwnerData.ci).length !== 8) {
      toast.error('El C.I. debe tener exactamente 8 dígitos.');
      return;
    }
    if (editingOwnerData.phoneNumber && String(editingOwnerData.phoneNumber).length !== 8) {
      toast.error('El teléfono debe tener exactamente 8 dígitos.');
      return;
    }
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
      clearEditFile();
      setAllOwners(prev => prev.map(o =>
        o.idOwner === id ? { ...o, ...dataToSend } : o
      ));
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
      setAllOwners(prev => {
        const next = prev.filter(o => o.idOwner !== id);
        const maxPage = Math.max(1, Math.ceil(next.length / pageSize));
        setCurrentPage(p => Math.min(p, maxPage));
        return next;
      });
    } catch {
      toast.error('No se pudo eliminar el propietario.');
    }
  };

  const handleEditClick = (owner: Owner) => {
    setEditingId(owner.idOwner!);
    setEditingOwnerData({ ...owner });
    clearEditFile();
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingOwnerData(null);
    clearEditFile();
  };

  return (
    <div className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
<h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">Gestión de Propietarios</h1>

      {/* Formulario de creación */}
      <AdminSection>
        <h2 className="text-xl font-semibold mb-4 text-teal-400">Agregar Nuevo Propietario</h2>
        {/* Fila 1 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Nombre</label>
            <input type="text" placeholder="Nombre" value={newOwner.name}
              onChange={e => setNewOwner({ ...newOwner, name: e.target.value })}
              className="w-full p-2 rounded-md bg-gray-700" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Primer Apellido</label>
            <input type="text" placeholder="Primer Apellido" value={newOwner.FirstName}
              onChange={e => setNewOwner({ ...newOwner, FirstName: e.target.value })}
              className="w-full p-2 rounded-md bg-gray-700" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Segundo Apellido <span className="text-slate-500">(Opcional)</span></label>
            <input type="text" placeholder="Segundo Apellido" value={newOwner.SecondName}
              onChange={e => setNewOwner({ ...newOwner, SecondName: e.target.value })}
              className="w-full p-2 rounded-md bg-gray-700" />
          </div>
        </div>

        {/* Fila 2 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Cédula de Identidad <span className="text-slate-500 text-xs">(8 dígitos)</span></label>
            <input
              type="text"
              inputMode="numeric"
              placeholder=""
              value={newOwner.ci === 0 ? '' : String(newOwner.ci)}
              onChange={e => {
                const raw = e.target.value.replace(/\D/g, '').slice(0, 8);
                setNewOwner({ ...newOwner, ci: raw === '' ? 0 : Number(raw) });
              }}
              className="w-full p-2 rounded-md bg-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Teléfono <span className="text-slate-500 text-xs">(8 dígitos)</span></label>
            <input
              type="text"
              inputMode="numeric"
              placeholder=""
              value={newOwner.phoneNumber === 0 ? '' : String(newOwner.phoneNumber)}
              onChange={e => {
                const raw = e.target.value.replace(/\D/g, '').slice(0, 8);
                setNewOwner({ ...newOwner, phoneNumber: raw === '' ? 0 : Number(raw) });
              }}
              className="w-full p-2 rounded-md bg-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Foto del Propietario</label>
            <div
              onDragOver={(e) => { e.preventDefault(); setNewDragOver(true); }}
              onDragLeave={() => setNewDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setNewDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) applyNewFile(f); }}
              className={`h-[38px] flex items-center rounded-md border-2 border-dashed transition-all duration-200 cursor-pointer overflow-hidden
                ${newDragOver ? 'border-[#167C79] bg-[#167C79]/15' : 'border-[#167C79]/40 bg-slate-800/60'}`}
              onClick={() => !newImageFile && newFileRef.current?.click()}
            >
              {!newImageFile && (
                <div className="flex items-center gap-2 px-3 w-full">
                  <Upload size={14} className="text-[#167C79] shrink-0" />
                  <span className="text-sm text-slate-400 truncate">Arrastra o selecciona</span>
                </div>
              )}
              {newImageFile && newPreviewUrl && (
                <div className="flex items-center gap-2 px-3 w-full">
                  <img src={newPreviewUrl} alt="preview" className="h-6 w-6 rounded object-cover shrink-0 border border-slate-600" />
                  <span className="text-sm text-[#bdab62] truncate flex-1">{newImageFile.name}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button type="button" onClick={e => { e.stopPropagation(); newFileRef.current?.click(); }} className="text-slate-400 hover:text-teal-300 transition-colors"><RotateCcw size={13} /></button>
                    <button type="button" onClick={e => { e.stopPropagation(); clearNewFile(); }} className="text-slate-400 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                  </div>
                </div>
              )}
              <input type="file" accept="image/*" ref={newFileRef} onChange={e => { const f = e.target.files?.[0]; if (f) applyNewFile(f); }} className="hidden" />
            </div>
            {newImageFile && newPreviewUrl && (
              <div className="mt-1.5 flex items-center gap-2">
                <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-75 ${newProgress < 34 ? 'bg-rose-400' : newProgress < 67 ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${newProgress}%` }} />
                </div>
                <span className={`text-xs font-medium ${newProgress < 34 ? 'text-rose-300' : newProgress < 67 ? 'text-amber-300' : 'text-emerald-300'}`}>{newProgress}%</span>
              </div>
            )}
          </div>
        </div>
        <div className="mt-4 text-right">
          <AddButton onClick={createOwner} />
        </div>
      </AdminSection>

      {/* Lista de propietarios */}
      <AdminSection>
        <div className="flex justify-end mb-4">
          <div className="flex space-x-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
              className="rounded-full border border-[#3CC9F6]/50 py-2 px-3 text-center text-sm text-[#3CC9F6]/60 transition-all hover:border-[#3CC9F6]/80 hover:text-[#3CC9F6] hover:bg-[#3CC9F6]/10 disabled:pointer-events-none disabled:opacity-30 ml-2"
            >
              Prev
            </button>
            {pageNumbers.map(p => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                disabled={loading}
                className={`min-w-9 rounded-full py-2 px-3.5 border text-center text-sm transition-all disabled:pointer-events-none disabled:opacity-30 ml-2 ${
                  p === currentPage
                    ? 'bg-[#3CC9F6]/15 border-[#3CC9F6]/70 text-[#3CC9F6] shadow-[0_0_14px_rgba(60,201,246,0.4)] ring-1 ring-[#3CC9F6]/20'
                    : 'border-[#3CC9F6]/40 text-[#3CC9F6]/60 hover:border-[#3CC9F6]/70 hover:text-[#3CC9F6] hover:bg-[#3CC9F6]/10'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={!hasNextPage || loading}
              className="rounded-full border border-[#3CC9F6]/50 py-2 px-3 text-center text-sm text-[#3CC9F6]/60 transition-all hover:border-[#3CC9F6]/80 hover:text-[#3CC9F6] hover:bg-[#3CC9F6]/10 disabled:pointer-events-none disabled:opacity-30 ml-2"
            >
              Next
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
            {pagedOwners.map(owner => (
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
                  <label className="block mb-1">C.I. <span className="text-slate-500 text-xs">(8 dígitos)</span></label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={editingOwnerData.ci === 0 ? '' : String(editingOwnerData.ci)}
                    onChange={e => {
                      const raw = e.target.value.replace(/\D/g, '').slice(0, 8);
                      setEditingOwnerData({ ...editingOwnerData, ci: raw === '' ? 0 : Number(raw) });
                    }}
                    className="w-full p-2 rounded-md bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block mb-1">Teléfono <span className="text-slate-500 text-xs">(8 dígitos)</span></label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={editingOwnerData.phoneNumber === 0 ? '' : String(editingOwnerData.phoneNumber)}
                    onChange={e => {
                      const raw = e.target.value.replace(/\D/g, '').slice(0, 8);
                      setEditingOwnerData({ ...editingOwnerData, phoneNumber: raw === '' ? 0 : Number(raw) });
                    }}
                    className="w-full p-2 rounded-md bg-gray-700"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block mb-1 text-sm font-medium text-slate-300">Foto</label>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setEditDragOver(true); }}
                    onDragLeave={() => setEditDragOver(false)}
                    onDrop={(e) => { e.preventDefault(); setEditDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) applyEditFile(f); }}
                    className={`rounded-xl border-2 border-dashed transition-all duration-200 ${editDragOver ? 'border-[#167C79] bg-[#167C79]/15' : 'border-[#167C79]/40 bg-slate-800/60'}`}
                  >
                    {!editImageFile && (
                      <div className="text-center cursor-pointer py-6 px-4" onClick={() => editFileRef.current?.click()}>
                        <button type="button" className="flex items-center gap-1.5 mx-auto rounded-lg bg-[#167C79]/20 border border-[#167C79]/50 px-4 py-2 text-sm font-medium text-teal-300 hover:bg-[#167C79]/30 transition-colors">
                          <Upload size={15} className="shrink-0" />
                          Arrastra y suelta para subir
                        </button>
                      </div>
                    )}
                    {editImageFile && editPreviewUrl && (
                      <div className="mx-4 mb-4 mt-2">
                        <div className="rounded-xl border border-slate-600/50 bg-slate-800/80 p-3">
                          <div className="flex items-center gap-3">
                            <img src={editPreviewUrl} alt="preview" className="h-10 w-10 rounded-lg object-cover border border-slate-600/50 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[#F8F4E3] truncate">{editImageFile.name}</p>
                              <p className="text-xs text-slate-400">{formatFileSize(editImageFile.size)}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button type="button" onClick={() => editFileRef.current?.click()} className="text-slate-400 hover:text-teal-300 transition-colors"><RotateCcw size={15} /></button>
                              <button type="button" onClick={clearEditFile} className="text-slate-400 hover:text-red-400 transition-colors"><Trash2 size={15} /></button>
                            </div>
                          </div>
                          <div className="mt-2.5 flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-75 ${editProgress < 34 ? 'bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.8)]' : editProgress < 67 ? 'bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.8)]' : 'bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]'}`} style={{ width: `${editProgress}%` }} />
                            </div>
                            <span className={`text-xs shrink-0 w-12 text-right font-medium ${editProgress < 34 ? 'text-rose-300' : editProgress < 67 ? 'text-amber-300' : 'text-emerald-300'}`}>{editProgress} %</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <input type="file" accept="image/*" ref={editFileRef} onChange={e => { const f = e.target.files?.[0]; if (f) applyEditFile(f); }} className="hidden" />
                  </div>
                </div>
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
