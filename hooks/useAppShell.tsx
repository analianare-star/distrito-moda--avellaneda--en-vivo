import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  NotificationItem,
  Reel,
  Shop,
  Stream,
  UserContext,
  ViewMode,
} from "../types";
import { api } from "../services/api";
import { AuthModal } from "../components/layout/AuthModal";
import { useMerchantActions } from "./useMerchantActions";
import { useClientSelectors } from "./useClientSelectors";
import { useClientViewActions } from "./useClientViewActions";
import { useAppData } from "./useAppData";
import { useRoleRouteSync } from "./useRoleRouteSync";
import { useAuthState, type AuthProfile } from "./useAuthState";
import { useNoticeState } from "./useNoticeState";
import { useClientGate } from "./useClientGate";
import { useAdminPreview } from "./useAdminPreview";
import { AdminTab, MerchantTab } from "../navigation";
import { useRoleNavigation } from "./useRoleNavigation";
import { useClientActions } from "./useClientActions";
import { useLoginFlow } from "./useLoginFlow";
import { useRoleViewProps } from "./useRoleViewProps";
import { useRoleAccess } from "./useRoleAccess";

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

const BRAND_LOGO = new URL("../img/logo.svg", import.meta.url).href;

type ResetViewProps = {
  status: string;
  email: string;
  password: string;
  confirm: string;
  error: string;
  busy: boolean;
  onClose: () => void;
  onPasswordChange: (value: string) => void;
  onConfirmChange: (value: string) => void;
  onSubmit: () => void;
};

type OverlaysProps = {
  notice: ReturnType<typeof useNoticeState>["notice"];
  onCloseNotice: () => void;
  reportTarget: Stream | null;
  onCloseReport: () => void;
  onSubmitReport: (reason: string) => void;
  calendarPromptStream: Stream | null;
  onCalendarAccept: (stream: Stream) => void;
  onCalendarClose: () => void;
};

