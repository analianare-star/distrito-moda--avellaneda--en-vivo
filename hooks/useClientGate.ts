import { useCallback, type MutableRefObject } from "react";
import type { ViewMode } from "../types";
import type { AuthProfile } from "./useAuthState";

type NoticePayload = {
  title: string;
  message: string;
  tone?: "info" | "success" | "warning" | "error";
};

type UseClientGateArgs = {
  isClientSession: boolean;
  effectiveUserType?: AuthProfile["userType"] | null;
  setViewMode: (mode: ViewMode) => void;
  openLoginModal: () => void;
  postLoginRedirect: MutableRefObject<string | null>;
  setNotice: (payload: NoticePayload) => void;
};

export const useClientGate = ({
  isClientSession,
  effectiveUserType,
  setViewMode,
  openLoginModal,
  postLoginRedirect,
  setNotice,
}: UseClientGateArgs) => {
  const requireLogin = useCallback(() => {
    setViewMode("CLIENT");
    postLoginRedirect.current = null;
    openLoginModal();
  }, [openLoginModal, postLoginRedirect, setViewMode]);

  const requireClient = useCallback(() => {
    if (!isClientSession) {
      requireLogin();
      return false;
    }
    if (effectiveUserType && effectiveUserType !== "CLIENT") {
      setNotice({
        title: "Solo clientes",
        message: "Esta accion esta disponible solo para cuentas cliente.",
        tone: "warning",
      });
      return false;
    }
    return true;
  }, [effectiveUserType, isClientSession, requireLogin, setNotice]);

  const requireClientForRoute = useCallback(
    (redirectPath?: string) => {
      if (!isClientSession) {
        if (redirectPath) {
          postLoginRedirect.current = redirectPath;
        }
        setViewMode("CLIENT");
        openLoginModal();
        return false;
      }
      if (effectiveUserType && effectiveUserType !== "CLIENT") {
        setNotice({
          title: "Solo clientes",
          message: "Esta accion esta disponible solo para cuentas cliente.",
          tone: "warning",
        });
        return false;
      }
      return true;
    },
    [
      effectiveUserType,
      isClientSession,
      openLoginModal,
      postLoginRedirect,
      setNotice,
      setViewMode,
    ]
  );

  return {
    requireLogin,
    requireClient,
    requireClientForRoute,
  };
};
