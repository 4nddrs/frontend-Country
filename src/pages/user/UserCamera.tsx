import { useEffect, useMemo, useRef, useState } from "react";
import { Video, Save, Power } from "lucide-react";
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "../../components/ui/card";
import UserHeader from "../../components/UserHeader";

type EventItem = {
  frame_idx: number;
  size: { w: number; h: number };
  id: number;
  status: string;
  activity: number;
  bbox: number[];
  ts: number;
};

type CameraConfig = {
  ip: string;
  user: string;
  password: string;
};

const LS_KEY = "cameraConfig";
const DEFAULT_VIDEO_PATH = "video/Horse.mp4";
const MIN_CONNECT_SEC = 10;
const MAX_CONNECT_SEC = 15;
const START_DELAY_SEC = 25;
const MONTH_LABELS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

type MockMonth = {
  key: string;
  label: string;
  days: { label: string; normal: number; inquieto: number }[];
  totals: { normal: number; inquieto: number };
};

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
      const isCurrentMonth = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      if (isCurrentMonth && day > now.getDate()) {
        break;
      }
      const isLastWeek = isCurrentMonth && day >= Math.max(1, now.getDate() - 6);
      const inquieto = isLastWeek ? Math.round(rng() * 1) : Math.round(rng() * 6 + (rng() > 0.85 ? 5 : 0));
      const normal = isLastWeek ? Math.round(18 + rng() * 8) : Math.round(16 + rng() * 12);
      days.push({ label: String(day).padStart(2, "0"), normal, inquieto });
      totalNormal += normal;
      totalInquieto += inquieto;
    }
    months.push({
      key,
      label,
      days,
      totals: { normal: totalNormal, inquieto: totalInquieto },
    });
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

