// StoryModal shows a reel preview with actions and metadata.
import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Reel } from '../types';
import { X, ExternalLink, Clock, Share2, Eye, Heart, MapPin, BookOpen, Volume2, VolumeX } from 'lucide-react';
import { Button } from './Button';
import { NoticeModal } from './NoticeModal';
import styles from './StoryModal.module.css';

const ShopMapModal = React.lazy(async () => {
    const mod = await import('./ShopMapModal');
    return { default: mod.ShopMapModal };
});

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

type ReelGroup = {
    shopId: string;
    shopName: string;
    shopLogo: string;
    reels: Reel[];
    latestAt: string;
};

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
    const [isCatalogConfirmOpen, setIsCatalogConfirmOpen] = useState(false);
    const [mapFocusName, setMapFocusName] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [isMuted, setIsMuted] = useState(true);
    const [showAudioCue, setShowAudioCue] = useState(false);
    const [showLikeCue, setShowLikeCue] = useState(false);
    const [cubeAngle, setCubeAngle] = useState(0);
    const [cubeDepth, setCubeDepth] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isSnapping, setIsSnapping] = useState(false);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const audioCueTimerRef = useRef<number | null>(null);
    const likeCueTimerRef = useRef<number | null>(null);
    const lastTapRef = useRef<number>(0);
    const singleTapTimerRef = useRef<number | null>(null);
    const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
    const cubeRef = useRef<HTMLDivElement | null>(null);
    const pendingReelRef = useRef<Reel | null>(null);

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

    const groupedReels = useMemo<ReelGroup[]>(() => {
        const map = new Map<string, ReelGroup>();
        reels.forEach((item) => {
            if (!map.has(item.shopId)) {
                map.set(item.shopId, {
                    shopId: item.shopId,
                    shopName: item.shopName,
                    shopLogo: item.shopLogo,
                    reels: [],
                    latestAt: item.createdAtISO,
                });
            }
            const group = map.get(item.shopId)!;
            group.reels.push(item);
            if (item.createdAtISO > group.latestAt) {
                group.latestAt = item.createdAtISO;
            }
        });
        return Array.from(map.values())
            .map((group) => ({
                ...group,
                reels: group.reels.sort((a, b) => a.createdAtISO.localeCompare(b.createdAtISO)),
            }))
            .sort((a, b) => b.latestAt.localeCompare(a.latestAt));
    }, [reels]);

    const groupIndex = Math.max(
        0,
        groupedReels.findIndex((group) => group.shopId === reel.shopId)
    );
    const currentGroup = groupedReels[groupIndex] || {
        shopId: reel.shopId,
        shopName: reel.shopName,
        shopLogo: reel.shopLogo,
        reels: [reel],
        latestAt: reel.createdAtISO,
    };
    const groupReels = currentGroup.reels;
    const reelIndex = Math.max(0, groupReels.findIndex((item) => item.id === reel.id));
    const totalReels = groupReels.length;

    const guardClientAction = () => {
        if (canClientInteract === false) {
            onRequireLogin?.();
            return false;
        }
        return true;
    };

    const openExternalUrl = (value: string) => {
        const trimmed = value.trim();
        if (!trimmed) return;
        const url = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
        window.open(url, '_blank');
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
        setIsCatalogConfirmOpen(true);
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

    const goToReel = useCallback(
        (nextReel: Reel) => {
            setIsDragging(false);
            setIsSnapping(false);
            setCubeAngle(0);
            onNavigate(nextReel);
        },
        [onNavigate]
    );

    const handleNext = useCallback(() => {
        if (totalReels <= 1 && groupedReels.length <= 1) {
            onClose();
            return;
        }
        if (reelIndex < totalReels - 1) {
            goToReel(groupReels[reelIndex + 1]);
            return;
        }
        const nextGroup = groupedReels[groupIndex + 1];
        if (nextGroup) {
            goToReel(nextGroup.reels[0]);
            return;
        }
        onClose();
    }, [groupIndex, groupedReels, goToReel, onClose, reelIndex, totalReels, groupReels]);

    const handlePrev = useCallback(() => {
        if (totalReels <= 1 && groupedReels.length <= 1) {
            onClose();
            return;
        }
        if (reelIndex > 0) {
            goToReel(groupReels[reelIndex - 1]);
            return;
        }
        const prevGroup = groupedReels[groupIndex - 1];
        if (prevGroup) {
            goToReel(prevGroup.reels[prevGroup.reels.length - 1]);
            return;
        }
        onClose();
    }, [groupIndex, groupedReels, goToReel, onClose, reelIndex, totalReels, groupReels]);

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

    const getReelBackdrop = (item: Reel, progressValue = 0) => {
        if (item.type === 'VIDEO' && item.videoUrl) {
            return item.thumbnail || item.shopLogo || '';
        }
        const photos = Array.isArray(item.photoUrls) ? item.photoUrls : [];
        if (!photos.length) return item.thumbnail || item.shopLogo || '';
        const idx = Math.min(photos.length - 1, Math.floor((progressValue / 100) * photos.length));
        return photos[idx] || item.thumbnail || item.shopLogo || '';
    };

    const getPrevReel = () => {
        if (reelIndex > 0) {
            return groupReels[reelIndex - 1];
        }
        const prevGroup = groupedReels[groupIndex - 1];
        if (prevGroup) {
            return prevGroup.reels[prevGroup.reels.length - 1];
        }
        return null;
    };

    const getNextReel = () => {
        if (reelIndex < totalReels - 1) {
            return groupReels[reelIndex + 1];
        }
        const nextGroup = groupedReels[groupIndex + 1];
        if (nextGroup) {
            return nextGroup.reels[0];
        }
        return null;
    };

    const updateCubeDepth = useCallback(() => {
        const node = cubeRef.current;
        if (!node) return;
        const width = node.clientWidth;
        if (!width) return;
        setCubeDepth(Math.round(width / 2));
    }, []);

    useEffect(() => {
        updateCubeDepth();
        if (typeof window === 'undefined') return;
        const handleResize = () => updateCubeDepth();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [updateCubeDepth]);

    useEffect(() => {
        setIsDragging(false);
    }, [reel.id]);

    const handleSwipeStart = (event: React.TouchEvent<HTMLDivElement>) => {
        if ((event.target as HTMLElement)?.closest('[data-story-ignore]')) return;
        swipeStartRef.current = {
            x: event.touches[0]?.clientX ?? 0,
            y: event.touches[0]?.clientY ?? 0,
        };
        setIsDragging(true);
        setIsSnapping(false);
        updateCubeDepth();
    };

    const handleSwipeMove = (event: React.TouchEvent<HTMLDivElement>) => {
        if (!swipeStartRef.current || isSnapping) return;
        const currentX = event.touches[0]?.clientX ?? swipeStartRef.current.x;
        const currentY = event.touches[0]?.clientY ?? swipeStartRef.current.y;
        const deltaX = currentX - swipeStartRef.current.x;
        const deltaY = currentY - swipeStartRef.current.y;
        if (Math.abs(deltaY) > Math.abs(deltaX)) return;
        event.preventDefault();
        const width = cubeRef.current?.clientWidth || 1;
        const nextReel = getNextReel();
        const prevReel = getPrevReel();
        const maxPositive = prevReel ? 90 : 0;
        const maxNegative = nextReel ? -90 : 0;
        const rawAngle = (deltaX / width) * 90;
        const clamped = Math.max(maxNegative, Math.min(maxPositive, rawAngle));
        setCubeAngle(clamped);
    };

    const handleSwipeEnd = () => {
        if (!swipeStartRef.current) return;
        const finalAngle = cubeAngle;
        const nextReel = getNextReel();
        const prevReel = getPrevReel();
        swipeStartRef.current = null;
        setIsDragging(false);
        const threshold = 40;
        if (finalAngle <= -threshold && nextReel) {
            setIsSnapping(false);
            setCubeAngle(0);
            goToReel(nextReel);
            return;
        }
        if (finalAngle >= threshold && prevReel) {
            setIsSnapping(false);
            setCubeAngle(0);
            goToReel(prevReel);
            return;
        }
        setIsSnapping(true);
        setCubeAngle(0);
    };

    const handleCubeTransitionEnd = () => {
        if (!isSnapping) return;
        const pending = pendingReelRef.current;
        pendingReelRef.current = null;
        if (pending) {
            goToReel(pending);
            return;
        }
        setIsSnapping(false);
        setCubeAngle(0);
    };

    const progressBars = useMemo(
        () =>
            groupReels.map((item, index) => {
                const isComplete = index < reelIndex;
                const isActive = index === reelIndex;
                const width = isComplete ? 100 : isActive ? progress : 0;
                return (
                    <div key={item.id} className={styles.progressTrack}>
                        <div className={styles.progressFill} style={{ width: `${width}%` }} />
                    </div>
                );
            }),
        [progress, reelIndex, groupReels]
    );

    const renderFace = (item: Reel, options?: { muted?: boolean; progressValue?: number; disableActions?: boolean }) => {
        const muted = options?.muted ?? true;
        const progressValue = options?.progressValue ?? 0;
        const photoList = Array.isArray(item.photoUrls) ? item.photoUrls : [];
        const isVideoItem = item.type === 'VIDEO' && Boolean(item.videoUrl);
        const backdrop = getReelBackdrop(item, progressValue);
        const activePhotoLocal = photoList.length ? photoList[0] : '';
        const canRenderMedia = Boolean(isVideoItem ? item.videoUrl : backdrop);
        const hours = Math.max(0, Math.floor((new Date(item.expiresAtISO).getTime() - now.getTime()) / (1000 * 60 * 60)));
        const minutes = Math.max(
            0,
            Math.floor(((new Date(item.expiresAtISO).getTime() - now.getTime()) % (1000 * 60 * 60)) / (1000 * 60))
        );
        return (
            <div className={`${styles.faceContent} ${options?.disableActions ? styles.faceDisabled : ''}`}>
                <div className={styles.contentBackdrop}>
                    <img src={backdrop} className={styles.contentBackdropImage} alt={item.shopName} />
                </div>
                {canRenderMedia ? (
                    <>
                        <div className={styles.progressRow}>
                            <div className={styles.progressTrack}>
                                <div className={styles.progressFill} style={{ width: `${progressValue}%` }} />
                            </div>
                        </div>
                        <div className={styles.header}>
                            <div className={styles.avatarWrap}>
                                <img
                                    src={item.shopLogo}
                                    alt={item.shopName}
                                    loading="lazy"
                                    decoding="async"
                                    className={styles.avatarImage}
                                />
                            </div>
                            <div className="flex-1">
                                <p className={styles.headerTitle}>{item.shopName}</p>
                                <div className={styles.meta}>
                                    <span className={styles.metaItem}>
                                        <Clock size={10} /> Expira en {hours}h {minutes}m
                                    </span>
                                    <span className={styles.metaDot} />
                                    <span className={styles.metaItem}>
                                        <Eye size={10} /> {item.views || 0} vistas
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className={styles.mediaWrap}>
                            {isVideoItem && item.videoUrl ? (
                                <video
                                    src={item.videoUrl}
                                    poster={item.thumbnail || item.shopLogo}
                                    className={styles.mediaImage}
                                    muted={muted}
                                    playsInline
                                    autoPlay
                                    loop
                                />
                            ) : (
                                <img
                                    src={activePhotoLocal || backdrop}
                                    alt={item.shopName}
                                    loading="lazy"
                                    decoding="async"
                                    className={styles.mediaImage}
                                />
                            )}
                        </div>
                        <div className={styles.footer}>
                            <div className={styles.footerActions}>
                                <span className={styles.shareButton}>
                                    <Share2 size={18} /> Compartir
                                </span>
                                <span className={styles.likeButton}>
                                    <Heart size={18} /> Me gusta
                                </span>
                            </div>
                            <div className={styles.footerLinks}>
                                <span className={styles.footerLinkButton}>
                                    <MapPin size={16} /> Mapa
                                </span>
                                <span className={styles.footerLinkButton}>
                                    <BookOpen size={16} /> Catalogo DM
                                </span>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className={styles.contentStack}>
                        <div className={styles.contentIcon}>
                            <ExternalLink size={32} className="text-white" />
                        </div>
                        <div>
                            <h3 className={styles.contentTitle}>Contenido Externo</h3>
                            <p className={styles.contentText}>Esta historia esta alojada en {item.platform}.</p>
                        </div>
                        <Button className={styles.ctaButton}>Ver en {item.platform}</Button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.card} ref={cubeRef}>
                <div className={styles.cubeStage}>
                    <div
                        className={`${styles.cube} ${isDragging ? styles.cubeDragging : ''} ${isSnapping ? styles.cubeSnapping : ''}`}
                        style={{
                            transform: `translateZ(calc(-1 * var(--cube-depth))) rotateY(${cubeAngle}deg)`,
                            ['--cube-depth' as React.CSSProperties['--cube-depth']]: `${cubeDepth}px`,
                        }}
                        onTouchStart={handleSwipeStart}
                        onTouchMove={handleSwipeMove}
                        onTouchEnd={handleSwipeEnd}
                        onTransitionEnd={handleCubeTransitionEnd}
                    >
                        <div className={`${styles.cubeFace} ${styles.faceFront}`}>
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
                                                    src={currentGroup.shopLogo}
                                                    alt={currentGroup.shopName}
                                                    loading="lazy"
                                                    decoding="async"
                                                    className={styles.avatarImage}
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <p className={styles.headerTitle}>{currentGroup.shopName}</p>
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
                                                    <BookOpen size={16} /> Catalogo DM
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
                        {getPrevReel() && (
                            <div className={`${styles.cubeFace} ${styles.faceLeft}`}>
                                {renderFace(getPrevReel() as Reel, { muted: true, progressValue: 0, disableActions: true })}
                            </div>
                        )}
                        {getNextReel() && (
                            <div className={`${styles.cubeFace} ${styles.faceRight}`}>
                                {renderFace(getNextReel() as Reel, { muted: true, progressValue: 0, disableActions: true })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <Suspense fallback={<div className="fixed inset-0 z-[180] bg-black/70" />}>
                <ShopMapModal
                    open={isMapOpen}
                    onClose={() => {
                        setIsMapOpen(false);
                        setMapFocusName(null);
                    }}
                    focusName={mapFocusName ?? reel.shopName}
                    focusKeys={[mapFocusName ?? reel.shopName, reel.shopId].filter(Boolean) as string[]}
                />
            </Suspense>
            <NoticeModal
                isOpen={isCatalogConfirmOpen}
                title="Catalogo DM"
                message="Estas a punto de ir a nuestro catalogo en Distrito Moda. Continuamos?"
                tone="info"
                confirmLabel="Si, continuar"
                cancelLabel="No, volver"
                onClose={() => setIsCatalogConfirmOpen(false)}
                onCancel={() => setIsCatalogConfirmOpen(false)}
                onConfirm={() => {
                    setIsCatalogConfirmOpen(false);
                    openExternalUrl(catalogUrl);
                }}
            />
        </div>
    );
};
