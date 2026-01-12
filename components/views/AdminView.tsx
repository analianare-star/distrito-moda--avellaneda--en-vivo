import React from "react";
import { AdminDashboard } from "../AdminDashboard";
import { Shop, Stream } from "../../types";

// AdminView wraps the admin dashboard with semantic structure.
interface AdminViewProps {
  streams: Stream[];
  setStreams: React.Dispatch<React.SetStateAction<Stream[]>>;
  shops: Shop[];
  setShops: React.Dispatch<React.SetStateAction<Shop[]>>;
  onRefreshData: () => void;
  activeTab: "DASHBOARD" | "AGENDA" | "STREAMS" | "SHOPS" | "REELS" | "ADMIN" | "REPORTS";
  onTabChange: (tab: "DASHBOARD" | "AGENDA" | "STREAMS" | "SHOPS" | "REELS" | "ADMIN" | "REPORTS") => void;
  onPreviewClient: () => void;
  onPreviewShop: (shopId: string) => void;
  onShopUpdate: (shop: Shop) => Promise<boolean>;
}

export const AdminView: React.FC<AdminViewProps> = ({
  streams,
  setStreams,
  shops,
  setShops,
  onRefreshData,
  activeTab,
  onTabChange,
  onPreviewClient,
  onPreviewShop,
  onShopUpdate,
}) => {
  return (
    <section aria-label="Panel de administración">
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
    </section>
  );
};
