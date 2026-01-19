import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Shop, Stream } from "../types";
import type { AdminTab, MerchantTab } from "../navigation";
import {
  ADMIN_TAB_CONFIG,
  MERCHANT_TAB_CONFIG,
  CLIENT_NAV_CONFIG,
  resolveAdminTabFromPath,
  resolveMerchantTabFromPath,
  resolveClientNavFromPath,
} from "../navigation";

type UseRoleRouteSyncArgs = {
  isResetView: boolean;
  adminPreview: { mode: string } | null;
  authUserType?: "ADMIN" | "SHOP" | "CLIENT" | null;
  locationPath: string;
  allShops: Shop[];
  allStreams: Stream[];
  selectedShopId: string | null;
  isAdminRoute: (path: string) => boolean;
  isShopRoute: (path: string) => boolean;
  getShopIdFromPath: (path: string) => string | null;
  getStreamIdFromPath: (path: string) => string | null;
  requireClientForRoute: (redirectPath?: string) => boolean;
  setAdminPreview: Dispatch<SetStateAction<{ mode: string } | null>>;
  setViewMode: (mode: "CLIENT" | "MERCHANT" | "ADMIN") => void;
  setActiveBottomNav: (id: string) => void;
  setAdminTab: (tab: AdminTab) => void;
  setMerchantTab: (tab: MerchantTab) => void;
  setActiveFilter: (value: string) => void;
  setSavedTab: (value: "FAVORITES" | "REMINDERS") => void;
  setShopModalTab: (tab: "INFO" | "CARD") => void;
  setSelectedShopForModal: (shop: Shop | null) => void;
  navigateTo: (path: string, replace?: boolean) => void;
};

export const useRoleRouteSync = ({
  isResetView,
  adminPreview,
  authUserType,
  locationPath,
  allShops,
  allStreams,
  selectedShopId,
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
}: UseRoleRouteSyncArgs) => {
  useEffect(() => {
    if (isResetView) return;
    const path = locationPath;
    if (adminPreview && isAdminRoute(path)) {
      setAdminPreview(null);
    }
    if (adminPreview) return;
    if (!authUserType) {
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
      if (!requireClientForRoute(`/tiendas/${shopIdFromPath}`)) {
        setSelectedShopForModal(null);
        setActiveBottomNav("home");
        navigateTo("/", true);
        return;
      }
      setActiveBottomNav("shops");
      const match = allShops.find((shop) => shop.id === shopIdFromPath);
      if (match && selectedShopId !== match.id) {
        setShopModalTab("INFO");
        setSelectedShopForModal(match);
      }
      return;
    }
    if (streamIdFromPath) {
      if (!requireClientForRoute(`/en-vivo/${streamIdFromPath}`)) {
        setSelectedShopForModal(null);
        setActiveBottomNav("home");
        navigateTo("/", true);
        return;
      }
      setActiveBottomNav("live");
      setActiveFilter("En Vivo");
      const streamMatch = allStreams.find(
        (stream) => stream.id === streamIdFromPath
      );
      if (streamMatch && streamMatch.shop && selectedShopId !== streamMatch.shop.id) {
        setShopModalTab("INFO");
        setSelectedShopForModal(streamMatch.shop);
      }
      return;
    }
    const clientNav = resolveClientNavFromPath(path);
    if (clientNav) {
      if (clientNav === "account") {
        setActiveBottomNav("account");
      } else {
        setActiveBottomNav(clientNav);
      }
      const clientConfig = CLIENT_NAV_CONFIG[clientNav];
      if (clientConfig.filter) setActiveFilter(clientConfig.filter);
      if (clientConfig.savedTab) setSavedTab(clientConfig.savedTab);
    } else {
      setActiveBottomNav("home");
      setActiveFilter("Todos");
    }
  }, [
    adminPreview,
    allShops,
    allStreams,
    authUserType,
    getShopIdFromPath,
    getStreamIdFromPath,
    isAdminRoute,
    isResetView,
    isShopRoute,
    locationPath,
    navigateTo,
    requireClientForRoute,
    selectedShopId,
    setActiveBottomNav,
    setActiveFilter,
    setAdminPreview,
    setAdminTab,
    setMerchantTab,
    setSavedTab,
    setSelectedShopForModal,
    setShopModalTab,
    setViewMode,
  ]);
};
