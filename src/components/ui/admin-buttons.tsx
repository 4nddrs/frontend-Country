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
    className={`group relative ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
  >
    <div className="relative z-10 inline-flex w-full h-9 items-center justify-center overflow-hidden rounded-[10px] border border-[#3CC9F6]/70 bg-[#3CC9F6]/12 px-16 font-semibold text-[#3CC9F6] tracking-wide text-sm gap-2 shadow-[0_0_14px_rgba(60,201,246,0.35)] ring-1 ring-[#3CC9F6]/20 transition-all duration-300 group-hover:-translate-x-5 group-hover:-translate-y-5 group-active:translate-x-0 group-active:translate-y-0">
      <Plus size={15} />
      {children}
    </div>
    <div className="absolute inset-0 z-0 h-full w-full rounded-[10px] bg-[#3CC9F6]/8 transition-all duration-300 group-hover:-translate-x-5 group-hover:-translate-y-5 group-hover:[box-shadow:7px_7px_rgba(60,201,246,0.6),14px_14px_rgba(60,201,246,0.4),21px_21px_rgba(60,201,246,0.2)] group-active:translate-x-0 group-active:translate-y-0 group-active:shadow-none" />
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
    className={`group relative ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
  >
    <div className="relative z-10 inline-flex w-full h-9 items-center justify-center overflow-hidden rounded-[10px] border border-[#bdab62]/70 bg-[#bdab62]/12 px-16 font-semibold text-[#bdab62] tracking-wide text-sm gap-2 shadow-[0_0_14px_rgba(189,171,98,0.35)] ring-1 ring-[#bdab62]/20 transition-all duration-300 group-hover:-translate-x-5 group-hover:-translate-y-5 group-active:translate-x-0 group-active:translate-y-0">
      {children}
    </div>
    <div className="absolute inset-0 z-0 h-full w-full rounded-[10px] bg-[#bdab62]/8 transition-all duration-300 group-hover:-translate-x-5 group-hover:-translate-y-5 group-hover:[box-shadow:7px_7px_rgba(189,171,98,0.6),14px_14px_rgba(189,171,98,0.4),21px_21px_rgba(189,171,98,0.2)] group-active:translate-x-0 group-active:translate-y-0 group-active:shadow-none" />
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
    className={`group relative ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
  >
    <div className="relative z-10 inline-flex w-full h-9 items-center justify-center overflow-hidden rounded-[10px] border border-[#f87171]/70 bg-[#f87171]/12 px-16 font-semibold text-[#f87171] tracking-wide text-sm gap-2 shadow-[0_0_14px_rgba(248,113,113,0.35)] ring-1 ring-[#f87171]/20 transition-all duration-300 group-hover:-translate-x-5 group-hover:-translate-y-5 group-active:translate-x-0 group-active:translate-y-0">
      {children}
    </div>
    <div className="absolute inset-0 z-0 h-full w-full rounded-[10px] bg-[#f87171]/8 transition-all duration-300 group-hover:-translate-x-5 group-hover:-translate-y-5 group-hover:[box-shadow:7px_7px_rgba(248,113,113,0.6),14px_14px_rgba(248,113,113,0.4),21px_21px_rgba(248,113,113,0.2)] group-active:translate-x-0 group-active:translate-y-0 group-active:shadow-none" />
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
