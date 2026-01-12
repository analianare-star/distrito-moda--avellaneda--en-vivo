import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
// Asegurate de que la ruta a 'types' sea correcta (a veces es './types' o '../types')
import {
  ViewMode,
  Shop,
  Stream,
  StreamStatus,
  UserContext,
  Reel,
  NotificationItem,
} from "./types";
import { LogoBubble } from "./components/LogoBubble";
import { Button } from "./components/Button";
import { NoticeModal } from "./components/NoticeModal";
import { ReportModal } from "./components/ReportModal";
import { AppHeader } from "./components/layout/AppHeader";
import { AppFooterNav } from "./components/layout/AppFooterNav";
import { AccountDrawer } from "./components/layout/AccountDrawer";
import { AdminPreviewBanner } from "./components/layout/AdminPreviewBanner";
import { ClientView } from "./components/views/ClientView";
import { MerchantView } from "./components/views/MerchantView";
import { AdminView } from "./components/views/AdminView";
import { api } from "./services/api";
import {
  X,
  User,
  UserCircle,
  Bell,
  Clock,
  AlertTriangle,
  Home,
  Radio,
  Heart,
  Store,
  Shield,
  Receipt,
  Globe,
  Film,
  Mail,
  Key,
} from "lucide-react";
import { FaStore, FaUser, FaEnvelope } from "react-icons/fa";
import { auth, googleProvider } from "./firebase";
import {
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  verifyPasswordResetCode,
} from "firebase/auth";

type AuthProfile = {
  userType: "ADMIN" | "SHOP" | "CLIENT";
  authUserId?: string;
  shopId?: string;
  adminRole?: string;
};

const GoogleMark = () => (
  <svg viewBox="0 0 48 48" className="h-7 w-7" aria-hidden>
    <path
      fill="#EA4335"
      d="M24 9.5c3.3 0 6.3 1.2 8.7 3.5l6.5-6.5C35.3 2.7 30 0.5 24 0.5 14.6 0.5 6.4 5.9 2.5 13.7l7.6 5.9C12 13.2 17.5 9.5 24 9.5z"
    />
    <path
      fill="#4285F4"
      d="M46.5 24.5c0-1.8-0.2-3.1-0.5-4.5H24v8.5h12.6c-0.3 2.1-1.8 5.3-5.2 7.5l8 6.2c4.7-4.4 7.1-10.8 7.1-17.7z"
    />
    <path
      fill="#FBBC05"
      d="M10.1 28.7c-0.5-1.4-0.8-2.9-0.8-4.5s0.3-3.1 0.7-4.5l-7.6-5.9C0.9 17.1 0 20.5 0 24c0 3.5 0.9 6.9 2.5 10.2l7.6-5.5z"
    />
    <path
      fill="#34A853"
      d="M24 48c6 0 11.3-2 15.1-5.5l-8-6.2c-2.1 1.4-4.9 2.3-7.1 2.3-6.5 0-12-3.8-13.9-9.4l-7.6 5.5C6.4 42.1 14.6 48 24 48z"
    />
  </svg>
);

type MerchantTab = "RESUMEN" | "VIVOS" | "REELS" | "REDES" | "PERFIL";

// --- TIENDA DE SEGURIDAD (para evitar crasheos cuando la DB esta vacia) ---
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
  // Campos opcionales nuevos
  paymentMethods: [],
  minimumPurchase: 0,
};

const BRAND_LOGO = new URL("./img/logo.svg", import.meta.url).href;

