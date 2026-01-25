import React, { useState, useEffect } from "react";
import { CalendarCheck, Radio, Sparkles } from "lucide-react";
import { HeroSection } from "../../HeroSection";
import { ReelsStrip } from "../../ReelsStrip";
import { StreamCard } from "../../StreamCard";
import { EmptyState } from "../../EmptyState";
import { Reel, Shop, Stream, StreamStatus, UserContext } from "../../../types";
import { CLIENT_NAV_ITEMS } from "../../../navigation";
import { getShopCoverUrl } from "../../../utils/shopMedia";
import { LiveQueueModal } from "../../LiveQueueModal";
import { LogoBubble } from "../../LogoBubble";
import { ShopMapEmbed } from "../../ShopMapEmbed";
import styles from "./ClientHomePage.module.css";

// ClientHomePage muestra home y agenda publica.
// ClientHomePage renders home and public agenda.
interface ClientHomePageProps {
  isLoading: boolean;
  brandLogo: string;
  activeBottomNav: string;
  activeFilter: string;
  filteredStreams: Stream[];
  sortedLiveStreams: Stream[];
  activeReels: Reel[];
  featuredShops: Shop[];
  queueStreamsSource: Stream[];
  user: UserContext;
  canClientInteract: boolean;
  onFilterChange: (value: string) => void;
  onSelectBottomNav: (value: string) => void;
  onOpenShop: (shop: Shop, options?: { navigate?: boolean }) => void;
  onViewReel: (reel: Reel) => void;
  onReport: (stream: Stream) => void;
  onToggleReminder: (streamId: string) => void;
  onLike: (streamId: string) => void;
  onRate: (streamId: string, rating: number) => void;
  onDownloadCard: (stream: Stream) => void;
  onNotify: (
    title: string,
    message: string,
    tone?: "info" | "success" | "warning" | "error"
  ) => void;
  onOpenLogin: () => void;
  onLogout: () => void;
  onQueueModalChange: (isOpen: boolean) => void;
}

