import React, { useState, useEffect, useMemo } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
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
import { AppHeader } from "./components/layout/AppHeader";
import { AppFooterNav } from "./components/layout/AppFooterNav";
import { AccountDrawer } from "./components/layout/AccountDrawer";
import { AdminPreviewBanner } from "./components/layout/AdminPreviewBanner";
import { AuthModal } from "./components/layout/AuthModal";
import { ClientLayout } from "./components/layout/ClientLayout";
import { AdminLayout } from "./components/layout/AdminLayout";
import { MerchantLayout } from "./components/layout/MerchantLayout";
import { ClientShopSearchBar } from "./components/pages/client/ClientShopSearchBar";
import { ShopCard } from "./components/ShopCard";
import { ResetView } from "./components/layout/ResetView";
import { ClientView } from "./components/views/ClientView";
import { MerchantView } from "./components/views/MerchantView";
import { AdminView } from "./components/views/AdminView";
import { api } from "./services/api";
import {
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
} from "lucide-react";
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


type AdminTab =
  | "DASHBOARD"
  | "AGENDA"
  | "STREAMS"
  | "SHOPS"
  | "REELS"
  | "ADMIN"
  | "REPORTS";
type MerchantTab = "RESUMEN" | "VIVOS" | "REELS" | "REDES" | "PERFIL";
type ClientNavId =
  | "home"
  | "shops"
  | "live"
  | "reminders"
  | "account"
  | "favorites";
type AdminNavId = "panel" | "shops" | "streams" | "purchases" | "reports";
type MerchantNavId = "resumen" | "vivos" | "reels" | "redes" | "perfil";

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

const MOCK_REEL_COUNT = 10;
const MOCK_REEL_TTL_HOURS = 2;
const MOCK_STREAM_COUNT = 10;
const DAILY_MOCK_SEED = new Date().toLocaleDateString("en-CA");

