import React from "react";
import { CalendarDays, X } from "lucide-react";
import { Button } from "../Button";
import { NotificationItem, Stream, UserContext } from "../../types";
import styles from "./AccountDrawer.module.css";

// AccountDrawer muestra perfil, notificaciones y recordatorios del cliente.
// AccountDrawer renders client profile, notifications, and reminders.
export type AccountTabId = "RESUMEN" | "NOTIFICATIONS" | "REMINDERS";

export interface AccountTabItem {
  id: AccountTabId;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: number;
}

interface AccountDrawerProps {
  isOpen: boolean;
  user: UserContext;
  userTypeLabel: string;
  accountTabs: AccountTabItem[];
  activeTab: AccountTabId;
  notifications: NotificationItem[];
  unreadCount: number;
  reminderStreams: Stream[];
  formatNotificationDate: (value?: string) => string;
  onClose: () => void;
  onTabChange: (tab: AccountTabId) => void;
  onMarkAllNotificationsRead: () => void;
  onMarkNotificationRead: (id: string) => void;
  onNotificationAction: (note: NotificationItem) => void;
  onToggleReminder: (streamId: string) => void;
  onOpenCalendarInvite: (stream: Stream) => void;
  onLogin: () => void;
  onRegister: () => void;
  onLogout: () => void;
}

