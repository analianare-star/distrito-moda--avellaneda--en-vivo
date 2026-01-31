import React, { Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AppHeader } from "./layout/AppHeader";
import { AppFooterNav, FooterNavItem } from "./layout/AppFooterNav";
import { AdminLayout } from "./layout/AdminLayout";
import { MerchantLayout } from "./layout/MerchantLayout";
import { ClientLayout } from "./layout/ClientLayout";
import { AdminPreviewBanner } from "./layout/AdminPreviewBanner";
import { ClientShopSearchBar } from "./pages/client/ClientShopSearchBar";
import type { AdminView as AdminViewType } from "../features/admin";
import type { MerchantView as MerchantViewType } from "../features/merchant";
import type { ClientView as ClientViewType } from "../features/client";

const AdminView = React.lazy(async () => {
  const mod = await import("../features/admin");
  return { default: mod.AdminView };
});
const MerchantView = React.lazy(async () => {
  const mod = await import("../features/merchant");
  return { default: mod.MerchantView };
});
const ClientView = React.lazy(async () => {
  const mod = await import("../features/client");
  return { default: mod.ClientView };
});

type AdminViewProps = React.ComponentProps<typeof AdminViewType>;
type MerchantViewProps = React.ComponentProps<typeof MerchantViewType>;
type MerchantViewBaseProps = Omit<MerchantViewProps, "isPreview" | "adminOverride">;
type ClientViewProps = React.ComponentProps<typeof ClientViewType>;

interface RoleRouterProps {
  brandLogo: string;
  bottomNavItems: FooterNavItem[];
  activeBottomNav: string;
  isDesktopMenuOpen: boolean;
  onToggleDesktopMenu: () => void;
  onCloseDesktopMenu: () => void;
  isLoggedIn: boolean;
  onLogout: () => void;
  adminUserName: string;
  merchantUserName: string;
  clientUserName: string;
  canAccessAdminRoute: boolean;
  canAccessShopRoute: boolean;
  adminViewProps: AdminViewProps;
  merchantViewProps: MerchantViewBaseProps;
  clientViewProps: ClientViewProps;
  showClientShopSearch: boolean;
  shopQuery: string;
  onShopQueryChange: (value: string) => void;
  onClearShopQuery: () => void;
  clientAuthModal?: React.ReactNode;
  adminPreviewMode?: "CLIENT" | "MERCHANT" | null;
  previewShopName?: string;
  onStopAdminPreview: () => void;
  merchantIsPreview: boolean;
  isAdminOverride: boolean;
  clientIsPreview: boolean;
  clientHideChrome: boolean;
}

export const RoleRouter: React.FC<RoleRouterProps> = ({
  brandLogo,
  bottomNavItems,
  activeBottomNav,
  isDesktopMenuOpen,
  onToggleDesktopMenu,
  onCloseDesktopMenu,
  isLoggedIn,
  onLogout,
  adminUserName,
  merchantUserName,
  clientUserName,
  canAccessAdminRoute,
  canAccessShopRoute,
  adminViewProps,
  merchantViewProps,
  clientViewProps,
  showClientShopSearch,
  shopQuery,
  onShopQueryChange,
  onClearShopQuery,
  clientAuthModal,
  adminPreviewMode,
  previewShopName,
  onStopAdminPreview,
  merchantIsPreview,
  isAdminOverride,
  clientIsPreview,
  clientHideChrome,
}) => {
  const location = useLocation();
  const showClientLogoOnDesktop = location.pathname.startsWith("/tiendas");
  const hideClientHeaderOnDesktop = location.pathname.startsWith("/tiendas");
  const commonHeaderProps = {
    brandLogo,
    bottomNavItems,
    activeBottomNav,
    isDesktopMenuOpen,
    onToggleDesktopMenu,
    onCloseDesktopMenu,
    isLoggedIn,
    onLogout,
  };

  const clientPreviewBanner = adminPreviewMode ? (
    <AdminPreviewBanner
      mode={adminPreviewMode === "MERCHANT" ? "MERCHANT" : "CLIENT"}
      shopName={adminPreviewMode === "MERCHANT" ? previewShopName : undefined}
      onExit={onStopAdminPreview}
    />
  ) : null;

  const merchantPreviewBanner =
    adminPreviewMode === "MERCHANT" ? (
      <AdminPreviewBanner
        mode="MERCHANT"
        shopName={previewShopName}
        onExit={onStopAdminPreview}
      />
    ) : null;

  const lazyFallback = (
    <div className="min-h-[40vh] w-full animate-pulse bg-white" />
  );

  return (
    <Suspense fallback={lazyFallback}>
      <Routes>
        <Route
          path="/admin/*"
          element={
            canAccessAdminRoute ? (
              <AdminLayout
                header={
                  <AppHeader
                    {...commonHeaderProps}
                    userName={adminUserName}
                  />
                }
                footer={
                  <AppFooterNav
                    items={bottomNavItems}
                    activeId={activeBottomNav}
                  />
                }
              >
                <AdminView {...adminViewProps} />
              </AdminLayout>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/tienda/*"
          element={
            canAccessShopRoute ? (
              <MerchantLayout
                header={
                  <AppHeader
                    {...commonHeaderProps}
                    userName={merchantUserName}
                  />
                }
                footer={
                  <AppFooterNav
                    items={bottomNavItems}
                    activeId={activeBottomNav}
                  />
                }
                previewBanner={merchantPreviewBanner}
              >
                <MerchantView
                  {...merchantViewProps}
                  isPreview={merchantIsPreview}
                  adminOverride={isAdminOverride}
                />
              </MerchantLayout>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/*"
          element={
            <ClientLayout
              header={
                <AppHeader
                  {...commonHeaderProps}
                  userName={clientUserName}
                  hideUserInfoOnDesktop
                  showLogoOnDesktop={showClientLogoOnDesktop}
                  hideOnDesktop={hideClientHeaderOnDesktop}
                />
              }
              headerAccessory={
                showClientShopSearch ? (
                  <ClientShopSearchBar
                    shopQuery={shopQuery}
                    onShopQueryChange={onShopQueryChange}
                    onClearShopQuery={onClearShopQuery}
                  />
                ) : null
              }
              authModal={clientAuthModal}
              footer={
                <AppFooterNav
                  items={bottomNavItems}
                  activeId={activeBottomNav}
                />
              }
              previewBanner={clientPreviewBanner}
              isPreview={clientIsPreview}
              hideChrome={clientHideChrome}
              compactDesktop={hideClientHeaderOnDesktop}
            >
              <ClientView {...clientViewProps} />
            </ClientLayout>
          }
        />
      </Routes>
    </Suspense>
  );
};
