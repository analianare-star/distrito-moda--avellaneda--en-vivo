import React, { useMemo, useState } from 'react';

type LogoBubbleProps = {
  src?: string;
  alt: string;
  size?: number;
  seed?: string;
  className?: string;
};

const GRADIENTS = [
  'linear-gradient(135deg, #FAD0C4, #FFD1FF)',
  'linear-gradient(135deg, #B5EAEA, #C7CEEA)',
  'linear-gradient(135deg, #FFDAC1, #B5EAD7)',
  'linear-gradient(135deg, #FDE2E4, #FAD2E1)',
  'linear-gradient(135deg, #E2F0CB, #B5EAD7)',
  'linear-gradient(135deg, #CDE7F0, #E2ECE9)',
  'linear-gradient(135deg, #FFE5D9, #D8E2DC)',
  'linear-gradient(135deg, #D7E3FC, #EDE7F6)',
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
