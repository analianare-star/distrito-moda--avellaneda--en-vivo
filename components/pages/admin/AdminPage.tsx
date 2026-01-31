import React, { useEffect, Suspense } from "react";
import { Shop, Stream } from "../../../types";

const AdminDashboard = React.lazy(async () => {
  const mod = await import("../../AdminDashboard");
  return { default: mod.AdminDashboard };
});

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
  adminRole?: "SUPERADMIN" | "MODERATOR";
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
  adminRole,
}) => {
  useEffect(() => {
    if (activeTab !== tab) {
      onTabChange(tab);
    }
  }, [activeTab, tab, onTabChange]);

  return (
    <Suspense fallback={<div className="min-h-[50vh] w-full animate-pulse bg-white" />}>
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
        adminRole={adminRole}
      />
    </Suspense>
  );
};
