// StoryModal shows a reel preview with actions and metadata.
import React from 'react';
import { Reel } from '../types';
import { X, ExternalLink, Clock, Share2, Eye } from 'lucide-react';
import { Button } from './Button';
import styles from './StoryModal.module.css';

interface StoryModalProps {
    reel: Reel;
    onClose: () => void;
    onNotify?: (title: string, message: string, tone?: 'info' | 'success' | 'warning' | 'error') => void;
    isSeen?: boolean;
}

export const StoryModal: React.FC<StoryModalProps> = ({ reel, onClose, onNotify, isSeen }) => {
    
    // Calculate time left
    const now = new Date();
    const expires = new Date(reel.expiresAtISO);
    const diffMs = expires.getTime() - now.getTime();
    const hoursLeft = Math.floor(diffMs / (1000 * 60 * 60));
    const minutesLeft = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    const handleOpenExternal = () => {
        window.open(reel.url, '_blank');
    };

    const handleShare = async () => {
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

    return (
        <div className={styles.overlay}>
            <button 
                onClick={onClose} 
                className={styles.closeButton}
            >
                <X size={32} />
            </button>

            <div className={styles.card}>
                
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
                         <img src={reel.shopLogo} className={styles.contentBackdropImage} alt={reel.shopName} />
                    </div>
                    
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
                </div>

                {/* Footer Actions */}
                <div className={styles.footer}>
                    <button onClick={handleShare} className={styles.shareButton}>
                        <Share2 size={18} /> Compartir
                    </button>
                    <div className={styles.footerLabel}>
                        Historias de Distrito Moda
                    </div>
                </div>
            </div>
        </div>
    );
};
