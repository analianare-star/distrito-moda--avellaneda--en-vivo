import React, { useMemo, useState } from "react";
import { EmptyState } from "../../EmptyState";
import { LogoBubble } from "../../LogoBubble";
import { NotificationItem, Shop, Stream, UserContext } from "../../../types";
import styles from "./ClientAccountPage.module.css";

type AccountTab = "RESUMEN" | "FAVORITOS" | "RECORDATORIOS" | "ALERTAS";

// ClientAccountPage renders the client account dashboard.
interface ClientAccountPageProps {
  isLoggedIn: boolean;
  user: UserContext;
  favoriteShops: Shop[];
  notifications: NotificationItem[];
  reminderStreams: Stream[];
  onRequireLogin: () => void;
  onOpenShop: (shop: Shop) => void;
  onToggleFavorite: (shopId: string) => void;
  onToggleReminder: (streamId: string) => void;
  onOpenCalendarInvite: (stream: Stream) => void;
  onOpenStream: (stream: Stream) => void;
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  onNotificationAction: (note: NotificationItem) => void;
  onNotify: (
    title: string,
    message: string,
    tone?: "info" | "success" | "warning" | "error"
  ) => void;
}

export const ClientAccountPage: React.FC<ClientAccountPageProps> = ({
  isLoggedIn,
  user,
  favoriteShops,
  notifications,
  reminderStreams,
  onRequireLogin,
  onOpenShop,
  onToggleFavorite,
  onToggleReminder,
  onOpenCalendarInvite,
  onOpenStream,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onNotificationAction,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<AccountTab>("RESUMEN");

  if (!isLoggedIn) {
    return (
      <section className={styles.section} aria-label="Cuenta">
        <EmptyState
          title="Ingresá para ver tu cuenta"
          message="Tus favoritos, recordatorios y alertas viven aca."
          actionLabel="Ingresar"
          onAction={onRequireLogin}
        />
      </section>
    );
  }

  const safeFavorites = Array.isArray(favoriteShops) ? favoriteShops : [];
  const safeReminders = Array.isArray(reminderStreams) ? reminderStreams : [];
  const safeNotifications = Array.isArray(notifications) ? notifications : [];

  const unreadCount = useMemo(
    () => safeNotifications.filter((note) => !note.read).length,
    [safeNotifications]
  );

  const recentNotifications = useMemo(
    () =>
      [...safeNotifications]
        .sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
        )
        .slice(0, 12),
    [safeNotifications]
  );

  const favoriteSlice = safeFavorites.slice(0, 12);
  const reminderSlice = safeReminders.slice(0, 12);

  const formatStreamMeta = (stream: Stream) => {
    try {
      const date = new Date(stream.fullDateISO);
      const day = date.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "short",
      });
      return `${day} • ${stream.scheduledTime}`;
    } catch {
      return stream.scheduledTime || "Proximamente";
    }
  };

  const formatNotificationMeta = (note: NotificationItem) => {
    try {
      const date = new Date(note.createdAt);
      return date.toLocaleString("es-AR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Reciente";
    }
  };

  return (
    <section className={styles.section} aria-label="Cuenta">
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Mi cuenta</h2>
          <p className={styles.subtitle}>Resumen de tu actividad</p>
        </div>
      </div>

      <div className={styles.identityCard}>
        <div className={styles.identityAvatar}>
          {(user.name || user.email || "C").slice(0, 1).toUpperCase()}
        </div>
        <div className={styles.identityMeta}>
          <p className={styles.identityName}>{user.name || "Cliente"}</p>
          <p className={styles.identityEmail}>{user.email || "Correo no disponible"}</p>
        </div>
        {unreadCount > 0 && <span className={styles.identityBadge}>{unreadCount}</span>}
      </div>

      <div className={styles.statsGrid}>
        {[
          { label: "Favoritos", value: safeFavorites.length, tab: "FAVORITOS" as AccountTab },
          {
            label: "Recordatorios",
            value: safeReminders.length,
            tab: "RECORDATORIOS" as AccountTab,
          },
          { label: "Alertas", value: unreadCount, tab: "ALERTAS" as AccountTab },
        ].map((item) => (
          <button
            key={item.label}
            type="button"
            className={styles.statCard}
            onClick={() => setActiveTab(item.tab)}
          >
            <p className={styles.statLabel}>{item.label}</p>
            <p className={styles.statValue}>{item.value}</p>
            <p className={styles.statMeta}>Ver detalle</p>
          </button>
        ))}
      </div>

      <div className={styles.tabStrip} role="tablist" aria-label="Secciones de cuenta">
        {[
          { id: "RESUMEN", label: "Resumen" },
          { id: "FAVORITOS", label: "Favoritos" },
          { id: "RECORDATORIOS", label: "Recordatorios" },
          { id: "ALERTAS", label: "Alertas" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`${styles.tabButton} ${activeTab === tab.id ? styles.tabActive : ""}`}
            onClick={() => setActiveTab(tab.id as AccountTab)}
          >
            {tab.label}
            {tab.id === "ALERTAS" && unreadCount > 0 && (
              <span className={styles.tabBadge}>{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === "RESUMEN" && (
        <div className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <h3>Tu cuenta en un vistazo</h3>
            <span>{user.history.length} acciones</span>
          </div>
          {user.history.length === 0 ? (
            <EmptyState
              title="Sin actividad reciente"
              message="Explora tiendas y vivos para ver tu historial aqui."
            />
          ) : (
            <div className={styles.list}>
              {user.history.slice(0, 10).map((item, index) => (
                <div key={`${item.at}-${index}`} className={styles.listItem}>
                  <p className={styles.listTitle}>{item.label}</p>
                  <p className={styles.listMeta}>
                    {item.at
                      ? new Date(item.at).toLocaleString("es-AR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })
                      : "Reciente"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "FAVORITOS" && (
        <div className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <h3>Tiendas favoritas</h3>
            <span>{safeFavorites.length} guardadas</span>
          </div>
          {favoriteSlice.length === 0 ? (
            <EmptyState
              title="Sin favoritos"
              message="Guarda tiendas para volver rapido cuando quieras."
            />
          ) : (
            <div className={styles.list}>
              {favoriteSlice.map((shop) => (
                <div key={shop.id} className={styles.listRow}>
                  <LogoBubble
                    src={shop.logoUrl}
                    alt={shop.name}
                    size={48}
                    seed={shop.id || shop.name}
                  />
                  <div className={styles.rowMeta}>
                    <p className={styles.listTitle}>{shop.name}</p>
                    <p className={styles.listMeta}>Favorita</p>
                  </div>
                  <div className={styles.rowActions}>
                    <button
                      type="button"
                      className={styles.rowAction}
                      onClick={() => onOpenShop(shop)}
                    >
                      Ver
                    </button>
                    <button
                      type="button"
                      className={`${styles.rowAction} ${styles.rowActionDanger}`}
                      onClick={() => onToggleFavorite(shop.id)}
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "RECORDATORIOS" && (
        <div className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <h3>Recordatorios activos</h3>
            <span>{safeReminders.length} vivos</span>
          </div>
          {reminderSlice.length === 0 ? (
            <EmptyState
              title="Sin recordatorios"
              message="Agendate un vivo para recibir avisos."
            />
          ) : (
            <div className={styles.list}>
              {reminderSlice.map((stream) => (
                <div key={stream.id} className={styles.listRow}>
                  <LogoBubble
                    src={stream.shop.logoUrl}
                    alt={stream.shop.name}
                    size={48}
                    seed={stream.shop.id || stream.shop.name}
                  />
                  <div className={styles.rowMeta}>
                    <p className={styles.listTitle}>{stream.title}</p>
                    <p className={styles.listMeta}>{formatStreamMeta(stream)}</p>
                  </div>
                  <div className={styles.rowActions}>
                    <button
                      type="button"
                      className={styles.rowAction}
                      onClick={() => onOpenStream(stream)}
                    >
                      Ir
                    </button>
                    <button
                      type="button"
                      className={styles.rowAction}
                      onClick={() => onOpenCalendarInvite(stream)}
                    >
                      Calendar
                    </button>
                    <button
                      type="button"
                      className={`${styles.rowAction} ${styles.rowActionDanger}`}
                      onClick={() => onToggleReminder(stream.id)}
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "ALERTAS" && (
        <div className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <h3>Notificaciones</h3>
            <span>{safeNotifications.length} totales</span>
          </div>
          <div className={styles.sectionActions}>
            <button
              type="button"
              className={styles.sectionAction}
              onClick={onMarkAllNotificationsRead}
            >
              Marcar todo
            </button>
          </div>
          {recentNotifications.length === 0 ? (
            <EmptyState
              title="Sin notificaciones"
              message="Todavia no hay mensajes para tu cuenta."
            />
          ) : (
            <div className={styles.list}>
              {recentNotifications.map((note) => (
                <div key={note.id} className={styles.listRow}>
                  <span
                    className={`${styles.noticeDot} ${
                      note.read ? styles.noticeRead : styles.noticeUnread
                    }`}
                    aria-hidden="true"
                  />
                  <div className={styles.rowMeta}>
                    <p className={styles.listTitle}>{note.message}</p>
                    <p className={styles.listMeta}>{formatNotificationMeta(note)}</p>
                  </div>
                  <div className={styles.rowActions}>
                    {!note.read && (
                      <button
                        type="button"
                        className={styles.rowAction}
                        onClick={() => onMarkNotificationRead(note.id)}
                      >
                        Leida
                      </button>
                    )}
                    <button
                      type="button"
                      className={styles.rowAction}
                      onClick={() => {
                        if (!note.refId) {
                          onNotify(
                            "Sin referencia",
                            "Esta alerta no tiene un destino directo.",
                            "info"
                          );
                          return;
                        }
                        onNotificationAction(note);
                      }}
                    >
                      Ver
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
