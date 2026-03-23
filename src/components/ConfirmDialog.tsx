import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  title = '¿Estás seguro?',
  description = 'Esta acción no se puede deshacer.',
  confirmText = 'Eliminar',
  cancelText = 'Cancelar',
}) => {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-gradient-to-br from-[#1a1f35] to-[#0f1424] border-[#2a3f5f] shadow-2xl">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-full bg-red-500/20 border border-red-500/30">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <AlertDialogTitle className="text-xl font-semibold text-white">
              {title}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-gray-300 text-base leading-relaxed pl-11">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6">
          <AlertDialogCancel 
            className="w-full"
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-500/30 transition-all duration-200 border-0"
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

// Hook personalizado para usar el diálogo de confirmación
export const useConfirmDialog = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [config, setConfig] = React.useState<{
    title?: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  }>({
    onConfirm: () => {},
  });

  const confirm = React.useCallback(
    (options: {
      title?: string;
      description?: string;
      confirmText?: string;
      cancelText?: string;
      onConfirm: () => void;
    }) => {
      setConfig(options);
      setIsOpen(true);
    },
    []
  );

  const ConfirmDialogComponent = React.useCallback(
    () => (
      <ConfirmDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        onConfirm={config.onConfirm}
        title={config.title}
        description={config.description}
        confirmText={config.confirmText}
        cancelText={config.cancelText}
      />
    ),
    [isOpen, config]
  );

  return { confirm, ConfirmDialog: ConfirmDialogComponent };
};




