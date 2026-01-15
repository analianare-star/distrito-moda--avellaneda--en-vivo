import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ShopDetailModal } from "../ShopDetailModal";
import { StoryModal } from "../StoryModal";
import { Shop, Stream, Reel, UserContext } from "../../types";
import { ClientHomePage } from "../pages/client/ClientHomePage";
import { ClientShopsPage } from "../pages/client/ClientShopsPage";
import { ClientSavedPage } from "../pages/client/ClientSavedPage";
import { ClientAccountPage } from "../pages/client/ClientAccountPage";

// ClientView muestra la experiencia publica y de cliente.
// ClientView renders the public and client experience.
interface ClientViewProps {
  activeBottomNav: string;
  activeFilter: string;
  savedTab: "FAVORITES" | "REMINDERS";
  shopQuery: string;
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
  onShopQueryChange: (value: string) => void;
  onClearShopQuery: () => void;
  onFilterChange: (value: string) => void;
  onSelectBottomNav: (value: string) => void;
  onRefreshData: () => void;
  onOpenShop: (shop: Shop) => void;
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
}

export const ClientView: React.FC<ClientViewProps> = ({
  activeBottomNav,
  activeFilter,
  savedTab,
  shopQuery,
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
  onShopQueryChange,
  onClearShopQuery,
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
}) => {
  return (
    <section aria-label="Vista cliente">
      <Routes>
        <Route
          path="/"
          element={
            <ClientHomePage
              activeFilter={activeFilter}
              filteredStreams={filteredStreams}
              sortedLiveStreams={sortedLiveStreams}
              activeReels={activeReels}
              featuredShops={featuredShops}
              queueStreamsSource={queueStreamsSource}
              user={user}
              canClientInteract={canClientInteract}
              onFilterChange={onFilterChange}
              onSelectBottomNav={onSelectBottomNav}
              onOpenShop={onOpenShop}
              onViewReel={onViewReel}
              onReport={onReport}
              onToggleReminder={onToggleReminder}
              onLike={onLike}
              onRate={onRate}
              onDownloadCard={onDownloadCard}
              onNotify={onNotify}
              onOpenLogin={onOpenLogin}
              onQueueModalChange={onQueueModalChange}
            />
          }
        />
        <Route
          path="/en-vivo"
          element={
            <ClientHomePage
              activeFilter={activeFilter}
              filteredStreams={filteredStreams}
              sortedLiveStreams={sortedLiveStreams}
              activeReels={activeReels}
              featuredShops={featuredShops}
              queueStreamsSource={queueStreamsSource}
              user={user}
              canClientInteract={canClientInteract}
              onFilterChange={onFilterChange}
              onSelectBottomNav={onSelectBottomNav}
              onOpenShop={onOpenShop}
              onViewReel={onViewReel}
              onReport={onReport}
              onToggleReminder={onToggleReminder}
              onLike={onLike}
              onRate={onRate}
              onDownloadCard={onDownloadCard}
              onNotify={onNotify}
              onOpenLogin={onOpenLogin}
              onQueueModalChange={onQueueModalChange}
            />
          }
        />
        <Route
          path="/en-vivo/:streamId"
          element={
            <ClientHomePage
              activeFilter={activeFilter}
              filteredStreams={filteredStreams}
              sortedLiveStreams={sortedLiveStreams}
              activeReels={activeReels}
              featuredShops={featuredShops}
              user={user}
              canClientInteract={canClientInteract}
              onFilterChange={onFilterChange}
              onSelectBottomNav={onSelectBottomNav}
              onOpenShop={onOpenShop}
              onViewReel={onViewReel}
              onReport={onReport}
              onToggleReminder={onToggleReminder}
              onLike={onLike}
              onRate={onRate}
              onDownloadCard={onDownloadCard}
              onNotify={onNotify}
              onOpenLogin={onOpenLogin}
              onQueueModalChange={onQueueModalChange}
            />
          }
        />
        <Route
          path="/tiendas"
          element={
            <ClientShopsPage
              shopQuery={shopQuery}
              filteredPublicShops={filteredPublicShops}
              renderShopCard={renderShopCard}
              onShopQueryChange={onShopQueryChange}
              onClearShopQuery={onClearShopQuery}
              onRefreshData={onRefreshData}
            />
          }
        />
        <Route
          path="/tiendas/:shopId"
          element={
            <ClientShopsPage
              shopQuery={shopQuery}
              filteredPublicShops={filteredPublicShops}
              renderShopCard={renderShopCard}
              onShopQueryChange={onShopQueryChange}
              onClearShopQuery={onClearShopQuery}
              onRefreshData={onRefreshData}
            />
          }
        />
        <Route
          path="/favoritos"
          element={
            <ClientSavedPage
              savedTab={savedTab}
              filteredFavoriteShops={filteredFavoriteShops}
              reminderStreams={reminderStreams}
              canClientInteract={canClientInteract}
              renderShopCard={renderShopCard}
              onSetSavedTab={onSetSavedTab}
              onSelectBottomNav={onSelectBottomNav}
              onRequireLogin={onRequireLogin}
              onOpenShop={onOpenShop}
              onToggleReminder={onToggleReminder}
              onOpenCalendarInvite={onOpenCalendarInvite}
            />
          }
        />
        <Route
          path="/recordatorios"
          element={
            <ClientSavedPage
              savedTab={savedTab}
              filteredFavoriteShops={filteredFavoriteShops}
              reminderStreams={reminderStreams}
              canClientInteract={canClientInteract}
              renderShopCard={renderShopCard}
              onSetSavedTab={onSetSavedTab}
              onSelectBottomNav={onSelectBottomNav}
              onRequireLogin={onRequireLogin}
              onOpenShop={onOpenShop}
              onToggleReminder={onToggleReminder}
              onOpenCalendarInvite={onOpenCalendarInvite}
            />
          }
        />
        <Route
          path="/cuenta"
          element={
            <ClientAccountPage
              isLoggedIn={user.isLoggedIn}
              onRequireLogin={onRequireLogin}
            />
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
        />
      )}
    </section>
  );
};
