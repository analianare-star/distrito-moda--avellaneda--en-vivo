// StoryModal shows a reel preview with actions and metadata.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Reel } from '../types';
import { X, ExternalLink, Clock, Share2, Eye, Heart, MapPin, BookOpen } from 'lucide-react';
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
    
    // Calculate time left
    const now = new Date();
    const expires = new Date(reel.expiresAtISO);
    const diffMs = expires.getTime() - now.getTime();
    const hoursLeft = Math.floor(diffMs / (1000 * 60 * 60));
    const minutesLeft = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const storyImage = reel.thumbnail || reel.shopLogo;
    const hasMedia = Boolean(storyImage);
    const catalogUrl = reel.shopCatalogUrl || '';
    const [liked, setLiked] = useState(false);
    const [isMapOpen, setIsMapOpen] = useState(false);
    const [mapFocusName, setMapFocusName] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
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
            onNotify?.('Catálogo no disponible', 'Esta tienda aún no cargó su catálogo.', 'warning');
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
                    url: reel.url
                });
                onNotify?.('Compartido', 'El link se compartió correctamente.', 'success');
                return;
            } catch (e) {
                onNotify?.('Compartir cancelado', 'No se completó el envío.', 'warning');
                return;
            }
        }

        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(reel.url);
                onNotify?.('Link copiado', 'Pegalo donde quieras compartirlo.', 'success');
                return;
            }
        } catch (e) {
            // Fallback below
        }

        onNotify?.('No se pudo copiar', 'Tu navegador no permite copiar automáticamente.', 'error');
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
        const timer = window.setInterval(() => {
            setProgress((value) => {
                if (value >= 100) {
                    window.clearInterval(timer);
                    handleNext();
                    return 100;
                }
                return value + 1;
            });
        }, 100);
        return () => window.clearInterval(timer);
    }, [reel.id, handleNext, isMapOpen]);

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
            <button 
                onClick={onClose} 
                className={styles.closeButton}
            >
                <X size={32} />
            </button>

            <div className={styles.card}>

                <div className={styles.progressRow}>{progressBars}</div>

                <button className={styles.tapZoneLeft} onClick={handlePrev} aria-label="Historia anterior" />
                <button className={styles.tapZoneRight} onClick={handleNext} aria-label="Historia siguiente" />
                
                {/* Header Info */}
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
                </div>

                {/* Content Placeholder / Preview */}
                <div className={styles.content}>
                    {/* Background blurry effect */}
                    <div className={styles.contentBackdrop}>
                         <img src={storyImage} className={styles.contentBackdropImage} alt={reel.shopName} />
                    </div>
                    {hasMedia ? (
                        <div className={styles.mediaWrap}>
                            <img
                                src={storyImage}
                                alt={reel.shopName}
                                loading="lazy"
                                decoding="async"
                                className={styles.mediaImage}
                            />
                        </div>
                    ) : (
                        <div className={styles.contentStack}>
                            <div className={styles.contentIcon}>
                                <ExternalLink size={32} className="text-white" />
                            </div>
                            <div>
                                <h3 className={styles.contentTitle}>Contenido Externo</h3>
                                <p className={styles.contentText}>Esta historia está alojada en {reel.platform}.</p>
                            </div>
                            <Button onClick={handleOpenExternal} className={styles.ctaButton}>
                                Ver en {reel.platform}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className={styles.footer}>
                    <div className={styles.footerActions}>
                        <button onClick={handleShare} className={styles.shareButton}>
                            <Share2 size={18} /> Compartir
                        </button>
                        <button
                            onClick={() => {
                                if (!guardClientAction()) return;
                                setLiked((prev) => !prev);
                                onNotify?.('Me gusta', 'Sumamos tu reacción a esta historia.', 'success');
                            }}
                            className={`${styles.likeButton} ${liked ? styles.likeButtonActive : ''}`}
                            aria-pressed={liked}
                        >
                            <Heart size={18} className={liked ? 'fill-current' : ''} /> Me gusta
                        </button>
                    </div>
                    <div className={styles.footerLinks}>
                        <button onClick={handleOpenMaps} className={styles.footerLinkButton}>
                            <MapPin size={16} /> Mapa
                        </button>
                        <button
                            onClick={handleOpenCatalog}
                            className={styles.footerLinkButton}
                        >
                            <BookOpen size={16} /> Catálogo
                        </button>
                    </div>
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
