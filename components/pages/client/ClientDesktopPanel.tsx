import React, { useEffect, useMemo, useState } from "react";
import { CLIENT_NAV_ITEMS } from "../../../navigation";
import { Shop, Stream, StreamStatus, UserContext } from "../../../types";
import { LogoBubble } from "../../LogoBubble";
import { ShopMapEmbed } from "../../ShopMapEmbed";
import panelStyles from "./ClientHomePage.module.css";

interface ClientDesktopPanelProps {
  brandLogo: string;
  user: UserContext;
  activeBottomNav: string;
  featuredShops: Shop[];
  queueStreamsSource: Stream[];
  onSelectBottomNav: (value: string) => void;
  onOpenShop: (shop: Shop) => void;
  onOpenLogin: () => void;
  onLogout: () => void;
}

export const ClientDesktopPanel: React.FC<ClientDesktopPanelProps> = ({
  brandLogo,
  user,
  activeBottomNav,
  featuredShops,
  queueStreamsSource,
  onSelectBottomNav,
  onOpenShop,
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
      value: featuredShops.length,
    },
  ];

  const upcomingHero = queueStreams.upcoming[0] ?? queueStreams.live[0];
  const promoHeading = upcomingHero
    ? `Siguiente vivo: ${upcomingHero.shop.name}`
    : "Sin novedades en vivo";
  const topShopList = featuredShops.slice(0, 3);
  const navItems = useMemo(() => CLIENT_NAV_ITEMS, []);

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
        {isDesktop ? <ShopMapEmbed /> : null}
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
