// StoryModal shows a reel preview with actions and metadata.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Reel } from '../types';
import { X, ExternalLink, Clock, Share2, Eye, Heart, MapPin, BookOpen, Volume2, VolumeX } from 'lucide-react';
import { Button } from './Button';
import { ShopMapModal } from './ShopMapModal';
import styles from './StoryModal.module.css';

interface StoryModalProps {
    reel: Reel;
    reels: Reel[];
    onNavigate: (reel: Reel) => void;
    onClose: () => void;
    onNotify?: (title: string, message: string, tone?: 'info' | 'success' | 'warning' | 'error') => void;
    isSeen?: boolean;
    canClientInteract?: boolean;
    onRequireLogin?: () => void;
}

export const StoryModal: React.FC<StoryModalProps> = ({
    reel,
    reels,
    onNavigate,
    onClose,
    onNotify,
    isSeen,
    canClientInteract,
    onRequireLogin,
}) => {
    const now = new Date();
    const expires = new Date(reel.expiresAtISO);
    const diffMs = expires.getTime() - now.getTime();
    const hoursLeft = Math.floor(diffMs / (1000 * 60 * 60));
    const minutesLeft = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const catalogUrl = reel.shopCatalogUrl || '';
    const [liked, setLiked] = useState(false);
    const [isMapOpen, setIsMapOpen] = useState(false);
    const [mapFocusName, setMapFocusName] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [isMuted, setIsMuted] = useState(true);
    const [showAudioCue, setShowAudioCue] = useState(false);
    const [showLikeCue, setShowLikeCue] = useState(false);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const audioCueTimerRef = useRef<number | null>(null);
    const likeCueTimerRef = useRef<number | null>(null);
    const lastTapRef = useRef<number>(0);
    const singleTapTimerRef = useRef<number | null>(null);

    const isVideo = reel.type === 'VIDEO' && Boolean(reel.videoUrl);
    const durationSeconds = Math.max(5, Number(reel.durationSeconds ?? 10));
    const photoUrls = Array.isArray(reel.photoUrls) ? reel.photoUrls : [];
    const photoCount = photoUrls.length;
    const activePhotoIndex = photoCount
        ? Math.min(photoCount - 1, Math.floor((progress / 100) * photoCount))
        : 0;
    const activePhoto = photoCount ? photoUrls[activePhotoIndex] : '';
    const storyBackdrop = isVideo
        ? reel.thumbnail || reel.shopLogo || activePhoto
        : activePhoto || reel.thumbnail || reel.shopLogo;
    const hasMedia = Boolean(isVideo ? reel.videoUrl : storyBackdrop);
    const reelIndex = Math.max(0, reels.findIndex((item) => item.id === reel.id));
    const totalReels = reels.length;

    const guardClientAction = () => {
        if (canClientInteract === false) {
            onRequireLogin?.();
            return false;
        }
        return true;
    };

    const handleOpenExternal = () => {
        if (!guardClientAction()) return;
        window.open(reel.url, '_blank');
    };

    const handleOpenMaps = () => {
        setMapFocusName(reel.shopName);
        setIsMapOpen(true);
    };

    const handleOpenCatalog = () => {
        if (!guardClientAction()) return;
        if (!catalogUrl) {
            onNotify?.('Catalogo no disponible', 'Esta tienda aun no cargo su catalogo.', 'warning');
            return;
        }
        window.open(catalogUrl, '_blank');
    };

    const handleShare = async () => {
        if (!guardClientAction()) return;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Historia de ${reel.shopName}`,
                    url: reel.url,
                });
                onNotify?.('Compartido', 'El link se compartio correctamente.', 'success');
                return;
            } catch {
                onNotify?.('Compartir cancelado', 'No se completo el envio.', 'warning');
                return;
            }
        }

        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(reel.url);
                onNotify?.('Link copiado', 'Pegalo donde quieras compartirlo.', 'success');
                return;
            }
        } catch {
            // fallback below
        }

        onNotify?.('No se pudo copiar', 'Tu navegador no permite copiar automaticamente.', 'error');
    };

    const handleNext = useCallback(() => {
        if (totalReels <= 1) {
            onClose();
            return;
        }
        if (reelIndex < totalReels - 1) {
            onNavigate(reels[reelIndex + 1]);
            return;
        }
        onClose();
    }, [onClose, onNavigate, reelIndex, reels, totalReels]);

    const handlePrev = useCallback(() => {
        if (totalReels <= 1) {
            onClose();
            return;
        }
        if (reelIndex > 0) {
            onNavigate(reels[reelIndex - 1]);
            return;
        }
        onClose();
    }, [onClose, onNavigate, reelIndex, reels, totalReels]);

    useEffect(() => {
        if (isMapOpen) return;
        setProgress(0);
        const step = 100 / Math.max(1, Math.round(durationSeconds * 10));
        const timer = window.setInterval(() => {
            setProgress((value) => {
                if (value >= 100) {
                    window.clearInterval(timer);
                    handleNext();
                    return 100;
                }
                return value + step;
            });
        }, 100);
        return () => window.clearInterval(timer);
    }, [reel.id, handleNext, isMapOpen, durationSeconds]);

    useEffect(() => {
        setShowAudioCue(false);
        setShowLikeCue(false);
        if (audioCueTimerRef.current) {
            window.clearTimeout(audioCueTimerRef.current);
            audioCueTimerRef.current = null;
        }
        if (likeCueTimerRef.current) {
            window.clearTimeout(likeCueTimerRef.current);
            likeCueTimerRef.current = null;
        }
        if (singleTapTimerRef.current) {
            window.clearTimeout(singleTapTimerRef.current);
            singleTapTimerRef.current = null;
        }
        lastTapRef.current = 0;
    }, [reel.id]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        video.muted = isMuted;
        if (!isMuted) {
            video.volume = 1;
            void video.play();
        }
    }, [reel.id, isMuted]);

    const handleToggleSound = async () => {
        if (!isVideo) return;
        const nextMuted = !isMuted;
        setIsMuted(nextMuted);
        const video = videoRef.current;
        if (!video) return;
        video.muted = nextMuted;
        if (!nextMuted) {
            video.volume = 1;
            try {
                await video.play();
            } catch {
                // browsers may require a user gesture
            }
        }
        setShowAudioCue(true);
        if (audioCueTimerRef.current) {
            window.clearTimeout(audioCueTimerRef.current);
        }
        audioCueTimerRef.current = window.setTimeout(() => {
            setShowAudioCue(false);
        }, 1500);
    };

    const triggerLikeCue = () => {
        setShowLikeCue(true);
        if (!liked) {
            setLiked(true);
        }
        if (likeCueTimerRef.current) {
            window.clearTimeout(likeCueTimerRef.current);
        }
        likeCueTimerRef.current = window.setTimeout(() => {
            setShowLikeCue(false);
        }, 1500);
    };

    const handleCenterTap = () => {
        const nowMs = Date.now();
        if (nowMs - lastTapRef.current < 280) {
            lastTapRef.current = 0;
            if (singleTapTimerRef.current) {
                window.clearTimeout(singleTapTimerRef.current);
                singleTapTimerRef.current = null;
            }
            triggerLikeCue();
            return;
        }
        lastTapRef.current = nowMs;
        if (singleTapTimerRef.current) {
            window.clearTimeout(singleTapTimerRef.current);
        }
        singleTapTimerRef.current = window.setTimeout(() => {
            handleToggleSound();
            singleTapTimerRef.current = null;
        }, 260);
    };

    const progressBars = useMemo(
        () =>
            reels.map((item, index) => {
                const isComplete = index < reelIndex;
                const isActive = index === reelIndex;
                const width = isComplete ? 100 : isActive ? progress : 0;
                return (
                    <div key={item.id} className={styles.progressTrack}>
                        <div className={styles.progressFill} style={{ width: `${width}%` }} />
                    </div>
                );
            }),
        [progress, reelIndex, reels]
    );

    return (
        <div className={styles.overlay}>
            <div className={styles.card}>
                <div className={styles.content}>
                    <div className={styles.contentBackdrop}>
                        <img src={storyBackdrop} className={styles.contentBackdropImage} alt={reel.shopName} />
                    </div>
                    {hasMedia ? (
                        <>
                            <div className={styles.progressRow}>{progressBars}</div>
                            <div className={styles.header}>
                                <div className={styles.avatarWrap}>
                                    <img
                                        src={reel.shopLogo}
                                        alt={reel.shopName}
                                        loading="lazy"
                                        decoding="async"
                                        className={styles.avatarImage}
                                    />
                                </div>
                                <div className="flex-1">
                                    <p className={styles.headerTitle}>{reel.shopName}</p>
                                    <div className={styles.meta}>
                                        <span className={styles.metaItem}>
                                            <Clock size={10} /> Expira en {hoursLeft}h {minutesLeft}m
                                        </span>
                                        <span className={styles.metaDot} />
                                        <span className={styles.metaItem}>
                                            <Eye size={10} /> {reel.views || 0} vistas
                                        </span>
                                        <span className={styles.metaDot} />
                                        <span className={`text-[10px] font-bold uppercase ${isSeen ? styles.seenActive : styles.seenNew}`}>
                                            {isSeen ? 'Visto' : 'Nuevo'}
                                        </span>
                                    </div>
                                </div>
                                <button onClick={onClose} className={styles.closeButton} data-story-ignore>
                                    <X size={28} />
                                </button>
                            </div>
                            <div className={styles.mediaWrap}>
                                {isVideo && reel.videoUrl ? (
                                    <video
                                        ref={videoRef}
                                        src={reel.videoUrl}
                                        poster={reel.thumbnail || reel.shopLogo}
                                        className={styles.mediaImage}
                                        muted={isMuted}
                                        playsInline
                                        autoPlay
                                        loop
                                    />
                                ) : (
                                    <img
                                        src={activePhoto || storyBackdrop}
                                        alt={reel.shopName}
                                        loading="lazy"
                                        decoding="async"
                                        className={styles.mediaImage}
                                    />
                                )}
                            </div>
                            <button className={styles.tapZoneLeft} onClick={handlePrev} aria-label="Historia anterior" />
                            <button className={styles.tapZoneRight} onClick={handleNext} aria-label="Historia siguiente" />
                            <button
                                className={styles.audioTapZone}
                                onClick={handleCenterTap}
                                aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}
                            />
                            <div className={styles.footer}>
                                <div className={styles.footerActions}>
                                    <button onClick={handleShare} className={styles.shareButton} data-story-ignore>
                                        <Share2 size={18} /> Compartir
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (!guardClientAction()) return;
                                            setLiked((prev) => !prev);
                                        }}
                                        className={`${styles.likeButton} ${liked ? styles.likeButtonActive : ''}`}
                                        aria-pressed={liked}
                                        data-story-ignore
                                    >
                                        <Heart size={18} className={liked ? 'fill-current' : ''} /> Me gusta
                                    </button>
                                </div>
                                <div className={styles.footerLinks}>
                                    <button onClick={handleOpenMaps} className={styles.footerLinkButton} data-story-ignore>
                                        <MapPin size={16} /> Mapa
                                    </button>
                                    <button onClick={handleOpenCatalog} className={styles.footerLinkButton} data-story-ignore>
                                        <BookOpen size={16} /> Catalogo
                                    </button>
                                </div>
                            </div>
                            {isVideo && (
                                <div className={`${styles.audioCue} ${showAudioCue ? styles.audioCueVisible : ''}`}>
                                    <span className={styles.audioCueBadge}>
                                        {isMuted ? <VolumeX size={28} /> : <Volume2 size={28} />}
                                    </span>
                                </div>
                            )}
                            <div className={`${styles.likeCue} ${showLikeCue ? styles.likeCueVisible : ''}`}>
                                <span className={styles.likeCueGlow} />
                                <Heart size={96} className={styles.likeCueIcon} />
                            </div>
                        </>
                    ) : (
                        <div className={styles.contentStack}>
                            <div className={styles.contentIcon}>
                                <ExternalLink size={32} className="text-white" />
                            </div>
                            <div>
                                <h3 className={styles.contentTitle}>Contenido Externo</h3>
                                <p className={styles.contentText}>Esta historia esta alojada en {reel.platform}.</p>
                            </div>
                            <Button onClick={handleOpenExternal} className={styles.ctaButton}>
                                Ver en {reel.platform}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
            <ShopMapModal
                open={isMapOpen}
                onClose={() => {
                    setIsMapOpen(false);
                    setMapFocusName(null);
                }}
                focusName={mapFocusName ?? reel.shopName}
                focusKeys={[mapFocusName ?? reel.shopName, reel.shopId].filter(Boolean) as string[]}
            />
        </div>
    );
};
