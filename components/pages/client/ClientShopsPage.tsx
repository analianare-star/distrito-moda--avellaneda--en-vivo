import React, { useEffect, useMemo, useRef, useState } from "react";
import { EmptyState } from "../../EmptyState";
import { Shop, Stream, UserContext } from "../../../types";
import { ClientDesktopPanel } from "./ClientDesktopPanel";
import panelStyles from "./ClientHomePage.module.css";
import styles from "./ClientShopsPage.module.css";

// ClientShopsPage muestra buscador y listado de tiendas.
// ClientShopsPage renders shop search and list.
interface ClientShopsPageProps {
  isLoading: boolean;
  filteredPublicShops: Shop[];
  renderShopCard: (shop: Shop) => React.ReactNode;
  onRefreshData: () => void;
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

export const ClientShopsPage: React.FC<ClientShopsPageProps> = ({
  isLoading,
  filteredPublicShops,
  renderShopCard,
  onRefreshData,
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
  const PAGE_SIZE = 30;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(min-width: 1024px)");
    const handleChange = () => setIsDesktop(media.matches);
    handleChange();
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filteredPublicShops.length]);

  const visibleShops = useMemo(
    () => filteredPublicShops.slice(0, visibleCount),
    [filteredPublicShops, visibleCount]
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    if (visibleCount >= filteredPublicShops.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        setVisibleCount((prev) =>
          Math.min(prev + PAGE_SIZE, filteredPublicShops.length)
        );
      },
      { rootMargin: "200px 0px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [visibleCount, filteredPublicShops.length]);

  const content = (
    <>
      <div className={styles.listHeader}>
        <h2 className={styles.listTitle}>Tiendas</h2>
        <div className={styles.listCount}>
          {isLoading ? "Cargando..." : `${filteredPublicShops.length} registradas`}
        </div>
      </div>
      <div className={styles.shopsGrid}>
        {isLoading &&
          Array.from({ length: 8 }).map((_, index) => (
            <div key={`shop-skel-${index}`} className={styles.skeletonCard} />
          ))}
        {!isLoading &&
          visibleShops.map((shop) => (
            <div key={shop.id} className={styles.shopCell}>
              {renderShopCard(shop)}
            </div>
          ))}
        {!isLoading && filteredPublicShops.length === 0 && (
          <EmptyState
            title="AÇ§n no hay tiendas publicadas"
            message="VolvÇ¸ mÇ­s tarde o refrescÇ­ la lista."
            actionLabel="Actualizar"
            onAction={onRefreshData}
          />
        )}
      </div>
      {!isLoading && visibleCount < filteredPublicShops.length && (
        <div className={styles.loadMore} ref={sentinelRef}>
          Cargando mas tiendas...
        </div>
      )}
    </>
  );

  if (isDesktop) {
    return (
      <section className={panelStyles.section} aria-label="Listado de tiendas">
        <div className={panelStyles.layout}>
          <ClientDesktopPanel
            brandLogo={brandLogo}
            user={user}
            activeBottomNav={activeBottomNav}
            featuredShops={featuredShops}
            queueStreamsSource={queueStreamsSource}
            onSelectBottomNav={onSelectBottomNav}
            onOpenShop={onOpenShop}
            onOpenLogin={onOpenLogin}
            onLogout={onLogout}
          />
          <div className={panelStyles.mainContent}>
            <div className={styles.listWrap}>{content}</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Listado de tiendas">
      <div className={styles.listWrap}>{content}</div>
    </section>
  );
};
