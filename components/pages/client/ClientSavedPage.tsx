import React from "react";
import { EmptyState } from "../../EmptyState";
import { Shop, Stream } from "../../../types";
import styles from "./ClientSavedPage.module.css";

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
        <div className={styles.gridReminders}>
          {reminderStreams.map((stream) => (
            <div
              key={stream.id}
              className={styles.reminderCard}
            >
              <p className={styles.reminderDate}>
                {new Date(stream.fullDateISO).toLocaleString("es-AR", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </p>
              <p className={styles.reminderTitle}>
                {stream.title}
              </p>
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
