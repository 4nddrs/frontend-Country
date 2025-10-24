import { useState, useEffect, useMemo, useRef } from 'react';
import type { ChangeEvent } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import jsPDF from 'jspdf';
import autoTable, { type CellInput } from 'jspdf-autotable';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Save, Trash2, Loader, X, Download ,ChevronUp,ChevronDown,} from 'lucide-react';


const API_URL = 'https://backend-country-nnxe.onrender.com/owner_report_month/';
const OWNERS_URL = 'https://backend-country-nnxe.onrender.com/owner/';
const HORSES_URL = 'https://backend-country-nnxe.onrender.com/horses/';

const TABLE_ACCENT_COLOR: [number, number, number] = [38, 72, 131];
const TABLE_ACCENT_TEXT: [number, number, number] = [255, 255, 255];

interface HorseReport {
  fk_idHorse: number;
  days: number;
  alphaKg: number;
  daysDisplay?: string;
  alphaKgDisplay?: string;
}

interface OwnerReportMonth {
  idOwnerReportMonth?: number;
  period: string;
  priceAlpha: number;
  box: number;
  section: number;
  aBasket: number;
  contributionCabFlyer: number;
  VaccineApplication: number;
  deworming: number;
  AmeniaExam: number;
  externalTeacher: number;
  fine: number;
  saleChala: number;
  costPerBucket: number;
  healthCardPayment: number;
  other: number;
  state: string;
  paymentDate?: string | null;
  fk_idOwner: number;
  horses_report?: HorseReport[];
  created_at?: string;
}

interface OwnerOption {
  idOwner: number;
  name: string;
  FirstName: string;
  SecondName?: string | null;
}

interface HorseOption {
  idHorse: number;
  horseName: string;
}

interface NormalizedHorseUsage {
  fk_idHorse: number;
  days: number;
  alphaKg: number;
  monthlyAlphaKg: number;
}

const statusStyles: Record<
  string,
  { dot: string; bg: string }
> = {
  Pagado: {
    dot: "bg-emerald-500 shadow-[0_0_12px_rgba(34,197,94,0.6)]",
    bg: "from-emerald-500/10 via-slate-900/60 to-slate-900/90",
  },
  Pendiente: {
    dot: "bg-amber-400 shadow-[0_0_12px_rgba(250,204,21,0.6)]",
    bg: "from-amber-400/10 via-slate-900/60 to-slate-900/90",
  },
  Anulado: {
    dot: "bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)]",
    bg: "from-rose-500/10 via-slate-900/60 to-slate-900/90",
  },
};

const createInitialReport = (): OwnerReportMonth => ({
  period: '',
  priceAlpha: 0,
  box: 0,
  section: 0,
  aBasket: 0,
  contributionCabFlyer: 0,
  VaccineApplication: 0,
  deworming: 0,
  AmeniaExam: 0,
  externalTeacher: 0,
  fine: 0,
  saleChala: 0,
  costPerBucket: 0,
  healthCardPayment: 0,
  other: 0,
  state: 'Pendiente',
  paymentDate: '',
  fk_idOwner: 0,
});

const extractErrorMessage = async (response: Response) => {
  try {
    const data = await response.json();
    if (typeof data === 'string') return data;
    if (Array.isArray(data?.detail)) {
      return data.detail
        .map((item: any) => {
          const location = Array.isArray(item?.loc)
            ? item.loc.filter((segment: unknown) => typeof segment === 'string' || typeof segment === 'number').join('.')
            : '';
          if (item?.msg) {
            return location ? `${location}: ${item.msg}` : item.msg;
          }
          return '';
        })
        .filter(Boolean)
        .join(' | ');
    }
    if (typeof data?.detail === 'string') {
      return data.detail;
    }
    return JSON.stringify(data);
  } catch {
    return response.statusText;
  }
};

const normalizeDateForInput = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 10);
  }
  return date.toISOString().slice(0, 10);
};

const formatDateForDisplay = (value?: string | null) => {
  if (!value) return ' ';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value.split('T')[0] ?? value;
  }
  return date.toLocaleDateString();
};

const formatOwnerName = (owner?: OwnerOption) =>
  owner
    ? [owner.FirstName, owner.SecondName, owner.name].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
    : '';

const parseNumberInput = (raw: string): number | null => {
  if (!raw) return null;
  const normalized = raw.replace(/\./g, '').replace(',', '.').trim();
  if (normalized === '' || normalized === '.' || normalized === ',') return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const formatNumberDisplay = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  const numeric =
    typeof value === 'number' ? value : Number(String(value).replace(/\./g, '').replace(',', '.'));
  if (!Number.isFinite(numeric)) return '';

  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 20,
  }).format(numeric);
};

const normalizeHorseReports = (horseReports?: HorseReport[]): NormalizedHorseUsage[] =>
  (horseReports ?? []).map((horse) => {
    const days = Number(horse.days) || 0;
    const alphaKg = Number(horse.alphaKg) || 0;
    return {
      fk_idHorse: horse.fk_idHorse,
      days,
      alphaKg,
      monthlyAlphaKg: days * alphaKg,
    };
  });

const summarizeHorseReports = (horseReports?: HorseReport[]) => {
  const horses = normalizeHorseReports(horseReports);
  const totals = horses.reduce(
    (acc, horse) => {
      acc.totalDays += horse.days;
      acc.totalAlphaMonthly += horse.monthlyAlphaKg;
      return acc;
    },
    { totalDays: 0, totalAlphaMonthly: 0 }
  );

  return {
    horses,
    horsesCount: horses.length,
    totalDays: totals.totalDays,
    totalAlphaMonthly: totals.totalAlphaMonthly,
  };
};

