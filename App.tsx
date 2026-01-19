import React, { useState, useEffect, useMemo, useRef, useDeferredValue } from "react";
import { useLocation, useNavigate } from "react-router-dom";
// Verifica la ruta de 'types' si cambias estructura.
// Check the 'types' import path if the structure changes.
import {
  ViewMode,
  Shop,
  Stream,
  StreamStatus,
  UserContext,
  Reel,
  NotificationItem,
} from "./types";
import { Button } from "./components/Button";
import { NoticeModal } from "./components/NoticeModal";
import { ReportModal } from "./components/ReportModal";
import { AuthModal } from "./components/layout/AuthModal";
import { ShopCard } from "./components/ShopCard";
import { ResetView } from "./components/layout/ResetView";
import { RoleRouter } from "./components/RoleRouter";
import { api } from "./services/api";
import {
  MOCK_STREAM_COUNT,
  buildMockStreams,
} from "./services/mockData";
import {
  buildAdminViewProps,
  buildMerchantViewProps,
  buildClientViewProps,
} from "./roleViewProps";
import { useAppData } from "./hooks/useAppData";
import { useRoleRouteSync } from "./hooks/useRoleRouteSync";
import { useAuthState, type AuthProfile } from "./hooks/useAuthState";
import {
  AdminTab,
  MerchantTab,
} from "./navigation";
import { useRoleNavigation } from "./hooks/useRoleNavigation";
import { useClientActions } from "./hooks/useClientActions";
import { useLoginFlow } from "./hooks/useLoginFlow";


// Estado de tienda seguro para evitar crashes.
// Safe shop fallback to avoid crashes.
const EMPTY_SHOP: Shop = {
  id: "empty",
  name: "Sin Tienda Seleccionada",
  plan: "Estandar",
  baseQuota: 0,
  extraQuota: 0,
  quotaUsed: 0,
  reelsExtraQuota: 0,
  logoUrl: "https://via.placeholder.com/150",
  whatsappLines: [],
  socialHandles: {},
  dataIntegrity: "MINIMAL",
  isPenalized: false,
  penalties: [],
  reviews: [],
  ratingAverage: 0,
  // Campos opcionales nuevos / Optional fields
  paymentMethods: [],
  minimumPurchase: 0,
};

const BRAND_LOGO = new URL("./img/logo.svg", import.meta.url).href;

