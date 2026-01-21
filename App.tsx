import React from "react";
import { ResetView } from "./components/layout/ResetView";
import { AppOverlays } from "./components/layout/AppOverlays";
import { RoleRouter } from "./components/RoleRouter";
import { useAppShell } from "./hooks/useAppShell";

const App: React.FC = () => {
  const {
    isResetView,
    isLoading,
    isAdminViewBlocked,
    isMerchantViewBlocked,
    loadingFallback,
    resetViewProps,
    roleRouterProps,
    overlaysProps,
  } = useAppShell();

  if (isResetView) {
    return <ResetView {...resetViewProps} />;
  }

  if (isLoading) {
    return loadingFallback;
  }

  if (isAdminViewBlocked || isMerchantViewBlocked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center">
        <h2 className="font-serif text-3xl text-dm-dark">Acceso restringido</h2>
        <p className="mt-2 text-sm text-gray-500">
          Tu cuenta no tiene permisos para ver este panel.
        </p>
        <button
          onClick={() => window.location.assign("/")}
          className="mt-5 rounded-full bg-dm-crimson px-5 py-2 text-xs font-bold text-white shadow-sm"
        >
          Volver a inicio
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <RoleRouter {...roleRouterProps} />
      <AppOverlays {...overlaysProps} />
    </div>
  );
};

export default App;
