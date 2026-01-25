import { useMemo } from "react";
import { Shop, Stream, NotificationItem, UserContext, Reel } from "../types";
import { AdminTab, MerchantTab } from "../navigation";
import {
  buildAdminViewProps,
  buildMerchantViewProps,
  buildClientViewProps,
} from "../roleViewProps";

type UseRoleViewPropsArgs = {
  isLoading: boolean;
  hasFetchError: boolean;
  brandLogo: string;
  streams: Stream[];
  setStreams: React.Dispatch<React.SetStateAction<Stream[]>>;
  shops: Shop[];
  setShops: React.Dispatch<React.SetStateAction<Shop[]>>;
  onRefreshData: () => void;
  adminRole?: "SUPERADMIN" | "MODERATOR";
  adminTab: AdminTab;
  onAdminTabChange: (tab: AdminTab) => void;
  onPreviewClient: () => void;
  onPreviewShop: (shopId: string) => void;
  onShopUpdate: (shop: Shop) => Promise<boolean>;
  currentShop: Shop;
  onStreamCreate: (stream: Stream) => Promise<boolean>;
  onStreamUpdate: (stream: Stream) => Promise<boolean>;
  onStreamDelete: (streamId: string) => void;
  onExtendStream: (streamId: string) => void;
  onBuyQuota: (amount: number) => void;
  onReelChange: () => void;
  merchantTab: MerchantTab;
  onMerchantTabChange: (tab: MerchantTab) => void;
  notifications: NotificationItem[];
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  activeBottomNav: string;
  activeFilter: string;
  savedTab: "FAVORITES" | "REMINDERS";
  filteredStreams: Stream[];
  sortedLiveStreams: Stream[];
  activeReels: Reel[];
  featuredShops: Shop[];
  filteredPublicShops: Shop[];
  filteredFavoriteShops: Shop[];
  reminderStreams: Stream[];
  selectedShopForModal: Shop | null;
  selectedReel: Reel | null;
  shopModalTab: "INFO" | "CARD";
  user: UserContext;
  canClientInteract: boolean;
  renderShopCard: (shop: Shop) => React.ReactNode;
  onFilterChange: (value: string) => void;
  onSelectBottomNav: (value: string) => void;
  onOpenShop: (shop: Shop, options?: { navigate?: boolean }) => void;
  onViewReel: (reel: Reel) => void;
  onReport: (stream: Stream) => void;
  onToggleReminder: (streamId: string) => void;
  onLike: (streamId: string) => void;
  onRate: (streamId: string, rating: number) => void;
  onDownloadCard: (stream: Stream) => void;
  onSetSavedTab: (value: "FAVORITES" | "REMINDERS") => void;
  onOpenShopModalTab: (tab: "INFO" | "CARD") => void;
  onCloseShopModal: () => void;
  onCloseReel: () => void;
  onToggleFavorite: (shopId: string) => void;
  onRequireLogin: () => void;
  onLogout: () => void;
  onNotify: (
    title: string,
    message: string,
    tone?: "info" | "success" | "warning" | "error"
  ) => void;
  onOpenLogin: () => void;
  onQueueModalChange: (isOpen: boolean) => void;
  onOpenCalendarInvite: (stream: Stream) => void;
  queueStreamsSource: Stream[];
};

