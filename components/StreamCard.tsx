// StreamCard renders a live card with CTA actions and state badges.
import React, { useState, useEffect } from 'react';
import { Stream, StreamStatus, UserContext } from '../types';
import { getShopCoverUrl } from '../utils/shopMedia';
import { Button } from './Button';
import { LogoBubble } from './LogoBubble';
import { Instagram, Video, Flag, Clock, Heart, Share2, Check, Download, Star, MoreHorizontal, MessageCircle, UserPlus } from 'lucide-react';
import styles from './StreamCard.module.css';

interface StreamCardProps {
  stream: Stream;
  user: UserContext;
  canClientInteract: boolean;
  onNotify?: (title: string, message: string, tone?: 'info' | 'success' | 'warning' | 'error') => void;
  onRequireLogin?: () => void;
  onOpenShop: () => void;
  onReport: (streamId: string) => void;
  onToggleReminder: (streamId: string) => void;
  onLike?: (streamId: string) => void; // New
  onDownloadCard?: (stream: Stream) => void; // New
  onRate?: (streamId: string, rating: number) => void; // New
}

export const StreamCard: React.FC<StreamCardProps> = ({ 
    stream, 
    user, 
    canClientInteract,
    onNotify,
    onRequireLogin,
    onOpenShop, 
    onReport, 
    onToggleReminder,
    onLike,
    onDownloadCard,
    onRate
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [liveTimeText, setLiveTimeText] = useState('');
  
  // Status Helpers
  const isLive = stream.status === StreamStatus.LIVE;
  const isFinished = stream.status === StreamStatus.FINISHED;
  const isMissed = stream.status === StreamStatus.MISSED;
  const isCancelled = stream.status === StreamStatus.CANCELLED || stream.status === StreamStatus.BANNED;
  const isUpcoming = stream.status === StreamStatus.UPCOMING;
  const canReport = stream.status === StreamStatus.LIVE;
  
  const reminderSet = user.reminders.includes(stream.id);
  const isLiked = user.likes.includes(stream.id);
  const reminderBlockedLabel = user.isLoggedIn ? 'Solo clientes' : 'Iniciá sesión';
  
  // Shop Rating Display
  const shopRating = stream.shop.ratingAverage || 5.0;
  const coverImage = stream.coverImage?.trim() || getShopCoverUrl(stream.shop);
  const hasCoverImage = Boolean(coverImage);

  // --- TIME FORMATTING ---
  const formatDisplayDate = (isoString: string, scheduledTime: string) => {
    if (isCancelled) return 'Cancelado';
    if (isFinished || isMissed) return 'Finalizado';
    const date = new Date(isoString);
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth();
    const isTomorrow = new Date(now.getTime() + 86400000).getDate() === date.getDate();

    if (isToday) return `HOY ${scheduledTime} hs`;
    if (isTomorrow) return `MAÑANA ${scheduledTime} hs`;
    
    const day = date.getDate();
    const month = date.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase().replace('.', '');
    return `${day} ${month} - ${scheduledTime} hs`;
  };
  const dateText = formatDisplayDate(stream.fullDateISO, stream.scheduledTime);

  // --- ACTIONS ---
  const handleEnter = () => {
      if (stream.url) window.open(stream.url, '_blank');
  };

  const handleShare = async () => {
    if (blockIfGuest('Inicia sesion para compartir.')) return;
    if (navigator.share) {
        try {
            await navigator.share({
                title: stream.title,
                text: `Mirá el vivo de ${stream.shop.name} en Distrito Moda`,
                url: window.location.href
            });
        } catch(e) {}
    } else {
        try {
            await navigator.clipboard.writeText(window.location.href);
        } catch (e) {}
        onNotify?.('Link copiado', 'Se copió el enlace al portapapeles.', 'success');
    }
  };

  const blockIfGuest = (message?: string) => {
    if (canClientInteract) return false;
    if (!user.isLoggedIn) {
      onRequireLogin?.();
    } else {
      onNotify?.('Solo clientes', message || 'Accion disponible solo para cuentas cliente.', 'warning');
    }
    return true;
  };

  return (
    <div 
        className={`${styles.card} group`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
    >
      
      {/* 1. HEADER IMAGE & BADGES */}
      <div className={styles.media}>
        {hasCoverImage ? (
          <img 
            src={coverImage} 
            alt={stream.title} 
            loading="lazy"
            decoding="async"
            className={`${styles.mediaImage} ${isHovered ? 'scale-105' : 'scale-100'} ${isFinished ? 'grayscale' : ''}`}
          />
        ) : (
          <div className={styles.mediaPlaceholder}>
            Sin portada
          </div>
        )}
        
        {/* Gradient Overlay */}
        <div className={styles.mediaGradient}></div>

        {/* Top Badges */}
        <div className={styles.topBadges}>
             {/* Shop Identity (Small) */}
             <div 
                className={styles.shopChip}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenShop();
                }}
            >
                 <LogoBubble
                   src={stream.shop.logoUrl}
                   alt={stream.shop.name}
                   size={28}
                   seed={stream.shop.id || stream.shop.name}
                   className="shrink-0"
                 />
                 <span className={styles.shopName}>{stream.shop.name}</span>
             </div>

             {/* Rating */}
             <div className={styles.ratingChip}>
                 <Star size={10} className="fill-yellow-400 text-yellow-400" />
                 <span className="text-[11px] font-bold">{shopRating}</span>
             </div>
        </div>

        {/* Status Center/Bottom */}
        <div className={styles.statusWrap}>
             {isLive ? (
                 <div className={styles.statusLive}>
                    <span className={styles.statusLiveBadge}>
                        <span className="w-1.5 h-1.5 bg-white rounded-full"></span> EN VIVO
                    </span>
                    <span className={styles.statusLiveNote}>Transmisión en curso</span>
                 </div>
             ) : (
                <div className={styles.statusRow}>
                    <div className={`${styles.statusIconWrap} ${isMissed ? 'bg-orange-500' : isFinished ? 'bg-gray-500' : 'bg-white text-dm-dark'}`}>
                        {isMissed ? <AlertTriangleIcon size={12}/> : isFinished ? <Check size={12}/> : <Clock size={12}/>}
                    </div>
                    <div>
                        <p className={styles.statusLabel}>
                            {isMissed ? 'No Realizado' : isFinished ? 'Finalizado' : 'Próximo Vivo'}
                        </p>
                        {!isFinished && !isMissed && <p className={styles.statusDate}>{dateText}</p>}
                    </div>
                </div>
             )}
        </div>
      </div>

      {/* 2. BODY CONTENT */}
      <div className={styles.body}>
        <div className="flex justify-between items-start mb-1">
            <div>
                <h3 className={styles.title} title={stream.title}>
                    {stream.title}
                </h3>
                <div className={styles.metaRow}>
                     <span className={`${styles.platformBadge} ${
                         stream.platform === 'Instagram' ? 'border-pink-200 text-pink-600 bg-pink-50' : 
                         stream.platform === 'TikTok' ? 'border-gray-800 text-gray-900 bg-gray-100' :
                         'border-blue-200 text-blue-600 bg-blue-50'
                     }`}>
                         {stream.platform}
                     </span>
                </div>
            </div>
        </div>

        {/* 3. ACTION BAR */}
        <div className={styles.actions}>
            
            {/* Primary Action Button */}
            {isLive ? (
                <Button onClick={handleEnter} className={styles.liveActionButton}>
                    ENTRAR AL VIVO
                </Button>
            ) : isCancelled ? (
                 <Button variant="outline" className="w-full border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed">
                    {stream.status === StreamStatus.BANNED ? 'Bloqueado' : 'Cancelado'}
                 </Button>
            ) : isFinished ? (
                 <Button variant="outline" className="w-full border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed">
                    Finalizado
                 </Button>
            ) : isUpcoming ? (
                <Button 
                    variant={reminderSet ? 'secondary' : 'outline'} 
                    className={`w-full ${reminderSet ? 'bg-dm-dark text-white' : 'border-dm-dark text-dm-dark hover:bg-dm-dark hover:text-white'} ${!canClientInteract ? 'border-gray-200 text-gray-400 bg-gray-50' : ''}`}
                    onClick={() => {
                      if (blockIfGuest()) return;
                      onToggleReminder(stream.id);
                    }}
                    aria-disabled={!canClientInteract}
                >
                    {reminderSet ? <><Check size={14} className="mr-2"/> Agendado</> : <><Clock size={14} className="mr-2"/> Recordarme</>}
                </Button>
            ) : (
                 <Button variant="outline" className="w-full border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed">
                    No Disponible
                 </Button>
            )}

            {/* Secondary Actions Row */}
            <div className={`${styles.actionRow} border-t border-gray-100 pt-2.5`}>
                 <div className="flex gap-1">
                    <button 
                        onClick={() => {
                          if (blockIfGuest('Inicia sesion para dar me gusta.')) return;
                          onLike?.(stream.id);
                        }} 
                        className={`p-2 rounded-full transition-colors ${
                          canClientInteract
                            ? isLiked
                              ? 'text-dm-crimson bg-red-50'
                              : 'text-gray-500 hover:text-dm-crimson hover:bg-red-50'
                            : 'text-gray-300 cursor-not-allowed'
                        }`}
                        title="Me gusta"
                        aria-label="Me gusta"
                        aria-pressed={isLiked}
                        aria-disabled={!canClientInteract}
                    >
                        <Heart size={18} className={isLiked ? 'fill-dm-crimson text-dm-crimson' : ''} />
                    </button>
                    <button 
                        onClick={handleShare}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                        title="Compartir"
                        aria-label="Compartir"
                    >
                        <Share2 size={18} />
                    </button>
                    <button 
                        onClick={() => {
                          if (blockIfGuest('Inicia sesion para descargar la tarjeta.')) return;
                          onDownloadCard?.(stream);
                        }}
                        className={`p-2 rounded-full transition-colors ${canClientInteract ? 'text-gray-500 hover:text-dm-dark hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed'}`}
                        title="Descargar Tarjeta"
                        aria-label="Descargar tarjeta"
                        aria-disabled={!canClientInteract}
                    >
                        <Download size={18} />
                    </button>
                 </div>

                 {/* Rate or Report */}
                 {canClientInteract && isFinished ? (
                     <button 
                        onClick={() => onRate && onRate(stream.id, 5)} 
                        className="text-[11px] font-bold text-yellow-500 hover:text-yellow-600 flex items-center gap-1"
                     >
                         <Star size={14} className="fill-current"/> Calificar
                     </button>
                 ) : canClientInteract && canReport ? (
                     <button 
                        onClick={() => onReport(stream.id)}
                        className="text-[11px] text-gray-500 hover:text-red-500 flex items-center gap-1"
                        title="Reportar problema"
                        aria-label="Reportar vivo"
                     >
                         <Flag size={12}/> 
                     </button>
                 ) : null}
            </div>
        </div>
      </div>
    </div>
  );
};

// Helper for Missed Icon
const AlertTriangleIcon = ({size}: {size:number}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
);
