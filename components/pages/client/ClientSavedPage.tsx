import React from "react";
import { EmptyState } from "../../EmptyState";
import { Shop, Stream } from "../../../types";

// ClientSavedPage muestra favoritos y recordatorios.
// ClientSavedPage renders favorites and reminders.
interface ClientSavedPageProps {
  savedTab: "FAVORITES" | "REMINDERS";
  filteredFavoriteShops: Shop[];
  reminderStreams: Stream[];
  canClientInteract: boolean;
  renderShopCard: (shop: Shop) => React.ReactNode;
  onSetSavedTab: (value: "FAVORITES" | "REMINDERS") => void;
  onSelectBottomNav: (value: string) => void;
  onRequireLogin: () => void;
  onOpenShop: (shop: Shop) => void;
  onToggleReminder: (streamId: string) => void;
  onOpenCalendarInvite: (stream: Stream) => void;
}

export const ClientSavedPage: React.FC<ClientSavedPageProps> = ({
  savedTab,
  filteredFavoriteShops,
  reminderStreams,
  canClientInteract,
  renderShopCard,
  onSetSavedTab,
  onSelectBottomNav,
  onRequireLogin,
  onOpenShop,
  onToggleReminder,
  onOpenCalendarInvite,
}) => {
  return (
    <section className="max-w-7xl mx-auto px-4 py-10" aria-label="Favoritos y recordatorios">
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
              actionLabel={canClientInteract ? "Explorar tiendas" : "Ingresar"}
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
              <p className="text-xs text-gray-500">
                {new Date(stream.fullDateISO).toLocaleString("es-AR", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </p>
              <p className="mt-2 text-sm font-bold text-dm-dark">
                {stream.title}
              </p>
              <p className="text-[11px] text-gray-500">
                {stream.shop?.name || "Tienda"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => onOpenShop(stream.shop)}
                  className="rounded-full border border-gray-200 px-3 py-1 text-[11px] font-bold text-gray-500 hover:text-dm-dark"
                >
                  Ver tienda
                </button>
                <button
                  onClick={() => onToggleReminder(stream.id)}
                  className="rounded-full border border-gray-200 px-3 py-1 text-[11px] font-bold text-gray-500 hover:text-dm-dark"
                >
                  Quitar
                </button>
                <button
                  onClick={() => onOpenCalendarInvite(stream)}
                  className="rounded-full border border-gray-200 px-3 py-1 text-[11px] font-bold text-gray-500 hover:text-dm-dark"
                >
                  Calendario
                </button>
              </div>
            </div>
          ))}
          {reminderStreams.length === 0 && (
            <EmptyState
              title="Sin recordatorios activos"
              message="Agendá un vivo para recibir alertas antes de que empiece."
              actionLabel="Explorar vivos"
              onAction={() => onSelectBottomNav("live")}
            />
          )}
        </div>
      )}
    </section>
  );
};