// App orquesta estado, rutas y layout global.
// App orchestrates state, routing, and global layout.
const App: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>("CLIENT");
  const [adminPreview, setAdminPreview] = useState<{
    mode: ViewMode;
    shopId?: string;
  } | null>(null);
  const [activeBottomNav, setActiveBottomNav] = useState("home");
  const [adminTab, setAdminTab] = useState<AdminTab>("DASHBOARD");
  const [merchantTab, setMerchantTab] = useState<MerchantTab>("RESUMEN");
  const [isDesktopMenuOpen, setIsDesktopMenuOpen] = useState(false);
  const [authProfile, setAuthProfile] = useState<AuthProfile | null>(null);
  const isResetView =
    location.pathname.startsWith("/reset") ||
    new URLSearchParams(location.search).get("mode") === "resetPassword";

  // Estado de usuario simulado / Simulated user state
  const [currentShopId, setCurrentShopId] = useState<string>("");
  const [user, setUser] = useState<UserContext>({
    id: `anon-${Date.now()}`,
    isLoggedIn: false,
    favorites: [],
    reminders: [],
    history: [],
    viewedReels: [],
    likes: [],
    reports: [],
    preferences: { theme: "light", notifications: false },
  });
  const [loginPromptDismissed, setLoginPromptDismissed] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [hasBottomNavInteraction, setHasBottomNavInteraction] = useState(false);

  const {
    allShops,
    setAllShops,
    allStreams,
    setAllStreams,
    activeReels,
    isLoading,
    refreshData,
  } = useAppData({
    isResetView,
    currentShopId,
    setCurrentShopId,
  });

  // Estados de UI / UI state
  const [selectedShopForModal, setSelectedShopForModal] = useState<Shop | null>(
    null
  );
  const [activeShopCardId, setActiveShopCardId] = useState<string | null>(null);
  const [shopModalTab, setShopModalTab] = useState<"INFO" | "CARD">("INFO");
  const [selectedReel, setSelectedReel] = useState<Reel | null>(null);
  const [reportTarget, setReportTarget] = useState<Stream | null>(null);
  const [activeFilter, setActiveFilter] = useState("Todos");
  const [savedTab, setSavedTab] = useState<"FAVORITES" | "REMINDERS">(
    "FAVORITES"
  );
  const [notice, setNotice] = useState<{
    title: string;
    message: string;
    tone?: "info" | "success" | "warning" | "error";
  } | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const postLoginRedirect = useRef<string | null>(null);
  const [isLiveQueueOpen, setIsLiveQueueOpen] = useState(false);
  const [shopQuery, setShopQuery] = useState("");
  const [calendarPromptStream, setCalendarPromptStream] =
    useState<Stream | null>(null);
  const effectiveViewMode = adminPreview?.mode ?? viewMode;
  const effectiveUserType = adminPreview
    ? adminPreview.mode === "MERCHANT"
      ? "SHOP"
      : adminPreview.mode === "CLIENT"
      ? "CLIENT"
      : authProfile?.userType
    : authProfile?.userType;
  const isClientSession = user.isLoggedIn || adminPreview?.mode === "CLIENT";
  const canClientInteract = isClientSession && effectiveUserType === "CLIENT";
  const isAdminOverride =
    authProfile?.userType === "ADMIN" && adminPreview?.mode === "MERCHANT";
  const notify = (
    title: string,
    message: string,
    tone?: "info" | "success" | "warning" | "error"
  ) => {
    setNotice({ title, message, tone });
  };
  const {
    loginStep,
    clientEmailMode,
    loginError,
    loginBusy,
    resetBusy,
    resetViewStatus,
    resetViewEmail,
    resetViewPassword,
    resetViewConfirm,
    resetViewError,
    resetViewBusy,
    setLoginMode,
    setLoginStep,
    setClientEmailMode,
    setLoginError,
    setLoginAudience,
    setResetViewPassword,
    setResetViewConfirm,
    openLoginModal,
    openAudienceSelection,
    handleGoogleLogin,
    handleEmailLogin,
    handleEmailRegister,
    handlePasswordReset,
    handleResetViewSubmit,
    handleContinueAsGuest,
    handleToggleClientLogin,
  } = useLoginFlow({
    isResetView,
    userIsLoggedIn: user.isLoggedIn,
    setNotice,
    setLoginPromptDismissed,
    setShowLoginPrompt,
    postLoginRedirect,
  });
  const navigateTo = (path: string, replace = false) => {
    if (location.pathname !== path) {
      navigate(path, { replace });
    }
  };
  const isAdminRoute = (path: string) =>
    path === "/admin" || path.startsWith("/admin/");
  const isShopRoute = (path: string) =>
    path === "/tienda" || path.startsWith("/tienda/");
  const getIdFromPath = (path: string, prefix: string) => {
    if (!path.startsWith(prefix)) return null;
    const rest = path.slice(prefix.length);
    const id = rest.split("/").filter(Boolean)[0];
    return id || null;
  };
  const getShopIdFromPath = (path: string) => getIdFromPath(path, "/tiendas/");
  const getStreamIdFromPath = (path: string) =>
    getIdFromPath(path, "/en-vivo/");
  const pushHistory = (label: string) => {
    setUser((prev) => {
      if (!prev.isLoggedIn) return prev;
      const next = [
        { label, at: new Date().toISOString() },
        ...prev.history,
      ].slice(0, 10);
      return { ...prev, history: next };
    });
  };
  const requireLogin = () => {
    setViewMode("CLIENT");
    postLoginRedirect.current = null;
    openLoginModal();
  };
  const requireClient = () => {
    if (!isClientSession) {
      requireLogin();
      return false;
    }
    if (effectiveUserType && effectiveUserType !== "CLIENT") {
      setNotice({
        title: "Solo clientes",
        message: "Esta acción está disponible solo para cuentas cliente.",
        tone: "warning",
      });
      return false;
    }
    return true;
  };
  const requireClientForRoute = (redirectPath?: string) => {
    if (!isClientSession) {
      if (redirectPath) {
        postLoginRedirect.current = redirectPath;
      }
      setViewMode("CLIENT");
      openLoginModal();
      return false;
    }
    if (effectiveUserType && effectiveUserType !== "CLIENT") {
      setNotice({
        title: "Solo clientes",
        message: "Esta accion esta disponible solo para cuentas cliente.",
        tone: "warning",
      });
      return false;
    }
    return true;
  };

  const refreshNotifications = async (profile?: AuthProfile | null) => {
    if (!profile?.authUserId) return;
    const data = await api.fetchNotifications(profile.authUserId);
    setNotifications(Array.isArray(data) ? data : []);
  };

  // --- Estados derivados con proteccion anti-crash ---
  // If shop list is empty, fallback to EMPTY_SHOP.
  const currentShop =
    allShops.find((s) => s.id === currentShopId) || allShops[0] || EMPTY_SHOP;
  const previewShop = adminPreview?.shopId
    ? allShops.find((shop) => shop.id === adminPreview.shopId)
    : null;
  const reminderStreams = allStreams
    .filter((stream) => user.reminders.includes(stream.id))
    .sort(
      (a, b) =>
        new Date(a.fullDateISO).getTime() - new Date(b.fullDateISO).getTime()
    );
  const unreadNotifications = notifications.filter((note) => !note.read);

  // --- Carga de datos y auto-update / Data loading & auto-update ---
  useAuthState({
    isResetView,
    setUser,
    setAuthProfile,
    setAdminPreview,
    setViewMode,
    setActiveBottomNav,
    setCurrentShopId,
    setNotifications,
    setLoginPromptDismissed,
    setShowLoginPrompt,
    setHasBottomNavInteraction,
    postLoginRedirect,
    isAdminRoute,
    isShopRoute,
    navigateTo,
    refreshNotifications,
  });

  useEffect(() => {
    if (isResetView) return;
    if (effectiveViewMode !== "CLIENT" || user.isLoggedIn) {
      setShowLoginPrompt(false);
      return;
    }
    if (loginPromptDismissed || hasBottomNavInteraction) return;
    const timer = setTimeout(() => {
      setLoginStep("ENTRY");
      setShowLoginPrompt(true);
    }, 10000);
    return () => clearTimeout(timer);
  }, [
    isResetView,
    effectiveViewMode,
    user.isLoggedIn,
    loginPromptDismissed,
    hasBottomNavInteraction,
  ]);

  

  useEffect(() => {
    if (isResetView || adminPreview) return;
    if (!authProfile?.userType) return;
    const path = location.pathname;
    if (authProfile.userType === "ADMIN") {
      if (!isAdminRoute(path)) {
        navigateTo("/admin", true);
      }
      return;
    }
    if (authProfile.userType === "SHOP") {
      if (!isShopRoute(path)) {
        navigateTo("/tienda", true);
      }
      return;
    }
    if (authProfile.userType === "CLIENT") {
      if (isAdminRoute(path) || isShopRoute(path)) {
        navigateTo("/", true);
      }
    }
  }, [adminPreview, authProfile, isResetView, location.pathname]);

  // --- Ciclo automatico se maneja en backend ---
  // Auto lifecycle handled by backend.

  // --- Acciones de negocio / Business actions ---

  const handleStreamCreate = async (newStream: Stream) => {
    if (blockPreviewAction()) return false;
    try {
      const result = await api.createStream({
        ...newStream,
        isAdminOverride,
      });
      if (!result.success) {
        setNotice({
          title: "No se pudo agendar",
          message: result.message,
          tone: "error",
        });
        return false;
      }
      await refreshData();
      return true;
    } catch (error) {
      console.error("Error creando vivo:", error);
      setNotice({
        title: "Error al agendar",
        message: "No se pudo agendar el vivo. Intenta de nuevo.",
        tone: "error",
      });
      return false;
    }
  };

  const handleStreamUpdate = async (updatedStream: Stream) => {
    if (blockPreviewAction()) return false;
    try {
      await api.updateStream({
        ...updatedStream,
        isAdminOverride,
      });
      await refreshData();
      return true;
    } catch (error) {
      console.error("Error actualizando vivo:", error);
      setNotice({
        title: "Error al actualizar",
        message: "No se pudo actualizar el vivo. Intenta de nuevo.",
        tone: "error",
      });
      return false;
    }
  };

  const handleStreamDelete = async (streamId: string) => {
    if (blockPreviewAction()) return;
    try {
      await api.cancelStream(streamId, "Cancelado por tienda");
      await refreshData();
    } catch (error) {
      console.error("Error cancelando vivo:", error);
      setNotice({
        title: "No se pudo cancelar",
        message: "No se pudo cancelar el vivo.",
        tone: "error",
      });
    }
  };

  const handleShopUpdate = async (updatedShop: Shop) => {
    if (blockPreviewAction()) return false;
    try {
      await api.updateShop(updatedShop.id, updatedShop); // Ajustado para id y data / Adjusted for id and data
      await refreshData();
      return true;
    } catch (error) {
      console.error("Error actualizando tienda:", error);
      setNotice({
        title: "No se pudo guardar",
        message: "No se pudo guardar la tienda. Intenta de nuevo.",
        tone: "error",
      });
      return false;
    }
  };

  const handleExtendStream = async (streamId: string) => {
    if (blockPreviewAction()) return;
    const stream = allStreams.find((s) => s.id === streamId);
    if (stream && stream.extensionCount < 3) {
      await api.updateStream({
        ...stream,
        extensionCount: stream.extensionCount + 1,
      });
      refreshData();
      setNotice({
        title: "Vivo extendido",
        message: "Tienes 30 minutos adicionales.",
        tone: "success",
      });
    }
  };

  const handleBuyQuota = async (amount: number) => {
    if (blockPreviewAction()) return;
    if (!currentShopId) {
      setNotice({
        title: "Sin tienda",
        message: "No hay tienda seleccionada.",
        tone: "warning",
      });
      return;
    }
    try {
      const result = await api.buyQuota(currentShopId, amount);
      if (result?.purchase?.status === "PENDING") {
        setNotice({
          title: "Solicitud enviada",
          message: "Tu compra quedó pendiente de aprobación.",
          tone: "info",
        });
      } else {
        setNotice({
          title: "Cupos actualizados",
          message: "La compra fue aprobada.",
          tone: "success",
        });
      }
      refreshData();
    } catch (error) {
      console.error("Error comprando cupo:", error);
      setNotice({
        title: "Error de compra",
        message: "No se pudo comprar el cupo.",
        tone: "error",
      });
    }
  };

  const {
    handleReportStream,
    handleSubmitReport,
    handleToggleFavorite,
    handleToggleReminder,
    handleOpenCalendarInvite,
    handleMarkNotificationRead,
    handleMarkAllNotificationsRead,
    handleNotificationAction,
    handleLikeStream,
    handleRateStream,
    handleDownloadCard,
  } = useClientActions({
    user,
    setUser,
    allStreams,
    setAllStreams,
    allShops,
    authProfile,
    reportTarget,
    setReportTarget,
    setNotice,
    pushHistory,
    refreshData,
    refreshNotifications,
    setNotifications,
    setCalendarPromptStream,
    setShopModalTab,
    setSelectedShopForModal,
    setActiveBottomNav,
    setActiveFilter,
    navigateTo,
    requireClient,
  });

  const startAdminPreviewClient = () => {
    setAdminPreview({ mode: "CLIENT" });
    setViewMode("CLIENT");
    setActiveBottomNav("home");
    setLoginPromptDismissed(true);
    setShowLoginPrompt(false);
    navigateTo("/");
  };

  const startAdminPreviewShop = (shopId: string) => {
    setAdminPreview({ mode: "MERCHANT", shopId });
    setViewMode("MERCHANT");
    setCurrentShopId(shopId);
    setMerchantTab("RESUMEN");
    setActiveBottomNav("resumen");
    navigateTo("/tienda");
  };

  const stopAdminPreview = () => {
    setAdminPreview(null);
    setViewMode("ADMIN");
    setActiveBottomNav("panel");
    setAdminTab("DASHBOARD");
    navigateTo("/admin");
  };

  const blockPreviewAction = (
    message = "Acción bloqueada en modo vista técnica."
  ) => {
    if (!adminPreview || isAdminOverride) return false;
    setNotice({
      title: "Modo vista",
      message,
      tone: "warning",
    });
    return true;
  };

  const handleOpenShop = (shop: Shop, options?: { navigate?: boolean }) => {
    if (!requireClientForRoute(`/tiendas/${shop.id}`)) return;
    setShopModalTab("INFO");
    setSelectedShopForModal(shop);
    setActiveShopCardId(null);
    const shouldNavigate =
      options?.navigate ?? effectiveViewMode === "CLIENT";
    if (shouldNavigate) {
      navigateTo(`/tiendas/${shop.id}`);
    }
    if (isClientSession && effectiveUserType === "CLIENT") {
      pushHistory(`Visitaste: ${shop.name}`);
    }
  };

  const handleViewReel = (reel: Reel) => {
    const isMockReel = reel.id.startsWith("mock-");
    setSelectedReel(reel);
    if (isClientSession && effectiveUserType === "CLIENT") {
      if (!user.viewedReels.includes(reel.id)) {
        setUser((prev) => ({
          ...prev,
          viewedReels: [...prev.viewedReels, reel.id],
        }));
      }
      if (!isMockReel) {
        void api.registerReelView(reel.id);
      }
      pushHistory(`Viste historia de ${reel.shopName}`);
    }
  };

  const getFilteredStreams = (source: Stream[]) => {
    let filtered = source.filter((s) => s.isVisible);
    filtered = filtered.filter((s) => s.shop?.status === "ACTIVE");
    filtered = filtered.filter(
      (s) =>
        s.status !== StreamStatus.CANCELLED && s.status !== StreamStatus.BANNED
    );
    if (activeFilter === "En Vivo")
      filtered = filtered.filter((s) => s.status === StreamStatus.LIVE);
    if (activeFilter === "Próximos")
      filtered = filtered.filter((s) => s.status === StreamStatus.UPCOMING);
    if (activeFilter === "Finalizados")
      filtered = filtered.filter(
        (s) =>
          s.status === StreamStatus.FINISHED || s.status === StreamStatus.MISSED
      );

    if (activeFilter === "En Vivo") {
      filtered.sort((a, b) => {
        const weightA = planWeight(a.shop.plan);
        const weightB = planWeight(b.shop.plan);
        if (weightA !== weightB) return weightB - weightA;
        if (a.shop.ratingAverage !== b.shop.ratingAverage)
          return b.shop.ratingAverage - a.shop.ratingAverage;
        return (b.views || 0) - (a.views || 0);
      });
      return filtered;
    }

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

  const planWeight = (plan: string) => {
    if (plan === "Maxima Visibilidad") return 3;
    if (plan === "Alta Visibilidad") return 2;
    return 1;
  };

  const isPublicShop = (shop: Shop) => {
    if (!shop.status) return true;
    return shop.status === "ACTIVE";
  };

  const sortShopsByPriority = (shops: Shop[]) =>
    [...shops].sort((a, b) => {
      const weightA = planWeight(a.plan);
      const weightB = planWeight(b.plan);
      if (weightA !== weightB) return weightB - weightA;
      if (a.ratingAverage !== b.ratingAverage)
        return b.ratingAverage - a.ratingAverage;
      return a.name.localeCompare(b.name);
    });

  const publicShops = useMemo(
    () => sortShopsByPriority(allShops.filter(isPublicShop)),
    [allShops]
  );
  const featuredShops = useMemo(() => publicShops.slice(0, 60), [publicShops]);
  const favoriteShops = useMemo(
    () => sortShopsByPriority(allShops.filter((shop) => user.favorites.includes(shop.id))),
    [allShops, user.favorites]
  );
  const mockStreams = useMemo(
    () => buildMockStreams(publicShops, allStreams, MOCK_STREAM_COUNT),
    [publicShops, allStreams]
  );
  const streamSource = useMemo(
    () => [...allStreams, ...mockStreams],
    [allStreams, mockStreams]
  );
  const liveStreams = useMemo(
    () =>
      streamSource.filter(
        (s) =>
          s.status === StreamStatus.LIVE &&
          s.isVisible &&
          s.shop?.status === "ACTIVE"
      ),
    [streamSource]
  );
  const sortedLiveStreams = useMemo(() => {
    return [...liveStreams].sort((a, b) => {
      const weightA = planWeight(a.shop.plan);
      const weightB = planWeight(b.shop.plan);
      if (weightA !== weightB) return weightB - weightA;
      if (a.shop.ratingAverage !== b.shop.ratingAverage)
        return b.shop.ratingAverage - a.shop.ratingAverage;
      return (b.views || 0) - (a.views || 0);
    });
  }, [liveStreams]);
  const filteredStreams = useMemo(
    () => getFilteredStreams(streamSource),
    [streamSource, activeFilter]
  );
  const queueStreamsSource = streamSource;
  const deferredShopQuery = useDeferredValue(shopQuery);
  const normalizedShopQuery = useMemo(
    () => deferredShopQuery.trim().toLowerCase(),
    [deferredShopQuery]
  );
  const filterShopsByQuery = (shops: Shop[], query: string) => {
    if (!query) return shops;
    return shops.filter((shop) => {
      const address = shop.address || "";
      const city = shop.addressDetails?.city || "";
      const province = shop.addressDetails?.province || "";
      const razon = shop.razonSocial || "";
      return [shop.name, razon, address, city, province]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  };
  const filteredPublicShops = useMemo(
    () => filterShopsByQuery(publicShops, normalizedShopQuery),
    [publicShops, normalizedShopQuery]
  );
  const filteredFavoriteShops = useMemo(
    () => filterShopsByQuery(favoriteShops, normalizedShopQuery),
    [favoriteShops, normalizedShopQuery]
  );
  const toggleShopCard = (shopId: string) => {
    setActiveShopCardId((prev) => (prev === shopId ? null : shopId));
  };
  const handleShopCardKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
    shopId: string
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleShopCard(shopId);
    }
  };
  const renderShopCard = (shop: Shop) => (
    <ShopCard
      key={shop.id}
      shop={shop}
      isActive={activeShopCardId === shop.id}
      onToggleActive={toggleShopCard}
      onOpenShop={handleOpenShop}
      onKeyDown={handleShopCardKeyDown}
      canClientInteract={canClientInteract}
      onRequireLogin={requireLogin}
    />
  );

  useRoleRouteSync({
    isResetView,
    adminPreview,
    authUserType: authProfile?.userType ?? null,
    locationPath: location.pathname,
    allShops,
    allStreams,
    selectedShopId: selectedShopForModal?.id ?? null,
    isAdminRoute,
    isShopRoute,
    getShopIdFromPath,
    getStreamIdFromPath,
    requireClientForRoute,
    setAdminPreview,
    setViewMode,
    setActiveBottomNav,
    setAdminTab,
    setMerchantTab,
    setActiveFilter,
    setSavedTab,
    setShopModalTab,
    setSelectedShopForModal,
    navigateTo,
  });

  const isAdminUser = effectiveUserType === "ADMIN";
  const isMerchantUser = effectiveUserType === "SHOP";
  const canAccessAdminRoute = authProfile?.userType === "ADMIN";
  const canAccessShopRoute =
    authProfile?.userType === "SHOP" || adminPreview?.mode === "MERCHANT";
  const accountBadgeCount = unreadNotifications.length;
  const reminderBadgeCount = reminderStreams.length;
  const {
    handleClientNav,
    handleAdminNav,
    handleMerchantNav,
    syncAdminTab,
    syncMerchantTab,
    bottomNavItems,
  } = useRoleNavigation({
    userIsLoggedIn: user.isLoggedIn,
    isAdminUser,
    isMerchantUser,
    reminderBadgeCount,
    accountBadgeCount,
    setHasBottomNavInteraction,
    setShowLoginPrompt,
    setViewMode,
    postLoginRedirect,
    openLoginModal,
    setActiveBottomNav,
    setActiveFilter,
    setSavedTab,
    setAdminTab,
    setMerchantTab,
    navigateTo,
  });

  if (!isResetView && isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="fixed top-0 left-0 right-0 z-50 border-b border-gray-100 bg-white/95 px-6 py-3 shadow-sm">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <div className="h-4 w-24 rounded-full bg-gray-200 animate-pulse" />
            <div className="h-6 w-28 rounded-full bg-gray-200 animate-pulse" />
            <div className="h-4 w-20 rounded-full bg-gray-200 animate-pulse" />
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-6 pt-24">
          <div className="space-y-4">
            <div className="h-8 w-48 rounded-full bg-gray-200 animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="h-56 rounded-2xl border border-gray-100 bg-gray-50 animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isShopUser = authProfile?.userType === "SHOP";
  const isAdminViewBlocked =
    effectiveViewMode === "ADMIN" && authProfile?.userType !== "ADMIN";
  const isMerchantViewBlocked =
    effectiveViewMode === "MERCHANT" &&
    authProfile?.userType !== "SHOP" &&
    !adminPreview;

  if (isAdminViewBlocked || isMerchantViewBlocked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center">
        <h2 className="font-serif text-3xl text-dm-dark">Acceso restringido</h2>
        <p className="mt-2 text-sm text-gray-500">
          Tu cuenta no tiene permisos para ver este panel.
        </p>
        <button
          onClick={() => {
            setViewMode("CLIENT");
            setActiveBottomNav("home");
          }}
          className="mt-5 rounded-full bg-dm-crimson px-5 py-2 text-xs font-bold text-white shadow-sm"
        >
          Volver a inicio
        </button>
      </div>
    );
  }

  const isClientShopRoute = location.pathname.startsWith("/tiendas");

  if (isResetView) {
    return (
      <ResetView
        status={resetViewStatus}
        email={resetViewEmail}
        password={resetViewPassword}
        confirm={resetViewConfirm}
        error={resetViewError}
        busy={resetViewBusy}
        onClose={() => window.location.assign("/")}
        onPasswordChange={setResetViewPassword}
        onConfirmChange={setResetViewConfirm}
        onSubmit={handleResetViewSubmit}
      />
    );
  }

  const adminUserName = user.isLoggedIn ? user.name || "Admin" : "Admin";
  const merchantUserName = currentShop?.name || user.name || "Tienda";
  const clientUserName = user.isLoggedIn ? user.name || "Cliente" : "Invitado";
  const adminPreviewMode =
    adminPreview?.mode === "MERCHANT"
      ? "MERCHANT"
      : adminPreview?.mode === "CLIENT"
      ? "CLIENT"
      : null;
  const clientAuthModal = (
    <AuthModal
      isOpen={effectiveViewMode === "CLIENT" && !user.isLoggedIn && showLoginPrompt}
      loginStep={loginStep}
      clientEmailMode={clientEmailMode}
      loginError={loginError}
      loginBusy={loginBusy}
      resetBusy={resetBusy}
      onClose={handleContinueAsGuest}
      onContinueAsGuest={handleContinueAsGuest}
      onOpenAudienceSelection={openAudienceSelection}
      onEmailLogin={handleEmailLogin}
      onEmailRegister={handleEmailRegister}
      onGoogleLogin={handleGoogleLogin}
      onPasswordReset={handlePasswordReset}
      onSetLoginStep={setLoginStep}
      onSetLoginMode={setLoginMode}
      onSetLoginAudience={setLoginAudience}
      onSetClientEmailMode={setClientEmailMode}
      onSetLoginError={setLoginError}
    />
  );
  const adminViewProps = buildAdminViewProps({
    streams: allStreams,
    setStreams: setAllStreams,
    shops: allShops,
    setShops: setAllShops,
    onRefreshData: refreshData,
    activeTab: adminTab,
    onTabChange: syncAdminTab,
    onPreviewClient: startAdminPreviewClient,
    onPreviewShop: startAdminPreviewShop,
    onShopUpdate: handleShopUpdate,
  });
  const merchantViewProps = buildMerchantViewProps({
    currentShop,
    streams: allStreams,
    onStreamCreate: handleStreamCreate,
    onStreamUpdate: handleStreamUpdate,
    onStreamDelete: handleStreamDelete,
    onShopUpdate: handleShopUpdate,
    onExtendStream: handleExtendStream,
    onBuyQuota: handleBuyQuota,
    onReelChange: refreshData,
    onRefreshData: refreshData,
    activeTab: merchantTab,
    onTabChange: syncMerchantTab,
    notifications,
    onMarkNotificationRead: handleMarkNotificationRead,
    onMarkAllNotificationsRead: handleMarkAllNotificationsRead,
  });
  const clientViewProps = buildClientViewProps({
    activeBottomNav,
    activeFilter,
    savedTab,
    filteredStreams,
    sortedLiveStreams,
    activeReels,
    featuredShops,
    filteredPublicShops,
    filteredFavoriteShops,
    reminderStreams,
    notifications,
    selectedShopForModal,
    selectedReel,
    shopModalTab,
    user,
    canClientInteract,
    renderShopCard,
    onFilterChange: setActiveFilter,
    onSelectBottomNav: handleClientNav,
    onRefreshData: refreshData,
    onOpenShop: handleOpenShop,
    onViewReel: handleViewReel,
    onReport: handleReportStream,
    onToggleReminder: handleToggleReminder,
    onLike: handleLikeStream,
    onRate: handleRateStream,
    onDownloadCard: handleDownloadCard,
    onSetSavedTab: setSavedTab,
    onOpenShopModalTab: setShopModalTab,
    onCloseShopModal: () => {
      setSelectedShopForModal(null);
      if (location.pathname.startsWith("/tiendas/")) {
        navigateTo("/tiendas", true);
      }
      if (location.pathname.startsWith("/en-vivo/")) {
        navigateTo("/en-vivo", true);
      }
    },
    onCloseReel: () => setSelectedReel(null),
    onToggleFavorite: handleToggleFavorite,
    onRequireLogin: requireLogin,
    onOpenLogin: openAudienceSelection,
    onLogout: handleToggleClientLogin,
    onNotify: notify,
    onOpenCalendarInvite: handleOpenCalendarInvite,
    onQueueModalChange: setIsLiveQueueOpen,
    streams: allStreams,
    queueStreamsSource,
  });

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <RoleRouter
        brandLogo={BRAND_LOGO}
        bottomNavItems={bottomNavItems}
        activeBottomNav={activeBottomNav}
        isDesktopMenuOpen={isDesktopMenuOpen}
        onToggleDesktopMenu={() => setIsDesktopMenuOpen((prev) => !prev)}
        onCloseDesktopMenu={() => setIsDesktopMenuOpen(false)}
        isLoggedIn={user.isLoggedIn}
        onLogout={handleToggleClientLogin}
        adminUserName={adminUserName}
        merchantUserName={merchantUserName}
        clientUserName={clientUserName}
        canAccessAdminRoute={canAccessAdminRoute}
        canAccessShopRoute={canAccessShopRoute}
        adminViewProps={adminViewProps}
        merchantViewProps={merchantViewProps}
        clientViewProps={clientViewProps}
        showClientShopSearch={isClientShopRoute}
        shopQuery={shopQuery}
        onShopQueryChange={setShopQuery}
        onClearShopQuery={() => setShopQuery("")}
        clientAuthModal={clientAuthModal}
        adminPreviewMode={adminPreviewMode}
        previewShopName={previewShop?.name}
        onStopAdminPreview={stopAdminPreview}
        merchantIsPreview={Boolean(adminPreview && !isAdminOverride)}
        isAdminOverride={isAdminOverride}
        clientIsPreview={Boolean(adminPreview)}
        clientHideChrome={isLiveQueueOpen}
      />

      <NoticeModal
        isOpen={Boolean(notice)}
        title={notice?.title || ""}
        message={notice?.message || ""}
        tone={notice?.tone || "info"}
        onClose={() => setNotice(null)}
      />

      {reportTarget && (
        <ReportModal
          isOpen={Boolean(reportTarget)}
          streamTitle={reportTarget.title}
          onClose={() => setReportTarget(null)}
          onSubmit={handleSubmitReport}
        />
      )}

      {calendarPromptStream && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-xs rounded-2xl border border-gray-100 bg-white p-4 shadow-xl">
            <p className="text-sm font-bold text-dm-dark">
              ¿Agendamos en tu calendario?
            </p>
            <p className="mt-1 text-[11px] text-gray-500">
              {calendarPromptStream.title} ·{" "}
              {calendarPromptStream.shop?.name || "Tienda"}
            </p>
            <div className="mt-4 flex gap-2">
              <Button
                size="sm"
                className="flex-1"
                onClick={() => {
                  handleOpenCalendarInvite(calendarPromptStream);
                  setCalendarPromptStream(null);
                }}
              >
                Sí, agendar
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => setCalendarPromptStream(null)}
              >
                No, gracias
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;
