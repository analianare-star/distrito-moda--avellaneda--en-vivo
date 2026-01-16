import React, { useState, useEffect } from 'react';
import { Shop, UserContext, Stream, StreamStatus } from '../types';
import { Button } from './Button';
import { ShareableCard } from './ShareableCard';
import { LogoBubble } from './LogoBubble';
import { ShopMapModal } from './ShopMapModal';
import { X, MapPin, Globe, Instagram, Phone, UserPlus, Check, AlertOctagon, Clock } from 'lucide-react';
import styles from './ShopDetailModal.module.css';

// ShopDetailModal presents the shop profile with contact and agenda actions.
interface ShopDetailModalProps {
  shop: Shop;
  shopStreams?: Stream[]; 
  user: UserContext;
  canClientInteract: boolean;
  initialTab?: 'INFO' | 'CARD';
  onClose: () => void;
  onToggleFavorite: (shopId: string) => void;
  onRequireLogin: () => void;
  onNotify?: (title: string, message: string, tone?: 'info' | 'success' | 'warning' | 'error') => void;
}

export const ShopDetailModal: React.FC<ShopDetailModalProps> = ({ shop, shopStreams = [], user, canClientInteract, initialTab, onClose, onToggleFavorite, onRequireLogin, onNotify }) => {
  const [activeTab, setActiveTab] = useState<'INFO' | 'CARD'>(initialTab ?? 'INFO');
  const [isMapOpen, setIsMapOpen] = useState(false);

  useEffect(() => {
      if (initialTab) {
          setActiveTab(initialTab);
      }
  }, [initialTab]);
  
  const isFollowing = user.favorites.includes(shop.id);
  const canDownloadCard = shop.dataIntegrity === 'MINIMAL' || shop.dataIntegrity === 'COMPLETE';

  // PRIORITY STREAM SELECTION
  const liveStream = shopStreams.find(s => s.status === StreamStatus.LIVE);
  const upcomingStream = shopStreams.find(s => s.status === StreamStatus.UPCOMING);
  const priorityStream = liveStream || upcomingStream || shopStreams[0];

  const handleInstagram = () => {
      if(shop.socialHandles.instagram) window.open(`https://instagram.com/${shop.socialHandles.instagram}`, '_blank');
  };
  
  const handleWeb = () => {
      if(shop.website) window.open(shop.website, '_blank');
  };

  const handleMaps = () => {
      setIsMapOpen(true);
  };

  const whatsappLimit = shop.plan === 'Maxima Visibilidad' ? 3 : shop.plan === 'Alta Visibilidad' ? 2 : 1;
  const canSeeWhatsapp = canClientInteract;
  // Filter valid lines
  const waLines = shop.whatsappLines ? shop.whatsappLines.filter(l => l.number && l.number.trim() !== '').slice(0, whatsappLimit) : [];

  return (
    <>
      <div className={styles.overlay}>
        <div className={styles.card}>
        
        {/* Header */}
        <div className={styles.header}>
            {shop.coverUrl && (
                <div
                    className={styles.headerCover}
                    style={{ backgroundImage: `url(${shop.coverUrl})` }}
                />
            )}
            <button 
                onClick={onClose}
                className={styles.closeButton}
                aria-label="Cerrar"
            >
                <X size={20} />
            </button>
            <div className={styles.headerContent}>
                <LogoBubble
                  src={shop.logoUrl}
                  alt={shop.name}
                  size={92}
                  seed={shop.id || shop.name}
                />
                
                <button 
                    onClick={() => canClientInteract && onToggleFavorite(shop.id)}
                    className={`${styles.followButton} ${
                        canClientInteract
                          ? isFollowing
                            ? styles.followActive
                            : styles.followInactive
                          : styles.followDisabled
                    }`}
                    disabled={!canClientInteract}
                    aria-pressed={isFollowing}
                    aria-label={isFollowing ? 'Dejar de seguir tienda' : 'Seguir tienda'}
                >
                    {canClientInteract ? (
                        isFollowing ? (
                            <>Siguiendo <Check size={14}/></>
                        ) : (
                            <>Seguir Tienda <UserPlus size={14}/></>
                        )
                    ) : (
                        <>Solo clientes</>
                    )}
                </button>
            </div>
        </div>

        {/* Body */}
        <div className={styles.body}>
            <h2 className={styles.title}>{shop.name}</h2>
            
            {/* Tabs */}
            <div className={styles.tabs}>
                <button
                    onClick={() => setActiveTab('INFO')}
                    className={`${styles.tabButton} ${activeTab === 'INFO' ? styles.tabActive : styles.tabInactive}`}
                >
                    Perfil
                </button>
                <button
                    onClick={() => {
                        if (!canClientInteract) {
                            onRequireLogin();
                            return;
                        }
                        setActiveTab('CARD');
                    }}
                    className={`${styles.tabButton} ${activeTab === 'CARD' ? styles.tabActive : styles.tabInactive}`}
                >
                    Tarjeta Digital
                </button>
            </div>

            {activeTab === 'INFO' ? (
                <div className={styles.infoSection}>
                    
                    {/* LIVE / UPCOMING CONTEXT BLOCK */}
                    {liveStream ? (
                        <div className={styles.liveBlock}>
                            <div>
                                <p className={styles.liveLabel}>En Vivo Ahora</p>
                                <p className={styles.liveTime}>HOY · {liveStream.scheduledTime} hs</p>
                            </div>
                            <Button size="sm" onClick={() => window.open(liveStream.url, '_blank')}>Ver</Button>
                        </div>
                    ) : upcomingStream ? (
                         <div className={styles.upcomingBlock}>
                            <p className={styles.upcomingLabel}><Clock size={12}/> Próximo Vivo</p>
                            <p className={styles.upcomingTime}>
                                {new Date(upcomingStream.fullDateISO).getDate()} {new Date(upcomingStream.fullDateISO).toLocaleDateString('es-ES', {month: 'short'}).toUpperCase()} · {upcomingStream.scheduledTime} hs
                            </p>
                        </div>
                    ) : null}

                    {/* LINKS REALES */}
                    <div className={styles.links}>
                         {/* Dynamic WhatsApp Buttons */}
                        {canSeeWhatsapp ? (
                            waLines.length > 0 ? (
                                waLines.map((line, idx) => (
                                    <Button 
                                        key={idx}
                                        variant="outline" 
                                        className="w-full justify-between text-xs border-green-500 text-green-600 hover:bg-green-50 h-10"
                                        onClick={() => window.open(`https://wa.me/${line.number}`, '_blank')}
                                    >
                                        <span className="flex items-center"><Phone size={14} className="mr-2" /> WhatsApp ({line.label})</span>
                                    </Button>
                                ))
                            ) : (
                                <Button variant="outline" className="w-full justify-start text-xs border-gray-200 text-gray-400 h-10 cursor-not-allowed" disabled>
                                    <Phone size={14} className="mr-2" /> WhatsApp no disponible
                                </Button>
                            )
                        ) : (
                            <Button
                                variant="outline"
                                className="w-full justify-start text-xs border-gray-200 text-gray-400 h-10"
                                onClick={onRequireLogin}
                            >
                                <Phone size={14} className="mr-2" /> Solo clientes
                            </Button>
                        )}

                        <div className={styles.linkGrid}>
                             <Button 
                                variant="outline" 
                                className="w-full justify-start text-xs h-10 px-2"
                                onClick={handleInstagram}
                                disabled={!shop.socialHandles.instagram}
                            >
                                <Instagram size={14} className="mr-1.5" /> IG
                            </Button>
                            <Button 
                                variant="outline" 
                                className="w-full justify-start text-xs h-10 px-2"
                                onClick={handleWeb}
                                disabled={!shop.website}
                            >
                                <Globe size={14} className="mr-1.5" /> Web
                            </Button>
                            <Button 
                                variant="outline" 
                                className="w-full justify-start text-xs h-10 px-2"
                                onClick={handleMaps}
                            >
                                <MapPin size={14} className="mr-1.5" /> Mapa
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className={styles.cardSection}>
                    {!canClientInteract ? (
                        <div className={styles.alertBox}>
                            <AlertOctagon size={32} className="mx-auto text-orange-400 mb-2" />
                            <p className={styles.alertTitle}>Solo clientes pueden ver la tarjeta</p>
                            <p className={styles.alertText}>Iniciá sesión con un perfil cliente.</p>
                        </div>
                    ) : canDownloadCard ? (
                        <>
                            <div className={styles.cardWrapper}>
                                <ShareableCard 
                                    shop={shop} 
                                    stream={priorityStream} 
                                    mode="CLIENT" // Client mode = Contact Info & Real Links
                                    onNotify={onNotify}
                                />
                            </div>
                        </>
                    ) : (
                        <div className={styles.alertBox}>
                            <AlertOctagon size={32} className="mx-auto text-orange-400 mb-2" />
                            <p className={styles.alertTitle}>Tarjeta no disponible</p>
                            <p className={styles.alertText}>La tienda no ha completado sus datos obligatorios.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
      </div>
      <ShopMapModal open={isMapOpen} onClose={() => setIsMapOpen(false)} focusName={shop.name} />
    </>
  );
};
