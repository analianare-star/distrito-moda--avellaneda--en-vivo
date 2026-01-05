import React, { useState, useEffect } from 'react';
// AsegÃºrate de que la ruta a 'types' sea correcta (a veces es './types' o '../types')
import { ViewMode, Shop, Stream, StreamStatus, UserContext, Reel } from './types';
import { HeroSection } from './components/HeroSection';
import { StreamCard } from './components/StreamCard';
import { Dashboard } from './components/Dashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { ShopDetailModal } from './components/ShopDetailModal';
import { StoryModal } from './components/StoryModal';
import { api } from './services/api';
import { X, User, AlertTriangle, Home, Radio, Heart, Store, Shield, Receipt, ChevronDown } from 'lucide-react';
import { auth, googleProvider } from './firebase';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';

type AuthProfile = {
  userType: 'ADMIN' | 'SHOP' | 'CLIENT';
  shopId?: string;
  adminRole?: string;
};

// --- TIENDA DE SEGURIDAD (Para evitar crasheos cuando la DB estÃ¡ vacÃ­a) ---
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
  const [activeBottomNav, setActiveBottomNav] = useState('home');
  const [adminTab, setAdminTab] = useState<'DASHBOARD' | 'AGENDA' | 'STREAMS' | 'SHOPS' | 'REELS' | 'ADMIN'>('DASHBOARD');
  const [isDesktopMenuOpen, setIsDesktopMenuOpen] = useState(false);
  const [authProfile, setAuthProfile] = useState<AuthProfile | null>(null);

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
  const [loginPromptDismissed, setLoginPromptDismissed] = useState(false);

  // UI States
  const [selectedShopForModal, setSelectedShopForModal] = useState<Shop | null>(null);
  const [selectedReel, setSelectedReel] = useState<Reel | null>(null);
  const [activeFilter, setActiveFilter] = useState('Todos');
  const requireLogin = () => {
      setViewMode('CLIENT');
      setActiveBottomNav('account');
      setLoginPromptDismissed(false);
  };

  // --- Derived States (CON PROTECCIÃ“N ANTI-CRASH) ---
  // Si no encuentra la tienda o la lista estÃ¡ vacÃ­a, usa la EMPTY_SHOP para no romper la pantalla.
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        setUser(prev => ({
          ...prev,
          id: fbUser.uid,
          isLoggedIn: true,
          name: fbUser.displayName || prev.name || 'Cliente',
          email: fbUser.email || prev.email
        }));
        void (async () => {
          const profile = await api.fetchAuthMe();
          if (profile?.userType) {
            setAuthProfile(profile);
            if (profile.userType === 'ADMIN') {
              setViewMode('ADMIN');
              setActiveBottomNav('panel');
              setAdminTab('DASHBOARD');
            } else if (profile.userType === 'SHOP') {
              setViewMode('MERCHANT');
              setActiveBottomNav('home');
              if (profile.shopId) {
                setCurrentShopId(profile.shopId);
              }
            } else {
              setViewMode('CLIENT');
              setActiveBottomNav('home');
            }
          } else {
            setAuthProfile(null);
            setViewMode('CLIENT');
            setActiveBottomNav('home');
          }
        })();
        setLoginPromptDismissed(true);
      } else {
        setUser(prev => ({
          ...prev,
          id: prev.isLoggedIn ? `anon-${Date.now()}` : prev.id,
          isLoggedIn: false
        }));
        setAuthProfile(null);
        setViewMode('CLIENT');
        setActiveBottomNav('home');
        setLoginPromptDismissed(false);
      }
    });

    return () => unsubscribe();
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
          alert("Â¡Vivo extendido! Tienes 30 minutos adicionales.");
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
          requireLogin();
          return;
      }
      const stream = allStreams.find(s => s.id === streamId);
      if (!stream) return;

      const now = new Date();
      const h0 = new Date(stream.fullDateISO);
      const diffMinutes = (now.getTime() - h0.getTime()) / 60000;

      if (diffMinutes < 5) {
          alert("El vivo aÃºn estÃ¡ en tiempo de tolerancia (5 min). Espera un momento.");
          return;
      }
      if (diffMinutes > 30) {
          alert("La ventana de reporte para este vivo ha finalizado.");
          return;
      }

      if (!window.confirm("IMPORTANTE: Por favor verifica en la App de la tienda si realmente NO estÃ¡n transmitiendo. Â¿Confirmas que el vivo no se estÃ¡ realizando?")) {
          return;
      }

      const result = await api.reportStream(streamId);
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
      if (!user.isLoggedIn) {
          requireLogin();
          return;
      }
      if (user.favorites.includes(shopId)) {
          setUser(prev => ({ ...prev, favorites: prev.favorites.filter(id => id !== shopId) }));
      } else {
          setUser(prev => ({ ...prev, favorites: [...prev.favorites, shopId] }));
          alert("Â¡Siguiendo tienda!");
      }
  };

  const handleToggleReminder = (streamId: string) => {
      if (!user.isLoggedIn) {
          requireLogin();
          return;
      }
      if (user.reminders.includes(streamId)) {
          setUser(prev => ({ ...prev, reminders: prev.reminders.filter(id => id !== streamId) }));
      } else {
          setUser(prev => ({ ...prev, reminders: [...prev.reminders, streamId] }));
      }
  };

  const handleLoginRequest = async () => {
      try {
          await signInWithPopup(auth, googleProvider);
      } catch (error) {
          console.error('Error iniciando sesion:', error);
          alert('No se pudo iniciar sesion con Google.');
      }
  };

  const handleContinueAsGuest = () => {
      setLoginPromptDismissed(true);
  };

  const handleToggleClientLogin = async () => {
      if (user.isLoggedIn) {
          try {
              await signOut(auth);
              setLoginPromptDismissed(false);
          } catch (error) {
              console.error('Error cerrando sesion:', error);
              alert('No se pudo cerrar sesion.');
          }
          return;
      }

      await handleLoginRequest();
  };

  const handleLikeStream = (streamId: string) => {
      if (!user.isLoggedIn) {
          requireLogin();
          return;
      }
      const s = allStreams.find(s => s.id === streamId);
      if(s) {
          // Ideally call API
          s.likes += 1;
          setAllStreams([...allStreams]);
      }
  };

  const handleRateStream = (streamId: string, rating: number) => {
      if (!user.isLoggedIn) {
          requireLogin();
          return;
      }
      alert(`Â¡Gracias por calificar con ${rating} estrellas!`);
  };

  const handleDownloadCard = (stream: Stream) => {
      if (!user.isLoggedIn) {
          requireLogin();
          return;
      }
      setSelectedShopForModal(stream.shop);
  };

  const handleOpenShop = (shop: Shop) => {
      if (!user.isLoggedIn) {
          requireLogin();
          return;
      }
      setSelectedShopForModal(shop);
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
      if (activeFilter === 'PrÃ³ximos') filtered = filtered.filter(s => s.status === StreamStatus.UPCOMING);
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

  const isAdminUser = authProfile?.userType === 'ADMIN';

  const handleClientNav = (id: string) => {
      setViewMode('CLIENT');
      setActiveBottomNav(id);
      if (id === 'home') setActiveFilter('Todos');
      if (id === 'live') setActiveFilter('En Vivo');
      if (id === 'account') {
          if (user.isLoggedIn) {
              void handleToggleClientLogin();
          } else {
              setLoginPromptDismissed(false);
          }
      }
  };

  const handleAdminNav = (id: string) => {
      setViewMode('ADMIN');
      setActiveBottomNav(id);
      const nextTab =
        id === 'shops' ? 'SHOPS' :
        id === 'streams' ? 'STREAMS' :
        id === 'purchases' ? 'ADMIN' :
        id === 'reports' ? 'STREAMS' :
        'DASHBOARD';
      setAdminTab(nextTab);
  };

  const bottomNavItems = isAdminUser
      ? [
          { id: 'shops', label: 'Tiendas', icon: Store, isCenter: false, onSelect: () => handleAdminNav('shops') },
          { id: 'streams', label: 'Vivos', icon: Radio, isCenter: false, onSelect: () => handleAdminNav('streams') },
          { id: 'panel', label: 'Panel', icon: Shield, isCenter: true, onSelect: () => handleAdminNav('panel') },
          { id: 'purchases', label: 'Compras', icon: Receipt, isCenter: false, onSelect: () => handleAdminNav('purchases') },
          { id: 'reports', label: 'Reportes', icon: AlertTriangle, isCenter: false, onSelect: () => handleAdminNav('reports') }
        ]
      : [
          { id: 'home', label: 'Inicio', icon: Home, isCenter: false, onSelect: () => handleClientNav('home') },
          { id: 'shops', label: 'Tiendas', icon: Store, isCenter: false, onSelect: () => handleClientNav('shops') },
          { id: 'live', label: 'En vivo', icon: Radio, isCenter: true, onSelect: () => handleClientNav('live') },
          { id: 'favorites', label: 'Favoritos', icon: Heart, isCenter: false, onSelect: () => handleClientNav('favorites') },
          { id: 'account', label: user.isLoggedIn ? 'Cuenta' : 'Ingresar', icon: User, isCenter: false, onSelect: () => handleClientNav('account') }
        ];

  return (
    <div className="min-h-screen bg-white">
            {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-6 py-3 shadow-sm">
        <div className="grid grid-cols-3 items-center">
          <div className="relative hidden md:flex items-center">
            <button
              onClick={() => setIsDesktopMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-[11px] font-bold text-gray-500 hover:text-dm-dark"
            >
              Menu
              <ChevronDown size={14} className={`transition-transform ${isDesktopMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {isDesktopMenuOpen && (
              <div className="absolute left-0 top-11 z-50 w-48 rounded-xl border border-gray-100 bg-white shadow-xl">
                <div className="py-2">
                  {bottomNavItems.map((item) => {
                    const isActive = activeBottomNav === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          item.onSelect();
                          setIsDesktopMenuOpen(false);
                        }}
                        className={`flex w-full items-center justify-between px-4 py-2 text-xs font-bold ${isActive ? 'text-dm-crimson' : 'text-gray-500'} hover:bg-gray-50`}
                      >
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-center">
            <img 
              src="https://www.distritomoda.com.ar/sites/all/themes/omega_btob/images/logo.svg" 
              alt="Distrito Moda" 
              className="h-8 w-auto object-contain" 
            />
          </div>
          <div className="flex flex-col items-end text-xs font-sans text-gray-500">
            <span>
              Hola: <span className="ml-1 font-semibold text-dm-dark">{user.isLoggedIn ? (user.name || 'Cliente') : 'Invitado'}</span>
            </span>
            {user.isLoggedIn && (
              <button
                onClick={handleToggleClientLogin}
                className="mt-0.5 text-[10px] font-semibold text-gray-400 underline underline-offset-2 hover:text-dm-crimson"
              >
                Salir
              </button>
            )}
          </div>
        </div>
      </nav>

      {viewMode === 'CLIENT' && !user.isLoggedIn && !loginPromptDismissed && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="w-[92%] max-w-sm rounded-2xl border border-gray-100 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-serif text-2xl text-dm-dark">Ingreso</p>
                <p className="mt-1 text-xs font-sans text-gray-500">
                  Accede a recordatorios, favoritos y reportes.
                </p>
              </div>
              <button
                onClick={handleContinueAsGuest}
                className="rounded-full border border-gray-200 p-1 text-gray-400 hover:text-gray-600"
                aria-label="Cerrar"
              >
                <X size={14} />
              </button>
            </div>
            <button
              onClick={handleLoginRequest}
              className="mt-5 w-full rounded-full bg-dm-crimson px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-dm-crimson/90"
            >
              Continuar con Google
            </button>
            <button
              onClick={handleContinueAsGuest}
              className="mt-2 w-full rounded-full border border-gray-200 px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50"
            >
              Continuar como visitante
            </button>
            <p className="mt-3 text-[11px] font-sans text-gray-400">
              Autenticacion con Google via Firebase.
            </p>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100 bg-white/95 backdrop-blur-sm md:hidden">
        <div className="mx-auto flex max-w-md items-end justify-between px-6 pb-3 pt-2">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeBottomNav === item.id;
            return (
              <button
                key={item.id}
                onClick={item.onSelect}
                className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${item.isCenter ? '-translate-y-3' : ''} ${isActive ? 'text-dm-crimson' : 'text-gray-400'}`}
              >
                <span className={`flex h-11 w-11 items-center justify-center rounded-full ${item.isCenter ? 'bg-dm-crimson text-white shadow-lg shadow-dm-crimson/30' : 'bg-white'}`}>
                  <Icon size={20} className={item.isCenter ? 'text-white' : (isActive ? 'text-dm-crimson' : 'text-gray-400')} />
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="pt-16 pb-24 md:pb-12">
        {viewMode === 'CLIENT' ? (
          <>
            <HeroSection 
                activeFilter={activeFilter} 
                onFilterChange={setActiveFilter} 
                liveStreams={sortedLiveStreams}
                activeReels={activeReels}
                  onViewReel={handleViewReel}
                  viewedReels={user.viewedReels}
                  onOpenShop={handleOpenShop}
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
                        onOpenShop={() => handleOpenShop(stream.shop)}
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
                    onRequireLogin={requireLogin}
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
            activeTab={adminTab}
            onTabChange={setAdminTab}
          />
        )}
      </div>
    </div>
  );
};

export default App;