dayjs.locale('es');

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const formatMonthLabel = (value?: string | null) => {
  if (!value) return '';
  const parsed = dayjs(value);
  if (!parsed.isValid()) return value;
  return parsed.format('MMMM YYYY');
};

const NUMERIC_FIELDS = [
  'priceAlpha',
  'box',
  'section',
  'aBasket',
  'contributionCabFlyer',
  'VaccineApplication',
  'deworming',
  'AmeniaExam',
  'externalTeacher',
  'fine',
  'saleChala',
  'costPerBucket',
  'healthCardPayment',
  'other',
] as const;

type NumericField = (typeof NUMERIC_FIELDS)[number];

const createInitialNumericDisplays = (): Record<NumericField, string> =>
  NUMERIC_FIELDS.reduce(
    (acc, field) => {
      acc[field] = '';
      return acc;
    },
    {} as Record<NumericField, string>
  );

const parseNumericValue = (raw: unknown): number => {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string') {
    const parsed = parseNumberInput(raw);
    if (parsed !== null) return parsed;
  }
  const numeric = Number(raw);
  return Number.isFinite(numeric) ? numeric : 0;
};

const RequiredMark = () => <span className="text-red-400 ml-1">*</span>;

const OwnerReportMonthManagement = () => {
  const [reports, setReports] = useState<OwnerReportMonth[]>([]);
  const [newReport, setNewReport] = useState<OwnerReportMonth>(createInitialReport());
  const [numericDisplays, setNumericDisplays] = useState<Record<NumericField, string>>(
    () => createInitialNumericDisplays()
  );
  const [horsesReport, setHorsesReport] = useState<HorseReport[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [owners, setOwners] = useState<OwnerOption[]>([]);
  const [horses, setHorses] = useState<HorseOption[]>([]);
  const [ownerHorses, setOwnerHorses] = useState<HorseOption[]>([]);
  const [loadingOwnerHorses, setLoadingOwnerHorses] = useState(false);
  const [filterStart, setFilterStart] = useState<string>('');
  const [filterEnd, setFilterEnd] = useState<string>('');
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const reportsSectionRef = useRef<HTMLDivElement | null>(null);

  const isEditing = editingId !== null;

  const filteredReports = useMemo(() => {
    if (!filterStart && !filterEnd) return reports;

    let startDate = filterStart ? dayjs(filterStart).startOf('month') : null;
    let endDate = filterEnd ? dayjs(filterEnd).endOf('month') : null;

    if (startDate && endDate && startDate.isAfter(endDate)) {
      const temp = startDate;
      startDate = endDate.startOf('month');
      endDate = temp.endOf('month');
    }

    return reports.filter((report) => {
      if (!report.period) return false;
      const periodDate = dayjs(report.period);
      if (!periodDate.isValid()) return false;
      if (startDate && periodDate.isBefore(startDate, 'day')) return false;
      if (endDate && periodDate.isAfter(endDate, 'day')) return false;
      return true;
    });
  }, [reports, filterStart, filterEnd]);

  const reportsToDisplay = filteredReports;
  const isReversedRange = useMemo(
    () => filterStart && filterEnd && dayjs(filterStart).isAfter(dayjs(filterEnd)),
    [filterStart, filterEnd]
  );

  const getOwnerName = (ownerId: number) => {
    const owner = owners.find((item) => item.idOwner === ownerId);
    return owner ? formatOwnerName(owner) : `Propietario ${ownerId}`;
  };

  const getHorseName = (horseId: number) => {
    const horse = horses.find((item) => item.idHorse === horseId);
    return horse?.horseName ?? `Caballo ${horseId}`;
  };

  const buildChargesSummary = (report: OwnerReportMonth, totalAlphaKg: number, horsesCount: number) => {
    const priceAlpha = parseNumericValue(report.priceAlpha);
    const box = parseNumericValue(report.box);
    const section = parseNumericValue(report.section);
    const aBasket = parseNumericValue(report.aBasket);
    const contribution = parseNumericValue(report.contributionCabFlyer);
    const vaccine = parseNumericValue(report.VaccineApplication);
    const deworming = parseNumericValue(report.deworming);
    const amenia = parseNumericValue(report.AmeniaExam);
    const teacher = parseNumericValue(report.externalTeacher);
    const fine = parseNumericValue(report.fine);
    const saleChala = parseNumericValue(report.saleChala);
    const costPerBucket = parseNumericValue(report.costPerBucket);
    const healthCard = parseNumericValue(report.healthCardPayment);
    const other = parseNumericValue(report.other);

    const cabCount = Number.isFinite(horsesCount) ? horsesCount : 0;
    const cabDetail = cabCount ? `Caballos: ${formatNumberDisplay(cabCount)}` : '';

    const baseCharges = [
      {
        label: 'ALFA',
        detail: totalAlphaKg
          ? `Total Kg mes: ${formatNumberDisplay(totalAlphaKg)} x Precio: ${formatCurrency(priceAlpha)}`
          : '',
        amount: priceAlpha * totalAlphaKg,
      },
      { label: 'BOX', detail: cabDetail, amount: box * cabCount },
      { label: 'SECCION', detail: cabDetail, amount: section * cabCount },
      { label: 'A/CANASTON', detail: cabDetail, amount: aBasket * cabCount },
      { label: 'APORTE CAB. VOLANTE', detail: cabDetail, amount: contribution * cabCount },
      { label: 'APLICACION VACUNA', detail: cabDetail, amount: vaccine * cabCount },
      { label: 'DESPARASITACION', detail: cabDetail, amount: deworming * cabCount },
      { label: 'TOMA EXAMEN DE ANEMIA', detail: cabDetail, amount: amenia * cabCount },
      { label: 'PROFESOR EXTERNO', detail: cabDetail, amount: teacher * cabCount },
      { label: 'MULTA', detail: '', amount: fine },
    ];

    const saleDetail =
      saleChala || costPerBucket
        ? `${formatNumberDisplay(saleChala) || '0'} cubos`
        : '';

    const extraCharges = [
      { label: 'VENTA DE CHALA', detail: saleDetail, amount: saleChala * costPerBucket },
      {
        label: 'COSTO POR CUBO',
        detail: costPerBucket ? `Bs. ${formatNumberDisplay(costPerBucket)}` : '',
        amount: 0,
      },
      { label: 'PAGO CARTILLA SANITARIA', detail: cabDetail, amount: healthCard * cabCount },
      { label: 'OTROS', detail: '', amount: other },
    ];

    const subTotal = baseCharges.reduce((sum, item) => sum + item.amount, 0);
    const extraTotal = extraCharges.reduce((sum, item) => sum + item.amount, 0);
    const total = subTotal + extraTotal;

    return {
      baseCharges,
      extraCharges,
      subTotal,
      total,
    };
  };

  const appendReportToPdf = (doc: jsPDF, report: OwnerReportMonth) => {
    const marginX = 40;
    let currentY = 50;
    const pageWidth = doc.internal.pageSize.getWidth();

    const logoTop = 20;
    const logoMargin = 40;
    const logoWidth = 110;
    const logoHeight = 80;
    let headerBaseY = currentY;
    let downloadTimestampX = marginX;
    let downloadTimestampY = currentY + 12;
    if (logoDataUrl) {
      doc.addImage(logoDataUrl, 'PNG', logoMargin, logoTop, logoWidth, logoHeight);
      headerBaseY = Math.max(currentY, logoTop + logoHeight / 2 - 20);
      downloadTimestampX = logoMargin;
      downloadTimestampY = logoTop + logoHeight + 20;
    }

    const ownerName = getOwnerName(report.fk_idOwner);
    const periodLabel = formatMonthLabel(report.period);
    const {
      horses: normalizedHorses,
      horsesCount,
      totalDays,
      totalAlphaMonthly,
    } = summarizeHorseReports(report.horses_report);

    const horsesData = normalizedHorses.map((horse) => ({
      name: getHorseName(horse.fk_idHorse),
      days: horse.days,
      alphaKg: horse.alphaKg,
      monthlyAlphaKg: horse.monthlyAlphaKg,
    }));

    const charges = buildChargesSummary(report, totalAlphaMonthly, horsesCount);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(ownerName.toUpperCase(), pageWidth / 2, headerBaseY + 8, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    const periodText = periodLabel ? `(${periodLabel})` : `(${report.period})`;
    doc.text(periodText, pageWidth / 2, headerBaseY + 26, { align: 'center' });

    const generatedAt = dayjs().format('DD/MM/YYYY HH:mm');
    doc.setFontSize(10);
    doc.text(`Descargado: ${generatedAt}`, downloadTimestampX, downloadTimestampY, {
      align: 'left',
    });
    doc.setFont('helvetica', 'normal');

    const contentStartY = headerBaseY + 12;
    const logoBottomY = logoDataUrl ? logoTop + logoHeight + 30 : 0;
    currentY = Math.max(contentStartY, logoBottomY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);

    if (horsesData.length > 0) {
      const horsesTableBody = horsesData.map((horse) => [
        horse.name,
        formatNumberDisplay(horse.days) || '0',
        formatNumberDisplay(horse.alphaKg) || '0',
        formatNumberDisplay(horse.monthlyAlphaKg) || '0',
      ]);
      const horsesTableFoot = [
        [
          `Total caballos: ${formatNumberDisplay(horsesCount) || '0'}`,
          formatNumberDisplay(totalDays) || '0',
          '',
          formatNumberDisplay(totalAlphaMonthly) || '0',
        ],
      ];
      autoTable(doc, {
        startY: currentY,
        head: [['Caballo', 'Dias', 'Kg Alfalfa', 'Total Kg Mes']],
        body: horsesTableBody,
        foot: horsesTableFoot,
        theme: 'grid',
        headStyles: { fillColor: TABLE_ACCENT_COLOR, textColor: TABLE_ACCENT_TEXT },
        footStyles: {
          fillColor: TABLE_ACCENT_COLOR,
          textColor: TABLE_ACCENT_TEXT,
          fontStyle: 'bold',
        },
        styles: { fontSize: 10, halign: 'center' },
        columnStyles: {
          0: { halign: 'left' },
          3: { halign: 'center' },
        },
      });
      currentY = (doc as any).lastAutoTable.finalY + 20;
    } else {
      doc.setFont('helvetica', 'italic');
      doc.text('Sin caballos registrados en este periodo.', marginX, currentY);
      doc.setFont('helvetica', 'normal');
      currentY += 20;
    }

    type TableRow = CellInput[];
    const chargesBody: TableRow[] = charges.baseCharges.map((item) => [
      item.label,
      item.detail,
      formatCurrency(item.amount),
    ]);
    const subTotalRowIndex = chargesBody.length;
    chargesBody.push(['SUB TOTAL', '', formatCurrency(charges.subTotal)]);
    const hasCostPerBucketRow = charges.extraCharges.some(
      (item) => item.label === 'COSTO POR CUBO',
    );
    let mergedAmountApplied = false;
    charges.extraCharges.forEach((item) => {
      if (item.label === 'VENTA DE CHALA') {
        const amountCell: CellInput =
          hasCostPerBucketRow && !mergedAmountApplied
            ? {
                content: formatCurrency(item.amount),
                rowSpan: 2,
                styles: { halign: 'right' },
              }
            : formatCurrency(item.amount);
        chargesBody.push([item.label, item.detail, amountCell]);
        if (hasCostPerBucketRow) mergedAmountApplied = true;
        return;
      }
      if (item.label === 'COSTO POR CUBO' && mergedAmountApplied) {
        chargesBody.push([item.label, item.detail, '']);
        return;
      }
      chargesBody.push([item.label, item.detail, formatCurrency(item.amount)]);
    });
    const chargesFoot = [['TOTAL', '', formatCurrency(charges.total)]];

    autoTable(doc, {
      startY: currentY,
      head: [['Concepto', 'Detalle', 'Monto (Bs.)']],
      body: chargesBody,
      foot: chargesFoot,
      theme: 'grid',
      headStyles: { fillColor: TABLE_ACCENT_COLOR, textColor: TABLE_ACCENT_TEXT },
      footStyles: {
        fillColor: TABLE_ACCENT_COLOR,
        textColor: TABLE_ACCENT_TEXT,
        fontStyle: 'bold',
      },
      styles: { fontSize: 10, halign: 'left' },
      columnStyles: {
        2: { halign: 'right' },
      },
      didParseCell: (data) => {
        if (data.row.section === 'body' && data.row.index === subTotalRowIndex) {
          data.cell.styles.fillColor = TABLE_ACCENT_COLOR;
          data.cell.styles.textColor = TABLE_ACCENT_TEXT;
          data.cell.styles.fontStyle = 'bold';
        }
        if (data.row.section === 'foot') {
          data.cell.styles.fillColor = TABLE_ACCENT_COLOR;
          data.cell.styles.textColor = TABLE_ACCENT_TEXT;
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });
  };

  const createFileName = (report: OwnerReportMonth) => {
    const ownerName = getOwnerName(report.fk_idOwner)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const periodDate = dayjs(report.period);
    const periodSlug = periodDate.isValid() ? periodDate.format('YYYY-MM') : 'periodo';
    return `Reporte-${ownerName}-${periodSlug}.pdf`;
  };

  const handleDownloadReport = (report: OwnerReportMonth) => {
    const doc = new jsPDF('p', 'pt', 'letter');
    appendReportToPdf(doc, report);
    doc.save(createFileName(report));
  };

  const handleDownloadFilteredReports = () => {
    if (!reportsToDisplay.length) {
      toast.error('No hay reportes en el rango seleccionado.');
      return;
    }

    const doc = new jsPDF('p', 'pt', 'letter');
    reportsToDisplay.forEach((report, index) => {
      if (index > 0) doc.addPage();
      appendReportToPdf(doc, report);
    });
    const fileSuffix =
      filterStart || filterEnd
        ? `${filterStart || 'inicio'}_${filterEnd || 'fin'}`
            .replace(/[^0-9a-zA-Z_-]+/g, '')
        : 'todos';
    doc.save(`reportes-${fileSuffix}.pdf`);
  };

  const handleResetFilters = () => {
    setFilterStart('');
    setFilterEnd('');
  };

  const fetchOwners = async () => {
    try {
      const res = await fetch(OWNERS_URL);
      if (!res.ok) throw new Error('Error al obtener propietarios');
      const data = await res.json();
      setOwners(data);
    } catch {
      toast.error('No se pudieron cargar propietarios');
    }
  };

  const fetchHorses = async () => {
    try {
      const res = await fetch(HORSES_URL);
      if (!res.ok) throw new Error('Error al obtener caballos');
      const data = await res.json();
      setHorses(data);
    } catch {
      toast.error('No se pudieron cargar caballos');
    }
  };

  const loadLogo = async () => {
    try {
      const LOGO_URL = `${import.meta.env.BASE_URL}image/LogoHipica.png`;
      const response = await fetch(LOGO_URL);
      if (!response.ok) return;
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setLogoDataUrl(reader.result);
        }
      };
      reader.readAsDataURL(blob);
    } catch {
      console.warn('No se pudo cargar el logo para el PDF.');
    }
  };

  const fetchOwnerHorses = async (ownerId: number, existing: HorseReport[] = []) => {
    if (!ownerId) {
      setOwnerHorses([]);
      setHorsesReport([]);
      return;
    }

    setLoadingOwnerHorses(true);
    try {
      const res = await fetch(`${HORSES_URL}by_owner/${ownerId}`);
      if (!res.ok) throw new Error('Error al obtener caballos del propietario');
      const data: HorseOption[] = await res.json();
      setOwnerHorses(data);
      setHorsesReport(
        data.map((horse) => {
          const previous = existing.find((item) => item.fk_idHorse === horse.idHorse);
          const days = previous?.days ?? 0;
          const alphaKg = previous?.alphaKg ?? 0;
          return {
            fk_idHorse: horse.idHorse,
            days,
            alphaKg,
            daysDisplay: previous?.daysDisplay ?? (days ? formatNumberDisplay(days) : ''),
            alphaKgDisplay: previous?.alphaKgDisplay ?? (alphaKg ? formatNumberDisplay(alphaKg) : ''),
          };
        })
      );
    } catch {
      toast.error('No se pudieron cargar los caballos del propietario.');
      setOwnerHorses([]);
      setHorsesReport([]);
    } finally {
      setLoadingOwnerHorses(false);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al obtener reportes');
      const data = await res.json();
      setReports(data);
    } catch {
      toast.error('No se pudieron cargar los reportes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    fetchOwners();
    fetchHorses();
    loadLogo();
  }, []);

  useEffect(() => {
    if (!owners.length) {
      if (newReport.fk_idOwner !== 0) {
        setNewReport((prev) => ({ ...prev, fk_idOwner: 0 }));
      }
      setOwnerHorses([]);
      setHorsesReport([]);
      return;
    }

    const ownerExists = owners.some((owner) => owner.idOwner === newReport.fk_idOwner);

    if (!ownerExists && newReport.fk_idOwner !== 0) {
      setNewReport((prev) => ({ ...prev, fk_idOwner: 0 }));
      setOwnerHorses([]);
      setHorsesReport([]);
    }
  }, [owners, newReport.fk_idOwner]);

  const resetForm = () => {
    setNewReport(createInitialReport());
    setNumericDisplays(createInitialNumericDisplays());
    setHorsesReport([]);
    setOwnerHorses([]);
    setEditingId(null);
  };

  const handleReportChange =
    (field: keyof OwnerReportMonth) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { value } = event.target;

      if (field === 'fk_idOwner') {
        const ownerId = value === '' ? 0 : Number(value);
        setNewReport((prev) => ({
          ...prev,
          fk_idOwner: ownerId,
        }));
        setOwnerHorses([]);
        setHorsesReport([]);
        fetchOwnerHorses(ownerId);
        return;
      }

      if (NUMERIC_FIELDS.includes(field as NumericField)) {
        const numericField = field as NumericField;
        setNumericDisplays((prev) => ({
          ...prev,
          [numericField]: value,
        }));
        const parsed = parseNumberInput(value);
        setNewReport((prev) => ({
          ...prev,
          [field]: parsed ?? 0,
        }));
        return;
      }

      setNewReport((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

  const updateHorseRow = (index: number, field: 'days' | 'alphaKg', rawValue: string) => {
    setHorsesReport((prev) => {
      const next = [...prev];
      const parsed = parseNumberInput(rawValue);
      const displayKey = field === 'days' ? 'daysDisplay' : 'alphaKgDisplay';
      next[index] = {
        ...next[index],
        [field]: parsed ?? 0,
        [displayKey]: rawValue,
      };
      return next;
    });
  };

  const buildPayload = () => {
    const sanitizedHorses = horsesReport
      .filter((horse) => horse.fk_idHorse !== 0)
      .map((horse) => ({
        fk_idHorse: horse.fk_idHorse,
        days: Number(horse.days) || 0,
        alphaKg: Number(horse.alphaKg) || 0,
      }));

    return {
      ...newReport,
      horses_report: sanitizedHorses,
      period: newReport.period || null,
      paymentDate: newReport.paymentDate ? `${newReport.paymentDate}T00:00:00` : null,
    };
  };

  const createReport = async () => {
    if (!newReport.fk_idOwner) {
      toast.error('Selecciona un propietario v lido.');
      return;
    }

    if (!newReport.period) {
      toast.error('Ingresa un periodo v lido.');
      return;
    }

    const invalidHorse = horsesReport.some(
      (horse) =>
        horse.fk_idHorse !== 0 &&
        (horse.days > 0 || horse.alphaKg > 0) &&
        (horse.days <= 0 || horse.alphaKg <= 0)
    );

    if (invalidHorse) {
      toast.error('Completa d as y alfalfa (Kg) para cada caballo registrado.');
      return;
    }

    try {
      const payload = buildPayload();
      console.debug('Creando reporte mensual', payload);
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const detail = await extractErrorMessage(res);
        throw new Error(detail || 'Error al crear reporte');
      }
      toast.success('Reporte creado!');
      resetForm();
      fetchReports();
      setTimeout(() => {
        reportsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : 'No se pudo crear el reporte.'
      );
    }
  };

  const updateReport = async () => {
    if (editingId === null) return;

    const invalidHorse = horsesReport.some(
      (horse) =>
        horse.fk_idHorse !== 0 &&
        (horse.days > 0 || horse.alphaKg > 0) &&
        (horse.days <= 0 || horse.alphaKg <= 0)
    );

    if (invalidHorse) {
      toast.error('Completa d as y alfalfa (Kg) para cada caballo registrado.');
      return;
    }

    try {
      const payload = buildPayload();
      console.debug('Actualizando reporte mensual', editingId, payload);
      const res = await fetch(`${API_URL}${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const detail = await extractErrorMessage(res);
        throw new Error(detail || 'Error al actualizar reporte');
      }
      toast.success('Reporte actualizado!');
      resetForm();
      fetchReports();
      setTimeout(() => {
        reportsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : 'No se pudo actualizar el reporte.'
      );
    }
  };

  const deleteReport = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar reporte');
      toast.success('Reporte eliminado!');
      fetchReports();
    } catch {
      toast.error('No se pudo eliminar el reporte.');
    }
  };

  const startEditing = (report: OwnerReportMonth) => {
    const { idOwnerReportMonth, created_at, horses_report, ...rest } = report;
    const ownerId = rest.fk_idOwner || (owners[0]?.idOwner ?? 0);

    const sanitizedNumericValues = NUMERIC_FIELDS.reduce<Record<NumericField, number>>((acc, field) => {
      const rawValue = rest[field];
      if (typeof rawValue === 'number') {
        acc[field] = rawValue;
        return acc;
      }

      if (typeof rawValue === 'string') {
        const parsed = parseNumberInput(rawValue);
        acc[field] = parsed ?? 0;
        return acc;
      }

      acc[field] = Number(rawValue) || 0;
      return acc;
    }, {} as Record<NumericField, number>);

    const nextNumericDisplays = createInitialNumericDisplays();
    NUMERIC_FIELDS.forEach((field) => {
      const numericValue = sanitizedNumericValues[field];
      nextNumericDisplays[field] = formatNumberDisplay(numericValue);
    });
    setNumericDisplays(nextNumericDisplays);

    setNewReport({
      ...rest,
      ...sanitizedNumericValues,
      period: normalizeDateForInput(rest.period),
      paymentDate: normalizeDateForInput(rest.paymentDate),
      fk_idOwner: ownerId,
    });
    const existingHorses = horses_report
      ? horses_report.map((horse) => {
          const parsedDays =
            typeof horse.days === 'number' ? horse.days : parseNumberInput(String(horse.days)) ?? 0;
          const parsedAlphaKg =
            typeof horse.alphaKg === 'number'
              ? horse.alphaKg
              : parseNumberInput(String(horse.alphaKg)) ?? 0;

          return {
            ...horse,
            fk_idHorse: horse.fk_idHorse,
            days: parsedDays,
            alphaKg: parsedAlphaKg,
            daysDisplay: parsedDays ? formatNumberDisplay(parsedDays) : '',
            alphaKgDisplay: parsedAlphaKg ? formatNumberDisplay(parsedAlphaKg) : '',
          };
        })
      : [];
    setHorsesReport(existingHorses);
    setEditingId(idOwnerReportMonth ?? null);
    if (ownerId) {
      fetchOwnerHorses(ownerId, existingHorses);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      document.querySelector<HTMLInputElement>('input[name="period"]')?.focus();
    }, 300);
  };
  
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  return (
    <div className="bg-slate-900 p-6 rounded-lg shadow-xl mb-8 border border-slate-700">
      <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">Gestión Reportes Mensuales de Propietarios</h1>

      <div
        className={`p-6 rounded-lg shadow-xl mb-8 transition-all duration-500 ${
          isEditing
            ? "bg-slate-800 border-2 border-teal-400 shadow-[0_0_20px_#14b8a6]"
            : "bg-slate-800 border border-slate-700"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-teal-300">
            {isEditing ? 'Editar Reporte Mensual' : 'Agregar Nuevo Reporte Mensual'}
          </h2>
        </div>

        {isEditing && (
          <div className="mb-4 text-teal-400 font-semibold text-lg animate-pulse text-center">
            Modo edición activo, actualiza los campos y guarda los cambios
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div>
            <label className="block mb-1 text-sm text-slate-200">
              Propietario<RequiredMark />
            </label>
            <select
              value={newReport.fk_idOwner}
              onChange={handleReportChange('fk_idOwner')}
              className="w-full p-2 rounded-md bg-gray-700 text-white"
            >
              <option value={0}>Selecciona propietario</option>
              {owners.map((owner) => (
                <option key={owner.idOwner} value={owner.idOwner}>
                  {formatOwnerName(owner)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 text-sm text-slate-200">
              Periodo<RequiredMark />
            </label>
            <input
              type="date"
              name="period"
              value={normalizeDateForInput(newReport.period)}
              onChange={(event) =>
                setNewReport((prev) => ({
                  ...prev,
                  period: event.target.value,
                }))
              }
              className="w-full p-2 rounded-md bg-gray-700 text-white"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-slate-200">
              Precio Alfalfa<RequiredMark />
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={numericDisplays.priceAlpha}
              onChange={handleReportChange('priceAlpha')}
              className="w-full p-2 rounded-md bg-gray-700 text-white"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-slate-200">
              Box<RequiredMark />
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={numericDisplays.box}
              onChange={handleReportChange('box')}
              className="w-full p-2 rounded-md bg-gray-700 text-white"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-slate-200">
              Sección<RequiredMark />
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={numericDisplays.section}
              onChange={handleReportChange('section')}
              className="w-full p-2 rounded-md bg-gray-700 text-white"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-slate-200">
              A/Canaston<RequiredMark />
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={numericDisplays.aBasket}
              onChange={handleReportChange('aBasket')}
              className="w-full p-2 rounded-md bg-gray-700 text-white"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-slate-200">
              Aporte Cab. Volante<RequiredMark />
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={numericDisplays.contributionCabFlyer}
              onChange={handleReportChange('contributionCabFlyer')}
              className="w-full p-2 rounded-md bg-gray-700 text-white"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-slate-200">
              Aplicación Vacuna<RequiredMark />
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={numericDisplays.VaccineApplication}
              onChange={handleReportChange('VaccineApplication')}
              className="w-full p-2 rounded-md bg-gray-700 text-white"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-slate-200">
              Desparasitación<RequiredMark />
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={numericDisplays.deworming}
              onChange={handleReportChange('deworming')}
              className="w-full p-2 rounded-md bg-gray-700 text-white"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-slate-200">
              Toma Examen Amenia<RequiredMark />
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={numericDisplays.AmeniaExam}
              onChange={handleReportChange('AmeniaExam')}
              className="w-full p-2 rounded-md bg-gray-700 text-white"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-slate-200">
              Profesor Externo<RequiredMark />
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={numericDisplays.externalTeacher}
              onChange={handleReportChange('externalTeacher')}
              className="w-full p-2 rounded-md bg-gray-700 text-white"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-slate-200">
              Multa<RequiredMark />
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={numericDisplays.fine}
              onChange={handleReportChange('fine')}
              className="w-full p-2 rounded-md bg-gray-700 text-white"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-slate-200">
              Venta Chala<RequiredMark />
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={numericDisplays.saleChala}
              onChange={handleReportChange('saleChala')}
              className="w-full p-2 rounded-md bg-gray-700 text-white"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-slate-200">
              Costo por Cubo de Chala <RequiredMark />
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={numericDisplays.costPerBucket}
              onChange={handleReportChange('costPerBucket')}
              className="w-full p-2 rounded-md bg-gray-700 text-white"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-slate-200">
              Pago Cartilla Sanitaria<RequiredMark />
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={numericDisplays.healthCardPayment}
              onChange={handleReportChange('healthCardPayment')}
              className="w-full p-2 rounded-md bg-gray-700 text-white"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-slate-200">
              Otro<RequiredMark />
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={numericDisplays.other}
              onChange={handleReportChange('other')}
              className="w-full p-2 rounded-md bg-gray-700 text-white"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-slate-200">Fecha de pago</label>
            <input
              type="date"
              value={normalizeDateForInput(newReport.paymentDate)}
              onChange={(event) =>
                setNewReport((prev) => ({
                  ...prev,
                  paymentDate: event.target.value,
                }))
              }
              className="w-full p-2 rounded-md bg-gray-700 text-white"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-slate-200">
              Estado<RequiredMark />
            </label>
            <select
              value={newReport.state}
              onChange={handleReportChange('state')}
              className="w-full p-2 rounded-md bg-gray-700 text-white"
            >
              <option value="Pendiente">Pendiente</option>
              <option value="Pagado">Pagado</option>
              <option value="Anulado">Anulado</option>
            </select>
          </div>
        </div>

        <div className="mt-6 bg-slate-700 border border-slate-600 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-teal-300">Caballos del periodo</h3>
            {loadingOwnerHorses && (
              <span className="flex items-center gap-2 text-xs text-slate-200">
                <Loader size={16} className="animate-spin" /> Cargando caballos...
              </span>
            )}
          </div>

          {!newReport.fk_idOwner ? (
            <p className="text-sm text-slate-200">
              Selecciona un propietario para cargar sus caballos.
            </p>
          ) : horsesReport.length === 0 ? (
            <p className="text-sm text-slate-200">
              El propietario seleccionado no tiene caballos registrados.
            </p>
          ) : (
            <div className="space-y-4">
              {horsesReport.map((horse, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end bg-slate-800 border border-slate-600 p-3 rounded-md"
                >
                  <div>
                    <label className="block mb-1 text-sm text-slate-200">
                      Caballo<RequiredMark />
                    </label>
                    <div className="w-full p-2 rounded-md bg-gray-800 text-slate-200 border border-slate-600">
                      {ownerHorses.find((item) => item.idHorse === horse.fk_idHorse)?.horseName ??
                        horses.find((item) => item.idHorse === horse.fk_idHorse)?.horseName ??
                        `ID ${horse.fk_idHorse}`}
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1 text-sm text-slate-200">
                      Días<RequiredMark />
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={horse.daysDisplay ?? ''}
                      onChange={(event) => updateHorseRow(index, 'days', event.target.value)}
                      className="w-full p-2 rounded-md bg-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm text-slate-200">
                      Alfalfa Kg<RequiredMark />
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={horse.alphaKgDisplay ?? ''}
                      onChange={(event) => updateHorseRow(index, 'alphaKg', event.target.value)}
                      className="w-full p-2 rounded-md bg-gray-700 text-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={isEditing ? updateReport : createReport}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-semibold text-white ${
              isEditing ? 'bg-blue-600 hover:bg-blue-500' : 'bg-green-600 hover:bg-green-500'
            }`}
          >
            {isEditing ? <Save size={18} /> : <Plus size={18} />}
            {isEditing ? 'Actualizar Reporte' : 'Crear Reporte'}
          </button>
          {isEditing && (
            <button
              onClick={resetForm}
              className="flex items-center gap-2 px-4 py-2 rounded-md font-semibold bg-gray-600 hover:bg-gray-500 text-white"
            >
              <X size={18} /> Cancelar
            </button>
          )}
      </div>
    </div>

      <div className="bg-slate-800 p-6 rounded-lg shadow-xl mb-8 border border-slate-700">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-teal-300">Filtrar reportes por periodo</h3>
            <p className="text-xs text-slate-300">
              Selecciona mes y anio inicial/final para limitar la lista y descargar los reportes en
              bloque.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-col">
              <label className="text-xs text-slate-300 mb-1">Desde</label>
              <input
                type="month"
                value={filterStart}
                onChange={(event) => setFilterStart(event.target.value)}
                className="bg-gray-700 text-white rounded-md px-3 py-2 border border-slate-600"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-slate-300 mb-1">Hasta</label>
              <input
                type="month"
                value={filterEnd}
                onChange={(event) => setFilterEnd(event.target.value)}
                className="bg-gray-700 text-white rounded-md px-3 py-2 border border-slate-600"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleDownloadFilteredReports}
                className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-md px-4 py-2"
              >
                Descargar filtrados
              </button>
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-2 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-md px-4 py-2"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>
        {isReversedRange && (
          <p className="mt-3 text-xs text-red-300">
            El mes inicial es posterior al final. Se invertir  el rango autom ticamente para el
            filtrado.
          </p>
        )}
      </div>

      <div
        ref={reportsSectionRef}
          className="bg-gradient-to-br from-black via-slate-950 to-slate-900 p-6 rounded-2xl shadow-2xl mb-8 border border-slate-900"
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            <Loader size={24} className="animate-spin" /> Cargando reportes...
          </div>
        ) : reportsToDisplay.length === 0 ? (
          <p className="text-center text-slate-300">
            {filterStart || filterEnd
              ? 'No hay reportes en el periodo filtrado.'
              : 'No hay reportes registrados.'}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reportsToDisplay.map((report) => {
              const stateKey = report.state ?? "Pendiente";
              const statusMeta = statusStyles[stateKey] || statusStyles["Pendiente"];
              const isExpanded = expanded[report.idOwnerReportMonth ?? 0] ?? false;

              return (
                <div
                  key={report.idOwnerReportMonth}
                  className={`rounded-2xl border border-slate-800/60 bg-gradient-to-br ${statusMeta.bg} shadow-lg shadow-black/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-emerald-500/20`}
                >
                  {/* Círculo de estado */}
                  <div className="flex flex-col items-center gap-2 py-5">
                    <span className={`h-4 w-4 rounded-full ${statusMeta.dot}`} />
                    <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
                      {stateKey}
                    </span>
                  </div>

                  <div className="px-6 pb-6 space-y-4 text-sm text-slate-200">
                    <div className="text-center space-y-1">
                      <h3 className="text-lg font-semibold text-teal-300">
                        Propietario:{' '}
                        {(() => {
                          const owner = owners.find((o) => o.idOwner === report.fk_idOwner);
                          return owner ? formatOwnerName(owner) : 'Propietario no encontrado';
                        })()}
                      </h3>
                      <p className="text-slate-400">
                        {' '}
                        <span className="font-medium text-slate-200">
                          {formatDateForDisplay(report.period)}
                        </span>
                      </p>
                    </div>

                    {/* Botón expandir/contraer */}
                    <button
                      onClick={() =>
                        setExpanded((prev) => ({
                          ...prev,
                          [report.idOwnerReportMonth ?? 0]:
                            !prev[report.idOwnerReportMonth ?? 0],
                        }))
                      }
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/15"
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
                          <li>Precio alfalfa: {report.priceAlpha}</li>
                          <li>Box: {report.box}</li>
                          <li>Sección: {report.section}</li>
                          <li>Canasto A: {report.aBasket}</li>
                          <li>Contribución Cab. Flyer: {report.contributionCabFlyer}</li>
                          <li>Aplicación vacuna: {report.VaccineApplication}</li>
                          <li>Desparasitación: {report.deworming}</li>
                          <li>Examen amenia: {report.AmeniaExam}</li>
                          <li>Docente externo: {report.externalTeacher}</li>
                          <li>Multa: {report.fine}</li>
                          <li>Venta chala: {report.saleChala}</li>
                          <li>Costo por balde: {report.costPerBucket}</li>
                          <li>Pago carnet de salud: {report.healthCardPayment}</li>
                          <li>Otro: {report.other}</li>
                        </ul>

                        <div className="mt-3 bg-slate-800 rounded-md p-3 border border-slate-600">
                          <h4 className="text-sm font-semibold text-teal-200 mb-2">Caballos</h4>
                          {report.horses_report?.length ? (
                            <ul className="space-y-1 text-xs text-slate-200">
                              {report.horses_report.map((horse, i) => {
                                const horseName =
                                  horses.find((h) => h.idHorse === horse.fk_idHorse)
                                    ?.horseName ?? horse.fk_idHorse;
                                return (
                                  <li key={i}>
                                    {horseName} — Días: {horse.days}, Alfalfa Kg: {horse.alphaKg}
                                  </li>
                                );
                              })}
                            </ul>
                          ) : (
                            <p className="text-xs text-slate-400">Sin caballos registrados.</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Botones de acción */}
                    <div className="flex items-center justify-center gap-6 border-t border-slate-800 pt-6 pb-2">
                      <button
                        onClick={() => handleDownloadReport(report)}
                        className="relative flex items-center justify-center w-16 h-16 rounded-[20px]
                                    bg-gradient-to-b from-[#1A1C1E] to-[#0E0F10]
                                    shadow-[8px_8px_16px_rgba(0,0,0,0.85),-5px_-5px_12px_rgba(255,255,255,0.06)]
                                    hover:scale-[1.1]
                                    active:shadow-[inset_5px_5px_12px_rgba(0,0,0,0.9),inset_-4px_-4px_10px_rgba(255,255,255,0.05)]
                                    transition-all duration-300 ease-in-out"
                      >
                        <Download size={28} className="text-[#8FE3E6] drop-shadow-[0_0_12px_rgba(120,240,255,0.9)] transition-transform duration-300 hover:translate-y-[2px]"/> 
                      </button>
                      <button
                        onClick={() => startEditing(report)}
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
                        onClick={() => deleteReport(report.idOwnerReportMonth!)}
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
      </div>
    </div>
  );
};

export default OwnerReportMonthManagement;
