import { useAppCore } from "./useAppCore";
import { useAppShellView } from "./useAppShellView";

export const useAppShell = () => {
  const core = useAppCore();
  const { loadingFallback, roleRouterProps, overlaysProps, resetViewProps } =
    useAppShellView(core);

  return {
    isResetView: core.isResetView,
    isLoading: core.isLoading,
    isAdminViewBlocked: core.isAdminViewBlocked,
    isMerchantViewBlocked: core.isMerchantViewBlocked,
    loadingFallback,
    resetViewProps,
    roleRouterProps,
    overlaysProps,
  };
};