const createSeededRandom = (seed: string) => {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return () => {
    hash += 0x6d2b79f5;
    let t = Math.imul(hash ^ (hash >>> 15), 1 | hash);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const shuffleWithSeed = <T,>(items: T[], seed: string) => {
  const rng = createSeededRandom(seed);
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const normalizeInstagramUrl = (value?: string) => {
  if (!value) return "";
  if (value.startsWith("http")) return value;
  return `https://instagram.com/${value.replace("@", "")}`;
};

const buildMapsUrl = (shop: Shop) => {
  if (shop.addressDetails?.mapsUrl) return shop.addressDetails.mapsUrl;
  const addressParts = [
    shop.address,
    shop.addressDetails?.street,
    shop.addressDetails?.number,
    shop.addressDetails?.city,
    shop.addressDetails?.province,
  ].filter(Boolean);
  const query = addressParts.length > 0 ? addressParts.join(" ") : shop.name;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
};

const resolveCatalogUrl = (shop: Shop) =>
  shop.website || normalizeInstagramUrl(shop.socialHandles?.instagram);

const buildMockStreams = (shops: Shop[], streams: Stream[], count: number) => {
  if (shops.length === 0) return [];
  const usedShopIds = new Set(streams.map((stream) => stream.shopId));
  const candidates = shops.filter((shop) => !usedShopIds.has(shop.id));
  const shuffled = shuffleWithSeed(candidates, `${DAILY_MOCK_SEED}-streams`);
  const liveCount = Math.min(3, count);
  const upcomingCount = Math.min(4, count - liveCount);
  const finishedCount = Math.max(count - liveCount - upcomingCount, 0);
  const dayBase = new Date();
  dayBase.setHours(9, 0, 0, 0);
  const baseTime = dayBase.getTime();

  return shuffled.slice(0, count).map((shop, index) => {
    const isLive = index < liveCount;
    const isUpcoming = index >= liveCount && index < liveCount + upcomingCount;
    const isFinished = index >= liveCount + upcomingCount;
    const slotOffset = isLive
      ? index * 15 * 60 * 1000
      : isUpcoming
        ? (index + 1) * 60 * 60 * 1000
        : -1 * (index - liveCount - upcomingCount + 1) * 90 * 60 * 1000;
    const streamTime = new Date(baseTime + slotOffset);
    const scheduledTime = streamTime.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const rng = createSeededRandom(`${DAILY_MOCK_SEED}-stream-${shop.id}`);
    const likes = Math.floor(rng() * 40) + 5;
    const views = Math.floor(rng() * 180) + 20;
    const status = isLive
      ? StreamStatus.LIVE
      : isUpcoming
        ? StreamStatus.UPCOMING
        : StreamStatus.FINISHED;
    return {
      id: `mock-stream-${shop.id}`,
      shop,
      shopId: shop.id,
      title: isLive
        ? `Vivo de ${shop.name}`
        : isUpcoming
          ? `Próximo vivo de ${shop.name}`
          : `Vivo finalizado de ${shop.name}`,
      coverImage: shop.coverUrl || shop.logoUrl,
      status,
      extensionCount: 0,
      scheduledTime,
      fullDateISO: streamTime.toISOString(),
      startedAt: isLive ? streamTime.getTime() - 5 * 60 * 1000 : undefined,
      platform: "Instagram",
      url: resolveCatalogUrl(shop) || "https://www.distritomoda.com.ar",
      views,
      reportCount: 0,
      isVisible: true,
      likes,
      rating: shop.ratingAverage || 5,
    };
  });
};

const enrichReelsWithShop = (reels: Reel[], shops: Shop[]) =>
  reels.map((reel) => {
    const shop = shops.find((item) => item.id === reel.shopId);
    return {
      ...reel,
      thumbnail: reel.thumbnail || shop?.coverUrl || shop?.logoUrl,
      shopMapsUrl: shop ? buildMapsUrl(shop) : reel.shopMapsUrl,
      shopCatalogUrl: shop ? resolveCatalogUrl(shop) : reel.shopCatalogUrl,
    };
  });

const buildMockReels = (shops: Shop[], reels: Reel[], targetCount: number) => {
  const usedShopIds = new Set(reels.map((reel) => reel.shopId));
  const candidates = shops.filter((shop) => !usedShopIds.has(shop.id));
  const shuffled = shuffleWithSeed(candidates, `${DAILY_MOCK_SEED}-reels`);
  const count = Math.min(targetCount, shuffled.length);
  const now = Date.now();

  return shuffled.slice(0, count).map((shop, index) => ({
    id: `mock-${shop.id}`,
    shopId: shop.id,
    shopName: shop.name,
    shopLogo: shop.logoUrl,
    url: resolveCatalogUrl(shop) || "https://www.distritomoda.com.ar",
    thumbnail: shop.coverUrl || shop.logoUrl,
    createdAtISO: new Date(now - index * 1000).toISOString(),
    expiresAtISO: new Date(now + MOCK_REEL_TTL_HOURS * 60 * 60 * 1000).toISOString(),
    status: "ACTIVE",
    origin: "PLAN",
    platform: "Instagram",
    views: Math.floor(createSeededRandom(`${DAILY_MOCK_SEED}-reel-${shop.id}`)() * 120) + 1,
    shopMapsUrl: buildMapsUrl(shop),
    shopCatalogUrl: resolveCatalogUrl(shop),
  }));
};

const CLIENT_NAV_CONFIG: Record<
  ClientNavId,
  {
    path: string;
    navId?: ClientNavId;
    filter?: "Todos" | "En Vivo";
    savedTab?: "FAVORITES" | "REMINDERS";
    openDrawer?: boolean;
    accountTab?: "RESUMEN" | "NOTIFICATIONS" | "REMINDERS";
  }
> = {
  home: { path: "/", filter: "Todos" },
  shops: { path: "/tiendas" },
  live: { path: "/en-vivo", filter: "En Vivo" },
  reminders: { path: "/recordatorios", savedTab: "REMINDERS" },
  favorites: { path: "/favoritos", savedTab: "FAVORITES", navId: "reminders" },
  account: { path: "/cuenta", openDrawer: true, accountTab: "RESUMEN" },
};

const CLIENT_PATH_TO_NAV: Record<string, ClientNavId> = {
  "/": "home",
  "/tiendas": "shops",
  "/en-vivo": "live",
  "/recordatorios": "reminders",
  "/favoritos": "favorites",
  "/cuenta": "account",
};

const ADMIN_NAV_TO_TAB: Record<AdminNavId, AdminTab> = {
  panel: "DASHBOARD",
  shops: "SHOPS",
  streams: "STREAMS",
  purchases: "ADMIN",
  reports: "REPORTS",
};

const ADMIN_TAB_CONFIG: Record<
  AdminTab,
  { path: string; navId: AdminNavId }
> = {
  DASHBOARD: { path: "/admin", navId: "panel" },
  AGENDA: { path: "/admin/agenda", navId: "panel" },
  STREAMS: { path: "/admin/vivos", navId: "streams" },
  SHOPS: { path: "/admin/tiendas", navId: "shops" },
  REELS: { path: "/admin/reels", navId: "panel" },
  ADMIN: { path: "/admin/compras", navId: "purchases" },
  REPORTS: { path: "/admin/reportes", navId: "reports" },
};

const MERCHANT_NAV_TO_TAB: Record<MerchantNavId, MerchantTab> = {
  resumen: "RESUMEN",
  vivos: "VIVOS",
  reels: "REELS",
  redes: "REDES",
  perfil: "PERFIL",
};

const MERCHANT_TAB_CONFIG: Record<
  MerchantTab,
  { path: string; navId: MerchantNavId }
> = {
  RESUMEN: { path: "/tienda", navId: "resumen" },
  VIVOS: { path: "/tienda/vivos", navId: "vivos" },
  REELS: { path: "/tienda/reels", navId: "reels" },
  REDES: { path: "/tienda/redes", navId: "redes" },
  PERFIL: { path: "/tienda/perfil", navId: "perfil" },
};

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
  const [isLoading, setIsLoading] = useState(true);
  const [activeBottomNav, setActiveBottomNav] = useState("home");
  const [adminTab, setAdminTab] = useState<AdminTab>("DASHBOARD");
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
    location.pathname.startsWith("/reset") ||
    new URLSearchParams(location.search).get("mode") === "resetPassword";

  // --- Estado central / Central state ---
  const [allShops, setAllShops] = useState<Shop[]>([]);
  const [allStreams, setAllStreams] = useState<Stream[]>([]);
  const [activeReels, setActiveReels] = useState<Reel[]>([]);

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
  const [isAccountDrawerOpen, setIsAccountDrawerOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [accountTab, setAccountTab] = useState<
    "RESUMEN" | "NOTIFICATIONS" | "REMINDERS"
  >("RESUMEN");
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
  const getIdFromPath = (path: string, prefix: string) => {
    if (!path.startsWith(prefix)) return null;
    const rest = path.slice(prefix.length);
    const id = rest.split("/").filter(Boolean)[0];
    return id || null;
  };
  const getShopIdFromPath = (path: string) => getIdFromPath(path, "/tiendas/");
  const getStreamIdFromPath = (path: string) =>
    getIdFromPath(path, "/en-vivo/");
  const resolveAdminTabFromPath = (path: string): AdminTab => {
    if (path.startsWith("/admin/tiendas")) return "SHOPS";
    if (path.startsWith("/admin/vivos")) return "STREAMS";
    if (path.startsWith("/admin/agenda")) return "AGENDA";
    if (path.startsWith("/admin/reels")) return "REELS";
    if (path.startsWith("/admin/compras")) return "ADMIN";
    if (path.startsWith("/admin/reportes")) return "REPORTS";
    return "DASHBOARD";
  };
  const resolveMerchantTabFromPath = (path: string): MerchantTab => {
    if (path.startsWith("/tienda/vivos")) return "VIVOS";
    if (path.startsWith("/tienda/reels")) return "REELS";
    if (path.startsWith("/tienda/redes")) return "REDES";
    if (path.startsWith("/tienda/perfil")) return "PERFIL";
    return "RESUMEN";
  };
  const resolveClientNavFromPath = (path: string): ClientNavId | null =>
    CLIENT_PATH_TO_NAV[path] || null;
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
  const refreshData = async () => {
    try {
      const [shops, streams, reels] = await Promise.all([
        api.fetchShops(),
        api.fetchStreams(),
        api.fetchReels(),
      ]);

      const enrichedReels = enrichReelsWithShop(reels, shops);
      const mockReels = buildMockReels(shops, enrichedReels, MOCK_REEL_COUNT);
      const activeOnly = [...enrichedReels, ...mockReels].filter(
        (reel) => new Date(reel.expiresAtISO).getTime() > Date.now()
      );

      setAllShops(shops);
      setAllStreams(streams);
      setActiveReels(activeOnly);

      // Inicializa currentShopId si esta vacio y hay tiendas.
      // Initialize currentShopId when empty and shops exist.
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
    const timer = window.setInterval(() => {
      setActiveReels((prev) =>
        prev.filter((reel) => new Date(reel.expiresAtISO).getTime() > Date.now())
      );
    }, 60_000);
    return () => window.clearInterval(timer);
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

  // --- Ciclo automatico se maneja en backend ---
  // Auto lifecycle handled by backend.

  // --- Acciones de negocio / Business actions ---

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
      console.error("Error iniciando sesión:", error);
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
        console.error("Error cerrando sesión:", error);
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
    navigateTo(`/tiendas/${stream.shop.id}`);
  };

  const handleOpenShop = (shop: Shop, options?: { navigate?: boolean }) => {
    setShopModalTab("INFO");
    setSelectedShopForModal(shop);
    setActiveShopCardId(null);
    const shouldNavigate =
      options?.navigate ?? effectiveViewMode === "CLIENT";
    if (shouldNavigate) {
      navigateTo(`/tiendas/${shop.id}`);
    }
    if (user.isLoggedIn && authProfile?.userType === "CLIENT") {
      pushHistory(`Visitaste: ${shop.name}`);
    }
  };

  const handleViewReel = (reel: Reel) => {
    const isMockReel = reel.id.startsWith("mock-");
    setSelectedReel(reel);
    if (user.isLoggedIn && authProfile?.userType === "CLIENT") {
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
  const liveStreams = streamSource.filter(
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
  const filteredStreams = getFilteredStreams(streamSource);
  const queueStreamsSource = streamSource;
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
  const renderShopCard = (shop: Shop) => (
    <ShopCard
      key={shop.id}
      shop={shop}
      isActive={activeShopCardId === shop.id}
      onToggleActive={toggleShopCard}
      onOpenShop={handleOpenShop}
      onKeyDown={handleShopCardKeyDown}
    />
  );

  useEffect(() => {
    if (isResetView) return;
    const path = location.pathname;
    if (adminPreview && isAdminRoute(path)) {
      setAdminPreview(null);
    }
    if (adminPreview) return;
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
      const nextTab = resolveAdminTabFromPath(path);
      const nextConfig = ADMIN_TAB_CONFIG[nextTab];
      setAdminTab(nextTab);
      setActiveBottomNav(nextConfig.navId);
      return;
    }
    if (isShopRoute(path)) {
      setViewMode("MERCHANT");
      const nextTab = resolveMerchantTabFromPath(path);
      const nextConfig = MERCHANT_TAB_CONFIG[nextTab];
      setMerchantTab(nextTab);
      setActiveBottomNav(nextConfig.navId);
      return;
    }
    setViewMode("CLIENT");
    const shopIdFromPath = getShopIdFromPath(path);
    const streamIdFromPath = getStreamIdFromPath(path);
    if (shopIdFromPath) {
      setActiveBottomNav("shops");
      const match = allShops.find((shop) => shop.id === shopIdFromPath);
      if (match && selectedShopForModal?.id !== match.id) {
        setShopModalTab("INFO");
        setSelectedShopForModal(match);
      }
      return;
    }
    if (streamIdFromPath) {
      setActiveBottomNav("live");
      setActiveFilter("En Vivo");
      const streamMatch = allStreams.find((stream) => stream.id === streamIdFromPath);
      if (streamMatch && selectedShopForModal?.id !== streamMatch.shop.id) {
        setShopModalTab("INFO");
        setSelectedShopForModal(streamMatch.shop);
      }
      return;
    }
    const clientNav = resolveClientNavFromPath(path);
    if (clientNav) {
      const clientConfig = CLIENT_NAV_CONFIG[clientNav];
      setActiveBottomNav(clientConfig.navId ?? clientNav);
      if (clientConfig.filter) setActiveFilter(clientConfig.filter);
      if (clientConfig.savedTab) setSavedTab(clientConfig.savedTab);
      if (clientConfig.openDrawer) {
        setAccountTab(clientConfig.accountTab || "RESUMEN");
        setIsAccountDrawerOpen(true);
      }
    } else {
      setActiveBottomNav("home");
      setActiveFilter("Todos");
    }
    if (path !== "/cuenta" && isAccountDrawerOpen) {
      setIsAccountDrawerOpen(false);
    }
  }, [
    location.pathname,
    adminPreview,
    isResetView,
    authProfile?.userType,
    allShops,
    allStreams,
    selectedShopForModal?.id,
  ]);

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
    const config = CLIENT_NAV_CONFIG[id as ClientNavId];
    if (!config) return;
    const nextNav = config.navId ?? id;
    setActiveBottomNav(nextNav);
    navigateTo(config.path);
    if (config.filter) setActiveFilter(config.filter);
    if (config.savedTab) setSavedTab(config.savedTab);
    if (config.openDrawer) {
      setIsAccountDrawerOpen(true);
      setAccountTab(config.accountTab || "RESUMEN");
      void refreshNotifications(authProfile);
    }
  };

  const handleAdminNav = (id: AdminNavId) => {
    setViewMode("ADMIN");
    const nextTab = ADMIN_NAV_TO_TAB[id] || "DASHBOARD";
    const nextConfig = ADMIN_TAB_CONFIG[nextTab];
    setAdminTab(nextTab);
    setActiveBottomNav(nextConfig.navId);
    navigateTo(nextConfig.path);
  };

  const syncAdminTab = (tab: AdminTab) => {
    setAdminTab(tab);
    const nextConfig = ADMIN_TAB_CONFIG[tab];
    setActiveBottomNav(nextConfig.navId);
    navigateTo(nextConfig.path);
  };

  const handleMerchantNav = (id: MerchantNavId) => {
    setViewMode("MERCHANT");
    const nextTab = MERCHANT_NAV_TO_TAB[id] || "RESUMEN";
    const nextConfig = MERCHANT_TAB_CONFIG[nextTab];
    setMerchantTab(nextTab);
    setActiveBottomNav(nextConfig.navId);
    navigateTo(nextConfig.path);
  };

  const syncMerchantTab = (tab: MerchantTab) => {
    setMerchantTab(tab);
    const nextConfig = MERCHANT_TAB_CONFIG[tab];
    setActiveBottomNav(nextConfig.navId);
    navigateTo(nextConfig.path);
  };

  const isAdminUser = effectiveUserType === "ADMIN";
  const isMerchantUser = effectiveUserType === "SHOP";
  const canAccessAdminRoute = authProfile?.userType === "ADMIN";
  const canAccessShopRoute =
    authProfile?.userType === "SHOP" || adminPreview?.mode === "MERCHANT";
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

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Routes>
        <Route
          path="/admin/*"
          element={
            canAccessAdminRoute ? (
              <AdminLayout
                header={
                  <AppHeader
                    brandLogo={BRAND_LOGO}
                    bottomNavItems={bottomNavItems}
                    activeBottomNav={activeBottomNav}
                    isDesktopMenuOpen={isDesktopMenuOpen}
                    onToggleDesktopMenu={() =>
                      setIsDesktopMenuOpen((prev) => !prev)
                    }
                    onCloseDesktopMenu={() => setIsDesktopMenuOpen(false)}
                    userName={user.isLoggedIn ? user.name || "Admin" : "Admin"}
                    isLoggedIn={user.isLoggedIn}
                    onLogout={handleToggleClientLogin}
                  />
                }
                footer={
                  <AppFooterNav
                    items={bottomNavItems}
                    activeId={activeBottomNav}
                  />
                }
              >
                <AdminView
                  streams={allStreams}
                  setStreams={setAllStreams}
                  shops={allShops}
                  setShops={setAllShops}
                  onRefreshData={refreshData}
                  activeTab={adminTab}
                  onTabChange={syncAdminTab}
                  onPreviewClient={startAdminPreviewClient}
                  onPreviewShop={startAdminPreviewShop}
                  onShopUpdate={handleShopUpdate}
                />
              </AdminLayout>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/tienda/*"
          element={
            canAccessShopRoute ? (
              <MerchantLayout
                header={
                  <AppHeader
                    brandLogo={BRAND_LOGO}
                    bottomNavItems={bottomNavItems}
                    activeBottomNav={activeBottomNav}
                    isDesktopMenuOpen={isDesktopMenuOpen}
                    onToggleDesktopMenu={() =>
                      setIsDesktopMenuOpen((prev) => !prev)
                    }
                    onCloseDesktopMenu={() => setIsDesktopMenuOpen(false)}
                    userName={currentShop?.name || user.name || "Tienda"}
                    isLoggedIn={user.isLoggedIn}
                    onLogout={handleToggleClientLogin}
                  />
                }
                footer={
                  <AppFooterNav
                    items={bottomNavItems}
                    activeId={activeBottomNav}
                  />
                }
                previewBanner={
                  adminPreview ? (
                    <AdminPreviewBanner
                      mode="MERCHANT"
                      shopName={previewShop?.name}
                      onExit={stopAdminPreview}
                    />
                  ) : null
                }
              >
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
              </MerchantLayout>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/*"
          element={
              <ClientLayout
                header={
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
                }
                headerAccessory={
                  isClientShopRoute ? (
                    <ClientShopSearchBar
                      shopQuery={shopQuery}
                      onShopQueryChange={setShopQuery}
                      onClearShopQuery={() => setShopQuery("")}
                    />
                  ) : null
                }
                authModal={
                  <AuthModal
                    isOpen={
                      effectiveViewMode === "CLIENT" && !user.isLoggedIn && showLoginPrompt
                    }
                  loginStep={loginStep}
                  clientEmailMode={clientEmailMode}
                  loginEmail={loginEmail}
                  loginPassword={loginPassword}
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
                  onSetLoginEmail={setLoginEmail}
                  onSetLoginPassword={setLoginPassword}
                  onSetLoginError={setLoginError}
                />
              }
              footer={<AppFooterNav items={bottomNavItems} activeId={activeBottomNav} />}
              previewBanner={
                adminPreview ? (
                  <AdminPreviewBanner
                    mode={adminPreview.mode === "MERCHANT" ? "MERCHANT" : "CLIENT"}
                    shopName={adminPreview.mode === "MERCHANT" ? previewShop?.name : undefined}
                    onExit={stopAdminPreview}
                  />
                ) : null
              }
              isPreview={Boolean(adminPreview)}
              hideChrome={isLiveQueueOpen}
            >
                <ClientView
                  activeBottomNav={activeBottomNav}
                  activeFilter={activeFilter}
                  savedTab={savedTab}
                  filteredStreams={filteredStreams}
                  sortedLiveStreams={sortedLiveStreams}
                  activeReels={activeReels}
                  featuredShops={featuredShops}
                  filteredPublicShops={filteredPublicShops}
                filteredFavoriteShops={filteredFavoriteShops}
                reminderStreams={reminderStreams}
                selectedShopForModal={selectedShopForModal}
                selectedReel={selectedReel}
                shopModalTab={shopModalTab}
                  user={user}
                  canClientInteract={canClientInteract}
                  renderShopCard={renderShopCard}
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
                onCloseShopModal={() => {
                  setSelectedShopForModal(null);
                  if (location.pathname.startsWith("/tiendas/")) {
                    navigateTo("/tiendas", true);
                  }
                  if (location.pathname.startsWith("/en-vivo/")) {
                    navigateTo("/en-vivo", true);
                  }
                }}
                onCloseReel={() => setSelectedReel(null)}
                onToggleFavorite={handleToggleFavorite}
                onRequireLogin={requireLogin}
                onOpenLogin={openAudienceSelection}
                onLogout={handleToggleClientLogin}
                onNotify={notify}
                onOpenCalendarInvite={handleOpenCalendarInvite}
                onQueueModalChange={setIsLiveQueueOpen}
                streams={allStreams}
                queueStreamsSource={queueStreamsSource}
              />
            </ClientLayout>
          }
        />
      </Routes>

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
