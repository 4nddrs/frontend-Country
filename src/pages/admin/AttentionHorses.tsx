import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import type { ChangeEvent } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Trash2, Loader, FileDown, ChevronUp, ChevronDown, X} from 'lucide-react';
import { ExportButton, AdminSection, SaveButton, CancelButton } from '../../components/ui/admin-buttons';
import { confirmDialog } from '../../utils/confirmDialog';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import dayjs from 'dayjs';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Cell, ResponsiveContainer,
} from 'recharts';

const BASE_URL = 'http://localhost:8000';
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
  const [editAttention, setEditAttention] = useState<AttentionHorseForm | null>(null);
  const [editCostInput, setEditCostInput] = useState('');
  const [loading, setLoading] = useState<boolean>(true);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

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

  const horsesChartData = useMemo(() => {
    const counts: Record<number, number> = {};
    attentions.forEach(a => {
      counts[a.fk_idHorse] = (counts[a.fk_idHorse] ?? 0) + 1;
    });
    return Object.entries(counts)
      .map(([id, count]) => ({
        id: Number(id),
        name: horses.find(h => h.idHorse === Number(id))?.horseName ?? `#${id}`,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [attentions, horses]);

  const fetchHorses = async () => {
    try {
      const res = await fetch(`${BASE_URL}/horses/`);
      if (!res.ok) {
        throw new Error('Error al obtener caballos');
      }
      const data = await res.json();
      setHorses(Array.isArray(data) ? data : []);
    } catch {
      // Silenciar error de carga
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
      // Silenciar error de carga
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
      // Silenciar error de carga
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
      const list = Array.isArray(data) ? data : [];
      list.sort((a: AttentionHorse, b: AttentionHorse) => (b.idAttentionHorse ?? 0) - (a.idAttentionHorse ?? 0));
      setAttentions(list);
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
      toast.error('La descripción es obligatoria.');
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
    if (!form.fk_idMedicine) {
      toast.error('La medicina es obligatoria.');
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
        throw new Error(isEditing ? 'Error al actualizar atención' : 'Error al crear atención');
      }
      toast.success(isEditing ? 'Atención actualizada!' : 'Atención creada!');
      resetForm();
      fetchAttentions();
    } catch {
      toast.error(
        isEditing ? 'No se pudo actualizar atención.' : 'No se pudo crear atención.',
      );
    }
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
        showFoot: 'lastPage',
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
    const confirmed = await confirmDialog({
      title: '¿Eliminar atención?',
      description: 'Esta acción eliminará el registro de atención al caballo permanentemente.',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
    });
    if (!confirmed) return;
    try {
      const res = await fetch(`${API_URL}${id}`, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error('Error al eliminar atención');
      }
      toast.success('Atención eliminada!');
      fetchAttentions();
    } catch {
      toast.error('No se pudo eliminar atención.');
    }
  };

  const handleStartEdit = (attention: AttentionHorse) => {
    if (!attention.idAttentionHorse) {
      return;
    }
    const form = mapAttentionToForm(attention);
    setEditingId(attention.idAttentionHorse);
    setEditAttention(form);
    setEditCostInput(form.cost);
  };

  const handleEditCostChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    const sanitized = sanitizeCostInput(value);
    setEditCostInput(sanitized);
    setEditAttention((prev) => prev ? { ...prev, cost: sanitized } : prev);
  };

  const updateAttention = async () => {
    if (!editAttention || editingId === null) return;
    if (!validateForm(editAttention)) return;
    const parsedCost = getParsedCostOrToast(editAttention.cost);
    if (parsedCost === null) return;

    const payload = {
      date: editAttention.date,
      dose: editAttention.dose.trim(),
      cost: parsedCost,
      description: editAttention.description.trim(),
      fk_idHorse: editAttention.fk_idHorse,
      fk_idMedicine: editAttention.fk_idMedicine === '' ? null : editAttention.fk_idMedicine,
      fk_idEmployee: editAttention.fk_idEmployee,
    };

    try {
      const res = await fetch(`${API_URL}${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Error al actualizar atención');
      toast.success('Atención actualizada!');
      setEditingId(null);
      setEditAttention(null);
      setEditCostInput('');
      fetchAttentions();
    } catch {
      toast.error('No se pudo actualizar atención.');
    }
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
      
      <AdminSection>
        <h2 className="text-xl font-semibold mb-4 text-teal-400">Agregar Nueva Atención</h2>

        {/* Fila 1: 4 campos (Descripción más ancha) */}
        <div className="grid grid-cols-5 gap-4 mb-4">
          <div>
            <label htmlFor="date" className="block mb-1">
              Fecha <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              name="date"
              value={newAttention.date}
              onChange={e => setNewAttention({ ...newAttention, date: e.target.value })}
              className="w-full"
              required
            />
          </div>
          <div>
            <label htmlFor="dose" className="block mb-1">
              Dosis <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="dose"
              placeholder="Dosis"
              value={newAttention.dose}
              onChange={e => setNewAttention({ ...newAttention, dose: e.target.value })}
              className="w-full"
              required
            />
          </div>
          <div>
            <label htmlFor="cost" className="block mb-1">
              Costo <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="cost"
              placeholder="0"
              value={newAttention.cost}
              onChange={handleCostChange}
              className="w-full"
              inputMode="decimal"
              required
            />
          </div>
          <div className="col-span-2">
            <label htmlFor="description" className="block mb-1">
              Descripción <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="description"
              placeholder="Descripción"
              value={newAttention.description}
              onChange={e => setNewAttention({ ...newAttention, description: e.target.value })}
              className="w-full"
              required
            />
          </div>
        </div>
        {/* Fila 2: 3 selectores + botón */}
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label htmlFor="fk_idHorse" className="block mb-1">
              Caballo <span className="text-red-400">*</span>
            </label>
            <select
              name="fk_idHorse"
              value={newAttention.fk_idHorse}
              onChange={e => setNewAttention({ ...newAttention, fk_idHorse: Number(e.target.value) })}
              className="w-full"
              required
            >
              <option value={0}>-- Selecciona caballo --</option>
              {horses.map(horse => (
                <option key={horse.idHorse} value={horse.idHorse}>{horse.horseName}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="fk_idMedicine" className="block mb-1">
              Medicina <span className="text-red-400">*</span>
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
              className="w-full"
              required
            >
              <option value="">Ninguno</option>
              {medicines.map(med => (
                <option key={med.idMedicine} value={med.idMedicine}>{med.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="fk_idEmployee" className="block mb-1">
              Empleado <span className="text-red-400">*</span>
            </label>
            <select
              name="fk_idEmployee"
              value={newAttention.fk_idEmployee}
              onChange={e =>
                setNewAttention({ ...newAttention, fk_idEmployee: Number(e.target.value) })
              }
              className="w-full"
              required
            >
              <option value={0}>-- Selecciona empleado --</option>
              {employees.map(emp => (
                <option key={emp.idEmployee} value={emp.idEmployee}>{emp.fullName}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end justify-end">
            <button type="button" onClick={submitAttention} className="group relative cursor-pointer">
              <div className="relative z-10 inline-flex w-full h-9 items-center justify-center overflow-hidden rounded-[10px] border border-[#3CC9F6]/70 bg-[#3CC9F6]/12 px-16 font-semibold text-[#3CC9F6] tracking-wide text-sm gap-2 shadow-[0_0_14px_rgba(60,201,246,0.35)] ring-1 ring-[#3CC9F6]/20 transition-all duration-300 group-hover:-translate-x-5 group-hover:-translate-y-5 group-active:translate-x-0 group-active:translate-y-0">
                <Plus size={15} /> Agregar
              </div>
              <div className="absolute inset-0 z-0 h-full w-full rounded-[10px] bg-[#3CC9F6]/8 transition-all duration-300 group-hover:-translate-x-5 group-hover:-translate-y-5 group-hover:[box-shadow:7px_7px_rgba(60,201,246,0.6),14px_14px_rgba(60,201,246,0.4),21px_21px_rgba(60,201,246,0.2)] group-active:translate-x-0 group-active:translate-y-0 group-active:shadow-none" />
            </button>
          </div>
        </div>
      </AdminSection>
      {/* ── Dashboard de atenciones por caballo ── */}
      <div className="relative mb-6 overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-br from-[#0a1628] via-[#0d1f3c] to-[#0a1220] shadow-[0_8px_48px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.05)] p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-white/90 tracking-wide">
              Atenciones médicas por caballo
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Conteo total de registros · todos los periodos</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm bg-orange-500/80" />
              ≤ 5 atenciones
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm bg-blue-500/80" />
              &gt; 5 atenciones
            </span>
          </div>
        </div>

        {horsesChartData.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
            Sin datos de atenciones registradas.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={horsesChartData}
              margin={{ top: 16, right: 20, left: -10, bottom: 56 }}
              barCategoryGap="28%"
            >
              <defs>
                <filter id="glow-orange" x="-60%" y="-60%" width="220%" height="220%">
                  <feGaussianBlur stdDeviation="5" result="blur1" />
                  <feGaussianBlur stdDeviation="10" result="blur2" in="SourceGraphic" />
                  <feMerge>
                    <feMergeNode in="blur2" />
                    <feMergeNode in="blur1" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="glow-blue" x="-60%" y="-60%" width="220%" height="220%">
                  <feGaussianBlur stdDeviation="5" result="blur1" />
                  <feGaussianBlur stdDeviation="10" result="blur2" in="SourceGraphic" />
                  <feMerge>
                    <feMergeNode in="blur2" />
                    <feMergeNode in="blur1" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <linearGradient id="bar-orange" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(253,186,116,0.95)" />
                  <stop offset="50%" stopColor="rgba(249,115,22,0.85)" />
                  <stop offset="100%" stopColor="rgba(194,65,12,0.6)" />
                </linearGradient>
                <linearGradient id="bar-blue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(147,210,255,0.95)" />
                  <stop offset="50%" stopColor="rgba(59,130,246,0.85)" />
                  <stop offset="100%" stopColor="rgba(29,78,216,0.6)" />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 6"
                stroke="rgba(255,255,255,0.04)"
                vertical={false}
              />

              <XAxis
                dataKey="name"
                tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                angle={-35}
                textAnchor="end"
                interval={0}
                dy={6}
              />

              <YAxis
                allowDecimals={false}
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={32}
              />

              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload as { name: string; count: number };
                  const isHigh = d.count > 5;
                  return (
                    <div className="rounded-xl border border-white/10 bg-[#0d1f3c]/95 backdrop-blur px-4 py-3 shadow-2xl text-sm">
                      <p className="font-semibold text-white mb-1">{d.name}</p>
                      <p className={`font-bold text-lg ${isHigh ? 'text-blue-400' : 'text-orange-400'}`}>
                        {d.count} {d.count === 1 ? 'atención' : 'atenciones'}
                      </p>
                      <p className="text-xs mt-1 text-slate-500">
                        {isHigh ? 'Nivel alto · azul' : 'Nivel bajo · naranja'}
                      </p>
                    </div>
                  );
                }}
              />

              <Bar
                dataKey="count"
                radius={[6, 6, 2, 2]}
                maxBarSize={52}
                isAnimationActive
                animationDuration={900}
                animationEasing="ease-out"
                label={{
                  position: 'top',
                  fill: '#cbd5e1',
                  fontSize: 11,
                  fontWeight: 600,
                  formatter: (v: React.ReactNode) => (Number(v) > 0 ? v : ''),
                }}
              >
                {horsesChartData.map((entry) => (
                  <Cell
                    key={entry.id}
                    fill={entry.count <= 5 ? 'url(#bar-orange)' : 'url(#bar-blue)'}
                    filter={entry.count <= 5 ? 'url(#glow-orange)' : 'url(#glow-blue)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* Stat pills */}
        {horsesChartData.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3 mt-5 pt-4 border-t border-white/[0.05]">
            <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] px-4 py-2 text-center">
              <p className="text-xs text-slate-500">Caballos</p>
              <p className="text-base font-bold text-white">{horsesChartData.length}</p>
            </div>
            <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] px-4 py-2 text-center">
              <p className="text-xs text-slate-500">Total atenciones</p>
              <p className="text-base font-bold text-white">{attentions.length}</p>
            </div>
            <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] px-4 py-2 text-center">
              <p className="text-xs text-slate-500">Mayor registro</p>
              <p className="text-base font-bold text-orange-400">{horsesChartData[0]?.name}</p>
            </div>
            <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] px-4 py-2 text-center">
              <p className="text-xs text-slate-500">Máx. atenciones</p>
              <p className={`text-base font-bold ${horsesChartData[0]?.count > 5 ? 'text-blue-400' : 'text-orange-400'}`}>
                {horsesChartData[0]?.count ?? 0}
              </p>
            </div>
          </div>
        )}
      </div>

      <AdminSection>
        <h2 className="text-xl font-semibold mb-4 text-teal-400">Filtros y Exportación</h2>
        <div className="flex flex-nowrap items-end gap-4">
          <div className="flex-1">
            <label htmlFor="filterHorse" className="block mb-1 text-gray-300">
              Filtrar por caballo
            </label>
            <select
              id="filterHorse"
              value={filterHorse}
              onChange={e => setFilterHorse(Number(e.target.value))}
              className="w-full"
            >
              <option value={0}>Todos</option>
              {horses.map(horse => (
                <option key={horse.idHorse} value={horse.idHorse}>
                  {horse.horseName}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label htmlFor="filterStartDate" className="block mb-1 text-gray-300">
              Fecha desde
            </label>
            <input
              id="filterStartDate"
              type="date"
              value={filterStartDate}
              onChange={e => setFilterStartDate(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="filterEndDate" className="block mb-1 text-gray-300">
              Fecha hasta
            </label>
            <input
              id="filterEndDate"
              type="date"
              value={filterEndDate}
              onChange={e => setFilterEndDate(e.target.value)}
              className="w-full"
            />
          </div>
          {(filterHorse || filterStartDate || filterEndDate) && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition text-sm"
            >
              <X size={16} /> Limpiar
            </button>
          )}
          <div className="ml-auto">
            <ExportButton
              onClick={exportFilteredPDF}
              disabled={exporting || loading}
            >
              {exporting ? <Loader size={18} className="animate-spin" /> : <FileDown size={18} />}
              Generar PDF
            </ExportButton>
          </div>
        </div>
      </AdminSection>

      <AdminSection>
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
            {filteredAttentions.map(att => {
              const isExpanded = expanded[att.idAttentionHorse ?? 0] ?? false;
              return (
              <div
                key={att.idAttentionHorse}
                className="rounded-2xl border border-slate-800/60 bg-gradient-to-br from-cyan-500/10 via-slate-900/60 to-slate-900/90 shadow-lg shadow-black/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-cyan-500/20"
              >
                <div className="flex flex-col items-center gap-2 py-5">
                  <span className="h-4 w-4 rounded-full bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.6)]" />
                  <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    Atención
                  </span>
                </div>

                <div className="px-6 pb-6 space-y-4 text-sm text-slate-200">
                  <div className="text-center space-y-1">
                    <h3 className="text-lg font-semibold text-cyan-300">
                      {formatDateForDisplay(att.date)}
                    </h3>
                    <p className="text-slate-400">
                      <span className="font-medium text-slate-200">{getHorseName(att.fk_idHorse)}</span>
                    </p>
                  </div>

                  <div className="space-y-2 text-center">
                    <p><span className="font-medium text-slate-400">Dosis:</span> {att.dose || 'N/A'}</p>
                    <p><span className="font-medium text-slate-400">Costo:</span> <span className="text-cyan-300">{formatCostForDisplay(att.cost) || 'N/A'}</span></p>
                  </div>

                  <button
                    onClick={() =>
                      setExpanded((prev) => ({
                        ...prev,
                        [att.idAttentionHorse ?? 0]: !prev[att.idAttentionHorse ?? 0],
                      }))
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/15"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp size={16} /> Ver menos
                      </>
                    ) : (
                      <>
                        <ChevronDown size={16} /> Ver más
                      </>
                    )}
                  </button>

                  {isExpanded && (
                    <div className="rounded-xl border border-slate-800/80 bg-slate-900/70 p-4 text-xs leading-relaxed">
                      <ul className="space-y-1">
                        <li><strong>Descripción:</strong> {att.description || 'N/A'}</li>
                        <li><strong>Medicina:</strong> {getMedicineName(att.fk_idMedicine)}</li>
                        <li><strong>Empleado:</strong> {getEmployeeName(att.fk_idEmployee)}</li>
                      </ul>
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-6 border-t border-slate-800 pt-6 pb-2">
                    <button
                      onClick={() => handleStartEdit(att)}
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
                      onClick={() => deleteAttention(att.idAttentionHorse!)}
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
              </div>
              );
            })}
          </div>
        )}
      </AdminSection>

      {editingId !== null && editAttention && createPortal(
        <div
          className="fixed inset-0 lg:left-80 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => { setEditingId(null); setEditAttention(null); setEditCostInput(''); }}
        >
          <div
            className="w-full max-w-4xl max-h-[95vh] overflow-y-auto rounded-2xl border border-[#167C79]/60 bg-[#0f172a] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.6)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-[#F8F4E3] mb-6">Editar Atención</h3>
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <label className="block mb-1">Fecha <span className="text-red-400">*</span></label>
                <input type="date" value={editAttention.date} onChange={(e) => setEditAttention({ ...editAttention, date: e.target.value })} className="w-full" />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block mb-1">Dosis <span className="text-red-400">*</span></label>
                <input type="text" placeholder="Dosis" value={editAttention.dose} onChange={(e) => setEditAttention({ ...editAttention, dose: e.target.value })} className="w-full" />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block mb-1">Costo <span className="text-red-400">*</span></label>
                <input type="text" placeholder="0" value={editCostInput} onChange={handleEditCostChange} className="w-full" inputMode="decimal" />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block mb-1">Descripción <span className="text-red-400">*</span></label>
                <input type="text" placeholder="Descripción" value={editAttention.description} onChange={(e) => setEditAttention({ ...editAttention, description: e.target.value })} className="w-full" />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block mb-1">Caballo <span className="text-red-400">*</span></label>
                <select value={editAttention.fk_idHorse} onChange={(e) => setEditAttention({ ...editAttention, fk_idHorse: Number(e.target.value) })} className="w-full">
                  <option value={0}>-- Selecciona caballo --</option>
                  {horses.map(horse => <option key={horse.idHorse} value={horse.idHorse}>{horse.horseName}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block mb-1">Medicina <span className="text-red-400">*</span></label>
                <select value={editAttention.fk_idMedicine === '' ? '' : editAttention.fk_idMedicine} onChange={(e) => setEditAttention({ ...editAttention, fk_idMedicine: e.target.value ? Number(e.target.value) : '' })} className="w-full">
                  <option value="">Ninguno</option>
                  {medicines.map(med => <option key={med.idMedicine} value={med.idMedicine}>{med.name}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block mb-1">Empleado <span className="text-red-400">*</span></label>
                <select value={editAttention.fk_idEmployee} onChange={(e) => setEditAttention({ ...editAttention, fk_idEmployee: Number(e.target.value) })} className="w-full">
                  <option value={0}>-- Selecciona empleado --</option>
                  {employees.map(emp => <option key={emp.idEmployee} value={emp.idEmployee}>{emp.fullName}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3 border-t border-slate-700 pt-4">
              <CancelButton onClick={() => { setEditingId(null); setEditAttention(null); setEditCostInput(''); }} />
              <SaveButton onClick={updateAttention} children="Guardar cambios" />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AttentionHorsesManagement;




