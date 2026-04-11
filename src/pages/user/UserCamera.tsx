import { useEffect, useMemo, useRef, useState } from "react";
import { Video, VideoOff, Power, PowerOff, Plus, Pencil, Trash2, X, Save, RefreshCw } from "lucide-react";
import { supabase } from "../../supabaseClient";
import {
  connectCamera,
  disconnectCamera,
  createCamera,
  updateCamera,
  deleteCamera,
  getCameras,
  getStreamUrl,
} from "../../services/cameraService";
import type { Camera } from "../../services/cameraService";
import { useConfirmDialog } from "../../components/ConfirmDialog";
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "../../components/ui/card";
import UserHeader from "../../components/UserHeader";

// ── Types ──────────────────────────────────────────────────────────────────────
type CameraForm = { name: string; ip: string; user: string; password: string };

type FieldConfig = {
  key: keyof CameraForm;
  label: string;
  placeholder: string;
  type?: string;
};

type MockMonth = {
  key: string;
  label: string;
  days: { label: string; normal: number; inquieto: number }[];
  totals: { normal: number; inquieto: number };
};

// ── Constants ─────────────────────────────────────────────────────────────────
const EMPTY_FORM: CameraForm = { name: "", ip: "", user: "", password: "" };

const MONTH_LABELS = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

