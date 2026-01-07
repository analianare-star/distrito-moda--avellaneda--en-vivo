import React, { useState } from 'react';
import { Shop, UserContext, Stream, StreamStatus } from '../types';
import { Button } from './Button';
import { ShareableCard } from './ShareableCard';
import { X, MapPin, Globe, Instagram, Phone, UserPlus, Check, AlertOctagon, Clock } from 'lucide-react';

interface ShopDetailModalProps {
  shop: Shop;
  shopStreams?: Stream[]; 
  user: UserContext;
  canClientInteract: boolean;
  onClose: () => void;
  onToggleFavorite: (shopId: string) => void;
  onRequireLogin: () => void;
  onNotify?: (title: string, message: string, tone?: 'info' | 'success' | 'warning' | 'error') => void;
}

export const ShopDetailModal: React.FC<ShopDetailModalProps> = ({ shop, shopStreams = [], user, canClientInteract, onClose, onToggleFavorite, onRequireLogin, onNotify }) => {
  const [activeTab, setActiveTab] = useState<'INFO' | 'CARD'>('INFO');
  
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

  const mapsUrl = shop.addressDetails?.mapsUrl;
  const hasMap = Boolean(mapsUrl || shop.address);
  const handleMaps = () => {
      if (mapsUrl) {
          window.open(mapsUrl, '_blank');
          return;
      }
      if (shop.address) {
          window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.address)}`, '_blank');
      }
  };

  const whatsappLimit = shop.plan === 'Maxima Visibilidad' ? 3 : shop.plan === 'Alta Visibilidad' ? 2 : 1;
  const canSeeWhatsapp = canClientInteract;
  // Filter valid lines
  const waLines = shop.whatsappLines ? shop.whatsappLines.filter(l => l.number && l.number.trim() !== '').slice(0, whatsappLimit) : [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="relative h-32 bg-dm-dark flex-shrink-0">
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-2 transition-colors z-10"
                aria-label="Cerrar"
            >
                <X size={20} />
            </button>
            <div className="absolute -bottom-10 left-6 flex items-end justify-between w-[calc(100%-48px)]">
                <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden bg-white shadow-md relative z-10">
                    <img src={shop.logoUrl} alt={shop.name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                </div>
                
                <button 
                    onClick={() => canClientInteract && onToggleFavorite(shop.id)}
                    className={`mb-2 px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-sm transition-all ${
                        canClientInteract
                          ? isFollowing
                            ? 'bg-gray-100 text-dm-dark border border-gray-300'
                            : 'bg-dm-crimson text-white hover:bg-red-700'
                          : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
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
        <div className="pt-12 px-6 pb-6 flex-1 overflow-y-auto">
            <h2 className="font-serif text-3xl text-dm-dark leading-none mb-4">{shop.name}</h2>
            
            {/* Tabs */}
            <div className="flex border-b border-gray-100 mb-6">
                <button onClick={() => setActiveTab('INFO')} className={`flex-1 py-3 text-sm font-bold uppercase tracking-wide border-b-2 ${activeTab === 'INFO' ? 'border-dm-crimson text-dm-crimson' : 'border-transparent text-gray-400'}`}>Perfil</button>
                <button
                    onClick={() => {
                        if (!canClientInteract) {
                            onRequireLogin();
                            return;
                        }
                        setActiveTab('CARD');
                    }}
                    className={`flex-1 py-3 text-sm font-bold uppercase tracking-wide border-b-2 ${activeTab === 'CARD' ? 'border-dm-crimson text-dm-crimson' : 'border-transparent text-gray-400'}`}
                >
                    Tarjeta Digital
                </button>
            </div>

            {activeTab === 'INFO' ? (
                <div className="space-y-4">
                    
                    {/* LIVE / UPCOMING CONTEXT BLOCK */}
                    {liveStream ? (
                        <div className="bg-red-50 border border-red-100 rounded-lg p-4 flex items-center justify-between animate-pulse">
                            <div>
                                <p className="text-dm-crimson text-xs font-bold uppercase tracking-widest">En Vivo Ahora</p>
                                <p className="text-dm-dark font-serif text-xl">HOY · {liveStream.scheduledTime} hs</p>
                            </div>
                            <Button size="sm" onClick={() => window.open(liveStream.url, '_blank')}>Ver</Button>
                        </div>
                    ) : upcomingStream ? (
                         <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest flex items-center gap-1"><Clock size={12}/> Próximo Vivo</p>
                            <p className="text-dm-dark font-serif text-xl">
                                {new Date(upcomingStream.fullDateISO).getDate()} {new Date(upcomingStream.fullDateISO).toLocaleDateString('es-ES', {month: 'short'}).toUpperCase()} · {upcomingStream.scheduledTime} hs
                            </p>
                        </div>
                    ) : null}

                    {/* LINKS REALES */}
                    <div className="space-y-3 mt-4">
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

                        <div className="grid grid-cols-3 gap-2">
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
                                disabled={!hasMap}
                            >
                                <MapPin size={14} className="mr-1.5" /> Mapa
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center pt-2">
                    {!canClientInteract ? (
                        <div className="text-center p-8 bg-gray-50 rounded-lg">
                            <AlertOctagon size={32} className="mx-auto text-orange-400 mb-2" />
                            <p className="text-sm text-dm-dark font-bold">Solo clientes pueden ver la tarjeta</p>
                            <p className="text-xs text-gray-500 mt-1">Inicia sesion con un perfil cliente.</p>
                        </div>
                    ) : canDownloadCard ? (
                        <>
                            <div className="scale-75 origin-top -mb-28 shadow-xl">
                                <ShareableCard 
                                    shop={shop} 
                                    stream={priorityStream} 
                                    mode="CLIENT" // Client mode = Contact Info & Real Links
                                    onNotify={onNotify}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="text-center p-8 bg-gray-50 rounded-lg">
                            <AlertOctagon size={32} className="mx-auto text-orange-400 mb-2" />
                            <p className="text-sm text-dm-dark font-bold">Tarjeta no disponible</p>
                            <p className="text-xs text-gray-500 mt-1">La tienda no ha completado sus datos obligatorios.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
