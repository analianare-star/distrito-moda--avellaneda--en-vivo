import React, { useEffect } from "react";
import { AdminDashboard } from "../../AdminDashboard";
import { Shop, Stream } from "../../../types";

// AdminPage fija la pestaña activa para el panel.
// AdminPage pins the active tab for the admin panel.
interface AdminPageProps {
  tab: "DASHBOARD" | "AGENDA" | "STREAMS" | "SHOPS" | "REELS" | "ADMIN" | "REPORTS";
  activeTab: "DASHBOARD" | "AGENDA" | "STREAMS" | "SHOPS" | "REELS" | "ADMIN" | "REPORTS";
  onTabChange: (tab: "DASHBOARD" | "AGENDA" | "STREAMS" | "SHOPS" | "REELS" | "ADMIN" | "REPORTS") => void;
  streams: Stream[];
  setStreams: React.Dispatch<React.SetStateAction<Stream[]>>;
  shops: Shop[];
  setShops: React.Dispatch<React.SetStateAction<Shop[]>>;
  onRefreshData: () => void;
  onPreviewClient: () => void;
  onPreviewShop: (shopId: string) => void;
  onShopUpdate: (shop: Shop) => Promise<boolean>;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  tab,
  activeTab,
  onTabChange,
  streams,
  setStreams,
  shops,
  setShops,
  onRefreshData,
  onPreviewClient,
  onPreviewShop,
  onShopUpdate,
}) => {
  useEffect(() => {
    if (activeTab !== tab) {
      onTabChange(tab);
    }
  }, [activeTab, tab, onTabChange]);

  return (
    <AdminDashboard
      streams={streams}
      setStreams={setStreams}
      shops={shops}
      setShops={setShops}
      onRefreshData={onRefreshData}
      activeTab={activeTab}
      onTabChange={onTabChange}
      onPreviewClient={onPreviewClient}
      onPreviewShop={onPreviewShop}
      onShopUpdate={onShopUpdate}
    />
  );
};
