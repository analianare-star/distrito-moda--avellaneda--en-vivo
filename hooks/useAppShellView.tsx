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
  const [showSkeletons, setShowSkeletons] = useState(false);

  useEffect(() => {
    if (!core.isLoading) {
      setShowSkeletons(false);
      return;
    }
    setShowSkeletons(false);
    const timer = window.setTimeout(() => setShowSkeletons(true), 5000);
    return () => window.clearTimeout(timer);
  }, [core.isLoading]);

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

  const loadingFallback = (
    <div className="min-h-screen bg-white text-dm-dark">
      {!showSkeletons ? (
        <div className="dm-loading-intro">
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
      ) : (
        <>
          <div className="dm-loading-header">
            <img
              src={core.brandLogo}
              alt="Avellaneda en Vivo"
              className="dm-loading-logo dm-loading-logo--header"
              loading="eager"
            />
          </div>
          <div className="mx-auto mt-6 max-w-5xl px-6 pb-12 space-y-8 dm-loading-skeletons">
            <div className="flex gap-3 overflow-hidden">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={`reel-skel-${index}`}
                  className="h-14 w-14 shrink-0 rounded-full bg-gray-200 animate-pulse"
                />
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={`shop-skel-${index}`}
                  className="h-32 rounded-2xl border border-gray-100 bg-gray-50 animate-pulse"
                />
              ))}
            </div>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`live-skel-${index}`}
                  className="h-24 rounded-2xl border border-gray-100 bg-gray-50 animate-pulse"
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );

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
    loadingFallback,
    roleRouterProps,
    overlaysProps,
    resetViewProps,
  };
};
