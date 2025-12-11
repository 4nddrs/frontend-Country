import { useEffect, useMemo, useRef, useState } from "react";
import { Video, Bell, AlertTriangle, Play, Square } from "lucide-react";
import { Card } from "../../components/ui/card";
import UserHeader from "../../components/UserHeader";

type EventItem = {
  frame_idx: number;
  size: { w: number; h: number };
  id: number;
  status: string;
  activity: number;
  bbox: number[];
};

const API_URL = "http://localhost:8000";

export function UserCamera() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [fps, setFps] = useState(30);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const anomalous = useMemo(
    () => events.filter((e) => e.status !== "normal"),
    [events]
  );

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

      ctx.strokeStyle = ev.status === "normal" ? "#22c55e" : "#f97316";
      ctx.lineWidth = 2;
      ctx.strokeRect(sx1, sy1, w, h);

      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(sx1, sy1 - 16, 130, 16);
      ctx.fillStyle = "#fff";
      ctx.font = "12px sans-serif";
      ctx.fillText(`ID ${ev.id} ${ev.status}`, sx1 + 4, sy1 - 4);
    }
  };

  // Sincroniza con requestVideoFrameCallback si existe
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

  // Fallback con timeupdate
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    const frameIdx = Math.floor(video.currentTime * fps);
    drawFrame(frameIdx);
  };

  // Dibuja la primera vez que llegan eventos aunque el video esté pausado
  useEffect(() => {
    if (events.length === 0) return;
    drawFrame(0);
  }, [eventsByFrame, events]);

  const handleUpload = async () => {
    if (!file) {
      setMessage("Selecciona un video");
      return;
    }
    setLoading(true);
    setMessage("");
    setEvents([]);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch(`${API_URL}/detection/video`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setFps(data.fps || 30); // si el backend no envía fps, queda en 30
      setEvents(data.events || []);
      setMessage("Detección completada");

      // fuerza dibujar y reproducir
      const v = videoRef.current;
      if (v) {
        v.currentTime = 0;
        drawFrame(0);
        v.play().catch(() => {
          /* si autoplay falla, el usuario puede darle play */
        });
      }
    } catch (err: any) {
      setMessage(err?.message || "Error en la detección");
    } finally {
      setLoading(false);
    }
  };

  const handleStop = () => {
    setLoading(false);
    setMessage("Detenido");
    const v = videoRef.current;
    if (v) v.pause();
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <UserHeader title="Cámara del Establo" />

      <div className="max-w-5xl mx-auto space-y-6">
        <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-slate-700/50 backdrop-blur-sm">
          <div className="p-4 md:p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex items-center gap-3">
                <Video className="w-6 h-6 text-cyan-400" />
                <div>
                  <p className="text-white font-semibold">Sube un video (mp4)</p>
                  <p className="text-xs text-slate-400">
                    El backend correrá el modelo YOLOv8
                  </p>
                </div>
              </div>
              <label className="inline-flex cursor-pointer text-sm text-white bg-slate-700/70 hover:bg-slate-600/70 px-4 py-2 rounded-lg transition">
                Elegir video
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>

            {preview && (
              <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-slate-700/60">
                <video
                  ref={videoRef}
                  src={preview}
                  controls
                  className="w-full h-full object-contain"
                  onTimeUpdate={handleTimeUpdate}
                />
                <canvas
                  ref={canvasRef}
                  className="pointer-events-none absolute inset-0"
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleUpload}
                disabled={loading || !file}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                {loading ? "Procesando..." : "Comenzar detección"}
              </button>
              <button
                onClick={handleStop}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm"
              >
                <Square className="w-4 h-4" />
                Detener
              </button>
            </div>

            {message && (
              <div className="text-sm text-slate-200 bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-2">
                {message}
              </div>
            )}
          </div>
        </Card>

        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50 backdrop-blur-sm">
            <div className="p-4">
              <h3 className="text-sm text-slate-300 mb-3">Eventos detectados</h3>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {events.length === 0 && (
                  <p className="text-slate-500 text-sm">Sin eventos.</p>
                )}
                {events.map((ev, idx) => (
                  <div
                    key={`${ev.id}-${idx}`}
                    className="text-sm text-white bg-slate-800/60 border border-slate-700/60 rounded-md px-3 py-2"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">ID {ev.id}</span>
                      <span className="text-xs text-slate-400">
                        bbox: {ev.bbox.join(", ")}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-300 mt-1">
                      <span>Estado: {ev.status}</span>
                      <span>Actividad: {ev.activity.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50 backdrop-blur-sm">
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                <p className="text-sm text-white">Alertas</p>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {anomalous.length === 0 && (
                  <p className="text-slate-500 text-sm">Sin anomalías.</p>
                )}
                {anomalous.map((ev, idx) => (
                  <div
                    key={`anom-${ev.id}-${idx}`}
                    className="flex items-start gap-2 bg-slate-800/60 border border-slate-700/60 rounded-md px-3 py-2"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5" />
                    <div className="text-xs text-white">
                      <div className="font-semibold">
                        ID {ev.id} · {ev.status}
                      </div>
                      <div className="text-slate-400">
                        Actividad {ev.activity.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
