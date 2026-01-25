import { useCallback, useMemo } from "react";
import { FooterNavItem } from "../components/layout/AppFooterNav";
import { ViewMode } from "../types";
import {
  AdminTab,
  AdminNavId,
  MerchantTab,
  MerchantNavId,
  ClientNavId,
  CLIENT_NAV_CONFIG,
  ADMIN_NAV_TO_TAB,
  ADMIN_TAB_CONFIG,
  MERCHANT_NAV_TO_TAB,
  MERCHANT_TAB_CONFIG,
  CLIENT_NAV_ITEMS,
  ADMIN_NAV_ITEMS,
  MERCHANT_NAV_ITEMS,
} from "../navigation";
import {
  User,
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
  MapPin,
  Menu,
} from "lucide-react";

type UseRoleNavigationArgs = {
  userIsLoggedIn: boolean;
  isAdminUser: boolean;
  isMerchantUser: boolean;
  reminderBadgeCount: number;
  accountBadgeCount: number;
  setHasBottomNavInteraction: (value: boolean) => void;
  setShowLoginPrompt: (value: boolean) => void;
  setViewMode: (mode: ViewMode) => void;
  postLoginRedirect: React.MutableRefObject<string | null>;
  openLoginModal: () => void;
  setActiveBottomNav: (id: string) => void;
  setActiveFilter: (value: string) => void;
  setSavedTab: (value: "FAVORITES" | "REMINDERS") => void;
  setAdminTab: (tab: AdminTab) => void;
  setMerchantTab: (tab: MerchantTab) => void;
  navigateTo: (path: string, replace?: boolean) => void;
};

export const useRoleNavigation = ({
  userIsLoggedIn,
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
}: UseRoleNavigationArgs) => {
  const handleClientNav = useCallback(
    (id: ClientNavId) => {
      setHasBottomNavInteraction(true);
      setShowLoginPrompt(false);
      setViewMode("CLIENT");
      if (id !== "account") {
        postLoginRedirect.current = null;
      }
      if (id === "account" && !userIsLoggedIn) {
        postLoginRedirect.current = "/cuenta";
        openLoginModal();
        return;
      }
      const config = CLIENT_NAV_CONFIG[id];
      if (!config) return;
      const nextNav = config.navId ?? id;
      setActiveBottomNav(nextNav);
      navigateTo(config.path);
      if (config.filter) setActiveFilter(config.filter);
      if (config.savedTab) setSavedTab(config.savedTab);
      if (id === "account" && !userIsLoggedIn) {
        openLoginModal();
      }
    },
    [
      navigateTo,
      openLoginModal,
      postLoginRedirect,
      setActiveBottomNav,
      setActiveFilter,
      setHasBottomNavInteraction,
      setSavedTab,
      setShowLoginPrompt,
      setViewMode,
      userIsLoggedIn,
    ]
  );

  const handleAdminNav = useCallback(
    (id: AdminNavId) => {
      setViewMode("ADMIN");
      const nextTab = ADMIN_NAV_TO_TAB[id] || "DASHBOARD";
      const nextConfig = ADMIN_TAB_CONFIG[nextTab];
      setAdminTab(nextTab);
      setActiveBottomNav(nextConfig.navId);
      navigateTo(nextConfig.path);
    },
    [navigateTo, setActiveBottomNav, setAdminTab, setViewMode]
  );

  const syncAdminTab = useCallback(
    (tab: AdminTab) => {
      setAdminTab(tab);
      const nextConfig = ADMIN_TAB_CONFIG[tab];
      setActiveBottomNav(nextConfig.navId);
      navigateTo(nextConfig.path);
    },
    [navigateTo, setActiveBottomNav, setAdminTab]
  );

  const handleMerchantNav = useCallback(
    (id: MerchantNavId) => {
      setViewMode("MERCHANT");
      const nextTab = MERCHANT_NAV_TO_TAB[id] || "RESUMEN";
      const nextConfig = MERCHANT_TAB_CONFIG[nextTab];
      setMerchantTab(nextTab);
      setActiveBottomNav(nextConfig.navId);
      navigateTo(nextConfig.path);
    },
    [navigateTo, setActiveBottomNav, setMerchantTab, setViewMode]
  );

  const syncMerchantTab = useCallback(
    (tab: MerchantTab) => {
      setMerchantTab(tab);
      const nextConfig = MERCHANT_TAB_CONFIG[tab];
      setActiveBottomNav(nextConfig.navId);
      navigateTo(nextConfig.path);
    },
    [navigateTo, setActiveBottomNav, setMerchantTab]
  );

  const CLIENT_NAV_ICONS: Record<ClientNavId, typeof Home> = {
    home: Home,
    shops: Store,
    live: Radio,
    map: MapPin,
    reminders: Clock,
    favorites: Heart,
    account: User,
  };
  const ADMIN_NAV_ICONS: Record<AdminNavId, typeof Home> = {
    panel: Shield,
    shops: Store,
    streams: Radio,
    purchases: Receipt,
    reports: AlertTriangle,
  };
  const MERCHANT_NAV_ICONS: Record<MerchantNavId, typeof Home> = {
    resumen: Home,
    redes: Globe,
    vivos: Radio,
    reels: Film,
    perfil: Store,
  };

  const bottomNavItems: FooterNavItem[] = useMemo(() => {
    if (isAdminUser) {
      return ADMIN_NAV_ITEMS.map((item) => ({
        id: item.id,
        label: item.label,
        icon: ADMIN_NAV_ICONS[item.id],
        isCenter: item.isCenter,
        onSelect: () => handleAdminNav(item.id),
      }));
    }
    if (isMerchantUser) {
      return MERCHANT_NAV_ITEMS.map((item) => ({
        id: item.id,
        label: item.label,
        icon: MERCHANT_NAV_ICONS[item.id],
        isCenter: item.isCenter,
        onSelect: () => handleMerchantNav(item.id),
      }));
    }
    return CLIENT_NAV_ITEMS.map((item) => ({
      id: item.id,
      label:
        item.id === "account"
          ? userIsLoggedIn
            ? "Mi cuenta"
            : "Ingresar"
          : item.label,
      icon:
        item.id === "account" && userIsLoggedIn
          ? Menu
          : CLIENT_NAV_ICONS[item.id],
      isCenter: item.isCenter,
      onSelect: () => handleClientNav(item.id),
      badge:
        item.id === "reminders"
          ? reminderBadgeCount
          : item.id === "account"
          ? accountBadgeCount
          : undefined,
    }));
  }, [
    accountBadgeCount,
    handleAdminNav,
    handleClientNav,
    handleMerchantNav,
    isAdminUser,
    isMerchantUser,
    reminderBadgeCount,
    userIsLoggedIn,
  ]);

  return {
    handleClientNav,
    handleAdminNav,
    handleMerchantNav,
    syncAdminTab,
    syncMerchantTab,
    bottomNavItems,
  };
};
