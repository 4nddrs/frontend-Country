import { useMemo } from "react";
import { Loader2, ClipboardList, CalendarDays } from "lucide-react";
import UserHeader from "../../components/UserHeader";
import { Card } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
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
  if (!status) return "Pendiente";
  const lower = status.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
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

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <UserHeader title="Tareas asignadas" />

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
        </div>
      ) : error ? (
        <Card className="max-w-3xl mx-auto p-6 bg-slate-900/60 border border-red-500/30 text-center space-y-4">
          <p className="text-sm text-red-200">{error}</p>
          <Button
            onClick={onRetry}
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
          >
            Reintentar
          </Button>
        </Card>
      ) : tasks.length === 0 ? (
        <Card className="max-w-3xl mx-auto p-6 bg-slate-900/60 border border-slate-800/60 text-center space-y-3">
          <ClipboardList className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-sm text-slate-300">
            No tienes tareas asignadas por el momento.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50 backdrop-blur-sm">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <CalendarDays className="w-6 h-6 text-emerald-400" />
                  <h3 className="text-lg text-white font-semibold">
                    Resumen de tareas
                  </h3>
                </div>
              </div>

              {/* Vista móvil */}
              <div className="space-y-3 md:hidden">
                {tasks.map((task) => {
                  const categoryLabel =
                    categories[task.fk_idTaskCategory ?? 0] ?? "Sin categoria";
                  const isUpdating = updatingTaskId === task.idTask;
                  return (
                    <div
                      key={task.idTask}
                      className="rounded-xl border border-slate-800/60 bg-slate-800/40 p-4 space-y-3"
                    >
                      <div className="flex flex-col gap-1">
                        <p className="text-sm text-white font-semibold">
                          {task.taskName}
                        </p>
                        <Badge className="w-fit bg-slate-900/60 text-slate-200 border border-slate-700/60">
                          {categoryLabel}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-400">
                        <div>
                          <p className="uppercase tracking-wide">Asignada</p>
                          <p className="text-slate-200">
                            {formatDate(task.assignmentDate)}
                          </p>
                        </div>
                        <div>
                          <p className="uppercase tracking-wide">Entrega</p>
                          <p className="text-slate-200">
                            {formatDate(task.completionDate)}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <Badge className={resolveStatusBadge(task.taskStatus)}>
                          {getStatusLabel(task.taskStatus)}
                        </Badge>
                        <TaskStatusSelect
                          value={task.taskStatus}
                          options={statusOptions}
                          onChange={(status) =>
                            onUpdateStatus(task.idTask, status)
                          }
                          disabled={isUpdating}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Vista de tabla para escritorio */}
              <div className="hidden md:block">
                <Table className="text-slate-300">
                  <TableHeader>
                    <TableRow className="border-slate-800/60">
                      <TableHead className="text-slate-400">Tarea</TableHead>
                      <TableHead className="text-slate-400">Categoria</TableHead>
                      <TableHead className="text-slate-400">Asignada</TableHead>
                      <TableHead className="text-slate-400">Entrega</TableHead>
                      <TableHead className="text-slate-400 text-center">
                        Estado
                      </TableHead>
                      <TableHead className="text-slate-400 text-right">
                        Actualizar
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {tasks.map((task) => {
                      const categoryLabel =
                        categories[task.fk_idTaskCategory ?? 0] ??
                        "Sin categoria";
                      return (
                        <TableRow
                          key={task.idTask}
                          className="border-slate-800/60 hover:bg-slate-800/40"
                        >
                          <TableCell className="text-sm text-white">
                            {task.taskName}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-slate-900/60 text-slate-200 border border-slate-700/60">
                              {categoryLabel}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-slate-300">
                            {formatDate(task.assignmentDate)}
                          </TableCell>
                          <TableCell className="text-sm text-slate-300">
                            {formatDate(task.completionDate)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              className={resolveStatusBadge(task.taskStatus)}
                            >
                              {getStatusLabel(task.taskStatus)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <TaskStatusSelect
                              value={task.taskStatus}
                              options={statusOptions}
                              onChange={(status) =>
                                onUpdateStatus(task.idTask, status)
                              }
                              disabled={updatingTaskId === task.idTask}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
