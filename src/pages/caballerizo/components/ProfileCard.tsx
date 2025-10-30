import { useRef } from "react";
import { Calendar, IdCard, Loader2, Phone } from "lucide-react";
import type { CaballerizoEmployee } from "../types";
import { Card } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { decodeBackendImage } from "../../../utils/imageHelpers";

interface ProfileCardProps {
  employee: CaballerizoEmployee;
  onViewTasks: () => void;
  onViewHorses: () => void;
  onEditPhoto: (file: File) => void;
  isUpdatingPhoto: boolean;
}

const formatDate = (value?: string | null) => {
  if (!value) return "Sin registro";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-BO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
};

export function ProfileCard({
  employee,
  onViewTasks,
  onViewHorses,
  onEditPhoto,
  isUpdatingPhoto,
}: ProfileCardProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const photo = decodeBackendImage(employee.employeePhoto ?? "");
  const statusLabel = employee.status === false ? "Inactivo" : "Activo";

  const triggerFilePicker = () => {
    if (isUpdatingPhoto) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onEditPhoto(file);
      // reset value to allow selecting same file twice
      event.target.value = "";
    }
  };

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-slate-700/50 backdrop-blur-sm">
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />

      <div className="relative p-6 md:p-8 space-y-8">
        <div className="flex flex-col xl:flex-row xl:items-center gap-6 justify-between">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="relative self-center sm:self-auto">
              <img
                src={photo}
                alt={employee.fullName}
                className="w-24 h-24 md:w-28 md:h-28 rounded-2xl object-cover border border-emerald-500/30 shadow-lg shadow-emerald-500/20"
              />
              {isUpdatingPhoto ? (
                <div className="absolute inset-0 rounded-2xl bg-slate-900/70 backdrop-blur-sm flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                </div>
              ) : null}
            </div>

            <div className="text-center sm:text-left space-y-3">
              <h2 className="text-2xl md:text-3xl text-white">
                {employee.fullName}
              </h2>
              <p className="text-sm text-slate-400">
                Caballerizo del club
              </p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {statusLabel}
                </Badge>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <Button
                  variant="secondary"
                  className="bg-slate-800/60 hover:bg-slate-800 text-white"
                  onClick={triggerFilePicker}
                  disabled={isUpdatingPhoto}
                >
                  {isUpdatingPhoto ? "Actualizando..." : "Cambiar foto"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={onViewTasks}
              className="border-emerald-500/40 text-white hover:bg-emerald-500/10"
            >
              Ver tareas
            </Button>
            <Button
              onClick={onViewHorses}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/20"
            >
              Caballos asignados
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-800/50 flex items-center justify-center flex-shrink-0">
                <IdCard className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">CI</p>
                <p className="text-sm text-white">
                  {employee.ci ?? "Sin registro"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-800/50 flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Telefono</p>
                <p className="text-sm text-white">
                  {employee.phoneNumber ?? "Sin registro"}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-800/50 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Inicio de contrato</p>
                <p className="text-sm text-white">
                  {formatDate(employee.startContractDate)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-800/50 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Fin de contrato</p>
                <p className="text-sm text-white">
                  {formatDate(employee.endContractDate)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