const App: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>("CLIENT");
  const [adminPreview, setAdminPreview] = useState<{
    mode: ViewMode;
    shopId?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeBottomNav, setActiveBottomNav] = useState("home");
  const [adminTab, setAdminTab] = useState<
    "DASHBOARD" | "AGENDA" | "STREAMS" | "SHOPS" | "REELS" | "ADMIN" | "REPORTS"
  >("DASHBOARD");
  const [merchantTab, setMerchantTab] = useState<MerchantTab>("RESUMEN");
  const [isDesktopMenuOpen, setIsDesktopMenuOpen] = useState(false);
  const [authProfile, setAuthProfile] = useState<AuthProfile | null>(null);
  const [loginMode, setLoginMode] = useState<"GOOGLE" | "EMAIL">("GOOGLE");
  const [loginStep, setLoginStep] = useState<
    "ENTRY" | "AUDIENCE" | "SHOP" | "CLIENT" | "CLIENT_EMAIL"
  >("ENTRY");
  const [clientEmailMode, setClientEmailMode] = useState<"REGISTER" | "LOGIN">(
    "REGISTER"
  );
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const [loginAudience, setLoginAudience] = useState<"SHOP" | null>(null);
  const [resetViewStatus, setResetViewStatus] = useState<
    "idle" | "loading" | "ready" | "success" | "error"
  >("idle");
  const [resetViewEmail, setResetViewEmail] = useState("");
  const [resetViewCode, setResetViewCode] = useState("");
  const [resetViewPassword, setResetViewPassword] = useState("");
  const [resetViewConfirm, setResetViewConfirm] = useState("");
  const [resetViewError, setResetViewError] = useState("");
  const [resetViewBusy, setResetViewBusy] = useState(false);

  const isResetView =
    typeof window !== "undefined" &&
    (window.location.pathname.startsWith("/reset") ||
      new URLSearchParams(window.location.search).get("mode") ===
        "resetPassword");

  // --- CENTRALIZED STATE ---
  const [allShops, setAllShops] = useState<Shop[]>([]);
  const [allStreams, setAllStreams] = useState<Stream[]>([]);
  const [activeReels, setActiveReels] = useState<Reel[]>([]);

  // User Simulation State
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

  // UI States
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
  const [isAccountDrawerOpen, setIsAccountDrawerOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [accountTab, setAccountTab] = useState<
    "RESUMEN" | "NOTIFICATIONS" | "REMINDERS"
  >("RESUMEN");
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
  const notify = (
    title: string,
    message: string,
    tone?: "info" | "success" | "warning" | "error"
  ) => {
    setNotice({ title, message, tone });
  };
  const navigateTo = (path: string, replace = false) => {
    if (location.pathname !== path) {
      navigate(path, { replace });
    }
  };
  const isAdminRoute = (path: string) =>
    path === "/admin" || path.startsWith("/admin/");
  const isShopRoute = (path: string) =>
    path === "/tienda" || path.startsWith("/tienda/");
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
    setActiveBottomNav("account");
    navigateTo("/cuenta");
    openLoginModal();
  };
  const requireClient = () => {
    if (!user.isLoggedIn) {
      requireLogin();
      return false;
    }
    if (authProfile?.userType && authProfile.userType !== "CLIENT") {
      setNotice({
        title: "Solo clientes",
        message: "Esta acción está disponible solo para cuentas cliente.",
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

  // --- Derived States (CON PROTECCION ANTI-CRASH) ---
  // Si no encuentra la tienda o la lista esta vacia, usa la EMPTY_SHOP para no romper la pantalla.
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

  // --- DATA LOADING & AUTO-UPDATE ---
  const refreshData = async () => {
    try {
      const [shops, streams, reels] = await Promise.all([
        api.fetchShops(),
        api.fetchStreams(),
        api.fetchReels(),
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
    if (isResetView) return;
    refreshData();
  }, [isResetView]);

  useEffect(() => {
    if (isResetView) return;
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      const currentPath =
        typeof window !== "undefined" ? window.location.pathname : "/";
      if (fbUser) {
        setUser((prev) => ({
          ...prev,
          id: fbUser.uid,
          isLoggedIn: true,
          name: fbUser.displayName || prev.name || "Cliente",
          email: fbUser.email || prev.email,
        }));
        void (async () => {
          const profile = await api.fetchAuthMe();
          if (profile?.userType) {
            setAuthProfile(profile);
            if (profile.userType === "ADMIN") {
              navigateTo("/admin", true);
            } else if (profile.userType === "SHOP") {
              navigateTo("/tienda", true);
              if (profile.shopId) {
                setCurrentShopId(profile.shopId);
              }
              await refreshNotifications(profile);
            } else {
              if (isAdminRoute(currentPath) || isShopRoute(currentPath)) {
                navigateTo("/", true);
              }
              await api.createClientMe({
                displayName: fbUser.displayName || undefined,
                avatarUrl: fbUser.photoURL || undefined,
              });
              const clientState = await api.fetchClientState();
              if (clientState) {
                setUser((prev) => ({
                  ...prev,
                  favorites: clientState.favorites || [],
                  reminders: clientState.reminders || [],
                  viewedReels: clientState.viewedReels || [],
                  likes: clientState.likes || [],
                }));
              }
              await refreshNotifications(profile);
            }
          } else {
            setAuthProfile(null);
            if (isAdminRoute(currentPath) || isShopRoute(currentPath)) {
              navigateTo("/", true);
            }
          }
        })();
        setLoginPromptDismissed(true);
        setShowLoginPrompt(false);
    } else {
      setUser((prev) => ({
        ...prev,
        id: prev.isLoggedIn ? `anon-${Date.now()}` : prev.id,
        isLoggedIn: false,
          favorites: [],
          reminders: [],
          viewedReels: [],
          history: [],
          likes: [],
          reports: [],
        }));
        setNotifications([]);
      setAdminPreview(null);
      setAuthProfile(null);
      setViewMode("CLIENT");
      setActiveBottomNav("home");
      if (isAdminRoute(currentPath) || isShopRoute(currentPath)) {
        navigateTo("/", true);
      }
      setLoginPromptDismissed(false);
      setShowLoginPrompt(false);
      setHasBottomNavInteraction(false);
    }
    });

    return () => unsubscribe();
  }, [isResetView]);

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
    if (!isResetView) return;
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");
    const oobCode = params.get("oobCode") || "";
    if (mode !== "resetPassword" || !oobCode) {
      setResetViewStatus("error");
      setResetViewError("El enlace de restablecimiento no es válido.");
      return;
    }
    setResetViewStatus("loading");
    setResetViewCode(oobCode);
    verifyPasswordResetCode(auth, oobCode)
      .then((email) => {
        setResetViewEmail(email);
        setResetViewStatus("ready");
      })
      .catch(() => {
        setResetViewStatus("error");
        setResetViewError("El enlace está vencido o es incorrecto.");
      });
  }, [isResetView]);

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

  // --- AUTO LIFECYCLE SE MANEJA EN BACKEND ---

  // --- BUSINESS LOGIC ACTIONS ---

  const handleStreamCreate = async (newStream: Stream) => {
    if (blockPreviewAction()) return false;
    try {
      const result = await api.createStream(newStream);
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
      await api.updateStream(updatedStream);
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
      await api.updateShop(updatedShop.id, updatedShop); // Ajustado para pasar ID y data
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

  const handleReportStream = async (streamId: string) => {
    if (!requireClient()) return;
    const stream = allStreams.find((s) => s.id === streamId);
    if (!stream) return;

    if (stream.status !== StreamStatus.LIVE) {
      setNotice({
        title: "Reporte no disponible",
        message: "Solo se pueden reportar vivos en vivo.",
        tone: "warning",
      });
      return;
    }
    if (user.reports.some((r) => r.streamId === streamId)) {
      setNotice({
        title: "Reporte ya enviado",
        message: "Ya reportaste este vivo.",
        tone: "info",
      });
      return;
    }

    setReportTarget(stream);
  };

  const handleSubmitReport = async (reason: string) => {
    if (!reportTarget) return;
    const result = await api.reportStream(reportTarget.id, reason);
    if (result.success) {
      setUser((prev) => ({
        ...prev,
        reports: [
          ...prev.reports,
          { streamId: reportTarget.id, timestamp: Date.now() },
        ],
      }));
      pushHistory(`Reporte enviado: ${reportTarget.title}`);
      setNotice({
        title: "Reporte enviado",
        message: result.message,
        tone: "success",
      });
      refreshData();
    } else {
      setNotice({
        title: "No se pudo reportar",
        message: result.message,
        tone: "error",
      });
    }
    setReportTarget(null);
  };

  const handleToggleFavorite = (shopId: string) => {
    if (!requireClient()) return;
    if (!user.isLoggedIn) return;
    const wasFollowing = user.favorites.includes(shopId);
    void (async () => {
      try {
        const updated = user.favorites.includes(shopId)
          ? await api.removeFavorite(shopId)
          : await api.addFavorite(shopId);
        if (updated) {
          setUser((prev) => ({ ...prev, favorites: updated }));
        }
        if (!wasFollowing) {
          setNotice({
            title: "Favorito guardado",
            message: "¡Siguiendo tienda!",
            tone: "success",
          });
          const shop = allShops.find((item) => item.id === shopId);
          if (shop) pushHistory(`Seguiste: ${shop.name}`);
        } else {
          const shop = allShops.find((item) => item.id === shopId);
          if (shop) pushHistory(`Dejaste de seguir: ${shop.name}`);
        }
      } catch (error) {
        setNotice({
          title: "No se pudo actualizar",
          message: "Intenta nuevamente.",
          tone: "error",
        });
      }
    })();
  };

  const handleToggleReminder = (streamId: string) => {
    if (!requireClient()) return;
    if (!user.isLoggedIn) return;
    const wasActive = user.reminders.includes(streamId);
    void (async () => {
      try {
        const updated = user.reminders.includes(streamId)
          ? await api.removeReminder(streamId)
          : await api.addReminder(streamId);
        if (updated) {
          setUser((prev) => ({ ...prev, reminders: updated }));
        }
        await refreshNotifications(authProfile);
        const stream = allStreams.find((item) => item.id === streamId);
        if (stream) {
          pushHistory(
            `${wasActive ? "Quitaste" : "Agendaste"} recordatorio: ${
              stream.title
            }`
          );
          if (!wasActive && stream.status === StreamStatus.UPCOMING) {
            setCalendarPromptStream(stream);
          }
        }
      } catch (error) {
        setNotice({
          title: "No se pudo actualizar",
          message: "Intenta nuevamente.",
          tone: "error",
        });
      }
    })();
  };

  const formatNotificationDate = (value?: string) => {
    if (!value) return "";
    try {
      return new Date(value).toLocaleString("es-AR", {
        dateStyle: "short",
        timeStyle: "short",
      });
    } catch {
      return value;
    }
  };

  const formatICSDate = (date: Date) =>
    date
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z$/, "Z");

  const getApiBaseUrl = () => {
    const raw = import.meta.env.VITE_API_URL || "http://localhost:3000";
    return raw.replace(/\/+$/, "");
  };

  const isAppleDevice = () => {
    const ua = navigator.userAgent || "";
    const isApple = /iPad|iPhone|iPod|Mac/.test(ua);
    const isTouchMac =
      navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
    return isApple || isTouchMac;
  };

  const buildGoogleCalendarUrl = (stream: Stream) => {
    const start = new Date(stream.fullDateISO);
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    const title = stream.title || "Vivo en Avellaneda en Vivo";
    const shopName = stream.shop?.name || "Distrito Moda";
    const detailsLines = [
      `Tienda: ${shopName}`,
      stream.url ? `Enlace: ${stream.url}` : "",
    ].filter(Boolean);
    const details = detailsLines.join("\n");
    const location = stream.shop?.address || "Avellaneda en Vivo";
    const dates = `${formatICSDate(start)}/${formatICSDate(end)}`;
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: title,
      dates,
      details,
      location,
      sf: "true",
      output: "xml",
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  const handleOpenCalendarInvite = (stream: Stream) => {
    try {
      const apiBase = getApiBaseUrl();
      const calendarUrl = `${apiBase}/streams/${stream.id}/calendar.ics`;
      if (isAppleDevice()) {
        const webcalUrl = calendarUrl.replace(/^https?:\/\//, "webcal://");
        window.location.href = webcalUrl;
        return;
      }
      const googleUrl = buildGoogleCalendarUrl(stream);
      const popup = window.open(googleUrl, "_blank", "noopener");
      if (!popup) {
        window.location.href = googleUrl;
      }
    } catch {
      setNotice({
        title: "No se pudo abrir el calendario",
        message: "Intenta nuevamente.",
        tone: "error",
      });
    }
  };

  const handleMarkNotificationRead = (id: string) => {
    void (async () => {
      const updated = await api.markNotificationRead(id);
      if (updated) {
        setNotifications((prev) =>
          prev.map((note) => (note.id === id ? { ...note, read: true } : note))
        );
      }
    })();
  };

  const handleMarkAllNotificationsRead = () => {
    if (!authProfile?.authUserId) return;
    void (async () => {
      await api.markAllNotificationsRead(authProfile.authUserId);
      setNotifications((prev) => prev.map((note) => ({ ...note, read: true })));
    })();
  };

  const handleNotificationAction = (note: NotificationItem) => {
    if (!note.refId) return;
    const stream = allStreams.find((item) => item.id === note.refId);
    if (!stream) return;
    setActiveBottomNav("home");
    setActiveFilter("Próximos");
    navigateTo("/");
    setShopModalTab("INFO");
    setSelectedShopForModal(stream.shop);
    if (!note.read) {
      handleMarkNotificationRead(note.id);
    }
  };

  const openLoginModal = (
    step: "ENTRY" | "AUDIENCE" | "SHOP" | "CLIENT" | "CLIENT_EMAIL" = "ENTRY"
  ) => {
    setLoginMode("GOOGLE");
    setLoginStep(step);
    setClientEmailMode("REGISTER");
    setLoginError("");
    setLoginPassword("");
    setLoginAudience(null);
    setLoginPromptDismissed(false);
    setShowLoginPrompt(true);
    setIsAccountDrawerOpen(false);
  };

  const openAudienceSelection = () => {
    setLoginMode("GOOGLE");
    setLoginStep("AUDIENCE");
    setClientEmailMode("REGISTER");
    setLoginError("");
    setLoginPassword("");
    setLoginAudience(null);
    setLoginPromptDismissed(false);
    setShowLoginPrompt(true);
    setIsAccountDrawerOpen(false);
  };

  const openClientRegister = () => {
    setLoginMode("GOOGLE");
    setLoginStep("AUDIENCE");
    setClientEmailMode("REGISTER");
    setLoginError("");
    setLoginPassword("");
    setLoginAudience(null);
    setLoginPromptDismissed(false);
    setShowLoginPrompt(true);
    setIsAccountDrawerOpen(false);
  };

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
    if (!adminPreview) return false;
    setNotice({
      title: "Modo vista",
      message,
      tone: "warning",
    });
    return true;
  };

  const handleGoogleLogin = async () => {
    try {
      setLoginBusy(true);
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error iniciando sesion:", error);
      setLoginError("No se pudo iniciar sesión con Google.");
      setNotice({
        title: "No se pudo iniciar sesión",
        message: "Reintentá con tu cuenta de Google.",
        tone: "error",
      });
    } finally {
      setLoginBusy(false);
    }
  };

  const handleEmailLogin = async () => {
    const email = loginEmail.trim().toLowerCase();
    if (!email || !loginPassword) {
      setLoginError("Ingresá tu correo y contraseña.");
      return;
    }
    setLoginBusy(true);
    setLoginError("");
    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        email,
        loginPassword
      );
      if (loginAudience !== "SHOP" && !credential.user.emailVerified) {
        await signOut(auth);
        const message = "Verificá tu correo para completar el ingreso.";
        setLoginError(message);
        setNotice({
          title: "Verificación pendiente",
          message,
          tone: "warning",
        });
        return;
      }
    } catch (error: any) {
      const code = error?.code || "";
      const message =
        code === "auth/user-not-found"
          ? "No encontramos una cuenta con ese correo."
          : code === "auth/wrong-password"
          ? "La contraseña es incorrecta."
          : code === "auth/invalid-email"
          ? "El correo no es válido."
          : code === "auth/too-many-requests"
          ? "Se bloquearon intentos por seguridad. Probá más tarde."
          : "No se pudo iniciar sesión.";
      setLoginError(message);
      setNotice({
        title: "No se pudo iniciar sesión",
        message,
        tone: "error",
      });
    } finally {
      setLoginBusy(false);
    }
  };

  const handleEmailRegister = async () => {
    const email = loginEmail.trim().toLowerCase();
    if (!email || !loginPassword) {
      setLoginError("Ingresá tu correo y una contraseña.");
      return;
    }
    if (loginPassword.length < 6) {
      setLoginError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setLoginBusy(true);
    setLoginError("");
    try {
      const isShopEmail = await api.checkShopEmail(email);
      if (isShopEmail) {
        const message = "Ese correo ya está registrado como tienda.";
        setLoginError(message);
        setNotice({
          title: "Correo no disponible",
          message,
          tone: "warning",
        });
        return;
      }
      const credential = await createUserWithEmailAndPassword(
        auth,
        email,
        loginPassword
      );
      await sendEmailVerification(credential.user);
      await signOut(auth);
      setLoginEmail("");
      setLoginPassword("");
      setLoginStep("ENTRY");
      setLoginMode("GOOGLE");
      setClientEmailMode("REGISTER");
      setNotice({
        title: "Revisá tu correo",
        message:
          "Te enviamos un enlace para verificar tu cuenta. Mirá también Spam/Promociones.",
        tone: "success",
      });
    } catch (error: any) {
      const code = error?.code || "";
      const message =
        code === "auth/email-already-in-use"
          ? "Ese correo ya tiene una cuenta."
          : code === "auth/invalid-email"
          ? "El correo no es válido."
          : code === "auth/weak-password"
          ? "La contraseña es muy débil."
          : "No se pudo crear la cuenta.";
      setLoginError(message);
      setNotice({
        title: "No se pudo crear la cuenta",
        message,
        tone: "error",
      });
    } finally {
      setLoginBusy(false);
    }
  };

  const handlePasswordReset = async () => {
    const email = loginEmail.trim().toLowerCase();
    if (!email) {
      setLoginError("Escribí tu correo para restablecer la clave.");
      return;
    }
    setResetBusy(true);
    setLoginError("");
    try {
      await sendPasswordResetEmail(auth, email);
      setNotice({
        title: "Enlace enviado",
        message:
          "Revisá tu correo para restablecer la clave. Mirá también Spam/Promociones.",
        tone: "success",
      });
    } catch (error: any) {
      const code = error?.code || "";
      const message =
        code === "auth/user-not-found"
          ? "Ese correo no tiene una cuenta creada."
          : code === "auth/invalid-email"
          ? "El correo no es válido."
          : "No se pudo enviar el enlace.";
      setLoginError(message);
      setNotice({
        title: "No se pudo enviar el enlace",
        message,
        tone: "error",
      });
    } finally {
      setResetBusy(false);
    }
  };

  const handleResetViewSubmit = async () => {
    setResetViewError("");
    if (!resetViewCode) {
      setResetViewError("El enlace no es válido.");
      return;
    }
    if (resetViewPassword.length < 6) {
      setResetViewError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (resetViewPassword !== resetViewConfirm) {
      setResetViewError("Las contraseñas no coinciden.");
      return;
    }
    setResetViewBusy(true);
    try {
      await confirmPasswordReset(auth, resetViewCode, resetViewPassword);
      setResetViewStatus("success");
    } catch (error: any) {
      const code = error?.code || "";
      const message =
        code === "auth/expired-action-code"
          ? "El enlace venció. Pedí un nuevo restablecimiento."
          : "No se pudo restablecer la clave.";
      setResetViewError(message);
      setResetViewStatus("error");
    } finally {
      setResetViewBusy(false);
    }
  };

  const handleContinueAsGuest = () => {
    setLoginPromptDismissed(true);
    setLoginError("");
    setShowLoginPrompt(false);
    setLoginStep("ENTRY");
  };

  const handleToggleClientLogin = async () => {
    if (user.isLoggedIn) {
      try {
        await signOut(auth);
        setLoginPromptDismissed(false);
      } catch (error) {
        console.error("Error cerrando sesion:", error);
        setNotice({
          title: "Error de sesión",
          message: "No se pudo cerrar la sesión.",
          tone: "error",
        });
      }
      return;
    }
    openLoginModal();
  };

  const handleLikeStream = (streamId: string) => {
    if (!requireClient()) return;
    void (async () => {
      try {
        const result = await api.toggleLikeStream(streamId);
        if (!result) return;
        setAllStreams((prev) =>
          prev.map((stream) =>
            stream.id === streamId ? { ...stream, likes: result.likes } : stream
          )
        );
        setUser((prev) => {
          const hasLike = prev.likes.includes(streamId);
          const nextLikes = result.liked
            ? hasLike
              ? prev.likes
              : [...prev.likes, streamId]
            : prev.likes.filter((id) => id !== streamId);
          return { ...prev, likes: nextLikes };
        });
        if (result.liked) {
          const stream = allStreams.find((item) => item.id === streamId);
          if (stream) pushHistory(`Te gustó: ${stream.title}`);
        }
      } catch (error: any) {
        setNotice({
          title: "No se pudo guardar el like",
          message: error?.message || "Intentá nuevamente.",
          tone: "error",
        });
      }
    })();
  };

  const handleRateStream = (streamId: string, rating: number) => {
    if (!requireClient()) return;
    void (async () => {
      try {
        await api.rateStream(streamId, rating);
        setNotice({
          title: "Gracias por calificar",
          message: `Calificaste con ${rating} estrellas.`,
          tone: "success",
        });
        const stream = allStreams.find((item) => item.id === streamId);
        if (stream) pushHistory(`Calificaste: ${stream.title}`);
        refreshData();
      } catch (error: any) {
        setNotice({
          title: "No se pudo calificar",
          message: error?.message || "No se pudo calificar el vivo.",
          tone: "error",
        });
      }
    })();
  };

  const handleDownloadCard = (stream: Stream) => {
    if (!requireClient()) return;
    setShopModalTab("CARD");
    setSelectedShopForModal(stream.shop);
  };

  const handleOpenShop = (shop: Shop) => {
    setShopModalTab("INFO");
    setSelectedShopForModal(shop);
    setActiveShopCardId(null);
    if (user.isLoggedIn && authProfile?.userType === "CLIENT") {
      pushHistory(`Visitaste: ${shop.name}`);
    }
  };

  const handleViewReel = (reel: Reel) => {
    setSelectedReel(reel);
    if (user.isLoggedIn && authProfile?.userType === "CLIENT") {
      if (!user.viewedReels.includes(reel.id)) {
        setUser((prev) => ({
          ...prev,
          viewedReels: [...prev.viewedReels, reel.id],
        }));
      }
      void api.registerReelView(reel.id);
      pushHistory(`Viste historia de ${reel.shopName}`);
    }
  };

  const getFilteredStreams = () => {
    let filtered = allStreams.filter((s) => s.isVisible);
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

  const liveStreams = allStreams.filter(
    (s) =>
      s.status === StreamStatus.LIVE &&
      s.isVisible &&
      s.shop?.status === "ACTIVE"
  );
  const sortedLiveStreams = [...liveStreams].sort((a, b) => {
    const weightA = planWeight(a.shop.plan);
    const weightB = planWeight(b.shop.plan);
    if (weightA !== weightB) return weightB - weightA;
    if (a.shop.ratingAverage !== b.shop.ratingAverage)
      return b.shop.ratingAverage - a.shop.ratingAverage;
    return (b.views || 0) - (a.views || 0);
  });
  const filteredStreams = getFilteredStreams();

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

  const publicShops = sortShopsByPriority(allShops.filter(isPublicShop));
  const favoriteShops = sortShopsByPriority(
    allShops.filter((shop) => user.favorites.includes(shop.id))
  );
  const normalizedShopQuery = shopQuery.trim().toLowerCase();
  const filterShopsByQuery = (shops: Shop[]) => {
    if (!normalizedShopQuery) return shops;
    return shops.filter((shop) => {
      const address = shop.address || "";
      const city = shop.addressDetails?.city || "";
      const province = shop.addressDetails?.province || "";
      const razon = shop.razonSocial || "";
      return [shop.name, razon, address, city, province]
        .join(" ")
        .toLowerCase()
        .includes(normalizedShopQuery);
    });
  };
  const filteredPublicShops = filterShopsByQuery(publicShops);
  const filteredFavoriteShops = filterShopsByQuery(favoriteShops);
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
  const renderShopCard = (shop: Shop) => {
    const isActive = activeShopCardId === shop.id;
    const hasCover = Boolean(shop.coverUrl);

    if (!hasCover) {
      return (
        <button
          key={shop.id}
          onClick={() => handleOpenShop(shop)}
          className="rounded-2xl border border-gray-100 bg-white p-4 md:p-5 text-left shadow-sm transition hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <LogoBubble
              src={shop.logoUrl}
              alt={shop.name}
              size={48}
              seed={shop.id || shop.name}
            />
            <div>
              <p className="text-sm font-bold text-dm-dark">{shop.name}</p>
              <p className="text-[11px] text-gray-500 uppercase">
                {shop.plan}
              </p>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2 text-[10px] text-gray-500">
            <span className="font-bold text-dm-dark">
              {shop.ratingAverage?.toFixed(1) || "0.0"}
            </span>
            <span>★</span>
            <span>({shop.ratingCount || 0})</span>
          </div>
          <p className="mt-3 text-xs text-gray-500 line-clamp-2">
            {shop.address || "Sin dirección cargada"}
          </p>
        </button>
      );
    }

    return (
      <div
        key={shop.id}
        role="button"
        tabIndex={0}
        onClick={() => toggleShopCard(shop.id)}
        onKeyDown={(event) => handleShopCardKeyDown(event, shop.id)}
        className="group relative min-h-[140px] overflow-hidden rounded-2xl border border-gray-100 shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-dm-crimson/40"
      >
        <img
          src={shop.coverUrl}
          alt={`Portada ${shop.name}`}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          draggable={false}
        />
        <div className="absolute left-3 top-3 z-10 flex items-center gap-2 rounded-full bg-white/85 px-2 py-1 shadow-sm">
          <div className="rounded-full bg-white/90 p-0.5 ring-2 ring-white">
            <LogoBubble
              src={shop.logoUrl}
              alt={shop.name}
              size={28}
              seed={shop.id || shop.name}
            />
          </div>
          <span className="max-w-[140px] truncate text-xs font-bold text-dm-dark">
            {shop.name}
          </span>
        </div>
        <div className="absolute left-3 top-3 z-10 flex items-center gap-2 rounded-full bg-white/85 px-2 py-1 shadow-sm">
          <div className="rounded-full bg-white/90 p-0.5 ring-2 ring-white">
            <LogoBubble
              src={shop.logoUrl}
              alt={shop.name}
              size={28}
              seed={shop.id || shop.name}
            />
          </div>
          <span className="max-w-[140px] truncate text-xs font-bold text-dm-dark">
            {shop.name}
          </span>
        </div>

        {isActive && (
          <>
            <div className="absolute inset-0 bg-white/75 backdrop-blur-md transition-opacity" />
            <div className="relative z-10 flex h-full flex-col justify-between p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-white/80 p-1 ring-2 ring-white/90 shadow-sm">
                  <LogoBubble
                    src={shop.logoUrl}
                    alt={shop.name}
                    size={44}
                    seed={shop.id || shop.name}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-dm-dark">
                    {shop.name}
                  </p>
                  <p className="text-[11px] uppercase text-gray-600">
                    {shop.plan}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-gray-600">
                    <span className="font-bold text-dm-dark">
                      {shop.ratingAverage?.toFixed(1) || "0.0"}
                    </span>
                    <span>★</span>
                    <span>({shop.ratingCount || 0})</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-xs text-gray-700 line-clamp-2">
                  {shop.address || "Sin dirección cargada"}
                </p>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    handleOpenShop(shop);
                  }}
                  className="whitespace-nowrap rounded-full bg-dm-crimson px-3 py-1.5 text-[11px] font-bold text-white shadow-sm hover:bg-dm-crimson/90"
                >
                  Ver más
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  useEffect(() => {
    if (isResetView || adminPreview) return;
    const path = location.pathname;
    if (!authProfile?.userType) {
      if (isAdminRoute(path) || isShopRoute(path)) {
        setViewMode("CLIENT");
        setActiveBottomNav("home");
        navigateTo("/", true);
        return;
      }
    }
    if (isAdminRoute(path)) {
      setViewMode("ADMIN");
      const nextTab = path.includes("/tiendas")
        ? "SHOPS"
        : path.includes("/vivos")
        ? "STREAMS"
        : path.includes("/compras")
        ? "ADMIN"
        : path.includes("/reportes")
        ? "REPORTS"
        : "DASHBOARD";
      const nextNav =
        nextTab === "SHOPS"
          ? "shops"
          : nextTab === "STREAMS"
          ? "streams"
          : nextTab === "ADMIN"
          ? "purchases"
          : nextTab === "REPORTS"
          ? "reports"
          : "panel";
      setAdminTab(nextTab);
      setActiveBottomNav(nextNav);
      return;
    }
    if (isShopRoute(path)) {
      setViewMode("MERCHANT");
      const nextTab = path.includes("/vivos")
        ? "VIVOS"
        : path.includes("/reels")
        ? "REELS"
        : path.includes("/redes")
        ? "REDES"
        : path.includes("/perfil")
        ? "PERFIL"
        : "RESUMEN";
      const nextNav =
        nextTab === "VIVOS"
          ? "vivos"
          : nextTab === "REELS"
          ? "reels"
          : nextTab === "REDES"
          ? "redes"
          : nextTab === "PERFIL"
          ? "perfil"
          : "resumen";
      setMerchantTab(nextTab);
      setActiveBottomNav(nextNav);
      return;
    }
    setViewMode("CLIENT");
    if (path === "/tiendas") {
      setActiveBottomNav("shops");
    } else if (path === "/en-vivo") {
      setActiveBottomNav("live");
      setActiveFilter("En Vivo");
    } else if (path === "/recordatorios") {
      setActiveBottomNav("reminders");
      setSavedTab("REMINDERS");
    } else if (path === "/favoritos") {
      setActiveBottomNav("reminders");
      setSavedTab("FAVORITES");
    } else if (path === "/cuenta") {
      setActiveBottomNav("account");
      setAccountTab("RESUMEN");
      setIsAccountDrawerOpen(true);
    } else {
      setActiveBottomNav("home");
      setActiveFilter("Todos");
    }
    if (path !== "/cuenta" && isAccountDrawerOpen) {
      setIsAccountDrawerOpen(false);
    }
  }, [location.pathname, adminPreview, isResetView, authProfile?.userType]);

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

  const handleClientNav = (id: string) => {
    setHasBottomNavInteraction(true);
    setShowLoginPrompt(false);
    setViewMode("CLIENT");
    if (id === "favorites") {
      setSavedTab("FAVORITES");
      setActiveBottomNav("reminders");
      navigateTo("/favoritos");
    } else {
      setActiveBottomNav(id);
      if (id === "home") navigateTo("/");
      if (id === "shops") navigateTo("/tiendas");
      if (id === "live") navigateTo("/en-vivo");
      if (id === "reminders") navigateTo("/recordatorios");
      if (id === "account") navigateTo("/cuenta");
    }
    if (id === "home") setActiveFilter("Todos");
    if (id === "live") setActiveFilter("En Vivo");
    if (id === "reminders") setSavedTab("REMINDERS");
    if (id === "account") {
      setIsAccountDrawerOpen(true);
      setAccountTab("RESUMEN");
      void refreshNotifications(authProfile);
    }
  };

  const handleAdminNav = (id: string) => {
    setViewMode("ADMIN");
    setActiveBottomNav(id);
    const nextTab =
      id === "shops"
        ? "SHOPS"
        : id === "streams"
        ? "STREAMS"
        : id === "purchases"
        ? "ADMIN"
        : id === "reports"
        ? "REPORTS"
        : "DASHBOARD";
    setAdminTab(nextTab);
    const nextRoute =
      id === "shops"
        ? "/admin/tiendas"
        : id === "streams"
        ? "/admin/vivos"
        : id === "purchases"
        ? "/admin/compras"
        : id === "reports"
        ? "/admin/reportes"
        : "/admin";
    navigateTo(nextRoute);
  };

  const handleMerchantNav = (id: string) => {
    setViewMode("MERCHANT");
    setActiveBottomNav(id);
    const nextTab =
      id === "vivos"
        ? "VIVOS"
        : id === "reels"
        ? "REELS"
        : id === "redes"
        ? "REDES"
        : id === "perfil"
        ? "PERFIL"
        : "RESUMEN";
    setMerchantTab(nextTab);
    const nextRoute =
      id === "vivos"
        ? "/tienda/vivos"
        : id === "reels"
        ? "/tienda/reels"
        : id === "redes"
        ? "/tienda/redes"
        : id === "perfil"
        ? "/tienda/perfil"
        : "/tienda";
    navigateTo(nextRoute);
  };

  const syncMerchantTab = (tab: MerchantTab) => {
    setMerchantTab(tab);
    const navId =
      tab === "VIVOS"
        ? "vivos"
        : tab === "REELS"
        ? "reels"
        : tab === "REDES"
        ? "redes"
        : tab === "PERFIL"
        ? "perfil"
        : "resumen";
    setActiveBottomNav(navId);
    const nextRoute =
      tab === "VIVOS"
        ? "/tienda/vivos"
        : tab === "REELS"
        ? "/tienda/reels"
        : tab === "REDES"
        ? "/tienda/redes"
        : tab === "PERFIL"
        ? "/tienda/perfil"
        : "/tienda";
    navigateTo(nextRoute);
  };

  const isAdminUser = effectiveUserType === "ADMIN";
  const isMerchantUser = effectiveUserType === "SHOP";
  const accountBadgeCount = unreadNotifications.length;
  const reminderBadgeCount = reminderStreams.length;
  const userTypeLabels: Record<string, string> = {
    ADMIN: "Administrador",
    SHOP: "Tienda",
    CLIENT: "Cliente",
  };
  const formatUserType = (value?: string) =>
    userTypeLabels[value || ""] || "Cliente";
  const accountTabs = [
    { id: "RESUMEN", label: "Resumen", icon: UserCircle, badge: 0 },
    {
      id: "NOTIFICATIONS",
      label: "Notificaciones",
      icon: Bell,
      badge: accountBadgeCount,
    },
    { id: "REMINDERS", label: "Recordatorios", icon: Clock, badge: 0 },
  ];
  const bottomNavItems = isAdminUser
    ? [
        {
          id: "shops",
          label: "Tiendas",
          icon: Store,
          isCenter: false,
          onSelect: () => handleAdminNav("shops"),
        },
        {
          id: "streams",
          label: "Vivos",
          icon: Radio,
          isCenter: false,
          onSelect: () => handleAdminNav("streams"),
        },
        {
          id: "panel",
          label: "Panel",
          icon: Shield,
          isCenter: true,
          onSelect: () => handleAdminNav("panel"),
        },
        {
          id: "purchases",
          label: "Compras",
          icon: Receipt,
          isCenter: false,
          onSelect: () => handleAdminNav("purchases"),
        },
        {
          id: "reports",
          label: "Reportes",
          icon: AlertTriangle,
          isCenter: false,
          onSelect: () => handleAdminNav("reports"),
        },
      ]
    : isMerchantUser
    ? [
        {
          id: "resumen",
          label: "Resumen",
          icon: Home,
          isCenter: false,
          onSelect: () => handleMerchantNav("resumen"),
        },
        {
          id: "redes",
          label: "Redes",
          icon: Globe,
          isCenter: false,
          onSelect: () => handleMerchantNav("redes"),
        },
        {
          id: "vivos",
          label: "Vivos",
          icon: Radio,
          isCenter: true,
          onSelect: () => handleMerchantNav("vivos"),
        },
        {
          id: "reels",
          label: "Reels",
          icon: Film,
          isCenter: false,
          onSelect: () => handleMerchantNav("reels"),
        },
        {
          id: "perfil",
          label: "Perfil",
          icon: Store,
          isCenter: false,
          onSelect: () => handleMerchantNav("perfil"),
        },
      ]
    : [
        {
          id: "home",
          label: "Inicio",
          icon: Home,
          isCenter: false,
          onSelect: () => handleClientNav("home"),
        },
        {
          id: "shops",
          label: "Tiendas",
          icon: Store,
          isCenter: false,
          onSelect: () => handleClientNav("shops"),
        },
        {
          id: "live",
          label: "En vivo",
          icon: Radio,
          isCenter: true,
          onSelect: () => handleClientNav("live"),
        },
        {
          id: "reminders",
          label: "Recordatorios",
          icon: Clock,
          isCenter: false,
          onSelect: () => handleClientNav("reminders"),
          badge: reminderBadgeCount,
        },
        {
          id: "account",
          label: user.isLoggedIn ? "Cuenta" : "Ingresar",
          icon: User,
          isCenter: false,
          onSelect: () => handleClientNav("account"),
          badge: accountBadgeCount,
        },
      ];

  const canClientInteract =
    user.isLoggedIn && authProfile?.userType === "CLIENT";

  if (isResetView) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-dm-light/30 to-white px-5 py-10 text-dm-dark">
        <div className="mx-auto w-full max-w-sm rounded-2xl border border-dm-crimson/10 bg-white p-5 shadow-[0_18px_48px_rgba(0,0,0,0.12)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield size={18} className="text-dm-crimson" />
              <p className="font-serif text-lg">Restablecer clave</p>
            </div>
            <button
              onClick={() => window.location.assign("/")}
              className="rounded-full border border-gray-200 p-1 text-gray-400 hover:text-gray-600"
              aria-label="Volver al inicio"
            >
              <X size={12} />
            </button>
          </div>
          <p className="mt-2 text-[11px] text-gray-500">
            {resetViewEmail
              ? `Cuenta: ${resetViewEmail}`
              : "Validando enlace..."}
          </p>

          {resetViewStatus === "loading" && (
            <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50 px-3 py-3 text-[11px] text-gray-500">
              Verificando enlace...
            </div>
          )}

          {resetViewStatus === "error" && (
            <div className="mt-5 rounded-xl border border-dm-alert/20 bg-dm-alert/10 px-3 py-3 text-[11px] text-dm-alert">
              {resetViewError || "No se pudo validar el enlace."}
            </div>
          )}

          {resetViewStatus === "success" && (
            <div className="mt-5 rounded-xl border border-dm-crimson/20 bg-dm-crimson/10 px-3 py-3 text-[11px] text-gray-700">
              Tu contraseña se actualizó correctamente. Ya podés iniciar sesión.
              <button
                onClick={() => window.location.assign("/")}
                className="mt-3 w-full rounded-full bg-dm-crimson px-4 py-2 text-xs font-bold text-white shadow-sm"
              >
                Ir a iniciar sesión
              </button>
            </div>
          )}

          {resetViewStatus === "ready" && (
            <form
              className="mt-5 space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                handleResetViewSubmit();
              }}
            >
              <label className="block text-[11px] font-bold text-gray-500">
                Nueva contraseña
                <div className="mt-1 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
                  <Key size={14} className="text-gray-400" />
                  <input
                    type="password"
                    value={resetViewPassword}
                    onChange={(event) =>
                      setResetViewPassword(event.target.value)
                    }
                    className="w-full text-sm font-semibold text-dm-dark outline-none placeholder:text-gray-400"
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                </div>
              </label>
              <label className="block text-[11px] font-bold text-gray-500">
                Repetí la contraseña
                <div className="mt-1 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
                  <Key size={14} className="text-gray-400" />
                  <input
                    type="password"
                    value={resetViewConfirm}
                    onChange={(event) =>
                      setResetViewConfirm(event.target.value)
                    }
                    className="w-full text-sm font-semibold text-dm-dark outline-none placeholder:text-gray-400"
                    placeholder="Confirmá la clave"
                    required
                  />
                </div>
              </label>
              {resetViewError && (
                <p className="text-[11px] font-semibold text-dm-alert">
                  {resetViewError}
                </p>
              )}
              <button
                type="submit"
                disabled={resetViewBusy}
                className="w-full rounded-full bg-dm-crimson px-4 py-2 text-xs font-bold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                {resetViewBusy ? "Guardando..." : "Guardar contraseña"}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <AppHeader
        brandLogo={BRAND_LOGO}
        bottomNavItems={bottomNavItems}
        activeBottomNav={activeBottomNav}
        isDesktopMenuOpen={isDesktopMenuOpen}
        onToggleDesktopMenu={() => setIsDesktopMenuOpen((prev) => !prev)}
        onCloseDesktopMenu={() => setIsDesktopMenuOpen(false)}
        userName={user.isLoggedIn ? user.name || "Cliente" : "Invitado"}
        isLoggedIn={user.isLoggedIn}
        onLogout={handleToggleClientLogin}
      />

      {effectiveViewMode === "CLIENT" &&
        !user.isLoggedIn &&
        showLoginPrompt && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-white/80 backdrop-blur-sm">
            <div className="w-[92%] max-w-sm rounded-2xl border border-dm-crimson/10 bg-gradient-to-b from-white via-white to-dm-light/40 p-4 shadow-[0_18px_48px_rgba(0,0,0,0.18)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-serif text-xl text-dm-dark">Ingreso</p>
                  <p className="mt-1 text-[11px] font-sans text-gray-500">
                    Accede a recordatorios, favoritos y reportes.
                  </p>
                </div>
                <button
                  onClick={handleContinueAsGuest}
                  className="rounded-full border border-gray-200 p-0.5 text-gray-400 hover:text-gray-600"
                  aria-label="Cerrar"
                >
                  <X size={12} />
                </button>
              </div>

              {loginStep === "ENTRY" && (
                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => setLoginStep("AUDIENCE")}
                    className="w-full rounded-full bg-dm-crimson px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-dm-crimson/90"
                  >
                    Ingresar
                  </button>
                  <button
                    onClick={openAudienceSelection}
                    className="w-full text-center text-[11px] font-semibold text-gray-500 hover:text-dm-crimson"
                  >
                    Registrarme
                  </button>
                </div>
              )}

              {loginStep === "AUDIENCE" && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setLoginMode("EMAIL");
                      setLoginAudience("SHOP");
                      setClientEmailMode("LOGIN");
                      setLoginError("");
                      setLoginStep("SHOP");
                    }}
                    className="flex h-full flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white px-3 py-3 text-center text-xs font-bold text-gray-600 hover:border-dm-crimson hover:text-dm-crimson"
                  >
                    <FaStore size={22} className="mb-2 text-dm-crimson" />
                    Soy tienda
                    <span className="mt-1 text-[10px] font-medium text-gray-400">
                      Acceso mayorista
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setLoginMode("GOOGLE");
                      setLoginAudience(null);
                      setLoginError("");
                      setLoginStep("CLIENT");
                    }}
                    className="flex h-full flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white px-3 py-3 text-center text-xs font-bold text-gray-600 hover:border-dm-crimson hover:text-dm-crimson"
                  >
                    <FaUser size={22} className="mb-2 text-dm-crimson" />
                    Soy cliente
                    <span className="mt-1 text-[10px] font-medium text-gray-400">
                      Comprar y seguir
                    </span>
                  </button>
                </div>
              )}

              {loginStep === "SHOP" && (
                <form
                  className="mt-3 space-y-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleEmailLogin();
                  }}
                >
                  <p className="text-[10px] font-medium text-gray-500">
                    Usá el correo registrado por el administrador.
                  </p>
                  <label className="block text-[10px] font-bold text-gray-500">
                    Correo electrónico
                    <div className="mt-1 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-1.5">
                      <Mail size={14} className="text-gray-400" />
                      <input
                        type="email"
                        value={loginEmail}
                        onChange={(event) => setLoginEmail(event.target.value)}
                        className="w-full text-[13px] font-semibold text-dm-dark outline-none placeholder:text-gray-400"
                        placeholder="correo de la tienda"
                        autoComplete="email"
                        required
                      />
                    </div>
                  </label>
                  <label className="block text-[10px] font-bold text-gray-500">
                    Contraseña
                    <div className="mt-1 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-1.5">
                      <Key size={14} className="text-gray-400" />
                      <input
                        type="password"
                        value={loginPassword}
                        onChange={(event) =>
                          setLoginPassword(event.target.value)
                        }
                        className="w-full text-[13px] font-semibold text-dm-dark outline-none placeholder:text-gray-400"
                        placeholder="Tu contraseña"
                        autoComplete="current-password"
                        required
                      />
                    </div>
                  </label>
                  {loginError && (
                    <p className="text-[11px] font-semibold text-dm-alert">
                      {loginError}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={loginBusy}
                    className="w-full rounded-full bg-dm-crimson px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-dm-crimson/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loginBusy ? "Ingresando..." : "Ingresar"}
                  </button>
                  <button
                    type="button"
                    disabled={resetBusy}
                    onClick={handlePasswordReset}
                    className="w-full text-center text-[10px] font-semibold text-gray-500 hover:text-dm-crimson disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {resetBusy ? "Enviando enlace..." : "Olvidé mi contraseña"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginStep("AUDIENCE")}
                    className="w-full text-center text-[10px] font-semibold text-gray-500 hover:text-dm-dark"
                  >
                    Volver
                  </button>
                </form>
              )}

              {loginStep === "CLIENT" && (
                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleGoogleLogin}
                      disabled={loginBusy}
                      className="flex h-full flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white px-3 py-3 text-center text-[10px] font-semibold text-gray-600 hover:border-dm-crimson hover:text-dm-crimson disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
                        <GoogleMark />
                      </span>
                      Continuar con tu cuenta de Google
                    </button>
                    <button
                      onClick={() => {
                        setLoginMode("EMAIL");
                        setLoginAudience(null);
                        setClientEmailMode("LOGIN");
                        setLoginError("");
                        setLoginStep("CLIENT_EMAIL");
                      }}
                      className="flex h-full flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white px-3 py-3 text-center text-[10px] font-semibold text-gray-600 hover:border-dm-crimson hover:text-dm-crimson"
                    >
                      <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-dm-crimson/10 text-dm-crimson">
                        <FaEnvelope size={18} />
                      </span>
                      Continuá con tu correo
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setLoginMode("EMAIL");
                      setLoginAudience(null);
                      setClientEmailMode("REGISTER");
                      setLoginError("");
                      setLoginStep("CLIENT_EMAIL");
                    }}
                    className="w-full text-center text-[11px] font-semibold text-gray-500 hover:text-dm-crimson"
                  >
                    Registrate
                  </button>
                  {loginError && (
                    <p className="text-[11px] font-semibold text-dm-alert">
                      {loginError}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => setLoginStep("AUDIENCE")}
                    className="w-full text-center text-[10px] font-semibold text-gray-500 hover:text-dm-dark"
                  >
                    Volver
                  </button>
                </div>
              )}

              {loginStep === "CLIENT_EMAIL" && (
                <form
                  className="mt-3 space-y-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (clientEmailMode === "REGISTER") {
                      handleEmailRegister();
                    } else {
                      handleEmailLogin();
                    }
                  }}
                >
                  <p className="text-[10px] font-medium text-gray-500">
                    {clientEmailMode === "REGISTER"
                      ? "Creando cuenta de cliente."
                      : "Ingresá con tu correo."}
                  </p>
                  <label className="block text-[10px] font-bold text-gray-500">
                    Correo electrónico
                    <div className="mt-1 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-1.5">
                      <Mail size={14} className="text-gray-400" />
                      <input
                        type="email"
                        value={loginEmail}
                        onChange={(event) => setLoginEmail(event.target.value)}
                        className="w-full text-[13px] font-semibold text-dm-dark outline-none placeholder:text-gray-400"
                        placeholder="tu@email.com"
                        autoComplete="email"
                        required
                      />
                    </div>
                  </label>
                  <label className="block text-[10px] font-bold text-gray-500">
                    Contraseña
                    <div className="mt-1 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-1.5">
                      <Key size={14} className="text-gray-400" />
                      <input
                        type="password"
                        value={loginPassword}
                        onChange={(event) =>
                          setLoginPassword(event.target.value)
                        }
                        className="w-full text-[13px] font-semibold text-dm-dark outline-none placeholder:text-gray-400"
                        placeholder="Tu contraseña"
                        autoComplete={
                          clientEmailMode === "REGISTER"
                            ? "new-password"
                            : "current-password"
                        }
                        required
                      />
                    </div>
                  </label>
                  {loginError && (
                    <p className="text-[11px] font-semibold text-dm-alert">
                      {loginError}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={loginBusy}
                    className="w-full rounded-full bg-dm-crimson px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-dm-crimson/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loginBusy
                      ? clientEmailMode === "REGISTER"
                        ? "Creando cuenta..."
                        : "Ingresando..."
                      : clientEmailMode === "REGISTER"
                      ? "Registrarme"
                      : "Ingresar"}
                  </button>
                  {clientEmailMode === "LOGIN" && (
                    <button
                      type="button"
                      disabled={resetBusy}
                      onClick={handlePasswordReset}
                      className="w-full text-center text-[10px] font-semibold text-gray-500 hover:text-dm-crimson disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {resetBusy
                        ? "Enviando enlace..."
                        : "Olvidé mi contraseña"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      setClientEmailMode((prev) =>
                        prev === "REGISTER" ? "LOGIN" : "REGISTER"
                      )
                    }
                    className="w-full text-center text-[10px] font-semibold text-gray-500 hover:text-dm-dark"
                  >
                    {clientEmailMode === "REGISTER"
                      ? "¿Ya tenés cuenta? Iniciá sesión"
                      : "Quiero registrarme"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginStep("CLIENT")}
                    className="w-full text-center text-[10px] font-semibold text-gray-500 hover:text-dm-dark"
                  >
                    Volver
                  </button>
                </form>
              )}

              <button
                onClick={handleContinueAsGuest}
                className="mt-4 w-full text-center text-[10px] font-semibold text-gray-500 hover:text-dm-dark"
              >
                Continuar como visitante
              </button>
            </div>
          </div>
        )}

      <AppFooterNav items={bottomNavItems} activeId={activeBottomNav} />

      {adminPreview && (
        <AdminPreviewBanner
          mode={adminPreview.mode === "MERCHANT" ? "MERCHANT" : "CLIENT"}
          shopName={adminPreview.mode === "MERCHANT" ? previewShop?.name : undefined}
          onExit={stopAdminPreview}
        />
      )}

      <main
        className={`${
          adminPreview ? "pt-24" : "pt-16"
        } pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-12`}
      >
        {effectiveViewMode === "CLIENT" ? (
          <ClientView
            activeBottomNav={activeBottomNav}
            activeFilter={activeFilter}
            savedTab={savedTab}
            shopQuery={shopQuery}
            filteredStreams={filteredStreams}
            sortedLiveStreams={sortedLiveStreams}
            activeReels={activeReels}
            filteredPublicShops={filteredPublicShops}
            filteredFavoriteShops={filteredFavoriteShops}
            reminderStreams={reminderStreams}
            selectedShopForModal={selectedShopForModal}
            selectedReel={selectedReel}
            shopModalTab={shopModalTab}
            user={user}
            canClientInteract={canClientInteract}
            renderShopCard={renderShopCard}
            onShopQueryChange={setShopQuery}
            onClearShopQuery={() => setShopQuery("")}
            onFilterChange={setActiveFilter}
            onSelectBottomNav={handleClientNav}
            onRefreshData={refreshData}
            onOpenShop={handleOpenShop}
            onViewReel={handleViewReel}
            onReport={handleReportStream}
            onToggleReminder={handleToggleReminder}
            onLike={handleLikeStream}
            onRate={handleRateStream}
            onDownloadCard={handleDownloadCard}
            onSetSavedTab={setSavedTab}
            onOpenShopModalTab={setShopModalTab}
            onCloseShopModal={() => setSelectedShopForModal(null)}
            onCloseReel={() => setSelectedReel(null)}
            onToggleFavorite={handleToggleFavorite}
            onRequireLogin={requireLogin}
            onLogout={handleToggleClientLogin}
            onNotify={notify}
            onOpenCalendarInvite={handleOpenCalendarInvite}
            streams={allStreams}
          />
        ) : effectiveViewMode === "MERCHANT" ? (
          <MerchantView
            currentShop={currentShop}
            streams={allStreams}
            onStreamCreate={handleStreamCreate}
            onStreamUpdate={handleStreamUpdate}
            onStreamDelete={handleStreamDelete}
            onShopUpdate={handleShopUpdate}
            onExtendStream={handleExtendStream}
            onBuyQuota={handleBuyQuota}
            onReelChange={refreshData}
            onRefreshData={refreshData}
            activeTab={merchantTab}
            onTabChange={syncMerchantTab}
            notifications={notifications}
            onMarkNotificationRead={handleMarkNotificationRead}
            onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
            isPreview={Boolean(adminPreview)}
          />
        ) : (
          <AdminView
            streams={allStreams}
            setStreams={setAllStreams}
            shops={allShops}
            setShops={setAllShops}
            onRefreshData={refreshData}
            activeTab={adminTab}
            onTabChange={setAdminTab}
            onPreviewClient={startAdminPreviewClient}
            onPreviewShop={startAdminPreviewShop}
            onShopUpdate={handleShopUpdate}
          />
        )}
      </main>

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

      {effectiveViewMode === "CLIENT" && (
        <AccountDrawer
          isOpen={isAccountDrawerOpen}
          user={user}
          userTypeLabel={formatUserType(authProfile?.userType)}
          accountTabs={accountTabs}
          activeTab={accountTab}
          notifications={notifications}
          unreadCount={unreadNotifications.length}
          reminderStreams={reminderStreams}
          formatNotificationDate={formatNotificationDate}
          onClose={() => setIsAccountDrawerOpen(false)}
          onTabChange={setAccountTab}
          onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
          onMarkNotificationRead={handleMarkNotificationRead}
          onNotificationAction={handleNotificationAction}
          onToggleReminder={handleToggleReminder}
          onOpenCalendarInvite={handleOpenCalendarInvite}
          onLogin={openAudienceSelection}
          onRegister={openClientRegister}
          onLogout={handleToggleClientLogin}
        />
      )}
    </div>
  );
};

export default App;
