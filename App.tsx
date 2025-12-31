import React, { useState, useEffect } from 'react';
// Asegúrate de que la ruta a 'types' sea correcta (a veces es './types' o '../types')
import { ViewMode, Shop, Stream, StreamStatus, UserContext, Reel } from './types';
import { HeroSection } from './components/HeroSection';
import { StreamCard } from './components/StreamCard';
import { Dashboard } from './components/Dashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { ShopDetailModal } from './components/ShopDetailModal';
import { StoryModal } from './components/StoryModal';
import { api } from './services/api';
import { X, ChevronDown, User, UserCheck, AlertTriangle } from 'lucide-react';

// --- TIENDA DE SEGURIDAD (Para evitar crasheos cuando la DB está vacía) ---
const EMPTY_SHOP: Shop = {
  id: 'empty',
  name: 'Sin Tienda Seleccionada',
  plan: 'Estandar',
  baseQuota: 0,
  extraQuota: 0,
  quotaUsed: 0,
  reelsExtraQuota: 0,
  logoUrl: 'https://via.placeholder.com/150',
  whatsappLines: [],
  socialHandles: {},
  dataIntegrity: 'MINIMAL',
  isPenalized: false,
  penalties: [],
  reviews: [],
  ratingAverage: 0,
  // Campos opcionales nuevos
  paymentMethods: [],
  minimumPurchase: 0
};

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('CLIENT');
  const [isLoading, setIsLoading] = useState(true);

  // --- CENTRALIZED STATE ---
  const [allShops, setAllShops] = useState<Shop[]>([]);
  const [allStreams, setAllStreams] = useState<Stream[]>([]);
  const [activeReels, setActiveReels] = useState<Reel[]>([]);

  // User Simulation State
  const [currentShopId, setCurrentShopId] = useState<string>('');
  const [user, setUser] = useState<UserContext>({
      id: `anon-${Date.now()}`,
      isLoggedIn: false,
      favorites: [],
      reminders: [],
      history: [],
      viewedReels: [],
      reports: [],
      preferences: { theme: 'light', notifications: false }
  });

  // UI States
  const [isShopSelectorOpen, setIsShopSelectorOpen] = useState(false);
  const [selectedShopForModal, setSelectedShopForModal] = useState<Shop | null>(null);
  const [selectedReel, setSelectedReel] = useState<Reel | null>(null);
  const [activeFilter, setActiveFilter] = useState('Todos');

  // --- Derived States (CON PROTECCIÓN ANTI-CRASH) ---
  // Si no encuentra la tienda o la lista está vacía, usa la EMPTY_SHOP para no romper la pantalla.
  const currentShop = allShops.find(s => s.id === currentShopId) || allShops[0] || EMPTY_SHOP;

  // --- DATA LOADING & AUTO-UPDATE ---
  const refreshData = async () => {
      try {
        const [shops, streams, reels] = await Promise.all([
            api.fetchShops(), 
            api.fetchStreams(),
            api.fetchReels()
        ]);
        
        setAllShops(shops);
        setAllStreams(streams);
        setActiveReels(reels);
        
        // Initialize currentShopId only if empty and we have shops
        if (!currentShopId && shops.length > 0) {
            setCurrentShopId(shops[0].id);
        }
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setIsLoading(false);
      }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // --- AUTOMATIC TIME MANAGEMENT ---
  useEffect(() => {
    const checkStreamStatus = () => {
        const now = Date.now();
        const LIMIT_30_MIN = 30 * 60 * 1000;
        let needsUpdate = false;

        allStreams.forEach(stream => {
            const scheduledTime = new Date(stream.fullDateISO).getTime();

            // 1. AUTO-START LOGIC:
            if (stream.status === StreamStatus.UPCOMING && now >= scheduledTime) {
                api.updateStream({ ...stream, status: StreamStatus.LIVE, startedAt: scheduledTime });
                needsUpdate = true;
            }

            // 2. AUTO-FINISH LOGIC (30 Min base + extensions):
            if (stream.status === StreamStatus.LIVE && stream.startedAt) {
                const elapsed = now - stream.startedAt;
                const cappedExtensions = Math.min(stream.extensionCount || 0, 3);
                const limitMs = LIMIT_30_MIN * (1 + cappedExtensions);
                if (elapsed > limitMs) {
                    api.updateStream({ ...stream, status: StreamStatus.FINISHED });
                    needsUpdate = true;
                }
            }
        });
        if (needsUpdate) refreshData();
    };

    const interval = setInterval(checkStreamStatus, 10000);
    return () => clearInterval(interval);
  }, [allStreams]);

  // --- BUSINESS LOGIC ACTIONS ---

  const handleStreamCreate = async (newStream: Stream) => {
    try {
      const result = await api.createStream(newStream);
      if (!result.success) {
        alert(result.message);
        return false;
      }
      await refreshData();
      return true;
    } catch (error) {
      console.error('Error creando vivo:', error);
      alert('No se pudo agendar el vivo. Intenta de nuevo.');
      return false;
    }
  };

  const handleStreamUpdate = async (updatedStream: Stream) => {
    try {
      await api.updateStream(updatedStream);
      await refreshData();
      return true;
    } catch (error) {
      console.error('Error actualizando vivo:', error);
      alert('No se pudo actualizar el vivo. Intenta de nuevo.');
      return false;
    }
  };

  const handleStreamDelete = async (streamId: string) => {
    try {
      await api.cancelStream(streamId, 'Cancelado por tienda');
      await refreshData();
    } catch (error) {
      console.error('Error cancelando vivo:', error);
      alert('No se pudo cancelar el vivo.');
    }
  };

  const handleShopUpdate = async (updatedShop: Shop) => {
      try {
        await api.updateShop(updatedShop.id, updatedShop); // Ajustado para pasar ID y data
        await refreshData();
        return true;
      } catch (error) {
        console.error('Error actualizando tienda:', error);
        alert('No se pudo guardar la tienda. Intenta de nuevo.');
        return false;
      }
  };

  const handleExtendStream = async (streamId: string) => {
      const stream = allStreams.find(s => s.id === streamId);
      if (stream && stream.extensionCount < 3) {
          await api.updateStream({ 
              ...stream, 
              extensionCount: stream.extensionCount + 1 
          });
          refreshData();
          alert("¡Vivo extendido! Tienes 30 minutos adicionales.");
      }
  };

  const handleBuyQuota = async (amount: number) => {
      if (!currentShopId) return alert("No hay tienda seleccionada");
      try {
          await api.buyQuota(currentShopId, amount);
          refreshData();
      } catch (error) {
          console.error('Error comprando cupo:', error);
          alert('No se pudo comprar el cupo.');
      }
  };

  const handleReportStream = async (streamId: string) => {
      if (!user.isLoggedIn) {
          alert("Debes iniciar sesión para reportar un vivo.");
          return;
      }
      const stream = allStreams.find(s => s.id === streamId);
      if (!stream) return;

      const now = new Date();
      const h0 = new Date(stream.fullDateISO);
      const diffMinutes = (now.getTime() - h0.getTime()) / 60000;

      if (diffMinutes < 5) {
          alert("El vivo aún está en tiempo de tolerancia (5 min). Espera un momento.");
          return;
      }
      if (diffMinutes > 30) {
          alert("La ventana de reporte para este vivo ha finalizado.");
          return;
      }

      if (!window.confirm("IMPORTANTE: Por favor verifica en la App de la tienda si realmente NO están transmitiendo. ¿Confirmas que el vivo no se está realizando?")) {
          return;
      }

      const result = await api.reportStream(streamId, user.id);
      if (result.success) {
          setUser(prev => ({
              ...prev,
              reports: [...prev.reports, { streamId, timestamp: Date.now() }]
          }));
          alert(result.message);
          refreshData();
      } else {
          alert(result.message);
      }
  };

  const handleToggleFavorite = (shopId: string) => {
      if (user.favorites.includes(shopId)) {
          setUser(prev => ({ ...prev, favorites: prev.favorites.filter(id => id !== shopId) }));
          if (!user.isLoggedIn) alert("Tienda eliminada de favoritos locales.");
      } else {
          setUser(prev => ({ ...prev, favorites: [...prev.favorites, shopId] }));
          if (!user.isLoggedIn) alert("Tienda guardada en favoritos locales (Modo Anónimo). Inicia sesión para guardarlo en la nube.");
          else alert("¡Siguiendo tienda!");
      }
  };

  const handleToggleReminder = (streamId: string) => {
      if (user.reminders.includes(streamId)) {
          setUser(prev => ({ ...prev, reminders: prev.reminders.filter(id => id !== streamId) }));
      } else {
          setUser(prev => ({ ...prev, reminders: [...prev.reminders, streamId] }));
      }
  };

  const handleLikeStream = (streamId: string) => {
      const s = allStreams.find(s => s.id === streamId);
      if(s) {
          // Ideally call API
          s.likes += 1;
          setAllStreams([...allStreams]);
      }
  };

  const handleRateStream = (streamId: string, rating: number) => {
      alert(`¡Gracias por calificar con ${rating} estrellas!`);
  };

  const handleDownloadCard = (stream: Stream) => {
      setSelectedShopForModal(stream.shop);
  };

  const handleViewReel = (reel: Reel) => {
      setSelectedReel(reel);
      if (!user.viewedReels.includes(reel.id)) {
          setUser(prev => ({ ...prev, viewedReels: [...prev.viewedReels, reel.id] }));
      }
  };

  const getFilteredStreams = () => {
      let filtered = allStreams.filter(s => s.isVisible);
      filtered = filtered.filter(s => s.shop?.status === 'ACTIVE');
      filtered = filtered.filter(s => s.status !== StreamStatus.CANCELLED && s.status !== StreamStatus.BANNED);
      if (activeFilter === 'En Vivo') filtered = filtered.filter(s => s.status === StreamStatus.LIVE);
      if (activeFilter === 'Próximos') filtered = filtered.filter(s => s.status === StreamStatus.UPCOMING);
      if (activeFilter === 'Finalizados') filtered = filtered.filter(s => s.status === StreamStatus.FINISHED || s.status === StreamStatus.MISSED);
      
      filtered.sort((a, b) => {
          const getPriority = (status: StreamStatus) => {
              if (status === StreamStatus.LIVE) return 1;
              if (status === StreamStatus.UPCOMING) return 2;
              return 3; 
          };
          const pA = getPriority(a.status);
          const pB = getPriority(b.status);
          if (pA !== pB) return pA - pB;
          const dateA = new Date(a.fullDateISO).getTime();
          const dateB = new Date(b.fullDateISO).getTime();
          if (a.status === StreamStatus.UPCOMING) {
              return dateA - dateB;
          }
          return dateB - dateA;
      });
      return filtered;
  };

  const liveStreams = allStreams.filter(s => s.status === StreamStatus.LIVE && s.isVisible && s.shop?.status === 'ACTIVE');
  const sortedLiveStreams = [...liveStreams].sort((a, b) => {
      const planWeight = (plan: string) => {
          if (plan === 'Maxima Visibilidad') return 3;
          if (plan === 'Alta Visibilidad') return 2;
          return 1;
      };
      const weightA = planWeight(a.shop.plan);
      const weightB = planWeight(b.shop.plan);
      if (weightA !== weightB) return weightB - weightA;
      if (a.shop.ratingAverage !== b.shop.ratingAverage) return b.shop.ratingAverage - a.shop.ratingAverage;
      return (b.views || 0) - (a.views || 0);
  });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center font-bold text-dm-dark">Cargando Sistema Avellaneda...</div>;

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-6 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
            <img 
              src="https://www.distritomoda.com.ar/sites/all/themes/omega_btob/images/logo.svg" 
              alt="Distrito Moda" 
              className="h-8 w-auto object-contain" 
            />
        </div>
        
        <div className="flex items-center gap-4">
            {viewMode === 'MERCHANT' && (
                <div className="relative">
                   <button 
                        onClick={() => setIsShopSelectorOpen(!isShopSelectorOpen)}
                        className={`flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-md text-sm font-bold text-dm-dark hover:bg-gray-200 transition-colors ${isShopSelectorOpen ? 'bg-gray-200 ring-2 ring-gray-200' : ''}`}
                    >
                       Simulando: {currentShop.name} ({currentShop.plan}) <ChevronDown size={14} className={`transition-transform duration-200 ${isShopSelectorOpen ? 'rotate-180' : ''}`}/>
                    </button>
                    
                    {isShopSelectorOpen && (
                        <>
                            <div className="fixed inset-0 z-10 cursor-default" onClick={() => setIsShopSelectorOpen(false)} />
                            <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-100 shadow-xl rounded-lg overflow-hidden animate-in fade-in slide-in-from-top-2 z-20">
                                <div className="max-h-[300px] overflow-y-auto">
                                    {allShops.length === 0 && <div className="p-4 text-xs text-center text-gray-500">No hay tiendas creadas. Ve al Panel Admin.</div>}
                                    {allShops.map(shop => (
                                        <button 
                                            key={shop.id}
                                            onClick={() => {
                                                setCurrentShopId(shop.id);
                                                setIsShopSelectorOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 flex justify-between items-center border-b border-gray-50 last:border-0 transition-colors ${currentShopId === shop.id ? 'bg-gray-50 text-dm-crimson font-bold' : 'text-dm-dark'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-6 h-6 rounded-full bg-gray-100 overflow-hidden border border-gray-200 shrink-0">
                                                    {shop.logoUrl ? <img src={shop.logoUrl} alt="" className="w-full h-full object-cover"/> : <div className="w-full h-full bg-gray-200"></div>}
                                                </div>
                                                <span>{shop.name}</span>
                                            </div>
                                            <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded ${shop.plan === 'Estandar' ? 'bg-gray-100 text-gray-500' : 'bg-dm-crimson/10 text-dm-crimson font-bold'}`}>{shop.plan}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {viewMode === 'CLIENT' && (
                 <button 
                    onClick={() => setUser(prev => ({...prev, isLoggedIn: !prev.isLoggedIn}))}
                    className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-colors ${user.isLoggedIn ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}
                 >
                    {user.isLoggedIn ? <UserCheck size={14} /> : <User size={14} />}
                    {user.isLoggedIn ? `Cliente: ${user.name || 'Logueado'}` : 'Cliente Anónimo'}
                 </button>
            )}

            <div className="flex items-center gap-2 bg-gray-100 rounded-full p-1">
            <button onClick={() => setViewMode('CLIENT')} className={`px-4 py-1 rounded-full text-xs font-bold font-sans transition-all ${viewMode === 'CLIENT' ? 'bg-dm-dark text-white shadow' : 'text-gray-500 hover:text-dm-dark'}`}>CLIENTE</button>
            <button onClick={() => setViewMode('MERCHANT')} className={`px-4 py-1 rounded-full text-xs font-bold font-sans transition-all ${viewMode === 'MERCHANT' ? 'bg-dm-dark text-white shadow' : 'text-gray-500 hover:text-dm-dark'}`}>TIENDA</button>
            <button onClick={() => setViewMode('ADMIN')} className={`px-4 py-1 rounded-full text-xs font-bold font-sans transition-all ${viewMode === 'ADMIN' ? 'bg-dm-dark text-white shadow' : 'text-gray-500 hover:text-dm-dark'}`}>ADMIN</button>
            </div>
        </div>
      </nav>

      <div className="pt-16">
        {viewMode === 'CLIENT' ? (
          <>
            <HeroSection 
                activeFilter={activeFilter} 
                onFilterChange={setActiveFilter} 
                liveStreams={sortedLiveStreams}
                activeReels={activeReels}
                onViewReel={handleViewReel}
                viewedReels={user.viewedReels}
            />
            
            <main className="max-w-7xl mx-auto px-4 py-12">
               <div className="flex items-center justify-between mb-8">
                  <h2 className="font-serif text-3xl text-dm-dark">Agenda de Vivos</h2>
                  <div className="text-sm font-sans text-gray-500">
                      Mostrando: <span className="font-bold text-dm-crimson">{activeFilter}</span>
                  </div>
               </div>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                 {getFilteredStreams().map(stream => (
                   <StreamCard 
                        key={stream.id} 
                        stream={stream} 
                        user={user}
                        onOpenShop={() => setSelectedShopForModal(stream.shop)}
                        onReport={handleReportStream}
                        onToggleReminder={handleToggleReminder}
                        onLike={handleLikeStream}
                        onRate={handleRateStream}
                        onDownloadCard={handleDownloadCard}
                    />
                 ))}
                 {getFilteredStreams().length === 0 && (
                     <div className="col-span-full text-center py-12 text-gray-400 font-sans">
                         No hay vivos que coincidan con este filtro.
                     </div>
                 )}
               </div>
            </main>

            {selectedShopForModal && (
                <ShopDetailModal 
                    shop={selectedShopForModal} 
                    shopStreams={allStreams.filter(s => s.shop.id === selectedShopForModal.id)}
                    user={user}
                    onClose={() => setSelectedShopForModal(null)} 
                    onToggleFavorite={handleToggleFavorite}
                 />
            )}

            {selectedReel && (
                <StoryModal reel={selectedReel} onClose={() => setSelectedReel(null)} />
            )}
          </>
        ) : viewMode === 'MERCHANT' ? (
          <Dashboard 
            currentShop={currentShop} 
            streams={allStreams} 
            onStreamCreate={handleStreamCreate}
            onStreamUpdate={handleStreamUpdate}
            onStreamDelete={handleStreamDelete}
            onShopUpdate={handleShopUpdate}
            onExtendStream={handleExtendStream}
            onBuyQuota={handleBuyQuota}
            onReelChange={refreshData}
          />
        ) : (
          <AdminDashboard 
            streams={allStreams} 
            setStreams={setAllStreams}
            shops={allShops}
            setShops={setAllShops}
            onRefreshData={refreshData}
          />
        )}
      </div>
    </div>
  );
};

export default App;

