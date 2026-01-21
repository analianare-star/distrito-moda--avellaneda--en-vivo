import React from "react";
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
          {!isLoading && filteredPublicShops.map((shop) => renderShopCard(shop))}
          {!isLoading && filteredPublicShops.length === 0 && (
            <EmptyState
              title="Aǧn no hay tiendas publicadas"
              message="VolvǸ mǭs tarde o refrescǭ la lista."
              actionLabel="Actualizar"
              onAction={onRefreshData}
            />
          )}
        </div>
      </div>
    </section>
  );
};