export const AccountDrawer: React.FC<AccountDrawerProps> = ({
  isOpen,
  user,
  userTypeLabel,
  accountTabs,
  activeTab,
  notifications,
  unreadCount,
  reminderStreams,
  formatNotificationDate,
  onClose,
  onTabChange,
  onMarkAllNotificationsRead,
  onMarkNotificationRead,
  onNotificationAction,
  onToggleReminder,
  onOpenCalendarInvite,
  onLogin,
  onRegister,
  onLogout,
}) => {
  const userInitial = (user.name || user.email || "G").slice(0, 1).toUpperCase();

  return (
    <div
      className={`${styles.wrapper} ${
        isOpen ? styles.wrapperOpen : styles.wrapperClosed
      }`}
    >
      <div
        className={`${styles.scrim} ${
          isOpen ? styles.scrimOpen : styles.scrimClosed
        }`}
        onClick={onClose}
      />
      <aside
        className={`${styles.drawer} ${
          isOpen ? styles.drawerOpen : styles.drawerClosed
        }`}
      >
        <div className={styles.header}>
          <div className={styles.headerProfile}>
            <div className={styles.avatar}>
              {user.isLoggedIn ? userInitial : "G"}
            </div>
            <div>
              <p className={styles.headerEyebrow}>
                Cuenta
              </p>
              <h3 className={styles.headerTitle}>
                Perfil y estado
              </h3>
              <p className={styles.headerRole}>{userTypeLabel}</p>
            </div>
          </div>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>
        <div className={styles.tabs}>
          {accountTabs.map((tab) => {
            const TabIcon = tab.icon;
            const badgeCount = tab.badge || 0;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`${styles.tabButton} ${
                  activeTab === tab.id ? styles.tabActive : styles.tabInactive
                }`}
              >
                <span className={styles.tabLabel}>
                  <TabIcon size={12} />
                  {tab.label}
                  {badgeCount > 0 && (
                    <span className={styles.tabBadge}>
                      {badgeCount > 9 ? "9+" : badgeCount}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
        <div className={styles.content}>
          {user.isLoggedIn ? (
            activeTab === "RESUMEN" ? (
              <>
                <div className={styles.identityCard}>
                  <p className={styles.identityLabel}>
                    Identidad
                  </p>
                  <p className={styles.identityName}>
                    {user.name || user.email}
                  </p>
                  <p className={styles.identityEmail}>
                    {user.email || "Correo no disponible"}
                  </p>
                </div>
                <div className={styles.statsGrid}>
                  <div className={styles.statCard}>
                    <p className={styles.statLabel}>
                      Favoritos
                    </p>
                    <p className={styles.statValue}>
                      {user.favorites.length}
                    </p>
                  </div>
                  <div className={styles.statCard}>
                    <p className={styles.statLabel}>
                      Recordatorios
                    </p>
                    <p className={styles.statValue}>
                      {user.reminders.length}
                    </p>
                  </div>
                  <div className={styles.statCard}>
                    <p className={styles.statLabel}>
                      Reportes
                    </p>
                    <p className={styles.statValue}>
                      {user.reports.length}
                    </p>
                  </div>
                  <div className={styles.statCard}>
                    <p className={styles.statLabel}>
                      Rol
                    </p>
                    <p className={styles.statValueSmall}>
                      {userTypeLabel}
                    </p>
                  </div>
                </div>
                <div className={styles.statsGrid}>
                  <button
                    className={styles.actionCard}
                    onClick={() => onTabChange("NOTIFICATIONS")}
                  >
                    <p className={styles.statLabel}>
                      Notificaciones
                    </p>
                    <p className={styles.statValue}>
                      {unreadCount}
                    </p>
                    <p className={styles.actionSmall}>Pendientes</p>
                  </button>
                  <button
                    className={styles.actionCard}
                    onClick={() => onTabChange("REMINDERS")}
                  >
                    <p className={styles.statLabel}>
                      Recordatorios
                    </p>
                    <p className={styles.statValue}>
                      {reminderStreams.length}
                    </p>
                    <p className={styles.actionSmall}>Activos</p>
                  </button>
                </div>
                {user.history.length > 0 && (
                  <div className={styles.historyCard}>
                    <p className={styles.historyTitle}>
                      Actividad reciente
                    </p>
                    <div className={styles.historyList}>
                      {user.history.slice(0, 6).map((item, index) => (
                        <div
                          key={`${item.at}-${index}`}
                          className={styles.historyRow}
                        >
                          <span className="flex-1">{item.label}</span>
                          <span className={styles.historyTime}>
                            {formatNotificationDate(item.at)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <Button className="w-full" onClick={onLogout}>
                  Cerrar sesión
                </Button>
              </>
            ) : activeTab === "NOTIFICATIONS" ? (
              <>
                <div className={styles.notificationsHeader}>
                  <p className={styles.notificationsTitle}>
                    Notificaciones
                  </p>
                  {unreadCount > 0 && (
                    <button
                      className={styles.notificationsAction}
                      onClick={onMarkAllNotificationsRead}
                    >
                      Marcar todo
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className={styles.notificationsEmpty}>
                    Sin notificaciones por ahora.
                  </div>
                ) : (
                  <div className={styles.notificationsList}>
                    {notifications.map((note) => (
                      <div
                        key={note.id}
                        className={styles.notificationItem}
                      >
                        <span
                          className={`${styles.notificationDot} ${
                            note.read ? styles.notificationRead : styles.notificationUnread
                          }`}
                        />
                        <div className="flex-1">
                          <p
                            className={`${styles.notificationText} ${
                              note.read
                                ? styles.notificationTextRead
                                : styles.notificationTextUnread
                            }`}
                          >
                            {note.message}
                          </p>
                          <p className={styles.notificationDate}>
                            {formatNotificationDate(note.createdAt)}
                          </p>
                        </div>
                        <div className={styles.notificationActions}>
                          {note.type === "REMINDER" && note.refId && (
                            <button
                              className={styles.notificationPrimary}
                              onClick={() => onNotificationAction(note)}
                            >
                              Ver vivo
                            </button>
                          )}
                          {!note.read && (
                            <button
                              className={styles.notificationSecondary}
                              onClick={() => onMarkNotificationRead(note.id)}
                            >
                              Leído
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <p className={styles.remindersTitle}>
                  Mis recordatorios
                </p>
                {reminderStreams.length === 0 ? (
                  <div className={styles.remindersEmpty}>
                    No tenés recordatorios activos.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reminderStreams.map((stream) => (
                      <div
                        key={stream.id}
                        className={styles.reminderCard}
                      >
                        <div className={styles.reminderRow}>
                          <div>
                            <p className={styles.reminderName}>
                              {stream.title}
                            </p>
                            <p className={styles.reminderMeta}>
                              {stream.scheduledTime} • {stream.shop.name}
                            </p>
                          </div>
                          <button
                            className={styles.reminderRemove}
                            onClick={() => onToggleReminder(stream.id)}
                          >
                            Quitar
                          </button>
                        </div>
                        <div className={styles.reminderFooter}>
                          <button
                            className={styles.reminderCalendar}
                            onClick={() => onOpenCalendarInvite(stream)}
                          >
                            <CalendarDays size={12} />
                            Agregar al calendario
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )
          ) : (
            <div className={styles.guestCard}>
              <p className={styles.guestText}>
                Iniciá sesión para interactuar con tiendas.
              </p>
              <Button className="mt-4 w-full" onClick={onLogin}>
                Ingresar
              </Button>
              <button
                onClick={onRegister}
                className={styles.guestRegister}
              >
                Registrarme
              </button>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};
