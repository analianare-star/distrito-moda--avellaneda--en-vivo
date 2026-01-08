import React from 'react';
import { Info } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: 'neutral' | 'warning';
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, message, actionLabel, onAction, tone = 'neutral' }) => {
  const toneStyles =
    tone === 'warning'
      ? 'border-yellow-200 bg-yellow-50 text-yellow-700'
      : 'border-gray-100 bg-gray-50 text-gray-500';

  return (
    <div className={`col-span-full flex flex-col items-center rounded-2xl border p-6 text-center ${toneStyles}`}>
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-dm-crimson shadow-sm">
        <Info size={18} />
      </div>
      <p className="text-sm font-bold text-dm-dark">{title}</p>
      <p className="mt-1 text-xs text-gray-500">{message}</p>
      {actionLabel && onAction && (
        <Button size="sm" className="mt-4" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