// ── Chart helpers ──────────────────────────────────────────────────────────────
const hashString = (value: string) => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const mulberry32 = (seed: number) => {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

const buildMockMonths = (): MockMonth[] => {
  const now = new Date();
  const months: MockMonth[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`;
    const rng = mulberry32(hashString(key));
    const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const days: MockMonth["days"] = [];
    let totalNormal = 0;
    let totalInquieto = 0;
    for (let day = 1; day <= daysInMonth; day += 1) {
      const isCurrentMonth =
        d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      if (isCurrentMonth && day > now.getDate()) break;
      const isLastWeek = isCurrentMonth && day >= Math.max(1, now.getDate() - 6);
      const inquieto = isLastWeek
        ? Math.round(rng() * 1)
        : Math.round(rng() * 6 + (rng() > 0.85 ? 5 : 0));
      const normal = isLastWeek
        ? Math.round(18 + rng() * 8)
        : Math.round(16 + rng() * 12);
      days.push({ label: String(day).padStart(2, "0"), normal, inquieto });
      totalNormal += normal;
      totalInquieto += inquieto;
    }
    months.push({ key, label, days, totals: { normal: totalNormal, inquieto: totalInquieto } });
  }
  return months;
};

const renderDonutCenter = ({
  cx,
  cy,
  viewBox,
  normalPct,
}: {
  cx?: number;
  cy?: number;
  viewBox?: { cx: number; cy: number };
  normalPct: number;
}) => {
  const centerX = cx ?? viewBox?.cx ?? 0;
  const centerY = cy ?? viewBox?.cy ?? 0;
  return (
    <g>
      <text x={centerX} y={centerY - 6} textAnchor="middle" fill="#e2e8f0" fontSize="20" fontWeight={700}>
        {normalPct}%
      </text>
      <text x={centerX} y={centerY + 12} textAnchor="middle" fill="#94a3b8" fontSize="11">
        Calma
      </text>
    </g>
  );
};

const renderGaugeNeedle = (
  value: number,
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number
) => {
  const angle = 180 - (value / 100) * 180;
  const rad = (Math.PI / 180) * angle;
  const radius = (innerRadius + outerRadius) / 2 + 4;
  const x = cx + radius * Math.cos(rad);
  const y = cy - radius * Math.sin(rad);
  return (
    <g>
      <circle cx={cx} cy={cy} r={7} fill="#e2e8f0" />
      <path d={`M${cx} ${cy} L${x} ${y}`} stroke="#e2e8f0" strokeWidth={4} strokeLinecap="round" />
    </g>
  );
};

// ── Component ─────────────────────────────────────────────────────────────────
export function UserCamera() {
  // Camera list
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);

  // Add form
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<CameraForm>(EMPTY_FORM);
  const [isSavingAdd, setIsSavingAdd] = useState(false);

  // Inline edit
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<CameraForm>(EMPTY_FORM);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Stream
  const [activeCameraId, setActiveCameraId]   = useState<number | null>(null);
  const [connectingId, setConnectingId]       = useState<number | null>(null);
  const [streamErrors, setStreamErrors]       = useState<Set<number>>(new Set());
  const [streamConfirmed, setStreamConfirmed] = useState<Set<number>>(new Set());

  // Feedback
  const [message, setMessage] = useState("");

  // Charts
  const [needleValue, setNeedleValue] = useState(0);

  const ownerIdRef = useRef<number | null>(null);
  const { confirm, ConfirmDialog } = useConfirmDialog();

  // ── Init: fetch owner then cameras ─────────────────────────────────────────
  const fetchCameras = async () => {
    try {
      const all = await getCameras();
      setCameras(all.filter((c) => c.fk_idOwner === ownerIdRef.current));
    } catch {
      setMessage("No se pudieron cargar las cámaras.");
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user?.id) return;
        const uid = session.user.id;
        const res = await fetch("http://localhost:8000/owner/");
        if (!res.ok) return;
        const owners: { idOwner: number; uid: string }[] = await res.json();
        const match = owners.find((o) => o.uid === uid);
        if (match) {
          ownerIdRef.current = match.idOwner;
          await fetchCameras();
        }
      } finally {
        setIsInitializing(false);
      }
    })();
  }, []);

  // ── Camera CRUD ────────────────────────────────────────────────────────────
  const handleAddCamera = async () => {
    if (!addForm.name || !addForm.ip || !addForm.user || !addForm.password) {
      setMessage("Completa todos los campos para agregar la cámara.");
      return;
    }
    if (!ownerIdRef.current) {
      setMessage("No se pudo identificar el propietario. Recarga la página.");
      return;
    }
    setIsSavingAdd(true);
    setMessage("");
    try {
      await createCamera({
        name: addForm.name,
        ip: addForm.ip,
        rtsp_port: 554,
        stream_path: "/stream1",
        rtsp_user: addForm.user,
        rtsp_password: addForm.password,
        is_active: true,
        fk_idOwner: ownerIdRef.current,
      });
      setAddForm(EMPTY_FORM);
      setShowAddForm(false);
      await fetchCameras();
    } catch {
      setMessage("Error al registrar la cámara.");
    } finally {
      setIsSavingAdd(false);
    }
  };

  const handleStartEdit = (camera: Camera) => {
    setEditingId(camera.idCamera);
    setEditForm({ name: camera.name, ip: camera.ip, user: camera.rtsp_user, password: "" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm(EMPTY_FORM);
  };

  const handleSaveEdit = async (id: number) => {
    if (!editForm.name || !editForm.ip || !editForm.user) {
      setMessage("Nombre, IP y usuario son obligatorios.");
      return;
    }
    setIsSavingEdit(true);
    setMessage("");
    try {
      const payload: Parameters<typeof updateCamera>[1] = {
        name: editForm.name,
        ip: editForm.ip,
        rtsp_user: editForm.user,
      };
      if (editForm.password) payload.rtsp_password = editForm.password;
      await updateCamera(id, payload);
      setEditingId(null);
      setEditForm(EMPTY_FORM);
      await fetchCameras();
    } catch {
      setMessage("Error al actualizar la cámara.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteCamera = (camera: Camera) => {
    confirm({
      title: "¿Eliminar cámara?",
      description: `Se eliminará "${camera.name}" de forma permanente. Esta acción no se puede deshacer.`,
      confirmText: "Eliminar",
      onConfirm: async () => {
        try {
          if (activeCameraId === camera.idCamera) {
            await disconnectCamera(camera.idCamera).catch(() => {});
            setActiveCameraId(null);
            setStreamConfirmed((prev) => { const s = new Set(prev); s.delete(camera.idCamera); return s; });
          }
          await deleteCamera(camera.idCamera);
          await fetchCameras();
        } catch {
          setMessage("Error al eliminar la cámara.");
        }
      },
    });
  };

  const handleTogglePower = async (camera: Camera) => {
    if (activeCameraId === camera.idCamera) {
      try {
        await disconnectCamera(camera.idCamera);
      } catch {
        // silent — desconecta igual en el frontend
      } finally {
        setActiveCameraId(null);
        setStreamErrors((prev) => { const s = new Set(prev); s.delete(camera.idCamera); return s; });
        setStreamConfirmed((prev) => { const s = new Set(prev); s.delete(camera.idCamera); return s; });
      }
    } else {
      setConnectingId(camera.idCamera);
      setMessage("");
      setStreamErrors((prev) => { const s = new Set(prev); s.delete(camera.idCamera); return s; });
      setStreamConfirmed((prev) => { const s = new Set(prev); s.delete(camera.idCamera); return s; });
      try {
        await connectCamera(camera.idCamera);
        setActiveCameraId(camera.idCamera);
      } catch {
        setMessage(`No se pudo conectar a "${camera.name}". Verifica que el backend esté corriendo.`);
      } finally {
        setConnectingId(null);
      }
    }
  };

  const handleRetry = async (camera: Camera) => {
    // Keep no-signal card visible while we restart the backend thread.
    // Clearing streamErrors first would remount <img> immediately and race
    // with the disconnect/connect calls (the stream endpoint auto-starts capture).
    try {
      await disconnectCamera(camera.idCamera).catch(() => {});
      await connectCamera(camera.idCamera);
    } catch {
      setMessage(`No se pudo reconectar a "${camera.name}".`);
      return;
    }
    // Backend thread is now running — clear error/confirmed so <img> remounts
    // and the 12-second "Conectando..." cycle starts fresh.
    setStreamErrors((prev) => { const s = new Set(prev); s.delete(camera.idCamera); return s; });
    setStreamConfirmed((prev) => { const s = new Set(prev); s.delete(camera.idCamera); return s; });
  };

  // ── Chart data ─────────────────────────────────────────────────────────────
  const mockMonths = useMemo(() => buildMockMonths(), []);

  const [selectedMonthKey, setSelectedMonthKey] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const selectedMonth = useMemo(
    () => mockMonths.find((m) => m.key === selectedMonthKey) ?? mockMonths[mockMonths.length - 1],
    [mockMonths, selectedMonthKey]
  );

  const todayLabel = useMemo(() => String(new Date().getDate()).padStart(2, "0"), []);

  const isSelectedCurrentMonth = useMemo(() => {
    const now = new Date();
    return selectedMonth.key === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }, [selectedMonth.key]);

  const monthlyAlertData = useMemo(
    () => mockMonths.map((m) => ({ label: m.label, normal: m.totals.normal, inquieto: m.totals.inquieto })),
    [mockMonths]
  );

  const dailyAlertData = useMemo(
    () => selectedMonth.days.map((d) => ({ label: d.label, normal: d.normal, inquieto: d.inquieto })),
    [selectedMonth]
  );

  const decisionMetrics = useMemo(() => {
    const total = selectedMonth.totals.normal + selectedMonth.totals.inquieto;
    const inquietoPct = total > 0 ? Math.round((selectedMonth.totals.inquieto / total) * 100) : 0;
    return { inquietoPct, normalPct: 100 - inquietoPct };
  }, [selectedMonth]);

  const dailyTickInterval = Math.max(0, Math.floor(dailyAlertData.length / 8) - 1);

  // If the active camera doesn't confirm a frame within 12 s, show no-signal
  const activeIsConfirmed = activeCameraId !== null && streamConfirmed.has(activeCameraId);
  useEffect(() => {
    if (activeCameraId === null || activeIsConfirmed) return;
    const timer = window.setTimeout(() => {
      setStreamErrors((prev) => new Set([...prev, activeCameraId]));
    }, 12_000);
    return () => clearTimeout(timer);
  }, [activeCameraId, activeIsConfirmed]);

  // Needle animation — from 0 to target each time metric changes
  useEffect(() => {
    const target = decisionMetrics.normalPct;
    let raf = 0;
    const startTime = performance.now();
    const duration = 420;
    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setNeedleValue(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [decisionMetrics.normalPct]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <UserHeader title="Camara del Establo" />

      <div className="space-y-6">

        {/* ── Cameras section ── */}
        <Card className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-slate-700/50 backdrop-blur-sm">
          <div className="p-4 md:p-6 space-y-4">

            {/* Section header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Video className="w-6 h-6 text-cyan-400" />
                <p className="text-lg font-semibold text-white">Cámaras registradas</p>
              </div>
              {!showAddForm && (
                <button
                  onClick={() => { setShowAddForm(true); setMessage(""); }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-base bg-cyan-600 hover:bg-cyan-500 text-white"
                >
                  <Plus className="w-4 h-4" />
                  Agregar
                </button>
              )}
            </div>

            {/* Add form */}
            {showAddForm && (
              <div className="rounded-xl border border-cyan-700/50 bg-slate-900/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-base text-cyan-300 font-medium">Nueva cámara</p>
                  <button
                    onClick={() => { setShowAddForm(false); setAddForm(EMPTY_FORM); setMessage(""); }}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {([
                    { key: "name",     label: "Nombre",     placeholder: "Cámara Establo" },
                    { key: "ip",       label: "IP",          placeholder: "192.168.0.114" },
                    { key: "user",     label: "Usuario",     placeholder: "admin" },
                    { key: "password", label: "Contraseña",  placeholder: "••••••••", type: "password" },
                  ] as FieldConfig[]).map(({ key, label, placeholder, type }) => (
                    <label key={key} className="flex flex-col gap-1 text-sm text-slate-300">
                      {label}
                      <input
                        type={type ?? "text"}
                        className="rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2 text-base text-white outline-none focus:border-cyan-500"
                        placeholder={placeholder}
                        value={addForm[key]}
                        onChange={(e) => setAddForm((prev) => ({ ...prev, [key]: e.target.value }))}
                      />
                    </label>
                  ))}
                </div>
                <button
                  onClick={handleAddCamera}
                  disabled={isSavingAdd}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-base bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white"
                >
                  <Save className="w-4 h-4" />
                  {isSavingAdd ? "Guardando..." : "Guardar"}
                </button>
              </div>
            )}

            {/* Feedback message */}
            {message && (
              <div className="text-sm text-slate-200 bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-2 flex items-center justify-between">
                <span>{message}</span>
                <button onClick={() => setMessage("")} className="text-slate-400 hover:text-white ml-3">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Camera list */}
            {isInitializing ? (
              <div className="flex items-center justify-center py-8 text-slate-400 text-base gap-2">
                <div className="w-5 h-5 rounded-full border-2 border-slate-500 border-t-transparent animate-spin" />
                Cargando cámaras...
              </div>
            ) : cameras.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-500 text-base">
                <Video className="w-8 h-8 opacity-40" />
                <span>No hay cámaras registradas.</span>
                <span className="text-sm">Usa el botón "Agregar" para registrar una.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {cameras.map((camera) => {
                  const isActive    = activeCameraId === camera.idCamera;
                  const isConnecting = connectingId  === camera.idCamera;
                  const isEditing   = editingId      === camera.idCamera;

                  return (
                    <div
                      key={camera.idCamera}
                      className="rounded-xl border border-slate-700/60 bg-slate-800/40 overflow-hidden"
                    >
                      {/* Record header */}
                      <div className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isActive ? "bg-emerald-400" : "bg-slate-600"}`} />
                          <span className="text-base font-semibold text-white truncate">{camera.name}</span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">

                          {/* Edit / Cancel */}
                          {!isEditing ? (
                            <button
                              onClick={() => handleStartEdit(camera)}
                              disabled={isActive}
                              title="Editar"
                              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={handleCancelEdit}
                              title="Cancelar edición"
                              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}

                          {/* Encender / Apagar */}
                          <button
                            onClick={() => handleTogglePower(camera)}
                            disabled={isConnecting || isEditing}
                            title={isActive ? "Apagar" : "Encender"}
                            className={`p-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed ${
                              isActive
                                ? "text-rose-400 hover:text-rose-300 hover:bg-rose-900/30"
                                : "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/30"
                            }`}
                          >
                            {isConnecting ? (
                              <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                            ) : isActive ? (
                              <PowerOff className="w-4 h-4" />
                            ) : (
                              <Power className="w-4 h-4" />
                            )}
                          </button>

                          {/* Eliminar */}
                          <button
                            onClick={() => handleDeleteCamera(camera)}
                            disabled={isConnecting}
                            title="Eliminar"
                            className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-900/20 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Record body — info or edit form */}
                      {isEditing ? (
                        <div className="px-4 pb-4 pt-3 space-y-3 border-t border-slate-700/40">
                          <div className="grid sm:grid-cols-2 gap-3">
                            {([
                              { key: "name",     label: "Nombre",          placeholder: "Cámara Establo" },
                              { key: "ip",       label: "IP",               placeholder: "192.168.0.114" },
                              { key: "user",     label: "Usuario",          placeholder: "admin" },
                              { key: "password", label: "Nueva contraseña", placeholder: "Dejar vacío para no cambiar", type: "password" },
                            ] as FieldConfig[]).map(({ key, label, placeholder, type }) => (
                              <label key={key} className="flex flex-col gap-1 text-sm text-slate-300">
                                {label}
                                <input
                                  type={type ?? "text"}
                                  className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-base text-white outline-none focus:border-cyan-500"
                                  placeholder={placeholder}
                                  value={editForm[key]}
                                  onChange={(e) => setEditForm((prev) => ({ ...prev, [key]: e.target.value }))}
                                />
                              </label>
                            ))}
                          </div>
                          <button
                            onClick={() => handleSaveEdit(camera.idCamera)}
                            disabled={isSavingEdit}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-base bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 text-white"
                          >
                            <Save className="w-4 h-4" />
                            {isSavingEdit ? "Guardando..." : "Guardar cambios"}
                          </button>
                        </div>
                      ) : (
                        <div className="px-4 pb-3 pt-3 flex flex-wrap gap-5 text-sm text-slate-400 border-t border-slate-700/40">
                          <span>IP: <span className="text-slate-200">{camera.ip}</span></span>
                          <span>Puerto: <span className="text-slate-200">{camera.rtsp_port}</span></span>
                          <span>Usuario: <span className="text-slate-200">{camera.rtsp_user}</span></span>
                          {isActive ? (
                            streamConfirmed.has(camera.idCamera) ? (
                              <span className="text-emerald-400 font-medium">● Conectada</span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-yellow-400 font-medium">
                                Conectando
                                <span className="inline-flex gap-0.5 ml-0.5">
                                  {[0, 1, 2].map((i) => (
                                    <span
                                      key={i}
                                      className="inline-block w-1 h-1 rounded-full bg-yellow-400 animate-bounce"
                                      style={{ animationDelay: `${i * 180}ms` }}
                                    />
                                  ))}
                                </span>
                              </span>
                            )
                          ) : (
                            <span className="text-slate-500">● Sin señal</span>
                          )}
                        </div>
                      )}

                      {/* Stream — shown when active */}
                      {isActive && !isEditing && (
                        <div className="relative aspect-video bg-black border-t border-slate-700/40">
                          {streamErrors.has(camera.idCamera) ? (
                            /* ── No-signal card ── */
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950/95">
                              <div className="p-4 rounded-full bg-slate-800/80 border border-slate-700">
                                <VideoOff className="w-10 h-10 text-slate-500" />
                              </div>
                              <div className="text-center space-y-1">
                                <p className="text-base font-medium text-slate-300">Sin señal de video</p>
                                <p className="text-sm text-slate-500">No se pudo conectar a la cámara</p>
                              </div>
                              <button
                                onClick={() => handleRetry(camera)}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-slate-700 hover:bg-slate-600 text-white"
                              >
                                <RefreshCw className="w-4 h-4" />
                                Reintentar
                              </button>
                            </div>
                          ) : (
                            <>
                              <img
                                src={getStreamUrl(camera.idCamera)}
                                alt={`Stream ${camera.name}`}
                                className="w-full h-full object-contain"
                                onLoad={() =>
                                  setStreamConfirmed((prev) => new Set([...prev, camera.idCamera]))
                                }
                                onError={() =>
                                  setStreamErrors((prev) => new Set([...prev, camera.idCamera]))
                                }
                              />
                              {streamConfirmed.has(camera.idCamera) && (
                                <div className="absolute top-2 left-3 flex items-center gap-1.5 bg-black/60 rounded px-2 py-1">
                                  <Power className="w-3 h-3 text-emerald-400" />
                                  <span className="text-xs text-emerald-300 font-medium">EN VIVO</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* ── Charts ── */}
        <div className="grid gap-4 md:grid-cols-2">

          {/* Daily alerts */}
          <Card className="bg-gradient-to-br from-slate-900/50 to-slate-950/60 border border-slate-700/60">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-base text-slate-200">Alertas por día</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-400">Hoy: {todayLabel}</span>
                  <select
                    className="rounded-md border border-slate-700 bg-slate-900/70 px-2 py-1 text-sm text-slate-200"
                    value={selectedMonth.key}
                    onChange={(e) => setSelectedMonthKey(e.target.value)}
                  >
                    {mockMonths.map((m) => (
                      <option key={m.key} value={m.key}>{m.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="h-52">
                {dailyAlertData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-slate-500">
                    Sin alertas registradas.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyAlertData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis dataKey="label" stroke="#94a3b8" tick={{ fontSize: 11 }} interval={dailyTickInterval} />
                      <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ background: "#0f172a", border: "1px solid #334155", color: "#ffffff" }}
                        labelStyle={{ color: "#ffffff" }}
                      />
                      {isSelectedCurrentMonth && (
                        <ReferenceLine
                          x={todayLabel}
                          stroke="#38bdf8"
                          strokeDasharray="4 4"
                          label={{ value: "Hoy", position: "top", fill: "#38bdf8", fontSize: 10 }}
                        />
                      )}
                      <Line type="monotone" dataKey="normal" stroke="#22c55e" strokeWidth={2} dot={{ r: 2 }} />
                      <Line type="monotone" dataKey="inquieto" stroke="#f97316" strokeWidth={2} dot={{ r: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </Card>

          {/* Monthly alerts */}
          <Card className="bg-gradient-to-br from-slate-900/50 to-slate-950/60 border border-slate-700/60">
            <div className="p-4">
              <p className="text-base text-slate-200 mb-3">Alertas por mes (últimos 6 meses)</p>
              <div className="h-52">
                {monthlyAlertData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-slate-500">
                    Sin alertas registradas.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyAlertData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis dataKey="label" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ background: "#0f172a", border: "1px solid #334155", color: "#ffffff" }}
                        labelStyle={{ color: "#ffffff" }}
                      />
                      <Line type="monotone" dataKey="normal" stroke="#22c55e" strokeWidth={2} dot={{ r: 2 }} />
                      <Line type="monotone" dataKey="inquieto" stroke="#f97316" strokeWidth={2} dot={{ r: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </Card>

          {/* Gauge — horse state */}
          <Card className="bg-gradient-to-br from-slate-900/50 to-slate-950/60 border border-slate-700/60">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-base text-slate-200">Estado general del caballo</p>
                <div className="text-sm text-slate-400">
                  {decisionMetrics.normalPct}% tranquilo · {decisionMetrics.inquietoPct}% inquieto
                </div>
              </div>
              <div className="text-sm text-slate-400 mb-3">
                Índice basado en el porcentaje de registros en estado normal.
              </div>
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm text-slate-400 mb-1">
                  <span>Índice de tranquilidad</span>
                  <span>{decisionMetrics.normalPct}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800/80 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-500"
                    style={{ width: `${decisionMetrics.normalPct}%` }}
                  />
                </div>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      <linearGradient id="gaugeArc" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="45%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#22c55e" />
                      </linearGradient>
                    </defs>
                    <Pie
                      data={[
                        { name: "Normal",   value: decisionMetrics.normalPct },
                        { name: "Restante", value: 100 - decisionMetrics.normalPct },
                      ]}
                      dataKey="value"
                      nameKey="name"
                      startAngle={180}
                      endAngle={0}
                      innerRadius={95}
                      outerRadius={135}
                      cornerRadius={8}
                      paddingAngle={2}
                      cx="50%"
                      cy="74%"
                      labelLine={false}
                      label={({ cx, cy, innerRadius, outerRadius, index }) =>
                        index === 0
                          ? renderGaugeNeedle(
                              needleValue,
                              Number(cx ?? 0),
                              Number(cy ?? 0),
                              Number(innerRadius ?? 0),
                              Number(outerRadius ?? 0)
                            )
                          : null
                      }
                    >
                      <Cell fill="url(#gaugeArc)" />
                      <Cell fill="#1e1b4b" />
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "#0f172a", border: "1px solid #334155", color: "#ffffff" }}
                      labelStyle={{ color: "#ffffff" }}
                      formatter={(value: number, name: string) => [`value: ${value}`, name.toLowerCase()]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>

          {/* Donut — calm index */}
          <Card className="bg-gradient-to-br from-slate-900/50 to-slate-950/60 border border-slate-700/60">
            <div className="p-4 h-full flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <p className="text-base text-slate-200">Índice de calma</p>
                <span className="text-sm text-slate-400">{decisionMetrics.normalPct}%</span>
              </div>
              <div className="text-sm text-slate-400 mb-3">
                Resume el porcentaje de días con estado normal.
              </div>
              <div className="flex-1 min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      <linearGradient id="normalArc" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%"   stopColor="#2563eb" />
                        <stop offset="70%"  stopColor="#60a5fa" />
                        <stop offset="100%" stopColor="#22c55e" />
                      </linearGradient>
                      <linearGradient id="inquietudArc" x1="0" y1="1" x2="1" y2="0">
                        <stop offset="0%"   stopColor="#38bdf8" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                    </defs>
                    <Pie
                      data={[
                        { name: "Normal",   value: decisionMetrics.normalPct },
                        { name: "Restante", value: 100 - decisionMetrics.normalPct },
                      ]}
                      dataKey="value"
                      nameKey="name"
                      startAngle={210}
                      endAngle={-30}
                      innerRadius="70%"
                      outerRadius="95%"
                      cornerRadius={12}
                      paddingAngle={2}
                    >
                      <Cell fill="url(#normalArc)" />
                      <Cell fill="#1e1b4b" />
                    </Pie>
                    <Pie
                      data={[
                        { name: "Inquietud", value: decisionMetrics.inquietoPct },
                        { name: "Restante",  value: 100 - decisionMetrics.inquietoPct },
                      ]}
                      dataKey="value"
                      nameKey="name"
                      startAngle={210}
                      endAngle={-30}
                      innerRadius="50%"
                      outerRadius="64%"
                      cornerRadius={10}
                      paddingAngle={2}
                    >
                      <Cell fill="url(#inquietudArc)" />
                      <Cell fill="#0f172a" />
                    </Pie>
                    {renderDonutCenter({ normalPct: decisionMetrics.normalPct })}
                    <Tooltip
                      contentStyle={{ background: "#0f172a", border: "1px solid #334155", color: "#ffffff" }}
                      labelStyle={{ color: "#ffffff" }}
                      formatter={(value: number, name: string) => [`value: ${value}`, name.toLowerCase()]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-sm text-slate-400 mt-2">Nivel actual dentro del rango saludable.</div>
            </div>
          </Card>

        </div>
      </div>

      <ConfirmDialog />
    </div>
  );
}
