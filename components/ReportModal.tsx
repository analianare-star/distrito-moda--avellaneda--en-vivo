import React, { useState } from 'react';
import { X, Flag, AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import styles from './ReportModal.module.css';

// ReportModal collects a reason to report a stream.
const REASONS = [
  { value: 'SPAM', label: 'Spam o publicidad' },
  { value: 'OFFTOPIC', label: 'Contenido fuera de tema' },
  { value: 'ABUSE', label: 'Abuso o lenguaje inapropiado' },
  { value: 'OTHER', label: 'Otro motivo' },
];

interface ReportModalProps {
  isOpen: boolean;
  streamTitle: string;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, streamTitle, onClose, onSubmit }) => {
  const [reason, setReason] = useState<string>('SPAM');

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <button
          onClick={onClose}
          className={styles.closeButton}
          aria-label="Cerrar"
        >
          <X size={18} />
        </button>
        <div className={styles.header}>
          <Flag size={14} /> Reportar vivo
        </div>
        <h3 className={styles.title}>{streamTitle}</h3>
        <p className={styles.helper}>
          <AlertTriangle size={14} className={styles.helperIcon} />
          Selecciona un motivo para registrar el reporte. Esto se audita en el backend.
        </p>

        <div className={styles.reasons}>
          {REASONS.map((item) => (
            <label
              key={item.value}
              className={`${styles.reason} ${
                reason === item.value ? styles.reasonActive : styles.reasonInactive
              }`}
            >
              <input
                type="radio"
                name="report-reason"
                value={item.value}
                checked={reason === item.value}
                onChange={() => setReason(item.value)}
              />
              {item.label}
            </label>
          ))}
        </div>

        <div className={styles.actions}>
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-dm-crimson hover:bg-red-700 border-none text-white"
            onClick={() => onSubmit(reason)}
          >
            Enviar reporte
          </Button>
        </div>
      </div>
    </div>
  );
};
