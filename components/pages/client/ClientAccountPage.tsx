import React from "react";
import { EmptyState } from "../../EmptyState";
import { NotificationItem, Stream, UserContext } from "../../../types";
import styles from "./ClientAccountPage.module.css";

// ClientAccountPage renders the client account dashboard.
interface ClientAccountPageProps {
  isLoggedIn: boolean;
  user: UserContext;
  notifications: NotificationItem[];
  reminderStreams: Stream[];
  onOpenCalendarInvite: (stream: Stream) => void;
}

export const ClientAccountPage: React.FC<ClientAccountPageProps> = ({
  isLoggedIn,
  user,
  notifications,
  reminderStreams,
  onOpenCalendarInvite,
}) => {
  if (!isLoggedIn) return null;

  const recentNotifications = [...notifications]
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
    )
    .slice(0, 5);

  return (
    <section className={styles.section} aria-label="Cuenta">
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Mi cuenta</h2>
          <p className={styles.subtitle}>Resumen de tu actividad</p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Usuario</p>
          <p className={styles.statValue}>{user.name || "Cliente"}</p>
          <p className={styles.statMeta}>{user.email || "Sin email"}</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Favoritos</p>
          <p className={styles.statValue}>{user.favorites.length}</p>
          <p className={styles.statMeta}>Tiendas guardadas</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Recordatorios</p>
          <p className={styles.statValue}>{reminderStreams.length}</p>
          <p className={styles.statMeta}>Vivos agendados</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Notificaciones</p>
          <p className={styles.statValue}>{notifications.length}</p>
          <p className={styles.statMeta}>Mensajes recientes</p>
        </div>
      </div>

      <div className={styles.sectionBlock}>
        <div className={styles.sectionHeader}>
          <h3>Recordatorios</h3>
          <span>{reminderStreams.length} activos</span>
        </div>
        {reminderStreams.length === 0 ? (
          <EmptyState
            title="Sin recordatorios"
            message="Agendate un vivo para recibir avisos."
          />
        ) : (
          <div className={styles.list}>
            {reminderStreams.slice(0, 5).map((stream) => (
              <div key={stream.id} className={styles.listItem}>
                <p className={styles.listTitle}>{stream.title}</p>
                <p className={styles.listMeta}>
                  {new Date(stream.fullDateISO).toLocaleString("es-AR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}{" "}
                  • {stream.shop?.name || "Tienda"}
                </p>
                <button
                  className={styles.listAction}
                  onClick={() => onOpenCalendarInvite(stream)}
                >
                  Agregar a calendario
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.sectionBlock}>
        <div className={styles.sectionHeader}>
          <h3>Notificaciones</h3>
          <span>{notifications.length} totales</span>
        </div>
        {recentNotifications.length === 0 ? (
          <EmptyState
            title="Sin notificaciones"
            message="Todavia no hay mensajes para tu cuenta."
          />
        ) : (
          <div className={styles.list}>
            {recentNotifications.map((note) => (
              <div key={note.id} className={styles.listItem}>
                <p className={styles.listTitle}>{note.message}</p>
                <p className={styles.listMeta}>
                  {note.createdAt
                    ? new Date(note.createdAt).toLocaleString("es-AR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })
                    : "Sin fecha"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