export const useRoleViewProps = ({
  isLoading,
  hasFetchError,
  brandLogo,
  streams,
  setStreams,
  shops,
  setShops,
  onRefreshData,
  adminRole,
  adminTab,
  onAdminTabChange,
  onPreviewClient,
  onPreviewShop,
  onShopUpdate,
  currentShop,
  onStreamCreate,
  onStreamUpdate,
  onStreamDelete,
  onExtendStream,
  onBuyQuota,
  onReelChange,
  merchantTab,
  onMerchantTabChange,
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  activeBottomNav,
  activeFilter,
  savedTab,
  filteredStreams,
  sortedLiveStreams,
  activeReels,
  featuredShops,
  filteredPublicShops,
  filteredFavoriteShops,
  reminderStreams,
  selectedShopForModal,
  selectedReel,
  shopModalTab,
  user,
  canClientInteract,
  renderShopCard,
  onFilterChange,
  onSelectBottomNav,
  onOpenShop,
  onViewReel,
  onReport,
  onToggleReminder,
  onLike,
  onRate,
  onDownloadCard,
  onSetSavedTab,
  onOpenShopModalTab,
  onCloseShopModal,
  onCloseReel,
  onToggleFavorite,
  onRequireLogin,
  onLogout,
  onNotify,
  onOpenLogin,
  onQueueModalChange,
  onOpenCalendarInvite,
  queueStreamsSource,
}: UseRoleViewPropsArgs) => {
  const adminViewProps = useMemo(
    () =>
      buildAdminViewProps({
        streams,
        setStreams,
        shops,
        setShops,
        onRefreshData,
        activeTab: adminTab,
        onTabChange: onAdminTabChange,
        onPreviewClient,
        onPreviewShop,
        onShopUpdate,
        adminRole,
      }),
    [
      adminTab,
      adminRole,
      onAdminTabChange,
      onPreviewClient,
      onPreviewShop,
      onRefreshData,
      onShopUpdate,
      setShops,
      setStreams,
      shops,
      streams,
    ]
  );

  const merchantViewProps = useMemo(
    () =>
      buildMerchantViewProps({
        currentShop,
        streams,
        onStreamCreate,
        onStreamUpdate,
        onStreamDelete,
        onShopUpdate,
        onExtendStream,
        onBuyQuota,
        onReelChange,
        onRefreshData,
        activeTab: merchantTab,
        onTabChange: onMerchantTabChange,
        notifications,
        onMarkNotificationRead,
        onMarkAllNotificationsRead,
      }),
    [
      currentShop,
      merchantTab,
      notifications,
      onBuyQuota,
      onExtendStream,
      onMarkAllNotificationsRead,
      onMarkNotificationRead,
      onMerchantTabChange,
      onReelChange,
      onRefreshData,
      onShopUpdate,
      onStreamCreate,
      onStreamDelete,
      onStreamUpdate,
      streams,
    ]
  );

  const clientViewProps = useMemo(
    () =>
      buildClientViewProps({
        isLoading,
        hasFetchError,
        brandLogo,
        activeBottomNav,
        activeFilter,
        savedTab,
        filteredStreams,
        sortedLiveStreams,
        activeReels,
        featuredShops,
        filteredPublicShops,
        filteredFavoriteShops,
        reminderStreams,
        notifications,
        selectedShopForModal,
        selectedReel,
        shopModalTab,
        user,
        canClientInteract,
        renderShopCard,
        onFilterChange,
        onSelectBottomNav,
        onRefreshData,
        onOpenShop,
        onViewReel,
        onReport,
        onToggleReminder,
        onLike,
        onRate,
        onDownloadCard,
        onSetSavedTab,
        onOpenShopModalTab,
        onCloseShopModal,
        onCloseReel,
        onToggleFavorite,
        onRequireLogin,
        onLogout,
        onNotify,
        onOpenLogin,
        onQueueModalChange,
        onOpenCalendarInvite,
        streams,
        queueStreamsSource,
      }),
    [
      hasFetchError,
      isLoading,
      brandLogo,
      activeBottomNav,
      activeFilter,
      activeReels,
      canClientInteract,
      filteredFavoriteShops,
      filteredPublicShops,
      filteredStreams,
      featuredShops,
      notifications,
      onCloseReel,
      onCloseShopModal,
      onDownloadCard,
      onFilterChange,
      onLike,
      onNotify,
      onOpenCalendarInvite,
      onOpenLogin,
      onOpenShop,
      onOpenShopModalTab,
      onQueueModalChange,
      onRate,
      onRefreshData,
      onReport,
      onRequireLogin,
      onSelectBottomNav,
      onSetSavedTab,
      onToggleFavorite,
      onToggleReminder,
      onViewReel,
      queueStreamsSource,
      reminderStreams,
      renderShopCard,
      savedTab,
      selectedReel,
      selectedShopForModal,
      shopModalTab,
      sortedLiveStreams,
      streams,
      user,
    ]
  );

  return { adminViewProps, merchantViewProps, clientViewProps };
};
