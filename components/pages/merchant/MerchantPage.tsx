import React, { useEffect } from "react";
import { Dashboard } from "../../Dashboard";
import { NotificationItem, Shop, Stream } from "../../../types";

// MerchantPage fija la pestaña activa del panel tienda.
// MerchantPage pins the active shop dashboard tab.
type MerchantTab = "RESUMEN" | "VIVOS" | "REELS" | "REDES" | "PERFIL";

interface MerchantPageProps {
  tab: MerchantTab;
  activeTab: MerchantTab;
  onTabChange: (tab: MerchantTab) => void;
  currentShop: Shop;
  streams: Stream[];
  onStreamCreate: (stream: Stream) => Promise<boolean>;
  onStreamUpdate: (stream: Stream) => Promise<boolean>;
  onStreamDelete: (streamId: string) => void;
  onShopUpdate: (shop: Shop) => Promise<boolean>;
  onExtendStream: (streamId: string) => void;
  onBuyQuota: (amount: number) => void;
  onReelChange: () => void;
  onRefreshData: () => void;
  notifications: NotificationItem[];
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  isPreview: boolean;
  adminOverride?: boolean;
}

export const MerchantPage: React.FC<MerchantPageProps> = ({
  tab,
  activeTab,
  onTabChange,
  currentShop,
  streams,
  onStreamCreate,
  onStreamUpdate,
  onStreamDelete,
  onShopUpdate,
  onExtendStream,
  onBuyQuota,
  onReelChange,
  onRefreshData,
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  isPreview,
  adminOverride,
}) => {
  useEffect(() => {
    if (activeTab !== tab) {
      onTabChange(tab);
    }
  }, [activeTab, tab, onTabChange]);

  return (
    <Dashboard
      currentShop={currentShop}
      streams={streams}
      onStreamCreate={onStreamCreate}
      onStreamUpdate={onStreamUpdate}
      onStreamDelete={onStreamDelete}
      onShopUpdate={onShopUpdate}
      onExtendStream={onExtendStream}
      onBuyQuota={onBuyQuota}
      onReelChange={onReelChange}
      onRefreshData={onRefreshData}
      activeTab={activeTab}
      onTabChange={onTabChange}
      notifications={notifications}
      onMarkNotificationRead={onMarkNotificationRead}
      onMarkAllNotificationsRead={onMarkAllNotificationsRead}
      isPreview={isPreview}
      adminOverride={adminOverride}
    />
  );
};
