import { useEffect } from 'react';
import { CloseIcon } from './Icons';

export interface ToastMessage {
  id: number;
  text: string;
}

interface Props {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

export function Toast({ toast, onDismiss }: Props) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  if (!toast) return null;
  return (
    <div className="toast" role="status">
      <span>{toast.text}</span>
      <button className="btn btn--icon btn--ghost toast__close" onClick={onDismiss} aria-label="Dismiss">
        <CloseIcon />
      </button>
    </div>
  );
}
