import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AppHeader } from "./layout/AppHeader";
import { AppFooterNav, FooterNavItem } from "./layout/AppFooterNav";
import { AdminLayout } from "./layout/AdminLayout";
import { MerchantLayout } from "./layout/MerchantLayout";
import { ClientLayout } from "./layout/ClientLayout";
import { AdminPreviewBanner } from "./layout/AdminPreviewBanner";
import { ClientShopSearchBar } from "./pages/client/ClientShopSearchBar";
import { AdminView } from "../features/admin/AdminView";
import { MerchantView } from "../features/merchant/MerchantView";
import { ClientView } from "../features/client/ClientView";

type AdminViewProps = React.ComponentProps<typeof AdminView>;
type MerchantViewProps = React.ComponentProps<typeof MerchantView>;
type MerchantViewBaseProps = Omit<MerchantViewProps, "isPreview" | "adminOverride">;
type ClientViewProps = React.ComponentProps<typeof ClientView>;

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

  return (
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
                <AppFooterNav items={bottomNavItems} activeId={activeBottomNav} />
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
                <AppFooterNav items={bottomNavItems} activeId={activeBottomNav} />
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
              <AppFooterNav items={bottomNavItems} activeId={activeBottomNav} />
            }
            previewBanner={clientPreviewBanner}
            isPreview={clientIsPreview}
            hideChrome={clientHideChrome}
          >
            <ClientView {...clientViewProps} />
          </ClientLayout>
        }
      />
    </Routes>
  );
};
