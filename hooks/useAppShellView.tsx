import React, { useEffect, useState } from "react";
import { AuthModal } from "../components/layout/AuthModal";
import { useAppCore } from "./useAppCore";

type AppCoreState = ReturnType<typeof useAppCore>;

type ResetViewProps = {
  status: string;
  email: string;
  password: string;
  confirm: string;
  error: string;
  busy: boolean;
  onClose: () => void;
  onPasswordChange: (value: string) => void;
  onConfirmChange: (value: string) => void;
  onSubmit: () => void;
};

type OverlaysProps = {
  notice: AppCoreState["notice"];
  onCloseNotice: () => void;
  reportTarget: AppCoreState["reportTarget"];
  onCloseReport: () => void;
  onSubmitReport: (reason: string) => void;
  calendarPromptStream: AppCoreState["calendarPromptStream"];
  onCalendarAccept: (stream: NonNullable<AppCoreState["calendarPromptStream"]>) => void;
  onCalendarClose: () => void;
};

export const useAppShellView = (core: AppCoreState) => {
  const [showIntroOverlay, setShowIntroOverlay] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowIntroOverlay(false), 5000);
    return () => window.clearTimeout(timer);
  }, []);

  const clientAuthModal = (
    <AuthModal
      isOpen={
        core.effectiveViewMode === "CLIENT" &&
        !core.user.isLoggedIn &&
        core.showLoginPrompt
      }
      loginStep={core.loginStep}
      clientEmailMode={core.clientEmailMode}
      loginError={core.loginError}
      loginBusy={core.loginBusy}
      resetBusy={core.resetBusy}
      onClose={core.handleContinueAsGuest}
      onContinueAsGuest={core.handleContinueAsGuest}
      onOpenAudienceSelection={core.openAudienceSelection}
      onEmailLogin={core.handleEmailLogin}
      onEmailRegister={core.handleEmailRegister}
      onGoogleLogin={core.handleGoogleLogin}
      onPasswordReset={core.handlePasswordReset}
      onSetLoginStep={core.setLoginStep}
      onSetLoginMode={core.setLoginMode}
      onSetLoginAudience={core.setLoginAudience}
      onSetClientEmailMode={core.setClientEmailMode}
      onSetLoginError={core.setLoginError}
    />
  );

  const introOverlay = showIntroOverlay ? (
    <div className="dm-loading-intro dm-loading-intro--overlay">
      <img
        src={core.brandLogo}
        alt="Avellaneda en Vivo"
        className="dm-loading-logo dm-loading-logo--intro"
        loading="eager"
      />
      <div
        className="dm-loading-progress dm-loading-progress--short"
        aria-hidden="true"
      >
        <div className="dm-loading-progress-bar" />
      </div>
    </div>
  ) : null;

  const roleRouterProps = {
    brandLogo: core.brandLogo,
    bottomNavItems: core.bottomNavItems,
    activeBottomNav: core.activeBottomNav,
    isDesktopMenuOpen: core.isDesktopMenuOpen,
    onToggleDesktopMenu: () => core.setIsDesktopMenuOpen((prev) => !prev),
    onCloseDesktopMenu: () => core.setIsDesktopMenuOpen(false),
    isLoggedIn: core.user.isLoggedIn,
    onLogout: core.onLogout,
    adminUserName: core.adminUserName,
    merchantUserName: core.merchantUserName,
    clientUserName: core.clientUserName,
    canAccessAdminRoute: core.canAccessAdminRoute,
    canAccessShopRoute: core.canAccessShopRoute,
    adminViewProps: core.adminViewProps,
    merchantViewProps: core.merchantViewProps,
    clientViewProps: core.clientViewProps,
    showClientShopSearch: core.locationPath.startsWith("/tiendas"),
    shopQuery: core.shopQuery,
    onShopQueryChange: core.setShopQuery,
    onClearShopQuery: () => core.setShopQuery(""),
    clientAuthModal,
    adminPreviewMode: core.adminPreviewMode,
    previewShopName: core.previewShopName,
    onStopAdminPreview: core.stopAdminPreview,
    merchantIsPreview: core.merchantIsPreview,
    isAdminOverride: core.isAdminOverride,
    clientIsPreview: core.clientIsPreview,
    clientHideChrome: core.clientHideChrome,
  };

  const overlaysProps: OverlaysProps = {
    notice: core.notice,
    onCloseNotice: core.clearNotice,
    reportTarget: core.reportTarget,
    onCloseReport: () => core.setReportTarget(null),
    onSubmitReport: core.handleSubmitReport,
    calendarPromptStream: core.calendarPromptStream,
    onCalendarAccept: (stream) => {
      core.handleOpenCalendarInvite(stream);
      core.setCalendarPromptStream(null);
    },
    onCalendarClose: () => core.setCalendarPromptStream(null),
  };

  const resetViewProps: ResetViewProps = {
    status: core.resetViewStatus,
    email: core.resetViewEmail,
    password: core.resetViewPassword,
    confirm: core.resetViewConfirm,
    error: core.resetViewError,
    busy: core.resetViewBusy,
    onClose: () => window.location.assign("/"),
    onPasswordChange: core.setResetViewPassword,
    onConfirmChange: core.setResetViewConfirm,
    onSubmit: core.handleResetViewSubmit,
  };

  return {
    introOverlay,
    roleRouterProps,
    overlaysProps,
    resetViewProps,
  };
};
