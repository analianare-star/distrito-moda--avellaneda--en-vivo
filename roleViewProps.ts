import type { ComponentProps, Dispatch, SetStateAction } from "react";
import type { Shop, Stream, NotificationItem, Reel, UserContext } from "./types";
import type { AdminTab, MerchantTab } from "./navigation";
import { AdminView } from "./features/admin/AdminView";
import { MerchantView } from "./features/merchant/MerchantView";
import { ClientView } from "./features/client/ClientView";

type AdminViewProps = ComponentProps<typeof AdminView>;
type MerchantViewProps = ComponentProps<typeof MerchantView>;
type MerchantViewBaseProps = Omit<MerchantViewProps, "isPreview" | "adminOverride">;
type ClientViewProps = ComponentProps<typeof ClientView>;

type AdminViewArgs = {
  streams: Stream[];
  setStreams: Dispatch<SetStateAction<Stream[]>>;
  shops: Shop[];
  setShops: Dispatch<SetStateAction<Shop[]>>;
  onRefreshData: () => void;
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onPreviewClient: () => void;
  onPreviewShop: (shopId: string) => void;
  onShopUpdate: (shop: Shop) => Promise<boolean>;
  adminRole?: "SUPERADMIN" | "MODERATOR";
};

export const buildAdminViewProps = (args: AdminViewArgs): AdminViewProps => ({
  streams: args.streams,
  setStreams: args.setStreams,
  shops: args.shops,
  setShops: args.setShops,
  onRefreshData: args.onRefreshData,
  activeTab: args.activeTab,
  onTabChange: args.onTabChange,
  onPreviewClient: args.onPreviewClient,
  onPreviewShop: args.onPreviewShop,
  onShopUpdate: args.onShopUpdate,
  adminRole: args.adminRole,
});

type MerchantViewArgs = {
  currentShop: Shop;
  streams: Stream[];
  onStreamCreate: (stream: Stream) => Promise<boolean>;
  onStreamUpdate: (stream: Stream) => Promise<boolean>;
  onStreamDelete: (streamId: string) => void;
  onShopUpdate: (shop: Shop) => Promise<boolean>;
  onExtendStream: (streamId: string) => void;
  onBuyQuota: (amount: number) => void;
  onReelChange: () => void;
  onRefreshData: () => void;
  activeTab: MerchantTab;
  onTabChange: (tab: MerchantTab) => void;
  notifications: NotificationItem[];
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
};

export const buildMerchantViewProps = (
  args: MerchantViewArgs
): MerchantViewBaseProps => ({
  currentShop: args.currentShop,
  streams: args.streams,
  onStreamCreate: args.onStreamCreate,
  onStreamUpdate: args.onStreamUpdate,
  onStreamDelete: args.onStreamDelete,
  onShopUpdate: args.onShopUpdate,
  onExtendStream: args.onExtendStream,
  onBuyQuota: args.onBuyQuota,
  onReelChange: args.onReelChange,
  onRefreshData: args.onRefreshData,
  activeTab: args.activeTab,
  onTabChange: args.onTabChange,
  notifications: args.notifications,
  onMarkNotificationRead: args.onMarkNotificationRead,
  onMarkAllNotificationsRead: args.onMarkAllNotificationsRead,
});

type ClientViewArgs = {
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
  notifications: NotificationItem[];
  selectedShopForModal: Shop | null;
  selectedReel: Reel | null;
  shopModalTab: "INFO" | "CARD";
  user: UserContext;
  canClientInteract: boolean;
  renderShopCard: (shop: Shop) => React.ReactNode;
  onFilterChange: (value: string) => void;
  onSelectBottomNav: (value: string) => void;
  onRefreshData: () => void;
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
  onNotify: (title: string, message: string, tone?: "info" | "success" | "warning" | "error") => void;
  onOpenLogin: () => void;
  onQueueModalChange: (isOpen: boolean) => void;
  onOpenCalendarInvite: (stream: Stream) => void;
  streams: Stream[];
  queueStreamsSource: Stream[];
};

export const buildClientViewProps = (args: ClientViewArgs): ClientViewProps => ({
  activeBottomNav: args.activeBottomNav,
  activeFilter: args.activeFilter,
  savedTab: args.savedTab,
  filteredStreams: args.filteredStreams,
  sortedLiveStreams: args.sortedLiveStreams,
  activeReels: args.activeReels,
  featuredShops: args.featuredShops,
  filteredPublicShops: args.filteredPublicShops,
  filteredFavoriteShops: args.filteredFavoriteShops,
  reminderStreams: args.reminderStreams,
  notifications: args.notifications,
  selectedShopForModal: args.selectedShopForModal,
  selectedReel: args.selectedReel,
  shopModalTab: args.shopModalTab,
  user: args.user,
  canClientInteract: args.canClientInteract,
  renderShopCard: args.renderShopCard,
  onFilterChange: args.onFilterChange,
  onSelectBottomNav: args.onSelectBottomNav,
  onRefreshData: args.onRefreshData,
  onOpenShop: args.onOpenShop,
  onViewReel: args.onViewReel,
  onReport: args.onReport,
  onToggleReminder: args.onToggleReminder,
  onLike: args.onLike,
  onRate: args.onRate,
  onDownloadCard: args.onDownloadCard,
  onSetSavedTab: args.onSetSavedTab,
  onOpenShopModalTab: args.onOpenShopModalTab,
  onCloseShopModal: args.onCloseShopModal,
  onCloseReel: args.onCloseReel,
  onToggleFavorite: args.onToggleFavorite,
  onRequireLogin: args.onRequireLogin,
  onLogout: args.onLogout,
  onNotify: args.onNotify,
  onOpenLogin: args.onOpenLogin,
  onQueueModalChange: args.onQueueModalChange,
  onOpenCalendarInvite: args.onOpenCalendarInvite,
  streams: args.streams,
  queueStreamsSource: args.queueStreamsSource,
});
