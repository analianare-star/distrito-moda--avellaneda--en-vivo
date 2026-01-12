import React from "react";
import { CalendarDays, X } from "lucide-react";
import { Button } from "../Button";
import { NotificationItem, Stream, UserContext } from "../../types";

// AccountDrawer shows client profile, notifications, and reminders in a side panel.
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
      className={`fixed inset-0 z-[130] ${
        isOpen ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      <aside
        className={`absolute right-0 top-0 h-full w-[88vw] max-w-sm bg-white/95 backdrop-blur-xl shadow-2xl border-l border-gray-200/70 transition-transform duration-300 md:w-[30vw] md:max-w-md rounded-l-3xl flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-dm-crimson/10 text-dm-crimson font-bold">
              {user.isLoggedIn ? userInitial : "G"}
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-400">
                Cuenta
              </p>
              <h3 className="font-serif text-xl text-dm-dark">
                Perfil y estado
              </h3>
              <p className="text-[10px] text-gray-400">{userTypeLabel}</p>
            </div>
          </div>
          <button
            className="text-gray-400 hover:text-dm-dark"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 pt-4 pb-2 border-b border-gray-100 flex gap-2">
          {accountTabs.map((tab) => {
            const TabIcon = tab.icon;
            const badgeCount = tab.badge || 0;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex-1 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
                  activeTab === tab.id
                    ? "border-dm-crimson text-dm-crimson bg-red-50"
                    : "border-gray-200 text-gray-400"
                }`}
              >
                <span className="flex items-center justify-center gap-1">
                  <TabIcon size={12} />
                  {tab.label}
                  {badgeCount > 0 && (
                    <span className="ml-1 rounded-full bg-dm-crimson px-1.5 py-0.5 text-[9px] font-bold text-white">
                      {badgeCount > 9 ? "9+" : badgeCount}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex-1 overflow-y-auto p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] space-y-5">
          {user.isLoggedIn ? (
            activeTab === "RESUMEN" ? (
              <>
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs text-gray-400 uppercase tracking-widest">
                    Identidad
                  </p>
                  <p className="mt-1 text-sm font-bold text-dm-dark">
                    {user.name || user.email}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {user.email || "Correo no disponible"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg border border-gray-100 p-3 text-center">
                    <p className="text-gray-400 uppercase tracking-widest">
                      Favoritos
                    </p>
                    <p className="mt-1 text-lg font-bold text-dm-dark">
                      {user.favorites.length}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-100 p-3 text-center">
                    <p className="text-gray-400 uppercase tracking-widest">
                      Recordatorios
                    </p>
                    <p className="mt-1 text-lg font-bold text-dm-dark">
                      {user.reminders.length}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-100 p-3 text-center">
                    <p className="text-gray-400 uppercase tracking-widest">
                      Reportes
                    </p>
                    <p className="mt-1 text-lg font-bold text-dm-dark">
                      {user.reports.length}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-100 p-3 text-center">
                    <p className="text-gray-400 uppercase tracking-widest">
                      Rol
                    </p>
                    <p className="mt-1 text-sm font-bold text-dm-dark">
                      {userTypeLabel}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <button
                    className="rounded-lg border border-gray-100 p-3 text-left hover:border-dm-crimson"
                    onClick={() => onTabChange("NOTIFICATIONS")}
                  >
                    <p className="text-gray-400 uppercase tracking-widest">
                      Notificaciones
                    </p>
                    <p className="mt-1 text-lg font-bold text-dm-dark">
                      {unreadCount}
                    </p>
                    <p className="text-[10px] text-gray-400">Pendientes</p>
                  </button>
                  <button
                    className="rounded-lg border border-gray-100 p-3 text-left hover:border-dm-crimson"
                    onClick={() => onTabChange("REMINDERS")}
                  >
                    <p className="text-gray-400 uppercase tracking-widest">
                      Recordatorios
                    </p>
                    <p className="mt-1 text-lg font-bold text-dm-dark">
                      {reminderStreams.length}
                    </p>
                    <p className="text-[10px] text-gray-400">Activos</p>
                  </button>
                </div>
                {user.history.length > 0 && (
                  <div className="rounded-xl border border-gray-100 bg-white p-4">
                    <p className="text-[10px] uppercase tracking-widest text-gray-400">
                      Actividad reciente
                    </p>
                    <div className="mt-2 space-y-2 max-h-32 overflow-y-auto pr-1 text-xs text-gray-500">
                      {user.history.slice(0, 6).map((item, index) => (
                        <div
                          key={`${item.at}-${index}`}
                          className="flex items-start justify-between gap-2"
                        >
                          <span className="flex-1">{item.label}</span>
                          <span className="text-[10px] text-gray-400">
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
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                    Notificaciones
                  </p>
                  {unreadCount > 0 && (
                    <button
                      className="text-[10px] font-bold text-dm-crimson"
                      onClick={onMarkAllNotificationsRead}
                    >
                      Marcar todo
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-center text-xs text-gray-500">
                    Sin notificaciones por ahora.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
                    {notifications.map((note) => (
                      <div
                        key={note.id}
                        className="flex items-start gap-2 rounded-lg border border-gray-100 p-3"
                      >
                        <span
                          className={`mt-1 h-2 w-2 rounded-full ${
                            note.read ? "bg-gray-200" : "bg-dm-crimson"
                          }`}
                        />
                        <div className="flex-1">
                          <p
                            className={`text-xs ${
                              note.read
                                ? "text-gray-500"
                                : "text-dm-dark font-semibold"
                            }`}
                          >
                            {note.message}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {formatNotificationDate(note.createdAt)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 text-[10px]">
                          {note.type === "REMINDER" && note.refId && (
                            <button
                              className="font-bold text-dm-crimson hover:text-dm-dark"
                              onClick={() => onNotificationAction(note)}
                            >
                              Ver vivo
                            </button>
                          )}
                          {!note.read && (
                            <button
                              className="font-bold text-gray-400 hover:text-dm-dark"
                              onClick={() => onMarkNotificationRead(note.id)}
                            >
                              Leido
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
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                  Mis recordatorios
                </p>
                {reminderStreams.length === 0 ? (
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-center text-xs text-gray-500">
                    No tenes recordatorios activos.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reminderStreams.map((stream) => (
                      <div
                        key={stream.id}
                        className="rounded-lg border border-gray-100 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold text-dm-dark">
                              {stream.title}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              {stream.scheduledTime} • {stream.shop.name}
                            </p>
                          </div>
                          <button
                            className="text-[10px] font-bold text-gray-400 hover:text-dm-crimson"
                            onClick={() => onToggleReminder(stream.id)}
                          >
                            Quitar
                          </button>
                        </div>
                        <div className="mt-2 flex justify-end">
                          <button
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-dm-crimson hover:text-dm-dark"
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
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-center">
              <p className="text-sm text-gray-500">
                Inicia sesion para interactuar con tiendas.
              </p>
              <Button className="mt-4 w-full" onClick={onLogin}>
                Ingresar
              </Button>
              <button
                onClick={onRegister}
                className="mt-2 text-[11px] font-semibold text-gray-500 hover:text-dm-crimson"
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
