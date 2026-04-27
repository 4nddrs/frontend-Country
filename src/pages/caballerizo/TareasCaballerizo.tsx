import { useMemo, useState } from "react";
import { Loader2, ClipboardList, GripVertical, CheckCircle2, AlertCircle, Clock, XCircle } from "lucide-react";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { TaskStatusSelect } from "./components/TaskStatusSelect";
import type { CaballerizoTask } from "./types";

interface TareasCaballerizoProps {
  tasks: CaballerizoTask[];
  loading: boolean;
  error: string | null;
  categoryMap: Record<number, string>;
  statusOptions: string[];
  onRetry: () => void;
  onUpdateStatus: (taskId: number, status: string) => Promise<void>;
  updatingTaskId: number | null;
}

const formatDate = (value?: string | null) => {
  if (!value) return "Sin registro";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-BO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const getStatusLabel = (status?: string | null) => {
  if (!status) return "Asignada";
  const lower = status.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

const normalizeStatus = (status?: string | null): string => {
  const value = (status ?? "").trim().toLowerCase();
  if (value.includes("cancel")) return "Cancelada";
  if (value.includes("complet")) return "Completada";
  if (value.includes("progreso") || value.includes("proceso")) return "En progreso";
  return "Asignada";
};

const resolveStatusBadge = (status?: string | null) => {
  const normalized = (status ?? "").toLowerCase();
  if (normalized.includes("complet")) {
    return "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40";
  }
  if (normalized.includes("progreso") || normalized.includes("progres")) {
    return "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40";
  }
  if (normalized.includes("cancel")) {
    return "bg-red-500/20 text-red-200 border border-red-500/40";
  }
  return "bg-slate-800/60 text-slate-200 border border-slate-700/60";
};

const resolveColumnColor = (status: string): { bg: string; border: string; icon: React.ReactNode } => {
  const normalized = normalizeStatus(status);
  switch (normalized) {
    case "Completada":
      return {
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/30",
        icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
      };
    case "En progreso":
      return {
        bg: "bg-cyan-500/10",
        border: "border-cyan-500/30",
        icon: <Clock className="w-5 h-5 text-cyan-400" />,
      };
    case "Cancelada":
      return {
        bg: "bg-red-500/10",
        border: "border-red-500/30",
        icon: <XCircle className="w-5 h-5 text-red-400" />,
      };
    default:
      return {
        bg: "bg-slate-500/10",
        border: "border-slate-500/30",
        icon: <AlertCircle className="w-5 h-5 text-slate-400" />,
      };
  }
};

export function TareasCaballerizo({
  tasks,
  loading,
  error,
  categoryMap,
  statusOptions,
  onRetry,
  onUpdateStatus,
  updatingTaskId,
}: TareasCaballerizoProps) {
  const categories = useMemo(() => categoryMap ?? {}, [categoryMap]);
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);

  const COLUMNS = ["Asignada", "En progreso", "Completada", "Cancelada"];

  const tasksByStatus = useMemo(() => {
    const grouped: Record<string, CaballerizoTask[]> = {};
    COLUMNS.forEach((col) => {
      grouped[col] = [];
    });
    tasks.forEach((task) => {
      const status = normalizeStatus(task.taskStatus);
      if (grouped[status]) {
        grouped[status].push(task);
      }
    });
    return grouped;
  }, [tasks]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: number) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, targetStatus: string) => {
    e.preventDefault();
    if (!draggedTaskId) return;

    const draggedTask = tasks.find((t) => t.idTask === draggedTaskId);
    if (!draggedTask) return;

    const currentStatus = normalizeStatus(draggedTask.taskStatus);
    if (currentStatus === targetStatus) {
      setDraggedTaskId(null);
      return;
    }

    try {
      await onUpdateStatus(draggedTaskId, targetStatus);
    } catch (err) {
      console.error("Error updating task status:", err);
    } finally {
      setDraggedTaskId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 md:p-6 lg:p-8">
        <div className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
          <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">
            Gestión de Tareas
          </h1>
          <div className="flex min-h-[400px] items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-4 md:p-6 lg:p-8">
        <div className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
          <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">
            Gestión de Tareas
          </h1>
          <Card className="max-w-3xl mx-auto p-6 bg-slate-900/60 border border-red-500/30 text-center space-y-4">
            <p className="text-sm text-red-200">{error}</p>
            <Button
              onClick={onRetry}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
            >
              Reintentar
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="min-h-screen p-4 md:p-6 lg:p-8">
        <div className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
          <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">
            Gestión de Tareas
          </h1>
          <Card className="max-w-3xl mx-auto p-6 bg-slate-900/60 border border-slate-800/60 text-center space-y-3">
            <ClipboardList className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-sm text-slate-300">
              No tienes tareas asignadas por el momento.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 bg-black">
      <div className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
        <h1 className="text-3xl font-bold mb-2 text-center text-[#bdab62]">
          Gestión de Tareas
        </h1>
        <p className="text-center text-slate-400 text-sm mb-8">
          Arrastra y suelta tus tareas para cambiar su estado
        </p>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {COLUMNS.map((status) => {
            const columnTasks = tasksByStatus[status] || [];
            const { bg, border, icon } = resolveColumnColor(status);

            return (
              <div key={status} className="flex flex-col">
                {/* Column Header */}
                <div className={`flex items-center gap-3 mb-4 p-4 rounded-xl ${bg} border ${border}`}>
                  {icon}
                  <div>
                    <h2 className="font-semibold text-white">{status}</h2>
                    <p className="text-xs text-slate-400">{columnTasks.length} tarea{columnTasks.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>

                {/* Droppable Area */}
                <div
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, status)}
                  className={`flex-1 min-h-[500px] rounded-xl border-2 border-dashed ${bg} border-slate-700/40 p-4 transition-all ${
                    draggedTaskId ? "opacity-75" : ""
                  }`}
                >
                  <div className="space-y-3">
                    {columnTasks.length === 0 ? (
                      <div className="flex items-center justify-center h-20 text-slate-500">
                        <p className="text-sm">Sin tareas</p>
                      </div>
                    ) : (
                      columnTasks.map((task) => {
                        const categoryLabel = categories[task.fk_idTaskCategory ?? 0] ?? "Sin categoría";
                        const isUpdating = updatingTaskId === task.idTask;
                        const isDragging = draggedTaskId === task.idTask;

                        return (
                          <div
                            key={task.idTask}
                            draggable
                            onDragStart={(e) => handleDragStart(e, task.idTask)}
                            className={`rounded-lg border border-slate-700/60 bg-slate-800/60 p-4 cursor-move transition-all hover:border-cyan-400/30 hover:shadow-lg hover:shadow-cyan-500/10 ${
                              isDragging ? "opacity-50 scale-95" : ""
                            }`}
                          >
                            <div className="space-y-3">
                              {/* Title and Drag Handle */}
                              <div className="flex items-start gap-2">
                                <GripVertical className="w-4 h-4 text-slate-500 flex-shrink-0 mt-1" />
                                <h3 className="font-semibold text-white text-sm flex-1">{task.taskName}</h3>
                              </div>

                              {/* Category Badge */}
                              <Badge className="w-fit bg-slate-900/60 text-slate-200 border border-slate-700/60 text-xs">
                                {categoryLabel}
                              </Badge>

                              {/* Dates */}
                              <div className="space-y-1 text-xs text-slate-400">
                                {task.assignmentDate && (
                                  <p>
                                    <span className="text-slate-500">Asignada:</span> {formatDate(task.assignmentDate)}
                                  </p>
                                )}
                                {task.completionDate && (
                                  <p>
                                    <span className="text-slate-500">Entrega:</span> {formatDate(task.completionDate)}
                                  </p>
                                )}
                              </div>

                              {/* Status Selector */}
                              <div className="pt-2 border-t border-slate-700/40">
                                <TaskStatusSelect
                                  value={status}
                                  options={statusOptions}
                                  onChange={(newStatus) => onUpdateStatus(task.idTask, newStatus)}
                                  disabled={isUpdating}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}



