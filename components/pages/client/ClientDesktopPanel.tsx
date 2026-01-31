import React, { Suspense, useEffect, useMemo, useState } from "react";
import { CLIENT_NAV_ITEMS } from "../../../navigation";
import { Shop, Stream, StreamStatus, UserContext, NotificationItem } from "../../../types";
import { LogoBubble } from "../../LogoBubble";
import panelStyles from "./ClientHomePage.module.css";

const ShopMapEmbed = React.lazy(async () => {
  const mod = await import("../../ShopMapEmbed");
  return { default: mod.ShopMapEmbed };
});

interface ClientDesktopPanelProps {
  brandLogo: string;
  user: UserContext;
  activeBottomNav: string;
  featuredShops: Shop[];
  favoriteShops: Shop[];
  queueStreamsSource: Stream[];
  notifications: NotificationItem[];
  reminderStreams: Stream[];
  onSelectBottomNav: (value: string) => void;
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
  onOpenLogin: () => void;
  onLogout: () => void;
}

export const ClientDesktopPanel: React.FC<ClientDesktopPanelProps> = ({
  brandLogo,
  user,
  activeBottomNav,
  featuredShops,
  favoriteShops,
  queueStreamsSource,
  notifications,
  reminderStreams,
  onSelectBottomNav,
  onOpenShop,
  onToggleFavorite,
  onToggleReminder,
  onOpenCalendarInvite,
  onOpenStream,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onNotificationAction,
  onNotify,
  onOpenLogin,
  onLogout,
}) => {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(min-width: 1024px)");
    const handleChange = () => setIsDesktop(media.matches);
    handleChange();
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  const safeFeatured = Array.isArray(featuredShops) ? featuredShops : [];
  const safeFavorites = Array.isArray(favoriteShops) ? favoriteShops : [];
  const safeReminders = Array.isArray(reminderStreams) ? reminderStreams : [];
  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const queueSource = Array.isArray(queueStreamsSource)
    ? queueStreamsSource
    : [];
  const queueStreams = useMemo(
    () =>
      queueSource
        .filter(
          (stream) =>
            stream.isVisible &&
            stream.shop?.status === "ACTIVE" &&
            (stream.status === StreamStatus.LIVE ||
              stream.status === StreamStatus.UPCOMING)
        )
        .reduce<{ live: Stream[]; upcoming: Stream[] }>(
          (acc, stream) => {
            if (stream.status === StreamStatus.LIVE) {
              acc.live.push(stream);
            } else if (stream.status === StreamStatus.UPCOMING) {
              acc.upcoming.push(stream);
            }
            return acc;
          },
          { live: [], upcoming: [] }
        ),
    [queueSource]
  );

  const desktopPanelStats = [
    {
      label: "Vivos en vivo",
      value: queueStreams.live.length,
    },
    {
      label: "Vivos proximos",
      value: queueStreams.upcoming.length,
    },
    {
      label: "Tiendas destacadas",
      value: safeFeatured.length,
    },
  ];

  const upcomingHero = queueStreams.upcoming[0] ?? queueStreams.live[0];
  const promoHeading = upcomingHero
    ? `Siguiente vivo: ${upcomingHero.shop.name}`
    : "Sin novedades en vivo";
  const topShopList = safeFeatured.slice(0, 3);
  const navItems = useMemo(() => CLIENT_NAV_ITEMS, []);
  const showAccountPanel = activeBottomNav === "account" && user.isLoggedIn;

  type AccountTab = "RESUMEN" | "FAVORITOS" | "RECORDATORIOS" | "NOTIFICACIONES";
  const [accountTab, setAccountTab] = useState<AccountTab>("RESUMEN");

  useEffect(() => {
    if (!showAccountPanel) {
      setAccountTab("RESUMEN");
    }
  }, [showAccountPanel]);

  const recentReminders = safeReminders.slice(0, 5);
  const recentNotifications = safeNotifications.slice(0, 6);
  const recentFavorites = safeFavorites.slice(0, 6);

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

  const accountPanel = showAccountPanel ? (
    <div className={panelStyles.panelAccount}>
      <div className={panelStyles.panelAccountTabs} role="tablist" aria-label="Panel cuenta">
        {(
          [
            { id: "RESUMEN", label: "Resumen" },
            { id: "FAVORITOS", label: "Favoritos" },
            { id: "RECORDATORIOS", label: "Recordatorios" },
            { id: "NOTIFICACIONES", label: "Alertas" },
          ] as { id: AccountTab; label: string }[]
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={accountTab === tab.id}
            className={`${panelStyles.panelAccountTab} ${
              accountTab === tab.id ? panelStyles.panelAccountTabActive : ""
            }`}
            onClick={() => setAccountTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={panelStyles.panelAccountBody}>
        {accountTab === "RESUMEN" && (
          <div className={panelStyles.panelAccountSummary}>
            {[
              { label: "Favoritos", value: safeFavorites.length },
              { label: "Recordatorios", value: safeReminders.length },
              {
                label: "Alertas",
                value: safeNotifications.filter((note) => !note.read).length,
              },
            ].map((item) => (
              <div key={item.label} className={panelStyles.panelAccountSummaryItem}>
                <span className={panelStyles.panelAccountSummaryValue}>{item.value}</span>
                <span className={panelStyles.panelAccountSummaryLabel}>{item.label}</span>
              </div>
            ))}
          </div>
        )}

        {accountTab === "FAVORITOS" && (
          <>
            {recentFavorites.length === 0 ? (
              <div className={panelStyles.panelAccountEmpty}>
                Todavia no guardaste tiendas favoritas.
              </div>
            ) : (
              recentFavorites.map((shop) => (
                <div key={shop.id} className={panelStyles.panelAccountRow}>
                  <LogoBubble
                    src={shop.logoUrl}
                    alt={shop.name}
                    size={42}
                    seed={shop.id || shop.name}
                  />
                  <div className={panelStyles.panelAccountMeta}>
                    <span className={panelStyles.panelAccountTitle}>{shop.name}</span>
                    <span className={panelStyles.panelAccountSub}>Tienda favorita</span>
                  </div>
                  <div className={panelStyles.panelAccountActions}>
                    <button
                      type="button"
                      className={panelStyles.panelAccountAction}
                      onClick={() => onOpenShop(shop)}
                    >
                      Ver
                    </button>
                    <button
                      type="button"
                      className={`${panelStyles.panelAccountAction} ${panelStyles.panelAccountActionDanger}`}
                      onClick={() => onToggleFavorite(shop.id)}
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {accountTab === "RECORDATORIOS" && (
          <>
            {recentReminders.length === 0 ? (
              <div className={panelStyles.panelAccountEmpty}>
                No hay recordatorios activos todavia.
              </div>
            ) : (
              recentReminders.map((stream) => (
                <div key={stream.id} className={panelStyles.panelAccountRow}>
                  <LogoBubble
                    src={stream.shop.logoUrl}
                    alt={stream.shop.name}
                    size={42}
                    seed={stream.shop.id || stream.shop.name}
                  />
                  <div className={panelStyles.panelAccountMeta}>
                    <span className={panelStyles.panelAccountTitle}>{stream.title}</span>
                    <span className={panelStyles.panelAccountSub}>{formatStreamMeta(stream)}</span>
                  </div>
                  <div className={panelStyles.panelAccountActions}>
                    <button
                      type="button"
                      className={panelStyles.panelAccountAction}
                      onClick={() => onOpenStream(stream)}
                    >
                      Ir
                    </button>
                    <button
                      type="button"
                      className={panelStyles.panelAccountAction}
                      onClick={() => onOpenCalendarInvite(stream)}
                    >
                      Calendar
                    </button>
                    <button
                      type="button"
                      className={`${panelStyles.panelAccountAction} ${panelStyles.panelAccountActionDanger}`}
                      onClick={() => onToggleReminder(stream.id)}
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {accountTab === "NOTIFICACIONES" && (
          <>
            <div className={panelStyles.panelAccountHeader}>
              <span className={panelStyles.panelSubheading}>Notificaciones</span>
              <button
                type="button"
                className={panelStyles.panelAccountHeaderButton}
                onClick={onMarkAllNotificationsRead}
              >
                Marcar todo
              </button>
            </div>
            {recentNotifications.length === 0 ? (
              <div className={panelStyles.panelAccountEmpty}>
                No hay alertas nuevas por ahora.
              </div>
            ) : (
              recentNotifications.map((note) => (
                <div key={note.id} className={panelStyles.panelAccountRow}>
                  <div className={panelStyles.panelAccountMeta}>
                    <span className={panelStyles.panelAccountTitle}>{note.message}</span>
                    <span className={panelStyles.panelAccountSub}>
                      {formatNotificationMeta(note)}
                    </span>
                  </div>
                  <div className={panelStyles.panelAccountActions}>
                    {!note.read && (
                      <button
                        type="button"
                        className={panelStyles.panelAccountAction}
                        onClick={() => onMarkNotificationRead(note.id)}
                      >
                        Leida
                      </button>
                    )}
                    <button
                      type="button"
                      className={panelStyles.panelAccountAction}
                      onClick={() => {
                        if (!note.refId) {
                          onNotify("Sin referencia", "Esta alerta no tiene destino directo.", "info");
                          return;
                        }
                        onNotificationAction(note);
                      }}
                    >
                      Ver
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  ) : null;

  return (
    <aside className={panelStyles.desktopPanel} aria-label="Panel lateral de escritorio">
      <div className={panelStyles.panelBrand}>
        <img src={brandLogo} alt="Avellaneda en Vivo" className={panelStyles.panelBrandLogo} />
      </div>
      <div className={panelStyles.panelHeader}>
        <p className={panelStyles.panelLabel}>Panel de control</p>
        <span className={panelStyles.panelSmallLabel}>Resumen en tiempo real</span>
      </div>
      <div className={panelStyles.panelUser}>
        <span className={panelStyles.panelUserTitle}>
          {user.isLoggedIn ? "Sesion activa" : "Ingresar"}
        </span>
        <span className={panelStyles.panelUserName}>
          {user.isLoggedIn ? user.name || user.email || "Tienda" : "Invitado"}
        </span>
        {user.isLoggedIn ? (
          <button type="button" className={panelStyles.panelAction} onClick={onLogout}>
            Cerrar sesion
          </button>
        ) : (
          <div className={panelStyles.panelAuthButtons}>
            <button type="button" className={panelStyles.panelAction} onClick={onOpenLogin}>
              Ingresar
            </button>
            <button
              type="button"
              className={panelStyles.panelActionSecondary}
              onClick={onOpenLogin}
            >
              Registrarme
            </button>
          </div>
        )}
      </div>
      <nav className={panelStyles.panelNav} aria-label="Navegacion desktop">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`${panelStyles.panelNavButton} ${
              activeBottomNav === item.id ? panelStyles.panelNavButtonActive : ""
            }`}
            onClick={() => onSelectBottomNav(item.id)}
          >
            {item.id === "account" && !user.isLoggedIn ? "Ingresar" : item.label}
          </button>
        ))}
      </nav>
      {accountPanel}
      <ul className={panelStyles.panelList}>
        {desktopPanelStats.map((item) => (
          <li key={item.label} className={panelStyles.panelItem}>
            <span className={panelStyles.panelValue}>{item.value}</span>
            <span className={panelStyles.panelLabelText}>{item.label}</span>
          </li>
        ))}
      </ul>
      <div className={panelStyles.panelNotice}>
        <strong>{promoHeading}</strong>
        <span>Explora nuevas tiendas y vivos destacados en Avellaneda.</span>
      </div>
      <div className={panelStyles.panelTopShops}>
        <span className={panelStyles.panelSubheading}>Top tiendas en vivo</span>
        <div className={panelStyles.panelShopList}>
          {topShopList.map((shop) => (
            <button
              key={shop.id}
              type="button"
              className={panelStyles.panelShopItem}
              onClick={() => onOpenShop(shop)}
            >
              <LogoBubble
                src={shop.logoUrl}
                alt={shop.name}
                size={36}
                seed={shop.id || shop.name}
              />
              <span className={panelStyles.panelShopName}>{shop.name}</span>
            </button>
          ))}
        </div>
      </div>
      <div className={panelStyles.panelMap}>
        <p className={panelStyles.panelMapTitle}>Mapa en vivo</p>
        <p className={panelStyles.panelMapCopy}>
          Descubre tiendas activas y puntos clave dentro de Avellaneda.
        </p>
        {isDesktop ? (
          <Suspense fallback={<div className="min-h-[220px] w-full rounded-2xl bg-white/80" />}>
            <ShopMapEmbed />
          </Suspense>
        ) : null}
        <button
          type="button"
          className={panelStyles.panelMapCta}
          onClick={onOpenLogin}
        >
          Registrar mi tienda gratis
        </button>
      </div>
      <div className={panelStyles.panelExtras}>
        <span className={panelStyles.panelSubheading}>Ventajas hoy</span>
        <ul className={panelStyles.panelExtrasList}>
          <li className={panelStyles.panelExtrasItem}>WhatsApp directo con tiendas verificadas.</li>
          <li className={panelStyles.panelExtrasItem}>Agenda clara: vivos reales y confiables.</li>
          <li className={panelStyles.panelExtrasItem}>Reels efimeros para descubrir novedades.</li>
        </ul>
      </div>
      {upcomingHero && (
        <div className={panelStyles.panelPromoCard}>
          <p className={panelStyles.panelPromoTitle}>Proximo</p>
          <strong className={panelStyles.panelPromoShop}>{upcomingHero.shop.name}</strong>
          <span className={panelStyles.panelPromoMeta}>
            {upcomingHero.status === StreamStatus.LIVE ? "En vivo ahora" : "Proximo vivo"}
          </span>
        </div>
      )}
      <button
        type="button"
        className={panelStyles.panelButton}
        onClick={() => onSelectBottomNav("live")}
      >
        Ver vivos
      </button>
    </aside>
  );
};
