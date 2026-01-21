import { Shop, UserContext, ViewMode } from "../types";
import type { AuthProfile } from "./useAuthState";

type AdminPreview = { mode: ViewMode; shopId?: string } | null;

type UseRoleAccessArgs = {
  viewMode: ViewMode;
  adminPreview: AdminPreview;
  authProfile: AuthProfile | null;
  user: UserContext;
  currentShop: Shop;
};

export const useRoleAccess = ({
  viewMode,
  adminPreview,
  authProfile,
  user,
  currentShop,
}: UseRoleAccessArgs) => {
  const effectiveViewMode = adminPreview?.mode ?? viewMode;
  const effectiveUserType = adminPreview
    ? adminPreview.mode === "MERCHANT"
      ? "SHOP"
      : adminPreview.mode === "CLIENT"
      ? "CLIENT"
      : authProfile?.userType
    : authProfile?.userType;
  const isClientSession = user.isLoggedIn || adminPreview?.mode === "CLIENT";
  const canClientInteract = isClientSession && effectiveUserType === "CLIENT";
  const isAdminOverride =
    authProfile?.userType === "ADMIN" && adminPreview?.mode === "MERCHANT";

  const isAdminUser = effectiveUserType === "ADMIN";
  const isMerchantUser = effectiveUserType === "SHOP";
  const canAccessAdminRoute = authProfile?.userType === "ADMIN";
  const canAccessShopRoute =
    authProfile?.userType === "SHOP" || adminPreview?.mode === "MERCHANT";

  const adminUserName = user.isLoggedIn ? user.name || "Admin" : "Admin";
  const merchantUserName = currentShop?.name || user.name || "Tienda";
  const clientUserName = user.isLoggedIn ? user.name || "Cliente" : "Invitado";

  const adminPreviewMode =
    adminPreview?.mode === "MERCHANT"
      ? "MERCHANT"
      : adminPreview?.mode === "CLIENT"
      ? "CLIENT"
      : null;

  const isAdminViewBlocked =
    effectiveViewMode === "ADMIN" && authProfile?.userType !== "ADMIN";
  const isMerchantViewBlocked =
    effectiveViewMode === "MERCHANT" &&
    authProfile?.userType !== "SHOP" &&
    !adminPreview;

  return {
    effectiveViewMode,
    effectiveUserType,
    isClientSession,
    canClientInteract,
    isAdminOverride,
    isAdminUser,
    isMerchantUser,
    canAccessAdminRoute,
    canAccessShopRoute,
    adminUserName,
    merchantUserName,
    clientUserName,
    adminPreviewMode,
    isAdminViewBlocked,
    isMerchantViewBlocked,
  };
};
