import React from "react";
import { Dashboard } from "../Dashboard";
import { NotificationItem, Shop, Stream } from "../../types";

// MerchantView wraps the shop dashboard with semantic structure.
type MerchantTab = "RESUMEN" | "VIVOS" | "REELS" | "REDES" | "PERFIL";

interface MerchantViewProps {
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
  activeTab: MerchantTab;
  onTabChange: (tab: MerchantTab) => void;
  notifications: NotificationItem[];
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  isPreview: boolean;
}

export const MerchantView: React.FC<MerchantViewProps> = ({
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
  activeTab,
  onTabChange,
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  isPreview,
}) => {
  return (
    <section aria-label="Panel de tienda">
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
      />
    </section>
  );
};
