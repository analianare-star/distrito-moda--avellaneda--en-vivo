import React from "react";
import { EmptyState } from "../../EmptyState";
import { Shop, Stream } from "../../../types";
import styles from "./ClientSavedPage.module.css";

// ClientSavedPage muestra favoritos y recordatorios.
// ClientSavedPage renders favorites and reminders.
interface ClientSavedPageProps {
  isLoading: boolean;
  savedTab: "FAVORITES" | "REMINDERS";
  filteredFavoriteShops: Shop[];
  reminderStreams: Stream[];
  canClientInteract: boolean;
  renderShopCard: (shop: Shop) => React.ReactNode;
  onSetSavedTab: (value: "FAVORITES" | "REMINDERS") => void;
  onSelectBottomNav: (value: string) => void;
  onRequireLogin: () => void;
  onOpenShop: (shop: Shop, options?: { navigate?: boolean }) => void;
  onToggleReminder: (streamId: string) => void;
  onOpenCalendarInvite: (stream: Stream) => void;
}

export const ClientSavedPage: React.FC<ClientSavedPageProps> = ({
  isLoading,
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
    <section className={styles.section} aria-label="Favoritos y recordatorios">
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>
            {savedTab === "FAVORITES" ? "Favoritos" : "Recordatorios"}
          </h2>
          <p className={styles.subtitle}>
            {savedTab === "FAVORITES"
              ? `${filteredFavoriteShops.length} tiendas guardadas`
              : `${reminderStreams.length} recordatorios activos`}
          </p>
        </div>
        <div className={styles.toggleGroup}>
          <button
            onClick={() => onSetSavedTab("FAVORITES")}
            className={`${styles.toggleButton} ${
              savedTab === "FAVORITES" ? styles.toggleActive : styles.toggleInactive
            }`}
          >
            Favoritos
          </button>
          <button
            onClick={() => onSetSavedTab("REMINDERS")}
            className={`${styles.toggleButton} ${
              savedTab === "REMINDERS" ? styles.toggleActive : styles.toggleInactive
            }`}
          >
            Recordatorios
          </button>
        </div>
      </div>

      {savedTab === "FAVORITES" ? (
        <div className={styles.gridFavorites}>
          {isLoading &&
            Array.from({ length: 6 }).map((_, index) => (
              <div key={`fav-skel-${index}`} className={styles.skeletonCard} />
            ))}
          {!isLoading && filteredFavoriteShops.map((shop) => renderShopCard(shop))}
          {!isLoading && filteredFavoriteShops.length === 0 && (
            <EmptyState
              title={
                canClientInteract
                  ? "Sin favoritos todavia"
                  : "Ingresar para guardar tiendas"
              }
              message={
                canClientInteract
                  ? "Explora tiendas y guarda las que te interesen."
                  : "Necesitas iniciar sesion para guardar favoritos."
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
        <div className={styles.gridReminders}>
          {isLoading &&
            Array.from({ length: 3 }).map((_, index) => (
              <div key={`rem-skel-${index}`} className={styles.skeletonReminder} />
            ))}
          {!isLoading &&
            reminderStreams.map((stream) => (
              <div key={stream.id} className={styles.reminderCard}>
                <p className={styles.reminderDate}>
                  {new Date(stream.fullDateISO).toLocaleString("es-AR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </p>
                <p className={styles.reminderTitle}>{stream.title}</p>
                <p className={styles.reminderShop}>
                  {stream.shop?.name || "Tienda"}
                </p>
                <div className={styles.reminderActions}>
                  <button
                    onClick={() => onOpenShop(stream.shop)}
                    className={styles.actionButton}
                  >
                    Ver tienda
                  </button>
                  <button
                    onClick={() => onToggleReminder(stream.id)}
                    className={styles.actionButton}
                  >
                    Quitar
                  </button>
                  <button
                    onClick={() => onOpenCalendarInvite(stream)}
                    className={styles.actionButton}
                  >
                    Calendario
                  </button>
                </div>
              </div>
            ))}
          {!isLoading && reminderStreams.length === 0 && (
            <EmptyState
              title="Sin recordatorios activos"
              message="Agenda un vivo para recibir alertas antes de que empiece."
              actionLabel="Explorar vivos"
              onAction={() => onSelectBottomNav("live")}
            />
          )}
        </div>
      )}
    </section>
  );
};
