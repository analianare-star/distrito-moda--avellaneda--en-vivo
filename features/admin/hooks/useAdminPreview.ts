import { useCallback } from "react";
import type { ViewMode } from "../../../types";
import type { AdminTab, MerchantTab } from "../../../navigation";

type NoticePayload = {
  title: string;
  message: string;
  tone?: "info" | "success" | "warning" | "error";
};

type AdminPreviewState = {
  mode: ViewMode;
  shopId?: string;
} | null;

type UseAdminPreviewArgs = {
  adminPreview: AdminPreviewState;
  isAdminOverride: boolean;
  setAdminPreview: (value: AdminPreviewState) => void;
  setViewMode: (mode: ViewMode) => void;
  setActiveBottomNav: (value: string) => void;
  setAdminTab: (tab: AdminTab) => void;
  setMerchantTab: (tab: MerchantTab) => void;
  setCurrentShopId: (id: string) => void;
  setLoginPromptDismissed: (value: boolean) => void;
  setShowLoginPrompt: (value: boolean) => void;
  navigateTo: (path: string, replace?: boolean) => void;
  setNotice: (payload: NoticePayload) => void;
};

export const useAdminPreview = ({
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
}: UseAdminPreviewArgs) => {
  const startAdminPreviewClient = useCallback(() => {
    setAdminPreview({ mode: "CLIENT" });
    setViewMode("CLIENT");
    setActiveBottomNav("home");
    setLoginPromptDismissed(true);
    setShowLoginPrompt(false);
    navigateTo("/");
  }, [
    navigateTo,
    setActiveBottomNav,
    setAdminPreview,
    setLoginPromptDismissed,
    setShowLoginPrompt,
    setViewMode,
  ]);

  const startAdminPreviewShop = useCallback(
    (shopId: string) => {
      setAdminPreview({ mode: "MERCHANT", shopId });
      setViewMode("MERCHANT");
      setCurrentShopId(shopId);
      setMerchantTab("RESUMEN");
      setActiveBottomNav("resumen");
      navigateTo("/tienda");
    },
    [
      navigateTo,
      setActiveBottomNav,
      setAdminPreview,
      setCurrentShopId,
      setMerchantTab,
      setViewMode,
    ]
  );

  const stopAdminPreview = useCallback(() => {
    setAdminPreview(null);
    setViewMode("ADMIN");
    setActiveBottomNav("panel");
    setAdminTab("DASHBOARD");
    navigateTo("/admin");
  }, [navigateTo, setActiveBottomNav, setAdminPreview, setAdminTab, setViewMode]);

  const blockPreviewAction = useCallback(
    (message = "Accion bloqueada en modo vista tecnica.") => {
      if (!adminPreview || isAdminOverride) return false;
      setNotice({
        title: "Modo vista",
        message,
        tone: "warning",
      });
      return true;
    },
    [adminPreview, isAdminOverride, setNotice]
  );

  return {
    startAdminPreviewClient,
    startAdminPreviewShop,
    stopAdminPreview,
    blockPreviewAction,
  };
};
