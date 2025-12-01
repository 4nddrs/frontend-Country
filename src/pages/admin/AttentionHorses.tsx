import { useState, useEffect, useMemo } from 'react';
import type { ChangeEvent } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Save, Trash2, Loader, X, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import dayjs from 'dayjs';

const BASE_URL = 'http://82.25.66.67:8000';
const API_URL = `${BASE_URL}/attention_horses/`;

interface AttentionHorse {
  idAttentionHorse?: number;
  date: string;
  dose: string;
  cost: number | string;
  description: string;
  fk_idHorse: number;
  fk_idMedicine?: number | null;
  fk_idEmployee: number;
  created_at?: string;
}

interface Horse {
  idHorse: number;
  horseName: string;
}

interface Medicine {
  idMedicine: number;
  name: string;
}

interface Employee {
  idEmployee: number;
  fullName: string;
}

interface AttentionHorseForm {
  date: string;
  dose: string;
  cost: string;
  description: string;
  fk_idHorse: number;
  fk_idMedicine: number | '';
  fk_idEmployee: number;
}

const createEmptyForm = (): AttentionHorseForm => ({
  date: '',
  dose: '',
  cost: '',
  description: '',
  fk_idHorse: 0,
  fk_idMedicine: '',
  fk_idEmployee: 0,
});

const sanitizeCostInput = (value: string) => {
  let sanitized = value.replace(/[^0-9.,]/g, '');
  const commaIndex = sanitized.indexOf(',');
  if (commaIndex !== -1) {
    const beforeComma = sanitized.slice(0, commaIndex + 1);
    const afterComma = sanitized.slice(commaIndex + 1).replace(/,/g, '');
    sanitized = beforeComma + afterComma;
  }
  return sanitized;
};

const parseCostForSubmit = (value: string) => {
  if (!value.trim()) {
    return null;
  }
  const normalized = value.replace(/\./g, '').replace(',', '.');
  if (!normalized.trim()) {
    return null;
  }
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : null;
};

const formatCostForDisplay = (value: number | string | null | undefined) => {
  if (value === null || value === undefined) {
    return '';
  }
  const numeric =
    typeof value === 'number'
      ? value
      : Number(value.toString().replace(/\./g, '').replace(',', '.'));
  if (!Number.isFinite(numeric)) {
    return '';
  }
  return new Intl.NumberFormat('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numeric);
};

const normalizeDateValue = (value: string | undefined) => (value ? value.slice(0, 10) : '');

const formatDateForDisplay = (value: string | undefined) => {
  const normalized = normalizeDateValue(value);
  if (!normalized) {
    return 'N/A';
  }
  const [yearStr, monthStr, dayStr] = normalized.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)) {
    const parsed = new Date(year, month - 1, day);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('es-BO');
    }
  }
  return normalized;
};

const mapAttentionToForm = (attention: AttentionHorse): AttentionHorseForm => {
  const costFormatted = formatCostForDisplay(attention.cost);
  const rawCost =
    costFormatted ||
    (typeof attention.cost === 'string' ? attention.cost : attention.cost?.toString() || '');
  return {
    date: attention.date ? attention.date.slice(0, 10) : '',
    dose: attention.dose || '',
    cost: sanitizeCostInput(rawCost),
    description: attention.description || '',
    fk_idHorse: attention.fk_idHorse,
    fk_idMedicine: attention.fk_idMedicine ?? '',
    fk_idEmployee: attention.fk_idEmployee,
  };
};

