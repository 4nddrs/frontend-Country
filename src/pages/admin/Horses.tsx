import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import { Edit, Trash2, Upload, RotateCcw } from 'lucide-react';
import jsPDF from 'jspdf';
import { AddButton, ExportButton, AdminSection, SaveButton, CancelButton } from '../../components/ui/admin-buttons';
import autoTable from 'jspdf-autotable';
import dayjs from 'dayjs';
import { confirmDialog } from '../../utils/confirmDialog';
import noPhoto from '../../assets/noPhoto.png';
import { isNonEmptyString, validateMaxLength } from '../../utils/validation';


// URL de tu API backend
const API_URL = 'https://api.countryclub.doc-ia.cloud/horses/'; 

const LOGO_URL = `${import.meta.env.BASE_URL}image/LogoHipica.png`;
const urlToDataUrl = (url: string) =>
  fetch(url)
    .then(r => r.blob())
    .then(
      blob =>
        new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        })
    );

// --- INTERFACES ---
interface Horse {
  idHorse?: number;
  horseName: string;
  image_url?: string | null;
  birthdate: string; // ISO string (YYYY-DD-MM)
  sex: string;
  color: string;
  generalDescription: string;
  passportNumber: number;
  box: boolean;
  section: boolean;
  basket: boolean;
  fk_idRace: number;
  fk_idOwner: number;
  fl_idNutritionalPlan: number;
  state: string;
  stateSchool:boolean;
}

const initialHorse: Omit<Horse, 'idHorse'> = {
  horseName: '',
  birthdate: '',
  sex: '',
  color: '',
  generalDescription: '',
  passportNumber: 0,
  box: false,
  section: false,
  basket: false,
  fk_idRace: 1,
  fk_idOwner: 1,
  fl_idNutritionalPlan: 1,
  state: 'Activo',
  stateSchool: false,
};

const PLACEHOLDER = noPhoto;

