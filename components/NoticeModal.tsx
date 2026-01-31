import React from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';
import styles from './NoticeModal.module.css';

// NoticeModal shows lightweight feedback for success, warning, or errors.
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
  cancelLabel?: string;
  onCancel?: () => void;
  zIndex?: number;
}

export const NoticeModal: React.FC<NoticeModalProps> = ({
  isOpen,
  title,
  message,
  tone = 'info',
  onClose,
  confirmLabel,
  onConfirm,
  cancelLabel,
  onCancel,
  zIndex,
}) => {
  if (!isOpen) return null;
  const toneStyles = TONE_STYLES[tone];
  const showCancel = Boolean(cancelLabel || onCancel);

  return (
    <div className={styles.overlay} style={zIndex ? { zIndex } : undefined}>
      <div className={styles.card}>
        <button
          onClick={onClose}
          className={styles.closeButton}
          aria-label="Cerrar"
        >
          <X size={18} />
        </button>
        <div className={`${styles.titleBadge} ${toneStyles.bg} ${toneStyles.text}`}>
          {title}
        </div>
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          {showCancel && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                if (onCancel) {
                  onCancel();
                  return;
                }
                onClose();
              }}
            >
              {cancelLabel || 'Cancelar'}
            </Button>
          )}
          <Button
            className="flex-1"
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
    </div>
  );
};
