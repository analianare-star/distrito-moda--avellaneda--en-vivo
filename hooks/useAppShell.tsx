import { useAppCore } from "./useAppCore";
import { useAppShellView } from "./useAppShellView";

export const useAppShell = () => {
  const core = useAppCore();
  const { introOverlay, roleRouterProps, overlaysProps, resetViewProps } =
    useAppShellView(core);

  return {
    isResetView: core.isResetView,
    isLoading: core.isLoading,
    hasFetchError: core.hasFetchError,
    isAdminViewBlocked: core.isAdminViewBlocked,
    isMerchantViewBlocked: core.isMerchantViewBlocked,
    introOverlay,
    resetViewProps,
    roleRouterProps,
    overlaysProps,
  };
};
