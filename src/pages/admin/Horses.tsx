import React, { useState, useEffect, useRef, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Save, Trash2, Loader, X } from 'lucide-react';
import { decodeBackendImage, encodeImageForBackend } from '../../utils/imageHelpers'; // CAMBIO: Importamos la función encodeImageForBackend
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import dayjs from 'dayjs';

// URL de tu API backend
const API_URL = 'https://backend-country-nnxe.onrender.com/horses/'; 

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
  horsePhoto?: string | null;
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
  horsePhoto: null,
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

// --- COMPONENTE ---
const HorsesManagement = () => {
  // --- ESTADOS ---
  const [owners, setOwners] = useState<any[]>([]);
  const [races, setRaces] = useState<any[]>([]);
  const [nutritionalPlans, setNutritionalPlans] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [horses, setHorses] = useState<Horse[]>([]);
  const [newHorse, setNewHorse] = useState<Omit<Horse, 'idHorse'>>({ ...initialHorse });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingHorseData, setEditingHorseData] = useState<Horse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null); // CAMBIO: Nuevo estado para guardar el archivo de la foto

  // PDF state
  const [exporting, setExporting] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);

  useEffect(() => {
    // carga logo opcional
    urlToDataUrl(LOGO_URL).then(setLogoDataUrl).catch(() => setLogoDataUrl(null));
  }, []);

  // --- EFECTOS ---
  useEffect(() => {
    fetchHorses();
    fetchOwners();
    fetchRaces();
    fetchNutritionalPlans();
  }, []);

  const fetchOwners = async () => {
    try {
      const res = await fetch('https://backend-country-nnxe.onrender.com/owner/');
      const data = await res.json();
      setOwners(data);
    } catch (err) {
      toast.error('Error cargando dueños');
    }
  };

  const fetchRaces = async () => {
    try {
      const res = await fetch('https://backend-country-nnxe.onrender.com/race/');
      const data = await res.json();
      setRaces(data);
    } catch (err) {
      toast.error('Error cargando razas');
    }
  };

  const fetchNutritionalPlans = async () => {
    try {
      const res = await fetch('https://backend-country-nnxe.onrender.com/nutritional-plans/');
      const data = await res.json();
      setNutritionalPlans(data);
    } catch (err) {
      toast.error('Error cargando planes nutricionales');
    }
  };

  // --- FUNCIONES API ---
  const fetchHorses = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al obtener los caballos');
      const data = await res.json();
      setHorses(data);
    } catch (error) {
      toast.error('No se pudo cargar la lista de caballos.');
    } finally {
      setLoading(false);
    }
  };

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });

  const handlePhotoChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    mode: 'create' | 'edit' = 'create'
  ) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setSelectedPhotoFile(file); // CAMBIO: Guardamos el archivo en el nuevo estado
      if (mode === 'create') {
        // En modo 'create' también podemos mostrar una vista previa si lo deseamos.
        const base64 = await toBase64(file);
        setNewHorse(prev => ({ ...prev, horsePhoto: base64 }));
      } else {
        const base64 = await toBase64(file);
        editingHorseData && setEditingHorseData({ ...editingHorseData, horsePhoto: base64 });
      }
    }
  };

  const createHorse = async () => {
    if (!newHorse.horseName || !newHorse.birthdate || !newHorse.sex || !newHorse.color) {
      toast.error('Completa los campos obligatorios (Nombre, Fecha, Sexo, Color).');
      return;
    }
    if (!newHorse.state) {
      toast.error('Selecciona el estado.');
      return;
    }
    if (typeof newHorse.stateSchool !== 'boolean') { 
      toast.error('Indica si pertenece a escuela.'); return; 
    }

    try {
      // CAMBIO: Preparamos la foto para el backend
      let photoForBackend: string | null = null;
      if (selectedPhotoFile) {
        const base64Full = await toBase64(selectedPhotoFile);
        photoForBackend = encodeImageForBackend(base64Full);
      }

      const horseData = {
        horseName: newHorse.horseName,
        horsePhoto: photoForBackend, // CAMBIO: Usamos el formato binario
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

      console.log("📤 Enviando nuevo caballo (con formato binario):", horseData);

      const res = await fetch("https://backend-country-nnxe.onrender.com/horses/", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(horseData),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Error del servidor: ${errorText}`);
      }

      toast.success("¡Caballo creado exitosamente!");

      // Reset form
      setNewHorse({ ...initialHorse });
      setSelectedPhotoFile(null); // CAMBIO: Resetear el estado del archivo
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      fetchHorses();
    } catch (error: any) {
      console.error("❌ Error al crear caballo:", error);
      toast.error(`Error al crear caballo: ${error.message}`);
    }
  };


  const updateHorse = async (id: number) => {
    if (!editingHorseData) return;
    console.log("✏️ Actualizando caballo con ID:", id);
    console.log("📤 Datos actualizados:", editingHorseData);
    if (!editingHorseData.state) {
      toast.error('Selecciona el estado.');
      return;
    }
    if (!editingHorseData.stateSchool) {
      toast.error('Selecciona el estado de escuela.');
      return;
    }
    try {
      // CAMBIO: Preparamos la foto para el backend si se seleccionó una nueva
      let photoForBackend: string | null | undefined = undefined; // undefined para no actualizar si no hay cambio
      if (selectedPhotoFile) {
        const base64Full = await toBase64(selectedPhotoFile);
        photoForBackend = encodeImageForBackend(base64Full);
      } else if (editingHorseData.horsePhoto === null) {
        photoForBackend = null; // Si el usuario borró la foto
      }

      const horseDataToUpdate = {
        ...editingHorseData,
        fk_idOwner: Number(editingHorseData.fk_idOwner),
        fk_idRace: Number(editingHorseData.fk_idRace),
        fl_idNutritionalPlan: Number(editingHorseData.fl_idNutritionalPlan),
        passportNumber: Number(editingHorseData.passportNumber),
        box: Boolean(editingHorseData.box),
        section: Boolean(editingHorseData.section),
        basket: Boolean(editingHorseData.basket),
        state: editingHorseData.state,
        stateSchool: Boolean(editingHorseData.stateSchool),
        ...(photoForBackend !== undefined && { horsePhoto: photoForBackend }) // CAMBIO: Solo incluye horsePhoto si hay un cambio
      };

      const res = await fetch(`${API_URL}${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(horseDataToUpdate),
      });
      if (!res.ok) throw new Error('Error al actualizar el caballo');
      toast.success('¡Caballo actualizado!');
      setEditingId(null);
      setEditingHorseData(null);
      setSelectedPhotoFile(null); // CAMBIO: Resetear el estado del archivo
      fetchHorses();
    } catch (error) {
      toast.error('No se pudo actualizar el caballo.');
    }
  };


  const deleteHorse = async (id: number) => {
    if (!window.confirm('¿Seguro quieres eliminar este caballo?')) return;
    try {
      const res = await fetch(`${API_URL}${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar el caballo');
      toast.success('¡Caballo eliminado!');
      fetchHorses();
    } catch (error) {
      toast.error('No se pudo eliminar el caballo.');
    }
  };

  const handleEditClick = (horse: Horse) => {
    console.log("🛠️ Entrando en modo edición con caballo:", horse);
    setEditingId(horse.idHorse!);
    setEditingHorseData({ ...horse });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingHorseData(null);
  };

  // Helpers
  const getOwnerName = (id: number) => {
    const o = owners.find((x) => x.idOwner === id);
    return o ? `${o.name ?? ''} ${o.FirstName ?? ''}`.trim() || String(id) : String(id);
  };
  const boolTxt = (b: boolean) => (b ? 'Sí' : 'No');

  // Total caballos (para mostrar y PDF)
  const totalCaballos = useMemo(() => horses.length, [horses]);

  // Exportar PDF Diseño
  const exportHorsesPDF = async () => {
    try {
      setExporting(true);
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt' });

      // LOGO (opcional)
      try {
        if (logoDataUrl) {
          const margin = 40;
          const w = 120;
          const h = 70;
          const pageW = doc.internal.pageSize.getWidth();
          const x = pageW - w - margin;
          const y = 20;
          doc.addImage(logoDataUrl, 'PNG', x, y, w, h);
        }
      } catch (e) {
        console.warn('No se pudo dibujar el logo:', e);
      }

      const titulo = 'Reporte de Caballos y Dueños';
      const now = dayjs().format('YYYY-MM-DD HH:mm');

      // Título centrado
      const pageW = doc.internal.pageSize.getWidth();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(titulo, pageW / 2, 50, { align: 'center' });

      // Subtítulos
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Generado: ${now}`, 40, 70);

      // Tabla
      const body = horses.map(h => ([
        h.horseName,
        getOwnerName(h.fk_idOwner),
        h.birthdate ? new Date(h.birthdate).toLocaleDateString() : '',
        h.sex,
        h.color,
        String(h.passportNumber ?? ''),
        boolTxt(h.box),
        boolTxt(h.section),
        boolTxt(h.basket),
      ]));

      autoTable(doc, {
        startY: 110,
        theme: 'striped',
        head: [['Caballo','Dueño','Nacimiento','Sexo','Color','Pasaporte','Box','Sección','Canasta']],
        body,
        styles: { fontSize: 9, cellPadding: 6 }, // cuerpo blanco por defecto
        headStyles: {
          fillColor: [38, 72, 131], // #264883
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },

        // Pie “TOTAL … CABALLOS”
        foot: [[
          {
            content: 'TOTAL',
            colSpan: 5,
            styles: {
              halign: 'left', // a la izquierda
              fontStyle: 'bold',
              cellPadding: { left: 6, top: 6, right: 6, bottom: 6 }
            }
          },
          {
            content: `${totalCaballos} CABALLOS`,
            colSpan: 4,
            styles: { halign: 'center', fontStyle: 'bold' }
          },
        ]],
        footStyles: {
          fillColor: [38, 72, 131], // #264883
          textColor: [255, 255, 255],
        },

        didDrawPage: (data) => {
          const pageCount = doc.getNumberOfPages();
          doc.setFontSize(9);
          doc.text(
            `Página ${data.pageNumber} de ${pageCount}`,
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
    <div className="bg-slate-900 p-6 rounded-lg shadow-xl mb-8 border border-slate-700">
      <h1 className="text-3xl font-bold mb-6 text-center">Gestión de Caballos</h1>

      <div className="bg-slate-800 p-6 rounded-lg shadow-xl mb-8 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Agregar Nuevo Caballo</h2>
          <button
            onClick={exportHorsesPDF}
            disabled={loading || exporting || horses.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white 
                      px-6 py-3 text-lg rounded-xl font-semibold shadow-md
                      hover:shadow-lg transition"
            title="Generar PDF de caballos y dueños"
          >
            {exporting ? 'Exportando...' : 'Exportar PDF'}
          </button>
        </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

      <div>
        <label className="block mb-1">Nombre del Caballo</label>
        <input
          type="text"
          value={newHorse.horseName}
          onChange={e => setNewHorse({ ...newHorse, horseName: e.target.value })}
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
        <input
          type="text"
          value={newHorse.sex}
          onChange={e => setNewHorse({ ...newHorse, sex: e.target.value })}
          className="w-full p-2 rounded-md bg-gray-700"
        />
      </div>

      <div>
        <label className="block mb-1">Color</label>
        <input
          type="text"
          value={newHorse.color}
          onChange={e => setNewHorse({ ...newHorse, color: e.target.value })}
          className="w-full p-2 rounded-md bg-gray-700"
        />
      </div>

      <div>
        <label className="block mb-1">Descripción General</label>
        <input
          type="text"
          value={newHorse.generalDescription}
          onChange={e => setNewHorse({ ...newHorse, generalDescription: e.target.value })}
          className="w-full p-2 rounded-md bg-gray-700"
        />
      </div>

      <div>
        <label className="block mb-1">Número de Pasaporte</label>
        <input
          type="number"
          value={newHorse.passportNumber}
          onChange={e => setNewHorse({ ...newHorse, passportNumber: Number(e.target.value) })}
          className="w-full p-2 rounded-md bg-gray-700"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="block">Opciones de Establo</label>
        <div className="flex items-center gap-2">
          <label>
            <input
              type="checkbox"
              checked={newHorse.box}
              onChange={e => setNewHorse({ ...newHorse, box: e.target.checked })}
            />
            <span className="ml-2">Box</span>
          </label>
          <label>
            <input
              type="checkbox"
              checked={newHorse.section}
              onChange={e => setNewHorse({ ...newHorse, section: e.target.checked })}
            />
            <span className="ml-2">Sección</span>
          </label>
          <label>
            <input
              type="checkbox"
              checked={newHorse.basket}
              onChange={e => setNewHorse({ ...newHorse, basket: e.target.checked })}
            />
            <span className="ml-2">Canasta</span>
          </label>
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
          <option value="">-- Selecciona un dueño --</option>
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

      <div>
        <label className="block mb-1">Foto del Caballo</label>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={(e) => handlePhotoChange(e, "create")}
          className="w-full p-1.5 rounded-md bg-gray-700 file:mr-4 file:py-2 file:px-4 
                    file:rounded-full file:border-0 file:text-sm file:font-semibold 
                    file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
        />
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

      <div className="flex items-center gap-2">
        <input
          id="stateSchool"
          type="checkbox"
          checked={newHorse.stateSchool}
          onChange={e => setNewHorse({ ...newHorse, stateSchool: e.target.checked })}
        />
        <label htmlFor="stateSchool">Pertenece a escuela</label>
      </div>

    </div>

    <div className="mt-4 text-right">
      <button
        onClick={createHorse}
        className="bg-green-600 hover:bg-green-700 text-white p-2 px-4 rounded-md font-semibold flex items-center gap-2 inline-flex"
      >
        <Plus size={20} /> Agregar
      </button>
    </div>

    {/* Resumen + Botón PDF */}
    <div className="flex items-center gap-4">
      <span className="text-base bg-gray-700 px-4 py-2 rounded-lg">
        Total caballos: <b>{totalCaballos}</b>
      </span>
    </div>
  </div>

      {/* Lista de caballos */}
      <div className="bg-slate-800 p-6 rounded-lg shadow-xl mb-8 border border-slate-700">
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            <Loader size={24} className="animate-spin" />Cargando caballos...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {horses.map(horse => (
              <div key={horse.idHorse} className="bg-gray-700 p-4 rounded-md shadow-lg flex flex-col">
                {editingId === horse.idHorse && editingHorseData ? (
                  <>
                    <div className="flex-grow space-y-2 mb-4">
                      <input type="text" value={editingHorseData.horseName} onChange={e => setEditingHorseData({ ...editingHorseData, horseName: e.target.value })} className="w-full p-2 rounded-md bg-gray-600" />
                      <input type="date" value={editingHorseData.birthdate?.slice(0, 10)} onChange={e => setEditingHorseData({ ...editingHorseData, birthdate: e.target.value })} className="w-full p-2 rounded-md bg-gray-600" />
                      <input type="text" value={editingHorseData.sex} onChange={e => setEditingHorseData({ ...editingHorseData, sex: e.target.value })} className="w-full p-2 rounded-md bg-gray-600" />
                      <input type="text" value={editingHorseData.color} onChange={e => setEditingHorseData({ ...editingHorseData, color: e.target.value })} className="w-full p-2 rounded-md bg-gray-600" />
                      <input type="text" value={editingHorseData.generalDescription} onChange={e => setEditingHorseData({ ...editingHorseData, generalDescription: e.target.value })} className="w-full p-2 rounded-md bg-gray-600" />
                      <input type="number" value={editingHorseData.passportNumber} onChange={e => setEditingHorseData({ ...editingHorseData, passportNumber: Number(e.target.value) })} className="w-full p-2 rounded-md bg-gray-600" />
                      <div className="flex items-center gap-2">
                        <label>
                          <input type="checkbox" checked={editingHorseData.box} onChange={e => setEditingHorseData({ ...editingHorseData, box: e.target.checked })} />
                          <span className="ml-2">Box</span>
                        </label>
                        <label>
                          <input type="checkbox" checked={editingHorseData.section} onChange={e => setEditingHorseData({ ...editingHorseData, section: e.target.checked })} />
                          <span className="ml-2">Sección</span>
                        </label>
                        <label>
                          <input type="checkbox" checked={editingHorseData.basket} onChange={e => setEditingHorseData({ ...editingHorseData, basket: e.target.checked })} />
                          <span className="ml-2">Canasta</span>
                        </label>
                      </div>
                      <select
                        name="fk_idOwner"
                        value={editingHorseData.fk_idOwner || ""}
                        onChange={e => setEditingHorseData({ ...editingHorseData, fk_idOwner: Number(e.target.value) })}
                        className="w-full p-2 rounded-md border border-gray-300 bg-white text-black"
                      >
                        <option value="">-- Selecciona un dueño --</option>
                        {owners.map((o) => (
                          <option key={o.idOwner} value={o.idOwner}>
                            {o.name} {o.FirstName}
                          </option>
                        ))}
                      </select>
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
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={(e) => handlePhotoChange(e, "edit")}
                        className="w-full p-1.5 rounded-md bg-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                      />

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

                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editingHorseData.stateSchool}
                          onChange={e => setEditingHorseData({ ...editingHorseData, stateSchool: e.target.checked })}
                        />
                        Pertenece a escuela
                      </label>

                      {/* Barra TOTAL al final de la lista */}
                      <div className="mt-6 grid grid-cols-2 rounded-md bg-amber-100 text-amber-900 font-extrabold text-lg">
                        <div className="py-3 text-center tracking-wide">TOTAL</div>
                        <div className="py-3 text-center tracking-wide">
                          {totalCaballos} CABALLOS
                        </div>
                      </div>

                    </div>

                    <div className="flex justify-end gap-2">
                      <button onClick={() => updateHorse(horse.idHorse!)} className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md flex items-center gap-1"><Save size={16} /> Guardar</button>
                      <button onClick={handleCancelEdit} className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded-md flex items-center gap-1"><X size={16} /> Cancelar</button>
                    </div>

                  </>
                ) : (
                  <>
                    <div className="flex-grow mb-4">
                      <img src={decodeBackendImage(horse.horsePhoto) || 'https://placehold.co/100x100/4a5568/ffffff?text=Sin+Foto'} alt={`Foto de ${horse.horseName}`} className="w-full h-40 rounded-md object-cover mb-4 bg-gray-600" />
                      <h3 className="text-xl font-bold">{horse.horseName}</h3>
                      <p className="text-sm text-gray-300">Nacimiento: {new Date(horse.birthdate).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-300">Sexo: {horse.sex}</p>
                      <p className="text-sm text-gray-300">Color: {horse.color}</p>
                      <p className="text-sm text-gray-300">N° Pasaporte: {horse.passportNumber}</p>
                      <p className="text-sm text-gray-300">Box: {horse.box ? 'Sí' : 'No'} | Sección: {horse.section ? 'Sí' : 'No'} | Canasta: {horse.basket ? 'Sí' : 'No'}</p>
                      {horse.generalDescription && <p className="mt-2 text-gray-400 text-sm">{horse.generalDescription}</p>}
                      <p className="text-sm text-gray-300">Estado: {horse.state}</p>
                      <p className="text-sm text-gray-300">Escuela: {horse.stateSchool ? 'Sí' : 'No'}</p>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleEditClick(horse)} className="bg-yellow-600 hover:bg-yellow-700 text-white p-2 rounded-md flex items-center gap-1"><Edit size={16} /> Editar</button>
                      <button onClick={() => deleteHorse(horse.idHorse!)} className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-md flex items-center gap-1"><Trash2 size={16} /> Eliminar</button>
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

export default HorsesManagement;