export function UserCamera() {
  const [config, setConfig] = useState<CameraConfig>({
    ip: "",
    user: "",
    password: "",
  });
  const [savedConfig, setSavedConfig] = useState<CameraConfig | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [startDelay, setStartDelay] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [fps, setFps] = useState(30);
  const [needleValue, setNeedleValue] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const connectTimeoutRef = useRef<number | null>(null);
  const progressRef = useRef<number | null>(null);
  const startDelayTimeoutRef = useRef<number | null>(null);
  const startDelayIntervalRef = useRef<number | null>(null);
  const lastBoxRef = useRef<{ x1: number; y1: number; x2: number; y2: number } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(LS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as CameraConfig;
      setSavedConfig(parsed);
      setConfig(parsed);
    }
  }, []);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, []);

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
    const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return selectedMonth.key === currentKey;
  }, [selectedMonth.key]);
  const monthlyAlertData = useMemo(
    () =>
      mockMonths.map((m) => ({
        label: m.label,
        normal: m.totals.normal,
        inquieto: m.totals.inquieto,
      })),
    [mockMonths]
  );
  const dailyAlertData = useMemo(
    () =>
      selectedMonth.days.map((d) => ({
        label: d.label,
        normal: d.normal,
        inquieto: d.inquieto,
      })),
    [selectedMonth]
  );
  const decisionMetrics = useMemo(() => {
    const total = selectedMonth.totals.normal + selectedMonth.totals.inquieto;
    const inquietoPct = total > 0 ? Math.round((selectedMonth.totals.inquieto / total) * 100) : 0;
    return {
      total,
      inquietoPct,
      normalPct: 100 - inquietoPct,
    };
  }, [selectedMonth]);
  const dailyTickInterval = Math.max(0, Math.floor(dailyAlertData.length / 8) - 1);

  useEffect(() => {
    let raf = 0;
    const start = needleValue;
    const target = decisionMetrics.normalPct;
    const startTime = performance.now();
    const duration = 420;
    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round(start + (target - start) * eased);
      setNeedleValue(next);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [decisionMetrics.normalPct, needleValue]);

  const eventsByFrame = useMemo(() => {
    const map = new Map<number, EventItem[]>();
    for (const ev of events) {
      if (!map.has(ev.frame_idx)) map.set(ev.frame_idx, []);
      map.get(ev.frame_idx)!.push(ev);
    }
    return map;
  }, [events]);

  const drawFrame = (frameIdx: number) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { clientWidth, clientHeight } = video;
    canvas.width = clientWidth;
    canvas.height = clientHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const frameEvents = eventsByFrame.get(frameIdx);
    if (!frameEvents || frameEvents.length === 0) return;

    for (const ev of frameEvents) {
      const [x1, y1, x2, y2] = ev.bbox;
      const scaleX = canvas.width / ev.size.w;
      const scaleY = canvas.height / ev.size.h;
      const sx1 = x1 * scaleX;
      const sy1 = y1 * scaleY;
      const sx2 = x2 * scaleX;
      const sy2 = y2 * scaleY;
      const w = sx2 - sx1;
      const h = sy2 - sy1;

      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 2;
      ctx.strokeRect(sx1, sy1, w, h);

      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(sx1, sy1 - 16, 130, 16);
      ctx.fillStyle = "#fff";
      ctx.font = "12px sans-serif";
      ctx.fillText(`Caballo ${ev.id} - ${ev.status}`, sx1 + 4, sy1 - 4);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || events.length === 0 || !("requestVideoFrameCallback" in video)) return;
    let handle: number;
    const cb = (_now: DOMHighResTimeStamp, meta: VideoFrameCallbackMetadata) => {
      drawFrame(Math.floor(meta.presentedFrames));
      handle = (video as HTMLVideoElement).requestVideoFrameCallback(cb);
    };
    handle = (video as HTMLVideoElement).requestVideoFrameCallback(cb);
    return () => (video as HTMLVideoElement).cancelVideoFrameCallback(handle);
  }, [eventsByFrame, events]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    const frameIdx = Math.floor(video.currentTime * fps);
    setEvents((prev) => {
      const next = [...prev, buildFakeEvent(frameIdx)];
      return next.length > 4000 ? next.slice(-3000) : next;
    });
    drawFrame(frameIdx);
  };

  useEffect(() => {
    if (events.length === 0) return;
    drawFrame(0);
  }, [eventsByFrame, events]);

  const clearTimers = () => {
    if (connectTimeoutRef.current !== null) clearTimeout(connectTimeoutRef.current);
    if (progressRef.current !== null) clearInterval(progressRef.current);
    if (startDelayTimeoutRef.current !== null) clearTimeout(startDelayTimeoutRef.current);
    if (startDelayIntervalRef.current !== null) clearInterval(startDelayIntervalRef.current);
    connectTimeoutRef.current = null;
    progressRef.current = null;
    startDelayTimeoutRef.current = null;
    startDelayIntervalRef.current = null;
    setProgress(0);
    setIsConnecting(false);
    setStartDelay(null);
  };

  const buildFakeEvent = (frameIdx: number): EventItem => {
    const video = videoRef.current;
    const baseW = video?.videoWidth || 640;
    const baseH = video?.videoHeight || 360;
    const currentTime = video?.currentTime ?? frameIdx / Math.max(fps, 1);

    // Caja grande centrada con leve movimiento para simular seguimiento del caballo
    const w = baseW * 0.55;
    const h = baseH * 0.5;
    const wiggleX = Math.sin(frameIdx / 240) * (baseW * 0.008);
    const wiggleY = Math.cos(frameIdx / 260) * (baseH * 0.008);

    // Tras 4 minutos, deriva en diagonal arriba-izquierda para simular cambio de posicion
    const driftProgress = currentTime > 240 ? Math.min(1, (currentTime - 240) / 120) : 0;
    const horizontalDrift = -driftProgress * (baseW * 0.22);
    const verticalDrift = -driftProgress * (baseH * 0.12);

    // Pequeños saltos adicionales tras 4 min
    const jitterAmpX = driftProgress > 0 ? baseW * 0.006 : 0;
    const jitterAmpY = driftProgress > 0 ? baseH * 0.005 : 0;
    const jitterX = jitterAmpX * Math.sin(frameIdx / 45);
    const jitterY = jitterAmpY * Math.cos(frameIdx / 60);

    const xCenterTarget = baseW * 0.52 + horizontalDrift + wiggleX + jitterX;
    const yCenterTarget = baseH * 0.6 + verticalDrift + wiggleY + jitterY;

    const target = {
      x1: Math.max(0, xCenterTarget - w / 2),
      y1: Math.max(0, yCenterTarget - h / 2),
      x2: Math.min(baseW, xCenterTarget + w / 2),
      y2: Math.min(baseH, yCenterTarget + h / 2),
    };

    const prev = lastBoxRef.current ?? target;
    const lerp = 0.12; // suaviza saltos
    const smoothed = {
      x1: prev.x1 + (target.x1 - prev.x1) * lerp,
      y1: prev.y1 + (target.y1 - prev.y1) * lerp,
      x2: prev.x2 + (target.x2 - prev.x2) * lerp,
      y2: prev.y2 + (target.y2 - prev.y2) * lerp,
    };
    lastBoxRef.current = smoothed;

    const status = "estado normal";
    const activity = 0.82;

    return {
      frame_idx: frameIdx,
      size: { w: baseW, h: baseH },
      id: 1,
      status,
      activity,
      bbox: [smoothed.x1, smoothed.y1, smoothed.x2, smoothed.y2],
      ts: Date.now(),
    };
  };

  const startFakeConnect = () => {
    const totalMs = (Math.random() * (MAX_CONNECT_SEC - MIN_CONNECT_SEC) + MIN_CONNECT_SEC) * 1000;
    setIsConnecting(true);
    setProgress(0);
    const start = Date.now();
    progressRef.current = window.setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, Math.round((elapsed / totalMs) * 100));
      setProgress(pct);
    }, 200);

    connectTimeoutRef.current = window.setTimeout(() => {
      clearTimers();
      setIsConnected(true);
      const delayMs = START_DELAY_SEC * 1000;
      setStartDelay(1); // solo para mostrar overlay de arranque
      startDelayTimeoutRef.current = window.setTimeout(() => {
        playVideo();
        setStartDelay(null);
      }, delayMs);
    }, totalMs);
  };

  const playVideo = () => {
    const video = videoRef.current;
    if (!video) return;
    setIsPlaying(true);
    video.currentTime = 0;
    video.play().catch(() => {
      setMessage("No se pudo reproducir automaticamente. Presiona play.");
    });
  };

  const stopVideo = () => {
    const v = videoRef.current;
    if (v) v.pause();
    setIsPlaying(false);
    setStartDelay(null);
  };

  const handleSaveAndConnect = () => {
    if (!config.ip || !config.user || !config.password) {
      setMessage("Completa IP, usuario y contrasena");
      return;
    }
    localStorage.setItem(LS_KEY, JSON.stringify(config));
    setSavedConfig(config);
    setMessage("Configuracion guardada y conectando...");
    startConnection(config);
  };

  const startConnection = (cam: CameraConfig | null = savedConfig) => {
    const camera = cam || savedConfig;
    if (!camera) return;
    clearTimers();
    setEvents([]);
    setIsConnected(false);
    setMessage("Iniciando conexion ");
    startFakeConnect();
  };

  const handleTogglePower = () => {
    if (isConnected || isConnecting) {
      setIsConnected(false);
      stopVideo();
      clearTimers();
      setMessage("Camara apagada");
    } else {
      startConnection();
    }
  };

  const videoSrc = `${import.meta.env.BASE_URL}${DEFAULT_VIDEO_PATH}`;

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <UserHeader title="Camara del Establo" />

      <div className="max-w-5xl mx-auto space-y-6">
        {!savedConfig ? (
          <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-slate-700/50 backdrop-blur-sm">
            <div className="p-4 md:p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Video className="w-6 h-6 text-cyan-400" />
                <div>
                  <p className="text-white font-semibold">Configura tu camara RTSP</p>
                  <p className="text-xs text-slate-400">Guardamos los datos localmente solo una vez.</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <label className="space-y-1 text-sm text-slate-300">
                  IP / RTSP
                  <input
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2 text-white outline-none focus:border-cyan-500"
                    placeholder="rtsp://192.168.0.10:554/stream"
                    value={config.ip}
                    onChange={(e) => setConfig((prev) => ({ ...prev, ip: e.target.value }))}
                  />
                </label>
                <label className="space-y-1 text-sm text-slate-300">
                  Usuario
                  <input
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2 text-white outline-none focus:border-cyan-500"
                    placeholder="usuario"
                    value={config.user}
                    onChange={(e) => setConfig((prev) => ({ ...prev, user: e.target.value }))}
                  />
                </label>
                <label className="space-y-1 text-sm text-slate-300">
                  Contrasena
                  <input
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2 text-white outline-none focus:border-cyan-500"
                    placeholder="********"
                    type="password"
                    value={config.password}
                    onChange={(e) => setConfig((prev) => ({ ...prev, password: e.target.value }))}
                  />
                </label>
              </div>

              <button
                onClick={handleSaveAndConnect}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm"
              >
                <Save className="w-4 h-4" />
                Guardar y conectar
              </button>

              {message && (
                <div className="text-sm text-slate-200 bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-2">
                  {message}
                </div>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid gap-4">
            <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-slate-700/50 backdrop-blur-sm">
              <div className="p-4 md:p-6 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Video className="w-6 h-6 text-cyan-400" />
                    <div>
                      <p className="text-white font-semibold">Camara RTSP</p>
                      
                    </div>
                  </div>
                  <button
                    onClick={handleTogglePower}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${
                      isConnected || isConnecting ? "bg-rose-600 hover:bg-rose-500" : "bg-emerald-600 hover:bg-emerald-500"
                    } text-white`}
                  >
                    <Power className="w-4 h-4" />
                    {isConnected || isConnecting ? "Apagar" : "Encender"}
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-3">
                    <p className="text-xs text-slate-400 mb-1">IP / RTSP</p>
                    <p className="text-sm text-white break-all">{savedConfig.ip}</p>
                  </div>
                  <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-3">
                    <p className="text-xs text-slate-400 mb-1">Usuario</p>
                    <p className="text-sm text-white">{savedConfig.user}</p>
                  </div>
                </div>

                <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-slate-700/60">
                  <video
                    ref={videoRef}
                    src={videoSrc}
                    onTimeUpdate={handleTimeUpdate}
                    className="w-full h-full object-contain"
                    controls={false}
                    playsInline
                  />
                  <canvas ref={canvasRef} className="pointer-events-none absolute inset-0" />
                  {!isConnected && !isConnecting && !isPlaying && (
                    <div className="absolute inset-0 z-20 bg-black" />
                  )}
                  {isConnecting && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black text-white text-sm gap-3">
                      <span>Conectando a la camara...</span>
                      <div className="w-3/4 bg-slate-700 rounded-full h-2 overflow-hidden">
                        <div className="h-full bg-cyan-400 transition-all" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  )}
                  {startDelay !== null && !isConnecting && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black text-white text-sm gap-3">
                      <span>Arrancando reproduccion...</span>
                      <div className="w-9 h-9 rounded-full border-2 border-white/40 border-t-transparent animate-spin" />
                      <span className="text-xs text-slate-300">Conectando</span>
                    </div>
                  )}
                  {isConnected && !isConnecting && !isPlaying && startDelay === null && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 text-white text-sm">
                      Lista para reproducir
                    </div>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="bg-gradient-to-br from-slate-900/50 to-slate-950/60 border border-slate-700/60">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm text-slate-200">Alertas por dia</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400">Hoy: {todayLabel}</span>
                          <select
                            className="rounded-md border border-slate-700 bg-slate-900/70 px-2 py-1 text-xs text-slate-200"
                            value={selectedMonth.key}
                            onChange={(e) => setSelectedMonthKey(e.target.value)}
                          >
                            {mockMonths.map((m) => (
                              <option key={m.key} value={m.key}>
                                {m.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="h-52">
                        {dailyAlertData.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-xs text-slate-500">
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

                  <Card className="bg-gradient-to-br from-slate-900/50 to-slate-950/60 border border-slate-700/60">
                    <div className="p-4">
                      <p className="text-sm text-slate-200 mb-3">Alertas por mes (ultimos 6 meses)</p>
                      <div className="h-52">
                        {monthlyAlertData.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-xs text-slate-500">
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

                  <Card className="bg-gradient-to-br from-slate-900/50 to-slate-950/60 border border-slate-700/60">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm text-slate-200">Estado general del caballo</p>
                        <div className="text-xs text-slate-400">
                          {decisionMetrics.normalPct}% tranquilo · {decisionMetrics.inquietoPct}% inquieto
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-400 mb-3">
                        Indice basado en el porcentaje de registros en estado normal.
                      </div>
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                          <span>Indice de tranquilidad</span>
                          <span>{decisionMetrics.normalPct}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-800/80 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400"
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
                                { name: "Normal", value: decisionMetrics.normalPct },
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

                  <Card className="bg-gradient-to-br from-slate-900/50 to-slate-950/60 border border-slate-700/60">
                    <div className="p-4 h-full flex flex-col">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm text-slate-200">Indice de calma</p>
                        <span className="text-xs text-slate-400">{decisionMetrics.normalPct}%</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mb-3">
                        Resume el porcentaje de dias con estado normal.
                      </div>
                      <div className="flex-1 min-h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <defs>
                              <linearGradient id="normalArc" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#2563eb" />
                                <stop offset="70%" stopColor="#60a5fa" />
                                <stop offset="100%" stopColor="#22c55e" />
                              </linearGradient>
                              <linearGradient id="inquietudArc" x1="0" y1="1" x2="1" y2="0">
                                <stop offset="0%" stopColor="#38bdf8" />
                                <stop offset="100%" stopColor="#10b981" />
                              </linearGradient>
                            </defs>
                            <Pie
                              data={[
                                { name: "Normal", value: decisionMetrics.normalPct },
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
                                { name: "Restante", value: 100 - decisionMetrics.inquietoPct },
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
                      <div className="text-xs text-slate-400 mt-2">
                        Nivel actual dentro del rango saludable.
                      </div>
                    </div>
                  </Card>
                </div>

                {message && (
                  <div className="text-sm text-slate-200 bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-2">
                    {message}
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
