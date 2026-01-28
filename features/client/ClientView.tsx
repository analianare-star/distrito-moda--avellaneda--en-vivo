import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ShopDetailModal } from "../../components/ShopDetailModal";
import { StoryModal } from "../../components/StoryModal";
import { Shop, Stream, Reel, UserContext, NotificationItem } from "../../types";
import { ClientHomePage } from "../../components/pages/client/ClientHomePage";
import { ClientShopsPage } from "../../components/pages/client/ClientShopsPage";
import { ClientAccountPage } from "../../components/pages/client/ClientAccountPage";
import { ClientMapPage } from "../../components/pages/client/ClientMapPage";
import { ClientVerticalFeedPage } from "../../components/pages/client/ClientVerticalFeedPage";
import { EmptyState } from "../../components/EmptyState";

// ClientView muestra la experiencia publica y de cliente.
// ClientView renders the public and client experience.
interface ClientViewProps {
  isLoading: boolean;
  hasFetchError: boolean;
  brandLogo: string;
  activeBottomNav: string;
  activeFilter: string;
  savedTab: "FAVORITES" | "REMINDERS";
  filteredStreams: Stream[];
  sortedLiveStreams: Stream[];
  activeReels: Reel[];
  featuredShops: Shop[];
  favoriteShops: Shop[];
  filteredPublicShops: Shop[];
  filteredFavoriteShops: Shop[];
  reminderStreams: Stream[];
  notifications: NotificationItem[];
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
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
  onOpenStream: (stream: Stream) => void;
  onNotificationAction: (note: NotificationItem) => void;
  streams: Stream[];
  queueStreamsSource: Stream[];
}

