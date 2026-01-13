import React from 'react';
import { Info } from 'lucide-react';
import { Button } from './Button';
import styles from './EmptyState.module.css';

// EmptyState provides a friendly placeholder with optional CTA.
interface EmptyStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: 'neutral' | 'warning';
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, message, actionLabel, onAction, tone = 'neutral' }) => {
  const toneStyles = tone === 'warning' ? styles.toneWarning : styles.toneNeutral;

  return (
    <div className={`${styles.root} ${toneStyles}`}>
      <div className={styles.iconWrap}>
        <Info size={18} />
      </div>
      <p className={styles.title}>{title}</p>
      <p className={styles.message}>{message}</p>
      {actionLabel && onAction && (
        <Button size="sm" className="mt-4" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
