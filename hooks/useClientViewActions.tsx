import { useCallback } from "react";
import { api } from "../services/api";
import { ShopCard } from "../components/ShopCard";
import { Reel, Shop, Stream, UserContext, ViewMode } from "../types";

type UseClientViewActionsArgs = {
  effectiveViewMode: ViewMode;
  effectiveUserType?: "ADMIN" | "SHOP" | "CLIENT";
  isClientSession: boolean;
  user: UserContext;
  activeShopCardId: string | null;
  setActiveShopCardId: (value: string | null) => void;
  setSelectedShopForModal: (shop: Shop | null) => void;
  setShopModalTab: (tab: "INFO" | "CARD") => void;
  setSelectedReel: (reel: Reel | null) => void;
  setUser: (updater: (prev: UserContext) => UserContext) => void;
  pushHistory: (label: string) => void;
  requireClientForRoute: (redirectPath?: string) => boolean;
  requireLogin: () => void;
  navigateTo: (path: string, replace?: boolean) => void;
  canClientInteract: boolean;
};

export const useClientViewActions = ({
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
}: UseClientViewActionsArgs) => {
  const handleOpenShop = useCallback(
    (shop: Shop, options?: { navigate?: boolean }) => {
      if (!requireClientForRoute(`/tiendas/${shop.id}`)) return;
      setShopModalTab("INFO");
      setSelectedShopForModal(shop);
      setActiveShopCardId(null);
      const shouldNavigate = options?.navigate ?? effectiveViewMode === "CLIENT";
      if (shouldNavigate) {
        navigateTo(`/tiendas/${shop.id}`);
      }
      if (isClientSession && effectiveUserType === "CLIENT") {
        pushHistory(`Visitaste: ${shop.name}`);
      }
    },
    [
      effectiveViewMode,
      effectiveUserType,
      isClientSession,
      navigateTo,
      pushHistory,
      requireClientForRoute,
      setActiveShopCardId,
      setSelectedShopForModal,
      setShopModalTab,
    ]
  );

  const handleViewReel = useCallback(
    (reel: Reel) => {
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
    },
    [
      effectiveUserType,
      isClientSession,
      pushHistory,
      setSelectedReel,
      setUser,
      user.viewedReels,
    ]
  );

  const toggleShopCard = useCallback(
    (shopId: string) => {
      setActiveShopCardId((prev) => (prev === shopId ? null : shopId));
    },
    [setActiveShopCardId]
  );

  const handleShopCardKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>, shopId: string) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleShopCard(shopId);
      }
    },
    [toggleShopCard]
  );

  const renderShopCard = useCallback(
    (shop: Shop) => (
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
    ),
    [
      activeShopCardId,
      canClientInteract,
      handleOpenShop,
      handleShopCardKeyDown,
      requireLogin,
      toggleShopCard,
    ]
  );

  return {
    handleOpenShop,
    handleViewReel,
    renderShopCard,
  };
};
