import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Loader2 } from "lucide-react";

interface TaskStatusSelectProps {
  value?: string | null;
  options: string[];
  onChange: (value: string) => Promise<void>;
  disabled?: boolean;
}

const normalizeOption = (option: string) => option.trim();

const formatLabel = (option: string) => {
  const lower = option.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

export function TaskStatusSelect({
  value,
  options,
  onChange,
  disabled = false,
}: TaskStatusSelectProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleValueChange = async (nextValue: string) => {
    const normalized = normalizeOption(nextValue);
    setIsSubmitting(true);
    try {
      await onChange(normalized);
    } catch (error) {
      console.error("No se pudo actualizar el estado de la tarea:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentValue =
    typeof value === "string" && value.length > 0
      ? normalizeOption(value)
      : "PENDIENTE";

  return (
    <Select
      value={currentValue}
      onValueChange={handleValueChange}
      disabled={disabled || isSubmitting}
    >
      <SelectTrigger className="w-44 bg-slate-900/60 border-slate-700/60 text-white">
        <SelectValue />
        {isSubmitting ? (
          <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
        ) : null}
      </SelectTrigger>
      <SelectContent className="bg-slate-900/90 border-slate-700/60 text-slate-200">
        {options.map((option) => {
          const valueOption = normalizeOption(option);
          return (
            <SelectItem key={valueOption} value={valueOption}>
              {formatLabel(valueOption)}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
