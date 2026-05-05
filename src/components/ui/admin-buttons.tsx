import type { ReactNode } from 'react';
import { Plus, Save, X } from 'lucide-react';

interface AdminButtonProps {
  onClick?: () => void;
  children?: ReactNode;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  title?: string;
}

export const AddButton = ({
  onClick,
  children = 'Agregar',
  disabled = false,
  className = '',
  type = 'button',
  title,
}: AdminButtonProps) => (
  <button
    type={type}
    onClick={disabled ? undefined : onClick}
    aria-disabled={disabled}
    title={title}
    className={`relative h-12 min-w-[190px] overflow-hidden rounded bg-neutral-950 px-6 py-2.5 transition-all duration-300 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className} hover:bg-[#3CC9F6]/15 hover:ring-2 hover:ring-[#3CC9F6]/60 hover:ring-offset-2`}
  >
    <span className="relative inline-flex items-center gap-2 text-[#3CC9F6]">
      <Plus size={15} />
      {children}
    </span>
  </button>
);

export const ExportButton = ({
  onClick,
  children,
  disabled = false,
  className = '',
  type = 'button',
  title,
}: AdminButtonProps) => (
  <button
    type={type}
    onClick={disabled ? undefined : onClick}
    aria-disabled={disabled}
    title={title}
    className={`relative h-12 min-w-[200px] overflow-hidden rounded bg-neutral-950 px-6 py-2.5 transition-all duration-300 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className} hover:bg-[#bdab62]/15 hover:ring-2 hover:ring-[#bdab62]/60 hover:ring-offset-2`}
  >
    <span className="relative inline-flex items-center gap-2 text-[#bdab62]">
      {children}
    </span>
  </button>
);

export const ClearButton = ({
  onClick,
  children,
  disabled = false,
  className = '',
  type = 'button',
  title,
}: AdminButtonProps) => (
  <button
    type={type}
    onClick={disabled ? undefined : onClick}
    aria-disabled={disabled}
    title={title}
    className={`relative h-12 min-w-[150px] overflow-hidden rounded bg-neutral-950 px-6 py-2.5 transition-all duration-300 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className} hover:bg-[#ef4444]/15 hover:ring-2 hover:ring-[#ef4444]/60 hover:ring-offset-2`}
  >
    <span className="relative inline-flex items-center gap-2 text-[#ef4444]">
      {children}
    </span>
  </button>
);

export const SaveButton = ({
  onClick,
  children = 'Guardar',
  disabled = false,
  className = '',
  type = 'button',
  title,
}: AdminButtonProps) => (
  <button
    type={type}
    onClick={disabled ? undefined : onClick}
    aria-disabled={disabled}
    title={title}
    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold
      text-cyan-300 bg-cyan-500/20 border-2 border-cyan-400/80
      shadow-[0_0_18px_rgba(34,211,238,0.55),inset_0_0_8px_rgba(34,211,238,0.1)]
      hover:bg-cyan-500/30 hover:shadow-[0_0_26px_rgba(34,211,238,0.75),inset_0_0_12px_rgba(34,211,238,0.15)]
      transition-all duration-200 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
  >
    <Save size={15} />
    {children}
  </button>
);

export const CancelButton = ({
  onClick,
  children = 'Cancelar',
  disabled = false,
  className = '',
  type = 'button',
  title,
}: AdminButtonProps) => (
  <button
    type={type}
    onClick={disabled ? undefined : onClick}
    aria-disabled={disabled}
    title={title}
    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold
      text-rose-300 bg-rose-500/20 border-2 border-rose-400/80
      shadow-[0_0_18px_rgba(244,63,94,0.5),inset_0_0_8px_rgba(244,63,94,0.1)]
      hover:bg-rose-500/30 hover:shadow-[0_0_26px_rgba(244,63,94,0.7),inset_0_0_12px_rgba(244,63,94,0.15)]
      transition-all duration-200 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
  >
    <X size={15} />
    {children}
  </button>
);

export const AdminSection = ({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div className={`bg-white/5 p-6 rounded-2xl mb-8 text-[#F8F4E3] ${className}`}>
    {children}
  </div>
);