const AttentionHorsesManagement = () => {
  const [attentions, setAttentions] = useState<AttentionHorse[]>([]);
  const [newAttention, setNewAttention] = useState<AttentionHorseForm>(() => createEmptyForm());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [horses, setHorses] = useState<Horse[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filterHorse, setFilterHorse] = useState<number>(0);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [exporting, setExporting] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);

  const getNumericCost = (value: AttentionHorse['cost']) => {
    if (typeof value === 'number') {
      return value;
    }
    if (!value) {
      return 0;
    }
    const parsed = parseCostForSubmit(value);
    return parsed ?? 0;
  };

  const filteredAttentions = useMemo(() => {
    return attentions.filter(attention => {
      if (filterHorse && attention.fk_idHorse !== filterHorse) {
        return false;
      }
      const attentionDate = normalizeDateValue(attention.date);
      if (filterStartDate && attentionDate < filterStartDate) {
        return false;
      }
      if (filterEndDate && attentionDate > filterEndDate) {
        return false;
      }
      return true;
    });
  }, [attentions, filterHorse, filterStartDate, filterEndDate]);

  const totalFilteredCost = useMemo(
    () => filteredAttentions.reduce((sum, attention) => sum + getNumericCost(attention.cost), 0),
    [filteredAttentions],
  );

  const fetchHorses = async () => {
    try {
      const res = await fetch(`${BASE_URL}/horses/`);
      if (!res.ok) {
        throw new Error('Error al obtener caballos');
      }
      const data = await res.json();
      setHorses(Array.isArray(data) ? data : []);
    } catch {
      toast.error('No se pudieron cargar caballos');
    }
  };

  const fetchMedicines = async () => {
    try {
      const res = await fetch(`${BASE_URL}/medicines/`);
      if (!res.ok) {
        throw new Error('Error al obtener medicinas');
      }
      const data = await res.json();
      setMedicines(Array.isArray(data) ? data : []);
    } catch {
      toast.error('No se pudieron cargar medicinas');
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${BASE_URL}/employees/`);
      if (!res.ok) {
        throw new Error('Error al obtener empleados');
      }
      const data = await res.json();
      setEmployees(Array.isArray(data) ? data : []);
    } catch {
      toast.error('No se pudieron cargar empleados');
    }
  };

  const fetchAttentions = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) {
        throw new Error('Error al obtener atenciones');
      }
      const data = await res.json();
      setAttentions(Array.isArray(data) ? data : []);
    } catch {
      toast.error('No se pudo cargar atenciones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttentions();
    fetchHorses();
    fetchMedicines();
    fetchEmployees();
  }, []);

  useEffect(() => {
    const LOGO_URL = `${import.meta.env.BASE_URL}image/LogoHipica.png`;
    let isMounted = true;

    const loadLogo = async () => {
      try {
        const response = await fetch(LOGO_URL);
        if (!response.ok) {
          throw new Error(`Respuesta inválida: ${response.status}`);
        }
        const blob = await response.blob();
        if (!blob.type || !blob.type.startsWith('image/')) {
          throw new Error(`Tipo de archivo no admitido: ${blob.type}`);
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          if (isMounted) {
            setLogoDataUrl(typeof reader.result === 'string' ? reader.result : null);
          }
        };
        reader.readAsDataURL(blob);
      } catch (error) {
        console.warn('No se pudo cargar el logo', error);
        if (isMounted) {
          setLogoDataUrl(null);
        }
      }
    };

    loadLogo();

    return () => {
      isMounted = false;
    };
  }, []);

  const validateForm = (form: AttentionHorseForm) => {
    if (!form.date) {
      toast.error('La fecha es obligatoria.');
      return false;
    }
    if (!form.dose.trim()) {
      toast.error('La dosis es obligatoria.');
      return false;
    }
    if (!form.description.trim()) {
      toast.error('La descripcion es obligatoria.');
      return false;
    }
    if (!form.cost.trim()) {
      toast.error('El costo es obligatorio.');
      return false;
    }
    if (!form.fk_idHorse) {
      toast.error('El caballo es obligatorio.');
      return false;
    }
    if (!form.fk_idEmployee) {
      toast.error('El empleado es obligatorio.');
      return false;
    }
    return true;
  };

  const getParsedCostOrToast = (cost: string) => {
    const parsed = parseCostForSubmit(cost);
    if (parsed === null) {
      toast.error('Ingresa un costo valido.');
      return null;
    }
    if (parsed < 0) {
      toast.error('El costo no puede ser negativo.');
      return null;
    }
    return parsed;
  };

  const handleCostChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setNewAttention(prev => ({ ...prev, cost: sanitizeCostInput(value) }));
  };

  const resetForm = () => {
    setNewAttention(createEmptyForm());
    setEditingId(null);
  };

  const submitAttention = async () => {
    if (!validateForm(newAttention)) {
      return;
    }

    const parsedCost = getParsedCostOrToast(newAttention.cost);
    if (parsedCost === null) {
      return;
    }

    const payload = {
      date: newAttention.date,
      dose: newAttention.dose.trim(),
      cost: parsedCost,
      description: newAttention.description.trim(),
      fk_idHorse: newAttention.fk_idHorse,
      fk_idMedicine: newAttention.fk_idMedicine === '' ? null : newAttention.fk_idMedicine,
      fk_idEmployee: newAttention.fk_idEmployee,
    };

    const isEditing = editingId !== null;
    const url = isEditing ? `${API_URL}${editingId}` : API_URL;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(isEditing ? 'Error al actualizar atencion' : 'Error al crear atencion');
      }
      toast.success(isEditing ? 'Atencion actualizada!' : 'Atencion creada!');
      resetForm();
      fetchAttentions();
    } catch {
      toast.error(
        isEditing ? 'No se pudo actualizar atencion.' : 'No se pudo crear atencion.',
      );
    }
  };

  const handleCancelEdit = () => {
    resetForm();
  };

  const clearFilters = () => {
    setFilterHorse(0);
    setFilterStartDate('');
    setFilterEndDate('');
  };

  const exportFilteredPDF = async () => {
    if (!filteredAttentions.length) {
      toast.error('No hay atenciones para exportar con los filtros aplicados.');
      return;
    }

    try {
      setExporting(true);
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt' });

      // Logo
      if (logoDataUrl && /^data:image\//.test(logoDataUrl)) {
        try {
          const margin = 40;
          const width = 120;
          const height = 70;
          const pageWidth = doc.internal.pageSize.getWidth();
          doc.addImage(logoDataUrl, 'PNG', pageWidth - width - margin, 20, width, height);
        } catch (logoError) {
          console.warn('No se pudo agregar el logo al PDF:', logoError);
        }
      }

      let title = 'Reporte de Atenciones';
      if (filterHorse) {
        title += ` - Caballo: ${getHorseName(filterHorse)}`;
      }
      if (filterStartDate || filterEndDate) {
        const range = [
          filterStartDate ? formatDateForDisplay(filterStartDate) : '',
          filterEndDate ? formatDateForDisplay(filterEndDate) : '',
        ].filter(Boolean);
        if (range.length) {
          title += ` (${range.join(' a ')})`;
        }
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(title, doc.internal.pageSize.getWidth() / 2, 50, {
        align: 'center',
      });

      const now = new Date();
      const fecha = now.toLocaleDateString('es-BO');
      const hora = now.toLocaleTimeString('es-BO', {
        hour: '2-digit',
        minute: '2-digit',
      });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Fecha: ${fecha}  Hora: ${hora}`, 40, 70);

      const body = filteredAttentions.map((attention, index) => [
        index + 1,
        getHorseName(attention.fk_idHorse),
        formatDateForDisplay(attention.date),
        attention.dose || 'N/A',
        attention.description || 'N/A',
        getEmployeeName(attention.fk_idEmployee),
        `${formatCostForDisplay(attention.cost) || '0,00'} Bs`,
      ]);

      autoTable(doc, {
        startY: 110,
        theme: 'striped',
        head: [
          ['NRO.', 'CABALLO', 'FECHA', 'DOSIS', 'DESCRIPCION', 'EMPLEADO', 'COSTO Bs.'],
        ],
        body,
        styles: { fontSize: 9, cellPadding: 6 },
        headStyles: {
          fillColor: [38, 72, 131],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        foot: [
          [
            {
              content: 'TOTAL',
              colSpan: 6,
              styles: { halign: 'right', fontStyle: 'bold' },
            },
            {
              content: `${formatCostForDisplay(totalFilteredCost) || '0,00'} Bs`,
              styles: { halign: 'center', fontStyle: 'bold' },
            },
          ],
        ],
        footStyles: {
          fillColor: [38, 72, 131],
          textColor: [255, 255, 255],
        },
      });

      doc.save(`AtencionesCaballos_${dayjs().format('YYYYMMDD_HHmm')}.pdf`);
      toast.success('PDF generado.');
    } catch (error) {
      console.error(error);
      toast.error('No se pudo generar el PDF.');
    } finally {
      setExporting(false);
    }
  };

  const deleteAttention = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}${id}`, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error('Error al eliminar atencion');
      }
      toast.success('Atencion eliminada!');
      fetchAttentions();
    } catch {
      toast.error('No se pudo eliminar atencion.');
    }
  };

  const handleStartEdit = (attention: AttentionHorse) => {
    if (!attention.idAttentionHorse) {
      return;
    }
    setEditingId(attention.idAttentionHorse);
    setNewAttention(mapAttentionToForm(attention));
  };

  const getHorseName = (id: number) =>
    horses.find(horse => horse.idHorse === id)?.horseName || id.toString();

  const getMedicineName = (id: number | null | undefined) => {
    if (!id) {
      return 'Sin medicina';
    }
    return medicines.find(med => med.idMedicine === id)?.name || id.toString();
  };

  const getEmployeeName = (id: number) =>
    employees.find(emp => emp.idEmployee === id)?.fullName || id.toString();

  return (
    <div  className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
      <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">Gestión de Atenciones a Caballos</h1>
      
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.5)] text-[#F8F4E3]">
        <h2 className="text-xl font-semibold mb-4 text-teal-400">Agregar Nueva Atencion</h2>
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="date" className="block mb-1">
              Fecha <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              name="date"
              placeholder="Fecha"
              value={newAttention.date}
              onChange={e => setNewAttention({ ...newAttention, date: e.target.value })}
              className="w-full p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
              required
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="dose" className="block mb-1">
              Dosis <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="dose"
              placeholder="Dosis"
              value={newAttention.dose}
              onChange={e => setNewAttention({ ...newAttention, dose: e.target.value })}
              className="w-full p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
              required
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="cost" className="block mb-1">
              Costo <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="cost"
              placeholder="0"
              value={newAttention.cost}
              onChange={handleCostChange}
              className="w-full p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
              inputMode="decimal"
              required
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="description" className="block mb-1">
              Descripcion <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="description"
              placeholder="Descripcion"
              value={newAttention.description}
              onChange={e => setNewAttention({ ...newAttention, description: e.target.value })}
              className="w-full p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
              required
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="fk_idHorse" className="block mb-1">
              Caballo <span className="text-red-400">*</span>
            </label>
            <select
              name="fk_idHorse"
              value={newAttention.fk_idHorse}
              onChange={e => setNewAttention({ ...newAttention, fk_idHorse: Number(e.target.value) })}
              className="w-full p-2 rounded-md bg-gray-700 text-white"
              required
            >
              <option value={0}>-- Selecciona caballo --</option>
              {horses.map(horse => (
                <option key={horse.idHorse} value={horse.idHorse}>
                  {horse.horseName}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="fk_idMedicine" className="block mb-1">
              Medicina (opcional)
            </label>
            <select
              name="fk_idMedicine"
              value={newAttention.fk_idMedicine === '' ? '' : newAttention.fk_idMedicine}
              onChange={e =>
                setNewAttention({
                  ...newAttention,
                  fk_idMedicine: e.target.value ? Number(e.target.value) : '',
                })
              }
              className="w-full p-2 rounded-md bg-gray-700 text-white"
            >
              <option value="">-- Sin medicina --</option>
              {medicines.map(med => (
                <option key={med.idMedicine} value={med.idMedicine}>
                  {med.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="fk_idEmployee" className="block mb-1">
              Empleado <span className="text-red-400">*</span>
            </label>
            <select
              name="fk_idEmployee"
              value={newAttention.fk_idEmployee}
              onChange={e =>
                setNewAttention({ ...newAttention, fk_idEmployee: Number(e.target.value) })
              }
              className="w-full p-2 rounded-md bg-gray-700 text-white"
              required
            >
              <option value={0}>-- Selecciona empleado --</option>
              {employees.map(emp => (
                <option key={emp.idEmployee} value={emp.idEmployee}>
                  {emp.fullName}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={submitAttention}
              className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-md font-semibold flex items-center gap-2"
            >
              {editingId !== null ? (
                <>
                  <Save size={20} /> Guardar
                </>
              ) : (
                <>
                  <Plus size={20} /> Agregar
                </>
              )}
            </button>
            {editingId !== null && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-md font-semibold flex items-center gap-2"
              >
                <X size={20} /> Cancelar
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.5)] text-[#F8F4E3]">
        <h2 className="text-xl font-semibold mb-4 text-teal-400">Exportacion a PDF</h2>
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[200px]">
            <label htmlFor="filterHorse" className="block mb-1 text-gray-300">
              Filtrar por caballo
            </label>
            <select
              id="filterHorse"
              value={filterHorse}
              onChange={e => setFilterHorse(Number(e.target.value))}
              className="w-full p-2 rounded-md bg-gray-700 text-white"
            >
              <option value={0}>Todos</option>
              {horses.map(horse => (
                <option key={horse.idHorse} value={horse.idHorse}>
                  {horse.horseName}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[180px]">
            <label htmlFor="filterStartDate" className="block mb-1 text-gray-300">
              Fecha desde
            </label>
            <input
              id="filterStartDate"
              type="date"
              value={filterStartDate}
              onChange={e => setFilterStartDate(e.target.value)}
              className="w-full p-2 rounded-md bg-gray-700 text-white"
            />
          </div>
          <div className="min-w-[180px]">
            <label htmlFor="filterEndDate" className="block mb-1 text-gray-300">
              Fecha hasta
            </label>
            <input
              id="filterEndDate"
              type="date"
              value={filterEndDate}
              onChange={e => setFilterEndDate(e.target.value)}
              className="w-full p-2 rounded-md bg-gray-700 text-white"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={exportFilteredPDF}
              disabled={exporting || loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 disabled:cursor-not-allowed text-white p-2 rounded-md font-semibold flex items-center gap-2"
            >
              {exporting ? <Loader size={18} className="animate-spin" /> : <FileDown size={18} />}
              Generar PDF
            </button>
            {(filterHorse || filterStartDate || filterEndDate) && (
              <button
                type="button"
                onClick={clearFilters}
                className="bg-slate-600 hover:bg-slate-700 text-white p-2 rounded-md font-semibold flex items-center gap-2"
              >
                <X size={18} /> Limpiar
              </button>
            )}
          </div>
          <div className="ml-auto text-right">
            <p className="text-sm text-gray-400">Total filtrado</p>
            <p className="text-2xl font-semibold text-teal-300">
              {formatCostForDisplay(totalFilteredCost) || '0,00'} Bs
            </p>
          </div>
        </div>
      </div>
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.5)] text-[#F8F4E3]">
        <h2 className="text-xl font-semibold mb-4 text-teal-400">Registros</h2>
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            <Loader size={24} className="animate-spin" />
            Cargando atenciones...
          </div>
        ) : filteredAttentions.length === 0 ? (
          <div className="text-center text-gray-400 py-10">
            No se encontraron atenciones con los filtros seleccionados.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAttentions.map(att => (
              <div
                key={att.idAttentionHorse}
                className={`bg-gray-700 p-4 rounded-md shadow-lg flex flex-col justify-between border ${
                  editingId === att.idAttentionHorse ? 'border-yellow-500' : 'border-transparent'
                }`}
              >
                <h3 className="text-lg font-semibold">
                  Fecha: {formatDateForDisplay(att.date)}
                </h3>
                <p>Dosis: {att.dose || 'N/A'}</p>
                <p>Costo: {formatCostForDisplay(att.cost) || 'N/A'}</p>
                <p>Descripcion: {att.description || 'N/A'}</p>
                <p>Caballo: {getHorseName(att.fk_idHorse)}</p>
                <p>Medicina: {getMedicineName(att.fk_idMedicine)}</p>
                <p>Empleado: {getEmployeeName(att.fk_idEmployee)}</p>
                <div className="flex items-center justify-end gap-4 mt-4">
                  <button
                    onClick={() => handleStartEdit(att)}
                    className="relative flex items-center justify-center w-15 h-15 rounded-[20px]
                                  bg-gradient-to-b from-[#1A1C1E] to-[#0E0F10]
                                  shadow-[8px_8px_16px_rgba(0,0,0,0.8),-5px_-5px_12px_rgba(255,255,255,0.07)]
                                  hover:scale-[1.08] active:shadow-[inset_5px_5px_12px_rgba(0,0,0,0.85),inset_-4px_-4px_10px_rgba(255,255,255,0.05)]
                                  transition-all duration-300 ease-in-out
                                  before:absolute before:inset-0 before:rounded-[20px]
                                  before:bg-gradient-to-b before:from-white/10 before:to-transparent before:opacity-25"
                  >
                    <Edit size={28} className="text-[#E8C967] drop-shadow-[0_0_6px_rgba(255,215,100,0.85)]" />
                  </button>
                  <button
                    onClick={() => deleteAttention(att.idAttentionHorse!)}
                    className="relative flex items-center justify-center w-15 h-15 rounded-[20px]
                                  bg-gradient-to-b from-[#1A1C1E] to-[#0E0F10]
                                  shadow-[8px_8px_16px_rgba(0,0,0,0.8),-5px_-5px_12px_rgba(255,255,255,0.07)]
                                  hover:scale-[1.08] active:shadow-[inset_5px_5px_12px_rgba(0,0,0,0.85),inset_-4px_-4px_10px_rgba(255,255,255,0.05)]
                                  transition-all duration-300 ease-in-out
                                  before:absolute before:inset-0 before:rounded-[20px]
                                  before:bg-gradient-to-b before:from-white/10 before:to-transparent before:opacity-25"
                  >
                    <Trash2 size={28} className="text-[#E86B6B] drop-shadow-[0_0_7px_rgba(255,80,80,0.9)]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AttentionHorsesManagement;
