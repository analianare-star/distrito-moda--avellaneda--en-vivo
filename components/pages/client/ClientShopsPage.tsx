import React, { useEffect, useMemo, useRef, useState } from "react";
import { EmptyState } from "../../EmptyState";
import { Shop } from "../../../types";
import styles from "./ClientShopsPage.module.css";

// ClientShopsPage muestra buscador y listado de tiendas.
// ClientShopsPage renders shop search and list.
interface ClientShopsPageProps {
  isLoading: boolean;
  filteredPublicShops: Shop[];
  renderShopCard: (shop: Shop) => React.ReactNode;
  onRefreshData: () => void;
}

export const ClientShopsPage: React.FC<ClientShopsPageProps> = ({
  isLoading,
  filteredPublicShops,
  renderShopCard,
  onRefreshData,
}) => {
  const PAGE_SIZE = 30;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

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
  return (
    <section aria-label="Listado de tiendas">
      <div className={styles.listWrap}>
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
          {!isLoading && visibleShops.map((shop) => renderShopCard(shop))}
          {!isLoading && filteredPublicShops.length === 0 && (
            <EmptyState
              title="Aǧn no hay tiendas publicadas"
              message="VolvǸ mǭs tarde o refrescǭ la lista."
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
      </div>
    </section>
  );
};
