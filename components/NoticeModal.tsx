import React from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

type NoticeTone = 'info' | 'success' | 'warning' | 'error';

const TONE_STYLES: Record<NoticeTone, { bg: string; text: string }> = {
  info: { bg: 'bg-blue-50', text: 'text-blue-700' },
  success: { bg: 'bg-green-50', text: 'text-green-700' },
  warning: { bg: 'bg-yellow-50', text: 'text-yellow-700' },
  error: { bg: 'bg-red-50', text: 'text-red-700' },
};

interface NoticeModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  tone?: NoticeTone;
  onClose: () => void;
  confirmLabel?: string;
  onConfirm?: () => void;
}

export const NoticeModal: React.FC<NoticeModalProps> = ({
  isOpen,
  title,
  message,
  tone = 'info',
  onClose,
  confirmLabel,
  onConfirm,
}) => {
  if (!isOpen) return null;
  const styles = TONE_STYLES[tone];

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-dm-dark"
          aria-label="Cerrar"
        >
          <X size={18} />
        </button>
        <div className={`rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider ${styles.bg} ${styles.text}`}>
          {title}
        </div>
        <p className="mt-4 text-sm text-gray-600">{message}</p>
        <Button
          className="mt-6 w-full"
          onClick={() => {
            if (onConfirm) {
              onConfirm();
              return;
            }
            onClose();
          }}
        >
          {confirmLabel || 'Entendido'}
        </Button>
      </div>
    </div>
  );
};