export const ClientView: React.FC<ClientViewProps> = ({
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
  favoriteShops,
  filteredPublicShops,
  filteredFavoriteShops,
  reminderStreams,
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
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
  onOpenStream,
  onNotificationAction,
  streams,
  queueStreamsSource,
}) => {
  const isDataLoading = isLoading || hasFetchError;
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(min-width: 1024px)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(min-width: 1024px)");
    const handleChange = () => setIsDesktop(media.matches);
    handleChange();
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);
  const renderGuestGate = (title: string, message: string) => (
    <section aria-label={title}>
      <EmptyState title={title} message={message} actionLabel="Ingresar" onAction={onRequireLogin} />
    </section>
  );

  return (
    <section aria-label="Vista cliente">
      <Routes>
        <Route
          path="/"
          element={
            <ClientHomePage
              isLoading={isDataLoading}
              brandLogo={brandLogo}
              activeBottomNav={activeBottomNav}
              activeFilter={activeFilter}
              filteredStreams={filteredStreams}
              sortedLiveStreams={sortedLiveStreams}
              activeReels={activeReels}
              featuredShops={featuredShops}
              favoriteShops={favoriteShops}
              queueStreamsSource={queueStreamsSource}
              user={user}
              notifications={notifications}
              reminderStreams={reminderStreams}
              canClientInteract={canClientInteract}
              onFilterChange={onFilterChange}
              onSelectBottomNav={onSelectBottomNav}
              onOpenShop={onOpenShop}
              onViewReel={onViewReel}
              onReport={onReport}
              onToggleReminder={onToggleReminder}
              onToggleFavorite={onToggleFavorite}
              onOpenCalendarInvite={onOpenCalendarInvite}
              onMarkNotificationRead={onMarkNotificationRead}
              onMarkAllNotificationsRead={onMarkAllNotificationsRead}
              onLike={onLike}
              onRate={onRate}
              onDownloadCard={onDownloadCard}
              onNotify={onNotify}
              onOpenLogin={onOpenLogin}
              onLogout={onLogout}
              onQueueModalChange={onQueueModalChange}
              onOpenStream={onOpenStream}
              onNotificationAction={onNotificationAction}
            />
          }
        />
        <Route
          path="/en-vivo"
          element={
            <ClientVerticalFeedPage
              streams={queueStreamsSource}
              user={user}
              canClientInteract={canClientInteract}
              onOpenShop={onOpenShop}
              onReport={(stream) => onReport(stream)}
              onToggleReminder={onToggleReminder}
              onRequireLogin={onRequireLogin}
              onLike={onLike}
              onRate={onRate}
              onDownloadCard={onDownloadCard}
              onNotify={onNotify}
            />
          }
        />
        <Route
          path="/en-vivo/:streamId"
          element={
            <ClientVerticalFeedPage
              streams={queueStreamsSource}
              user={user}
              canClientInteract={canClientInteract}
              onOpenShop={onOpenShop}
              onReport={(stream) => onReport(stream)}
              onToggleReminder={onToggleReminder}
              onRequireLogin={onRequireLogin}
              onLike={onLike}
              onRate={onRate}
              onDownloadCard={onDownloadCard}
              onNotify={onNotify}
            />
          }
        />
        <Route
          path="/tiendas"
          element={
            <ClientShopsPage
              isLoading={isDataLoading}
              filteredPublicShops={filteredPublicShops}
              renderShopCard={renderShopCard}
              onRefreshData={onRefreshData}
              brandLogo={brandLogo}
              user={user}
              activeBottomNav={activeBottomNav}
              featuredShops={featuredShops}
              favoriteShops={favoriteShops}
              queueStreamsSource={queueStreamsSource}
              notifications={notifications}
              reminderStreams={reminderStreams}
              onSelectBottomNav={onSelectBottomNav}
              onOpenShop={onOpenShop}
              onToggleFavorite={onToggleFavorite}
              onToggleReminder={onToggleReminder}
              onOpenCalendarInvite={onOpenCalendarInvite}
              onOpenStream={onOpenStream}
              onMarkNotificationRead={onMarkNotificationRead}
              onMarkAllNotificationsRead={onMarkAllNotificationsRead}
              onNotificationAction={onNotificationAction}
              onNotify={onNotify}
              onOpenLogin={onOpenLogin}
              onLogout={onLogout}
            />
          }
        />
        <Route
          path="/tiendas/:shopId"
          element={
            <ClientShopsPage
              isLoading={isDataLoading}
              filteredPublicShops={filteredPublicShops}
              renderShopCard={renderShopCard}
              onRefreshData={onRefreshData}
              brandLogo={brandLogo}
              user={user}
              activeBottomNav={activeBottomNav}
              featuredShops={featuredShops}
              favoriteShops={favoriteShops}
              queueStreamsSource={queueStreamsSource}
              notifications={notifications}
              reminderStreams={reminderStreams}
              onSelectBottomNav={onSelectBottomNav}
              onOpenShop={onOpenShop}
              onToggleFavorite={onToggleFavorite}
              onToggleReminder={onToggleReminder}
              onOpenCalendarInvite={onOpenCalendarInvite}
              onOpenStream={onOpenStream}
              onMarkNotificationRead={onMarkNotificationRead}
              onMarkAllNotificationsRead={onMarkAllNotificationsRead}
              onNotificationAction={onNotificationAction}
              onNotify={onNotify}
              onOpenLogin={onOpenLogin}
              onLogout={onLogout}
            />
          }
        />
        <Route
          path="/mapa"
          element={<ClientMapPage onClose={() => onSelectBottomNav("home")} />}
        />
        <Route
          path="/favoritos"
          element={<Navigate to="/cuenta" replace />}
        />
        <Route
          path="/recordatorios"
          element={<Navigate to="/cuenta" replace />}
        />
        <Route
          path="/cuenta"
          element={
            isDesktop ? (
              <ClientHomePage
                isLoading={isDataLoading}
                brandLogo={brandLogo}
                activeBottomNav={activeBottomNav}
                activeFilter={activeFilter}
                filteredStreams={filteredStreams}
                sortedLiveStreams={sortedLiveStreams}
                activeReels={activeReels}
                featuredShops={featuredShops}
                favoriteShops={favoriteShops}
                queueStreamsSource={queueStreamsSource}
                user={user}
                notifications={notifications}
                reminderStreams={reminderStreams}
                canClientInteract={canClientInteract}
                onFilterChange={onFilterChange}
                onSelectBottomNav={onSelectBottomNav}
                onOpenShop={onOpenShop}
                onViewReel={onViewReel}
                onReport={onReport}
                onToggleReminder={onToggleReminder}
                onToggleFavorite={onToggleFavorite}
                onOpenCalendarInvite={onOpenCalendarInvite}
                onMarkNotificationRead={onMarkNotificationRead}
                onMarkAllNotificationsRead={onMarkAllNotificationsRead}
                onLike={onLike}
                onRate={onRate}
                onDownloadCard={onDownloadCard}
                onNotify={onNotify}
                onOpenLogin={onOpenLogin}
                onLogout={onLogout}
                onQueueModalChange={onQueueModalChange}
                onOpenStream={onOpenStream}
                onNotificationAction={onNotificationAction}
              />
            ) : user.isLoggedIn ? (
              <ClientAccountPage
                isLoggedIn={user.isLoggedIn}
                user={user}
                favoriteShops={favoriteShops}
                notifications={notifications}
                reminderStreams={reminderStreams}
                onRequireLogin={onRequireLogin}
                onOpenShop={(shop) => onOpenShop(shop)}
                onToggleFavorite={onToggleFavorite}
                onToggleReminder={onToggleReminder}
                onOpenCalendarInvite={onOpenCalendarInvite}
                onOpenStream={onOpenStream}
                onMarkNotificationRead={onMarkNotificationRead}
                onMarkAllNotificationsRead={onMarkAllNotificationsRead}
                onNotificationAction={onNotificationAction}
                onNotify={onNotify}
              />
            ) : (
              renderGuestGate(
                "Ingresar para acceder a tu cuenta",
                "Inicia sesion para ver tu actividad y tus avisos."
              )
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {selectedShopForModal && (
        <ShopDetailModal
          shop={selectedShopForModal}
          shopStreams={streams.filter(
            (s) => s.shop.id === selectedShopForModal.id
          )}
          user={user}
          canClientInteract={canClientInteract}
          initialTab={shopModalTab}
          onClose={() => {
            onCloseShopModal();
            onOpenShopModalTab("INFO");
          }}
          onToggleFavorite={onToggleFavorite}
          onRequireLogin={onRequireLogin}
          onNotify={onNotify}
        />
      )}

      {selectedReel && (
        <StoryModal
          reel={selectedReel}
          reels={activeReels}
          onNavigate={onViewReel}
          onClose={onCloseReel}
          onNotify={onNotify}
          isSeen={user.viewedReels.includes(selectedReel.id)}
          canClientInteract={canClientInteract}
          onRequireLogin={onRequireLogin}
        />
      )}
    </section>
  );
};
