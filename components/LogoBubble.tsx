import React, { useMemo, useState } from 'react';

type LogoBubbleProps = {
  src?: string;
  alt: string;
  size?: number;
  seed?: string;
  className?: string;
};

const GRADIENTS = [
  'linear-gradient(135deg, #F4A9B8, #F6BCD6)',
  'linear-gradient(135deg, #9FD0E6, #B2C7F2)',
  'linear-gradient(135deg, #F5B08B, #F7C7A3)',
  'linear-gradient(135deg, #E6A7C3, #F0B6DA)',
  'linear-gradient(135deg, #B6D7A8, #CBE6B6)',
  'linear-gradient(135deg, #A9C8D4, #C4D7DA)',
  'linear-gradient(135deg, #E7B49D, #D9C1B3)',
  'linear-gradient(135deg, #B4C2F2, #D1C7F2)',
];

const hashSeed = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) % 1000000;
  }
  return hash;
};

export const LogoBubble: React.FC<LogoBubbleProps> = ({
  src,
  alt,
  size = 48,
  seed,
  className,
}) => {
  const [hasError, setHasError] = useState(false);
  const seedValue = seed || alt || src || 'logo';
  const hash = useMemo(() => hashSeed(seedValue), [seedValue]);
  const gradient = GRADIENTS[hash % GRADIENTS.length];
  const duration = 6 + (hash % 6);
  const delay = (hash % 10) * 0.3;
  const initial = alt?.trim()?.charAt(0)?.toUpperCase() || '·';
  const showFallback = !src || hasError;

  const style = {
    width: size,
    height: size,
    ['--halo-gradient' as any]: gradient,
    ['--halo-duration' as any]: `${duration}s`,
    ['--halo-delay' as any]: `${delay}s`,
  } as React.CSSProperties;

  return (
    <div className={`logo-halo ${className || ''}`} style={style} role="img" aria-label={alt}>
      <div className="logo-glass">
        {showFallback ? (
          <span className="relative z-10 flex h-full w-full items-center justify-center text-sm font-semibold text-dm-dark/70">
            {initial}
          </span>
        ) : (
          <img
            src={src}
            alt={alt}
            loading="lazy"
            decoding="async"
            onError={() => setHasError(true)}
            className="relative z-10 h-full w-full object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]"
          />
        )}
      </div>
    </div>
  );
};
