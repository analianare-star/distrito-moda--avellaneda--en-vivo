import React, { useMemo, useState } from 'react';

// LogoBubble displays a branded avatar with animated pastel background.
type LogoBubbleProps = {
  src?: string;
  alt: string;
  size?: number;
  seed?: string;
  className?: string;
};

const GRADIENTS = [
  'linear-gradient(135deg, #E97B8E, #F09BBE)',
  'linear-gradient(135deg, #6EBCE1, #86A9EE)',
  'linear-gradient(135deg, #EFA066, #F2B97A)',
  'linear-gradient(135deg, #D98ABA, #ECA1D4)',
  'linear-gradient(135deg, #8FCF8A, #A9DE93)',
  'linear-gradient(135deg, #7FB4C6, #9FC3C8)',
  'linear-gradient(135deg, #D79D7E, #C6A594)',
  'linear-gradient(135deg, #9AAEF0, #BDA9EC)',
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
  const duration = (6 + (hash % 6)) * 0.8;
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
            className="logo-bubble-img relative z-10 h-full w-full object-contain"
          />
        )}
      </div>
    </div>
  );
};
