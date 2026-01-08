import ReactDOM from 'react-dom/client';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface ConfirmOptions {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
}

/**
 * Muestra un diálogo de confirmación personalizado y hermoso
 * Reemplazo moderno de window.confirm()
 * 
 * @example
 * const confirmed = await confirmDialog({
 *   title: '¿Eliminar elemento?',
 *   description: 'Esta acción no se puede deshacer'
 * });
 * if (confirmed) {
 *   // usuario confirmó
 * }
 */
export const confirmDialog = (options: ConfirmOptions = {}): Promise<boolean> => {
  return new Promise((resolve) => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = ReactDOM.createRoot(container);

    const cleanup = () => {
      root.unmount();
      document.body.removeChild(container);
    };

    const handleConfirm = () => {
      cleanup();
      resolve(true);
    };

    const handleCancel = () => {
      cleanup();
      resolve(false);
    };

    root.render(
      <ConfirmDialog
        open={true}
        onOpenChange={(open) => {
          if (!open) handleCancel();
        }}
        onConfirm={handleConfirm}
        title={options.title}
        description={options.description}
        confirmText={options.confirmText}
        cancelText={options.cancelText}
      />
    );
  });
};