// --- COMPONENTE ---
const HorsesManagement = () => {
  // --- ESTADOS ---
  const [owners, setOwners] = useState<any[]>([]);
  const [races, setRaces] = useState<any[]>([]);
  const [nutritionalPlans, setNutritionalPlans] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [allHorses, setAllHorses] = useState<Horse[]>([]);
  const [horsePage, setHorsePage] = useState<number>(1);
  const horsePageSize = 9;
  const [newHorse, setNewHorse] = useState<Omit<Horse, 'idHorse'>>({ ...initialHorse });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingHorseData, setEditingHorseData] = useState<Horse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [dragOver, setDragOver] = useState<boolean>(false);

  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [editDragOver, setEditDragOver] = useState<boolean>(false);

  // PDF state
  const [exporting, setExporting] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);

  useEffect(() => {
    // carga logo opcional
    urlToDataUrl(LOGO_URL).then(setLogoDataUrl).catch(() => setLogoDataUrl(null));
  }, []);

  // --- EFECTOS ---
  useEffect(() => {
    fetchHorses(1);
    fetchOwners();
    fetchRaces();
    fetchNutritionalPlans();
  }, []);

  const fetchOwners = async () => {
    try {
      const res = await fetch('https://api.countryclub.doc-ia.cloud/owner/');
      const data = await res.json();
      setOwners(data);
    } catch (err) {
      // Silenciar error de carga
    }
  };

  const fetchRaces = async () => {
    try {
      const res = await fetch('https://api.countryclub.doc-ia.cloud/race/');
      const data = await res.json();
      setRaces(data);
    } catch (err) {
      // Silenciar error de carga
    }
  };

  const fetchNutritionalPlans = async () => {
    try {
      const res = await fetch('https://api.countryclub.doc-ia.cloud/nutritional-plans/');
      const data = await res.json();
      setNutritionalPlans(data);
    } catch (err) {
      // Silenciar error de carga
    }
  };

  const fetchHorses = async (page: number = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}?skip=0&limit=9999`);
      if (!res.ok) throw new Error('Error al obtener los caballos');
      const data: Horse[] = await res.json();
      const sorted = [...data].sort((a, b) => (b.idHorse ?? 0) - (a.idHorse ?? 0));
      setAllHorses(sorted);
      setHorsePage(page);
    } catch (error) {
      toast.error('No se pudo cargar la lista de caballos.');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const animateUpload = () => {
    setUploadProgress(0);
    let p = 0;
    const iv = setInterval(() => {
      p += 4;
      setUploadProgress(Math.min(p, 100));
      if (p >= 100) clearInterval(iv);
    }, 25);
  };

  const applyFile = (file: File) => {
    setSelectedPhotoFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    animateUpload();
  };

  const clearFile = () => {
    setSelectedPhotoFile(null);
    setPreviewUrl(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const applyEditFile = (file: File) => {
    setEditPhotoFile(file);
    if (editFileInputRef.current) editFileInputRef.current.value = '';
  };

  const clearEditFile = () => {
    setEditPhotoFile(null);
    if (editFileInputRef.current) editFileInputRef.current.value = '';
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) applyFile(file);
  };

  const createHorse = async () => {
    if (!newHorse.horseName || !newHorse.birthdate || !newHorse.sex || !newHorse.color) {
      toast.error('Completa los campos obligatorios (Nombre, Fecha, Sexo, Color).');
      return;
    }
    if (!isNonEmptyString(newHorse.horseName, 120)) {
      toast.error('El nombre del caballo es obligatorio');
      return;
    }
    if (!isNonEmptyString(newHorse.color, 80)) {
      toast.error('El color es obligatorio');
      return;
    }
    if (!validateMaxLength(newHorse.generalDescription, 300)) {
      toast.error('La descripción general debe tener máximo 300 caracteres.');
      return;
    }
    if (!newHorse.state) {
      toast.error('Selecciona el estado.');
      return;
    }
    if (typeof newHorse.stateSchool !== 'boolean') {
      toast.error('Indica si pertenece a escuela.');
      return;
    }

    try {
      const horseData = {
        horseName: newHorse.horseName,
        birthdate: newHorse.birthdate,
        sex: newHorse.sex,
        color: newHorse.color,
        generalDescription: newHorse.generalDescription,
        passportNumber: newHorse.passportNumber || 0,
        box: newHorse.box || false,
        section: newHorse.section || false,
        basket: newHorse.basket || false,
        fk_idRace: newHorse.fk_idRace,
        fk_idOwner: newHorse.fk_idOwner,
        fl_idNutritionalPlan: newHorse.fl_idNutritionalPlan || 0,
        state: newHorse.state,
        stateSchool: newHorse.stateSchool,
      };

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(horseData),
      });
      if (!res.ok) throw new Error(await res.text());
      const createdHorse = await res.json();

      if (selectedPhotoFile) {
        const formData = new FormData();
        formData.append('image', selectedPhotoFile);
        const imgRes = await fetch(`${API_URL}${createdHorse.idHorse}/image`, {
          method: 'POST',
          body: formData,
        });
        if (imgRes.ok) {
          const updated = await imgRes.json().catch(() => null);
          const withImage = updated ?? createdHorse;
          setAllHorses(prev => [withImage, ...prev]);
        } else {
          setAllHorses(prev => [createdHorse, ...prev]);
        }
      } else {
        setAllHorses(prev => [createdHorse, ...prev]);
      }
      setHorsePage(1);

      toast.success('Caballo creado exitosamente!');
      setNewHorse({ ...initialHorse });
      clearFile();

    } catch (error: any) {
      toast.error(`Error al crear caballo: ${error.message}`);
    }
  };

  const updateHorse = async (id: number) => {
    if (!editingHorseData) return;
    if (!isNonEmptyString(editingHorseData.horseName, 120)) {
      toast.error('El nombre del caballo es obligatorio y debe tener máximo 120 caracteres.');
      return;
    }
    if (!isNonEmptyString(editingHorseData.color, 80)) {
      toast.error('El color es obligatorio');
      return;
    }
    if (!validateMaxLength(editingHorseData.generalDescription, 300)) {
      toast.error('La descripción general debe tener máximo 300 caracteres.');
      return;
    }
    if (!editingHorseData.state) {
      toast.error('Selecciona el estado.');
      return;
    }

    try {
      const horseDataToUpdate = {
        horseName: editingHorseData.horseName,
        birthdate: editingHorseData.birthdate,
        sex: editingHorseData.sex,
        color: editingHorseData.color,
        generalDescription: editingHorseData.generalDescription,
        passportNumber: Number(editingHorseData.passportNumber),
        box: Boolean(editingHorseData.box),
        section: Boolean(editingHorseData.section),
        basket: Boolean(editingHorseData.basket),
        fk_idRace: Number(editingHorseData.fk_idRace),
        fk_idOwner: Number(editingHorseData.fk_idOwner),
        fl_idNutritionalPlan: Number(editingHorseData.fl_idNutritionalPlan),
        state: editingHorseData.state,
        stateSchool: Boolean(editingHorseData.stateSchool),
      };

      const res = await fetch(`${API_URL}${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(horseDataToUpdate),
      });
      if (!res.ok) throw new Error();

      if (editPhotoFile) {
        const formData = new FormData();
        formData.append('image', editPhotoFile);
        await fetch(`${API_URL}${id}/image`, { method: 'POST', body: formData });
      }

      toast.success('Caballo actualizado');
      setEditingId(null);
      setEditingHorseData(null);
      clearEditFile();

      if (editPhotoFile) {
        const imgRes = await fetch(`${API_URL}${id}/image`).catch(() => null);
        const refreshed: Horse | null = imgRes?.ok ? await imgRes.json().catch(() => null) : null;
        setAllHorses(prev => prev.map(h =>
          h.idHorse === id
            ? { ...h, ...horseDataToUpdate, ...(refreshed ? { image_url: refreshed.image_url } : {}) }
            : h
        ));
      } else {
        setAllHorses(prev => prev.map(h => h.idHorse === id ? { ...h, ...horseDataToUpdate } : h));
      }

    } catch {
      toast.error('No se pudo actualizar el caballo.');
    }
  };

  const deleteHorse = async (id: number) => {
    const confirmed = await confirmDialog({
      title: '¿Eliminar caballo?',
      description: 'Esta acción eliminará al caballo y todos sus registros asociados permanentemente.',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
    });
    if (!confirmed) return;
    try {
      const res = await fetch(`${API_URL}${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar el caballo');
      toast.success('Caballo eliminado');
      setAllHorses(prev => {
        const next = prev.filter(h => h.idHorse !== id);
        const maxPage = Math.max(1, Math.ceil(next.length / horsePageSize));
        setHorsePage(p => Math.min(p, maxPage));
        return next;
      });
    } catch (error) {
      toast.error('No se pudo eliminar el caballo.');
    }
  };

  const handleEditClick = (horse: Horse) => {
    setEditingId(horse.idHorse!);
    setEditingHorseData({ ...horse });
    clearEditFile();
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingHorseData(null);
    clearEditFile();
  };

  // Helpers
  const getOwnerName = (id: number) => {
    const o = owners.find((x) => x.idOwner === id);
    return o ? `${o.name ?? ''} ${o.FirstName ?? ''}`.trim() || String(id) : String(id);
  };
  const getRaceName = (id: number) => {
    const r = races.find((x) => x.idRace === id);
    return r?.nameRace ?? String(id);
  };
  const boolTxt = (b: boolean) => (b ? 'Si' : 'No');

  const getStateBadgeClass = (state: string) => {
    switch ((state || '').toUpperCase()) {
      case 'ACTIVO':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40';
      case 'AUSENTE':
        return 'bg-amber-500/20 text-amber-300 border-amber-400/40';
      case 'FALLECIDO':
        return 'bg-rose-500/20 text-rose-300 border-rose-400/40';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-400/40';
    }
  };

  const isEditModalOpen = editingId !== null && editingHorseData !== null;

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(allHorses.length / horsePageSize)),
    [allHorses.length]
  );

  const horseHasNext = horsePage < totalPages;

  const pagedHorses = useMemo(() => {
    const start = (horsePage - 1) * horsePageSize;
    return allHorses.slice(start, start + horsePageSize);
  }, [allHorses, horsePage]);

  const pageNumbers = useMemo(() => {
    const start = Math.max(1, horsePage - 2);
    const end = Math.min(totalPages, start + 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [horsePage, totalPages]);

  useEffect(() => {
    if (!isEditModalOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCancelEdit();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isEditModalOpen]);

  // Exportar PDF Diseno
  const exportHorsesPDF = async () => {
    try {
      setExporting(true);

      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt' });

      try {
        if (logoDataUrl) {
          const margin = 40;
          const w = 120;
          const h = 70;
          const pageW = doc.internal.pageSize.getWidth();
          doc.addImage(logoDataUrl, 'PNG', pageW - w - margin, 20, w, h);
        }
      } catch (e) {
        console.warn('No se pudo dibujar el logo:', e);
      }

      const now = dayjs().format('YYYY-MM-DD HH:mm');
      const pageW = doc.internal.pageSize.getWidth();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('Reporte de Caballos y Duenos', pageW / 2, 50, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Generado: ${now}`, 40, 70);

      const body = allHorses.map(h => [
        h.horseName,
        getOwnerName(h.fk_idOwner),
        h.birthdate ? new Date(h.birthdate).toLocaleDateString() : '',
        h.sex,
        h.color,
        String(h.passportNumber ?? ''),
        boolTxt(h.box),
        boolTxt(h.section),
        boolTxt(h.basket),
      ]);

      autoTable(doc, {
        startY: 110,
        theme: 'striped',
        head: [['Caballo', 'Dueno', 'Nacimiento', 'Sexo', 'Color', 'Pasaporte', 'Box', 'Seccion', 'Canasta']],
        body,
        styles: { fontSize: 9, cellPadding: 6 },
        headStyles: {
          fillColor: [38, 72, 131],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        showFoot: 'lastPage',
        foot: [[
          {
            content: 'TOTAL',
            colSpan: 5,
            styles: { halign: 'left', fontStyle: 'bold', cellPadding: { left: 6, top: 6, right: 6, bottom: 6 } },
          },
          {
            content: `${allHorses.length} CABALLOS`,
            colSpan: 4,
            styles: { halign: 'center', fontStyle: 'bold' },
          },
        ]],
        footStyles: {
          fillColor: [38, 72, 131],
          textColor: [255, 255, 255],
        },
        didDrawPage: (data) => {
          const pageCount = doc.getNumberOfPages();
          doc.setFontSize(9);
          doc.text(
            `Pagina ${data.pageNumber} de ${pageCount}`,
            doc.internal.pageSize.getWidth() - 120,
            doc.internal.pageSize.getHeight() - 20
          );
        },
      });

      doc.save(`Caballos_Duenos_${dayjs().format('YYYYMMDD_HHmm')}.pdf`);
      toast.success('PDF generado.');
    } catch (e) {
      console.error(e);
      toast.error('No se pudo generar el PDF.');
    } finally {
      setExporting(false);
    }
  };

  
  // --- RENDER ---
  return (
    <div  className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
      <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">Gestión de Caballos</h1>
      
      <AdminSection>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold mb-4 text-[#bdab62]">Agregar Nuevo Caballo</h2>
        </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

      <div>
        <label className="block mb-1">Nombre del Caballo</label>
        <input
          type="text"
          value={newHorse.horseName}
          onChange={e => setNewHorse({ ...newHorse, horseName: e.target.value })}
          maxLength={120}
          className="w-full p-2 rounded-md bg-gray-700"
        />
      </div>

      <div>
        <label className="block mb-1">Fecha de Nacimiento</label>
        <input
          type="date"
          value={newHorse.birthdate}
          onChange={e => setNewHorse({ ...newHorse, birthdate: e.target.value })}
          className="w-full p-2 rounded-md bg-gray-700"
        />
      </div>

      <div>
        <label className="block mb-1">Sexo</label>
        <select
          value={newHorse.sex}
          onChange={e => setNewHorse({ ...newHorse, sex: e.target.value })}
          className="w-full p-2 rounded-md bg-gray-700"
        >
          <option value="">-- Selecciona --</option>
          <option value="Macho">Macho</option>
          <option value="Hembra">Hembra</option>
        </select>
      </div>

      <div>
        <label className="block mb-1">Color</label>
        <input
          type="text"
          value={newHorse.color}
          onChange={e => setNewHorse({ ...newHorse, color: e.target.value })}
          maxLength={80}
          className="w-full p-2 rounded-md bg-gray-700"
        />
      </div>

      <div>
        <label className="block mb-1">Descripción General</label>
        <input
          type="text"
          value={newHorse.generalDescription}
          onChange={e => setNewHorse({ ...newHorse, generalDescription: e.target.value })}
          maxLength={300}
          className="w-full p-2 rounded-md bg-gray-700"
        />
      </div>

      <div>
        <label className="block mb-1">Número de Pasaporte</label>
        <input
          type="number"
          value={newHorse.passportNumber === 0 ? '' : newHorse.passportNumber}
          onChange={e => setNewHorse({ ...newHorse, passportNumber: e.target.value === '' ? 0 : Number(e.target.value) })}
          className="w-full p-2 rounded-md bg-gray-700"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="block mb-2 text-sm font-medium text-slate-300">Opciones de Establo</label>
        <div className="grid grid-cols-3 gap-2">
          {([
            { key: 'box', label: 'Box' },
            { key: 'section', label: 'Sección' },
            { key: 'basket', label: 'Canasta' },
          ] as const).map(({ key, label }) => (
            <label
              key={key}
              className={`flex items-center justify-center gap-2 cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-200
                ${newHorse[key]
                  ? 'border-teal-400/70 bg-teal-500/15 text-teal-300 shadow-[0_0_8px_rgba(20,184,166,0.3)]'
                  : 'border-slate-600/60 bg-slate-800/50 text-slate-400 hover:border-slate-500'}`}
            >
              <input
                type="checkbox"
                className="hidden"
                checked={newHorse[key]}
                onChange={e => setNewHorse({ ...newHorse, [key]: e.target.checked })}
              />
              <span className={`h-2 w-2 rounded-full ${newHorse[key] ? 'bg-teal-400' : 'bg-slate-600'}`} />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block mb-1">Dueño</label>
        <select
          name="fk_idOwner"
          value={newHorse.fk_idOwner || ""}
          onChange={e => setNewHorse({ ...newHorse, fk_idOwner: Number(e.target.value) })}
          className="w-full p-2 rounded-md border border-gray-300 bg-white text-black"
        >
          <option value="">-- Selecciona un dueno --</option>
          {owners.map((o) => (
            <option key={o.idOwner} value={o.idOwner}>
              {o.name} {o.FirstName}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block mb-1">Raza</label>
        <select
          name="fk_idRace"
          value={newHorse.fk_idRace || ""}
          onChange={e => setNewHorse({ ...newHorse, fk_idRace: Number(e.target.value) })}
          className="w-full p-2 rounded-md border border-gray-300 bg-white text-black"
        >
          <option value="">-- Selecciona una raza --</option>
          {races.map((r) => (
            <option key={r.idRace} value={r.idRace}>
              {r.nameRace}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block mb-1">Plan Nutricional</label>
        <select
          name="fl_idNutritionalPlan"
          value={newHorse.fl_idNutritionalPlan || ''}
          onChange={e => setNewHorse({ ...newHorse, fl_idNutritionalPlan: Number(e.target.value) })}
          className="w-full p-2 rounded-md border border-gray-300 bg-white text-black"
        >
          <option value="">-- Selecciona un plan nutricional --</option>
          {nutritionalPlans.map((n) => (
            <option key={n.idNutritionalPlan} value={n.idNutritionalPlan}>
              {n.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="block mb-2 text-sm font-medium text-slate-300">Escuela</label>
        <label
          className={`flex items-center gap-3 cursor-pointer rounded-lg border px-4 py-2.5 text-sm font-medium transition-all duration-200
            ${newHorse.stateSchool
              ? 'border-fuchsia-400/70 bg-fuchsia-500/15 text-fuchsia-300 shadow-[0_0_8px_rgba(217,70,239,0.3)]'
              : 'border-slate-600/60 bg-slate-800/50 text-slate-400 hover:border-slate-500'}`}
        >
          <input
            type="checkbox"
            className="hidden"
            checked={newHorse.stateSchool}
            onChange={e => setNewHorse({ ...newHorse, stateSchool: e.target.checked })}
          />
          <span className={`h-2.5 w-2.5 rounded-full transition-all duration-200 ${newHorse.stateSchool ? 'bg-fuchsia-400 shadow-[0_0_6px_rgba(217,70,239,0.8)]' : 'bg-slate-600'}`} />
          Pertenece a escuela
        </label>
      </div>

      <div>
        <label className="block mb-1">Estado</label>
        <select
          required
          value={newHorse.state}
          onChange={e => setNewHorse({ ...newHorse, state: e.target.value })}
          className="w-full p-2 rounded-md border border-gray-300 bg-white text-black"
        >
          <option value="ACTIVO">ACTIVO</option>
          <option value="AUSENTE">AUSENTE</option>
          <option value="FALLECIDO">FALLECIDO</option>
        </select>
      </div>

      <div>
        <label className="block mb-1 text-sm font-medium text-slate-300">Foto del Caballo</label>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) applyFile(file);
          }}
          className={`rounded-xl border-2 border-dashed transition-all duration-200 ${dragOver ? 'border-[#167C79] bg-[#167C79]/15' : 'border-[#167C79]/40 bg-slate-800/60'}`}
        >
          {!(selectedPhotoFile && previewUrl) && (
            <div className="text-center cursor-pointer py-6 px-4" onClick={() => fileInputRef.current?.click()}>
              <button
                type="button"
                className="flex items-center gap-1.5 mx-auto rounded-lg bg-[#167C79]/20 border border-[#167C79]/50 px-4 py-2 text-sm font-medium text-teal-300 hover:bg-[#167C79]/30 transition-colors"
              >
                <Upload size={15} className="shrink-0" />
                Arrastra y suelta para subir
              </button>
            </div>
          )}
          {selectedPhotoFile && previewUrl && (
            <div className="px-4 pb-4 flex justify-center">
              <div className="w-full max-w-sm">
                <div className="rounded-xl border border-slate-600/50 bg-slate-800/80 p-3">
                <div className="flex items-center gap-3">
                  <img src={previewUrl} alt="preview" className="h-10 w-10 rounded-lg object-cover border border-slate-600/50 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#F8F4E3] truncate">{selectedPhotoFile.name}</p>
                    <p className="text-xs text-slate-400">{formatFileSize(selectedPhotoFile.size)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="text-slate-400 hover:text-teal-300 transition-colors">
                      <RotateCcw size={15} />
                    </button>
                    <button type="button" onClick={clearFile} className="text-slate-400 hover:text-red-400 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <div className="mt-2.5 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-75 ${
                        uploadProgress < 34
                          ? 'bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.8)]'
                          : uploadProgress < 67
                          ? 'bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.8)]'
                          : 'bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]'
                      }`}
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <span className={`text-xs shrink-0 w-12 text-right font-medium ${
                    uploadProgress < 34 ? 'text-rose-300' : uploadProgress < 67 ? 'text-amber-300' : 'text-emerald-300'
                  }`}>{uploadProgress} %</span>
                </div>
              </div>
            </div>
          </div>
          )}
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handlePhotoChange} className="hidden" />
        </div>
      </div>

    </div>

    <div className="mt-4 flex items-center justify-end gap-3">
      <ExportButton
        onClick={exportHorsesPDF}
        disabled={loading || exporting || allHorses.length === 0}
      >
        {exporting ? 'Exportando...' : 'Exportar PDF'}
      </ExportButton>
      <AddButton onClick={createHorse} />
    </div>
  </AdminSection>

      {/* Lista de caballos */}
      <AdminSection>
        <div className="flex justify-end mb-4">
          <div className="flex space-x-1">
            <button
              onClick={() => fetchHorses(Math.max(1, horsePage - 1))}
              disabled={horsePage === 1 || loading}
              className="rounded-full border border-[#3CC9F6]/50 py-2 px-3 text-center text-sm text-[#3CC9F6]/60 transition-all hover:border-[#3CC9F6]/80 hover:text-[#3CC9F6] hover:bg-[#3CC9F6]/10 disabled:pointer-events-none disabled:opacity-30 ml-2"
            >
              Prev
            </button>
            {pageNumbers.map(p => (
              <button
                key={p}
                onClick={() => fetchHorses(p)}
                disabled={loading}
                className={`min-w-9 rounded-full py-2 px-3.5 border text-center text-sm transition-all disabled:pointer-events-none disabled:opacity-30 ml-2 ${
                  p === horsePage
                    ? 'bg-[#3CC9F6]/15 border-[#3CC9F6]/70 text-[#3CC9F6] shadow-[0_0_14px_rgba(60,201,246,0.4)] ring-1 ring-[#3CC9F6]/20'
                    : 'border-[#3CC9F6]/40 text-[#3CC9F6]/60 hover:border-[#3CC9F6]/70 hover:text-[#3CC9F6] hover:bg-[#3CC9F6]/10'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => fetchHorses(horsePage + 1)}
              disabled={!horseHasNext || loading}
              className="rounded-full border border-[#3CC9F6]/50 py-2 px-3 text-center text-sm text-[#3CC9F6]/60 transition-all hover:border-[#3CC9F6]/80 hover:text-[#3CC9F6] hover:bg-[#3CC9F6]/10 disabled:pointer-events-none disabled:opacity-30 ml-2"
            >
              Next
            </button>
          </div>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: horsePageSize }).map((_, idx) => (
              <div key={idx} className="bg-gray-700 p-4 rounded-md shadow-lg animate-pulse space-y-3">
                <div className="w-full h-40 rounded-md bg-gray-600" />
                <div className="h-4 bg-gray-600 rounded w-3/4" />
                <div className="h-3 bg-gray-600 rounded w-1/2" />
                <div className="h-3 bg-gray-600 rounded w-2/3" />
                <div className="h-3 bg-gray-600 rounded w-1/3" />
                <div className="h-3 bg-gray-600 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pagedHorses.map(horse => (
              <div key={horse.idHorse} className="rounded-2xl border border-slate-600/70 bg-slate-700/80 p-4 shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-sm flex flex-col transition-transform duration-200 hover:-translate-y-1">
                <>
                  <div className="flex-grow mb-4">
                      <div className="relative mb-4 overflow-hidden rounded-xl">
                        <img src={horse.image_url ?? PLACEHOLDER} alt={`Foto de ${horse.horseName}`} className="w-full h-44 object-cover bg-gray-600" />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/65 via-transparent to-transparent" />
                        <div className="absolute bottom-2 left-2 flex items-center gap-2">
                          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-wider ${getStateBadgeClass(horse.state)}`}>
                            {horse.state}
                          </span>
                        </div>
                      </div>

                      <div className="mb-3">
                        <h3 className="text-2xl font-extrabold leading-tight text-[#F8F4E3]">{horse.horseName}</h3>
                        <p className="mt-1 text-xs uppercase tracking-wider text-slate-300/80">{getOwnerName(horse.fk_idOwner)}</p>
                      </div>

                      <div className="mb-3 grid grid-cols-2 gap-2 text-sm">
                        <div className="rounded-lg border border-slate-500/35 bg-slate-800/45 px-2.5 py-2">
                          <p className="text-[10px] uppercase tracking-wide text-slate-400">Nacimiento</p>
                          <p className="text-slate-200 font-semibold">{horse.birthdate?.slice(0, 10).split('-').reverse().join('/')}</p>
                        </div>
                        <div className="rounded-lg border border-slate-500/35 bg-slate-800/45 px-2.5 py-2">
                          <p className="text-[10px] uppercase tracking-wide text-slate-400">Pasaporte</p>
                          <p className="text-slate-200 font-semibold">{horse.passportNumber}</p>
                        </div>
                        <div className="rounded-lg border border-slate-500/35 bg-slate-800/45 px-2.5 py-2">
                          <p className="text-[10px] uppercase tracking-wide text-slate-400">Sexo</p>
                          <p className="text-slate-200 font-semibold">{horse.sex}</p>
                        </div>
                        <div className="rounded-lg border border-slate-500/35 bg-slate-800/45 px-2.5 py-2">
                          <p className="text-[10px] uppercase tracking-wide text-slate-400">Color</p>
                          <p className="text-slate-200 font-semibold">{horse.color}</p>
                        </div>
                        <div className="col-span-2 rounded-lg border border-slate-500/35 bg-slate-800/45 px-2.5 py-2">
                          <p className="text-[10px] uppercase tracking-wide text-slate-400">Raza</p>
                          <p className="text-slate-200 font-semibold">{getRaceName(horse.fk_idRace)}</p>
                        </div>
                      </div>

                      <div className="mb-3 flex flex-wrap gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${horse.box ? 'bg-cyan-500/20 text-cyan-200' : 'bg-slate-800 text-slate-400'}`}>
                          Box: {boolTxt(horse.box)}
                        </span>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${horse.section ? 'bg-cyan-500/20 text-cyan-200' : 'bg-slate-800 text-slate-400'}`}>
                          Seccion: {boolTxt(horse.section)}
                        </span>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${horse.basket ? 'bg-cyan-500/20 text-cyan-200' : 'bg-slate-800 text-slate-400'}`}>
                          Canasta: {boolTxt(horse.basket)}
                        </span>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${horse.stateSchool ? 'bg-fuchsia-500/20 text-fuchsia-200' : 'bg-slate-800 text-slate-400'}`}>
                          Escuela: {boolTxt(horse.stateSchool)}
                        </span>
                      </div>

                      {horse.generalDescription && (
                        <div className="rounded-xl border border-slate-500/40 bg-slate-800/50 px-3 py-2">
                          <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">Descripcion</p>
                          <p className="text-sm text-slate-200 leading-relaxed">{horse.generalDescription}</p>
                        </div>
                      )}
                  </div>
                  <div className="flex items-center justify-end gap-3 border-t border-slate-500/35 pt-3">
                    <button onClick={() => handleEditClick(horse)} 
                      title="Editar"
                      className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-300/25
                                  bg-gradient-to-b from-[#1A1C1E] to-[#0E0F10]
                                  shadow-[8px_8px_16px_rgba(0,0,0,0.85),-5px_-5px_12px_rgba(255,255,255,0.06)]
                                  hover:scale-[1.06] hover:border-amber-300/60
                                  active:shadow-[inset_5px_5px_12px_rgba(0,0,0,0.9),inset_-4px_-4px_10px_rgba(255,255,255,0.05)]
                                  transition-all duration-300 ease-in-out"
                    >
                      <Edit size={24} className="text-[#E8C967] drop-shadow-[0_0_10px_rgba(255,215,100,0.85)] transition-transform duration-300 hover:rotate-3" />
                    </button>
                    <button onClick={() => deleteHorse(horse.idHorse!)} 
                      title="Eliminar"
                      className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-red-300/25
                                bg-gradient-to-b from-[#1A1C1E] to-[#0E0F10]
                                shadow-[8px_8px_16px_rgba(0,0,0,0.85),-5px_-5px_12px_rgba(255,255,255,0.06)]
                                hover:scale-[1.06] hover:border-red-300/60
                                active:shadow-[inset_5px_5px_12px_rgba(0,0,0,0.9),inset_-4px_-4px_10px_rgba(255,255,255,0.05)]
                                transition-all duration-300 ease-in-out"
                    >
                        <Trash2 size={24} className="text-[#E86B6B] drop-shadow-[0_0_12px_rgba(255,80,80,0.9)] transition-transform duration-300 hover:-rotate-3" />
                    </button>
                  </div>
                </>
              </div>
            ))}
          </div>
        )}

        {editingId !== null && editingHorseData && createPortal(
          <div
            className="fixed inset-0 lg:left-80 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={handleCancelEdit}
          >
            <div
              className="w-full max-w-4xl max-h-[95vh] overflow-y-auto rounded-2xl border border-[#167C79]/60 bg-[#0f172a] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.6)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-[#F8F4E3]">Editar Caballo</h3>
                  <p className="text-sm text-slate-400">Actualiza los datos con mejor espacio y visibilidad.</p>
                </div>
                <button onClick={handleCancelEdit} className="rounded-lg border border-slate-500 px-3 py-1.5 text-slate-300 hover:bg-slate-800">
                  Cerrar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block mb-1">Nombre del Caballo</label>
                  <input type="text" value={editingHorseData.horseName} onChange={e => setEditingHorseData({ ...editingHorseData, horseName: e.target.value })} maxLength={120} className="w-full p-2 rounded-md bg-gray-700" />
                </div>
                <div>
                  <label className="block mb-1">Fecha de Nacimiento</label>
                  <input type="date" value={editingHorseData.birthdate?.slice(0, 10)} onChange={e => setEditingHorseData({ ...editingHorseData, birthdate: e.target.value })} className="w-full p-2 rounded-md bg-gray-700" />
                </div>
                <div>
                  <label className="block mb-1">Sexo</label>
                  <select value={editingHorseData.sex} onChange={e => setEditingHorseData({ ...editingHorseData, sex: e.target.value })} className="w-full p-2 rounded-md bg-gray-700">
                    <option value="">-- Selecciona --</option>
                    <option value="Macho">Macho</option>
                    <option value="Hembra">Hembra</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1">Color</label>
                  <input type="text" value={editingHorseData.color} onChange={e => setEditingHorseData({ ...editingHorseData, color: e.target.value })} maxLength={80} className="w-full p-2 rounded-md bg-gray-700" />
                </div>
                <div>
                  <label className="block mb-1">Numero de Pasaporte</label>
                  <input type="number" value={editingHorseData.passportNumber === 0 ? '' : editingHorseData.passportNumber} onChange={e => setEditingHorseData({ ...editingHorseData, passportNumber: e.target.value === '' ? 0 : Number(e.target.value) })} className="w-full p-2 rounded-md bg-gray-700" />
                </div>
                <div>
                  <label className="block mb-1">Estado</label>
                  <select
                    required
                    value={editingHorseData.state}
                    onChange={e => setEditingHorseData({ ...editingHorseData, state: e.target.value })}
                    className="w-full p-2 rounded-md border border-gray-300 bg-white text-black"
                  >
                    <option value="ACTIVO">ACTIVO</option>
                    <option value="AUSENTE">AUSENTE</option>
                    <option value="FALLECIDO">FALLECIDO</option>
                  </select>
                </div>
                <div className="lg:col-span-3">
                  <label className="block mb-1">Descripcion General</label>
                  <input type="text" value={editingHorseData.generalDescription} onChange={e => setEditingHorseData({ ...editingHorseData, generalDescription: e.target.value })} maxLength={300} className="w-full p-2 rounded-md bg-gray-700" />
                </div>
                <div>
                  <label className="block mb-1">Dueño</label>
                  <select
                    name="fk_idOwner"
                    value={editingHorseData.fk_idOwner || ""}
                    onChange={e => setEditingHorseData({ ...editingHorseData, fk_idOwner: Number(e.target.value) })}
                    className="w-full p-2 rounded-md border border-gray-300 bg-white text-black"
                  >
                    <option value="">-- Selecciona un dueno --</option>
                    {owners.map((o) => (
                      <option key={o.idOwner} value={o.idOwner}>
                        {o.name} {o.FirstName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1">Raza</label>
                  <select
                    name="fk_idRace"
                    value={editingHorseData.fk_idRace || ""}
                    onChange={e => setEditingHorseData({ ...editingHorseData, fk_idRace: Number(e.target.value) })}
                    className="w-full p-2 rounded-md border border-gray-300 bg-white text-black"
                  >
                    <option value="">-- Selecciona una raza --</option>
                    {races.map((r) => (
                      <option key={r.idRace} value={r.idRace}>
                        {r.nameRace}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1">Plan Nutricional</label>
                  <select
                    name="fl_idNutritionalPlan"
                    value={editingHorseData.fl_idNutritionalPlan || ''}
                    onChange={e => setEditingHorseData({ ...editingHorseData, fl_idNutritionalPlan: Number(e.target.value) })}
                    className="w-full p-2 rounded-md border border-gray-300 bg-white text-black"
                  >
                    <option value="">-- Selecciona un plan nutricional --</option>
                    {nutritionalPlans.map((n) => (
                      <option key={n.idNutritionalPlan} value={n.idNutritionalPlan}>
                        {n.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="lg:col-span-1 flex flex-col gap-2">
                  <label className="block text-sm font-medium text-slate-300">Escuela</label>
                  <label
                    className={`flex items-center gap-3 cursor-pointer rounded-lg border px-4 py-2.5 text-sm font-medium transition-all duration-200
                      ${editingHorseData.stateSchool
                        ? 'border-fuchsia-400/70 bg-fuchsia-500/15 text-fuchsia-300 shadow-[0_0_8px_rgba(217,70,239,0.3)]'
                        : 'border-slate-600/60 bg-slate-800/50 text-slate-400 hover:border-slate-500'}`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={editingHorseData.stateSchool}
                      onChange={e => setEditingHorseData({ ...editingHorseData, stateSchool: e.target.checked })}
                    />
                    <span className={`h-2.5 w-2.5 rounded-full transition-all duration-200 ${editingHorseData.stateSchool ? 'bg-fuchsia-400 shadow-[0_0_6px_rgba(217,70,239,0.8)]' : 'bg-slate-600'}`} />
                    Pertenece a escuela
                  </label>
                </div>
                <div className="lg:col-span-2">
                  <label className="block mb-1 text-sm font-medium text-slate-300">Foto del Caballo</label>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setEditDragOver(true); }}
                    onDragLeave={() => setEditDragOver(false)}
                    onDrop={(e) => { e.preventDefault(); setEditDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) applyEditFile(f); }}
                    className={`rounded-xl border-2 border-dashed transition-all duration-200 ${editDragOver ? 'border-[#167C79] bg-[#167C79]/15' : 'border-[#167C79]/40 bg-slate-800/60'}`}
                  >
                    {!editPhotoFile && (
                      <div className="text-center cursor-pointer py-6 px-4" onClick={() => editFileInputRef.current?.click()}>
                        <button type="button" className="flex items-center gap-1.5 mx-auto rounded-lg bg-[#167C79]/20 border border-[#167C79]/50 px-4 py-2 text-sm font-medium text-teal-300 hover:bg-[#167C79]/30 transition-colors">
                          <Upload size={15} className="shrink-0" />
                          Arrastra y suelta para subir
                        </button>
                      </div>
                    )}
                    {editPhotoFile && (
                      <div className="mx-4 my-3 flex items-center gap-3 rounded-xl border border-slate-600/50 bg-slate-800/80 px-3 py-2.5">
                        <span className="text-sm font-medium text-[#F8F4E3] truncate flex-1">{editPhotoFile.name}</span>
                        <button type="button" onClick={() => editFileInputRef.current?.click()} className="text-slate-400 hover:text-teal-300 transition-colors shrink-0"><RotateCcw size={15} /></button>
                        <button type="button" onClick={clearEditFile} className="text-slate-400 hover:text-red-400 transition-colors shrink-0"><Trash2 size={15} /></button>
                      </div>
                    )}
                    <input type="file" accept="image/*" ref={editFileInputRef} onChange={e => { const f = e.target.files?.[0]; if (f) applyEditFile(f); }} className="hidden" />
                  </div>
                </div>
                <div className="lg:col-span-3 flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={editingHorseData.box} onChange={e => setEditingHorseData({ ...editingHorseData, box: e.target.checked })} />
                    Box
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={editingHorseData.section} onChange={e => setEditingHorseData({ ...editingHorseData, section: e.target.checked })} />
                    Seccion
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={editingHorseData.basket} onChange={e => setEditingHorseData({ ...editingHorseData, basket: e.target.checked })} />
                    Canasta
                  </label>
                </div>
                {(editingHorseData?.image_url || editPhotoFile) && (
                  <div className="lg:col-span-3">
                    <img
                      src={editPhotoFile ? URL.createObjectURL(editPhotoFile) : editingHorseData.image_url ?? PLACEHOLDER}
                      alt="Vista previa"
                      className="w-full h-44 rounded-xl object-cover border border-slate-600"
                    />
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-700 pt-4">
                <CancelButton onClick={handleCancelEdit} />
                <SaveButton onClick={() => updateHorse(editingId)} children="Guardar cambios" />
              </div>
            </div>
          </div>,
          document.body
        )}
        {!loading && null}
      </AdminSection>
    </div>
  );
};

export default HorsesManagement;