export const useAppShell = () => {
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

  const { allShops, setAllShops, allStreams, setAllStreams, activeReels, isLoading, refreshData } =
    useAppData({
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
  const { notice, setNotice, notify, clearNotice } = useNoticeState();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const postLoginRedirect = useRef<string | null>(null);
  const [isLiveQueueOpen, setIsLiveQueueOpen] = useState(false);
  const [shopQuery, setShopQuery] = useState("");
  const [calendarPromptStream, setCalendarPromptStream] =
    useState<Stream | null>(null);
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
      const next = [{ label, at: new Date().toISOString() }, ...prev.history].slice(0, 10);
      return { ...prev, history: next };
    });
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
  const {
    effectiveViewMode,
    effectiveUserType,
    isClientSession,
    canClientInteract,
    isAdminOverride,
    isAdminUser,
    isMerchantUser,
    canAccessAdminRoute,
    canAccessShopRoute,
    adminUserName,
    merchantUserName,
    clientUserName,
    adminPreviewMode,
    isAdminViewBlocked,
    isMerchantViewBlocked,
  } = useRoleAccess({
    viewMode,
    adminPreview,
    authProfile,
    user,
    currentShop,
  });
  const { requireLogin, requireClient, requireClientForRoute } = useClientGate({
    isClientSession,
    effectiveUserType,
    setViewMode,
    openLoginModal,
    postLoginRedirect,
    setNotice,
  });
  const previewShop = adminPreview?.shopId
    ? allShops.find((shop) => shop.id === adminPreview.shopId)
    : null;
  const {
    featuredShops,
    sortedLiveStreams,
    filteredStreams,
    queueStreamsSource,
    filteredPublicShops,
    filteredFavoriteShops,
    reminderStreams,
  } = useClientSelectors({
    allShops,
    allStreams,
    user,
    activeFilter,
    shopQuery,
  });
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
    setLoginStep,
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

  const {
    startAdminPreviewClient,
    startAdminPreviewShop,
    stopAdminPreview,
    blockPreviewAction,
  } = useAdminPreview({
    adminPreview,
    isAdminOverride,
    setAdminPreview,
    setViewMode,
    setActiveBottomNav,
    setAdminTab,
    setMerchantTab,
    setCurrentShopId,
    setLoginPromptDismissed,
    setShowLoginPrompt,
    navigateTo,
    setNotice,
  });

  // --- Acciones de negocio / Business actions ---
  const {
    handleStreamCreate,
    handleStreamUpdate,
    handleStreamDelete,
    handleShopUpdate,
    handleExtendStream,
    handleBuyQuota,
  } = useMerchantActions({
    allStreams,
    currentShopId,
    isAdminOverride,
    blockPreviewAction,
    refreshData,
    setNotice,
  });
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
  const { handleOpenShop, handleViewReel, renderShopCard } = useClientViewActions({
    effectiveViewMode,
    effectiveUserType,
    isClientSession,
    user,
    activeShopCardId,
    setActiveShopCardId,
    setSelectedShopForModal,
    setShopModalTab,
    setSelectedReel,
    setUser,
    pushHistory,
    requireClientForRoute,
    requireLogin,
    navigateTo,
    canClientInteract,
  });

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

  const accountBadgeCount = unreadNotifications.length;
  const reminderBadgeCount = reminderStreams.length;
  const { handleClientNav, syncAdminTab, syncMerchantTab, bottomNavItems } =
    useRoleNavigation({
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
  const { adminViewProps, merchantViewProps, clientViewProps } = useRoleViewProps({
    streams: allStreams,
    setStreams: setAllStreams,
    shops: allShops,
    setShops: setAllShops,
    onRefreshData: refreshData,
    adminRole:
      authProfile?.adminRole === "MODERATOR"
        ? "MODERATOR"
        : authProfile?.userType === "ADMIN"
        ? "SUPERADMIN"
        : undefined,
    adminTab,
    onAdminTabChange: syncAdminTab,
    onPreviewClient: startAdminPreviewClient,
    onPreviewShop: startAdminPreviewShop,
    onShopUpdate: handleShopUpdate,
    currentShop,
    onStreamCreate: handleStreamCreate,
    onStreamUpdate: handleStreamUpdate,
    onStreamDelete: handleStreamDelete,
    onExtendStream: handleExtendStream,
    onBuyQuota: handleBuyQuota,
    onReelChange: refreshData,
    merchantTab,
    onMerchantTabChange: syncMerchantTab,
    notifications,
    onMarkNotificationRead: handleMarkNotificationRead,
    onMarkAllNotificationsRead: handleMarkAllNotificationsRead,
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
    selectedShopForModal,
    selectedReel,
    shopModalTab,
    user,
    canClientInteract,
    renderShopCard,
    onFilterChange: setActiveFilter,
    onSelectBottomNav: handleClientNav,
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
    onQueueModalChange: setIsLiveQueueOpen,
    onOpenCalendarInvite: handleOpenCalendarInvite,
    queueStreamsSource,
  });

  const isClientShopRoute = location.pathname.startsWith("/tiendas");
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

  const loadingFallback = (
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

  const roleRouterProps = {
    brandLogo: BRAND_LOGO,
    bottomNavItems,
    activeBottomNav,
    isDesktopMenuOpen,
    onToggleDesktopMenu: () => setIsDesktopMenuOpen((prev) => !prev),
    onCloseDesktopMenu: () => setIsDesktopMenuOpen(false),
    isLoggedIn: user.isLoggedIn,
    onLogout: handleToggleClientLogin,
    adminUserName,
    merchantUserName,
    clientUserName,
    canAccessAdminRoute,
    canAccessShopRoute,
    adminViewProps,
    merchantViewProps,
    clientViewProps,
    showClientShopSearch: isClientShopRoute,
    shopQuery,
    onShopQueryChange: setShopQuery,
    onClearShopQuery: () => setShopQuery(""),
    clientAuthModal,
    adminPreviewMode,
    previewShopName: previewShop?.name,
    onStopAdminPreview: stopAdminPreview,
    merchantIsPreview: Boolean(adminPreview && !isAdminOverride),
    isAdminOverride,
    clientIsPreview: Boolean(adminPreview),
    clientHideChrome: isLiveQueueOpen,
  };

  const overlaysProps: OverlaysProps = {
    notice,
    onCloseNotice: clearNotice,
    reportTarget,
    onCloseReport: () => setReportTarget(null),
    onSubmitReport: handleSubmitReport,
    calendarPromptStream,
    onCalendarAccept: (stream) => {
      handleOpenCalendarInvite(stream);
      setCalendarPromptStream(null);
    },
    onCalendarClose: () => setCalendarPromptStream(null),
  };

  const resetViewProps: ResetViewProps = {
    status: resetViewStatus,
    email: resetViewEmail,
    password: resetViewPassword,
    confirm: resetViewConfirm,
    error: resetViewError,
    busy: resetViewBusy,
    onClose: () => window.location.assign("/"),
    onPasswordChange: setResetViewPassword,
    onConfirmChange: setResetViewConfirm,
    onSubmit: handleResetViewSubmit,
  };

  return {
    isResetView,
    isLoading,
    isAdminViewBlocked,
    isMerchantViewBlocked,
    loadingFallback,
    resetViewProps,
    roleRouterProps,
    overlaysProps,
  };
};