export const ClientHomePage: React.FC<ClientHomePageProps> = ({
  isLoading,
  brandLogo,
  activeBottomNav,
  activeFilter,
  filteredStreams,
  sortedLiveStreams,
  activeReels,
  featuredShops,
  queueStreamsSource,
  user,
  canClientInteract,
  onFilterChange,
  onSelectBottomNav,
  onOpenShop,
  onViewReel,
  onReport,
  onToggleReminder,
  onLike,
  onRate,
  onDownloadCard,
  onNotify,
  onOpenLogin,
  onLogout,
  onQueueModalChange,
}) => {
  const [queueStream, setQueueStream] = useState<Stream | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    onQueueModalChange(Boolean(queueStream));
  }, [queueStream, onQueueModalChange]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(min-width: 1024px)");
    const handleChange = () => setIsDesktop(media.matches);
    handleChange();
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  const visibleStreams = filteredStreams.slice(0, 6);
  const streamLayout = ["wide", "small", "small", "wide", "small", "small"];
  const isMockStream = (streamId: string) => streamId.startsWith("mock-stream-");
  const blockMockAction = () => {
    onNotify?.("Demo de prueba", "Estas historias son de prueba para diseno UI.", "info");
  };
  const queueSource = Array.isArray(queueStreamsSource)
    ? queueStreamsSource
    : [];
  const queueStreams = queueSource
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
    );
  queueStreams.upcoming.sort(
    (a, b) =>
      new Date(a.fullDateISO).getTime() - new Date(b.fullDateISO).getTime()
  );
  const queueList = [...queueStreams.live, ...queueStreams.upcoming].slice(
    0,
    10
  );

  const formatUpcoming = () => "Proximamente";
  const openFirstReel = () => {
    if (activeReels.length > 0) {
      onViewReel(activeReels[0]);
      return;
    }
    onNotify?.("Sin historias", "Todavia no hay historias para mostrar.", "info");
  };

  const promoBanners = [
    {
      id: "brands",
      eyebrow: "En vivo",
      title: "Conoce las marcas de Avellaneda en tiempo real",
      icon: Radio,
      theme: {
        bg: "#c1b5ab",
        edge: "#c1b5ab",
        text: "#2b211b",
        muted: "#5b5148",
        stroke: "rgba(11, 11, 13, 0.6)",
      },
      onClick: () => onSelectBottomNav("live"),
    },
    {
      id: "real",
      eyebrow: "En vivo",
      title: "Vivos reales, sin intermediarios",
      icon: Sparkles,
      theme: {
        bg: "#c1b5ab",
        edge: "#c1b5ab",
        text: "#2b211b",
        muted: "#5b5148",
        stroke: "rgba(11, 11, 13, 0.6)",
      },
      onClick: openFirstReel,
    },
    {
      id: "wholesale",
      eyebrow: "En vivo",
      title: "El mayorista en vivo",
      icon: CalendarCheck,
      theme: {
        bg: "#c1b5ab",
        edge: "#c1b5ab",
        text: "#2b211b",
        muted: "#5b5148",
        stroke: "rgba(11, 11, 13, 0.6)",
      },
      onClick: () => onSelectBottomNav("reminders"),
    },
  ];

  const [promoIndex, setPromoIndex] = useState(0);

  useEffect(() => {
    if (promoBanners.length === 0) return;
    const timer = window.setInterval(() => {
      setPromoIndex((prev) => (prev + 1) % promoBanners.length);
    }, 7000);
    return () => window.clearInterval(timer);
  }, []);

  const promoStrip =
    promoBanners.length > 0 ? (
      <div className={styles.promoStrip} aria-label="Promociones destacadas">
        {(() => {
          const banner = promoBanners[promoIndex % promoBanners.length];
          const Icon = banner.icon;
          return (
            <button
              key={banner.id}
              className={styles.promoBanner}
              style={
                {
                  "--promo-bg": banner.theme.bg,
                  "--promo-edge": banner.theme.edge,
                  "--promo-text": banner.theme.text,
                  "--promo-muted": banner.theme.muted,
                  "--promo-stroke": banner.theme.stroke,
                } as React.CSSProperties
              }
              type="button"
              onClick={banner.onClick}
            >
              <span className={styles.promoIcon}>
                <Icon size={16} />
              </span>
              <div className={styles.promoText}>
                <span className={styles.promoEyebrow}>{banner.eyebrow}</span>
                <span className={styles.promoTitle}>{banner.title}</span>
              </div>
            </button>
          );
        })()}
      </div>
    ) : null;

  const queueSection =
    queueList.length > 0 ? (
      <div className={styles.queueSection} aria-label="En vivo y proximos">
        <div className={styles.queueRow}>
          {queueList.map((stream) => {
            const isLive = stream.status === StreamStatus.LIVE;
            const coverImage = getShopCoverUrl(stream.shop);
            return (
              <button
                key={stream.id}
                className={styles.queueCard}
                onClick={() => setQueueStream(stream)}
              >
                <div
                  className={styles.queueBackdrop}
                  style={{ backgroundImage: `url(${coverImage})` }}
                  aria-hidden="true"
                />
                <div className={styles.queueGlass} aria-hidden="true" />
                <div className={styles.queueContent}>
                  <LogoBubble
                    src={stream.shop.logoUrl}
                    alt={stream.shop.name}
                    size={50}
                    seed={stream.shop.id || stream.shop.name}
                    className={styles.queueLogo}
                  />
                  <span className={styles.queueName}>{stream.shop.name}</span>
                </div>
                {isLive ? (
                  <span className={styles.queueLiveBadge}>
                    <span className={styles.queueLiveText}>EN VIVO</span>
                    <span className={styles.queueLiveDot} />
                  </span>
                ) : (
                  <span className={styles.queueUpcoming}>{formatUpcoming()}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    ) : null;

  const bannerAndQueue = promoStrip || queueSection ? (
    <>
      {promoStrip}
      {queueSection}
    </>
  ) : null;

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
  const desktopPanel = (
    <aside className={styles.desktopPanel} aria-label="Panel lateral de escritorio">
      <div className={styles.panelBrand}>
        <img src={brandLogo} alt="Avellaneda en Vivo" className={styles.panelBrandLogo} />
      </div>
      <div className={styles.panelHeader}>
        <p className={styles.panelLabel}>Panel Desktop</p>
        <span className={styles.panelSmallLabel}>Modo mouse</span>
      </div>
      <div className={styles.panelUser}>
        <span className={styles.panelUserTitle}>
          {user.isLoggedIn ? "Sesion activa" : "Ingresar"}
        </span>
        <span className={styles.panelUserName}>
          {user.isLoggedIn ? user.name || user.email || "Tienda" : "Invitado"}
        </span>
        {user.isLoggedIn ? (
          <button type="button" className={styles.panelAction} onClick={onLogout}>
            Cerrar sesion
          </button>
        ) : (
          <div className={styles.panelAuthButtons}>
            <button type="button" className={styles.panelAction} onClick={onOpenLogin}>
              Ingresar
            </button>
            <button
              type="button"
              className={styles.panelActionSecondary}
              onClick={onOpenLogin}
            >
              Registrarme
            </button>
          </div>
        )}
      </div>
      <nav className={styles.panelNav} aria-label="Navegacion desktop">
        {CLIENT_NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`${styles.panelNavButton} ${
              activeBottomNav === item.id ? styles.panelNavButtonActive : ""
            }`}
            onClick={() => onSelectBottomNav(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <ul className={styles.panelList}>
        {desktopPanelStats.map((item) => (
          <li key={item.label} className={styles.panelItem}>
            <span className={styles.panelValue}>{item.value}</span>
            <span className={styles.panelLabelText}>{item.label}</span>
          </li>
        ))}
      </ul>
      <div className={styles.panelNotice}>
        <strong>{promoHeading}</strong>
        <span>Explora nuevas tiendas y vivos destacados.</span>
      </div>
      <div className={styles.panelTopShops}>
        <span className={styles.panelSubheading}>Top tiendas en vivo</span>
        <div className={styles.panelShopList}>
          {topShopList.map((shop) => (
            <button
              key={shop.id}
              type="button"
              className={styles.panelShopItem}
              onClick={() => onOpenShop(shop)}
            >
              <LogoBubble
                src={shop.logoUrl}
                alt={shop.name}
                size={36}
                seed={shop.id || shop.name}
              />
              <span className={styles.panelShopName}>{shop.name}</span>
            </button>
          ))}
        </div>
      </div>
      <div className={styles.panelMap}>
        <p className={styles.panelMapTitle}>Mapa en vivo</p>
        <p className={styles.panelMapCopy}>
          Descubre tiendas activas y puntos clave dentro de Avellaneda.
        </p>
        {isDesktop ? <ShopMapEmbed /> : null}
      </div>
      {upcomingHero && (
        <div className={styles.panelPromoCard}>
          <p className={styles.panelPromoTitle}>Proximo</p>
          <strong className={styles.panelPromoShop}>{upcomingHero.shop.name}</strong>
          <span className={styles.panelPromoMeta}>
            {upcomingHero.status === StreamStatus.LIVE ? "En vivo ahora" : "Proximo vivo"}
          </span>
        </div>
      )}
      <button
        type="button"
        className={styles.panelButton}
        onClick={() => onSelectBottomNav("live")}
      >
        Ver vivos
      </button>
    </aside>
  );

  const layoutWrapper = (content: React.ReactNode, label: string) => (
    <section className={styles.section} aria-label={label}>
      <div className={styles.layout}>
        {desktopPanel}
        <div className={styles.mainContent}>{content}</div>
      </div>
    </section>
  );

  const loadingContent = layoutWrapper(
    <div className={styles.content}>
      <div className={styles.skeletonWrap}>
        <div className={styles.skeletonRow}>
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={`reel-skel-${index}`} className={styles.skeletonBubble} />
          ))}
        </div>
        <div className={styles.skeletonBanner} />
        <div className={styles.skeletonGrid}>
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={`shop-skel-${index}`} className={styles.skeletonCard} />
          ))}
        </div>
        <div className={styles.skeletonList}>
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={`live-skel-${index}`} className={styles.skeletonStream} />
          ))}
        </div>
      </div>
    </div>,
    "Cargando contenido"
  );

  const loadedContent = layoutWrapper(
    <div className={styles.content}>
      <ReelsStrip
        activeReels={activeReels}
        viewedReels={user.viewedReels}
        onViewReel={onViewReel}
      />

      <HeroSection
        activeFilter={activeFilter}
        onFilterChange={onFilterChange}
        liveStreams={sortedLiveStreams}
        activeReels={activeReels}
        featuredShops={featuredShops}
        onViewReel={onViewReel}
        viewedReels={user.viewedReels}
        onOpenShop={(shop) => onOpenShop(shop, { navigate: false })}
        canClientInteract={canClientInteract}
        onRequireLogin={onOpenLogin}
        queueSlot={bannerAndQueue}
      />

      <div className={styles.schedule}>
        <div className={styles.scheduleHeader}>
          <h2 className={styles.scheduleTitle}>Vivos recientes</h2>
          <div className={styles.scheduleFilter}>
            Mostrando: <span className={styles.filterValue}>{activeFilter}</span>
          </div>
        </div>
        <div className={styles.streamsGrid}>
          {visibleStreams.map((stream, index) => {
            const layout = streamLayout[index] || "small";
            return (
              <div
                key={stream.id}
                className={`${styles.streamItem} ${
                  layout === "wide" ? styles.streamItemWide : ""
                }`}
              >
                <StreamCard
                  stream={stream}
                  user={user}
                  canClientInteract={canClientInteract}
                  onNotify={onNotify}
                  onRequireLogin={onOpenLogin}
                  onOpenShop={() => onOpenShop(stream.shop)}
                  onReport={onReport}
                  onToggleReminder={onToggleReminder}
                  onLike={onLike}
                  onRate={onRate}
                  onDownloadCard={onDownloadCard}
                />
              </div>
            );
          })}
          {visibleStreams.length === 0 && (
            <EmptyState
              title="No hay vivos con este filtro"
              message="Proba ver todos los vivos o revisa mas tarde."
              actionLabel="Ver todos"
              onAction={() => {
                onFilterChange("Todos");
                onSelectBottomNav("home");
              }}
            />
          )}
        </div>
      </div>
    </div>,
    "Contenido principal"
  );

  return isLoading ? loadingContent : loadedContent;
};
