import { useEffect, type Dispatch, type SetStateAction, type MutableRefObject } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { api } from "../services/api";
import { NotificationItem, UserContext, ViewMode } from "../types";

export type AuthProfile = {
  userType: "ADMIN" | "SHOP" | "CLIENT";
  authUserId?: string;
  shopId?: string;
  adminRole?: string;
};

type UseAuthStateArgs = {
  isResetView: boolean;
  setUser: Dispatch<SetStateAction<UserContext>>;
  setAuthProfile: Dispatch<SetStateAction<AuthProfile | null>>;
  setAdminPreview: Dispatch<
    SetStateAction<{ mode: ViewMode; shopId?: string } | null>
  >;
  setViewMode: (mode: ViewMode) => void;
  setActiveBottomNav: (value: string) => void;
  setCurrentShopId: (value: string) => void;
  setNotifications: Dispatch<SetStateAction<NotificationItem[]>>;
  setLoginPromptDismissed: (value: boolean) => void;
  setShowLoginPrompt: (value: boolean) => void;
  setHasBottomNavInteraction: (value: boolean) => void;
  postLoginRedirect: MutableRefObject<string | null>;
  isAdminRoute: (path: string) => boolean;
  isShopRoute: (path: string) => boolean;
  navigateTo: (path: string, replace?: boolean) => void;
  refreshNotifications: (profile?: AuthProfile | null) => Promise<void>;
};

export const useAuthState = ({
  isResetView,
  setUser,
  setAuthProfile,
  setAdminPreview,
  setViewMode,
  setActiveBottomNav,
  setCurrentShopId,
  setNotifications,
  setLoginPromptDismissed,
  setShowLoginPrompt,
  setHasBottomNavInteraction,
  postLoginRedirect,
  isAdminRoute,
  isShopRoute,
  navigateTo,
  refreshNotifications,
}: UseAuthStateArgs) => {
  useEffect(() => {
    if (isResetView) return;
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      const currentPath =
        typeof window !== "undefined" ? window.location.pathname : "/";
      if (fbUser) {
        setUser((prev) => ({
          ...prev,
          id: fbUser.uid,
          isLoggedIn: true,
          name: fbUser.displayName || prev.name || "Cliente",
          email: fbUser.email || prev.email,
        }));
        void (async () => {
          const profile = await api.fetchAuthMe();
          if (profile?.userType) {
            setAuthProfile(profile);
            if (profile.userType === "ADMIN") {
              postLoginRedirect.current = null;
              navigateTo("/admin", true);
            } else if (profile.userType === "SHOP") {
              postLoginRedirect.current = null;
              navigateTo("/tienda", true);
              if (profile.shopId) {
                setCurrentShopId(profile.shopId);
              }
              await refreshNotifications(profile);
            } else {
              if (isAdminRoute(currentPath) || isShopRoute(currentPath)) {
                navigateTo("/", true);
              }
              await api.createClientMe({
                displayName: fbUser.displayName || undefined,
                avatarUrl: fbUser.photoURL || undefined,
              });
              const clientState = await api.fetchClientState();
              if (clientState) {
                setUser((prev) => ({
                  ...prev,
                  favorites: clientState.favorites || [],
                  reminders: clientState.reminders || [],
                  viewedReels: clientState.viewedReels || [],
                  likes: clientState.likes || [],
                }));
              }
              await refreshNotifications(profile);
              if (postLoginRedirect.current) {
                setActiveBottomNav("account");
                navigateTo(postLoginRedirect.current, true);
                postLoginRedirect.current = null;
              }
            }
          } else {
            setAuthProfile(null);
            if (isAdminRoute(currentPath) || isShopRoute(currentPath)) {
              navigateTo("/", true);
            }
          }
        })();
        setLoginPromptDismissed(true);
        setShowLoginPrompt(false);
      } else {
        setUser((prev) => ({
          ...prev,
          id: prev.isLoggedIn ? `anon-${Date.now()}` : prev.id,
          isLoggedIn: false,
          favorites: [],
          reminders: [],
          viewedReels: [],
          history: [],
          likes: [],
          reports: [],
        }));
        setNotifications([]);
        setAdminPreview(null);
        setAuthProfile(null);
        setViewMode("CLIENT");
        setActiveBottomNav("home");
        if (isAdminRoute(currentPath) || isShopRoute(currentPath)) {
          navigateTo("/", true);
        }
        setLoginPromptDismissed(false);
        setShowLoginPrompt(false);
        setHasBottomNavInteraction(false);
      }
    });

    return () => unsubscribe();
  }, [isResetView]);
};
