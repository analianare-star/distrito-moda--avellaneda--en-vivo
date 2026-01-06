import React, { useState } from 'react';
import { X, Flag, AlertTriangle } from 'lucide-react';
import { Button } from './Button';

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
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-dm-dark"
          aria-label="Cerrar"
        >
          <X size={18} />
        </button>
        <div className="flex items-center gap-2 text-dm-crimson font-bold text-xs uppercase tracking-wider">
          <Flag size={14} /> Reportar vivo
        </div>
        <h3 className="mt-2 font-serif text-xl text-dm-dark">{streamTitle}</h3>
        <p className="mt-2 text-xs text-gray-500 flex items-start gap-2">
          <AlertTriangle size={14} className="text-orange-400 mt-0.5" />
          Selecciona un motivo para registrar el reporte. Esto se audita en el backend.
        </p>

        <div className="mt-4 space-y-2">
          {REASONS.map((item) => (
            <label
              key={item.value}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm ${
                reason === item.value ? 'border-dm-crimson bg-red-50 text-dm-dark' : 'border-gray-200 text-gray-600'
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

        <div className="mt-6 flex gap-3">
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
