import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { NotificationItem, Shop, Stream } from "../../types";
import { MerchantPage } from "../../components/pages/merchant/MerchantPage";

// MerchantView envuelve el panel de tienda con semantica clara.
// MerchantView wraps the shop dashboard with semantic structure.
type MerchantTab = "RESUMEN" | "VIVOS" | "REELS" | "REDES" | "PERFIL";

export interface MerchantViewProps {
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
  adminOverride?: boolean;
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
  adminOverride,
}) => {
  return (
    <section aria-label="Panel de tienda">
      <Routes>
        <Route
          index
          element={
            <MerchantPage
              tab="RESUMEN"
              activeTab={activeTab}
              onTabChange={onTabChange}
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
              notifications={notifications}
              onMarkNotificationRead={onMarkNotificationRead}
              onMarkAllNotificationsRead={onMarkAllNotificationsRead}
              isPreview={isPreview}
              adminOverride={adminOverride}
            />
          }
        />
        <Route
          path="vivos"
          element={
            <MerchantPage
              tab="VIVOS"
              activeTab={activeTab}
              onTabChange={onTabChange}
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
              notifications={notifications}
              onMarkNotificationRead={onMarkNotificationRead}
              onMarkAllNotificationsRead={onMarkAllNotificationsRead}
              isPreview={isPreview}
              adminOverride={adminOverride}
            />
          }
        />
        <Route
          path="reels"
          element={
            <MerchantPage
              tab="REELS"
              activeTab={activeTab}
              onTabChange={onTabChange}
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
              notifications={notifications}
              onMarkNotificationRead={onMarkNotificationRead}
              onMarkAllNotificationsRead={onMarkAllNotificationsRead}
              isPreview={isPreview}
              adminOverride={adminOverride}
            />
          }
        />
        <Route
          path="redes"
          element={
            <MerchantPage
              tab="REDES"
              activeTab={activeTab}
              onTabChange={onTabChange}
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
              notifications={notifications}
              onMarkNotificationRead={onMarkNotificationRead}
              onMarkAllNotificationsRead={onMarkAllNotificationsRead}
              isPreview={isPreview}
              adminOverride={adminOverride}
            />
          }
        />
        <Route
          path="perfil"
          element={
            <MerchantPage
              tab="PERFIL"
              activeTab={activeTab}
              onTabChange={onTabChange}
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
              notifications={notifications}
              onMarkNotificationRead={onMarkNotificationRead}
              onMarkAllNotificationsRead={onMarkAllNotificationsRead}
              isPreview={isPreview}
              adminOverride={adminOverride}
            />
          }
        />
        <Route path="*" element={<Navigate to="/tienda" replace />} />
      </Routes>
    </section>
  );
};
