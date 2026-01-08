
import React from 'react';
import { Reel } from '../types';
import { X, ExternalLink, Clock, Share2, Eye } from 'lucide-react';
import { Button } from './Button';

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
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-200">
            <button 
                onClick={onClose} 
                className="absolute top-4 right-4 text-white hover:text-dm-crimson z-50 p-2"
            >
                <X size={32} />
            </button>

            <div className="relative w-full max-w-sm h-[80vh] bg-dm-dark rounded-xl overflow-hidden shadow-2xl flex flex-col border border-white/10">
                
                {/* Header Info */}
                <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-20 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border-2 border-dm-crimson p-0.5 bg-white">
                        <img src={reel.shopLogo} alt={reel.shopName} loading="lazy" decoding="async" className="w-full h-full rounded-full object-cover" />
                    </div>
                    <div className="flex-1">
                        <p className="text-white font-bold text-sm">{reel.shopName}</p>
                        <div className="flex items-center gap-2 text-gray-300 text-xs">
                            <span className="flex items-center gap-1">
                                <Clock size={10} /> Expira en {hoursLeft}h {minutesLeft}m
                            </span>
                            <span className="h-1 w-1 rounded-full bg-gray-500" />
                            <span className="flex items-center gap-1">
                                <Eye size={10} /> {reel.views || 0} vistas
                            </span>
                            <span className="h-1 w-1 rounded-full bg-gray-500" />
                            <span className={`text-[10px] font-bold uppercase ${isSeen ? 'text-gray-400' : 'text-dm-crimson'}`}>
                                {isSeen ? 'Visto' : 'Nuevo'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Content Placeholder / Preview */}
                <div className="flex-1 bg-black flex flex-col items-center justify-center text-center p-8 relative">
                    {/* Background blurry effect */}
                    <div className="absolute inset-0 opacity-30">
                         <img src={reel.shopLogo} className="w-full h-full object-cover blur-2xl" alt={reel.shopName} />
                    </div>
                    
                    <div className="relative z-10 space-y-6">
                        <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto animate-pulse">
                            <ExternalLink size={32} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-white font-serif text-2xl mb-2">Contenido Externo</h3>
                            <p className="text-gray-300 text-sm">Esta historia está alojada en {reel.platform}.</p>
                        </div>
                        <Button onClick={handleOpenExternal} className="bg-dm-crimson hover:bg-white hover:text-dm-crimson text-white w-full py-4 shadow-lg shadow-dm-crimson/20">
                            Ver en {reel.platform}
                        </Button>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-gradient-to-t from-black/80 to-transparent z-20 flex justify-between items-center">
                    <button onClick={handleShare} className="text-white hover:text-dm-crimson transition-colors flex items-center gap-2 text-sm font-bold">
                        <Share2 size={18} /> Compartir
                    </button>
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest font-sans">
                        Distrito Moda Stories
                    </div>
                </div>
            </div>
        </div>
    );
};
