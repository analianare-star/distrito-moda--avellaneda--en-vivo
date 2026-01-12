import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Shop, Stream } from "../../types";
import { AdminPage } from "../pages/admin/AdminPage";

// AdminView envuelve el panel admin con semantica clara.
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
      <Routes>
        <Route
          index
          element={
            <AdminPage
              tab="DASHBOARD"
              activeTab={activeTab}
              onTabChange={onTabChange}
              streams={streams}
              setStreams={setStreams}
              shops={shops}
              setShops={setShops}
              onRefreshData={onRefreshData}
              onPreviewClient={onPreviewClient}
              onPreviewShop={onPreviewShop}
              onShopUpdate={onShopUpdate}
            />
          }
        />
        <Route
          path="tiendas"
          element={
            <AdminPage
              tab="SHOPS"
              activeTab={activeTab}
              onTabChange={onTabChange}
              streams={streams}
              setStreams={setStreams}
              shops={shops}
              setShops={setShops}
              onRefreshData={onRefreshData}
              onPreviewClient={onPreviewClient}
              onPreviewShop={onPreviewShop}
              onShopUpdate={onShopUpdate}
            />
          }
        />
        <Route
          path="vivos"
          element={
            <AdminPage
              tab="STREAMS"
              activeTab={activeTab}
              onTabChange={onTabChange}
              streams={streams}
              setStreams={setStreams}
              shops={shops}
              setShops={setShops}
              onRefreshData={onRefreshData}
              onPreviewClient={onPreviewClient}
              onPreviewShop={onPreviewShop}
              onShopUpdate={onShopUpdate}
            />
          }
        />
        <Route
          path="compras"
          element={
            <AdminPage
              tab="ADMIN"
              activeTab={activeTab}
              onTabChange={onTabChange}
              streams={streams}
              setStreams={setStreams}
              shops={shops}
              setShops={setShops}
              onRefreshData={onRefreshData}
              onPreviewClient={onPreviewClient}
              onPreviewShop={onPreviewShop}
              onShopUpdate={onShopUpdate}
            />
          }
        />
        <Route
          path="reportes"
          element={
            <AdminPage
              tab="REPORTS"
              activeTab={activeTab}
              onTabChange={onTabChange}
              streams={streams}
              setStreams={setStreams}
              shops={shops}
              setShops={setShops}
              onRefreshData={onRefreshData}
              onPreviewClient={onPreviewClient}
              onPreviewShop={onPreviewShop}
              onShopUpdate={onShopUpdate}
            />
          }
        />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </section>
  );
};
