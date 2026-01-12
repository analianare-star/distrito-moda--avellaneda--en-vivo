import React from "react";
import { Search } from "lucide-react";
import { HeroSection } from "../HeroSection";
import { StreamCard } from "../StreamCard";
import { EmptyState } from "../EmptyState";
import { ShopDetailModal } from "../ShopDetailModal";
import { StoryModal } from "../StoryModal";
import { Shop, Stream, Reel, UserContext } from "../../types";

// ClientView renders the public and client-facing experience.
interface ClientViewProps {
  activeBottomNav: string;
  activeFilter: string;
  savedTab: "FAVORITES" | "REMINDERS";
  shopQuery: string;
  filteredStreams: Stream[];
  sortedLiveStreams: Stream[];
  activeReels: Reel[];
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
  onOpenCalendarInvite: (stream: Stream) => void;
  streams: Stream[];
}

export const ClientView: React.FC<ClientViewProps> = ({
  activeBottomNav,
  activeFilter,
  savedTab,
  shopQuery,
  filteredStreams,
  sortedLiveStreams,
  activeReels,
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
  onOpenCalendarInvite,
  streams,
}) => {
  return (
    <section aria-label="Vista cliente">
      <div className="mx-auto max-w-3xl px-4 pt-4 md:pt-6">
        <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 shadow-sm">
          <Search size={16} className="text-gray-400" />
          <input
            type="search"
            value={shopQuery}
            onChange={(event) => onShopQueryChange(event.target.value)}
            placeholder="Buscar tiendas, zonas o rubros"
            className="w-full text-sm font-semibold text-dm-dark outline-none placeholder:text-gray-400"
          />
          {shopQuery && (
            <button
              onClick={onClearShopQuery}
              className="text-[11px] font-semibold text-gray-400 hover:text-dm-crimson"
            >
              Borrar
            </button>
          )}
        </div>
      </div>
      <HeroSection
        activeFilter={activeFilter}
        onFilterChange={onFilterChange}
        liveStreams={sortedLiveStreams}
        activeReels={activeReels}
        onViewReel={onViewReel}
        viewedReels={user.viewedReels}
        onOpenShop={onOpenShop}
      />

      <section className="max-w-7xl mx-auto px-4 py-10" aria-label="Contenido principal">
        {(activeBottomNav === "home" || activeBottomNav === "live") && (
          <>
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-serif text-3xl text-dm-dark">
                Agenda de Vivos
              </h2>
              <div className="text-sm font-sans text-gray-500">
                Mostrando:{" "}
                <span className="font-bold text-dm-crimson">
                  {activeFilter}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredStreams.map((stream) => (
                <StreamCard
                  key={stream.id}
                  stream={stream}
                  user={user}
                  canClientInteract={canClientInteract}
                  onNotify={onNotify}
                  onOpenShop={() => onOpenShop(stream.shop)}
                  onReport={onReport}
                  onToggleReminder={onToggleReminder}
                  onLike={onLike}
                  onRate={onRate}
                  onDownloadCard={onDownloadCard}
                />
              ))}
              {filteredStreams.length === 0 && (
                <EmptyState
                  title="No hay vivos con este filtro"
                  message="Probá ver todos los vivos o revisá más tarde."
                  actionLabel="Ver todos"
                  onAction={() => {
                    onFilterChange("Todos");
                    onSelectBottomNav("home");
                  }}
                />
              )}
            </div>
          </>
        )}

        {activeBottomNav === "shops" && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-3xl text-dm-dark">Tiendas</h2>
              <div className="text-sm font-sans text-gray-500">
                {filteredPublicShops.length} registradas
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredPublicShops.map((shop) => renderShopCard(shop))}
              {filteredPublicShops.length === 0 && (
                <EmptyState
                  title="Aún no hay tiendas publicadas"
                  message="Volvé más tarde o refrescá la lista."
                  actionLabel="Actualizar"
                  onAction={onRefreshData}
                />
              )}
            </div>
          </>
        )}

        {(activeBottomNav === "favorites" || activeBottomNav === "reminders") && (
          <>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="font-serif text-3xl text-dm-dark">
                  {savedTab === "FAVORITES" ? "Favoritos" : "Recordatorios"}
                </h2>
                <p className="text-sm font-sans text-gray-500">
                  {savedTab === "FAVORITES"
                    ? `${filteredFavoriteShops.length} tiendas guardadas`
                    : `${reminderStreams.length} recordatorios activos`}
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-gray-100 bg-white p-1 text-[11px] font-bold">
                <button
                  onClick={() => onSetSavedTab("FAVORITES")}
                  className={`rounded-full px-3 py-1 ${
                    savedTab === "FAVORITES"
                      ? "bg-dm-crimson text-white"
                      : "text-gray-400"
                  }`}
                >
                  Favoritos
                </button>
                <button
                  onClick={() => onSetSavedTab("REMINDERS")}
                  className={`rounded-full px-3 py-1 ${
                    savedTab === "REMINDERS"
                      ? "bg-dm-crimson text-white"
                      : "text-gray-400"
                  }`}
                >
                  Recordatorios
                </button>
              </div>
            </div>
            {savedTab === "FAVORITES" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredFavoriteShops.map((shop) => renderShopCard(shop))}
                {filteredFavoriteShops.length === 0 && (
                  <EmptyState
                    title={
                      canClientInteract
                        ? "Sin favoritos todavía"
                        : "Ingresá para guardar tiendas"
                    }
                    message={
                      canClientInteract
                        ? "Explorá tiendas y guardá las que te interesen."
                        : "Necesitás iniciar sesión para guardar favoritos."
                    }
                    actionLabel={
                      canClientInteract ? "Explorar tiendas" : "Ingresar"
                    }
                    onAction={() => {
                      if (canClientInteract) {
                        onSelectBottomNav("shops");
                      } else {
                        onRequireLogin();
                      }
                    }}
                  />
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {reminderStreams.map((stream) => (
                  <div
                    key={stream.id}
                    className="rounded-2xl border border-gray-100 bg-white p-4 md:p-5 text-left shadow-sm"
                  >
                    <p className="text-xs text-gray-500 uppercase">
                      Recordatorio
                    </p>
                    <p className="mt-1 text-sm font-bold text-dm-dark">
                      {stream.title}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {stream.scheduledTime} • {stream.shop.name}
                    </p>
                    <div className="mt-4 flex items-center justify-between text-[11px] font-bold">
                      <button
                        className="text-dm-crimson hover:text-dm-dark"
                        onClick={() => onOpenShop(stream.shop)}
                      >
                        Ver tienda
                      </button>
                      <button
                        className="text-gray-500 hover:text-dm-crimson"
                        onClick={() => onToggleReminder(stream.id)}
                      >
                        Quitar
                      </button>
                      <button
                        className="text-dm-crimson hover:text-dm-dark"
                        onClick={() => onOpenCalendarInvite(stream)}
                      >
                        Agregar al calendario
                      </button>
                    </div>
                  </div>
                ))}
                {reminderStreams.length === 0 && (
                  <EmptyState
                    title={
                      canClientInteract
                        ? "Sin recordatorios activos"
                        : "Ingresá para usar recordatorios"
                    }
                    message={
                      canClientInteract
                        ? "Agendá un vivo para recibir un aviso antes de empezar."
                        : "Iniciá sesión para activar recordatorios."
                    }
                    actionLabel={canClientInteract ? "Ver vivos" : "Ingresar"}
                    onAction={() => {
                      if (canClientInteract) {
                        onSelectBottomNav("home");
                        onFilterChange("Todos");
                      } else {
                        onRequireLogin();
                      }
                    }}
                  />
                )}
              </div>
            )}
          </>
        )}

        {activeBottomNav === "account" && (
          <div className="max-w-xl mx-auto rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm hidden md:block">
            <h2 className="font-serif text-2xl text-dm-dark">Tu cuenta</h2>
            {user.isLoggedIn ? (
              <>
                <p className="mt-2 text-sm text-gray-500">
                  Sesión activa como
                </p>
                <p className="mt-1 text-sm font-bold text-dm-dark">
                  {user.name || user.email}
                </p>
                <button
                  className="mt-5 inline-flex items-center justify-center rounded-full bg-dm-crimson px-5 py-2 text-xs font-bold text-white shadow-sm"
                  onClick={onLogout}
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm text-gray-500">
                  Inicia sesión para interactuar con tiendas.
                </p>
                <button
                  className="mt-5 inline-flex items-center justify-center rounded-full bg-dm-crimson px-5 py-2 text-xs font-bold text-white shadow-sm"
                  onClick={onRequireLogin}
                >
                  Ingresar
                </button>
              </>
            )}
          </div>
        )}
      </section>

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
          onClose={onCloseReel}
          onNotify={onNotify}
          isSeen={user.viewedReels.includes(selectedReel.id)}
        />
      )}
    </section>
  );
};
